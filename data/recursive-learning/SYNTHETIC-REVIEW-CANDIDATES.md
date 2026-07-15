# Synthetic Review Candidates — Pending Human Approval

Generated: 2026-07-11  
Status: **NOT approved training data.** You must mark each case before any are included.

## Why these were generated

The 240-case benchmark dataset has been fully exhausted:
- 26 approved rows (from the high-priority + medium-priority PDF review)
- 51 rejected rows — ALL remaining medium-priority cases were correctly routing ACS, stroke, PE, anaphylaxis, and GI bleed to Emergency. Those are **correct** Carevo decisions and must not be downgraded.
- 8 cases on hold for clinician review (sudden eye pain bundles, severe dizziness bundles)

To reach 100+ approved rows for a useful first training experiment, 80 new synthetic vignettes were created across the 9 learned patterns. Each follows the same structure as the original high-priority cases.

## Reviewer Instructions

For each case, mark one of:
- `✅ Approve` — the routing target and safety note are clinically correct
- `❌ Reject` — do not use as a training example
- `⏸ Needs clinician` — unclear without specialist input

**Safety rule**: Never approve a case that involves or implies:
- Chest pain with radiation, diaphoresis, or jaw pain
- Sudden neurologic deficits (facial droop, weakness, speech)
- Breathing difficulty or oxygen saturation concerns
- Any finding that would trigger an emergency hard stop
- Pediatric under 3 months
- Pregnancy complications
- Immunocompromise

---

## Pattern 1: Home care — allergic rhinitis without infection flags
*Teaching goal: seasonal/perennial sneezing, nasal itching, watery eyes with no fever or infection signs stays home care*

### syn-001
**Vignette:** A 28-year-old teacher has had sneezing fits, runny nose, and itchy eyes every spring for the past four years. No fever, no facial pain, and no thick yellow discharge.  
**Target:** home care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

### syn-002
**Vignette:** The patient says: I've had a stuffy nose and eye itching every time I mow the lawn for as long as I can remember. No fever. No sinus pain.  
**Target:** home care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

### syn-003
**Vignette:** A family member reports that a 16-year-old has been sneezing constantly since they got a new cat two weeks ago. Eyes are watery and itchy. No fever, no facial pressure, no colored discharge.  
**Target:** home care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

### syn-004
**Vignette:** In a triage intake: a 41-year-old office worker has had nasal congestion and sneezing every fall for several years. Antihistamines help. No fever, no ear pain, no tooth pain.  
**Target:** home care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

### syn-005
**Vignette:** A 33-year-old has post-nasal drip and frequent sneezing that gets worse outdoors. She uses nasal saline rinses. No fever, no thick green mucus, no pain.  
**Target:** home care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

### syn-046
**Vignette:** A 37-year-old has sneezing fits, runny nose, and mild eye itching every time she visits her parents' house. They have multiple pets. No fever, no facial pain, no thick colored discharge.  
**Target:** home care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

### syn-047
**Vignette:** In a triage intake: a 12-year-old gets a stuffy itchy nose every time they're around freshly cut grass. Symptoms resolve indoors. No fever, no ear pain, no sinus pressure.  
**Target:** home care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

### syn-060
**Vignette:** A 20-year-old moved to a new city and has had constant sneezing and nasal congestion for weeks. Allergist diagnosed allergic rhinitis last year. No fever, no facial pressure, no colored discharge.  
**Target:** home care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

### syn-064
**Vignette:** A family member reports that a 9-year-old has been rubbing their nose constantly and sneezing since school started. Eyes also look irritated and itchy. No fever, no colored mucus, no ear complaints.  
**Target:** home care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

### syn-071
**Vignette:** A 45-year-old has chronic nasal congestion and post-nasal drip that gets worse in dry heated offices. No fever, no facial pressure or pain, no discolored discharge.  
**Target:** home care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

---

## Pattern 2: Home care — mild vomiting with fluids tolerated
*Teaching goal: 1-3 vomiting episodes with fluids staying down, no blood, no dehydration, no severe pain stays home care*

### syn-006
**Vignette:** A 25-year-old vomited once after eating sushi last night. Feeling queasy but has kept down water and crackers this morning. No blood, no fever, no stomach pain beyond mild nausea.  
**Target:** home care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

### syn-007
**Vignette:** The patient says: I threw up twice overnight, probably a stomach bug going around work. I've been sipping Gatorade all morning and it's staying down. No blood, temperature is 99.1, mild cramping only.  
**Target:** home care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

