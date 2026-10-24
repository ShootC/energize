# Fluidstack Interview Cram — 14-Day Plan & Study Guide

Oct 20, 2026 · @Brandon

## Read this first

Your stories carry 65% of this round, so the plan spends about 40% of your time on them. The code numbers get you in the door; the stories win the score.

**How Stage 1 is scored.** 30–45 minutes on Google Meet with the organization's hiring manager, weighted 35% technical and 65% EQ (judgment, ownership, communication). They go deep on work you have actually done, not trivia, and follow your answers into what you decided, what constrained you, and what you would do differently.

**What that means for \~35 hours of study.**

- Split it roughly 60% technical, 40% stories and delivery practice. A perfect NFPA 20 answer delivered as a ramble scores below a solid one delivered in 90 seconds with a number in it.
- Your gaps are not fire alarm. They are: data center commissioning language (L1–L5, FPT vs IST, load banks, issue logs, turnover); the water side at acceptance-test level (sprinkler, pre-action, fire pump); smoke control and the emergency power interface, both named in the posting; and the newer hazards (BESS, mist, aerosol). Hydraulics drops to a light refresh — this role runs the tests, it doesn't own the calcs. Clean agent releasing, ASD and gas detection you already do — those days are refresh, not relearn.
- Their own guide scores "I don't know — here's how I'd find out" above a guess. For a number you can't recall, name the section you'd check before writing the script.

**Win this role first; mention R&D once, at the close.**

1. Go all-in on the Cx role. No email to Rico about the FPE roles — mid-process it reads as hedging.
2. In the interview, sell the bridge, not the switch. Their Extreme Ownership value describes carrying a system from design intent through installation, commissioning and operation. You design it, program it and commission it — say that, with examples.
3. Bring up your playbooks earlier, inside your answers (job walk → design → install → pre-test → commissioning). Then one question opens the door: "How does commissioning feed back into the reference design — does the R&D team see what fails in the field?"
4. Close with one line, then stop: "I'm all-in on this role. I also applied for the R&D fire protection role, so if the team ever sees a fit there, I'd welcome that conversation." Save any direct ask for Stage 2 or the offer.

**Certifications:** the posting lists CxP, BCxP, CxA, CCP or QCxP as a bonus. If you register for one before the interview, say so — it backs the commissioning direction you already want.

**Interview date:** Rico asked about Oct 26; you've asked for Nov 2. The plan finishes every technical topic by Sun Oct 25, so either date works.

## 14-day plan

Every technical topic lands by Sun Oct 25, so you're ready even if they take Oct 26. Cutover week drops to 15–30 minutes a day of quizzes and stories out loud. The weighting follows the Cx posting — fire alarm, suppression, smoke control, emergency power interface, IST, AHJ — with hydraulics as a light read. Protect the ★ days.

| Day | Date | Technical block | Interview block | Done when |
| --- | --- | --- | --- | --- |
| 1 ★ | Tue Oct 20 | Cx language, IST matrix, AHJ inspections | List six projects; draft Story 1 | You can say what each level proves and turn an IST matrix into test steps |
| 2 ★ | Wed Oct 21 | Sprinkler, underground and pre-action | Story 1 out loud, under 2 min | Hydro, air, flush and delivery-time numbers cold; you can walk a double-interlock FPT |
| 3 ★ | Thu Oct 22 | Fire pump and emergency power interface | Story 2 out loud, under 2 min | You can run a pump acceptance test and a pull-the-plug IST in your head |
| 4 ★ | Fri Oct 23 | Smoke control acceptance; fire alarm FPT and sequence-of-operations review | Stories 3 and 4 out loud | Pressure, door-force and test-sequence numbers cold |
| 5 ★ | Sat Oct 24 | Clean agent, CO2, aerosol and ASD | Story 5, 60-second intro, why Fluidstack | You can explain a door-fan failure and an ASD transport-time test |
| 6 ★ | Sun Oct 25 | BESS, gas detection and water mist | Mock interview 1, full 45 min, recorded | Ready for an Oct 26 interview |
| 7 | Mon Oct 26 | Cutover week: 15-min quiz on Days 1–2 | Stories 1 and 2 out loud | — |
| 8 | Tue Oct 27 | 15-min quiz on Days 3–4 | Stories 3 and 4 out loud | — |
| 9 | Wed Oct 28 | 15-min quiz on Days 5–6 | Story 5 and your four questions | — |
| 10 | Thu Oct 29 | Hydraulics sheet, light read | IST fire scenario out loud | — |
| 11 | Fri Oct 30 | Off — finish the cutover | — | — |
| 12 ★ | Sat Oct 31 | Write an L4 pre-action script and an L5 data hall IST scenario | Mock interview 2 (technical deep dive) | The script reads like something you'd hand Ops |
| 13 | Sun Nov 1 | Weak spots; FPE refresher skim; NFPA 241 construction-phase protection | Mock interview 3, full 45 min | One page of notes beside the camera |
| 14 | Mon Nov 2 | Light review only | Day-of checklist, then stop | — |

Ask for "quiz me on Day N" or "run mock interview 1" any day and I'll drill you here.

## Interview playbook

Win the 65% with five stories, each built on one of their values and a number you can defend. The drafts come from your answers; the \[brackets\] are details still worth confirming. Say each one out loud until it fits in 2 minutes.

### Values → stories

| Value | Story | Numbers to bring |
| --- | --- | --- |
| Extreme ownership | 1 · Three occupied towers, one cutover | \~1,500 devices, 16 nodes, 12 people, under 8 h impaired, 4 shortages caught a month early |
| Velocity | 2 · A data center with no drawings | 20 detectors from 4 designs (80% less design work); wrong-COLO release caught in test |
| First principles | 3 · Ground faults nobody could ground out | \~7 modules summed past a 0.4 V threshold; diagnosed the same day; proved before the re-pull |
| Own the failure | 4 · Canned air at a data center | One evacuation; system on test ever since |
| Love of the game | 5 · Playbooks, thermal imaging, tools | 4 playbooks in company use; far fewer go-backs |

### Story drafts (STAR, under 2 minutes each)

**Story 1 — Extreme ownership: three occupied towers, one cutover**

- **S:** Three occupied high-rise towers on a Hawaii campus, 15–16 floors each. The legacy fire alarm had to be replaced, brought to code and moved onto a new fiber backbone: 16 nodes, about 1,500 devices.
- **T:** I owned it end to end — job walk, design, install, programming and testing — and led a crew of 12 to cut over and commission it far enough that most of the crew could fly home and the local team could finish.
- **A:**
  - A month before cutover I flew out and built every panel on site. That caught 4 parts critical to the install that the warehouse had missed, early enough to get them shipped to Hawaii.
  - The fiber contractor pulled the runs but never jumpered the cassettes and left no redlines. A coworker and I went panel by panel with a fiber light source, found every missing jumper and labeled each run end to end.
  - I broke the 12 into defined roles and a schedule.
  - We held the shutdown-to-waterflow window under 8 hours, with security on fire watch.
  - My bar for sending the crew home: waterflows, tampers, elevator recall and shunt trip, audibility, the sequence for every device type on every floor, and all manual paging — every programmed sequence proven.
- **R:** \[Fill in after Oct 30: on schedule? devices tested? punch items left? the date most of the crew flew home.\]
- **If they ask what you'd do differently:** the radios (see Backups).

**Story 2 — Velocity: a data center with no drawings**

- **S:** A colocation data center — 8 COLOs, roughly 300,000–400,000 ft². We were upgrading 20 VESDA units (VLP to VESDA-E VEU) and the fire alarm, with no existing drawings.
- **T:** Recommission detection the data center could rely on, without waiting for as-builts that didn't exist.
- **A:**
  - Pulled the data from all 20 detectors. Every one was still at factory defaults — not viable for very early warning in a data hall.
  - Counted every sampling hole and paced each pipe run. The above-ceiling and CRAC networks came in only 4 variations, so I designed 4 networks in ASPIRE instead of 20.
  - Set new thresholds (defaults were Fire 1 2 %/ft and Fire 2 4 %/ft; set to Fire 1 0.0625 %/ft and Fire 2 1 %/ft for very early detection), normalized airflow and measured transport time on every pipe. High-flow faults turned out to be damaged pipe above the ceiling, which we repaired.
  - During cause-and-effect testing, a pre-action release tripped the wrong COLO's valve. It was double interlock, so the system primed but never filled. The releases for two COLOs were swapped, so in a real fire the COLO that needed water wouldn't have gotten it. I verified the relay for every system and corrected the programming to the sequence of operations.
- **R:** 20 detectors re-engineered from 4 designs — 80% less design work. The wrong-COLO release was found in a test, not a fire. The whole job took about two weeks.
- **End on what you changed, not on who missed it:** "Since then I treat every inherited system as unverified. I test cause and effect against the sequence of operations, not just the devices."

**Story 3 — First principles: ground faults nobody could ground out**

- **S:** A BESS site in Texas. I reviewed the design and the BACnet sequence-of-operations matrix, ran the crew installing 20 flame detectors, and programmed the panel and the BACnet link to the client's control house.
- **T:** Once more than about 7 detectors were connected, the panel showed a ground fault on the SLC.
- **A:**
  - Measured 0.5–4 V induced on each leg of the detector circuits. Each monitor module passed a fraction of it onto the SLC, and about 7 of them added up past the panel's 0.4 V ground-fault threshold. We diagnosed induction the same day.
  - The client had bought shielded, untwisted cable. A shield stops electric-field pickup, not magnetic pickup, so textbook grounding — shield landed at one end, carried through and taped — couldn't fix it. Twisting the pair is what cancels magnetic pickup.
  - The client wanted to try everything short of a re-pull, and each attempt failed. So I laid the replacement twisted cable on the ground out to the detectors, and the faults cleared.
