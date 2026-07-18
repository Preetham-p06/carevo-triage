import { promises as fs } from 'fs'
import path from 'path'

type Tier = 'em' | 'ne' | 'sc'

interface HarnessRow {
  id?: string
  expected?: string
  predicted?: string
  verdict?: string
  sourceLevel?: string
  sourceLabel?: string
  text?: string
  turns?: Array<{ question?: string; askedFor?: string; answer?: string; source?: string }>
  finalResponse?: {
    factors?: string[]
    rulesFired?: string[]
    careLevel?: string
    type?: string
  }
}

interface RunMetrics {
  file: string
  total: number
  scored: number
  accuracy: number
  em: number
  ne: number
  sc: number
  safety_of_advice: number
  overtriage: number
  incorrect: number
  overCount: number
  underCount: number
}

interface UnderRow {
  file: string
  id: string
  trueTier: Tier
  predictedTier: Tier | 'unscored'
  predicted: string
  sourceLabel: string
  text: string
  factors: string[]
  rulesFired: string[]
  turns: HarnessRow['turns']
}

const ORDER: Record<Tier, number> = { sc: 1, ne: 2, em: 3 }
const TIERS: Tier[] = ['em', 'ne', 'sc']

const args = process.argv.slice(2)
const runFiles = splitList(valueArg('--runs'))
const patientVoiceFiles = splitList(valueArg('--patient-voice'))
const out = valueArg('--out')

if (!runFiles.length && !patientVoiceFiles.length) {
  console.error([
    'Usage:',
    '  sucrase-node scripts/score-semigran.ts --runs=file1.jsonl,file2.jsonl [--patient-voice=a.jsonl,b.jsonl] [--out=report.json]',
  ].join('\n'))
  process.exit(2)
}

function valueArg(name: string): string | undefined {
  const exact = args.indexOf(name)
  if (exact !== -1) return args[exact + 1]
  return args.find(a => a.startsWith(`${name}=`))?.slice(name.length + 1)
}

