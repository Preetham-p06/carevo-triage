# Approved REE Training-Prep Rows

Reviewed at: 2026-07-11

Updated review approves benign and non-emergency over-triage rows for offline extractor calibration, rejects the acute foot-drop back-pain case, and holds sudden eye-pain and severe dizziness bundles for clinician review.

Global learning goal: Teach the extractor to bind negative qualifiers to red-flag terms and distinguish time-sensitive urgent-care cases from ER cases. If the patient says no fever, no pus, no red streaks, no severe pain, no vision change, no trauma, no weakness, or similar, those denied features must not drive escalation.

Approved rows: 26

These rows are approved for offline training preparation only. They must not change live routing until juror gates pass.

### 1. case-0102

- Reviewer target: urgent_care
- Task: extractor_calibration
- Original expected: urgent_care
- Carevo routed: emergency
- Reviewer note: Clear urgent-care sore throat pattern; do not escalate to emergency without airway, dehydration, sepsis, or severe toxicity signs.
- Patient text: A 7-year-old has abrupt fever, nausea, vomiting, sore throat, exudative pharyngitis, and enlarged cervical lymph nodes.

### 3. case-0200

- Reviewer target: home_care
- Task: extractor_calibration
- Original expected: home_care
- Carevo routed: primary_care
- Reviewer note: Multi-year seasonal sneezing, nasal itching, eye itching, and congestion without fever or facial pain is a clean home-care allergic-rhinitis example.
- Patient text: A family member reports that A 22-year-old has years of sneezing, nasal itching, eye itching, and seasonal congestion without fever or facial pain.

### 4. case-0204

- Reviewer target: home_care
- Task: extractor_calibration
- Original expected: home_care
- Carevo routed: urgent_care
- Reviewer note: Chronic flexural itchy dry skin with atopic history and explicit denial of fever, pus, red streaks, and severe pain is a clean home-care eczema-style example.
- Patient text: A 12-year-old has chronic dry itchy flexural skin with hay fever history but no fever, pus, red streaks, or severe pain.

### 5. case-0205

- Reviewer target: not_er
- Task: clarify_when_uncertain
- Original expected: home_care
- Carevo routed: er
- Reviewer note: Reviewer said this is definitely not ER. Use as uncertainty/over-severity training, not as permission to lower true eye red flags.
- Patient text: A 14-year-old has watery red eyes stuck shut in the morning after a cold, with no vision change, trauma, or severe eye pain.

### 6. case-0208

- Reviewer target: home_care
- Task: extractor_calibration
- Original expected: home_care
- Carevo routed: urgent_care
- Reviewer note: One day of localized mildly tender eyelid swelling without trauma or vision change is a clean home-care stye/chalazion-style example.
- Patient text: The patient says: A 30-year-old has a painful swollen eyelid for one day with minor tenderness, no trauma, and no vision change.

### 7. case-0209

- Reviewer target: home_care
- Task: extractor_calibration
- Original expected: home_care
- Carevo routed: er
- Reviewer note: Approved duplicate-family row because the updated review calls this negation-binding pattern a core extractor learning target.
- Patient text: The patient says: A 12-year-old has chronic dry itchy flexural skin with hay fever history but no fever, pus, red streaks, or severe pain.

### 8. case-0214

- Reviewer target: home_care
- Task: extractor_calibration
- Original expected: home_care
- Carevo routed: er
- Reviewer note: Approved duplicate-family row because repeated eczema-with-denied-infection wording helps stress negation handling.
- Patient text: In a triage intake, A 12-year-old has chronic dry itchy flexural skin with hay fever history but no fever, pus, red streaks, or severe pain.

### 9. case-0215

- Reviewer target: home_care
- Task: extractor_calibration
- Original expected: home_care
- Carevo routed: er
- Reviewer note: Watery red eyes stuck shut after a cold with no vision change, trauma, or severe pain is a benign eye-route calibration row.
- Patient text: In a triage intake, A 14-year-old has watery red eyes stuck shut in the morning after a cold, with no vision change, trauma, or severe eye pain.