- **R:** Every run from the control house was re-pulled — about 2 weeks to pull and retest — and the system was commissioned. \[Zero faults after the re-pull?\]
- **Lesson:** I check cable data sheets at submittal review, not at start-up. The cable was approved before anyone read its sheet — tell that as a process gap, not blame.
- **If they push on the physics:** induced voltage scales with the loop area between the conductors; twisting makes each half-twist's pickup cancel the next.

**Story 4 — Own the failure: canned air at a data center**

- **S:** Seven months into my career, I was sent to a San Francisco data center for a smoke detector trouble.
- **T:** The head was dirty, and I needed to clean it.
- **A:** I didn't put the system on test and didn't pull the head. I blew it out with canned air from under the floor. It was cross-zoned, so it went to alarm: the building evacuated and the fire department rolled in rush-hour traffic. I didn't reset the panel. I confirmed the alarm was mine, silenced it, and waited for the trucks to tell them it was me.
- **R:** From that day, if I'm touching a panel or a device, the system is on test first. Every script I write starts with isolation and ends with a verified return to normal. And heads get vacuumed, not blown out.
- **Delivery:** tell it straight and short — the lesson is the point. It's early-career, so keep the radios story ready if they ask for something recent.

**Story 5 — Love of the game: turning field lessons into something others can repeat**

- I've written 4 playbooks my company uses: linear heat detection in ASRS, thermal imaging for photovoltaic sites, BESS flame detection, and EST migrations. Result: far fewer go-backs, and those jobs no longer depend on a select few — many more techs can be sent. \[Rough numbers: go-backs before vs. after? techs qualified then vs. now?\]
- I work with the UL-listed thermal detection manufacturer on their training programs, and I built my own camera placement tool around lens angle, obstructions and commodity type. I do design and design review for BESS, ASRS and PV.
- At night I build software for fire protection: a tool that turns an EST3 program into a priced EST4 upgrade BOM, and a panel-capture app that checks devices off the points list during testing.
- **Closing line:** "Productizing a data center is the same job: turn what one expert knows into something the next person can repeat. I've been doing that on my own time for years."

### Backups

- **Technical deep dive — lab with smoke control and a third-party Cx FPE.** I ran the subs and programmed the fire alarm for a high-rise lab; was the liaison with the third-party commissioning FPE; tested smoke control and generator backup for emergency circuits; was the main troubleshooter on damper and fan monitoring; ran the AHJ inspection; and trained the owners. The angle: "I've been on the contractor side of a Cx script, so I know what makes a test day go right." \[Still open: zones, fans and dampers; the hardest problem; first-time AHJ pass?\]
- **First principles, alternate — FM Global live burn.** ASD vs. linear heat in a flash freezer's exhaust. I verified the ASD install; it alarmed about 15–20 s after a 1 ft² pan fire was lit, in very high airflow \[confirm: about 60 air changes per minute or per hour?\]. The linear heat was mounted behind steel beams; I flagged it so the comparison was fair. They retested separately and never reported results.
- **Recent miss — the radios.** On the Hawaii job I was late ordering radios. A coworker suggested a push-to-talk phone app; I bought licenses, the client let us use the site Wi-Fi, and it worked for less than radios would have cost.

### Your 60-second intro

"I'm a fire protection engineer — PE, NICET IV fire alarm — with 18 years taking fire alarm and special hazard systems from design through programming, installation and commissioning: high-rises, campuses, labs, clean agent, BESS, ASRS, hangars, cold storage. Today I'm on Everon's national technical team doing performance-based design and PE-level review, and I'm the liaison for our AI design tool. I build software that takes the hours out of design and estimating — \[one number\]. I want to do this where reliability is the product, at a scale where it matters. That's why I'm here."

### Why Fluidstack

Your answer has three beats: the loop you've always worked in, the fire protection problem their factory-built model creates, and the AI tools you build on the kind of infrastructure they deliver.

**Say it in 45 seconds**

1. "You build capacity in months and run what you build. I've spent 18 years in that loop on fire systems — design, program, commission, then take the call when it misbehaves. I want to work where that loop is the whole business."
2. "You're productizing the data center — modules built in a factory. That moves fire protection commissioning left: L1 scripts at the factory, so the site tests interfaces instead of re-testing every device. That's a problem I want to solve."
3. "I use frontier models every night to build fire protection tools — including a panel-capture app that checks devices off the points list during testing. Fluidstack builds the infrastructure those models run on. I want to help make it reliable."

**The role you're interviewing for** is most likely [Cx, QA & Field Engineer, Fire Protection](https://jobs.dukecapitalpartners.duke.edu/companies/fluidstack/jobs/80683904-cx-qa-field-engineer-fire-protection) on the Commissioning team — San Francisco, Austin or New York; posted at $220–300k plus equity. It owns fire life safety commissioning from test planning through occupancy: FPT on fire alarm, smoke control, the emergency power interface and suppression; pre-functionals and IST; AHJ inspections; scripts and IST matrices; closeout and punch. Bonus certifications: CxP, BCxP, CxA, CCP, QCxP. Smoke control and the emergency power interface now have their own sections (Days 3 and 4).

**The FPE roles, for your closing line only**

