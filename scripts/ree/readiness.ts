import { existsSync } from 'fs'
import { spawnSync } from 'child_process'
import { defaultOut, valueArg, writeJson } from './shared'

const args = process.argv.slice(2)
const output = valueArg(args, '--output') ?? defaultOut('production-readiness-report.json')
const base = valueArg(args, '--base') ?? process.env.TRIAL_BASE_URL ?? 'http://127.0.0.1:3000'

interface Check {
  name: string
  ok: boolean
  detail: string
}

function run(name: string, command: string, commandArgs: string[]): Check {
  const result = spawnSync(command, commandArgs, { cwd: process.cwd(), encoding: 'utf8' })
  return {
    name,
    ok: result.status === 0,
    detail: (result.status === 0 ? result.stdout : `${result.stdout}\n${result.stderr}`).slice(-3000).trim(),
  }
}

async function httpCheck(name: string, url: string): Promise<Check> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    return { name, ok: res.ok, detail: `${res.status} ${res.statusText}` }
  } catch (err) {
    return { name, ok: false, detail: err instanceof Error ? err.message : String(err) }
  }
}

async function postCheck(name: string, url: string): Promise<Check> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.TRIAL_KEY ? { 'x-trial-key': process.env.TRIAL_KEY } : {}),
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'I have crushing chest pressure and sweating.' }],
        history: {},
        askedTargets: [],
      }),
      signal: AbortSignal.timeout(15_000),
    })
    const data = await res.json().catch(() => ({})) as Record<string, unknown>
    return {
      name,
      ok: res.ok && data?.type === 'emergency',
      detail: JSON.stringify({ status: res.status, type: data?.type }),
    }
  } catch (err) {
    return { name, ok: false, detail: err instanceof Error ? err.message : String(err) }
  }
}

async function main() {
  const checks: Check[] = []

  checks.push({ name: 'migration_present', ok: existsSync('db/migrations/20260709_create_carevo_ree_telemetry.sql'), detail: 'REE telemetry migration exists.' })
  checks.push({ name: 'env_example_present', ok: existsSync('.env.local.example'), detail: '.env.local.example exists.' })
  checks.push(run('typecheck', './node_modules/.bin/tsc', ['--noEmit', '--incremental', 'false', '--pretty', 'false']))
  checks.push(run('engine_eval', './node_modules/.bin/sucrase-node', ['scripts/eval-engine.ts']))
  checks.push(await httpCheck('landing_page', `${base}/landing-v2.html`))
  checks.push(await httpCheck('company_page', `${base}/company`))
  checks.push(await httpCheck('contact_page', `${base}/contact`))
  checks.push(await httpCheck('triage_page', `${base}/triage`))
  checks.push(await postCheck('emergency_hard_stop_api', `${base}/api/triage`))

  const envWarnings = [
    process.env.REE_TELEMETRY_ENABLED === '1' && !process.env.REE_TELEMETRY_ENDPOINT
      ? 'REE telemetry is enabled but REE_TELEMETRY_ENDPOINT is missing.'
      : null,
    process.env.NODE_ENV === 'production' && !process.env.METRICS_KEY
      ? 'METRICS_KEY should be set in production.'
      : null,
    !process.env.OPENAI_API_KEY && !process.env.NVIDIA_API_KEY && !process.env.GITHUB_TOKEN
      ? 'No LLM provider key found in this process.'
      : null,
  ].filter(Boolean)

  const envReady = process.env.NODE_ENV === 'production' ? envWarnings.length === 0 : true
  const ok = checks.every(c => c.ok) && envReady
  const report = {
    ok,
    generatedAt: new Date().toISOString(),
    base,
    checks,
    envWarnings,
    envReady,
    manualLaunchRequirements: [
      'Apply the REE PostgreSQL migration in staging and production.',
      'Set REE_TELEMETRY_ENABLED=1 only after REE_TELEMETRY_ENDPOINT writes to encrypted PostgreSQL.',
      'Run the full dataset juror gate with a healthy LLM provider before launch.',
      'Keep model promotion manual.',
    ],
  }

  await writeJson(output, report)
  console.log(JSON.stringify({ ok, output, failed: checks.filter(c => !c.ok).map(c => c.name), envWarnings }, null, 2))
  if (!ok) process.exit(1)
}

main().catch(err => {
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})