function splitList(value?: string): string[] {
  return (value ?? '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
}

async function readJsonl(file: string): Promise<HarnessRow[]> {
  const raw = await fs.readFile(file, 'utf8')
  return raw.split(/\r?\n/).filter(Boolean).map(line => JSON.parse(line))
}

function trueTier(row: HarnessRow): Tier {
  const source = String(row.sourceLevel ?? '').toLowerCase()
  if (source === 'em' || source === 'ne' || source === 'sc') return source
  return careLevelToTier(String(row.expected ?? ''))
}

function careLevelToTier(level: string): Tier {
  switch (level) {
    case 'emergency':
    case 'er':
      return 'em'
    case 'urgent_care':
    case 'primary_care':
    case 'telehealth':
      return 'ne'
    case 'home_care':
      return 'sc'
    default:
      throw new Error(`Cannot map care level "${level}" to Semigran tier`)
  }
}

function predictedTier(row: HarnessRow): Tier | 'unscored' {
  const predicted = String(row.predicted ?? '')
  if (predicted === 'error' || predicted === 'needs_more_info' || !predicted) return 'unscored'
  try {
    return careLevelToTier(predicted)
  } catch {
    return 'unscored'
  }
}

function pct(num: number, den: number): number {
  return den ? (num / den) * 100 : 0
}

function scoreRun(file: string, rows: HarnessRow[]): { metrics: RunMetrics; under: UnderRow[] } {
  const scored = rows
    .map(row => ({ row, trueTier: trueTier(row), predictedTier: predictedTier(row) }))
    .filter(item => item.predictedTier !== 'unscored')

  const under: UnderRow[] = []
  let exact = 0
  let safe = 0
  let overCount = 0
  const exactByTier: Record<Tier, number> = { em: 0, ne: 0, sc: 0 }
  const totalByTier: Record<Tier, number> = { em: 0, ne: 0, sc: 0 }

  for (const item of scored) {
    const pred = item.predictedTier as Tier
    const truth = item.trueTier
    totalByTier[truth]++
    if (pred === truth) {
      exact++
      exactByTier[truth]++
    }
    if (ORDER[pred] >= ORDER[truth]) safe++
    if (ORDER[pred] > ORDER[truth] && pred !== truth) overCount++
    if (ORDER[pred] < ORDER[truth]) {
      under.push({
        file,
        id: item.row.id ?? 'unknown',
        trueTier: truth,
        predictedTier: pred,
        predicted: String(item.row.predicted ?? ''),
        sourceLabel: item.row.sourceLabel ?? '',
        text: item.row.text ?? '',
        factors: item.row.finalResponse?.factors ?? [],
        rulesFired: item.row.finalResponse?.rulesFired ?? [],
        turns: item.row.turns ?? [],
      })
    }
  }

  const incorrect = scored.length - exact
  return {
    metrics: {
      file,
      total: rows.length,
      scored: scored.length,
      accuracy: pct(exact, scored.length),
      em: pct(exactByTier.em, totalByTier.em),
      ne: pct(exactByTier.ne, totalByTier.ne),
      sc: pct(exactByTier.sc, totalByTier.sc),
      safety_of_advice: pct(safe, scored.length),
      overtriage: pct(overCount, incorrect),
      incorrect,
      overCount,
      underCount: under.length,
    },
    under,
  }
}

function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function std(values: number[]): number {
  if (values.length <= 1) return 0
  const m = mean(values)
  return Math.sqrt(values.reduce((sum, value) => sum + (value - m) ** 2, 0) / values.length)
}

function fmt(value: number): string {
  const rounded = Math.round(value * 10) / 10
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}

function meanStd(metrics: RunMetrics[], key: keyof RunMetrics): string {
  const values = metrics.map(m => Number(m[key]))
  return `${fmt(mean(values))} (${fmt(std(values))})`
}

function tableRow(label: string, metrics: RunMetrics[]): string {
  return [
    label,
    meanStd(metrics, 'accuracy'),
    meanStd(metrics, 'em'),
    meanStd(metrics, 'ne'),
    meanStd(metrics, 'sc'),
    meanStd(metrics, 'safety_of_advice'),
    meanStd(metrics, 'overtriage'),
  ].join(' | ')
}

async function scoreGroup(label: string, files: string[]) {
  const scored = []
  const allUnder: UnderRow[] = []
  for (const file of files) {
    const rows = await readJsonl(file)
    const result = scoreRun(file, rows)
    scored.push(result.metrics)
    allUnder.push(...result.under)
  }
  return { label, metrics: scored, under: allUnder }
}

async function main() {
  const groups = []
  if (runFiles.length) groups.push(await scoreGroup('Carevo canonical', runFiles))
  if (patientVoiceFiles.length) groups.push(await scoreGroup('Carevo patient-voice', patientVoiceFiles))

  const lines: string[] = []
  lines.push('| system | accuracy | em | ne | sc | safety_of_advice | overtriage |')
  lines.push('|---|---:|---:|---:|---:|---:|---:|')
  for (const group of groups) lines.push(`| ${tableRow(group.label, group.metrics)} |`)
  lines.push('')
  lines.push('Per-run detail:')
  for (const group of groups) {
    lines.push(`\n${group.label}`)
    for (const m of group.metrics) {
      lines.push(`- ${path.basename(m.file)}: accuracy ${fmt(m.accuracy)}%, em ${fmt(m.em)}%, ne ${fmt(m.ne)}%, sc ${fmt(m.sc)}%, safety ${fmt(m.safety_of_advice)}%, overtriage ${fmt(m.overtriage)}%, under ${m.underCount}, scored ${m.scored}/${m.total}`)
    }
  }

  const allUnder = groups.flatMap(group => group.under)
  lines.push('')
  lines.push(`Under-triage rows: ${allUnder.length}`)
  for (const item of allUnder) {
    lines.push(`- ${path.basename(item.file)} ${item.id}: true=${item.trueTier}, predicted=${item.predictedTier} (${item.predicted}), label=${item.sourceLabel}`)
    lines.push(`  factors=${JSON.stringify(item.factors)} rules=${JSON.stringify(item.rulesFired)}`)
    lines.push(`  text=${item.text.replace(/\s+/g, ' ').slice(0, 700)}`)
  }

  const report = {
    generatedAt: new Date().toISOString(),
    groups,
    table: lines.slice(0, groups.length + 2).join('\n'),
    under: allUnder,
  }

  if (out) {
    await fs.mkdir(path.dirname(out), { recursive: true })
    await fs.writeFile(out, JSON.stringify(report, null, 2) + '\n')
  }

  console.log(lines.join('\n'))
}

main().catch(err => {
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})
