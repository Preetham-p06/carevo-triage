# MIMIC ED Demo Top Review Queue

This is a prioritized review queue, not approved training data. Use it to decide which rows are clear enough to become REE calibration rows.

Total imported candidates: 222
Rows in this review queue: 100

## Counts In This Queue

- er: 54
- emergency: 10
- urgent_care: 36

## Reviewer Instructions

- Confirm whether the suggested Carevo care level is acceptable, too high, or too low.
- Mark only clear rows as approve.
- Keep vague rows as needs_more_context.
- Never approve a row that would teach the model to lower true emergency or ER red flags.
- Approved rows are still offline only until juror gates pass with zero under-triage.

## Top Rows

| Rank | ID | Suggested | Confidence | Source acuity | Disposition | Concern | Why review first |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | mimic-ed-demo-30115213 | er | low | missing | ADMITTED | MVC/INTUBATED TRAUMA | low-confidence mapping; ER-level routing candidate; missing source acuity; non-home ED disposition: ADMITTED; red-flag wording present |
| 2 | mimic-ed-demo-30701739 | er | low | missing | ADMITTED | FACIAL DROOP | low-confidence mapping; ER-level routing candidate; missing source acuity; non-home ED disposition: ADMITTED; red-flag wording present |
| 3 | mimic-ed-demo-33978784 | er | low | missing | ADMITTED | RESP ARREST | low-confidence mapping; ER-level routing candidate; missing source acuity; non-home ED disposition: ADMITTED; red-flag wording present |
| 4 | mimic-ed-demo-35470228 | er | low | missing | OTHER | HEAD BLEED | low-confidence mapping; ER-level routing candidate; missing source acuity; non-home ED disposition: OTHER; red-flag wording present |
| 5 | mimic-ed-demo-36185653 | er | low | missing | ADMITTED | SOB | low-confidence mapping; ER-level routing candidate; missing source acuity; non-home ED disposition: ADMITTED; red-flag wording present |
| 6 | mimic-ed-demo-36678718 | er | low | missing | ADMITTED | HEAD BLEED | low-confidence mapping; ER-level routing candidate; missing source acuity; non-home ED disposition: ADMITTED; red-flag wording present |
| 7 | mimic-ed-demo-36715666 | er | low | missing | ADMITTED | SEIZURE | low-confidence mapping; ER-level routing candidate; missing source acuity; non-home ED disposition: ADMITTED; red-flag wording present |
| 8 | mimic-ed-demo-38213541 | er | low | missing | ADMITTED | HEAD BLEED | low-confidence mapping; ER-level routing candidate; missing source acuity; non-home ED disposition: ADMITTED; red-flag wording present |
| 9 | mimic-ed-demo-38676365 | er | low | missing | ADMITTED | SEIZURE | low-confidence mapping; ER-level routing candidate; missing source acuity; non-home ED disposition: ADMITTED; red-flag wording present |
| 10 | mimic-ed-demo-38926302 | er | low | missing | ADMITTED | S/P ARREST | low-confidence mapping; ER-level routing candidate; missing source acuity; non-home ED disposition: ADMITTED; red-flag wording present |
| 11 | mimic-ed-demo-33678912 | emergency | low | 1 | ADMITTED | Tachycardia, Hypoxia | low-confidence mapping; possible emergency routing; non-home ED disposition: ADMITTED; vitals available |
| 12 | mimic-ed-demo-36180820 | emergency | low | 1 | ADMITTED | Transfer, Dyspnea | low-confidence mapping; possible emergency routing; non-home ED disposition: ADMITTED; vitals available |
| 13 | mimic-ed-demo-37036523 | emergency | low | 1 | ADMITTED | HYPOTHERMIA | low-confidence mapping; possible emergency routing; non-home ED disposition: ADMITTED; vitals available |
| 14 | mimic-ed-demo-37977734 | emergency | low | 1 | ADMITTED | N/V, Tachycardia | low-confidence mapping; possible emergency routing; non-home ED disposition: ADMITTED; vitals available |
| 15 | mimic-ed-demo-39430108 | emergency | low | 1 | ADMITTED | SDH/SAH | low-confidence mapping; possible emergency routing; non-home ED disposition: ADMITTED |
| 16 | mimic-ed-demo-30272878 | er | low | 1 | ADMITTED | Transfer | low-confidence mapping; ER-level routing candidate; non-home ED disposition: ADMITTED; vitals available |
| 17 | mimic-ed-demo-30683757 | er | low | 1 | ADMITTED | N/V, Hyperglycemia | low-confidence mapping; ER-level routing candidate; non-home ED disposition: ADMITTED; vitals available |
| 18 | mimic-ed-demo-30915333 | er | low | 1 | ADMITTED | Hypotension | low-confidence mapping; ER-level routing candidate; non-home ED disposition: ADMITTED; vitals available |
| 19 | mimic-ed-demo-32587478 | er | low | 1 | ADMITTED | Abnormal labs, ETOH, Hypotension | low-confidence mapping; ER-level routing candidate; non-home ED disposition: ADMITTED; vitals available |
| 20 | mimic-ed-demo-35224843 | er | low | 1 | ADMITTED | ICH | low-confidence mapping; ER-level routing candidate; non-home ED disposition: ADMITTED; vitals available |
| 21 | mimic-ed-demo-37321464 | er | low | 4 | HOME | Lower back pain, s/p Fall | low-confidence mapping; ER-level routing candidate; red-flag wording present; vitals available |
| 22 | mimic-ed-demo-37887480 | er | low | 1 | ADMITTED | FEVER | low-confidence mapping; ER-level routing candidate; non-home ED disposition: ADMITTED; vitals available |
| 23 | mimic-ed-demo-39297781 | er | low | 1 | ADMITTED | Transfer, PE | low-confidence mapping; ER-level routing candidate; non-home ED disposition: ADMITTED; vitals available |
| 24 | mimic-ed-demo-39467106 | er | low | 1 | ADMITTED | Dyspnea, Hypoxia | low-confidence mapping; ER-level routing candidate; non-home ED disposition: ADMITTED; vitals available |
| 25 | mimic-ed-demo-38433139 | emergency | low | 1 | HOME | Dizziness | low-confidence mapping; possible emergency routing; vitals available |
| 26 | mimic-ed-demo-31200743 | urgent_care | low | missing | ADMITTED | SW | low-confidence mapping; missing source acuity; non-home ED disposition: ADMITTED |
| 27 | mimic-ed-demo-31824062 | urgent_care | low | missing | OTHER | UNKNOWN-CC | low-confidence mapping; missing source acuity; non-home ED disposition: OTHER |
| 28 | mimic-ed-demo-38319705 | urgent_care | low | missing | ADMITTED | CAR VS POLE | low-confidence mapping; missing source acuity; non-home ED disposition: ADMITTED |
| 29 | mimic-ed-demo-31660580 | emergency | medium | 1 | ADMITTED | s/p cardiac arrest | possible emergency routing; non-home ED disposition: ADMITTED; red-flag wording present; vitals available |
| 30 | mimic-ed-demo-34391979 | emergency | medium | 1 | ADMITTED | Cardiac arrest, Transfer | possible emergency routing; non-home ED disposition: ADMITTED; red-flag wording present; vitals available |
| 31 | mimic-ed-demo-38797992 | emergency | medium | 1 | ADMITTED | SOB/ABNL LABS | possible emergency routing; non-home ED disposition: ADMITTED; red-flag wording present; vitals available |
| 32 | mimic-ed-demo-39738665 | emergency | medium | 1 | ADMITTED | Altered mental status | possible emergency routing; non-home ED disposition: ADMITTED; red-flag wording present; vitals available |
| 33 | mimic-ed-demo-30390242 | urgent_care | low | 3 | LEFT WITHOUT BEING SEEN | Abd pain, Back pain | low-confidence mapping; non-home ED disposition: LEFT WITHOUT BEING SEEN; vitals available |
| 34 | mimic-ed-demo-32991451 | urgent_care | low | 3 | LEFT AGAINST MEDICAL ADVICE | Hemodialysis | low-confidence mapping; non-home ED disposition: LEFT AGAINST MEDICAL ADVICE; vitals available |
| 35 | mimic-ed-demo-33211001 | urgent_care | low | missing | HOME | PICC EVAL | low-confidence mapping; missing source acuity |
| 36 | mimic-ed-demo-36132883 | urgent_care | low | 3 | ELOPED | L Foot swelling, L Foot pain | low-confidence mapping; non-home ED disposition: ELOPED; vitals available |
| 37 | mimic-ed-demo-37145382 | urgent_care | low | 3 | LEFT WITHOUT BEING SEEN | R Leg pain, R Leg swelling | low-confidence mapping; non-home ED disposition: LEFT WITHOUT BEING SEEN; vitals available |
| 38 | mimic-ed-demo-37206743 | urgent_care | low | 3 | LEFT AGAINST MEDICAL ADVICE | L Eye pain | low-confidence mapping; non-home ED disposition: LEFT AGAINST MEDICAL ADVICE; vitals available |
| 39 | mimic-ed-demo-38449411 | urgent_care | low | missing | HOME | Confusion | low-confidence mapping; missing source acuity |
| 40 | mimic-ed-demo-30094124 | er | medium | 2 | ADMITTED | Fatigue, s/p Fall | ER-level routing candidate; non-home ED disposition: ADMITTED; red-flag wording present; vitals available |
| 41 | mimic-ed-demo-30279522 | er | medium | 3 | ADMITTED | Weakness | ER-level routing candidate; non-home ED disposition: ADMITTED; red-flag wording present; vitals available |
| 42 | mimic-ed-demo-30324772 | er | medium | 2 | ADMITTED | Chest pain, Jaw pain, L Arm pain | ER-level routing candidate; non-home ED disposition: ADMITTED; red-flag wording present; vitals available |
| 43 | mimic-ed-demo-31121963 | er | medium | 2 | ADMITTED | Chest pain, N/V | ER-level routing candidate; non-home ED disposition: ADMITTED; red-flag wording present; vitals available |
| 44 | mimic-ed-demo-31254712 | er | medium | 2 | ADMITTED | Weakness, Hypotension | ER-level routing candidate; non-home ED disposition: ADMITTED; red-flag wording present; vitals available |
| 45 | mimic-ed-demo-31283645 | er | medium | 3 | ADMITTED | SHORTNESS OF BREATH | ER-level routing candidate; non-home ED disposition: ADMITTED; red-flag wording present; vitals available |
| 46 | mimic-ed-demo-31353849 | er | medium | 2 | ADMITTED | L Leg pain, s/p Fall | ER-level routing candidate; non-home ED disposition: ADMITTED; red-flag wording present; vitals available |
| 47 | mimic-ed-demo-31628990 | er | medium | 3 | ADMITTED | Chest pain | ER-level routing candidate; non-home ED disposition: ADMITTED; red-flag wording present; vitals available |
| 48 | mimic-ed-demo-32287800 | er | medium | 2 | ADMITTED | Chest pain | ER-level routing candidate; non-home ED disposition: ADMITTED; red-flag wording present; vitals available |
| 49 | mimic-ed-demo-32822973 | er | medium | 2 | ADMITTED | LETHARGY/SOB | ER-level routing candidate; non-home ED disposition: ADMITTED; red-flag wording present; vitals available |
| 50 | mimic-ed-demo-33032677 | er | medium | 2 | ADMITTED | Chest pain, Dizziness | ER-level routing candidate; non-home ED disposition: ADMITTED; red-flag wording present; vitals available |
| 51 | mimic-ed-demo-33222885 | er | medium | 3 | ADMITTED | L Leg pain, Weakness | ER-level routing candidate; non-home ED disposition: ADMITTED; red-flag wording present; vitals available |
| 52 | mimic-ed-demo-34205403 | er | medium | 3 | ADMITTED | s/p Fall, Transfer | ER-level routing candidate; non-home ED disposition: ADMITTED; red-flag wording present; vitals available |
| 53 | mimic-ed-demo-34236274 | er | medium | 3 | ADMITTED | R Leg pain, Weakness | ER-level routing candidate; non-home ED disposition: ADMITTED; red-flag wording present; vitals available |
| 54 | mimic-ed-demo-34951841 | er | medium | 3 | ADMITTED | L Weakness, Unable to ambulate | ER-level routing candidate; non-home ED disposition: ADMITTED; red-flag wording present; vitals available |
| 55 | mimic-ed-demo-35205519 | er | medium | 2 | ADMITTED | Chest pain, Transfer | ER-level routing candidate; non-home ED disposition: ADMITTED; red-flag wording present; vitals available |
| 56 | mimic-ed-demo-35357090 | er | medium | 2 | ADMITTED | Weakness, Atrial fibrillation, Transfer | ER-level routing candidate; non-home ED disposition: ADMITTED; red-flag wording present; vitals available |
| 57 | mimic-ed-demo-35716124 | er | medium | 2 | ADMITTED | Chest pain | ER-level routing candidate; non-home ED disposition: ADMITTED; red-flag wording present; vitals available |
| 58 | mimic-ed-demo-36381328 | er | medium | 2 | ADMITTED | Transfer, s/p Fall | ER-level routing candidate; non-home ED disposition: ADMITTED; red-flag wording present; vitals available |
| 59 | mimic-ed-demo-36686656 | er | medium | 2 | ADMITTED | Anemia, Neutropenia, Transfer | ER-level routing candidate; non-home ED disposition: ADMITTED; red-flag wording present; vitals available |
| 60 | mimic-ed-demo-36976997 | er | medium | 2 | ADMITTED | Altered mental status | ER-level routing candidate; non-home ED disposition: ADMITTED; red-flag wording present; vitals available |
| 61 | mimic-ed-demo-37323830 | er | medium | 2 | ADMITTED | s/p Fall, SDH | ER-level routing candidate; non-home ED disposition: ADMITTED; red-flag wording present; vitals available |
| 62 | mimic-ed-demo-37330786 | er | medium | 2 | ADMITTED | Abnormal labs, Weakness | ER-level routing candidate; non-home ED disposition: ADMITTED; red-flag wording present; vitals available |
| 63 | mimic-ed-demo-37802225 | er | medium | 2 | ADMITTED | Chest pain, NSTEMI, Transfer | ER-level routing candidate; non-home ED disposition: ADMITTED; red-flag wording present; vitals available |
| 64 | mimic-ed-demo-37953392 | er | medium | 3 | ADMITTED | Altered mental status | ER-level routing candidate; non-home ED disposition: ADMITTED; red-flag wording present; vitals available |
| 65 | mimic-ed-demo-38260469 | er | medium | 2 | ADMITTED | Weakness, GI bleed | ER-level routing candidate; non-home ED disposition: ADMITTED; red-flag wording present; vitals available |
| 66 | mimic-ed-demo-38488295 | er | medium | 2 | ADMITTED | Altered mental status | ER-level routing candidate; non-home ED disposition: ADMITTED; red-flag wording present; vitals available |
| 67 | mimic-ed-demo-38849383 | er | medium | 2 | ADMITTED | Chest pain, Nausea | ER-level routing candidate; non-home ED disposition: ADMITTED; red-flag wording present; vitals available |
| 68 | mimic-ed-demo-38967799 | er | medium | 2 | ADMITTED | Chest pain, Transfer | ER-level routing candidate; non-home ED disposition: ADMITTED; red-flag wording present; vitals available |
| 69 | mimic-ed-demo-39266792 | er | medium | 3 | TRANSFER | Head injury, Neck pain, s/p Fall | ER-level routing candidate; non-home ED disposition: TRANSFER; red-flag wording present; vitals available |
| 70 | mimic-ed-demo-39348852 | er | medium | 2 | ADMITTED | DKA, Transfer | ER-level routing candidate; non-home ED disposition: ADMITTED; red-flag wording present; vitals available |
| 71 | mimic-ed-demo-39394858 | er | medium | 2 | ADMITTED | Chest pain | ER-level routing candidate; non-home ED disposition: ADMITTED; red-flag wording present; vitals available |
| 72 | mimic-ed-demo-39621946 | er | medium | 2 | ADMITTED | Fever, Neutropenia | ER-level routing candidate; non-home ED disposition: ADMITTED; red-flag wording present; vitals available |
| 73 | mimic-ed-demo-39898790 | er | medium | 2 | ADMITTED | Weakness, Abnormal labs | ER-level routing candidate; non-home ED disposition: ADMITTED; red-flag wording present; vitals available |
| 74 | mimic-ed-demo-39968716 | er | medium | 2 | ADMITTED | Dizziness, Weakness | ER-level routing candidate; non-home ED disposition: ADMITTED; red-flag wording present; vitals available |
| 75 | mimic-ed-demo-31023359 | urgent_care | low | 3 | HOME | Abd pain, N/V | low-confidence mapping; vitals available |
| 76 | mimic-ed-demo-31153288 | urgent_care | low | 3 | HOME | Diarrhea, Hypotension | low-confidence mapping; vitals available |
| 77 | mimic-ed-demo-31226423 | urgent_care | low | 3 | HOME | N/V | low-confidence mapping; vitals available |
| 78 | mimic-ed-demo-31270431 | urgent_care | low | 3 | HOME | Back pain, Decreased PO intake, R Ear pain | low-confidence mapping; vitals available |
| 79 | mimic-ed-demo-31320010 | urgent_care | low | 3 | HOME | Dyspnea | low-confidence mapping; vitals available |
| 80 | mimic-ed-demo-31764136 | urgent_care | low | 3 | HOME | Depression, Anxiety | low-confidence mapping; vitals available |
| 81 | mimic-ed-demo-32034003 | urgent_care | low | 3 | HOME | HYPERTENSION | low-confidence mapping; vitals available |
| 82 | mimic-ed-demo-32259573 | urgent_care | low | 3 | HOME | Neck pain, Med refill | low-confidence mapping; vitals available |
| 83 | mimic-ed-demo-32840887 | urgent_care | low | 3 | HOME | B Leg swelling | low-confidence mapping; vitals available |
| 84 | mimic-ed-demo-33256413 | urgent_care | low | 3 | HOME | Hematuria | low-confidence mapping; vitals available |
| 85 | mimic-ed-demo-33693488 | urgent_care | low | 3 | HOME | Eye pain | low-confidence mapping; vitals available |
| 86 | mimic-ed-demo-34604678 | urgent_care | low | 3 | HOME | Wound eval | low-confidence mapping; vitals available |
| 87 | mimic-ed-demo-35156583 | urgent_care | low | 3 | HOME | Back pain | low-confidence mapping; vitals available |
| 88 | mimic-ed-demo-35203396 | urgent_care | low | 3 | HOME | Toe pain | low-confidence mapping; vitals available |
| 89 | mimic-ed-demo-35353291 | urgent_care | low | 3 | HOME | L Foot pain, Wound eval | low-confidence mapping; vitals available |
| 90 | mimic-ed-demo-35547415 | urgent_care | low | 3 | HOME | Urinary retention, Lower abdominal pain | low-confidence mapping; vitals available |
| 91 | mimic-ed-demo-35933027 | urgent_care | low | 3 | HOME | Abd pain | low-confidence mapping; vitals available |
| 92 | mimic-ed-demo-36200931 | urgent_care | low | 3 | HOME | Abd pain | low-confidence mapping; vitals available |
| 93 | mimic-ed-demo-36316394 | urgent_care | low | 3 | HOME | Foot laceration | low-confidence mapping; vitals available |
| 94 | mimic-ed-demo-36323598 | urgent_care | low | 3 | HOME | Dehydration, Nausea, Rash | low-confidence mapping; vitals available |
| 95 | mimic-ed-demo-37578680 | urgent_care | low | 3 | HOME | Abnormal labs | low-confidence mapping; vitals available |
| 96 | mimic-ed-demo-37593892 | urgent_care | low | 3 | HOME | DISLODGED ABD TUBE | low-confidence mapping; vitals available |
| 97 | mimic-ed-demo-38237602 | urgent_care | low | 3 | HOME | ETOH, SI | low-confidence mapping; vitals available |
| 98 | mimic-ed-demo-38687872 | urgent_care | low | 3 | HOME | Hypertension | low-confidence mapping; vitals available |
| 99 | mimic-ed-demo-39028384 | urgent_care | low | 3 | HOME | Suprapubic pain | low-confidence mapping; vitals available |
| 100 | mimic-ed-demo-39202185 | urgent_care | low | 3 | HOME | R Leg pain, R Leg swelling | low-confidence mapping; vitals available |
