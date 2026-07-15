import OpenAI from 'openai'
import { defaultOut, readJsonl, valueArg, writeJson, writeJsonl, type AnomalyCase } from './shared'

interface CandidatePair {
  session_id: string
  prompt: string
  chosen: Record<string, unknown>
  rejected: Record<string, unknown>
  reason: string[]
  safety_note: string
}

const args = process.argv.slice(2)
const input = valueArg(args, '--input') ?? defaultOut('anomalies.jsonl')
const output = valueArg(args, '--output') ?? defaultOut('dpo_candidates.jsonl')
const report = valueArg(args, '--report') ?? defaultOut('architect-report.json')
const model = valueArg(args, '--model') ?? process.env.REE_TEACHER_MODEL ?? 'gpt-4o'
const limit = parseInt(valueArg(args, '--limit') ?? '25', 10)
const dryRun = args.includes('--dry-run') || !process.env.OPENAI_API_KEY

function fallbackPair(c: AnomalyCase): CandidatePair {
  const lastUser = [...c.history].reverse().find(m => m.role === 'user')?.content ?? ''
  return {
    session_id: c.session_id,
    prompt: JSON.stringify({ conversation: c.history, lastUser }),
    chosen: {
      type: 'features',
      features: c.extracted_vector,
      note: 'Teacher model not run. Review this anomaly manually before training.',
    },
    rejected: c.extracted_vector,
    reason: c.reason,
    safety_note: 'Candidate generated in dry-run mode. Do not train or promote without clinician and eval review.',
  }
}

async function teacherPair(client: OpenAI, c: AnomalyCase): Promise<CandidatePair> {
  const completion = await client.chat.completions.create({
    model,
    max_tokens: 900,
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: [
          'You create training candidates for a healthcare routing feature extractor.',
          'The routing engine is deterministic; your output never chooses a care level.',
          'Use only facts present in the conversation. Do not invent symptoms.',
          'Return JSON with keys: prompt, chosen, rejected, safety_note.',
          'chosen must be concise extractor JSON. rejected is the original flawed vector.',
        ].join(' '),
      },
      {
        role: 'user',
        content: JSON.stringify({
          session_id: c.session_id,
          anomaly_reason: c.reason,
          conversation_history: c.history,
          original_vector: c.extracted_vector,
          total_turns: c.total_turns,
          final_care_level_label: c.final_care_level_label,
        }),
      },
    ],
  })

  const parsed = JSON.parse(completion.choices[0]?.message?.content ?? '{}')
  return {
    session_id: c.session_id,
    prompt: typeof parsed.prompt === 'string' ? parsed.prompt : JSON.stringify({ conversation: c.history }),
    chosen: typeof parsed.chosen === 'object' && parsed.chosen ? parsed.chosen : {},
    rejected: typeof parsed.rejected === 'object' && parsed.rejected ? parsed.rejected : c.extracted_vector,
    reason: c.reason,
    safety_note: typeof parsed.safety_note === 'string'
      ? parsed.safety_note
      : 'Review candidate before training. Juror gate is required before any model change.',
  }
}

async function main() {
  const anomalies = (await readJsonl<AnomalyCase>(input)).slice(0, limit)
  const client = dryRun ? null : new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 30_000, maxRetries: 0 })
  const pairs: CandidatePair[] = []

  for (const anomaly of anomalies) {
    pairs.push(client ? await teacherPair(client, anomaly) : fallbackPair(anomaly))
  }

  await writeJsonl(output, pairs, true)
  await writeJson(report, {
    input,
    output,
    candidates: pairs.length,
    mode: dryRun ? 'dry_run' : 'teacher_model',
    model: dryRun ? null : model,
    safety: 'Candidates are training inputs only. Juror gate and human review required before promotion.',
  })

  console.log(JSON.stringify({ candidates: pairs.length, output, mode: dryRun ? 'dry_run' : 'teacher_model' }, null, 2))
}

main().catch(err => {
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})
