# High-Priority Recursive Learning Review

Generated from `training-candidates-overtriage-240.jsonl`. These are safe over-triage cases only. They are not approved training data until a human reviewer marks them approved.

## Summary

- Cases to review: 14
- Source benchmark: 240 cases, 0 under-triage, 0 errors
- Purpose: identify extractor calibration examples that may reduce unnecessary escalation
- Safety rule: never train a model to override emergency hard stops or deterministic safety floors

## Reviewer Instructions

For each case, mark one decision:

- `Approve`: good example for teaching the extractor to be less aggressive
- `Reject`: keep conservative; not a safe training example
- `Needs clinician`: unclear without clinical review

## Cases

### 1. case-0102

| Field | Detail |
|---|---|
| Case type | Urgent sore throat and ear symptoms |
| Patient text | A 7-year-old has abrupt fever, nausea, vomiting, sore throat, exudative pharyngitis, and enlarged cervical lymph nodes. |
| Expected route | urgent care |
| Carevo routed | emergency |
| Why flagged | Routed 2 levels higher than expected |
| Extracted factors | none captured |
| Feature keys | `none captured` |
| Correction goal | Preserve same-day care routing while avoiding escalation to ER unless ER red flags are present in the text. |

Reviewer decision: [ ] Approve  [ ] Reject  [ ] Needs clinician

Reviewer notes:

---

### 2. case-0171

| Field | Detail |
|---|---|
| Case type | Urgent musculoskeletal and eye patterns |
| Patient text | In a triage intake, A 35-year-old has low back pain after shoveling snow and a new left foot drop. |
| Expected route | urgent care |
| Carevo routed | emergency |
| Why flagged | Routed 2 levels higher than expected |
| Extracted factors | none captured |
| Feature keys | `none captured` |
| Correction goal | Preserve same-day care routing while avoiding escalation to ER unless ER red flags are present in the text. |

Reviewer decision: [ ] Approve  [ ] Reject  [ ] Needs clinician

Reviewer notes:

---

### 3. case-0200

| Field | Detail |
|---|---|
| Case type | Home-care upper respiratory patterns |
| Patient text | A family member reports that A 22-year-old has years of sneezing, nasal itching, eye itching, and seasonal congestion without fever or facial pain. |
| Expected route | home care |
| Carevo routed | primary care |
| Why flagged | Routed 2 levels higher than expected |
| Extracted factors | Significant symptoms, Limiting daily activity |
| Feature keys | `severity:2, system:general, duration:over7d, impact:2` |
| Correction goal | Keep clearly mild self-care presentations low acuity after red flags are denied or absent. |

Reviewer decision: [ ] Approve  [ ] Reject  [ ] Needs clinician

Reviewer notes:

---

### 4. case-0204

| Field | Detail |
|---|---|
| Case type | Home-care skin, eye, and mouth patterns |
| Patient text | A 12-year-old has chronic dry itchy flexural skin with hay fever history but no fever, pus, red streaks, or severe pain. |
| Expected route | home care |
| Carevo routed | urgent care |
| Why flagged | Routed 3 levels higher than expected |
| Extracted factors | Significant symptoms, Limiting daily activity |
| Feature keys | `severity:2, system:skin, duration:over7d, impact:2` |
| Correction goal | Keep clearly mild self-care presentations low acuity after red flags are denied or absent. |

Reviewer decision: [ ] Approve  [ ] Reject  [ ] Needs clinician

Reviewer notes:

---

### 5. case-0205

| Field | Detail |
|---|---|
| Case type | Home-care skin, eye, and mouth patterns |
| Patient text | A 14-year-old has watery red eyes stuck shut in the morning after a cold, with no vision change, trauma, or severe eye pain. |
| Expected route | home care |
| Carevo routed | er |
| Why flagged | Routed 4 levels higher than expected |
| Extracted factors | Severe symptoms, Unable to function normally |
| Feature keys | `severity:3, system:ent, duration:under6h, impact:3` |
| Correction goal | Keep clearly mild self-care presentations low acuity after red flags are denied or absent. |

Reviewer decision: [ ] Approve  [ ] Reject  [ ] Needs clinician

Reviewer notes:

---

### 6. case-0208

| Field | Detail |
|---|---|
| Case type | Home-care skin, eye, and mouth patterns |
| Patient text | The patient says: A 30-year-old has a painful swollen eyelid for one day with minor tenderness, no trauma, and no vision change. |
| Expected route | home care |
| Carevo routed | urgent care |
| Why flagged | Routed 3 levels higher than expected |
| Extracted factors | Significant symptoms, Sudden onset |
| Feature keys | `severity:2, system:skin, duration:under6h, impact:1, onset:sudden` |
| Correction goal | Keep clearly mild self-care presentations low acuity after red flags are denied or absent. |

Reviewer decision: [ ] Approve  [ ] Reject  [ ] Needs clinician

Reviewer notes:

---

### 7. case-0209

| Field | Detail |
|---|---|
| Case type | Home-care skin, eye, and mouth patterns |
| Patient text | The patient says: A 12-year-old has chronic dry itchy flexural skin with hay fever history but no fever, pus, red streaks, or severe pain. |
| Expected route | home care |
| Carevo routed | er |
| Why flagged | Routed 4 levels higher than expected |
| Extracted factors | Severe symptoms, Unable to function normally |
| Feature keys | `severity:3, system:skin, duration:under6h, impact:3` |
| Correction goal | Keep clearly mild self-care presentations low acuity after red flags are denied or absent. |

