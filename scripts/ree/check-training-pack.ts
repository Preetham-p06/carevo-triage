import path from 'path'
import { promises as fs } from 'fs'
import { readJsonl, valueArg, writeJson } from './shared'

interface Manifest {
  rows: number
  trainRows: number
  holdoutRows: number
  minRowsForRealTraining: number
  readyForSmokeDryRun: boolean
  readyForRealTraining: boolean
  trainingAllowed: boolean
  files: Record<string, string>
}

interface PreferenceRow {
  id: string
  prompt: string
  chosen: string
  rejected: string
}

const args = process.argv.slice(2)
const packDir = valueArg(args, '--pack-dir') ?? path.join(process.cwd(), 'data', 'recursive-learning', 'offline-training-pack-approved-high-priority')
const report = valueArg(args, '--report') ?? path.join(packDir, 'pack-check-report.json')

async function exists(file: string): Promise<boolean> {
  try {
    await fs.access(file)
    return true
  } catch {
    return false
  }
}

function rowHasRequiredShape(row: PreferenceRow): boolean {
  return Boolean(row.id && row.prompt && row.chosen && row.rejected)
}

async function main() {
  const manifestPath = path.join(packDir, 'manifest.json')
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8')) as Manifest
  const requiredFiles = [
    manifest.files.preferenceTrain,
    manifest.files.preferenceHoldout,
    manifest.files.sftSmokeTrain,
    manifest.files.sftSmokeHoldout,
    manifest.files.readme,
  ].map(file => path.join(packDir, file))

  const missingFiles: string[] = []
  for (const file of requiredFiles) {
    if (!(await exists(file))) missingFiles.push(file)
  }

  const train = await readJsonl<PreferenceRow>(path.join(packDir, manifest.files.preferenceTrain))
  const holdout = await readJsonl<PreferenceRow>(path.join(packDir, manifest.files.preferenceHoldout))
  const malformed = [...train, ...holdout].filter(row => !rowHasRequiredShape(row)).map(row => row.id ?? 'unknown')
  const realTrainingBlockedCorrectly = manifest.rows < manifest.minRowsForRealTraining
    ? manifest.readyForRealTraining === false && manifest.trainingAllowed === false
    : manifest.trainingAllowed === false

  const ok = missingFiles.length === 0 &&
    malformed.length === 0 &&
    train.length === manifest.trainRows &&
    holdout.length === manifest.holdoutRows &&
    realTrainingBlockedCorrectly

  const result = {
    ok,
    packDir,
    rows: manifest.rows,
    trainRows: train.length,
    holdoutRows: holdout.length,
    missingFiles,
    malformed,
    readyForSmokeDryRun: manifest.readyForSmokeDryRun,
    readyForRealTraining: manifest.readyForRealTraining,
    trainingAllowed: manifest.trainingAllowed,
    realTrainingBlockedCorrectly,
  }
  await writeJson(report, result)
  console.log(JSON.stringify(result, null, 2))
  if (!ok) process.exit(1)
}

main().catch(err => {
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})
