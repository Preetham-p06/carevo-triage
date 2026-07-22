import { stripNegatedClauses } from '../emergency'
import type { ExtractedFeatures } from './features'

export interface QuestionSubject {
  text: string
  family: string
  lowerBody?: boolean
  isChild?: boolean
}

interface SubjectPattern {
  family: string
  subject: string
  patterns: RegExp[]
  lowerBody?: boolean
  childSubject?: string
}

const CHILD_CONTEXT = /\b(my|our|their)?\s*(baby|infant|newborn|toddler|child|kid|son|daughter|boy|girl|[0-9]+\s*(?:month|year|yr|yo|y\/o)[-\s]old)\b/i

const SUBJECT_PATTERNS: SubjectPattern[] = [
  {
    family: 'cardiac',
    subject: 'your chest symptoms',
    patterns: [
      /\bchest\b[^.!?]{0,35}\b(pain|pressure|tight(?:ness)?|discomfort|hurt(?:s|ing)?|ache|burn(?:ing)?|weird|heavy|heaviness)\b/i,
      /\b(pain|pressure|tight(?:ness)?|discomfort|hurt(?:s|ing)?|ache|burn(?:ing)?|weird|heavy|heaviness)\b[^.!?]{0,35}\bchest\b/i,
    ],
  },
  {
    family: 'cardiac',
    subject: 'your shoulder pain',
    patterns: [/\bshoulder\b[^.!?]{0,35}\b(pain|hurt(?:s|ing)?|ache|sore|discomfort)\b/i, /\b(pain|hurt(?:s|ing)?|ache|sore|discomfort)\b[^.!?]{0,35}\bshoulder\b/i],
  },
  {
    family: 'cardiac',
    subject: 'your arm pain',
    patterns: [/\barm\b[^.!?]{0,35}\b(pain|hurt(?:s|ing)?|ache|sore|discomfort|weird|weak|numb)\b/i, /\b(pain|hurt(?:s|ing)?|ache|sore|discomfort|weird|weak|numb)\b[^.!?]{0,35}\barm\b/i],
  },
  {
    family: 'cardiac',
    subject: 'your jaw or neck pain',
    patterns: [/\b(jaw|neck)\b[^.!?]{0,35}\b(pain|hurt(?:s|ing)?|ache|sore|discomfort)\b/i, /\b(pain|hurt(?:s|ing)?|ache|sore|discomfort)\b[^.!?]{0,35}\b(jaw|neck)\b/i],
  },
  {
    family: 'respiratory',
    subject: 'your breathing',
    patterns: [/\b(short(?:ness)? of breath|trouble breathing|hard to breathe|difficulty breathing|breathing feels?|wheez(?:e|ing)|asthma|copd)\b/i],
  },
  {
    family: 'respiratory',
    subject: 'your cough',
    patterns: [/\bcough(?:ing)?\b/i],
  },
  {
    family: 'neuro',
    subject: 'your headache',
    patterns: [/\b(headache|migraine|head\s+(?:hurt(?:s|ing)?|pain|pounding|ache))\b/i],
  },
  {
    family: 'neuro',
    subject: 'your dizziness',
    patterns: [/\b(dizz(?:y|iness)|lightheaded|vertigo|room spinning|off[-\s]?balance)\b/i],
  },
  {
    family: 'neuro',
    subject: 'your weakness or numbness',
    patterns: [/\b(weak(?:ness)?|numb(?:ness)?|tingl(?:ing)?|face droop|slurred speech)\b/i],
  },
  {
    family: 'eye',
    subject: 'your eye symptoms',
    patterns: [/\beye\b[^.!?]{0,35}\b(pain|hurt(?:s|ing)?|red|itch(?:y|ing)?|blurry|vision|swollen|watering)\b/i, /\b(vision|blurry|blurred|double vision|loss of sight|light sensitivity)\b/i],
  },
  {
    family: 'gi',
    subject: 'your stomach pain',
    patterns: [/\b(stomach|belly|abdominal|abdomen|tummy)\b[^.!?]{0,35}\b(pain|hurt(?:s|ing)?|ache|cramp(?:ing)?|weird)\b/i, /\b(pain|hurt(?:s|ing)?|ache|cramp(?:ing)?|weird)\b[^.!?]{0,35}\b(stomach|belly|abdominal|abdomen|tummy)\b/i],
  },
  {
    family: 'gi',
    subject: 'your vomiting',
    patterns: [/\b(vomit(?:ing|ed)?|throw(?:ing)? up|threw up|nausea|nauseous)\b/i],
  },
  {
    family: 'gi',
    subject: 'your diarrhea',
    patterns: [/\b(diarrh(?:ea|oea)|loose stools?|watery stools?)\b/i],
  },
  {
    family: 'urinary',
    subject: 'the burning when you pee',
    patterns: [/\b(burn(?:s|ing)? when (?:i |you )?pee|pain(?:ful)? urinat(?:ion|ing)|burning urination|pee(?:ing)? (?:burns|hurts)|urine)\b/i],
  },
  {
    family: 'ent',
    subject: 'your sore throat',
    patterns: [/\b(sore throat|throat (?:hurt(?:s|ing)?|pain|sore|swollen))\b/i],
  },
  {
    family: 'ent',
    subject: 'your ear pain',
    patterns: [/\bear\b[^.!?]{0,35}\b(pain|hurt(?:s|ing)?|ache|sore|drain(?:ing|age)?|pressure)\b/i, /\b(earache)\b/i],
  },
  {
    family: 'ent',
    subject: 'your facial pain',
    patterns: [/\b(face|facial|sinus)\b[^.!?]{0,35}\b(pain|pressure|hurt(?:s|ing)?|ache)\b/i],
  },
  {
    family: 'skin',
    subject: 'your cut',
    patterns: [/\b(cut|gash|laceration|sliced|scrape)\b/i],
  },
  {
    family: 'msk',
    subject: 'your back pain',
    patterns: [/\b(back|spine|low back|lower back)\b[^.!?]{0,35}\b(pain|hurt(?:s|ing)?|ache|sore|stiff)\b/i, /\b(pain|hurt(?:s|ing)?|ache|sore|stiff)\b[^.!?]{0,35}\b(back|spine|low back|lower back)\b/i],
  },
  {
    family: 'msk',
    subject: 'your ankle pain',
    patterns: [/\bankle\b[^.!?]{0,35}\b(pain|hurt(?:s|ing)?|ache|sore|swollen|twist(?:ed)?|sprain(?:ed)?)\b/i, /\b(twist(?:ed)?|sprain(?:ed)?|rolled)\b[^.!?]{0,35}\bankle\b/i],
    lowerBody: true,
  },
  {
    family: 'msk',
    subject: 'your knee pain',
    patterns: [/\bknee\b[^.!?]{0,35}\b(pain|hurt(?:s|ing)?|ache|sore|swollen|twist(?:ed)?|sprain(?:ed)?)\b/i],
    lowerBody: true,
  },
  {
    family: 'msk',
    subject: 'your foot pain',
    patterns: [/\b(foot|feet|toe)\b[^.!?]{0,35}\b(pain|hurt(?:s|ing)?|ache|sore|swollen|cut|wound)\b/i],
    lowerBody: true,
  },
  {
    family: 'msk',
    subject: 'your wrist or hand pain',
    patterns: [/\b(wrist|hand|finger|thumb)\b[^.!?]{0,35}\b(pain|hurt(?:s|ing)?|ache|sore|swollen|cut|wound)\b/i],
  },
  {
    family: 'msk',
    subject: 'your injury',
    patterns: [/\b(fell|fall|injur(?:y|ed)|hurt myself|twist(?:ed)?|sprain(?:ed)?|rolled|hit my|crash|accident)\b/i],
  },
  {
    family: 'skin',
    subject: 'your rash',
    patterns: [/\b(rash|hives|bumps|spots|skin breaking out)\b/i],
  },
  {
    family: 'skin',
    subject: 'your burn',
    patterns: [/\b(burn|sunburn|scald)\b/i],
  },
  {
    family: 'skin',
    subject: 'your sore or wound',
    patterns: [/\b(sore|wound|ulcer|blister)\b/i],
  },
  {
    family: 'allergic',
    subject: 'your possible allergic reaction',
    patterns: [/\b(allerg(?:y|ic)|hives|bee sting|peanut|shellfish|medicine reaction|swelling after)\b/i],
  },
  {
    family: 'gyn',
    subject: 'your pregnancy symptoms',
    patterns: [/\b(pregnan(?:t|cy)|weeks?\s+pregnant|postpartum)\b/i],
  },
  {
    family: 'mental',
    subject: 'your anxiety',
    patterns: [/\b(anxiety|panic|panic attack|racing thoughts|overwhelmed)\b/i],
  },
  {
    family: 'mental',
    subject: 'how you are feeling emotionally',
    patterns: [/\b(depress(?:ed|ion)|hopeless|sad|mental health|stress(?:ed)?)\b/i],
  },
  {
    family: 'dental',
    subject: 'your tooth or mouth pain',
    patterns: [/\b(tooth|teeth|dental|gum|mouth)\b[^.!?]{0,35}\b(pain|hurt(?:s|ing)?|ache|sore|swollen)\b/i, /\btoothache\b/i],
  },
  {
    family: 'general',
    subject: 'your fever',
    childSubject: "your child's fever",
    patterns: [/\b(fever(?:ish)?|temperature|burning up|feel(?:ing)? hot|chills)\b/i],
  },
  {
    family: 'general',
    subject: 'how you are feeling',
    patterns: [/\b(feel(?:ing)? (?:bad|off|sick|weird|awful|terrible)|not feeling well|feel like crap|idk)\b/i],
  },
]