### syn-008
**Vignette:** In a triage intake: an 18-year-old vomited three times after a party last night. Now drinking water and it is staying down. No fever, no abdominal pain, no blood in vomit.  
**Target:** home care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

### syn-009
**Vignette:** A family member reports that a 10-year-old vomited twice this morning but has been sipping apple juice and keeping it down. Mild stomach ache, no fever above 99, no blood.  
**Target:** home care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

### syn-010
**Vignette:** A 52-year-old vomited twice after a rich holiday dinner. Nausea has mostly resolved. Can keep clear fluids down. No fever, no blood, no severe abdominal pain.  
**Target:** home care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

### syn-054
**Vignette:** A 7-year-old vomited twice and had loose stools this morning. Now resting and able to keep popsicles down. Mild fever of 100.2°F. No blood, no severe stomach pain.  
**Target:** home care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

### syn-055
**Vignette:** The patient says: I woke up nauseated and vomited once. I think I ate something bad last night. Feeling better now, drinking water, keeping it down. No fever, no pain, no blood.  
**Target:** home care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

### syn-063
**Vignette:** A 40-year-old vomited twice after starting a new antibiotic. Nausea has improved. Drinking water and it is staying down. No blood, no fever, no abdominal pain.  
**Target:** home care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

### syn-068
**Vignette:** In a triage intake: a 65-year-old vomited once and felt nauseous after taking iron supplements on an empty stomach. Nausea resolved after eating. No blood, no fever, no abdominal pain.  
**Target:** home care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

### syn-075
**Vignette:** A 32-year-old vomited twice during a migraine. Now the headache is improving and they can keep small sips of water down. No blood, no fever, no abdominal pain separate from the headache.  
**Target:** home care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

---

## Pattern 3: Home care — mild eye irritation without vision or trauma flags
*Teaching goal: red/watery/crusty eyes without vision change, photophobia, severe pain, or trauma stays home care*

### syn-011
**Vignette:** A 9-year-old woke up with both eyes crusty and stuck shut. Eyes are red and watery. Had a cold last week. No vision change, no pain, no trauma.  
**Target:** home care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

### syn-012
**Vignette:** The patient says: my right eye has been red and gritty for two days. No blurry vision, no sensitivity to light, no injury, no contact lenses.  
**Target:** home care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

### syn-013
**Vignette:** In a triage intake: a 6-year-old has had yellow discharge from one eye for one day. Eye is red. No vision complaints, no fever, no trauma, no contact lenses.  
**Target:** home care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

### syn-014
**Vignette:** A 44-year-old has seasonal watery itchy eyes every spring. Both eyes affected, mild redness. No pain, no vision change, no trauma.  
**Target:** home care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

### syn-015
**Vignette:** A family member reports that a 5-year-old has pink eyes stuck shut each morning for two days, started after the child at daycare had the same thing. No pain, no vision concerns, no fever.  
**Target:** home care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

### syn-044
**Vignette:** A 31-year-old has had mild eye irritation and redness in both eyes for two days after working in a dusty environment. No vision change, no pain beyond mild grittiness, no trauma.  
**Target:** home care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

### syn-045
**Vignette:** A 50-year-old frequently wakes up with dry, mildly red eyes that improve after blinking. Has had this for months. No pain, no vision change, no discharge, no photophobia.  
**Target:** home care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

### syn-056
**Vignette:** A 38-year-old has had itchy red eyes since starting to work from home with more screen time. Uses artificial tears which help. No pain, no vision change, no photophobia.  
**Target:** home care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

### syn-057
**Vignette:** In a triage intake: a 7-year-old has one eye that has been pink and slightly crusty since yesterday after their daycare had a pink eye outbreak. No severe pain, no vision change, no fever.  
**Target:** home care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

### syn-070
**Vignette:** A 15-year-old has been having red watery eyes after playing video games for hours. The eyes feel better after rest. No pain, no vision change, no discharge.  
**Target:** home care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

### syn-076
**Vignette:** A 22-year-old wears glasses but recently tried non-prescription decorative contacts at a costume party. Eyes have been mildly red and irritated since. Not wearing them anymore. No pain, no vision change.  
**Target:** home care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

---

## Pattern 4: Home care — chronic eczema/atopic rash without infection flags
*Teaching goal: known eczema flares with denied fever, pus, red streaks, and severe pain stay home care*

