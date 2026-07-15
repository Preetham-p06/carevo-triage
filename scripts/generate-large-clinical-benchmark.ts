import { promises as fs } from 'fs'
import path from 'path'

type Level = 'em' | 'ne' | 'sc'

interface Template {
  level: Level
  label: string
  cases: string[]
}

const groups: Template[] = [
  {
    level: 'em',
    label: 'Chest pressure with cardiac warning signs',
    cases: [
      'A 62-year-old man has crushing substernal chest pressure for 45 minutes with sweating, nausea, and shortness of breath. The pressure spreads to his left arm.',
      'A 58-year-old woman with diabetes reports chest tightness and jaw pain that started suddenly while climbing stairs. She is sweaty and lightheaded.',
      'A 71-year-old man with heart disease has central chest pressure that keeps coming back with shortness of breath and a cold sweat.',
      'A 45-year-old smoker has squeezing chest discomfort for 30 minutes with nausea and pain spreading to the back.',
      'A 67-year-old woman has heavy chest pressure at rest, worsening over one hour, with shortness of breath and diaphoresis.',
    ],
  },
  {
    level: 'em',
    label: 'Stroke-like neurologic symptoms',
    cases: [
      'A 70-year-old man suddenly develops right-sided weakness, slurred speech, and trouble understanding his family.',
      'A 64-year-old woman has sudden facial droop and left arm weakness that started 20 minutes ago.',
      'A 59-year-old man with atrial fibrillation has abrupt trouble speaking and one-sided numbness.',
      'A 77-year-old woman suddenly cannot lift her right arm and has new confusion.',
      'A 52-year-old man has sudden vision trouble, one-sided weakness, and difficulty walking.',
    ],
  },
  {
    level: 'em',
    label: 'Severe breathing or low oxygen',
    cases: [
      'A 65-year-old man has fever and cough with oxygen saturation of 91 percent on room air and breathing is getting worse.',
      'A 27-year-old woman with asthma has worsening wheezing and shortness of breath despite repeated rescue inhaler use.',
      'A 73-year-old woman with COPD has dyspnea at rest, green sputum, and oxygen saturation of 90 percent.',
      'A 48-year-old man is short of breath while sitting still and can only speak a few words at a time.',
      'A 68-year-old man after hip surgery has sudden shortness of breath, chest pain with breathing, left calf swelling, and oxygen saturation of 91 percent.',
    ],
  },
  {
    level: 'em',
    label: 'High-risk fever and infection patterns',
    cases: [
      'A 2-month-old infant has a rectal temperature of 100.8°F and is feeding poorly.',
      'A chemotherapy patient has a fever of 100.6°F and chills after treatment this week.',
      'A 29-year-old traveler returned from Central America with fever, chills, rigors, diarrhea, and mosquito bites.',
      'An 8-year-old child has fever, headache, malaise, joint pain, and a maculopapular rash on wrists and ankles.',
      'A 4-year-old child has abdominal pain and watery diarrhea that became bloody after eating hamburger at a county fair, with mild anemia.',
    ],
  },
  {
    level: 'em',
    label: 'Other ER-level red flags',
    cases: [
      'A pregnant patient at 22 weeks has lower abdominal pain and vaginal bleeding.',
      'A 19-year-old has fever, severe headache, photophobia, and neck stiffness.',
      'A 40-year-old has lip and tongue swelling with trouble breathing after eating peanuts.',
      'A 56-year-old has vomiting blood and black tarry stools with dizziness when standing.',
      'A 65-year-old woman has unilateral right leg pain and swelling after recent hospitalization; her right calf is 4 cm larger than the left.',
    ],
  },
  {
    level: 'ne',
    label: 'Urgent sore throat and ear symptoms',
    cases: [
      'A 24-year-old has sore throat, fever to 102.2°F, no cough, tonsillar exudates, and tender anterior cervical nodes.',
      'A 7-year-old has abrupt fever, nausea, vomiting, sore throat, exudative pharyngitis, and enlarged cervical lymph nodes.',
      'An 18-month-old toddler has one week of rhinorrhea and cough, then overnight fever, poor eating, restless sleep, and an abnormal ear drum.',
      'A 10-year-old has ear pain, fever, and trouble sleeping after several days of nasal congestion.',
      'A 35-year-old has 12 days of facial pain, green nasal discharge, congestion, and maxillary tenderness.',
    ],
  },
  {
    level: 'ne',
    label: 'Urgent skin and wound patterns',
    cases: [
      'A 45-year-old has acute lower-leg redness, swelling, tenderness, and low-grade fever.',
      'A 77-year-old has burning pain on one side of the chest followed by a rash with clear vesicles and crusting.',
      'A diabetic patient has an open sore on the foot with surrounding redness.',
      'A 31-year-old has a deep cut on the hand that may need stitches but bleeding is controlled.',
      'A child has a swollen painful finger with pus around the nail and spreading redness.',
    ],
  },
  {
    level: 'ne',
    label: 'Urgent urinary, GI, and dehydration patterns',
    cases: [
      'A 28-year-old has burning with urination, urgency, lower abdominal discomfort, and flank aching.',
      'A 14-year-old has nausea, vomiting, diarrhea six times today, low-grade fever, and mild tachycardia after undercooked chicken.',
      'A 40-year-old has two months of upper abdominal gnawing pain that wakes him at night and improves with food.',
      'A 65-year-old has productive cough, fever, crackles in the right lower lung, and oxygen saturation is normal.',
      'A 20-year-old has vomiting for a day and dizziness when standing but can still sip fluids.',
    ],
  },
  {
    level: 'ne',
    label: 'Urgent musculoskeletal and eye patterns',
    cases: [
      'A 35-year-old has low back pain after shoveling snow and a new left foot drop.',
      'A 22-year-old twisted an ankle, cannot bear weight, and has marked swelling.',
      'A 9-year-old fell on an outstretched arm and has deformity and swelling of the wrist.',
      'A 42-year-old has sudden eye pain, light sensitivity, and blurred vision.',
      'A 30-year-old has severe spinning dizziness triggered by rolling in bed, recurring nightly for a month.',
    ],
  },
  {
    level: 'sc',
    label: 'Home-care upper respiratory patterns',
    cases: [
      'A 30-year-old has two days of runny nose, sore throat, clear sputum, mild headache, no fever, and normal exam.',
      'A 56-year-old has six days of nonproductive cough, nasal congestion, rhinorrhea, intermittent temperature to 100.8°F, and otherwise normal exam.',
      'A 34-year-old with no lung disease has 12 days of cough after a cold, normal vital signs, and clear lungs.',
      'A 26-year-old has sore throat, headache, nonproductive cough, no fever, and only mild throat redness.',
      'A 22-year-old has years of sneezing, nasal itching, eye itching, and seasonal congestion without fever or facial pain.',
    ],
  },
  {
    level: 'sc',
    label: 'Home-care skin, eye, and mouth patterns',
    cases: [
      'A 9-year-old has a local bee sting with swollen tender upper lip but no tongue swelling, no drooling, no stridor, and no rash.',
      'A 17-year-old has recurrent mouth ulcers since childhood with no eye, skin, genital, respiratory, or GI lesions.',
      'A 30-year-old has a painful swollen eyelid for one day with minor tenderness, no trauma, and no vision change.',
      'A 12-year-old has chronic dry itchy flexural skin with hay fever history but no fever, pus, red streaks, or severe pain.',
      'A 14-year-old has watery red eyes stuck shut in the morning after a cold, with no vision change, trauma, or severe eye pain.',
    ],
  },
  {
    level: 'sc',
    label: 'Home-care GI and routine patterns',
    cases: [
      'A 5-month-old strains before passing hard stool after changing formula, has normal appetite, no vomiting, and no abdominal swelling.',
      'A 40-year-old monogamous woman has two days of vaginal itching and thick white discharge with no abdominal pain and no fever.',
      'A 25-year-old vomited twice after a heavy meal, can keep fluids down, has no blood, no fever, and mild stomach upset.',
      'A 38-year-old has low back pain after lifting boxes, denies leg pain or weakness, denies fever, and had similar episodes that resolved without care.',
      'A 20-year-old has mild sunburn on shoulders without blistering, fever, severe pain, or dehydration.',
    ],
  },
]

function variant(text: string, index: number): string {
  const prefixes = [
    '',
    'The patient says: ',
    'In a triage intake, ',
    'A family member reports that ',
  ]
  const suffixes = [
    '',
    ' Symptoms are concerning enough that the patient is asking where to go.',
    ' No other major history is volunteered.',
    ' The patient wants the safest next step.',
  ]
  return `${prefixes[index % prefixes.length]}${text}${suffixes[Math.floor(index / prefixes.length) % suffixes.length]}`
}

async function main() {
  const out = process.argv[2] ?? path.join(process.cwd(), 'data', 'recursive-learning', 'synthetic-240-benchmark.jsonl')
  const rows: string[] = []
  let id = 1
  for (const group of groups) {
    for (let repeat = 0; repeat < 4; repeat++) {
      for (const c of group.cases) {
        rows.push(JSON.stringify({
          id: `synthetic-${String(id++).padStart(4, '0')}`,
          urgency_level: group.level,
          correct_condition: group.label,
          case_description: variant(c, repeat),
        }))
      }
    }
  }
  await fs.mkdir(path.dirname(out), { recursive: true })
  await fs.writeFile(out, rows.join('\n') + '\n')
  console.log(JSON.stringify({ output: out, cases: rows.length }, null, 2))
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
