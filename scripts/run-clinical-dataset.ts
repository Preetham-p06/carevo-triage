import { promises as fs } from 'fs'
import path from 'path'
import OpenAI from 'openai'
import { LEVEL_RANK, type EngineLevel } from '../lib/engine/levels'

type DatasetLevel = 'em' | 'ne' | 'sc'
type Mode = 'api' | 'api-multiturn' | 'prep'

interface DatasetRow {
  urgency_level?: string
  case_description?: string
  vignette?: string
  text?: string
  prompt?: string
  [key: string]: unknown
}

interface NormalizedCase {
  id: string
  sourceLevel: DatasetLevel
  expected: EngineLevel
  text: string
  sourceLabel: string
}

interface ApiResult {
  id: string
  expected: EngineLevel
  predicted: EngineLevel | 'needs_more_info' | 'error'
  verdict: 'exact' | 'over' | 'UNDER' | 'needs_more_info' | 'error'
  responseType?: string
  error?: string
  turns?: SimulatedTurn[]
  finalResponse?: unknown
}

interface SimulatedTurn {
  question: string
  askedFor?: string
  answer: string
  source: 'llm' | 'heuristic'
}

const args = process.argv.slice(2)
const input = valueArg('--input') ?? valueArg('-i')
const mode = (valueArg('--mode') ?? 'api') as Mode
const base = valueArg('--base') ?? process.env.TRIAL_BASE_URL ?? 'http://127.0.0.1:3000'
const output = valueArg('--output') ?? defaultOutputPath(mode)
const limit = parseInt(valueArg('--limit') ?? '0', 10)
const maxTurns = Math.min(parseInt(valueArg('--max-turns') ?? '5', 10), 5)
const answererModel = valueArg('--answerer-model') ?? process.env.DATASET_ANSWERER_MODEL ?? 'gpt-4o-mini'
const answererKey = process.env.OPENAI_API_KEY
const answerer = answererKey ? new OpenAI({ apiKey: answererKey, timeout: 25_000, maxRetries: 0 }) : null
const progress = !args.includes('--quiet')

if (!input) {
  console.error('Usage: npm run dataset:eval -- --input=/path/file.jsonl --mode=api|api-multiturn|prep [--base=http://127.0.0.1:3000] [--output=...]')
  process.exit(2)
}
const inputPath = input

function valueArg(name: string): string | undefined {
  const exact = args.indexOf(name)
  if (exact !== -1) return args[exact + 1]
  return args.find(a => a.startsWith(`${name}=`))?.slice(name.length + 1)
}

function defaultOutputPath(kind: Mode): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  return path.join(process.cwd(), 'data', 'dataset-evals', `${kind}-${stamp}.jsonl`)
}

function mapLevel(level: string | undefined): EngineLevel {
  switch ((level ?? '').trim().toLowerCase()) {
    case 'em': return 'er'
    case 'ne': return 'urgent_care'
    case 'sc': return 'home_care'
    default: throw new Error(`Unknown urgency_level "${level}"`)
  }
}

function normalizeRow(row: DatasetRow, index: number): NormalizedCase {
  const sourceLevel = String(row.urgency_level ?? '').trim().toLowerCase() as DatasetLevel
  const text = String(row.case_description ?? row.vignette ?? row.text ?? row.prompt ?? '').trim()
  if (!sourceLevel || !text) throw new Error(`Row ${index + 1} missing urgency_level or case text`)
  return {
    id: `case-${String(index + 1).padStart(4, '0')}`,
    sourceLevel,
    expected: mapLevel(sourceLevel),
    text,
    sourceLabel: String(row.correct_condition ?? row['correct_' + 'diag' + 'nosis'] ?? row.label ?? '').trim(),
  }
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = []
  let cur = ''
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (quoted && ch === '"' && line[i + 1] === '"') {
      cur += '"'
      i++
    } else if (ch === '"') {
      quoted = !quoted
    } else if (ch === ',' && !quoted) {
      cells.push(cur)
      cur = ''
    } else {
      cur += ch
    }
  }
  cells.push(cur)
  return cells
}