- [Fire Protection Engineer, Capacity Delivery](https://jobs.dukecapitalpartners.duke.edu/companies/fluidstack/jobs/86677009-fire-protection-engineer-capacity-delivery) — design review, field support, AHJ work and RFIs on assigned sites; wants code answers from primary sources, not memory.
- [Fire Protection Engineer, R&D](https://jobs.ashbyhq.com/fluidstack/71ebc83c-1afc-49bf-9560-cd06d12ba4ba) — reference design for the modular units and on-site power plants; owns the hydraulic calcs; designs for fabrication; NFPA 855 a bonus.

**Facts to know cold**

| Topic | What to know |
| --- | --- |
| Company | Founded at Oxford in 2017; [HQ moved to New York](https://fluidstack.io/news/fluidstack-expands-u-s-investment-by-relocating-global-headquarters-to-new-york-city) in Dec 2025. CEO Gary Wu; co-founder and President César Maklary (ex-Formula One aerodynamics); co-founder Jamie Cox ([Forbes](https://www.forbes.com.au/?p=205341)) |
| Anthropic | [$50B program](https://www.anthropic.com/news/anthropic-invests-50-billion-in-american-ai-infrastructure): custom data centers in Texas and New York, coming online through 2026 |
| Google | [Deploys Google TPUs](https://www.datacenterdynamics.com/en/news/google-offers-its-tpus-to-ai-cloud-providers-report); Google backstops several of its leases |
| Lake Mariner, NY (TeraWulf) | \~[360 MW](https://theenergymag.com/news/2025-08-18/terawulf-fluidstack-ai-expand/); CB-3 delivered in July, later buildings energizing into early 2027 ([TeraWulf Q2 call](https://www.easternprogress.com/terawulf-q2-earnings-call-highlights-hpc-execution-and-expansion/article_0d0c0d50-7ff4-5a65-9585-106c4efd77bf.html)) — live commissioning now |
| Barber Lake, TX (Cipher) | 207 MW; halls [slipped to Q4 2026 – Q1 2027](https://datacenterdynamics.com/en/news/cipher-extends-barber-lake-data-center-lease-commitments-to-20-years) |
| River Bend, LA (Hut 8) | [245 MW first leg](https://www.datacenterdynamics.com/en/news/hut-8-selling-325bn-in-bonds-to-finance-google-and-anthropic-backed-river-bend-ai-data-center-campus/); first hall Q2 2027 |
| Cameron County, TX | Its own campus: $4B first phase, up to 1.5 GW; [site work began Sep 2026](https://www.krgv.com/news/fluidstack-breaks-ground-on-4-billion-data-center-campus-in-cameron-county/) |
| How they build | [Factory modules with robotic welding](https://siliconangle.com/2026/07/21/ai-data-center-builder-fluidstack-raises-830m-7-5b-valuation/); [islanded power](https://jobs.ashbyhq.com/fluidstack/ee0bafc2-bac1-4321-9ba5-134a12b37004) from engines, turbines, fuel cells, solar and BESS — so gas detection, engine and turbine enclosure suppression, and NFPA 855 all matter |
| Funding | [$830M Series A at $7.5B](https://fluidstack.io/blog/series-a-announcement); a [$1.5B Jane Street-led round at over $18B](https://dealroom.co/news/157101-fluidstack-raises-1-5b-led-by-jane-street-valuation-quadruples-to-18b-in/) reported in Sep 2026 |
| Dropped | The France 1 GW project was [dropped in Mar 2026](https://www.datacenterdynamics.com/en/news/fluidstack-drops-projects-in-france-to-focus-on-us-report/) — don't cite it as current |

**The Lake Mariner fire — know it, don't lead with it.** In early June 2026 a [former water treatment building on the Lake Mariner campus burned](https://www.lockportjournal.com/news/local_news/chief-lake-mariner-fire-exposed-safety-concerns/article_2331341f-cacb-447d-b520-e04c2e930a6e.html) while the site was still under construction. The fire chief reported no functional alarm or suppression, three hydrants that didn't work, and safety data sheets that had burned. If construction-phase fire protection comes up, it is your strongest first-principles point: NFPA 241 and IFC Chapter 33 expect a fire prevention program and a working water supply once combustibles arrive, so temporary protection is a commissioning deliverable, not a pre-L1 afterthought. If you raise it, ask rather than judge: "What changed in construction-phase fire protection after Lake Mariner?"

**Their values were renamed.** [Postings since June 2026](https://jobs.dukecapitalpartners.duke.edu/companies/fluidstack/jobs/82811559-general-application) use Be a barrel, Insane urgency, Reason from first principles and Love of the game, plus "Build something that actually matters." A barrel is someone who takes an initiative from start to finish on their own. Rico used the older names, so use his — and drop "barrel" once only if it fits naturally.

### Questions to ask (pick four)

1. "Which commissioning level ladder do you use, and who owns fire protection L4 and L5 — your team or a third-party agent?"
2. "Your guide says unreliable capacity costs more than late capacity. Where has fire protection been the constraint on recent sites?"
3. "How does commissioning feed back into the reference design — does the R&D team see what fails in the field?"
4. "At these rack densities with liquid cooling, which fire protection assumptions have you already rederived — pre-action vs wet, clean agent in white space, battery separation?"
5. "With Lake Mariner energizing and Cameron County breaking ground, where does fire protection commissioning sit in the modular build — at the factory, or on site?"

**Decide before they ask:** the posting lists San Francisco, Austin or New York, and commissioning means time on site in New York, Texas and beyond. Know your honest answer on travel and location before Stage 2.

## Data center commissioning language

Data center commissioning runs on five levels, each proving something the one before cannot. Learn the ladder, then place every fire system on it — that is the vocabulary their commissioning interviewer thinks in. One line to own: **"At L4 I prove the system. At L5 I prove the building."**

| Level | Name | What it proves | Fire protection example |
| --- | --- | --- | --- |
| L1 | Factory acceptance / factory witness test | The equipment meets spec before it ships | Fire pump certified shop curve; releasing panel factory test; agent cylinder fill weights and pressures; UL 9540 / 9540A data for battery systems |
| L2 | Delivery and installation verification | What arrived matches the submittal and is installed per design and listing | ASD hole sizes and labels match the design calc; nozzle orientation; hangers and seismic bracing; sprinkler temperature ratings and obstructions around containment |
| L3 | Start-up / pre-functional | Each component runs on its own; vendor start-up is done | Underground flush and hydros; dry / pre-action air test; pump start-up by the manufacturer's rep; program loaded; 100% point-to-point |
| L4 | Functional performance test (FPT) | Each system runs every sequence, including failure and degraded modes, against the Basis of Design | Pump acceptance test; pre-action trip with water delivery time; clean agent sequence with abort and manual release; door fan; ASD transport time; gas detector calibration and outputs |
| L5 | Integrated systems test (IST) | All systems work together under simulated load and utility failure, the way Ops will live with them | Fire alarm through a utility failure onto generator; release signals to BMS / EPMS; detection behavior with load banks running; battery off-gas → BMS trip → exhaust; NFPA 4 integrated test |

Some owners add an L0 for design review (OPR, BOD, Cx specs). L1–L5 is an industry convention, not a code, so definitions vary — ask which ladder Fluidstack uses. That's a good question in itself.

**The documents.** Owner's Project Requirements (OPR) say what the owner needs; the Basis of Design (BOD) says how the design meets it; the Cx plan says who tests what, when. NFPA 3 (2024) is the commissioning standard for fire and life safety systems and names the Fire Commissioning Agent (FCxA); NFPA 4 (2024) covers integrated testing and names the Integrated Testing Agent (ITa) — one person can hold both. NFPA 4 leaves retest frequency to the integrated test plan; the IFC sets 10 years for high-rise and smoke control integrated tests unless the plan says otherwise.

**Script development — what a good fire FPT script contains.**

1. Purpose, system, and the code / BOD sections each acceptance criterion comes from.
2. Prerequisites: prior level signed off, AHJ notified, central station on test, impairment logged, fire watch in place if the system goes out of service.
3. Safety isolation: actuators and solenoids replaced by test lamps or simulators, agent cylinders disconnected, shutdown circuits verified before you trip anything.
4. Steps with an expected result, an actual result, pass/fail and initials on every line.
5. Failure modes: open and ground faults on releasing circuits, loss of primary power, loss of air, abort and manual release behavior.
6. Return to normal — every isolation reversed and verified. The most dangerous outcome of a test is a system left disabled.

**IST matrix — the document the posting says you'll review.** Every input against every output, with the expected state. Each filled cell becomes a test step; the blank cells get tested too, because proving an output does *not* happen is half the job. Example only — the BOD decides every cell.

| Input ↓ · Output → | Building alarm | Central station | Release / trip | HVAC and dampers | BMS / EPMS | Elevator |
| --- | --- | --- | --- | --- | --- | --- |
| ASD Alert / Action, Hall 1 | — | — | — | — | Ops alert | — |
| ASD Fire 1, Hall 1 | ● | ● | — | Per BOD — halls often keep cooling running | ● | — |
| ASD Fire 2 or 2nd detector, Hall 1 | ● | ● | Pre-action solenoid (valve trips only on loss of air) | Per BOD | ● | — |
| Pre-action waterflow, Hall 1 | ● | ● | — | Per BOD | ● | — |
| Clean agent release, electrical room | ● | ● | Agent | Room HVAC off, dampers close | Power-down per BOD | — |
| Duct smoke detector, AHU | Supervisory | Supervisory | — | AHU off | ● | — |
| Li-ion off-gas, UPS room | — | — | BMS trips the string | Exhaust on | ● | — |
| Elevator lobby or machine room detector | ● | ● | Shunt trip (machine room heat) | — | ● | Recall |
| Utility failure | — | Trouble if a panel loses AC | — | Smoke control fans restart | ● | — |

**Running an AHJ witness test**

- Pre-test the whole script first. The witness test should repeat a test you've already passed.
- Send the script ahead; agree the witness points and sample size before the day.
- One voice: you run the test, contractors execute, the AHJ observes.
- Log every AHJ comment on the issues log on the spot. Don't argue code in the room — cite the section and resolve it after.
- Leave with the signed acceptance and any conditions on a temporary certificate of occupancy in writing.

**Load bank strategy — the fire protection angle.** Rack and air-heater load banks simulate IT heat for cooling tests. New load banks burn off coatings and can drive ASD into Alert or Action. Agree thresholds and fire watch with the Cx lead in advance — never just disable a hall. Temporary cabling adds fuel load. After load banks leave, re-run the ASD learn on clean air with real airflow; a learn done in construction dust sets a desensitized baseline.

**Issues log, punch and turnover.** Every finding gets an ID, system, level found, severity (life safety first), owner, due date and closure evidence. Life-safety issues close before turnover; anything else carried into operations needs a documented risk acceptance. The turnover package: Record of Completion (NFPA 72), Contractor's Material and Test Certificates (NFPA 13 / 24), pump acceptance report (NFPA 20), clean agent acceptance with door fan report (NFPA 2001), battery calcs, program backups, spare sprinklers and agent recharge plan, ITM schedule loaded into the CMMS, impairment procedure, and recorded Ops training.

## Sprinkler and underground

Sprinkler acceptance proves the water gets there: a clean underground, tight piping, a supply that meets demand with margin, and alarms that report flow — all recorded on the Contractor's Material and Test Certificates.

**Governing:** NFPA 13 (acceptance is Chapter 29 in the 2022 edition; it was Chapter 28 in 2019), NFPA 24 for underground, NFPA 72 for waterflow signaling, NFPA 25 for the baseline you hand to Ops.

| Test | Requirement | Reference |
| --- | --- | --- |
| Underground flush | Not less than one of: system demand including hose; the 10 ft/s table flow (4 in. 390 · 6 in. 880 · 8 in. 1,560 · 10 in. 2,440 · 12 in. 3,520 gpm); or the maximum flow available | NFPA 24 Table 10.10.2.1.3 |
| Underground hydro | 200 psi, or 50 psi above static where static exceeds 150 psi, for 2 h; makeup allowance L = S·D·√P / 148,000 gph | NFPA 24 |
| Aboveground hydro | 200 psi for 2 h, or 50 psi above working pressure where it exceeds 150 psi; no gauge drop and no visible leakage; on pump systems, set from pump shutoff pressure | NFPA 13-2022 §29.2.1 |
| Dry and double-interlock air test | 40 psi for 24 h, loss ≤ 1.5 psi | NFPA 13 §29.2.2 |
| Air supply | Restores normal air pressure within 30 min (60 min for refrigerated spaces below 5 °F) | NFPA 13 §8.2.6.3 |
| Waterflow alarm | Initiating device within 90 s of one-sprinkler flow (NFPA 72); electrical alarm within 100 s and mechanical within 5 min (NFPA 13 §7.7) | NFPA 72 / NFPA 13 |
| Backflow preventer | Forward-flow test at system demand, including hose where applicable | NFPA 13 / NFPA 24 |
| Hose allowance | Light 100 gpm / 30 min · Ordinary 250 gpm / 60–90 min · Extra 500 gpm / 90–120 min | NFPA 13 Table 19.2.3.1.2 |

**Acceptance sequence**

1. **L2 — install vs design.** Sprinkler type, K-factor, temperature rating, orientation and coverage; obstructions from containment panels, cable tray, busway and ductwork; hangers and seismic bracing; FDC; hydraulic nameplate at the riser; spare sprinkler cabinet (6 spares under 300 sprinklers, 12 for 300–1,000, 24 above 1,000) with a wrench for each type.
2. **L3 — prove the pipe.** Witness the underground flush before it connects to the riser, then both hydros. Signed certificates for underground and aboveground.
3. **L4 — prove the system.** Inspector's test: time to alarm. Valve tamper switches report within two turns of the handwheel or one-fifth of stem travel. Main drain test (record static and residual — that's the NFPA 25 baseline). Backflow forward-flow test. On dry systems, trip test: time to trip and time to water at the test connection.
4. **L5 — prove it in the building.** Waterflow reaches the FACP, central station and BMS on normal and generator power; fire pump (if any) starts and carries the demand.
5. **Turnover:** certificates, as-builts, the calc, main drain and pump baselines, spare sprinklers, and the NFPA 25 schedule loaded into the CMMS.

**Data center points to make**

- Hazard classification is set by the owner's and insurer's standard (FM Data Sheet 5-32 wants sprinklers throughout; gaseous systems are a supplement).
- Hot-aisle containment is an obstruction problem first: panels listed to drop away on heat, or sprinklers inside the contained aisle.
- A field reroute that adds fittings changes the calc. The commissioning answer is a recalc against the supply test, not a judgment call on the ladder.

**Likely question:** "What's on your sprinkler acceptance checklist?" Flush → hydros → air test if dry → inspector's test and tamper timing → main drain baseline → backflow forward flow → signals to central station → certificates.

## Pre-action

Pre-action acceptance proves two opposite things: the system holds water back until the right conditions occur, and then delivers it fast enough. So you test the interlock logic and the water delivery time, not just the trip.

| Type | Valve opens on | Size and delivery rules |
| --- | --- | --- |
| Non-interlock | Detection **or** sprinkler operation (loss of air) | Up to 1,000 sprinklers per valve |
| Single-interlock | Detection | Up to 1,000 sprinklers per valve |
| Double-interlock | Detection **and** loss of air | Sized like dry pipe; 30% design-area increase |

Automatic air supervision is required above 20 sprinklers. Double-interlock systems take the 40 psi, 24-hour air test (≤1.5 psi loss), and the air supply must restore normal pressure within 30 minutes.

**Dry-pipe sizing rules** (NFPA 13-2022 §8.2.3; consolidated into §8.2.4 in 2025). A system is acceptable by any one of: 500 gal or less without a quick-opening device; 750 gal or less with one; water at the inspector's test connection within 60 s by test; calculated delivery meeting the table; or a manifold functional test. The 500 and 750 gal figures are exemptions from the delivery-time rule, not size limits. Double-interlock gets only the 500 gal exemption: above that, prove water at the test connection within 60 s — starting from normal air pressure, with detection activated and the test connection opened at the same moment — or by calculation (NFPA 13 §8.3.2.3).

| Hazard | Sprinklers assumed open | Max time to water |
| --- | --- | --- |
| Dwelling unit | 1 | 15 s |
| Light | 1 | 60 s |
| Ordinary | 2 | 50 s |
| Extra | 4 | 45 s |
| High-piled storage | 4 | 40 s |

**Releasing panel power.** NFPA 72 requires 24 h standby plus 5 min alarm. FM Approval Standard 1011 requires 90 h standby plus 10 min for deluge and pre-action releasing — ask whether the owner or insurer specifies FM. Solenoid and panel must be listed as compatible.

**Sample L4 script — double-interlock (the Day 12 exercise)**

1. **Prerequisites:** hydro and air test passed; panel programmed; central station on test; gauges calibrated; drain path ready.
2. **Detection only** (one zone, then the cross-zone or Fire 2 input): alarms annunciate, valve stays shut.
3. **Loss of air only** (open the inspector's test): low-air supervisory, valve stays shut.
4. **Both:** detection plus open test connection — valve trips, waterflow pressure switch alarms; record time to trip and time to water at the test connection against the table or calc.
5. **Manual release** per the design.
6. **Faults:** open and short on the solenoid circuit, detection circuit faults, low and high air, compressor or nitrogen generator failure, tamper, panel AC loss — each one annunciates correctly.
7. **Restore:** drain, reset the valve per the manufacturer (clapper, priming water), restore air, panel normal, sign-off.

**Test-day details an interviewer will probe**

- **What you record on a trip test:** starting air pressure, air pressure at trip, time to trip, time to water at the test connection, and water pressure there once flow is steady.
- **The test connection** has an orifice matching the smallest K-factor on the system; on dry systems it sits at the most remote end of the top branch line.
- **Common acceptance failures:** air leaks at grooved couplings and threaded joints; a compressor too small to restore air in 30 minutes; missing or unlabeled low-point drains; trapped sections that hold water in a dry system.
- **The NFPA 25 baseline you're setting:** dry and pre-action valves get a partial trip test every year and a full-flow trip test every 3 years. A main drain reading more than 10% below acceptance has to be investigated — so record yours carefully.
- **A failed delivery time is a code failure, not a punch item.** Fixes: split the system onto another valve, adjust air pressure within the valve's listed range, or re-run the calc — then retest.

**Data center points to make**

- Double-interlock is common in data halls because one false detection signal or one damaged sprinkler alone can't put water on IT. The cost is delivery time, the area increase and complexity — FM Data Sheet 5-32 cautions that double-interlock can delay control.
- Nitrogen inerting fights corrosion in the dry pipe; it also puts an oxygen-depletion detector in the generator room.
- ASD Fire 2 (or a second detector) is the usual release input.

**Likely question:** "Why double-interlock in a data hall, and what does it cost you?" Protection against a single false signal or mechanical damage, paid for in delivery time, design area and complexity — and you prove the delivery time at acceptance, not assume it.

## Fire pump

The field acceptance test proves the installed pump reproduces its certified shop curve at churn, 100% and 150% of rated flow, and that the controller and driver start it every time, on every power source.

**Governing:** NFPA 20 Chapter 14 (field acceptance), NEC 695, NFPA 25 for the baseline. The pump, engine (if supplied), controller and transfer switch manufacturers or their authorized reps must be present.

| Item | Requirement |
| --- | --- |
| Suction flush | NFPA 20 Table 14.1.1.1 at about 15 ft/s: 4 in. 590 · 6 in. 1,320 · 8 in. 2,350 · 10 in. 3,670 · 12 in. 5,290 gpm. If unavailable: at least 150% of rated pump flow; otherwise the greater of 100% rated or maximum system demand |
| Hydrostatic | 200 psi or 50 psi above maximum pressure, whichever is greater, for 2 h |
| Churn | No more than 140% of rated pressure |
| 150% flow | At least 65% of rated pressure |
| Curve match | Field results match the certified shop curve within the accuracy of the test equipment. The 95% / 5% figure is NFPA 25's annual test — not acceptance |
| Starts | 6 automatic + 6 manual, each run at least 5 min at full speed. Diesel: starts split across both battery sets; no 5-min run needed between starts until cumulative cranking reaches 45 s |
| Run time | At least 1 h cumulative during the test |
| Electric motor | Starting: no more than 15% below rated at the controller line terminals. Running at 115% of full-load current: no more than 5% below rated at the motor terminals. Amps ≤ FLA × service factor |
| Alternate power | Simulate loss of normal power at peak load; transfer to the alternate source and back without opening overcurrent devices; at least half the starts on the alternate source |
| Minimum run timer | Electric 10 min after an automatic start (diesel 30 min) |
| Pressure settings | Jockey stop = churn + minimum static; jockey start at least 10 psi below stop; fire pump start 5 psi below jockey start; each additional pump 10 psi lower (NFPA 20 Annex) |
| NFPA 25 churn tests | Diesel weekly for 30 min; electric monthly for 10 min — weekly where the pump serves a high-rise beyond fire department pumping, has a limited-service controller, is vertical turbine, or takes suction from a ground-level tank or a source with no useful pressure |

**Formulas**

```latex
\frac{Q_2}{Q_1} = \frac{N_2}{N_1} \qquad \frac{P_2}{P_1} = \left(\frac{N_2}{N_1}\right)^2 \qquad P_{net} = P_{discharge} - P_{suction}
```

Correct every test point to rated speed with the affinity laws before you compare it to the shop curve. Plot net pressure, not discharge pressure.

**Acceptance sequence**

1. **L1:** certified shop test curve on file.
2. **L2:** alignment on horizontal split-case pumps (checked by the manufacturer's rep); rotation; no elbow or tee in a plane parallel to the shaft within 10 pipe diameters of the suction flange; relief valve and test header as designed.
3. **L3:** suction flush and hydro; controller settings; jockey and fire pump start / stop pressures.
4. **L4:** field acceptance test — churn, 100%, 150% with speed, suction, discharge, flow, volts and amps at each point; all starts; alternate-source transfer.
5. **L5:** pump runs on generator at system demand; signals reach the FACP — pump running, loss of phase or phase reversal, controller trouble; for diesel, engine running, controller trouble, and switch off-automatic.

**Data center points to make:** on an islanded-power campus the pump's "alternate source" is part of a microgrid, not a utility feed plus a generator — what counts as a reliable source and how transfer is proven is a real conversation with the electrical team and the AHJ.

**Likely question:** "The pump misses the 150% point — what do you check?" See question 11 in the last section: test setup first, then suction conditions, then the pump.

## Emergency power interface

This IST proves every life-safety load rides through a utility failure (or, on an islanded campus, a generation-block trip), is back within code time, and returns to normal without anyone touching it. It's named in the Cx posting and it's the heart of a data center IST.

**Governing:** NEC 700 (emergency — available within 10 s), NEC 701 (legally required standby — 60 s), NEC 695 (fire pumps), NFPA 110 (generators and transfer equipment), NFPA 72 Chapter 10 (fire alarm power), NFPA 20 (pump alternate power).

| Load | What you prove |
| --- | --- |
| Fire alarm, voice evacuation, releasing panels | Ride through on their own batteries; no lost points or trouble storms; an alarm in progress keeps sounding |
| Egress lighting and exit signs | Lit within 10 s |
| Fire pump | Transfers to the alternate source and carries demand (see Fire pump) |
| Smoke control fans and dampers | Restart and return to their smoke-control state; the firefighter's panel shows true status |
| Pre-action compressors or nitrogen generators | Air restored within 30 min once power returns |
| Gas detection and battery-room exhaust | Exhaust keeps running; detection stays powered |
| Elevator recall and shunt trip | Recall still works; shunt-trip power stays supervised |

**Generator numbers (NFPA 110 — confirm sections in your edition)**

- Level 1 = failure could cost lives; Type 10 = power within 10 s; Class = hours of fuel at rated load.
- Acceptance: cold start and transfer within 10 s; a building load test; and a [2-hour full-load test](https://www.columbus.gov/files/sharedassets/city/v/3/building-and-zoning/cic-21-level-1-emergency-power-supply-system-testing-2026.pdf), with results on file before occupancy.
- Periodic: monthly 30 min at 30% or more of nameplate (or the manufacturer's minimum exhaust temperature); an annual load-bank test where monthly runs can't reach 30%; Level 1 systems run 4 h every 36 months.

**Fire alarm secondary power:** 24 h standby + 5 min alarm on batteries, or an automatic-starting generator plus dedicated batteries with 4 h of capacity ([NFPA 72-2019 §10.6.7.3.1](https://www.meyerfire.com/daily/dual-electrical-feeds-meet-fa-secondary-power); renumbered in 2025).

**The L5 pull-the-plug test**

1. Halls at load-bank heat; fire alarm normal. Then repeat with a fire scenario already in alarm.
2. Open the utility main — or trip a generation block on an islanded campus.
3. Time the transfer and walk every load in the table.
4. Repeat with one generator failed (N+1) and with the fire pump running.
5. Restore normal power. Every system should return to normal without a manual reset; log any that don't.

**Signals to check at the FACP and BMS:** generator running and fault (NFPA 110 remote annunciator), low fuel, ATS position, fire pump power status (loss of phase, phase reversal, transfer switch position).

**Data center points to make**

- If the site elects NEC 645, an EPO exists and its fire alarm interface goes in the IST matrix. Many sites choose not to.
- Clean agent: if more than 480 V stays energized after discharge, NFPA 2001's prescriptive concentrations no longer apply. The power-down output is a design decision, not a detail.
- With islanded power and no utility, "normal" and "alternate" sources have to be defined with the AHJ before you can write the transfer test.

**Likely question:** "How do you test fire alarm through a utility failure?" The five steps above, plus what you'd log if a panel throws troubles on transfer.

## Smoke control

Smoke control acceptance proves the system makes the design pressure differences or exhaust rates in every fire zone without making doors impossible to open. A special inspector witnesses it, and the firefighter's smoke control panel (FSCP) must override everything.

**Governing:** IBC 909; NFPA 92; IFC for testing and maintenance; UL 864 smoke control listing for the controls; IBC Chapter 17 special inspection.

| Item | Requirement |
| --- | --- |
| Pressure difference, sprinklered space (NFPA 92) | ≥ 0.05 in. w.c. |
| Stair pressurization (IBC smokeproof enclosures) | 0.10–0.35 in. w.c., doors closed |
| Elevator hoistway pressurization (IBC) | 0.10–0.25 in. w.c. |
| Door opening force | ≤ 30 lbf |
| Airflow toward a fire (atrium makeup air) | ≤ 200 ft/min |
| Duct leakage test | 1.5 × maximum design pressure; leakage ≤ 5% of design flow |
| Control verification | Positive confirmation from each component (airflow or position, not just a command); weekly automatic self-test of dedicated systems |
| Periodic testing | Dedicated systems semiannually; nondedicated annually |
| Integrated retest | Every 10 years (IFC 901.6.2.2) unless the integrated test plan says otherwise |

IBC values above are from a [BCA smoke control testing presentation](https://www.commissioning.org/wp-content/uploads/2019/12/Norris_Testing-Smoke-Control-Systems.pdf) citing the 2012 IBC; confirm them in the edition your site uses.

**Acceptance sequence**

1. **L0 — design review:** rational analysis, sequence of operations per zone, fan and damper schedule, FSCP graphics.
2. **L2:** witness duct leak tests; dampers accessible with the right actuators; belt-driven fans with at least two belts (1.5 × design duty); wiring in raceway; makeup air intakes at least 20 ft from exhaust.
3. **L3:** the test-and-balance contractor balances to design airflow; each fan and damper proven on its own from the FSCP and from automatic inputs.
4. **L4:** zone by zone — trigger each fire zone; time each component to its smoke-control state; measure pressure across every barrier and every door force; verify end-to-end confirmation; prove FSCP priority over the BMS, freezestats and duct detectors.
5. **L5:** repeat on standby power (see Emergency power interface) and with cooling in its real operating modes.
6. **Close-out:** special inspector's report to the AHJ; the as-tested values become the baseline for periodic tests.

**Data center points to make**

- Data halls rarely have a code-required smoke control system; you'll find it in stairs, atriums and office blocks. But smoke-control-like sequences are everywhere — HVAC shutdown on detection, dampers for clean agent rooms, post-discharge exhaust — and the IST matrix tests them the same way.
- High-airflow cooling can fight pressurization, so test with CRAHs in every mode.

**Likely question:** "Stair pressurization reads high with all doors closed — what do you check?" Barometric relief or relief damper, the fan's VFD setpoint, sensor location, and a stair tighter than designed. Then run the open-door case before retuning: too high fails door force, too low lets smoke in.

## Clean agent and CO2

Clean agent acceptance proves the system can reach and hold concentration without discharging it: tight, clear piping; the right quantity; a room that holds the agent at least 10 minutes; and a release sequence proven with simulated actuators. CO2 is the exception — NFPA 12 requires a full discharge test.

**Governing:** NFPA 2001 and NFPA 12; the manufacturer's listed design manual and the vendor's flow calc; NFPA 72 for the releasing panel.

| Item | Halocarbon (HFC-227ea, FK-5-1-12) | Inert gas (IG-541, IG-55, IG-100) | CO2 |
| --- | --- | --- | --- |
| Discharge | 95% of minimum design concentration in ≤10 s | ≤60 s for Class B; ≤120 s for Class A surface and Class C | Surface fires: design concentration within 1 min |
| Design concentration | Extinguishing × 1.2 (A), 1.3 (B), 1.35 (C) | Same factors; check whether your edition applies 1.35 to inert gas | 34% minimum |
| People | NOAEL: HFC-227ea 9%, FK-5-1-12 10% | ≤43% → 5 min; 43–52% → 3 min; 52–62% → 30 s, unoccupied only | Lethal at design concentration; new total flooding barred from normally occupied spaces |
| Piping proof | 40 psi closed-circuit pneumatic test, 10 min, ≤20% loss; nitrogen flow test proves nozzles clear | Same | Per NFPA 12 |
| Room proof | Door fan: ≥10 min hold at the highest combustible level (85% of adjusted minimum design concentration retained) | Same | Full discharge test required |

**Quantity formulas** (V = volume, s = specific vapor volume at temperature, C = design concentration %, Vs = specific volume at 70 °F)

```latex
W_{halocarbon} = \frac{V}{s}\left(\frac{C}{100 - C}\right) \qquad s = k_1 + k_2 T
```

```latex
X_{inert} = 2.303\,\frac{V_s}{s}\,\log_{10}\left(\frac{100}{100 - C}\right) \quad \text{(volume of agent per volume of room, then} \times V)
```

**Acceptance sequence**

1. **L2 — as-built vs calc.** Cylinder agent weight, pressure and serials; nozzle models, orifice codes and locations; pipe sizes and lengths within the vendor's calc limits (re-run the calc if routing changed); nozzles anchored for discharge reaction; pressure relief vent installed and sized (inert gas over-pressure; halocarbons can swing negative, then positive); room volume including raised-floor and ceiling voids; signage, manual release and abort locations.
2. **L3 — piping.** Pneumatic test of closed sections; nitrogen flow test through every nozzle. Program the releasing panel.
3. **L4 — room.** Door fan per NFPA 2001 Annex C. A fail sends you leak-hunting under depressurization — cable and conduit penetrations, raised floor, ceiling plenum, dampers — not adding agent.
4. **L4 — sequence, actuators removed.** Detection (cross-zoned or ASD Fire 2) → first alarm → second input → pre-discharge alarm and time delay → release output. Abort in its selected mode; manual release overrides abort; HVAC off, dampers closed, door holders released; open and short faults on the release circuit; low cylinder pressure and maintenance-lockout supervisory; secondary power.
5. **Reconnect** actuators under a written procedure — panel normal, no active outputs, second-person verification.
6. **L5:** release output drives the BMS / EPMS responses (CRAH shutdown in the room, dampers, any power-down the BOD calls for) on normal and generator power.

**CO2 specifics (NFPA 12).** A supervised lockout valve is required on all systems unless people can't physically enter, and wherever CO2 could migrate. A pneumatic time delay and pre-discharge alarm are mandatory, with the delay sized to evacuation. Wintergreen odorizer is a recognized safeguard. On a data center campus CO2 shows up in engine or turbine enclosures, not data halls.

**Data center points to make**

- FM Data Sheet 5-32 treats gaseous systems as a supplement to sprinklers, not a substitute; FM guidance does not accept clean agent or mist as primary protection for lithium-ion racks.
- Agent supply is a design risk now: 3M stopped making Novec 1230 at the end of 2025; FK-5-1-12 is made by others, but recharge only with agent covered by that system's listing. US rules require recycled HFC-227ea for servicing from 2026 and for new installs from 2030 ([EPA](https://www.epa.gov/system/files/documents/2026-02/er-r-fact-sheet-fire-suppression-2026-02-09_1.pdf)).
- At gigawatt scale, holding concentration in a hall with containment and high-airflow cooling is impractical. That's a first-principles answer to "why not clean agent everywhere?"

**Likely question:** "Is clean agent right for a data hall at this scale?" No as primary: sprinklers plus very early detection, with clean agent reserved for spaces where the owner's risk case justifies it — and the supply and regulatory picture argues against standardizing on it.

## Condensed aerosol

You can't discharge an aerosol system at acceptance — generators are single-use pyrotechnic devices — so acceptance proves the design quantity, the placement and clearances, an enclosure tight enough to hold the aerosol, and the release circuit, using simulated actuators.

**Governing:** NFPA 2010; the manufacturer's listed design, installation and maintenance manual; NFPA 72 for the releasing panel.

**How it works:** a solid compound (typically potassium-based) ignites and produces fine solid particles and gas that break the flame's chain reaction chemically. It does not depend on oxygen depletion, but it obscures visibility, discharges hot, and leaves residue that has to be cleaned.

**Where you'll see it on a campus:** unoccupied enclosures — generator and turbine enclosures, electrical cabinets, some battery cabinets per listing. NFPA 2010 restricts use in normally occupied spaces; confirm the edition's wording before an interviewer asks.

**Acceptance sequence**

1. **L2 — quantity and placement.** Generator models and count match the design, which is the listed design density × net protected volume × the required safety factor, adjusted for openings. Check orientation, mounting, the listed clearances to people and combustibles (the discharge is hot), nothing blocking the discharge path, and manufacture / service-life dates.
2. **L2 — enclosure.** Openings match the design's leakage assumptions; dampers close; doors self-close; signage posted.
3. **L3 — circuit.** Releasing panel and actuators are listed as compatible. Wiring follows the listing (series or parallel); measure circuit values with the manufacturer's approved low-current tester only.
4. **L4 — sequence with generators disconnected.** Replace every generator with a listed test device or simulator, then verify: detection → pre-discharge alarm → time delay → release output; abort; manual release; HVAC and damper shutdown; open and short faults on the release circuit report trouble.
5. **Reconnection — the riskiest step.** Panel in normal with no active outputs, verified by a second person, before generators reconnect. Final check with the approved tester.
6. **L5:** release signal drives the integrated shutdowns (enclosure fans, fuel valves, BMS points) on normal and generator power.

**Traps:** never megger or continuity-test with a meter that can push enough current to fire a generator; plan residue cleanup and post-discharge ventilation in the EOP; a hot discharge near cabling or plastics is a design defect, not a field fix.

**Likely question:** "How do you commission a system you can't discharge?" Prove the inputs to the design (volume, openings, quantity, clearances), prove the sequence with simulators, and treat reconnection as a controlled procedure.

## Water mist

Mist is designed to a fire-test listing, not a density, so acceptance proves two things: a small-orifice, high-pressure network that is clean and tight, and an installation that matches every parameter the listing was tested at.

**Governing:** NFPA 750; the system's listing or approval from fire tests (for example FM 5560); the manufacturer's design, installation and maintenance manual.

| Pressure class | Operating pressure | Hydrostatic acceptance test |
| --- | --- | --- |
| Low | ≤ 175 psi | 200 psi for 2 h (working pressure + 50 psi where working pressure exceeds 150 psi) |
| Intermediate | > 175 to < 500 psi | 1.5 × working pressure for 10 min, then working pressure for 110 min, no loss |
| High | ≥ 500 psi | Same as intermediate |

Mist is defined by droplet size: Dv0.99 below 1,000 µm at minimum design operating pressure. Dry or pre-action mist systems also get the 40 psi, 24-hour air test. Intermediate and high-pressure calcs use Darcy-Weisbach, not Hazen-Williams.

**Acceptance sequence**

1. **L2 — install vs listing.** Pipe and fitting materials per the listing (usually stainless with compression fittings); nozzle model, orientation, spacing and height within listed limits; strainers and filters in place; pump unit or gas cylinders as designed; water supply volume for the listed duration; water quality per the manufacturer.
2. **L3 — clean and tight.** Flush before nozzles go in — small orifices clog, and debris is the most common mist failure. Then the hydrostatic test for the pressure class.
3. **L4 — performance.** Pump unit start and stop, pressure maintenance, flow through the test valve at design pressure, and pressure at the remote test connection against the calc. On open-nozzle systems: detection opens the section valve. Ventilation shuts down (moving air strips mist out of a room). Supervisory signals for low tank level, low gas pressure and pump trouble.
4. **Discharge test** where the listing or owner requires it — mist uses little water, so a real discharge is often practical.
5. **L5:** pump unit on generator power; interlocks to BMS and enclosure ventilation.

**Data center points to make:** mist appears in some white spaces and in engine and turbine enclosures on islanded-power sites. FM guidance doesn't accept it as primary protection for lithium-ion racks. Listings are narrow — an enclosure taller or leakier than the tested one is outside the listing, which is a design-review finding before it's a commissioning one.

**Likely question:** "How is commissioning mist different from sprinklers?" The listing replaces the density, cleanliness is critical, the pressure tests are higher, the calc method differs, and ventilation shutdown is part of the protection.

## Aspirating smoke detection (ASD)

ASD acceptance proves the as-built pipe network matches the design calc: every hole draws air, and smoke from the farthest hole reaches the detector within the calculated transport time — never more than 120 seconds (NFPA 72).

**Governing:** NFPA 72 air-sampling provisions (each sampling hole is treated as a spot-type smoke detector for spacing) and Chapter 14 test methods (since 2019 it also requires computer-calculated pipe designs and an airflow trouble signal); the manufacturer's design software (Xtralis ASPIRE / PipeIQ); NFPA 75 and 76 for IT and telecom spaces.

**Acceptance sequence**

1. **L2 — install vs calc.** Pipe lengths, bends, hole sizes and locations, capillary drops and end caps all match the design calc. Sampling holes labeled; pipe marked. Detector exhaust returned to the sampled zone if it sits in a different pressure zone (under-floor, duct, plenum).
2. **L3 — configure.** Load thresholds (Alert, Action, Fire 1, Fire 2) per the BOD. Normalize airflow only after pipes are clean and HVAC runs in its normal mode. Run the learn period under real operating conditions, not construction dust.
3. **L4 — prove it.** Smoke at the end-cap or most remote hole of every pipe; time to response vs the calc and vs 120 s. Verify each pipe's flow reading, then force low-flow (block the inlet) and high-flow (break the pipe) faults. Confirm each alarm level and trouble reaches the FACP as its own point and drives its output.
4. **L5 — prove it in the building.** Re-check flow with CRAHs in every mode, including one unit failed. Smoke-test inside hot-aisle containment with load banks running.

**High airflow cuts spacing (NFPA 72 — confirm table number in your edition).**

| Air changes / hour | ft² per detector or hole |
| --- | --- |
| 60 | 125 |
| 30 | 250 |
| 20 | 375 |
| 15 | 500 |
| 12 | 625 |
| 10 | 750 |
| 8.6 | 875 |
| 7.5 or fewer | 900 |

**Data center points to make**

- Supply air is clean and diluted; sample where smoke goes — CRAH returns, hot-aisle containment, ceiling return plenum — plus area coverage.
- Alarm philosophy: Alert and Action call Ops to investigate; Fire 1 is the building alarm; Fire 2 (or a second detector) is the pre-action or clean agent release input.
- Pressure-zone mismatch between sampling and exhaust is the most common source of flow faults.
- A learn done during construction sets a dirty baseline and desensitizes the system. Re-learn after final clean and after load banks leave.

**Likely question:** "How would you commission VESDA in a contained data hall?" Answer in four beats: verify install against the calc; set thresholds to the alarm philosophy; transport-time test every pipe with a pass criterion; re-verify flow with cooling in failure modes at IST.

## Gas detection

Gas detection acceptance proves each sensor reads its target gas accurately at its setpoints, and that every alarm level drives its outputs — exhaust, alarm, shutdown — with failures reported as trouble.

**Where it lives on a data center campus**

| Space | Gas | Mount | Typical action |
| --- | --- | --- | --- |
| VRLA / flooded UPS battery rooms | Hydrogen | High, near ceiling | Exhaust holding ≤ 25% LFL (H2 LFL is 4%, so about 1% by volume), or continuous ≥ 1 cfm/ft², supervised |
| Li-ion battery rooms, BESS containers | Electrolyte off-gas; also H2, CO | Per manufacturer | BMS trip of the affected string, exhaust, alarm |
| Chiller plant (machinery room) | Refrigerant | Low for heavier-than-air refrigerants, per manufacturer | Alarm at or below the refrigerant's OEL (≤ 25% LFL for flammable refrigerants); emergency exhaust per ASHRAE 15 / IMC 1105 |
| CRAH / DX units with A2L refrigerants | Refrigerant (mildly flammable) | Per unit listing | Mitigation (fans on, isolation) at about 25% LFL within seconds (UL 60335-2-40) |
| Nitrogen generator rooms (pre-action N2 inerting) | Oxygen depletion | Breathing zone | Alarm at 19.5% O2 |
| Generator rooms, docks | CO / NO2 | Breathing zone | Ventilation, alarm |
| Gas turbines, recips, fuel cells | Natural gas | High | Shut fuel valve, alarm |

**Acceptance sequence**

1. **L2:** Right sensor for the target gas; mounting height follows gas density; reachable for calibration; away from supply diffusers.
2. **L3:** Warm-up and stabilization time per the manufacturer (some sensors need 24 hours); zero in clean air.
3. **L4:** Span-calibrate with certified, in-date, traceable cal gas; record as-found and as-left. Check response time against the manufacturer's spec. Then walk every level: low alarm starts exhaust and the fan's airflow switch proves flow; high alarm sounds and shuts down what the BOD says; pull the sensor and confirm trouble at the controller, the FACP or BMS; fail the fan and confirm the alarm.
4. **L5:** Repeat the sequence on generator power — exhaust fans must be on a source that survives the event.
5. **Turnover:** Setpoint table, cal certificates, recalibration interval and sensor replacement dates loaded into the CMMS.

**Traps an interviewer may probe**

- Calibrating with a surrogate gas needs the manufacturer's correction factor — note it on the sheet.
- Catalytic bead sensors are poisoned by silicones; electrochemical cells drift and expire.
- Setpoints come from the BOD and the governing code (IFC, ASHRAE 15, NFPA 855) — confirm each against its source in the script, not from memory.

**Likely question:** "How do you prove a hydrogen detector protects the room?" Calibrated reading → alarm at setpoint → exhaust starts and airflow is proven → detector or fan failure is annunciated → all of it works on generator power.

## Battery and BESS

Battery fire protection commissioning proves a layered defense works in order: off-gas detection catches a failing cell, the BMS isolates it, exhaust keeps vent gas below 25% LFL, explosion control handles what exhaust can't, and water controls the fire — all under an approved commissioning plan.

**Governing:** NFPA 855 (2023, with a 2026 edition out); IFC / CFC 1207; UL 9540 (the system listing) and UL 9540A (the fire test method behind the design); NFPA 68 and 69; NFPA 72 and 13; NFPA 75-2024, which moved its lithium-ion rules to NFPA 855 and added off-gas detection; FM Data Sheet 5-33.

**When it applies.** Lithium-ion above 20 kWh triggers IFC 1207 (Table 1207.1.3 in IFC 2024; Table 1207.1 in 2021), aggregated per fire area — AHJ interpretations vary. There's no blanket UPS exemption, so a data center Li-ion UPS above the threshold is an ESS. Exceptions are narrow (for example, UL 1778 lead-acid UPS is exempt from explosion control).

**The commissioning plan (IFC 1207.2.1).** Required and approved before work, with 12 items — including the OPR and BOD, integrated fire and safety testing, ventilation testing, training and a decommissioning plan — and a report to the fire code official. NFPA 855-2026 has explosion control commissioned per NFPA 3 and tested per NFPA 4.

| Layer | What you prove at L4 |
| --- | --- |
| Off-gas detection (e.g., Li-ion Tamer) | Installed per the manufacturer; test-gas response; outputs isolate the affected string, start ventilation and alarm. Typically 2–30 min of warning before thermal runaway |
| BMS | Trips on off-gas, over-temperature and voltage faults; contactors open; E-stop works; status reaches the FACP or BMS |
| Smoke / heat detection | NFPA 72 acceptance; ASD where specified |
| Ventilation | Gas detection starts exhaust sized to hold ≤ 25% LFL (or continuous ≥ 1 cfm/ft², supervised); airflow proven; fan failure alarms; on standby power |
| Explosion control | NFPA 69 prevention verified against its design calc; NFPA 68 vents installed per design, unobstructed, discharging somewhere safe. Check the published 2026 text — it may require both |
| Suppression | Sprinklers at 0.3 gpm/ft² over the room or 2,500 ft², whichever is smaller (IFC 1207.5.5), unless large-scale fire testing justifies less. Clean agent and mist aren't accepted as primary protection for Li-ion racks in FM guidance |

**L5 scenario:** off-gas alarm → BMS isolates the string → exhaust starts and proves flow → alarm to Ops → if smoke or heat follows, building alarm and sprinklers → drop utility mid-event and confirm detection, BMS and exhaust stay powered.

**Data center points to make**

- Fluidstack's islanded-power campuses use BESS at grid scale, and their BESS lead is expected to drive NFPA 855 compliance with the AHJ and insurer — commissioning is where that gets proven.
- UL 9540 says the system is listed. UL 9540A tells you how it fails: cell-to-module-to-unit propagation and vent gas composition and volume, which feed the explosion control calc, spacing and any sprinkler density relief.
- Water is the answer for Li-ion fires because it cools; agent doesn't, and the cell re-ignites once concentration decays.

**Likely question:** "What does UL 9540A tell you that UL 9540 doesn't?" See above — and say which design decisions each 9540A result feeds.

## FPE refresher: fire alarm and fire dynamics

These are the PE-exam formulas most likely to come up as "walk me through how you'd size or check that." Know each one well enough to explain what drives the answer, not just plug numbers.

### Fire alarm

**Secondary power** — NFPA 72: 24 h standby plus 5 min alarm (15 min for in-building voice evacuation). Add the 20% margin most manufacturers and AHJs require.

```latex
Ah = \left[ I_{standby}(24\,h) + I_{alarm}\left(\tfrac{5}{60}\,h\right) \right] \times 1.2
```

**NAC voltage drop** — start from end-of-life battery voltage (20.4 V = 85% of 24 V); the far device must stay above its listed minimum (16 V for most "regulated 24" devices).

```latex
V_{drop} = I \times \frac{2 L \, R_{1000}}{1000}
```

Copper, Ω per 1,000 ft (NEC Ch. 9 Table 8, solid): 18 AWG 7.77 · 16 AWG 4.89 · 14 AWG 3.07 · 12 AWG 1.93.

**Audibility** — public mode at least 15 dB over average ambient, or 5 dB over the maximum sound level lasting 60 s or more, whichever is greater; 110 dBA maximum. Sleeping areas also need 75 dBA at the pillow and 520 Hz low-frequency tone.

```latex
L_2 = L_1 - 20\log_{10}\left(\frac{d_2}{d_1}\right) \qquad L_{total} = 10\log_{10}\sum 10^{L_i/10}
```

Doubling distance loses 6 dB; two equal sources add 3 dB.

**Visible** — wall-mount room sizing: 20×20 ft → 15 cd, 28×28 → 30 cd, 40×40 → 60 cd. Corridors up to 20 ft wide: within 15 ft of each end, no more than 100 ft apart. Voice intelligibility target: STI ≥ 0.50 (CIS ≥ 0.70).

**Spacing** — smoke detectors: 30 ft nominal, every point within 0.7 S (21 ft). Heat detectors: listed spacing reduced above 10 ft ceilings, from ×0.91 at 10–12 ft down to ×0.34 at 28–30 ft. High-airflow reductions are in the ASD section.

### Fire dynamics (SI: kW, m, s)

**t² growth** — α = 0.00293 (slow), 0.01172 (medium), 0.0469 (fast), 0.1876 (ultrafast) kW/s²; reaching 1,055 kW at 600, 300, 150, 75 s.

```latex
\dot{Q} = \alpha t^2
```

**Heskestad flame height**

```latex
L = 0.235\,\dot{Q}^{2/5} - 1.02\,D
```

**Alpert ceiling jet** (H = ceiling height above fuel, r = radial distance)

```latex
\frac{r}{H} \le 0.18:\ \Delta T = \frac{16.9\,\dot{Q}^{2/3}}{H^{5/3}} \qquad \frac{r}{H} > 0.18:\ \Delta T = \frac{5.38\,(\dot{Q}/r)^{2/3}}{H}
```

```latex
\frac{r}{H} \le 0.15:\ U = 0.96\left(\frac{\dot{Q}}{H}\right)^{1/3} \qquad \frac{r}{H} > 0.15:\ U = \frac{0.195\,\dot{Q}^{1/3} H^{1/2}}{r^{5/6}}
```

**Detector / sprinkler response** — RTI in (m·s)^½; time constant τ = RTI / √u.

```latex
\frac{dT_d}{dt} = \frac{\sqrt{u}}{RTI}\left(T_g - T_d\right)
```

**Point-source radiation** — χr ≈ 0.3 for most fuels.

```latex
\dot{q}'' = \frac{\chi_r \dot{Q}}{4\pi R^2}
```

**Hot gas layer (MQH)** and **flashover**

```latex
\Delta T_g = 6.85\left[\frac{\dot{Q}^2}{A_0\sqrt{H_0}\,h_k A_T}\right]^{1/3}
```

```latex
\dot{Q}_{fo,Babrauskas} = 750\,A_0\sqrt{H_0} \qquad \dot{Q}_{fo,Thomas} = 7.8\,A_T + 378\,A_0\sqrt{H_0}
```

**NFPA 92 axisymmetric plume** — Qc = 0.7 Q; flame-tip height zl = 0.166 Qc^(2/5).

```latex
z > z_l:\ \dot{m} = 0.071\,\dot{Q}_c^{1/3} z^{5/3} + 0.0018\,\dot{Q}_c
```

**Door opening force (US units)** — F in lbf, W and d in ft, A in ft², ΔP in in. w.c.; 30 lbf maximum. Minimum stair pressure difference in a sprinklered building: 0.05 in. w.c.

```latex
F = F_{dc} + \frac{5.20\,W A\,\Delta P}{2\,(W - d)}
```

**Leakage flow** — cfm, ft², in. w.c.

```latex
Q = 2610\,A\sqrt{\Delta P}
```

## Hydraulic calculations

As a commissioning FPE you use hydraulics to answer two questions: did field changes break the calc, and does the supply test still clear the demand with the owner's margin? Know these formulas well enough to do that on a whiteboard.

### Core formulas (US units: gpm, psi, in., ft)

**Sprinkler discharge** — minimum 7 psi at any sprinkler unless the listing says otherwise.

```latex
Q = K\sqrt{P}
```

**Hazen-Williams friction loss** (psi per ft; d = actual internal diameter) — the default for water-based systems.

```latex
p = \frac{4.52\,Q^{1.85}}{C^{1.85}\,d^{4.87}}
```

C: 120 for black steel wet and galvanized; 100 for black steel dry and pre-action; 140 for cement-lined iron; 150 for copper, stainless and listed CPVC. Equivalent-length multipliers when C ≠ 120: C100 ×0.713 · C130 ×1.16 · C140 ×1.33 · C150 ×1.51.

**Darcy-Weisbach** — used where Hazen-Williams doesn't hold: antifreeze systems and intermediate / high-pressure water mist.

```latex
\Delta P = 0.000216\,\frac{f\,L\,\rho\,Q^2}{d^5}
```

**Elevation** 0.433 psi per ft · **head** 1 psi = 2.31 ft · **velocity** v = 0.4085 Q / d² (ft/s)

**Velocity pressure** — normal pressure Pn = total Pt − Pv.

```latex
P_v = \frac{0.001123\,Q^2}{d^4}
```

**Balancing at a junction** — raise the lower-pressure path's flow to match the higher pressure.

```latex
Q_{adj} = Q_{low}\sqrt{\frac{P_{high}}{P_{low}}}
```

**Design area** — sprinklers in the area = A / As (round up); sprinklers on the branch line:

```latex
n_{branch} = \frac{1.2\sqrt{A}}{S}
```

**Water supply curve** — pressure available at flow Q, from a test with static S and residual R at flow QR:

```latex
P_Q = S - (S - R)\left(\frac{Q}{Q_R}\right)^{1.85} \qquad Q_2 = Q_1\left(\frac{S - P_2}{S - P_1}\right)^{0.54}
```

**Hydrant (pitot) flow** — c ≈ 0.9 for a smooth outlet.

```latex
Q = 29.83\,c\,d^2\sqrt{P_{pitot}}
```

**Pump power** — water HP, then divide by efficiency.

```latex
WHP = \frac{Q \times P}{1714}
```

### Worked example: three heads on a branch line

Ordinary Hazard Group 1: 0.15 gpm/ft² over 1,500 ft². K 5.6 sprinklers at 12 ft × 10 ft (As = 120 ft²). 1-in. Schedule 40 branch (ID 1.049 in.), C = 120. Fittings and elevation ignored to keep it clean.

- Sprinklers in the area: 1,500 / 120 = 12.5 → **13**. On the branch line: 1.2 × √1,500 / 12 = 3.87 → **4**.
- Most remote sprinkler: Q = 0.15 × 120 = **18.0 gpm**; P = (18 / 5.6)² = **10.33 psi** (above the 7 psi minimum).

| Point | Flow in pipe (gpm) | Friction (psi/ft) | Loss over 12 ft (psi) | Pressure (psi) | Sprinkler flow (gpm) |
| --- | --- | --- | --- | --- | --- |
| Head 1 | — | — | — | 10.33 | 18.00 |
| Pipe 1→2 | 18.00 | 0.107 | 1.29 | — | — |
| Head 2 | — | — | — | 11.62 | 19.09 |
| Pipe 2→3 | 37.09 | 0.408 | 4.89 | — | — |
| Head 3 | — | — | — | 16.51 | 22.76 |

Velocity in the 1→2 segment is 6.7 ft/s; velocity pressure in the 2→3 segment is 1.28 psi — small enough that most calcs carry total pressure.

### Worked example: supply check

- **Hydrant test:** 2½-in. outlet, pitot 16 psi → Q = 29.83 × 0.9 × 2.5² × √16 = **671 gpm**, with static 70 psi and residual 50 psi. Flow available at 20 psi residual: 671 × (50/20)^0.54 = **1,101 gpm**.
- **Supply at demand:** static 80 psi, residual 60 psi at 1,000 gpm. At 600 gpm: 80 − 20 × (0.6)^1.85 = **72.2 psi**. If system demand plus hose is 600 gpm at 62 psi, the margin is 10.2 psi — just over the 10 psi many owners and insurers require. That is the commissioning conversation: a field reroute that adds 3 psi of loss breaks the owner's margin even though it still "works."
- **Pump power:** 1,000 gpm at 100 psi net → 1,000 × 100 / 1,714 = **58.3 water HP**; at 70% efficiency ≈ 83 brake HP.

## Likely questions and day-of checklist

Expect three to five questions in 30–45 minutes, so each answer runs 90 seconds to 2 minutes, then stops. Their guide says they will follow up if they want more.

### Values and judgment (the 65%)

1. **"Something you owned end to end, including what went wrong."** → Story 1. End on what you changed afterward.
2. **"A decision you made without complete information."** → Story 2. Name the unknown, why waiting was worse, and how you contained the risk.
3. **"A time you rejected a standard approach."** → Story 3. Show the reasoning chain, not the rebellion.
4. **"A mistake you made."** → Story 4. Own your part first.
5. **"The schedule says skip or compress a test. What do you do?"** → Sort it three ways: life-safety and code-required tests are not negotiable; tests that can run in parallel get re-sequenced; anything deferred gets a documented risk acceptance, an impairment entry and a fire watch. "Velocity is knowing which unknowns actually block you" — their words, your method.
6. **"Tell me about a disagreement with a contractor or another trade during testing."** → Facts in the script, criteria from the BOD, escalate on the issues log, never in the hallway.
7. **"Why Fluidstack?"** → Story 5 plus the research in the playbook.

### Commissioning technical (the 35%)

8. **"Walk me through the Cx levels for a pre-action system."** → Use the L1–L5 table; end on IST.
9. **"Write the IST fire scenario for a data hall."** → Halls at full load-bank heat on normal power → ASD Fire 1, then Fire 2 or a second detector → pre-action valve trips → inspector's test simulates a fused head → verify notification, central station, valve trip and water delivery time, BMS / EPMS responses, cooling stays up → drop utility mid-event → fire alarm on secondary power, pumps on generator, controllers transfer → restore and verify every isolation reversed.
10. **"A clean agent room fails its door fan test a week before turnover."** → Find leaks under depressurization (smoke pencil, thermal camera): cable and conduit penetrations, raised floor, ceiling plenum, dampers. Seal and retest. Never just add agent — that changes concentration against NOAEL and the overpressure vent sizing. If turnover proceeds, document the risk acceptance.
11. **"The fire pump misses the 150% point at acceptance."** → Check the test first: calibrated gauges, pitot readings, nozzle sizes, measured speed with affinity correction. Then suction: a partly closed valve, strainer debris, air entrainment. Then the pump: rotation, impeller debris. Compare to the certified shop curve. Genuine shortfall = manufacturer claim and an impairment plan.
12. **"Why not clean agent on a lithium-ion battery fire?"** → Agent does not cool cells in thermal runaway; re-ignition follows once concentration decays. Water cools. Off-gas detection buys minutes. Vent gas is flammable, so explosion control matters.
13. **"What are the failure modes in a pre-action release sequence?"** → Releasing solenoid open or ground fault, detection zone fault, loss of supervisory air, compressor or nitrogen generator failure, priming water lost, panel power, manual release path. Each one gets a line in your script.
14. **"How do sprinklers work with hot-aisle containment?"** → Containment panels either drop away on heat (listed) or sprinklers go inside the contained aisle; it is an obstruction question first.

### Day-of checklist

- [ ] Google Meet, camera and audio tested from the room you'll use
- [ ] One page beside the camera: three to five impact numbers, five story titles, four questions
- [ ] Glass of water; phone silenced; notifications off
- [ ] First answer rehearsed: your 60-second intro
- [ ] Close with your strongest question and a one-line restatement of why you fit

## Sources

NFPA standards are paywalled, so code numbers were checked against the secondary sources below. Before you quote a section number in the interview, confirm it in the edition you own.

- Sprinkler acceptance: [Idaho SFM NFPA 13 acceptance checklist](https://doi.idaho.gov/wp-content/uploads/SFM/FDProviders/ChecklistsForms/NFPA-13-Acceptance-Inspection.pdf) · [MeyerFire on dry-pipe delivery options](https://www.meyerfire.com/daily/is-dry-delivery-manifold-method-just-options) · [QRFS on waterflow alarm timing](https://blog.qrfs.com/35-can-i-mount-a-fire-alarm-bell-outside/)
- Fire pump: [NYC fire pump acceptance test form](https://www.nyc.gov:443/assets/buildings/pdf/firepumptest_form.pdf) · [MeyerFire on pump curve tolerance](https://www.meyerfire.com/daily/tolerance-in-pump-curve-nameplate-vs-test) · [ASPE on fire pump installation](https://aspe.org/pipeline/engineering-considerations-for-stationary-fire-pump-installations/)
- Clean agent and CO2: [Philadelphia alternative-system test certificate](https://www.phila.gov/media/20220609103347/TP_016_F-Test-Certificate-of-Alternative-Exstinguishing-Systems-11.5.2021.pdf) · [ORR on room integrity testing](https://www.orrprotection.com/mcfp/clean-agent-fire-suppression-room-integrity-testing) · [ORR NFPA 12 bulletin](https://www.orrprotection.com/hubfs/NFPA%2012%20Bulletin_3_19_2020.pdf) · [EPA fire suppression HFC fact sheet](https://www.epa.gov/system/files/documents/2026-02/er-r-fact-sheet-fire-suppression-2026-02-09_1.pdf)
- Water mist: [NFPA 750 overview](https://enggcyclopedia.com/2011/12/water-mist-fire-protection-systems-nfpa-750/)
- ASD: [ORR on air-sampling detection](https://www.orrprotection.com/mcfp/air-sampling-smoke-detection)
- Releasing power: [FM Approval Standard 1011](https://www.fmapprovals.com/-/media/Feature/Approval-Standards/1011-pdf.pdf)
- Gas detection: [ICC 2024 A2L-related code changes](https://www.iccsafe.org/wp-content/uploads/2024_I-Code_A2L_Related_Changes_FINAL_03.01.2023.pdf)
- BESS: [IFC 1207 text](https://gocodebook.com/library/us/ca/ca-fire-code/chapter-12-energy-systems/section-1207-electrical-energy-storage-systems-ess) · [MeyerFire on in-rack UPS as ESS](https://www.meyerfire.com/daily/in-rack-ups-under-20-kwh-considered-an-ess) · [Honeywell Li-ion Tamer](https://buildings.honeywell.com/us/en/brands/our-brands/li-ion-tamer.html)
- Commissioning framework: [CSE on NFPA 3 and 4](https://www.csemag.com/using-nfpa-3-and-4-to-commission-fire-protection-systems/) · [Hioki on data center Cx levels](https://www.hioki.com/br-pt/industries-solutions/facilities/data-center-commissioning-levels.html) · [Data center fire protection guide (NFPA 75, FM 5-32)](https://www.phcppros.com/articles/23486-an-expert-guide-to-fire-protection-systems-for-data-centers)

Fluidstack: linked in the Why Fluidstack table above.