### 10. case-0218

- Reviewer target: home_care
- Task: extractor_calibration
- Original expected: home_care
- Carevo routed: primary_care
- Reviewer note: Localized eyelid swelling without vision or trauma red flags is approved for calibration away from emergency routing.
- Patient text: A family member reports that A 30-year-old has a painful swollen eyelid for one day with minor tenderness, no trauma, and no vision change.

### 11. case-0219

- Reviewer target: home_care
- Task: extractor_calibration
- Original expected: home_care
- Carevo routed: urgent_care
- Reviewer note: Approved duplicate-family row because the updated review explicitly identifies eczema-with-denied-infection wording as an important learning pattern.
- Patient text: A family member reports that A 12-year-old has chronic dry itchy flexural skin with hay fever history but no fever, pus, red streaks, or severe pain.

### 12. case-0224

- Reviewer target: home_care
- Task: extractor_calibration
- Original expected: home_care
- Carevo routed: urgent_care
- Reviewer note: Reviewer said most likely home care. Good example of mechanical back pain without red flags.
- Patient text: A 38-year-old has low back pain after lifting boxes, denies leg pain or weakness, denies fever, and had similar episodes that resolved without care.

### 13. case-0234

- Reviewer target: home_care
- Task: extractor_calibration
- Original expected: home_care
- Carevo routed: primary_care
- Reviewer note: Mechanical low back pain after lifting with no leg pain, weakness, or fever is a clean home-care calibration row.
- Patient text: In a triage intake, A 38-year-old has low back pain after lifting boxes, denies leg pain or weakness, denies fever, and had similar episodes that resolved without care.

### 14. case-0239

- Reviewer target: home_care
- Task: extractor_calibration
- Original expected: home_care
- Carevo routed: urgent_care
- Reviewer note: Mechanical low back pain with denied red flags is approved to teach conservative extraction when weakness and fever are explicitly absent.
- Patient text: A family member reports that A 38-year-old has low back pain after lifting boxes, denies leg pain or weakness, denies fever, and had similar episodes that resolved without care.

### 15. case-0107

- Reviewer target: urgent_care
- Task: extractor_calibration
- Original expected: urgent_care
- Carevo routed: er
- Reviewer note: Pediatric strep-pattern sore throat with fever, exudates, and enlarged nodes should be urgent care when stridor, drooling, inability to manage secretions, respiratory distress, dehydration, and systemic toxicity are absent.
- Patient text: The patient says: A 7-year-old has abrupt fever, nausea, vomiting, sore throat, exudative pharyngitis, and enlarged cervical lymph nodes.

### 16. case-0112

- Reviewer target: urgent_care
- Task: extractor_calibration
- Original expected: urgent_care
- Carevo routed: er
- Reviewer note: Same pediatric strep-pattern case in triage-intake wording. Approve to suppress unnecessary ER escalation across text structures.
- Patient text: In a triage intake, A 7-year-old has abrupt fever, nausea, vomiting, sore throat, exudative pharyngitis, and enlarged cervical lymph nodes.

### 17. case-0117

- Reviewer target: urgent_care
- Task: extractor_calibration
- Original expected: urgent_care
- Carevo routed: er
- Reviewer note: Same pediatric strep-pattern case in family-member wording. Approve as urgent care, not ER, absent airway or systemic red flags.
- Patient text: A family member reports that A 7-year-old has abrupt fever, nausea, vomiting, sore throat, exudative pharyngitis, and enlarged cervical lymph nodes.

### 18. case-0108

- Reviewer target: urgent_care
- Task: extractor_calibration
- Original expected: urgent_care
- Carevo routed: er
- Reviewer note: Pediatric acute otitis media pattern with fever, poor eating, restless sleep, and abnormal eardrum should be urgent care unless toxicity, severe dehydration, or mastoiditis signs are present.
- Patient text: The patient says: An 18-month-old toddler has one week of rhinorrhea and cough, then overnight fever, poor eating, restless sleep, and an abnormal ear drum.