### syn-016
**Vignette:** A 19-year-old college student has had dry itchy patches behind both knees since childhood. Flares during stress. No fever, no open wounds, no pus, no spreading redness.  
**Target:** home care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

### syn-017
**Vignette:** The patient says: I have eczema and it flared up on my arms after I changed laundry detergent. Red, itchy, and dry. No pus, no fever, no red lines going up my arm.  
**Target:** home care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

### syn-018
**Vignette:** In a triage intake: an 8-year-old with known eczema and hay fever has itchy dry skin on their elbows that has been scratched. No pus, no fever, no red streaks, no severe pain.  
**Target:** home care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

### syn-019
**Vignette:** A family member reports that a 10-year-old with atopic history has very dry itchy skin that cracks in winter. No pus, no fever, no red streaks, no swelling beyond the rash itself.  
**Target:** home care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

### syn-020
**Vignette:** A 35-year-old has had dry itchy flexural skin since their teens. Currently flared on the wrists and neck. Denies fever, pus, severe pain, or red streaks extending from the rash.  
**Target:** home care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

### syn-050
**Vignette:** A 27-year-old with a history of eczema has a flare on the backs of their hands after exposure to cold dry weather. Itchy, cracked, dry. No pus, no fever, no spreading red streaks.  
**Target:** home care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

### syn-051
**Vignette:** In a triage intake: a 6-year-old with known atopic dermatitis has a new flare on the face and neck. Red, itchy, no crusting with yellow fluid, no fever, no rapid spread.  
**Target:** home care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

### syn-058
**Vignette:** A 30-year-old has had itchy dry skin behind the ears and on the scalp since childhood. Currently flared. No pus, no fever, no rapidly spreading redness, no pain beyond itching.  
**Target:** home care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

### syn-065
**Vignette:** A 23-year-old with asthma and atopic history has a skin flare on their forearms after a stressful week. Dry and itchy. No pus, no fever, no red streaks, no spreading beyond the existing patches.  
**Target:** home care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

### syn-072
**Vignette:** A 40-year-old with atopic history notices dry itchy patches on the inner wrists every winter. Currently active. No pus, no fever, no systemic symptoms, no streaking redness.  
**Target:** home care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

### syn-078
**Vignette:** A 16-year-old has had itchy inflamed skin in the elbow creases and behind the knees since age 4. Current flare is mild. No pus, no fever, no red streaks, no severe pain.  
**Target:** home care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

---

## Pattern 5: Home care — mechanical back pain without neurologic flags
*Teaching goal: exertion/positional low back pain with denied leg symptoms, weakness, bladder changes, and fever stays home care*

### syn-021
**Vignette:** A 29-year-old moved furniture over the weekend and now has low back soreness. Hurts more when bending. No leg pain, no weakness, no numbness, no fever.  
**Target:** home care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

### syn-022
**Vignette:** The patient says: I slept wrong and my lower back has been aching all day. Hard to stand up straight. No shooting pain down my legs, no weakness, no bowel or bladder issues, no fever.  
**Target:** home care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

### syn-023
**Vignette:** In a triage intake: a 47-year-old office worker has had recurring low back pain for years, currently flared after a long drive. No leg radiation, no weakness, no bladder changes, no fever, similar episodes before.  
**Target:** home care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

### syn-024
**Vignette:** A family member reports that a 55-year-old has back pain after gardening all day. Can walk but stiff. No leg symptoms, no weakness, no bowel or bladder problems, no fever.  
**Target:** home care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

### syn-025
**Vignette:** A 22-year-old wrenched their back during a gym session. Sharp pain at the muscle level when twisting. No shooting pain, no leg weakness, no numbness, no bowel or bladder issues, no fever.  
**Target:** home care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

### syn-048
**Vignette:** A 61-year-old retired teacher has aching in the lower back that is worse after sitting for long periods. Has had similar pain off and on for years. No leg symptoms, no weakness, no bladder issues, no fever.  
**Target:** home care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

### syn-049
**Vignette:** The patient says: I threw out my back shoveling snow. Sharp pain when I try to bend forward. No tingling down my legs, no weakness, no bladder changes, no fever.  
**Target:** home care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

### syn-059
**Vignette:** A 44-year-old experienced low back tightness after a long run. Gets better with stretching. No radiation to legs, no weakness, no numbness, no bowel or bladder changes, no fever.  
**Target:** home care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

