import { spawnSync } from 'child_process'
import path from 'path'
import { defaultOut, valueArg, writeJson } from './shared'

const args = process.argv.slice(2)
const dataset = valueArg(args, '--dataset')
const output = valueArg(args, '--output') ?? defaultOut('juror-report.json')
const base = valueArg(args, '--base') ?? process.env.TRIAL_BASE_URL ?? 'http://127.0.0.1:3000'
const trialKey = valueArg(args, '--trial-key') ?? process.env.TRIAL_KEY
const skipDataset = args.includes('--skip-dataset')

interface StepResult {
  name: string
  ok: boolean
  status: number | null
  stdout: string
  stderr: string
}

function runStep(
  name: string,
  command: string,
  commandArgs: string[],
  env: Record<string, string | undefined> = {},
  stream = false,
): StepResult {
  const result = spawnSync(command, commandArgs, {
    cwd: process.cwd(),
    env: { ...process.env, ...env },
    encoding: 'utf8',
    stdio: stream ? 'inherit' : 'pipe',
  })
  return {
    name,
    ok: result.status === 0,
    status: result.status,
    stdout: stream ? '' : result.stdout ?? '',
    stderr: stream ? '' : result.stderr ?? '',
  }
}

function parseSummary(file: string): any | null {
  try {
    return require(path.resolve(file))
  } catch {
    return null
  }
}

async function main() {
  const steps: StepResult[] = []

  // Use tsconfig.scripts.json so typecheck covers engine + scripts without requiring Next.js packages
  steps.push(runStep('typecheck', './node_modules/.bin/tsc', ['--noEmit', '--incremental', 'false', '--pretty', 'false', '--project', 'tsconfig.scripts.json']))
  steps.push(runStep('engine_eval', './node_modules/.bin/sucrase-node', ['scripts/eval-engine.ts']))

  let datasetSummary: any | null = null
  let datasetOutput: string | null = null

  if (!skipDataset && dataset) {
    datasetOutput = defaultOut(`juror-dataset-${new Date().toISOString().replace(/[:.]/g, '-')}.jsonl`)
    steps.push(runStep(
      'dataset_multiturn_eval',
      './node_modules/.bin/sucrase-node',
      [
        'scripts/run-clinical-dataset.ts',
        `--input=${dataset}`,
        '--mode=api-multiturn',
        `--base=${base}`,
        `--output=${datasetOutput}`,
      ],
      trialKey ? { TRIAL_KEY: trialKey } : {},
      true,
    ))
    datasetSummary = parseSummary(datasetOutput.replace(/\.jsonl$/, '.summary.json'))
  }

  const failedSteps = steps.filter(s => !s.ok)
  const underCount = Number(datasetSummary?.underTriageCount ?? 0)
  const providerErrors = datasetSummary?.counts?.error ?? 0
  const promotionReady = failedSteps.length === 0 && underCount === 0 && providerErrors === 0

  const report = {
    promotionReady,
    reason: promotionReady
      ? 'All configured gates passed with zero under-triage and zero provider errors.'
      : 'Promotion blocked. Keep current safe baseline.',
    steps: steps.map(s => ({
      name: s.name,
      ok: s.ok,
      status: s.status,
      stdoutTail: s.stdout.slice(-4000),
      stderrTail: s.stderr.slice(-4000),
    })),
    datasetOutput,
    datasetSummary,
    requirements: {
      typecheck: true,
      engineEval: true,
      zeroUnderTriage: true,
      zeroProviderErrors: true,
      humanApprovalStillRequired: true,
    },
  }

  await writeJson(output, report)
  console.log(JSON.stringify({ promotionReady, output, failedSteps: failedSteps.map(s => s.name), datasetSummary }, null, 2))
  if (!promotionReady) process.exit(1)
}

main().catch(err => {
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})