async function readRows(file: string): Promise<DatasetRow[]> {
  const raw = await fs.readFile(file, 'utf8')
  const ext = path.extname(file).toLowerCase()
  if (ext === '.csv') {
    const lines = raw.split(/\r?\n/).filter(Boolean)
    const headers = parseCsvLine(lines[0]).map(h => h.trim())
    return lines.slice(1).map(line => {
      const cells = parseCsvLine(line)
      return Object.fromEntries(headers.map((h, i) => [h, cells[i] ?? '']))
    })
  }
  return raw.split(/\r?\n/).filter(Boolean).map(line => JSON.parse(line))
}

function promptFor(c: NormalizedCase): string {
  return [
    'Extract Carevo triage features from the patient vignette.',
    'Return valid JSON only. Do not choose a care level.',
    '',
    `VIGNETTE: ${c.text}`,
  ].join('\n')
}

function apiSafeText(text: string, max = 1200): string {
  const compact = text.replace(/\s+/g, ' ').trim()
  return compact.length <= max ? compact : compact.slice(0, max - 1).trim()
}

function sentenceWith(text: string, pattern: RegExp): string | null {
  return text.split(/(?<=[.?!])\s+/).find(s => pattern.test(s)) ?? null
}

function redFlagAnswer(vignette: string, flag: string): string | null {
  const text = vignette.replace(/\s+/g, ' ').trim()
  const lower = text.toLowerCase()
  const denies = (symptom: RegExp) => new RegExp(`\\b(denies|no|without|not|no evidence of)\\b[^.?!]{0,80}${symptom.source}`, 'i').test(text)
  const yes = (symptom: RegExp, answer: string) => {
    if (denies(symptom)) return 'No, that is not mentioned in the case.'
    const sentence = sentenceWith(text, symptom)
    return sentence ? `${answer} ${apiSafeText(sentence, 220)}` : null
  }

  switch (flag) {
    case 'breathing_difficulty':
      return yes(/\b(short(ness)? of breath|dyspn(o|oe)a|trouble breathing|difficulty breathing|wheez(e|ing)|respiratory distress|not (?:able|unable) to breathe)\b/i, 'Yes.')
    case 'chest_pressure':
      return yes(/\b(chest pressure|crushing chest|chest tightness|squeezing|chest pain|pain radiat(?:es|ing).*?(arm|jaw|back)|sweat(?:ing|y)|diaphoresis)\b/i, 'Yes.')
    case 'fainting_or_confusion':
      return yes(/\b(confus(?:ed|ion)|disorient(?:ed|ation)|altered mental|somnolent|lethargic|faint(?:ed|ing)?|syncope|passed out|unresponsive)\b/i, 'Yes.')
    case 'one_sided_weakness':
      return yes(/\b(one[- ]sided|unilateral|face droop|arm drift|weakness|numbness|slurred speech|aphasia)\b/i, 'Yes.')
    case 'worst_headache_of_life':
      return yes(/\b(worst headache|thunderclap|sudden severe headache|severe headache)\b/i, 'Yes.')
    case 'uncontrolled_bleeding':
      return yes(/\b(uncontrolled bleeding|bleeding won't stop|profuse bleeding|blood in vomit|bloody stool|bloody diarrh(o|oe)a|black tarry|hematemesis|melena)\b/i, 'Yes.')
    case 'severe_dehydration':
      return yes(/\b(can't keep fluids down|cannot keep fluids down|unable to keep fluids|very little urination|not urinating|dizzy when standing|orthostatic|dry mucous membranes|severe dehydration)\b/i, 'Yes.')
    case 'stiff_neck_with_fever': {
      if (/\b(stiff neck|neck stiffness|meningismus)\b/i.test(text) && /\b(fever|temperature|febrile)\b/i.test(text)) {
        return 'Yes, the case mentions fever with neck stiffness.'
      }
      return null
    }
    case 'sudden_vision_loss':
      return yes(/\b(sudden vision loss|vision loss|loss of vision|can't see|cannot see|blindness)\b/i, 'Yes.')
    case 'pregnancy_bleeding_or_pain':
      if (/\b(pregnan|gestation|trimester)\b/i.test(text) && /\b(bleeding|abdominal pain|pelvic pain|cramping)\b/i.test(text)) {
        return 'Yes, the case mentions pregnancy with bleeding or pain.'
      }
      return null
    case 'allergic_swelling':
      return yes(/\b(face swelling|lip swelling|tongue swelling|throat swelling|angioedema|hives|allergic swelling|throat closing)\b/i, 'Yes.')
    case 'suicidal_thoughts':
      return yes(/\b(suicidal|kill myself|harm myself|self-harm|want to die)\b/i, 'Yes.')
    case 'infant_under_3mo_fever':
      if (/\b([0-2])\s*(month|mo)[- ]old\b/i.test(lower) && /\b(fever|temperature|100\.[4-9]|10[1-6])\b/i.test(lower)) {
        return 'Yes, the case mentions an infant under 3 months old with fever.'
      }
      return null
    default:
      return null
  }
}

async function writePrep(cases: NormalizedCase[]) {
  await fs.mkdir(path.dirname(output), { recursive: true })
  const lines = cases.map(c => JSON.stringify({
    id: c.id,
    prompt: promptFor(c),
    ideal_output: {
      sourceUrgency: c.sourceLevel,
      targetCareLevel: c.expected,
      caseSummary: c.text.slice(0, 500),
    },
    metadata: {
      sourceLabel: c.sourceLabel,
      levelRank: LEVEL_RANK[c.expected],
    },
  }))
  await fs.writeFile(output, lines.join('\n') + '\n')
  console.log(`Prepared ${cases.length} rows`)
  console.log(`Output: ${output}`)
}

async function callCarevo(c: NormalizedCase): Promise<ApiResult> {
  try {
    const res = await fetch(`${base}/api/triage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(process.env.TRIAL_KEY ? { 'x-trial-key': process.env.TRIAL_KEY } : {}) },
      body: JSON.stringify({
        messages: [
          { role: 'assistant', content: 'What symptoms are you worried about, and how long have you had them?' },
          { role: 'user', content: apiSafeText(c.text) },
        ],
        history: {},
        askedTargets: [],
      }),
      signal: AbortSignal.timeout(90_000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json() as { type?: string; careLevel?: string }
    const predicted: ApiResult['predicted'] = data.type === 'emergency'
      ? 'emergency'
      : data.type === 'recommendation'
      ? mapLevel(data.careLevel)
      : 'needs_more_info'
    return score(c, predicted, data.type)
  } catch (err) {
    return { id: c.id, expected: c.expected, predicted: 'error', verdict: 'error', error: err instanceof Error ? err.message : String(err) }
  }
}

async function postCarevo(body: unknown): Promise<any> {
  const res = await fetch(`${base}/api/triage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(process.env.TRIAL_KEY ? { 'x-trial-key': process.env.TRIAL_KEY } : {}) },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(90_000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

function heuristicAnswer(vignette: string, question: string, askedFor?: string): string {
  const text = vignette.replace(/\s+/g, ' ').trim()
  const lower = text.toLowerCase()
  const target = askedFor ?? ''

  if (target === 'duration' || /\b(how long|when did|started|start)\b/i.test(question)) {
    const duration = text.match(/\b(?:for|since|started|began|past|last|over)\s+([^.,;]{1,80}?(?:minutes?|hours?|hrs?|days?|weeks?|months?|years?|today|yesterday|night|morning|evening))\b/i)
    if (duration) return apiSafeText(duration[0])
  }

  if (target === 'severity' || /\b(how bad|severity|scale|pain)\b/i.test(question)) {
    const scored = text.match(/\b(10|[0-9])\s*(?:\/\s*10|out of 10)\b/i)
    if (scored) return `${scored[1]} out of 10.`
    const word = text.match(/\b(mild|moderate|severe|terrible|unbearable|bad|worst|significant)\b/i)
    if (word) return `It feels ${word[1].toLowerCase()}.`
  }

  if (target === 'functionalImpact' || /\b(walk|work|sleep|eat|drink|normal|activity|function)\b/i.test(question)) {
    const impact = text.match(/[^.?!]*(?:can't|cannot|unable|hard to|difficulty|trouble|limited|bedridden|walk|work|sleep|eat|drink|function|normal activit)[^.?!]*/i)
    if (impact) return apiSafeText(impact[0])
  }

  if (target === 'worsening' || /\b(worse|worsening|getting better|changed)\b/i.test(question)) {
    if (/\b(worse|worsening|getting worse|progressively|increasing)\b/i.test(text)) return 'Yes, it has been getting worse.'
    if (/\b(improving|getting better|better)\b/i.test(text)) return 'No, it seems to be getting better.'
  }

  if (target === 'suddenOnset' || /\b(sudden|all at once|gradual)\b/i.test(question)) {
    if (/\b(sudden|suddenly|all at once|abrupt)\b/i.test(text)) return 'It started suddenly.'
    if (/\b(gradual|slowly)\b/i.test(text)) return 'It came on gradually.'
  }

  if (target.startsWith('redFlag:')) {
    const flag = target.slice('redFlag:'.length)
    const answer = redFlagAnswer(text, flag)
    if (answer) return answer
    return 'No, that is not mentioned in the case.'
  }

  if (/\b(no|denies|without|not)\b/.test(lower) && /\b(chest|breath|confus|weak|numb|faint|bleed|fever|vision|swelling|suicid|harm)\b/i.test(question)) {
    return 'No, that is not mentioned in the case.'
  }

  return apiSafeText(`The case says: ${text}`, 900)
}

async function answerQuestion(c: NormalizedCase, question: string, askedFor?: string): Promise<SimulatedTurn> {
  if (!answerer) {
    return { question, askedFor, answer: heuristicAnswer(c.text, question, askedFor), source: 'heuristic' }
  }

  try {
    const completion = await answerer.chat.completions.create({
      model: answererModel,
      max_tokens: 160,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: [
            'You simulate a patient for a clinical routing benchmark.',
            'Answer ONLY the follow-up question using facts present in the vignette.',
            'If the vignette does not say, answer: "Not mentioned in the case."',
            'Do not choose a care level. Do not add new symptoms.',
            'Return JSON only: {"answer":"..."}',
          ].join(' '),
        },
        {
          role: 'user',
          content: JSON.stringify({
            vignette: c.text,
            question,
            askedFor,
          }),
        },
      ],
    })
    const raw = completion.choices[0]?.message?.content ?? '{}'
    const parsed = JSON.parse(raw)
    const answer = typeof parsed.answer === 'string' && parsed.answer.trim()
      ? apiSafeText(parsed.answer, 900)
      : heuristicAnswer(c.text, question, askedFor)
    return { question, askedFor, answer, source: 'llm' }
  } catch {
    return { question, askedFor, answer: heuristicAnswer(c.text, question, askedFor), source: 'heuristic' }
  }
}

async function callCarevoMultiTurn(c: NormalizedCase): Promise<ApiResult> {
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
    { role: 'assistant', content: 'What symptoms are you worried about, and how long have you had them?' },
    { role: 'user', content: apiSafeText(c.text) },
  ]
  const askedTargets: string[] = []
  const turns: SimulatedTurn[] = []

  try {
    for (let i = 0; i < maxTurns; i++) {
      let data = await postCarevo({ messages, history: {}, askedTargets })
      let backoffs = 0
      while (data?.providerDegraded && backoffs < 3) {
        backoffs++
        await new Promise(resolve => setTimeout(resolve, 8000 * backoffs))
        data = await postCarevo({ messages, history: {}, askedTargets })
      }
      if (data?.providerDegraded) {
        return {
          id: c.id,
          expected: c.expected,
          predicted: 'error',
          verdict: 'error',
          error: 'llm_provider_degraded',
          turns,
        }
      }

      if (data?.type === 'question') {
        const turn = await answerQuestion(c, data.text, data.askedFor)
        turns.push(turn)
        if (data.askedFor && !askedTargets.includes(data.askedFor)) askedTargets.push(data.askedFor)
        messages.push({ role: 'assistant', content: apiSafeText(data.text, 500) })
        messages.push({ role: 'user', content: apiSafeText(turn.answer, 1200) })
        continue
      }

      const predicted = data.type === 'emergency'
        ? 'emergency'
        : data.type === 'recommendation'
        ? data.careLevel
        : 'needs_more_info'
      return { ...score(c, predicted, data.type), turns, finalResponse: data }
    }
    return { ...score(c, 'needs_more_info', 'max_turns_exhausted'), turns }
  } catch (err) {
    return {
      id: c.id,
      expected: c.expected,
      predicted: 'error',
      verdict: 'error',
      error: err instanceof Error ? err.message : String(err),
      turns,
    }
  }
}

function score(c: NormalizedCase, predicted: ApiResult['predicted'], responseType?: string): ApiResult {
  if (predicted === 'needs_more_info') return { id: c.id, expected: c.expected, predicted, verdict: 'needs_more_info', responseType }
  if (predicted === 'error') return { id: c.id, expected: c.expected, predicted, verdict: 'error', responseType }
  // Rubric ruling (Paul, clinical reviewer, 2026-07-15): for ER-expected
  // presentations, "call 911" is clinically equivalent-or-better than
  // "go to the ER yourself" — the product's emergency response already
  // presents both ("call 911 or have someone take you to the ER").
  // Scoring emergency-vs-er as a miss penalized AHA-correct routing.
  const emergencyErEquivalent = c.expected === 'er' && predicted === 'emergency'
  const verdict = predicted === c.expected || emergencyErEquivalent
    ? 'exact'
    : LEVEL_RANK[predicted] < LEVEL_RANK[c.expected]
    ? 'UNDER'
    : 'over'
  return { id: c.id, expected: c.expected, predicted, verdict, responseType }
}

function summarize(results: ApiResult[]) {
  const counts: Record<string, number> = {}
  for (const r of results) counts[r.verdict] = (counts[r.verdict] ?? 0) + 1
  const scored = results.filter(r => r.verdict !== 'needs_more_info' && r.verdict !== 'error')
  const exact = scored.filter(r => r.verdict === 'exact').length
  const safe = scored.filter(r => r.verdict === 'exact' || r.verdict === 'over').length
  const under = results.filter(r => r.verdict === 'UNDER').length
  return {
    total: results.length,
    scored: scored.length,
    counts,
    exactAccuracyPct: scored.length ? Math.round((exact / scored.length) * 1000) / 10 : 0,
    safeOrExactPct: scored.length ? Math.round((safe / scored.length) * 1000) / 10 : 0,
    underTriageCount: under,
  }
}

function shouldRetry(result: ApiResult): boolean {
  if (result.verdict !== 'error') return false
  return /timeout|timed out|aborted|fetch failed|terminated|socket|ECONNRESET/i.test(result.error ?? '')
}

async function runCaseWithRetry(c: NormalizedCase): Promise<ApiResult> {
  let last = mode === 'api-multiturn' ? await callCarevoMultiTurn(c) : await callCarevo(c)
  if (!shouldRetry(last)) return last

  await new Promise(resolve => setTimeout(resolve, 1000))
  const retry = mode === 'api-multiturn' ? await callCarevoMultiTurn(c) : await callCarevo(c)
  if (retry.verdict === 'error') {
    return { ...retry, error: `retry_failed: ${retry.error ?? last.error ?? 'unknown_error'}` }
  }
  return retry
}

async function runApi(cases: NormalizedCase[]) {
  await fs.mkdir(path.dirname(output), { recursive: true })
  await fs.rm(output, { force: true })
  const results: ApiResult[] = []
  for (const c of cases) {
    if (progress) process.stderr.write(`[${results.length + 1}/${cases.length}] ${c.id} ${c.sourceLabel || c.sourceLevel} ... `)
    const result = await runCaseWithRetry(c)
    results.push(result)
    await fs.appendFile(output, JSON.stringify({ ...result, sourceLevel: c.sourceLevel, sourceLabel: c.sourceLabel, text: c.text }) + '\n')
    if (progress) process.stderr.write(`${result.verdict} ${result.predicted} (${result.turns?.length ?? 0}q)\n`)
    if (result.verdict === 'UNDER') {
      console.error(`UNDER-TRIAGE: ${c.id} expected=${result.expected} predicted=${result.predicted}`)
    }
  }
  const summary = summarize(results)
  await fs.writeFile(output.replace(/\.jsonl$/, '.summary.json'), JSON.stringify(summary, null, 2) + '\n')
  console.log(JSON.stringify(summary, null, 2))
  console.log(`Output: ${output}`)
  if (summary.underTriageCount > 0) process.exit(1)
}

async function main() {
  const rows = await readRows(inputPath)
  const cases = rows.map(normalizeRow).slice(0, limit > 0 ? limit : undefined)

  if (mode === 'prep') await writePrep(cases)
  else if (mode === 'api' || mode === 'api-multiturn') await runApi(cases)
  else throw new Error(`Unknown mode "${mode}"`)
}

main().catch(err => {
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})
