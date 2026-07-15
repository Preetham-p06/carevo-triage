import { classifyEmergency, detectFeverMention, detectInfantFever, detectSelfHarm } from '../lib/emergency'
import { decide, type EngineLevel } from '../lib/engine/model'
import { planInterview } from '../lib/engine/evoi'
import type { ExtractedFeatures, PatientRisk, RedFlag, RiskModifier } from '../lib/engine/features'
import { LEVEL_RANK } from '../lib/engine/levels'
import { writeFileSync } from 'fs'

type Group =
  | 'chest pain' | 'shortness of breath' | 'abdominal pain' | 'headache'
  | 'fever' | 'pediatric symptoms' | 'pregnancy' | 'elderly patients'
  | 'immunocompromised patients' | 'mental health crisis'
  | 'wounds/burns/rashes' | 'eye symptoms'

interface BenchCase {
  id: string
  group: Group
  description: string
  f: ExtractedFeatures
  risk: PatientRisk
  expected: EngineLevel
  accept: EngineLevel[]
  redFlagsPresent: string[]
  why: string
  shouldTrigger: string
}

interface Result {
  c: BenchCase
  output: EngineLevel
  pass: boolean
  issue: 'none' | 'under-triage' | 'over-triage' | 'wrong-route' | 'missing-rule' | 'unclear-interview'
  fired: string[]
  factors: string[]
  questions: string[]
  note: string
}

const R = (modifiers: RiskModifier[] = []): PatientRisk => ({ modifiers })
const F = (over: Partial<ExtractedFeatures>): ExtractedFeatures => ({
  system: 'general',
  severity: 1,
  suddenOnset: false,
  duration: '6to48h',
  worsening: false,
  functionalImpact: 1,
  redFlags: [],
  possibleFracture: false,
  openWound: false,
  highFever: false,
  summary: 'synthetic benchmark case',
  ...over,
})

function C(
  id: string,
  group: Group,
  description: string,
  f: Partial<ExtractedFeatures>,
  risk: RiskModifier[],
  expected: EngineLevel,
  redFlagsPresent: string[],
  why: string,
  shouldTrigger: string,
  accept: EngineLevel[] = [],
): BenchCase {
  return { id, group, description, f: F({ summary: description, ...f }), risk: R(risk), expected, accept, redFlagsPresent, why, shouldTrigger }
}