Reviewer decision: [ ] Approve  [ ] Reject  [ ] Needs clinician

Reviewer notes:

---

### 8. case-0214

| Field | Detail |
|---|---|
| Case type | Home-care skin, eye, and mouth patterns |
| Patient text | In a triage intake, A 12-year-old has chronic dry itchy flexural skin with hay fever history but no fever, pus, red streaks, or severe pain. |
| Expected route | home care |
| Carevo routed | er |
| Why flagged | Routed 4 levels higher than expected |
| Extracted factors | Severe symptoms |
| Feature keys | `severity:3, system:skin, duration:over7d, impact:1` |
| Correction goal | Keep clearly mild self-care presentations low acuity after red flags are denied or absent. |

Reviewer decision: [ ] Approve  [ ] Reject  [ ] Needs clinician

Reviewer notes:

---

### 9. case-0215

| Field | Detail |
|---|---|
| Case type | Home-care skin, eye, and mouth patterns |
| Patient text | In a triage intake, A 14-year-old has watery red eyes stuck shut in the morning after a cold, with no vision change, trauma, or severe eye pain. |
| Expected route | home care |
| Carevo routed | er |
| Why flagged | Routed 4 levels higher than expected |
| Extracted factors | Severe symptoms, Unable to function normally |
| Feature keys | `severity:3, system:ent, duration:under6h, impact:3` |
| Correction goal | Keep clearly mild self-care presentations low acuity after red flags are denied or absent. |

Reviewer decision: [ ] Approve  [ ] Reject  [ ] Needs clinician

Reviewer notes:

---

### 10. case-0218

| Field | Detail |
|---|---|
| Case type | Home-care skin, eye, and mouth patterns |
| Patient text | A family member reports that A 30-year-old has a painful swollen eyelid for one day with minor tenderness, no trauma, and no vision change. |
| Expected route | home care |
| Carevo routed | primary care |
| Why flagged | Routed 2 levels higher than expected |
| Extracted factors | Significant symptoms |
| Feature keys | `severity:2, system:ent, duration:over7d, impact:0` |
| Correction goal | Keep clearly mild self-care presentations low acuity after red flags are denied or absent. |

Reviewer decision: [ ] Approve  [ ] Reject  [ ] Needs clinician

Reviewer notes:

---

### 11. case-0219

| Field | Detail |
|---|---|
| Case type | Home-care skin, eye, and mouth patterns |
| Patient text | A family member reports that A 12-year-old has chronic dry itchy flexural skin with hay fever history but no fever, pus, red streaks, or severe pain. |
| Expected route | home care |
| Carevo routed | urgent care |
| Why flagged | Routed 3 levels higher than expected |
| Extracted factors | Significant symptoms, Limiting daily activity |
| Feature keys | `severity:2, system:skin, duration:over7d, impact:2` |
| Correction goal | Keep clearly mild self-care presentations low acuity after red flags are denied or absent. |

Reviewer decision: [ ] Approve  [ ] Reject  [ ] Needs clinician

Reviewer notes:

---

### 12. case-0224

| Field | Detail |
|---|---|
| Case type | Home-care GI and routine patterns |
| Patient text | A 38-year-old has low back pain after lifting boxes, denies leg pain or weakness, denies fever, and had similar episodes that resolved without care. |
| Expected route | home care |
| Carevo routed | urgent care |
| Why flagged | Routed 3 levels higher than expected |
| Extracted factors | Significant symptoms, Limiting daily activity |
| Feature keys | `severity:2, system:msk, duration:over7d, impact:2` |
| Correction goal | Keep clearly mild self-care presentations low acuity after red flags are denied or absent. |

Reviewer decision: [ ] Approve  [ ] Reject  [ ] Needs clinician

Reviewer notes:

---

### 13. case-0234

| Field | Detail |
|---|---|
| Case type | Home-care GI and routine patterns |
| Patient text | In a triage intake, A 38-year-old has low back pain after lifting boxes, denies leg pain or weakness, denies fever, and had similar episodes that resolved without care. |
| Expected route | home care |
| Carevo routed | primary care |
| Why flagged | Routed 2 levels higher than expected |
| Extracted factors | Moderate symptoms, Limiting daily activity |
| Feature keys | `severity:1, system:msk, duration:over7d, impact:2` |
| Correction goal | Keep clearly mild self-care presentations low acuity after red flags are denied or absent. |

Reviewer decision: [ ] Approve  [ ] Reject  [ ] Needs clinician

Reviewer notes:

---

### 14. case-0239

| Field | Detail |
|---|---|
| Case type | Home-care GI and routine patterns |
| Patient text | A family member reports that A 38-year-old has low back pain after lifting boxes, denies leg pain or weakness, denies fever, and had similar episodes that resolved without care. |
| Expected route | home care |
| Carevo routed | urgent care |
| Why flagged | Routed 3 levels higher than expected |
| Extracted factors | Significant symptoms, Limiting daily activity, Sudden onset |
| Feature keys | `severity:2, system:msk, duration:over7d, impact:2, onset:sudden` |
| Correction goal | Keep clearly mild self-care presentations low acuity after red flags are denied or absent. |

Reviewer decision: [ ] Approve  [ ] Reject  [ ] Needs clinician

Reviewer notes:

---