### syn-066
**Vignette:** A 38-year-old nurse has low back pain after a long shift of bending and lifting patients. Has had this happen before. No leg tingling, no weakness, no bladder issues, no fever.  
**Target:** home care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

### syn-073
**Vignette:** A 50-year-old has low back stiffness each morning that loosens up after moving around. Has had this for about a year. No leg symptoms, no weakness, no bowel or bladder issues, no fever.  
**Target:** home care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

### syn-080
**Vignette:** A 33-year-old has had low back pain for three days after helping friends move. Ibuprofen has helped some. No leg pain, no weakness, no numbness, no bowel or bladder changes, no fever.  
**Target:** home care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

---

## Pattern 6: Urgent care — sore throat without airway red flags
*Teaching goal: fever + sore throat + adenopathy without stridor, drooling, or respiratory distress is urgent care not ER*

### syn-026
**Vignette:** A 16-year-old has had sore throat and fever of 102°F for two days. Throat looks red with white patches. No drooling, no difficulty breathing, no muffled voice, no stiff neck.  
**Target:** urgent care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

### syn-027
**Vignette:** The patient says: my throat has been killing me since yesterday. Swollen glands in my neck. Temperature 101.5. I can swallow, no drooling, no breathing trouble.  
**Target:** urgent care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

### syn-028
**Vignette:** In a triage intake: a 10-year-old has severe sore throat, headache, and a fever of 103°F. No cough. Can swallow food, just hurts. No drooling, no stridor, no neck stiffness.  
**Target:** urgent care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

### syn-029
**Vignette:** A family member reports that a 9-year-old has had sore throat, fever of 101°F, and stomachache for one day. Tonsils look swollen. Not drooling, no breathing trouble, can drink liquids.  
**Target:** urgent care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

### syn-030
**Vignette:** A 22-year-old has had severely sore throat for three days, no cough, swollen lymph nodes, and feels exhausted. No voice change, no drooling, no breathing difficulty.  
**Target:** urgent care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

### syn-052
**Vignette:** A 14-year-old has had very sore throat, difficulty swallowing due to pain, and a fever of 103°F for two days. Tonsils are enlarged with white patches. No voice changes, no drooling, no stridor.  
**Target:** urgent care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

### syn-053
**Vignette:** A family member reports that an 8-year-old refuses to eat because of throat pain, has a fever of 102°F, and has bad breath. No cough, no drooling, no trouble breathing.  
**Target:** urgent care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

### syn-067
**Vignette:** A 30-year-old has a sore throat and fever of 101°F and lives with someone who just tested positive for strep. No drooling, no difficulty breathing, no voice change.  
**Target:** urgent care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

### syn-074
**Vignette:** A family member reports that a 7-year-old has refused breakfast because it hurts to swallow. Fever of 102.5°F, neck glands swollen. No cough, no drooling, no muffled voice, can drink small amounts.  
**Target:** urgent care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

---

## Pattern 7: Urgent care — pediatric ear symptoms without complications
*Teaching goal: ear pain + fever in under-8 without mastoid signs, toxicity, or dehydration is urgent care not ER*

### syn-031
**Vignette:** A 3-year-old has been pulling at their right ear and crying more than usual for two days. Mild fever of 100.8°F. Eating and drinking normally. No mastoid swelling, no discharge, not inconsolable.  
**Target:** urgent care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

### syn-032
**Vignette:** The patient says: my 5-year-old has ear pain and a fever of 102°F since last night. Had a cold for a week before this. Still eating okay. No stiff neck, no swelling behind the ear.  
**Target:** urgent care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

### syn-033
**Vignette:** In a triage intake: a 2-year-old woke up screaming with one ear red and appears to be in pain. Low-grade fever. Drinking small amounts. No vomiting, no dehydration, no swelling behind ear.  
**Target:** urgent care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

### syn-034
**Vignette:** A family member reports that a 4-year-old has had ear pain, fever of 101.5°F, and trouble sleeping for two nights. Runny nose for a week prior. Still drinking fluids. No mastoid redness or swelling.  
**Target:** urgent care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

### syn-035
**Vignette:** A 6-year-old has ear pain and fever after swimming. The outer ear canal looks red and is tender when you touch it. Not pulling at the eardrum area, no systemic toxicity, no swelling behind ear.  
**Target:** urgent care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