const SYSTEM_FALLBACK: Record<ExtractedFeatures['system'], string> = {
  cardiac: 'your chest symptoms',
  respiratory: 'your breathing or cough',
  neuro: 'your head or nerve symptoms',
  gi: 'your stomach symptoms',
  msk: 'your pain or injury',
  skin: 'your skin symptoms',
  ent: 'your throat, ear, or sinus symptoms',
  urinary: 'your urinary symptoms',
  gyn: 'your pelvic or pregnancy symptoms',
  mental: 'how you are feeling',
  general: 'what you are feeling',
}

function cleanSummary(summary: string | undefined): string | null {
  const s = (summary ?? '').replace(/\s+/g, ' ').trim()
  if (!s || /^your symptoms$/i.test(s)) return null
  if (s.length > 80) return null
  if (/[{}[\]<>]/.test(s)) return null
  return s
    .replace(/^(i have|i've got|i am having|i'm having|my)\s+/i, '')
    .replace(/\.$/, '')
}

export function questionSubject(rawText: string, features: ExtractedFeatures): QuestionSubject {
  const source = stripNegatedClauses(`${rawText}\n${features.summary ?? ''}`).replace(/\s+/g, ' ').trim()
  const isChild = CHILD_CONTEXT.test(source)

  for (const item of SUBJECT_PATTERNS) {
    if (!item.patterns.some(p => p.test(source))) continue
    return {
      text: isChild && item.childSubject ? item.childSubject : item.subject,
      family: item.family,
      lowerBody: item.lowerBody,
      isChild,
    }
  }

  const summary = cleanSummary(features.summary)
  if (summary) {
    return {
      text: isChild ? `your child's ${summary}` : `your ${summary}`,
      family: features.system,
      isChild,
    }
  }

  return {
    text: isChild ? "your child's symptoms" : SYSTEM_FALLBACK[features.system],
    family: features.system,
    isChild,
  }
}