### 19. case-0109

- Reviewer target: urgent_care
- Task: extractor_calibration
- Original expected: urgent_care
- Carevo routed: er
- Reviewer note: Child with ear pain, fever, and trouble sleeping after congestion is a same-day urgent-care pattern, not ER, absent toxicity, severe dehydration, mastoid swelling, or neurologic red flags.
- Patient text: The patient says: A 10-year-old has ear pain, fever, and trouble sleeping after several days of nasal congestion.

### 20. case-0118

- Reviewer target: urgent_care
- Task: extractor_calibration
- Original expected: urgent_care
- Carevo routed: er
- Reviewer note: Toddler acute otitis media pattern in family-member wording. Approve for urgent care while preserving ER escalation for dehydration, toxicity, mastoiditis, or neurologic signs.
- Patient text: A family member reports that An 18-month-old toddler has one week of rhinorrhea and cough, then overnight fever, poor eating, restless sleep, and an abnormal ear drum.

### 21. case-0137

- Reviewer target: urgent_care
- Task: extractor_calibration
- Original expected: urgent_care
- Carevo routed: er
- Reviewer note: Unilateral burning pain followed by vesicular rash in an older adult is time-sensitive urgent care for shingles-style treatment, not ER, unless eye, facial, neurologic, or systemic signs are present.
- Patient text: A family member reports that A 77-year-old has burning pain on one side of the chest followed by a rash with clear vesicles and crusting.

### 22. case-0140

- Reviewer target: urgent_care
- Task: extractor_calibration
- Original expected: urgent_care
- Carevo routed: er
- Reviewer note: Localized painful swollen finger with pus around the nail and local spreading redness is urgent care for possible drainage/antibiotics, not ER, unless rapidly ascending streaks, crepitus, necrotizing signs, or systemic toxicity are present.
- Patient text: A family member reports that A child has a swollen painful finger with pus around the nail and spreading redness.

### 23. case-0190

- Reviewer target: home_care
- Task: extractor_calibration
- Original expected: home_care
- Carevo routed: telehealth
- Reviewer note: Years of seasonal sneezing, nasal itching, eye itching, and congestion without fever or facial pain is uncomplicated allergic rhinitis and should stay home care.
- Patient text: The patient says: A 22-year-old has years of sneezing, nasal itching, eye itching, and seasonal congestion without fever or facial pain.

### 24. case-0223

- Reviewer target: home_care
- Task: extractor_calibration
- Original expected: home_care
- Carevo routed: telehealth
- Reviewer note: Vomited twice after a heavy meal, can keep fluids down, no blood, no fever, and mild stomach upset is a clean home-care GI example.
- Patient text: A 25-year-old vomited twice after a heavy meal, can keep fluids down, has no blood, no fever, and mild stomach upset.

### 25. case-0228

- Reviewer target: home_care
- Task: extractor_calibration
- Original expected: home_care
- Carevo routed: telehealth
- Reviewer note: Same mild vomiting case in patient-says wording. Approve for home care when fluids are tolerated and blood, fever, severe pain, and dehydration signs are absent.
- Patient text: The patient says: A 25-year-old vomited twice after a heavy meal, can keep fluids down, has no blood, no fever, and mild stomach upset.

### 26. case-0233

- Reviewer target: home_care
- Task: extractor_calibration
- Original expected: home_care
- Carevo routed: telehealth
- Reviewer note: Same mild vomiting case in triage-intake wording. Approve to reinforce low acuity across lexical structures.
- Patient text: In a triage intake, A 25-year-old vomited twice after a heavy meal, can keep fluids down, has no blood, no fever, and mild stomach upset.

### 27. case-0238

- Reviewer target: home_care
- Task: extractor_calibration
- Original expected: home_care
- Carevo routed: telehealth
- Reviewer note: Same mild vomiting case in family-member wording. Approve as optional thirteenth row for home-care calibration.
- Patient text: A family member reports that A 25-year-old vomited twice after a heavy meal, can keep fluids down, has no blood, no fever, and mild stomach upset.