### syn-061
**Vignette:** A 7-year-old has had one ear hurting for one day with mild fever of 100.4°F. Started after a week of a runny nose. Eating and drinking okay. No swelling behind the ear, no inconsolable crying.  
**Target:** urgent care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

### syn-077
**Vignette:** A 2-year-old has been inconsolably crying and holding one ear since midnight. Mild fever of 100.8°F. Taking small amounts of fluid. No swelling behind the ear, not lethargic, no vomiting.  
**Target:** urgent care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

---

## Pattern 8: Urgent care — unilateral vesicular rash (shingles) without eye or neuro flags
*Teaching goal: dermatomal vesicular rash on trunk or limb without eye/facial involvement is urgent care for antivirals*

### syn-036
**Vignette:** A 58-year-old has had burning pain along the left side of their torso for two days, and this morning noticed a stripe of small blisters appearing. No eye symptoms, no facial drooping, feeling otherwise well.  
**Target:** urgent care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

### syn-037
**Vignette:** The patient says: I have a painful red rash wrapping around my right rib cage that started with itching two days ago and now has blisters. No rash near my eye, no weakness, no confusion.  
**Target:** urgent care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

### syn-038
**Vignette:** In a triage intake: a 65-year-old has tingling and pain on the left side of the lower back for 3 days, and small grouped blisters appeared today. No involvement of the face or eye, no neurologic symptoms.  
**Target:** urgent care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

### syn-039
**Vignette:** A family member reports that a 72-year-old has had a painful rash on one side of the chest for four days that started as red bumps and is now blistering. Not near the eye, no trouble with facial movement, no confusion.  
**Target:** urgent care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

### syn-062
**Vignette:** A 70-year-old has had a painful burning sensation on one side of the upper chest for one day, now with a few small fluid-filled blisters appearing. No facial symptoms, no eye involvement, no confusion, feels otherwise okay.  
**Target:** urgent care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

### syn-079
**Vignette:** A 55-year-old has a painful blistering rash wrapping around the left side of the abdomen. Started with tingling 4 days ago. No fever, no eye symptoms, no weakness, no immunosuppression.  
**Target:** urgent care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

---

## Pattern 9: Urgent care — local nail fold infection (paronychia) without systemic flags
*Teaching goal: localized nail fold pus without ascending redness, crepitus, or systemic illness is urgent care not ER*

### syn-040
**Vignette:** A 26-year-old has a painful swollen red area at the corner of their thumbnail with pus. Has been getting worse for 3 days. No red streaks going up the hand, no fever, no crepitus.  
**Target:** urgent care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

### syn-041
**Vignette:** The patient says: the skin around my big toenail is red, swollen, and has a small pocket of pus. Started after a pedicure. No red lines going up my leg, no fever, no spreading past the toe.  
**Target:** urgent care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

### syn-042
**Vignette:** In a triage intake: a 17-year-old nail biter has a swollen painful fingertip around the index nail with visible pus collection. No fever, no red streaks, no spread beyond the finger.  
**Target:** urgent care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

### syn-043
**Vignette:** A family member reports that a 45-year-old dishwasher has a chronically red swollen nail fold that has now developed pus. Painful to touch. No ascending redness, no fever, no crepitus.  
**Target:** urgent care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

### syn-069
**Vignette:** A 36-year-old has a red swollen nail fold on the middle finger with visible pus after an ingrown nail. The redness is limited to the finger. No fever, no red lines, no swelling of the hand.  
**Target:** urgent care | **Decision:** [ ] Approve  [ ] Reject  [ ] Needs clinician

---

## Summary

| Pattern | Cases | Target |
|---|---|---|
| Allergic rhinitis | 10 | home care |
| Mild vomiting, fluids tolerated | 10 | home care |
| Mild eye irritation | 11 | home care |
| Chronic eczema/atopic rash | 11 | home care |
| Mechanical back pain | 11 | home care |
| Sore throat, no airway flags | 9 | urgent care |
| Pediatric ear symptoms | 7 | urgent care |
| Vesicular rash (shingles pattern) | 6 | urgent care |
| Nail fold infection (paronychia) | 5 | urgent care |
| **Total** | **80** | — |

Approving all 80 would bring total approved rows to **26 + 80 = 106**, which clears the 100-row threshold for a useful first training experiment.

**After review:** Run `npm run ree:apply-review` then `npm run ree:create-training-pack` then `npm run ree:smoke-train`.