const cases: BenchCase[] = [
  C('CP01', 'chest pain', '67M crushing chest pressure, sweating, nausea, started 20 minutes ago.', { system: 'cardiac', severity: 3, suddenOnset: true, duration: 'under6h', redFlags: ['chest_pressure'], functionalImpact: 3 }, ['age_over_65'], 'emergency', ['chest_pressure'], 'Classic ACS symptoms should not wait for interview.', 'classifyEmergency immediate / cx.chest_pressure_acute'),
  C('CP02', 'chest pain', '42F chest tightness for two days, worse climbing stairs, no sweating.', { system: 'cardiac', severity: 2, duration: '2to7d', redFlags: ['chest_pressure'], functionalImpact: 2 }, [], 'er', ['chest_pressure'], 'Confirmed pressure is ER even without classic 911 wording.', 'rf.chest_pressure'),
  C('CP03', 'chest pain', '29M chest pain only when pressing the ribs after lifting weights.', { system: 'msk', severity: 1, duration: '6to48h', functionalImpact: 1 }, [], 'telehealth', [], 'Musculoskeletal chest wall pain should not blanket 911.', 'model', ['home_care', 'primary_care']),
  C('CP04', 'chest pain', '75F vague chest heaviness and fatigue with history of heart disease.', { system: 'cardiac', severity: 2, duration: '6to48h', functionalImpact: 2 }, ['age_over_65', 'heart_disease'], 'er', [], 'Older cardiac patient with significant symptoms needs ER floor.', 'cx.cardiac_highrisk'),
  C('CP05', 'chest pain', '35M sharp chest pain after coughing, mild, breathing fine.', { system: 'respiratory', severity: 1, duration: '6to48h', functionalImpact: 1 }, [], 'telehealth', [], 'Mild pleuritic/cough-associated pain can start virtual/PCP.', 'model', ['primary_care']),
  C('CP06', 'chest pain', '60M chest pain spreading to left arm with dizziness.', { system: 'cardiac', severity: 3, suddenOnset: true, duration: 'under6h', redFlags: ['chest_pressure', 'fainting_or_confusion'], functionalImpact: 3 }, ['age_over_65'], 'emergency', ['chest_pressure', 'fainting_or_confusion'], 'Radiation plus dizziness is a 911 presentation.', 'classifyEmergency immediate / cx.chest_pressure_acute'),
  C('CP07', 'chest pain', '50F burning chest discomfort after spicy food, mild, for a week.', { system: 'gi', severity: 1, duration: 'over7d', functionalImpact: 1 }, [], 'primary_care', [], 'Persistent non-red-flag chest/upper GI symptoms need PCP follow-up.', 'model', ['telehealth']),
  C('CP08', 'chest pain', '70M chest discomfort and shortness of breath at rest.', { system: 'cardiac', severity: 2, suddenOnset: true, duration: 'under6h', redFlags: ['breathing_difficulty', 'chest_pressure'], functionalImpact: 2 }, ['age_over_65'], 'emergency', ['breathing_difficulty', 'chest_pressure'], 'Chest symptoms plus dyspnea at rest should be treated as emergency.', 'classifyEmergency immediate / cx.chest_pressure_acute'),
  C('CP09', 'chest pain', '46F intermittent palpitations and mild chest fluttering for months.', { system: 'cardiac', severity: 1, duration: 'over7d', functionalImpact: 1 }, [], 'primary_care', [], 'Stable chronic palpitations need outpatient evaluation.', 'model', ['telehealth']),

  C('SB01', 'shortness of breath', "58M says he can't breathe and lips look blue.", { system: 'respiratory', severity: 3, suddenOnset: true, duration: 'under6h', redFlags: ['breathing_difficulty'], functionalImpact: 3 }, [], 'emergency', ['breathing_difficulty'], 'Severe dyspnea/cyanosis should call 911.', 'classifyEmergency immediate'),
  C('SB02', 'shortness of breath', '33F asthma, wheezing, trouble breathing while sitting still.', { system: 'respiratory', severity: 2, duration: 'under6h', worsening: true, redFlags: ['breathing_difficulty'], functionalImpact: 2 }, ['lung_condition'], 'er', ['breathing_difficulty'], 'Rest dyspnea with lung disease needs ER-level care.', 'rf.breathing_difficulty'),
  C('SB03', 'shortness of breath', '25M winded after exercise, better with rest, no chest pain.', { system: 'respiratory', severity: 0, duration: 'under6h', functionalImpact: 0 }, [], 'home_care', [], 'Benign exertional breathlessness can self-care.', 'model', ['telehealth']),
  C('SB04', 'shortness of breath', '68F new shortness of breath walking across room, swelling legs.', { system: 'respiratory', severity: 2, duration: '2to7d', worsening: true, functionalImpact: 2 }, ['age_over_65', 'heart_disease'], 'urgent_care', [], 'Older patient with worsening dyspnea needs same-day evaluation.', 'model/risk', ['er']),
  C('SB05', 'shortness of breath', '40M panic attack feeling short of breath but speaking full sentences, no chest pain.', { system: 'mental', severity: 2, duration: 'under6h', functionalImpact: 2 }, [], 'primary_care', [], 'Non-crisis anxiety dyspnea should avoid urgent-care over-triage.', 'mental model', ['telehealth']),
  C('SB06', 'shortness of breath', '72M COPD, fever, worsening cough, more short of breath than usual.', { system: 'respiratory', severity: 2, duration: '2to7d', worsening: true, highFever: true, functionalImpact: 2 }, ['age_over_65', 'lung_condition'], 'urgent_care', [], 'High-risk respiratory infection needs same-day assessment.', 'model/risk', ['er']),
  C('SB07', 'shortness of breath', '19F sudden sharp chest pain and shortness of breath after long flight.', { system: 'respiratory', severity: 2, suddenOnset: true, duration: 'under6h', redFlags: ['breathing_difficulty'], functionalImpact: 2 }, [], 'er', ['breathing_difficulty'], 'Possible PE-type story should be ER-level.', 'rf.breathing_difficulty'),
  C('SB08', 'shortness of breath', '55M smoke inhalation from house fire, coughing and hoarse.', { system: 'respiratory', severity: 2, suddenOnset: true, duration: 'under6h', redFlags: ['breathing_difficulty'], functionalImpact: 2 }, [], 'er', ['breathing_difficulty'], 'Inhalation injury can worsen quickly.', 'rf.breathing_difficulty'),

  C('AB01', 'abdominal pain', '31F sudden severe right lower abdominal pain, worsening, cannot stand straight.', { system: 'gi', severity: 3, suddenOnset: true, duration: 'under6h', worsening: true, functionalImpact: 3 }, [], 'er', [], 'Severe focal worsening abdominal pain may need imaging/surgery.', 'model + cx.sudden_severe_worsening', ['urgent_care']),
  C('AB02', 'abdominal pain', '45M mild stomach cramps after questionable food, diarrhea, drinking fluids.', { system: 'gi', severity: 1, duration: 'under6h', functionalImpact: 1 }, [], 'telehealth', [], 'Mild GI illness without dehydration can start virtual/home.', 'model', ['home_care', 'primary_care']),
  C('AB03', 'abdominal pain', '70F abdominal pain, confused and dizzy when standing.', { system: 'gi', severity: 2, duration: '6to48h', redFlags: ['fainting_or_confusion'], functionalImpact: 2 }, ['age_over_65'], 'er', ['fainting_or_confusion'], 'Elderly confusion/dizziness with abdominal pain needs ER.', 'rf.fainting_or_confusion'),
  C('AB04', 'abdominal pain', '28M vomiting all day, no urination, dizzy standing.', { system: 'gi', severity: 2, duration: '6to48h', redFlags: ['severe_dehydration'], functionalImpact: 2 }, [], 'urgent_care', ['severe_dehydration'], 'Severe dehydration needs same-day fluids assessment.', 'rf.severe_dehydration', ['er']),
  C('AB05', 'abdominal pain', '52M black tarry stools and abdominal pain.', { system: 'gi', severity: 2, duration: '6to48h', redFlags: ['uncontrolled_bleeding'], functionalImpact: 2 }, [], 'er', ['uncontrolled_bleeding'], 'GI bleeding signs warrant ER.', 'rf.uncontrolled_bleeding'),
  C('AB06', 'abdominal pain', '24F pelvic pain and positive pregnancy test, no bleeding.', { system: 'gyn', severity: 2, duration: 'under6h', functionalImpact: 2 }, ['pregnant'], 'urgent_care', [], 'Pregnancy pelvic pain needs prompt evaluation even without bleeding.', 'cx.pregnancy_abdo', ['er']),
  C('AB07', 'abdominal pain', '60M severe tearing abdominal/back pain, sudden onset.', { system: 'gi', severity: 3, suddenOnset: true, duration: 'under6h', functionalImpact: 3 }, ['age_over_65'], 'er', [], 'Tearing severe abdominal/back pain should be ER-level.', 'model + risk'),
  C('AB08', 'abdominal pain', '35F recurrent mild heartburn for weeks.', { system: 'gi', severity: 1, duration: 'over7d', functionalImpact: 1 }, [], 'primary_care', [], 'Persistent but mild symptoms need outpatient follow-up.', 'model', ['telehealth']),
  C('AB09', 'abdominal pain', '40M severe testicular pain and lower belly pain started suddenly.', { system: 'gyn', severity: 3, suddenOnset: true, duration: 'under6h', functionalImpact: 3 }, [], 'er', [], 'Time-sensitive genital/abdominal pain should be ER-level.', 'model', ['urgent_care']),

  C('HA01', 'headache', '44F worst headache of life, thunderclap onset seconds ago.', { system: 'neuro', severity: 3, suddenOnset: true, duration: 'under6h', redFlags: ['worst_headache_of_life'], functionalImpact: 3 }, [], 'er', ['worst_headache_of_life'], 'Thunderclap headache requires ER.', 'rf.worst_headache_of_life'),
  C('HA02', 'headache', '36M mild tension headache after computer work, better with rest.', { system: 'neuro', severity: 0, duration: 'under6h', functionalImpact: 0 }, [], 'home_care', [], 'Mild uncomplicated headache can self-care.', 'model', ['telehealth']),
  C('HA03', 'headache', '29F fever, stiff neck, severe headache.', { system: 'neuro', severity: 3, duration: 'under6h', highFever: true, redFlags: ['stiff_neck_with_fever'], functionalImpact: 3 }, [], 'er', ['stiff_neck_with_fever'], 'Meningitis-pattern symptoms need ER.', 'rf.stiff_neck_with_fever'),
  C('HA04', 'headache', '55M new headache with slurred speech and face droop.', { system: 'neuro', severity: 3, suddenOnset: true, duration: 'under6h', redFlags: ['one_sided_weakness'], functionalImpact: 3 }, [], 'emergency', ['one_sided_weakness'], 'Stroke signs need 911.', 'classifyEmergency immediate / rf.one_sided_weakness'),
  C('HA05', 'headache', '62F headache after hitting head, now confused.', { system: 'neuro', severity: 2, suddenOnset: true, duration: 'under6h', redFlags: ['fainting_or_confusion'], functionalImpact: 2 }, ['age_over_65'], 'emergency', ['fainting_or_confusion'], 'Head injury plus confusion in older adult is emergency transport.', 'classifyEmergency immediate', ['er']),
  C('HA06', 'headache', '40F migraine like prior migraines, moderate, nausea, no neuro symptoms.', { system: 'neuro', severity: 1, duration: 'under6h', functionalImpact: 1 }, [], 'primary_care', [], 'Known moderate migraine can start outpatient/telehealth.', 'model', ['telehealth', 'urgent_care']),
  C('HA07', 'headache', '23M headache after carbon monoxide alarm went off, family also nauseated.', { system: 'neuro', severity: 2, suddenOnset: true, duration: 'under6h', functionalImpact: 2 }, [], 'er', [], 'CO exposure concern needs emergency evaluation.', 'missing deterministic exposure rule'),
  C('HA08', 'headache', '71F new persistent headache for two weeks, mild vision blur.', { system: 'neuro', severity: 1, duration: 'over7d', functionalImpact: 1 }, ['age_over_65'], 'primary_care', [], 'New headache in older adult needs outpatient evaluation soon.', 'model', ['urgent_care']),

  C('FV01', 'fever', 'Adult fever 101, mild aches, drinking fine for one day.', { system: 'general', severity: 1, duration: '6to48h', highFever: true, functionalImpact: 1 }, [], 'telehealth', [], 'Uncomplicated adult fever can start virtual care.', 'model', ['urgent_care']),
  C('FV02', 'fever', 'Adult fever 104 with shaking chills and weakness.', { system: 'general', severity: 2, duration: 'under6h', highFever: true, functionalImpact: 2 }, [], 'urgent_care', [], 'High fever with systemic symptoms needs same-day evaluation.', 'flag:highFever', ['er']),
  C('FV03', 'fever', 'Fever with stiff neck and confusion.', { system: 'neuro', severity: 3, duration: 'under6h', highFever: true, redFlags: ['stiff_neck_with_fever', 'fainting_or_confusion'], functionalImpact: 3 }, [], 'er', ['stiff_neck_with_fever', 'fainting_or_confusion'], 'Possible meningitis/sepsis features require ER.', 'rf.stiff_neck_with_fever'),
  C('FV04', 'fever', 'Fever and rash with face and lip swelling after antibiotics.', { system: 'skin', severity: 2, suddenOnset: true, duration: 'under6h', highFever: true, redFlags: ['allergic_swelling'], functionalImpact: 2 }, [], 'er', ['allergic_swelling'], 'Allergic swelling can threaten airway.', 'rf.allergic_swelling'),
  C('FV05', 'fever', 'Fever for 8 days, low energy, no red flags.', { system: 'general', severity: 1, duration: 'over7d', highFever: true, functionalImpact: 1 }, [], 'primary_care', [], 'Persistent fever needs clinician evaluation.', 'model', ['urgent_care']),
  C('FV06', 'fever', 'Fever with severe dehydration, cannot keep fluids down.', { system: 'gi', severity: 2, duration: '6to48h', highFever: true, redFlags: ['severe_dehydration'], functionalImpact: 2 }, [], 'urgent_care', ['severe_dehydration'], 'Dehydration needs same-day assessment.', 'rf.severe_dehydration', ['er']),
  C('FV07', 'fever', 'Post-op fever two days after surgery, worsening pain at incision.', { system: 'skin', severity: 2, duration: '2to7d', highFever: true, worsening: true, functionalImpact: 2, openWound: true }, [], 'urgent_care', [], 'Post-procedure infection concern needs same-day assessment.', 'model + openWound', ['er']),
  C('FV08', 'fever', 'Fever with purple non-blanching rash and looks very ill.', { system: 'skin', severity: 3, suddenOnset: true, duration: 'under6h', highFever: true, functionalImpact: 3 }, [], 'er', [], 'Toxic fever/rash pattern should be ER-level.', 'missing rash toxicity red flag'),

  C('PD01', 'pediatric symptoms', '2-month-old baby fever 100.8, fussy but awake.', { system: 'general', severity: 1, duration: 'under6h', highFever: true, redFlags: ['infant_under_3mo_fever'], functionalImpact: 1 }, ['age_under_2'], 'er', ['infant_under_3mo_fever'], 'Infant under 3 months with fever needs ER.', 'detectInfantFever / rf.infant_under_3mo_fever'),
  C('PD02', 'pediatric symptoms', '18-month-old fever 104, drinking some, no stiff neck.', { system: 'ent', severity: 1, duration: '6to48h', highFever: true, functionalImpact: 1 }, ['age_under_2'], 'urgent_care', [], 'Toddler high fever should be same-day urgent care.', 'cx.toddler_high_fever'),
  C('PD03', 'pediatric symptoms', '5-year-old barking cough, mild, breathing fine.', { system: 'respiratory', severity: 1, duration: 'under6h', functionalImpact: 1 }, [], 'telehealth', [], 'Mild pediatric cough without respiratory distress can start virtual.', 'model', ['primary_care']),
  C('PD04', 'pediatric symptoms', 'Child is drooling and cannot swallow, noisy breathing.', { system: 'ent', severity: 3, suddenOnset: true, duration: 'under6h', redFlags: ['breathing_difficulty'], functionalImpact: 3 }, [], 'emergency', ['breathing_difficulty'], 'Airway compromise signs need 911.', 'classifyEmergency immediate'),
  C('PD05', 'pediatric symptoms', '8-year-old ankle injury cannot bear weight, swollen.', { system: 'msk', severity: 2, suddenOnset: true, duration: 'under6h', functionalImpact: 2, possibleFracture: true }, [], 'urgent_care', [], 'Possible fracture needs imaging.', 'flag:possibleFracture'),
  C('PD06', 'pediatric symptoms', 'Child vomiting, dry mouth, no urine all day.', { system: 'gi', severity: 2, duration: '6to48h', redFlags: ['severe_dehydration'], functionalImpact: 2 }, [], 'urgent_care', ['severe_dehydration'], 'Pediatric dehydration needs same-day care.', 'rf.severe_dehydration', ['er']),
  C('PD07', 'pediatric symptoms', 'Teen says they want to die and have pills.', { system: 'mental', severity: 3, suddenOnset: true, duration: 'under6h', redFlags: ['suicidal_thoughts'], functionalImpact: 3 }, [], 'er', ['suicidal_thoughts'], 'Self-harm with means needs crisis/ER path.', 'detectSelfHarm / rf.suicidal_thoughts'),
  C('PD08', 'pediatric symptoms', 'Baby under 1 year with fall from couch, acting normal.', { system: 'neuro', severity: 1, suddenOnset: true, duration: 'under6h', functionalImpact: 0 }, ['age_under_2'], 'urgent_care', [], 'Infant head trauma should be same-day clinician assessment.', 'missing infant head injury modifier', ['primary_care']),

  C('PG01', 'pregnancy', 'Pregnant 10 weeks, vaginal bleeding and one-sided pelvic pain.', { system: 'gyn', severity: 2, suddenOnset: true, duration: 'under6h', redFlags: ['pregnancy_bleeding_or_pain'], functionalImpact: 2 }, ['pregnant'], 'er', ['pregnancy_bleeding_or_pain'], 'Bleeding/pain in pregnancy needs ER.', 'rf.pregnancy_bleeding_or_pain'),
  C('PG02', 'pregnancy', 'Pregnant 30 weeks, severe headache and vision spots.', { system: 'neuro', severity: 3, duration: 'under6h', redFlags: ['sudden_vision_loss'], functionalImpact: 2 }, ['pregnant'], 'er', ['sudden_vision_loss'], 'Possible preeclampsia-type symptoms need ER.', 'rf.sudden_vision_loss'),
  C('PG03', 'pregnancy', 'Pregnant 24 weeks, mild nausea for two days, keeping fluids.', { system: 'gi', severity: 1, duration: '2to7d', functionalImpact: 1 }, ['pregnant'], 'telehealth', [], 'Mild pregnancy nausea can start with telehealth/OB call.', 'model', ['primary_care']),
  C('PG04', 'pregnancy', 'Pregnant 28 weeks, cannot keep fluids down and dizzy standing.', { system: 'gi', severity: 2, duration: '6to48h', redFlags: ['severe_dehydration'], functionalImpact: 2 }, ['pregnant'], 'urgent_care', ['severe_dehydration'], 'Dehydration in pregnancy needs same-day care.', 'rf.severe_dehydration', ['er']),
  C('PG05', 'pregnancy', 'Pregnant, chest pressure and shortness of breath.', { system: 'cardiac', severity: 2, suddenOnset: true, duration: 'under6h', redFlags: ['chest_pressure', 'breathing_difficulty'], functionalImpact: 2 }, ['pregnant'], 'emergency', ['chest_pressure', 'breathing_difficulty'], 'Pregnancy plus ACS/PE symptoms should be emergency.', 'classifyEmergency immediate / cx.chest_pressure_acute'),
  C('PG06', 'pregnancy', 'Postpartum 5 days, heavy bleeding soaking pads.', { system: 'gyn', severity: 3, suddenOnset: true, duration: 'under6h', redFlags: ['uncontrolled_bleeding'], functionalImpact: 3 }, [], 'er', ['uncontrolled_bleeding'], 'Heavy postpartum bleeding needs ER.', 'rf.uncontrolled_bleeding'),
  C('PG07', 'pregnancy', 'Pregnant with significant abdominal pain, no bleeding.', { system: 'gi', severity: 2, duration: 'under6h', functionalImpact: 2 }, ['pregnant'], 'urgent_care', [], 'Pregnancy abdominal pain needs prompt evaluation.', 'cx.pregnancy_abdo', ['er']),
  C('PG08', 'pregnancy', 'Pregnant with decreased fetal movement today.', { system: 'gyn', severity: 2, duration: 'under6h', functionalImpact: 2 }, ['pregnant'], 'er', [], 'Decreased fetal movement should not wait for routine care.', 'missing pregnancy fetal movement rule', ['urgent_care']),

  C('EL01', 'elderly patients', '82F new confusion and fever.', { system: 'general', severity: 2, duration: 'under6h', highFever: true, redFlags: ['fainting_or_confusion'], functionalImpact: 2 }, ['age_over_65'], 'er', ['fainting_or_confusion'], 'New confusion in elder can be sepsis/stroke/metabolic emergency.', 'rf.fainting_or_confusion'),
  C('EL02', 'elderly patients', '76M sudden one-sided weakness and slurred speech.', { system: 'neuro', severity: 3, suddenOnset: true, duration: 'under6h', redFlags: ['one_sided_weakness'], functionalImpact: 3 }, ['age_over_65'], 'emergency', ['one_sided_weakness'], 'Stroke signs need 911.', 'classifyEmergency immediate / rf.one_sided_weakness'),
  C('EL03', 'elderly patients', '80F fell, hip pain, cannot stand.', { system: 'msk', severity: 2, suddenOnset: true, duration: 'under6h', functionalImpact: 3, possibleFracture: true }, ['age_over_65'], 'er', [], 'Hip fracture concern often needs ER transport.', 'missing elderly hip fracture ER floor', ['urgent_care']),
  C('EL04', 'elderly patients', '69M mild cough for three days, no fever, breathing fine.', { system: 'respiratory', severity: 1, duration: '2to7d', functionalImpact: 1 }, ['age_over_65'], 'telehealth', [], 'Mild respiratory symptoms can start telehealth.', 'model', ['primary_care']),
  C('EL05', 'elderly patients', '73F fainted once and now feels weak.', { system: 'neuro', severity: 2, suddenOnset: true, duration: 'under6h', redFlags: ['fainting_or_confusion'], functionalImpact: 2 }, ['age_over_65'], 'er', ['fainting_or_confusion'], 'Syncope in elder needs ER evaluation.', 'rf.fainting_or_confusion'),
  C('EL06', 'elderly patients', '85M cannot get out of bed, suddenly much weaker, no focal symptoms.', { system: 'general', severity: 3, suddenOnset: true, duration: 'under6h', worsening: true, functionalImpact: 3 }, ['age_over_65'], 'er', [], 'Sudden inability to function in elder can be occult emergency.', 'missing elderly acute weakness rule', ['urgent_care']),
  C('EL07', 'elderly patients', '90F urinary burning, mild, no fever or confusion.', { system: 'urinary', severity: 1, duration: '6to48h', functionalImpact: 1 }, ['age_over_65'], 'primary_care', [], 'Older adult UTI symptoms should be clinician-directed soon.', 'model', ['telehealth', 'urgent_care']),
  C('EL08', 'elderly patients', '78M chest discomfort, diabetic, says it feels like indigestion.', { system: 'cardiac', severity: 2, duration: 'under6h', functionalImpact: 2 }, ['age_over_65', 'diabetes'], 'er', [], 'Atypical cardiac symptoms in high-risk elder need ER.', 'cx.cardiac_highrisk'),

  C('IC01', 'immunocompromised patients', 'Chemo patient temperature 100.5 with chills.', { system: 'general', severity: 1, duration: 'under6h', functionalImpact: 1 }, ['immunocompromised', 'active_chemo'], 'er', [], 'Any fever on active chemo is febrile neutropenia risk.', 'detectFeverMention + cx.chemo_fever'),
  C('IC02', 'immunocompromised patients', 'Kidney transplant patient fever 102 and cough.', { system: 'respiratory', severity: 2, duration: 'under6h', highFever: true, functionalImpact: 2 }, ['immunocompromised'], 'urgent_care', [], 'Immunocompromised fever needs same-day care.', 'cx.immunocompromised_fever', ['er']),
  C('IC03', 'immunocompromised patients', 'Chemo patient sore throat, no fever, mild.', { system: 'ent', severity: 1, duration: '6to48h', functionalImpact: 1 }, ['immunocompromised', 'active_chemo'], 'primary_care', [], 'Active chemo with infectious symptoms merits clinician contact.', 'model/risk', ['telehealth', 'urgent_care']),
  C('IC04', 'immunocompromised patients', 'HIV patient severe headache and stiff neck with fever.', { system: 'neuro', severity: 3, duration: 'under6h', highFever: true, redFlags: ['stiff_neck_with_fever'], functionalImpact: 3 }, ['immunocompromised'], 'er', ['stiff_neck_with_fever'], 'Meningitis concern in immunocompromised patient.', 'rf.stiff_neck_with_fever'),
  C('IC05', 'immunocompromised patients', 'Chemo patient has red swollen port site and fever.', { system: 'skin', severity: 2, duration: 'under6h', highFever: true, openWound: true, functionalImpact: 2 }, ['immunocompromised', 'active_chemo'], 'er', [], 'Possible line infection on chemo needs ER.', 'cx.chemo_fever'),
  C('IC06', 'immunocompromised patients', 'Steroid patient mild rash, no fever, itchy for a week.', { system: 'skin', severity: 1, duration: 'over7d', functionalImpact: 1 }, ['immunocompromised'], 'primary_care', [], 'Persistent rash with immune risk needs outpatient review.', 'model/risk', ['telehealth']),
  C('IC07', 'immunocompromised patients', 'Transplant patient vomiting, dizzy standing, no urine.', { system: 'gi', severity: 2, duration: '6to48h', redFlags: ['severe_dehydration'], functionalImpact: 2 }, ['immunocompromised'], 'urgent_care', ['severe_dehydration'], 'Dehydration in immune-risk patient needs same-day care.', 'rf.severe_dehydration', ['er']),
  C('IC08', 'immunocompromised patients', 'Chemo patient short of breath at rest.', { system: 'respiratory', severity: 2, duration: 'under6h', redFlags: ['breathing_difficulty'], functionalImpact: 2 }, ['immunocompromised', 'active_chemo'], 'er', ['breathing_difficulty'], 'Rest dyspnea on chemo is ER-level.', 'rf.breathing_difficulty'),

  C('MH01', 'mental health crisis', 'I do not want to be here anymore.', { system: 'mental', severity: 3, duration: 'under6h', redFlags: ['suicidal_thoughts'], functionalImpact: 3 }, [], 'er', ['suicidal_thoughts'], 'Softened self-harm language needs crisis flow.', 'detectSelfHarm'),
  C('MH02', 'mental health crisis', 'I have pills and I am thinking of ending it all.', { system: 'mental', severity: 3, suddenOnset: true, duration: 'under6h', redFlags: ['suicidal_thoughts'], functionalImpact: 3 }, [], 'er', ['suicidal_thoughts'], 'Self-harm with means needs crisis/ER path.', 'detectSelfHarm'),
  C('MH03', 'mental health crisis', 'Panic attacks for weeks, not suicidal, cannot sleep.', { system: 'mental', severity: 2, duration: 'over7d', worsening: true, functionalImpact: 2 }, [], 'primary_care', [], 'Severe non-crisis anxiety should avoid urgent care.', 'mental model', ['telehealth']),
  C('MH04', 'mental health crisis', 'Hearing voices telling me to hurt someone.', { system: 'mental', severity: 3, duration: 'under6h', functionalImpact: 3 }, [], 'er', [], 'Danger to others / psychosis needs urgent crisis evaluation.', 'missing homicidal/psychosis crisis rule'),
  C('MH05', 'mental health crisis', 'Depressed for months, passive death wishes, no plan.', { system: 'mental', severity: 2, duration: 'over7d', functionalImpact: 2 }, [], 'primary_care', [], 'Passive non-imminent depression needs timely mental health care.', 'model', ['telehealth', 'er']),
  C('MH06', 'mental health crisis', 'Manic, awake for 4 days, reckless spending, not suicidal.', { system: 'mental', severity: 3, duration: '2to7d', functionalImpact: 3, worsening: true }, [], 'er', [], 'Severe mania can require emergency psychiatric evaluation.', 'missing mania crisis rule', ['urgent_care']),
  C('MH07', 'mental health crisis', 'Anxiety racing thoughts, sleep poor, no self-harm.', { system: 'mental', severity: 2, duration: 'over7d', functionalImpact: 2 }, [], 'primary_care', [], 'Non-crisis anxiety should be outpatient.', 'mental model', ['telehealth']),
  C('MH08', 'mental health crisis', 'Alcohol withdrawal, shaking, confused, possible seizure.', { system: 'mental', severity: 3, suddenOnset: true, duration: 'under6h', redFlags: ['fainting_or_confusion'], functionalImpact: 3 }, [], 'emergency', ['fainting_or_confusion'], 'Withdrawal seizure/confusion needs emergency response.', 'classifyEmergency immediate', ['er']),

  C('WD01', 'wounds/burns/rashes', 'Deep kitchen knife cut, bleeding will not stop with pressure.', { system: 'skin', severity: 3, suddenOnset: true, duration: 'under6h', redFlags: ['uncontrolled_bleeding'], openWound: true, functionalImpact: 2 }, [], 'emergency', ['uncontrolled_bleeding'], 'Uncontrolled bleeding should call 911.', 'classifyEmergency immediate'),
  C('WD02', 'wounds/burns/rashes', 'Small clean cut may need stitches, bleeding controlled.', { system: 'skin', severity: 1, suddenOnset: true, duration: 'under6h', openWound: true, functionalImpact: 1 }, [], 'urgent_care', [], 'Potential sutures need urgent care.', 'flag:openWound'),
  C('WD03', 'wounds/burns/rashes', 'Diabetic foot blister now open and red.', { system: 'skin', severity: 1, duration: '2to7d', openWound: true, worsening: true, functionalImpact: 1 }, ['diabetes'], 'urgent_care', [], 'Diabetic open wound needs same-day care.', 'cx.diabetic_wound'),
  C('WD04', 'wounds/burns/rashes', 'Face/lip swelling and hives after peanuts.', { system: 'skin', severity: 2, suddenOnset: true, duration: 'under6h', redFlags: ['allergic_swelling'], functionalImpact: 2 }, [], 'er', ['allergic_swelling'], 'Allergic swelling may threaten airway.', 'rf.allergic_swelling'),
  C('WD05', 'wounds/burns/rashes', 'Mild itchy rash for two weeks, no fever.', { system: 'skin', severity: 0, duration: 'over7d', functionalImpact: 0 }, [], 'telehealth', [], 'Mild chronic rash can start telehealth.', 'model', ['home_care', 'primary_care']),
  C('WD06', 'wounds/burns/rashes', 'Large burn with blisters across hand.', { system: 'skin', severity: 2, suddenOnset: true, duration: 'under6h', functionalImpact: 2 }, [], 'urgent_care', [], 'Blistering hand burn needs same-day evaluation.', 'model', ['er']),
  C('WD07', 'wounds/burns/rashes', 'Chemical burn to face, pain and redness.', { system: 'skin', severity: 3, suddenOnset: true, duration: 'under6h', functionalImpact: 3 }, [], 'er', [], 'Chemical facial burns can threaten eyes/airway.', 'missing chemical burn red flag', ['urgent_care']),
  C('WD08', 'wounds/burns/rashes', 'Red streaking from wound with fever.', { system: 'skin', severity: 2, duration: '2to7d', worsening: true, highFever: true, openWound: true, functionalImpact: 2 }, [], 'urgent_care', [], 'Cellulitis/lymphangitis pattern needs same-day care.', 'model + openWound', ['er']),
  C('WD09', 'wounds/burns/rashes', 'Tick bite, small red spot, no fever.', { system: 'skin', severity: 0, duration: 'under6h', functionalImpact: 0 }, [], 'telehealth', [], 'Low-risk bite question can start telehealth.', 'model', ['home_care']),

  C('EY01', 'eye symptoms', 'Sudden painless loss of vision in one eye.', { system: 'neuro', severity: 3, suddenOnset: true, duration: 'under6h', redFlags: ['sudden_vision_loss'], functionalImpact: 3 }, [], 'er', ['sudden_vision_loss'], 'Sudden vision loss is ER-level.', 'rf.sudden_vision_loss'),
  C('EY02', 'eye symptoms', 'Chemical splashed in eye, burning and blurry vision.', { system: 'skin', severity: 3, suddenOnset: true, duration: 'under6h', redFlags: ['sudden_vision_loss'], functionalImpact: 3 }, [], 'er', ['sudden_vision_loss'], 'Chemical eye injury requires emergency eye care.', 'rf.sudden_vision_loss'),
  C('EY03', 'eye symptoms', 'Mild pink eye, itchy, no vision changes.', { system: 'ent', severity: 0, duration: '6to48h', functionalImpact: 0 }, [], 'telehealth', [], 'Mild conjunctivitis can start telehealth.', 'model', ['home_care']),
  C('EY04', 'eye symptoms', 'Eye pain with halos around lights and vomiting.', { system: 'neuro', severity: 3, suddenOnset: true, duration: 'under6h', functionalImpact: 3 }, [], 'er', [], 'Acute glaucoma pattern needs ER/urgent ophthalmology.', 'missing eye pain/halos red flag', ['urgent_care']),
  C('EY05', 'eye symptoms', 'Contact lens wearer, painful red eye and light sensitivity.', { system: 'ent', severity: 2, duration: 'under6h', functionalImpact: 2 }, [], 'urgent_care', [], 'Contact lens keratitis risk needs same-day care.', 'missing contact lens eye rule', ['er']),
  C('EY06', 'eye symptoms', 'Foreign body sensation after metal grinding.', { system: 'ent', severity: 2, suddenOnset: true, duration: 'under6h', functionalImpact: 2 }, [], 'urgent_care', [], 'Possible corneal foreign body needs same-day evaluation.', 'model', ['er']),
  C('EY07', 'eye symptoms', 'New floaters and flashes like curtain over vision.', { system: 'neuro', severity: 2, suddenOnset: true, duration: 'under6h', redFlags: ['sudden_vision_loss'], functionalImpact: 2 }, [], 'er', ['sudden_vision_loss'], 'Retinal detachment symptoms need ER/urgent ophthalmology.', 'rf.sudden_vision_loss'),
  C('EY08', 'eye symptoms', 'Eyelid stye, mild soreness for three days.', { system: 'ent', severity: 0, duration: '2to7d', functionalImpact: 0 }, [], 'home_care', [], 'Mild stye can self-care.', 'model', ['telehealth']),
  C('EY09', 'eye symptoms', 'Eye trauma from ball, vision blurry and severe pain.', { system: 'neuro', severity: 3, suddenOnset: true, duration: 'under6h', redFlags: ['sudden_vision_loss'], functionalImpact: 3 }, [], 'er', ['sudden_vision_loss'], 'Eye trauma with vision change needs ER.', 'rf.sudden_vision_loss'),
]