function sentence(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

function injuryArea(subject: QuestionSubject): string {
  const s = subject.text.toLowerCase()
  if (s.includes('ankle')) return 'that ankle'
  if (s.includes('knee')) return 'that knee'
  if (s.includes('foot')) return 'that foot'
  if (s.includes('wrist')) return 'that wrist or hand'
  if (s.includes('hand')) return 'that hand'
  if (s.includes('cut')) return 'the cut area'
  return 'the injured area'
}

export function tailoredHint(hint: string, subject: QuestionSubject): string {
  return `${hint}. Use this exact patient-specific subject naturally in the question: "${subject.text}". Do not say "your symptom" or "your symptoms" unless that is the subject.`
}

export function deterministicTailoredQuestion(target: string, subject: QuestionSubject): string | null {
  const s = subject.text
  switch (target) {
    case 'duration':
      return sentence(`When did ${s} start, and how long has it been going on?`)
    case 'severity':
      if (subject.lowerBody) return sentence(`Is ${s} stopping you from walking, standing, or putting weight on it?`)
      if (subject.family === 'respiratory') return sentence(`Is ${s} making it hard to talk, sleep, walk, or do normal activities?`)
      if (subject.family === 'gi') return sentence(`Is ${s} stopping you from eating, drinking, sleeping, or doing normal activities?`)
      if (subject.family === 'mental') return sentence(`Is ${s} stopping you from sleeping, eating, working, or feeling safe?`)
      return sentence(`What is ${s} stopping you from doing right now, like walking, sleeping, eating, or working?`)
    case 'functionalImpact':
      if (subject.lowerBody) return sentence(`How is ${s} affecting walking, standing, or getting around?`)
      if (subject.family === 'ent') return sentence(`Is ${s} making it hard to swallow, drink, sleep, or do normal activities?`)
      return sentence(`How is ${s} affecting normal activities like work, school, walking, eating, or sleeping?`)
    case 'worsening':
      return sentence(`Is ${s} getting better, getting worse, or staying about the same?`)
    case 'suddenOnset':
      return sentence(`Did ${s} start suddenly, or did it build up slowly?`)
    case 'possibleFracture':
      if (subject.lowerBody) return sentence(`Can you put weight on ${injuryArea(subject)}, and does it look crooked or badly swollen?`)
      return sentence(`Can you use ${injuryArea(subject)}, and does it look crooked, deformed, or badly swollen?`)
    case 'openWound':
      if (subject.family === 'skin' && s.includes('cut')) return sentence(`How deep is ${s}, and does the bleeding stop with steady pressure?`)
      return sentence(`Is there an open cut on ${injuryArea(subject)}, and does the bleeding stop with steady pressure?`)
    case 'highFever':
      return sentence(`What temperature did you measure for ${s}, or does it feel very hot with shaking chills?`)
    default:
      return null
  }
}

export function hasPatientSubject(text: string, subject: QuestionSubject): boolean {
  const normalized = text.toLowerCase()
  const words = subject.text
    .toLowerCase()
    .replace(/\byour\b|\bchild'?s\b|\bpossible\b|\bsymptoms?\b|\bpain\b|\bfeeling\b|\bemotionally\b|\bwhat\b|\bhow\b|\bare\b|\bthe\b|\bor\b|\band\b/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 3)
  return words.length === 0 || words.some(w => normalized.includes(w))
}
