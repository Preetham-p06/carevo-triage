import { defaultOut, fetchTelemetryFromPostgres, isolate, readJsonl, valueArg, writeJson, writeJsonl, type TelemetryRecord } from './shared'

const args = process.argv.slice(2)
const input = valueArg(args, '--input')
const output = valueArg(args, '--output') ?? defaultOut('anomalies.jsonl')
const report = valueArg(args, '--report') ?? defaultOut('coroner-report.json')
const limit = parseInt(valueArg(args, '--limit') ?? '50', 10)
const databaseUrl = valueArg(args, '--database-url') ?? process.env.DATABASE_URL

async function main() {
  let rows: TelemetryRecord[]
  let source: string

  if (input) {
    rows = await readJsonl<TelemetryRecord>(input)
    source = input
  } else if (databaseUrl) {
    rows = fetchTelemetryFromPostgres(databaseUrl, limit)
    source = 'postgres:carevo_ree_telemetry'
  } else {
    throw new Error('Provide --input=telemetry.jsonl or set DATABASE_URL for PostgreSQL.')
  }

  const anomalies = rows.map(isolate).filter((row): row is NonNullable<typeof row> => !!row).slice(0, limit)
  await writeJsonl(output, anomalies)
  await writeJson(report, {
    source,
    scanned: rows.length,
    anomalies: anomalies.length,
    tooManyTurns: anomalies.filter(a => a.reason.includes('too_many_turns')).length,
    overTriageReview: anomalies.filter(a => a.reason.includes('over_triage_review')).length,
    output,
  })

  console.log(JSON.stringify({ source, scanned: rows.length, anomalies: anomalies.length, output }, null, 2))
}

main().catch(err => {
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})