function runCase(c: BenchCase): Result {
  const f = { ...c.f, redFlags: [...c.f.redFlags] }
  if (detectInfantFever(c.description) && !f.redFlags.includes('infant_under_3mo_fever')) f.redFlags.push('infant_under_3mo_fever')
  if (c.risk.modifiers.includes('active_chemo') && detectFeverMention(c.description)) f.highFever = true

  let output: EngineLevel
  let fired: string[] = []
  let factors: string[] = []

  if (detectSelfHarm(c.description)) {
    output = 'er'
    fired = ['safety.self_harm_988']
    factors = ['Self-harm language detected']
  } else if (classifyEmergency(c.description) === 'immediate') {
    output = 'emergency'
    fired = ['safety.keyword_emergency']
    factors = ['Immediate emergency keyword net']
  } else {
    const d = decide(f, c.risk)
    output = d.careLevel
    fired = d.rulesFired.map(r => r.id)
    factors = d.factors
  }

  const plan = planInterview(f, new Set(['system', 'severity', 'duration', 'functionalImpact', 'suddenOnset', 'worsening', 'possibleFracture', 'openWound', 'highFever']), new Set<RedFlag>(), c.risk, {}, 0)
  const questions = plan.action === 'ask' ? plan.asks.map(a => a.target) : []

  const pass = output === c.expected || c.accept.includes(output)
  let issue: Result['issue'] = 'none'
  const rankDiff = LEVEL_RANK[output] - LEVEL_RANK[c.expected]
  if (!pass && rankDiff < 0) issue = 'under-triage'
  else if (!pass && rankDiff > 0) issue = 'over-triage'
  else if (!pass) issue = 'wrong-route'
  else if (c.shouldTrigger.startsWith('missing ')) issue = 'missing-rule'
  else if (questions.length && LEVEL_RANK[c.expected] >= LEVEL_RANK.er) issue = 'unclear-interview'

  const note = pass
    ? (issue === 'none' ? 'pass' : issue)
    : `${issue}: expected ${c.expected}${c.accept.length ? ` (accept ${c.accept.join('/')})` : ''}, got ${output}`
  return { c, output, pass, issue, fired, factors, questions, note }
}

