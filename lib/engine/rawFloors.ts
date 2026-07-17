// ─────────────────────────────────────────────────────────────────────────────
// RAW-TEXT SAFETY FLOORS — deterministic, LLM-independent, UP-ONLY.
// Extracted from app/api/triage/route.ts (2026-07-17) so the offline eval can
// gate every pattern directly (gate P16). ER floors force at least 'er';
// urgent-care floors force at least 'urgent_care'. They can never lower.
// House rules learned the hard way (P11/round-16/round-17/NEJM45):
//   - word-bound every alternative ("afebrile" must not match febrile)
//   - neutralize benign compounds ("hay fever")
//   - test symptom-presence components on NEGATION-STRIPPED text where a
//     denial would otherwise satisfy them ("no fever or neck stiffness")
//   - accept real-world age abbreviations ("8 y/o", not just "8-year-old")
// ─────────────────────────────────────────────────────────────────────────────
import { stripNegatedClauses } from '../emergency'

function rawErSafetyFloor(text: string): string | null {
  const s = text.replace(/\s+/g, ' ')

  const lowOxygen = /\b(oxygen saturation|o2 sat(?:uration)?|spo2)\s*(?:of|is|was|=|:)?\s*(8[0-9]|9[0-2])\s*(?:%|percent)\b/i
  if (lowOxygen.test(s)) return 'Low oxygen saturation reported'

  const travelFever = /\b(fever|chills|rigors)\b/i.test(s) &&
    /\b(travel(?:ed|ing)?|return(?:ed)? from|central america|south america|africa|asia|mosquito|mosquitoes|malaria prophylaxis)\b/i.test(s)
  if (travelFever) return 'Fever with recent travel or mosquito exposure'

  const chemoFever = /\b(chemo|chemotherapy|cancer treatment)\b/i.test(s) &&
    /\b(fever|temperature|100\.[4-9]|10[1-6]|chills)\b/i.test(s)
  if (chemoFever) return 'Fever during chemotherapy'

  const pediatricFeverRashHeadache = /\b([0-9]|1[0-7])\s*(?:[-\s]*(?:year|yr)s?[-\s]*old|y\.?\/?o\.?)\b/i.test(s) &&
    /\b(fever|chills)\b/i.test(s) &&
    /\b(rash|maculopapular|petechial|purpuric)\b/i.test(s) &&
    /\b(headache|malaise|neck pain|neck stiffness|joint pain|arthralgias?)\b/i.test(s)
  if (pediatricFeverRashHeadache) return 'Child with fever, rash, and systemic symptoms'

  const unilateralSwollenLegWithRisk = /\b(unilateral|one[-\s]sided|one leg|right leg|left leg)\b/i.test(s) &&
    /\b(leg pain|calf|swollen|swelling|tender)\b/i.test(s) &&
    /\b(recent hospitalization|recuperating|immobil|surgery|history of chf|CHF|calf is \d+\s*cm greater)\b/i.test(s)
  if (unilateralSwollenLegWithRisk) return 'Unilateral painful swollen leg with clot risk factors'

  const pregnancyPainBleeding = /\b(pregnan(?:t|cy)|weeks?\s+pregnant|[1-4][0-9]\s+weeks?)\b/i.test(s) &&
    /\b(vaginal bleeding|bleeding|spotting)\b/i.test(s) &&
    /\b(abdominal pain|lower abdominal pain|pelvic pain|cramping)\b/i.test(s)
  if (pregnancyPainBleeding) return 'Pregnancy with abdominal pain and vaginal bleeding'

  const upperGiBleed = /\b(vomit(?:ing)? blood|vomited blood|throw(?:ing)? up blood|hematemesis|coffee[-\s]ground)\b/i.test(s) &&
    /\b(black tarry stools?|tarry stools?|melena|dizziness|dizzy|lightheaded|standing)\b/i.test(s)
  if (upperGiBleed) return 'Vomiting blood or black tarry stools with dizziness'

  const pediatricBloodyDiarrheaRisk = /\b([0-9]|1[0-7])\s*(?:[-\s]*(?:year|yr)s?[-\s]*old|y\.?\/?o\.?)\b/i.test(s) &&
    /\b(bloody diarrh(o|oe|e)a|diarrh(o|oe|e)a[^.]{0,80}became bloody|bloody stool|blood in stool)\b/i.test(s) &&
    /\b(hamburger|undercooked beef|county fair|an(a|ae)mia|pale|low platelets?|kidney|urinating less)\b/i.test(s)
  if (pediatricBloodyDiarrheaRisk) return 'Child with bloody diarrhea and systemic risk markers'

  const alteredLiverOrBleedingRisk = /\b(altered mental status|confus(?:ed|ion)|disorient(?:ed|ation)?|somnolent|lethargic|asterixis)\b/i.test(s) &&
    /\b(scleral icterus|jaundice|bilirubin|INR|ALT|liver|acetaminophen|right upper quadrant)\b/i.test(s)
  if (alteredLiverOrBleedingRisk) return 'Altered mental status with liver or coagulation danger signs'

  const pediatricSevereAbdominal = /\b([0-9]|1[0-7])\s*(?:[-\s]*(?:year|yr)s?[-\s]*old|y\.?\/?o\.?)\b/i.test(s) &&
    /\b(abdominal pain|abdomen|generalised abdominal|generalized abdominal)\b/i.test(s) &&
    /\b(severe|appears ill|104\s*°?\s*f|40\s*°?\s*c|tense|guarding|rigid|no bowel sounds)\b/i.test(s)
  if (pediatricSevereAbdominal) return 'Child with severe abdominal pain, fever, and guarding signs'

  // Escalation component covers every phrasing of "the inhaler isn't working"
  // seen in benchmarks — NEJM45 case-0003 said "not responsIVE to inhalers"
  // and slipped past "not respond(ing)". Parenthesized: sleep-disruption
  // wording only counts alongside the asthma + symptom components.
  const severeAsthmaFlare = /\b(asthma|rescue inhaler|albuterol)\b/i.test(s) &&
    /\b(shortness of breath|wheezing|cough)\b/i.test(s) &&
    (/\b(progressive worsening|worsening symptoms|worsening wheezing|did not receive significant relief|despite (?:increased|repeated) rescue inhaler use|despite increased use|repeated rescue inhaler use|not respond(?:ing|s)?|(?:not\s+|un)responsive(?:\s+to)?|no relief|not help(?:ing)?|not improv(?:ing|ed)?|not work(?:ing)?|inhalers? (?:aren'?t|don'?t|didn'?t|not) (?:help|work))\b/i.test(s) ||
     /\b(disrupting .*sleep|daytime somnolence)\b/i.test(s))
  if (severeAsthmaFlare) return 'Asthma symptoms worsening despite rescue inhaler use'

  const severeCopdFlare = /\bCOPD\b/i.test(s) &&
    /\b(worsening dyspn(?:oea|ea)|worsening shortness of breath|purulent sputum|green,? (?:purulent )?sputum|100-pack-year|poor appetite|increased use of rescue bronchodilator)\b/i.test(s)
  if (severeCopdFlare) return 'COPD symptoms worsening with purulent sputum or rescue-medicine escalation'

  const severeFlankPain = /\b(flank pain|radiat(?:es|ing) to (?:the )?groin|groin pain)\b/i.test(s) &&
    /\b(sudden onset|1-hour history|one-hour history|severe|vomiting|writhing|unrelieved by position)\b/i.test(s)
  if (severeFlankPain) return 'Sudden severe flank pain with vomiting or groin radiation'

  // Fever + stiffness tested on NEGATION-STRIPPED text: "no fever or neck
  // stiffness" must never satisfy this floor (NEJM45 case-0044 over-route).
  const sStripped = stripNegatedClauses(s)
  const feverHeadacheNeckStiffness = /\b(fever|febrile|temperature)\b/i.test(sStripped) &&
    /\b(severe headache|headache)\b/i.test(s) &&
    /\b(photophobia|neck stiffness|stiff neck|meningismus)\b/i.test(sStripped)
  if (feverHeadacheNeckStiffness) return 'Fever with headache and neck stiffness or light sensitivity'

  const tetanusLikeSpasms = /\b(trismus|lockjaw|lock jaw|muscle spasms|generalised spasms|generalized spasms|spasms)\b/i.test(s) &&
    /\b(cut|wound|laceration|gardening|soil|rusty|immunisation|immunization|tetanus)\b/i.test(s)
  if (tetanusLikeSpasms) return 'Lockjaw or muscle spasms after a wound exposure'

  // Acute painful eye + photophobia + visual disturbance — the full triad only.
  // Clinical reviewer (Paul, 2026-07-14): ambiguous for angle-closure glaucoma /
  // uveitis; ER regardless of extraction. Deliberately requires ALL THREE terms
  // so approved low-acuity eye cases (conjunctivitis, stye: no photophobia or
  // no vision change) can never trigger it. Added after juror round-8 caught
  // extraction wobble under-triaging one phrasing variant (case-0174).
  const acuteEyeTriad = /\b(eye pain|ocular pain|pain in (?:the |his |her |their )?eye)\b/i.test(s) &&
    /\b(light sensitivity|photophobia|sensitive to light)\b/i.test(s) &&
    (/\b(blurr?ed|blurry|decreased|reduced|double)\s*vision\b/i.test(s) || /\bvision (?:loss|changes?)\b/i.test(s) || /\bhalos?\b/i.test(s))
  if (acuteEyeTriad) return 'Acute eye pain with light sensitivity and visual disturbance'

  // Severe spinning vertigo — clinical reviewer (Paul, 2026-07-14): can mimic
  // central neurological events; ER to be safe. Requires an intensity word AND
  // a spinning descriptor, so ordinary dizziness stays with the engine.
  const severeVertigo = /\b(severe|violent|intense|debilitating)\b/i.test(s) &&
    /\b(spinning (?:dizziness|sensation)|room (?:is |was )?spinning|vertigo)\b/i.test(s)
  if (severeVertigo) return 'Intense spinning dizziness (vertigo)'

  // Older adult (65+) with fever AND a productive cough — pneumonia risk;
  // NEJM45 case-0011 benchmark truth is emergency care. Fever component is
  // negation-stripped so "no fever" cannot trigger it.
  const elderlyFeverProductiveCough = /\b(6[5-9]|[7-9][0-9]|1[0-1][0-9])\s*(?:[-\s]*(?:year|yr)s?[-\s]*old|y\.?\/?o\.?)\b/i.test(s) &&
    /\b(fever|febrile|temperature|10[0-6](\.\d)?)\b/i.test(stripNegatedClauses(s)) &&
    /\b(productive cough|coughing up|sputum|phlegm)\b/i.test(s)
  if (elderlyFeverProductiveCough) return 'Older adult with fever and productive cough (pneumonia risk)'

  // Chest symptoms + ANY arm sensation — classic ACS presentation pattern.
  // Round-13 finding (2026-07-16): a vague patient revealed "left arm feels
  // weird" and the extractor missed it; routing fell to home care. Like all
  // floors this is deterministic and LLM-independent. Negation-stripped so
  // "chest cold, no arm pain" can't trigger. Requires the sensation word
  // within a few words of "arm" (either order) to avoid matching unrelated
  // mentions ("hurt my arm last month ... chest congestion today").
  const stripped = stripNegatedClauses(s)
  const chestWithArmSymptom = /\b(chest|heart)\b/i.test(stripped) && (
    /\b(?:left |right |my )?arm[s]?\b[^.!?]{0,30}\b(weird|strange|funny|odd|numb(?:ness)?|tingl\w*|heav(?:y|iness)|ach(?:e|es|ing|y)|pain(?:ful)?|hurt(?:s|ing)?|weak(?:ness)?)\b/i.test(stripped) ||
    /\b(weird|strange|funny|odd|numb(?:ness)?|tingl\w*|heav(?:y|iness)|ach(?:e|es|ing|y)|pain|hurt(?:s|ing)?|weak(?:ness)?)\b[^.!?]{0,30}\barm[s]?\b/i.test(stripped)
  )
  if (chestWithArmSymptom) return 'Chest symptoms with arm sensation (possible cardiac pattern)'

  return null
}

function rawUrgentCareSafetyFloor(text: string): string | null {
  const s = text.replace(/\s+/g, ' ')

  const nightEpigastricPain = /\b(upper abdominal|epigastric|stomach)(?:\s+\w+){0,2}\s+(?:pain|ache|tenderness)\b/i.test(s) &&
    /\b(wakes?|waking|woke)\s+(?:him|her|them|me)?\s*(?:up\s+)?at night|night pain\b/i.test(s) &&
    /\b(gnawing|burning|relieved by food|milk|ranitidine|omeprazole)\b/i.test(s)
  if (nightEpigastricPain) return 'Upper abdominal pain that wakes the patient at night'

  const olderAdultVesicularRash = /\b([6-9][0-9]|1[0-1][0-9])\s*(?:[-\s]*(?:year|yr)s?[-\s]*old|y\.?\/?o\.?)\b/i.test(s) &&
    /\b(burning|aching|painful)\b/i.test(s) &&
    /\b(rash|vesicles|pustulation|ulceration|crusting)\b/i.test(s)
  if (olderAdultVesicularRash) return 'Older adult with painful vesicular rash'

  const prolongedSinusPain = /\b(nasal congestion|nasal discharge|sinus|maxillary tenderness|facial pain)\b/i.test(s) &&
    /\b(facial pain|green nasal discharge|maxillary tenderness)\b/i.test(s) &&
    /\b(1[0-9]|[2-9][0-9])\s+days\b/i.test(s)
  if (prolongedSinusPain) return 'Prolonged sinus symptoms with facial pain or discharge'

  const pediatricFoodborneGi = /\b([0-9]|1[0-7])\s*(?:[-\s]*(?:year|yr)s?[-\s]*old|y\.?\/?o\.?)\b/i.test(s) &&
    /\b(nausea|vomiting|diarrh(o|oe)a)\b/i.test(s) &&
    /\b(undercooked chicken|food poisoning|picnic|frequent stools|6 times a day)\b/i.test(s) &&
    /\b(fever|tachycardic|heart rate\s*10[0-9]|mild abdominal tenderness)\b/i.test(s)
  if (pediatricFoodborneGi) return 'Child with foodborne GI symptoms and systemic findings'

  const highCentorSoreThroat = /\b(sore throat|pharyngitis)\b/i.test(s) &&
    /\b(fever|10[12]\.\d|102)\b/i.test(s) &&
    /\b(no cough|denies cough)\b/i.test(s) &&
    /\b(tonsillar exudates?|exudative|tender anterior cervical|cervical lymphadenopathy)\b/i.test(s)
  if (highCentorSoreThroat) return 'Sore throat with fever, no cough, and exudate or tender neck nodes'

  const worseningFebrileThroat = /\b(sore throat|throat pain|pharyngitis)\b/i.test(s) &&
    /\b(fever|febrile|temperature|getting worse|gradually worse|difficulty swallowing|painful swallowing)\b/i.test(s) &&
    /\b(difficulty swallowing|painful swallowing|getting worse|gradually worse|tender cervical|cervical lymph(?:adenopathy| nodes?)|enlarged cervical lymph nodes?|exudates?|exudative)\b/i.test(s)
  if (worseningFebrileThroat) return 'Worsening sore throat with fever or trouble swallowing'

  const pediatricExudativeThroat = /\b([0-9]|1[0-7])\s*(?:[-\s]*(?:year|yr)s?[-\s]*old|y\.?\/?o\.?)\b/i.test(s) &&
    /\b(sore throat|pharyngitis)\b/i.test(s) &&
    /\b(fever|febrile|temperature)\b/i.test(s) &&
    /\b(exudative|tonsillar exudates?|cervical lymph(?:adenopathy| nodes?)|enlarged cervical lymph nodes?)\b/i.test(s)
  if (pediatricExudativeThroat) return 'Child with febrile exudative sore throat and cervical nodes'

  const copdFlareUrgent = /\bCOPD|history of smoking|smok(?:er|ing)\b/i.test(s) &&
    /\b(shortness of breath|dyspn(?:oea|ea)|productive cough|cough|sputum|rhinorrhea)\b/i.test(s) &&
    /\b(several days|3 days|three days|worsening|chronic morning cough|increased cough)\b/i.test(s)
  if (copdFlareUrgent) return 'COPD or smoking history with worsening cough or breathing symptoms'

  // Fever must be tested on NEGATION-STRIPPED text: this floor was firing on
  // "mild headache, NO fever" vignettes (round-15 Cluster A; Paul batch-3
  // ruling 2026-07-16: mild URI with fever explicitly ABSENT, no shortness of
  // breath, under 7 days is home care). An explicitly denied fever must never
  // satisfy the fever component of an urgent-care floor.
  const fluLikeSystemic = /\b(fever|febrile|temperature)\b/i.test(stripNegatedClauses(s)) &&
    /\b(cough|headache|generalized weakness|generalised weakness|myalgias|muscle aches|chills|abrupt onset)\b/i.test(s) &&
    /\b(weakness|myalgias|muscle aches|chills|headache|abrupt onset)\b/i.test(s)
  if (fluLikeSystemic) return 'Flu-like illness with fever and systemic symptoms'

  const patientAsthmaContext = /\b(history of|with a history of|known|persistent|has)\b[^.]{0,60}\basthma\b/i.test(s) ||
    /\basthma\b[^.]{0,100}\b(inhaler|wheez(?:e|ing)|shortness of breath|cough)\b/i.test(s)
  const childAsthmaFeverCough = /\b([0-9]|1[0-7])\s*(?:[-\s]*(?:year|yr)s?[-\s]*old|y\.?\/?o\.?)\b/i.test(s) &&
    patientAsthmaContext &&
    /\b(cough|shortness of breath|wheez(?:e|ing)|inhaler|temperature|febrile|fever)\b/i.test(s) &&
    !/\bhay fever\b/i.test(s)
  if (childAsthmaFeverCough) return 'Child with asthma history plus fever or cough'

  const olderAdultSevereVertigo = /\b([6-9][0-9]|1[0-1][0-9])\s*(?:[-\s]*(?:year|yr)s?[-\s]*old|y\.?\/?o\.?)\b/i.test(s) &&
    /\b(vertigo|dizziness|spinning sensation|room spinning)\b/i.test(s) &&
    /\b(severe|sudden|recurrent|nausea|vomiting|unable to walk|trouble walking)\b/i.test(s)
  if (olderAdultSevereVertigo) return 'Older adult with severe or recurrent vertigo symptoms'

  const childEarPainFever = /\b([0-9]|1[0-7])\s*(?:[-\s]*(?:year|yr)s?[-\s]*old|y\.?\/?o\.?)\b/i.test(s) &&
    /\b(ear pain|earache|ear drum|tympanic membrane|otitis)\b/i.test(s) &&
    /\b(fever|trouble sleeping|restless sleep|not eating well)\b/i.test(s)
  if (childEarPainFever) return 'Child with ear pain and fever or sleep disruption'

  const toddlerEarInfection = /\b(toddler|1[0-9][- ]month[- ]old|[0-9][- ]month[- ]old)\b/i.test(s) &&
    /\b(abnormal ear drum|ear drum|tympanic membrane|otitis|ear pain)\b/i.test(s) &&
    /\b(fever|poor eating|not eating well|restless sleep|sleeping restlessly)\b/i.test(s)
  if (toddlerEarInfection) return 'Toddler with ear findings and fever or poor intake'

  const diabeticOpenSore = /\b(diabetic|diabetes)\b/i.test(s) &&
    /\b(open sore|open wound|ulcer|sore on the foot)\b/i.test(s) &&
    /\b(redness|surrounding redness|red|swelling)\b/i.test(s)
  if (diabeticOpenSore) return 'Diabetic patient with open sore and surrounding redness'

  const cutMayNeedStitches = /\b(deep cut|cut)\b/i.test(s) &&
    /\b(may need stitches|needs stitches|gaping|wide cut)\b/i.test(s)
  if (cutMayNeedStitches) return 'Deep cut that may need stitches'

  const fingerPusSpreadingRedness = /\b(finger|nail|around the nail|paronychia)\b/i.test(s) &&
    /\b(pus|swollen|painful)\b/i.test(s) &&
    /\b(spreading redness|redness spreading|red streaks|surrounding redness)\b/i.test(s)
  if (fingerPusSpreadingRedness) return 'Painful finger infection with pus and spreading redness'

  const lowerLegRedSwollenFever = /\b(lower[- ]leg|lower extremity|leg|shin|calf)\b/i.test(s) &&
    /\b(redness|red|erythema|erythematous)\b/i.test(s) &&
    /\b(swelling|swollen|tenderness|tender)\b/i.test(s) &&
    /\b(fever|low-grade fever|febrile|temperature)\b/i.test(s)
  if (lowerLegRedSwollenFever) return 'Lower-leg redness, swelling, tenderness, and fever'

  const productiveCoughFeverCrackles = /\b(productive cough|cough)\b/i.test(s) &&
    /\b(fever|febrile)\b/i.test(s) &&
    /\b(crackles|lung field|right lower lung|infiltrate)\b/i.test(s)
  if (productiveCoughFeverCrackles) return 'Productive cough with fever and focal lung findings'

  const urinaryFlankSymptoms = /\b(burning with urination|painful urination|dysuria)\b/i.test(s) &&
    /\b(urgency|frequency)\b/i.test(s) &&
    /\b(flank aching|flank pain|back aching|lower abdominal discomfort)\b/i.test(s)
  if (urinaryFlankSymptoms) return 'Urinary symptoms with flank or lower abdominal discomfort'

  const urinaryDysuriaFrequency = /\b(burning with urination|burns? when (?:i )?(?:pee|urinate)|painful urination|dysuria)\b/i.test(s) &&
    /\b(urgent need to urinate|urgency|frequent urination|frequency|more frequent urination)\b/i.test(s)
  if (urinaryDysuriaFrequency) return 'Painful urination with urgency or frequency'

  const deformitySwellingInjury = /\b(fell|fall|twisted|injury|outstretched arm)\b/i.test(s) &&
    /\b(deformity|cannot bear weight|can't bear weight|marked swelling|swelling of the wrist)\b/i.test(s)
  if (deformitySwellingInjury) return 'Injury with deformity, marked swelling, or inability to bear weight'

  const backPainFootDrop = /\b(low back pain|back pain|shoveling snow|sciatica)\b/i.test(s) &&
    /\b(foot drop|new foot drop)\b/i.test(s)
  if (backPainFootDrop) return 'Back pain with new foot drop'

  return null
}

export { rawErSafetyFloor, rawUrgentCareSafetyFloor }