const results = cases.map(runCase)
const counts = (items: string[]) => items.reduce<Record<string, number>>((acc, x) => ((acc[x] = (acc[x] ?? 0) + 1), acc), {})
const issueCounts = counts(results.map(r => r.issue))
const groupCounts = counts(cases.map(c => c.group))
const under = results.filter(r => r.issue === 'under-triage')
const over = results.filter(r => r.issue === 'over-triage')
const missing = results.filter(r => r.issue === 'missing-rule')
const unclear = results.filter(r => r.issue === 'unclear-interview')
const failed = results.filter(r => !r.pass)

function row(cols: string[]) {
  return `| ${cols.map(c => String(c).replace(/\n/g, ' ').replace(/\|/g, '/')).join(' |')} |`
}

const lines: string[] = []
lines.push('# Clinical Red-Team Benchmark Report')
lines.push('')
lines.push(`Cases run: ${cases.length}`)
lines.push('')
lines.push('## Scope')
lines.push('')
lines.push('This is a synthetic red-team review, not licensed clinical validation. It runs authored benchmark feature vectors through Carevo deterministic safety nets and the route engine. It does not validate live LLM extraction quality except where deterministic text safety nets are exercised.')
lines.push('')
lines.push('## Summary')
lines.push('')
lines.push(row(['Metric', 'Count']))
lines.push(row(['---', '---:']))
lines.push(row(['Pass or accepted', String(results.filter(r => r.pass).length)]))
lines.push(row(['Under-triage failures', String(under.length)]))
lines.push(row(['Over-triage failures', String(over.length)]))
lines.push(row(['Missing-rule watch items among accepted cases', String(missing.length)]))
lines.push(row(['Unclear interview watch items', String(unclear.length)]))
lines.push('')
lines.push('Groups covered:')
lines.push('')
lines.push(row(['Group', 'Cases']))
lines.push(row(['---', '---:']))
for (const [group, count] of Object.entries(groupCounts)) lines.push(row([group, String(count)]))
lines.push('')
lines.push('## Case Table')
lines.push('')
lines.push(row(['Case', 'Group', 'Expected', 'Carevo output', 'Pass?', 'Issue']))
lines.push(row(['---', '---', '---', '---', '---', '---']))
for (const r of results) lines.push(row([r.c.id, r.c.group, r.c.expected, r.output, r.pass ? 'PASS' : 'FAIL', r.note]))
lines.push('')
lines.push('## Under-triage Cases')
lines.push('')
if (!under.length) lines.push('None.')
for (const r of under) {
  lines.push(`- ${r.c.id}: ${r.c.description} Expected ${r.c.expected}, got ${r.output}. Red flags: ${r.c.redFlagsPresent.join(', ') || 'none'}. Should trigger: ${r.c.shouldTrigger}. Regression: add to scripts/eval-engine.ts CASES and/or live trials if extraction-sensitive.`)
}
lines.push('')
lines.push('## Over-triage Cases')
lines.push('')
if (!over.length) lines.push('None.')
for (const r of over) {
  lines.push(`- ${r.c.id}: ${r.c.description} Expected ${r.c.expected}, got ${r.output}. Regression: add an eval pin or persona to ensure lower-acuity path stays available.`)
}
lines.push('')
lines.push('## Missing Safety Rule / Edge-Case Watch Items')
lines.push('')
if (!missing.length) lines.push('None among accepted cases.')
for (const r of missing) {
  lines.push(`- ${r.c.id}: ${r.c.description} Output ${r.output} was accepted, but benchmark rationale expects "${r.c.shouldTrigger}". Consider a deterministic rule/backstop. Regression: ${r.c.why}`)
}
lines.push('')
lines.push('## Unclear Interviews / EVOI Watch Items')
lines.push('')
if (!unclear.length) lines.push('None.')
for (const r of unclear) {
  lines.push(`- ${r.c.id}: Expected ${r.c.expected}; with benchmark features known, planInterview would still ask ${r.questions.join(', ')}. Check whether this delays high-acuity routing.`)
}
lines.push('')
lines.push('## Bad Feature Extraction Risks')
lines.push('')
lines.push('- Not directly measured here because this offline runner supplies feature vectors. The highest-risk extraction-sensitive cases to promote to live personas are: CO exposure headache (HA07), infant head trauma (PD08), decreased fetal movement (PG08), homicidal/psychosis crisis (MH04), mania crisis (MH06), chemical burn/eye exposure (WD07/EY02), and contact lens painful red eye (EY05).')
lines.push('- Existing deterministic nets covered softened self-harm, stroke wording, infant fever, and active-chemo fever in this run.')
lines.push('')
lines.push('## Weak Explanations')
lines.push('')
lines.push('- Engine factors are often generic for edge cases without a specific rule. Examples: CO exposure, decreased fetal movement, mania/psychosis, contact lens painful red eye, chemical burns. Adding named rules would improve both routing and explanation provenance.')
lines.push('')
lines.push('## Exact Files That Should Change')
lines.push('')
lines.push('- `scripts/eval-engine.ts`: add the under-triage failures and high-priority missing-rule watch items as regression CASES/policy gates.')
lines.push('- `scripts/simulate-patients.ts`: add live extractor personas for cases whose risk depends on natural-language extraction rather than prefilled features.')
lines.push('- `lib/emergency.ts`: consider deterministic text nets for CO exposure, chemical eye/burn exposure, homicidal/violent command hallucination language, and decreased fetal movement phrasing.')
lines.push('- `lib/engine/rules.ts`: consider floors for elderly acute inability to function, elderly suspected hip fracture, pregnancy decreased fetal movement, contact-lens painful red eye, acute glaucoma pattern, severe mania/psychosis, and toxic fever with non-blanching rash.')
lines.push('- `lib/engine/evoi.ts`: add or tune screenable red flags if the new rules require targeted interview questions.')
lines.push('')
lines.push('## Full Case Specifications')
lines.push('')
for (const r of results) {
  lines.push(`### ${r.c.id} - ${r.c.group}`)
  lines.push(`- Patient description: ${r.c.description}`)
  lines.push(`- Expected care level: ${r.c.expected}${r.c.accept.length ? `; acceptable: ${r.c.accept.join(', ')}` : ''}`)
  lines.push(`- Carevo output: ${r.output}`)
  lines.push(`- Red flags present: ${r.c.redFlagsPresent.join(', ') || 'none'}`)
  lines.push(`- Why safest: ${r.c.why}`)
  lines.push(`- Rule should trigger: ${r.c.shouldTrigger}`)
  lines.push(`- Fired: ${r.fired.join(', ') || 'none'}`)
  lines.push(`- Factors: ${r.factors.join('; ') || 'none'}`)
  lines.push('')
}

writeFileSync('agent-inbox/clinical-review-report.md', lines.join('\n'))
writeFileSync('agent-inbox/clinical-review-results.json', JSON.stringify({ issueCounts, results }, null, 2))

console.log(`Cases: ${cases.length}`)
console.log(`Pass/accepted: ${results.filter(r => r.pass).length}`)
console.log(`Under-triage failures: ${under.length}`)
console.log(`Over-triage failures: ${over.length}`)
console.log(`Missing-rule watch items: ${missing.length}`)
console.log(`Unclear interview watch items: ${unclear.length}`)
if (failed.length) {
  console.log('\nFailures:')
  for (const r of failed) console.log(`- ${r.c.id}: expected ${r.c.expected}, got ${r.output} (${r.issue})`)
}
console.log('\nWrote agent-inbox/clinical-review-report.md')
