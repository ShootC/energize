# Interview Story Scripts — 90–120 Second Answers

Oct 21, 2026 · @Brandon

Each script below runs 80–115 seconds spoken at a normal pace (about 145 words a minute). Learn the five beats under each one, not the words; the script is there so you hear what good sounds like.

## How to deliver them

1. **Hook (1 line).** What was at stake, in plain words.
2. **Situation (2 sentences max).** Site, system, size — one number.
3. **What I did (3 beats).** Say "I", not "we". Each beat is a decision and the reason for it — that is what the 65% EQ score is listening for.
4. **Result (a number).** Pause right after it.
5. **Lesson tied to their work.** One sentence, then stop and let them ask.

- Say every number exactly as written. If you can't recall one, say "about" rather than invent it.
- Practice with a timer: under 90 seconds means you skipped a decision; over 120 means you're narrating instead of choosing.
- Brackets \[like this\] are details still to confirm — see the last section. Don't say a bracketed line until it's filled.
- Each story has short follow-up answers. Interviewers at Fluidstack go deep on real work, so expect two follow-ups per story.

## Which story answers which question

Rico used the older value names; current postings use the newer ones. Use his words, and say "barrel" once at most.

| If they ask… | Tell | Value (Rico's name / current name) |
| --- | --- | --- |
| A project you owned start to finish; leading a team; a big outage or cutover | Story 1 · Hawaii towers | Extreme ownership / Be a barrel |
| Moving fast with incomplete information; no drawings, tight timeline; something others missed | Story 2 · VESDA, no drawings | Velocity / Insane urgency |
| A hard technical problem; rejecting the standard approach; disagreeing with a client | Story 3 · BESS ground faults | First principles / Reason from first principles |
| A mistake you made; a failure; what you learned the hard way | Story 4 · Canned air | Owning the failure |
| A recent mistake (if they say "in the last year or two") | Backup · The radios | Owning the failure |
| Why this work; what you do outside work; what keeps you in the field | Story 5 · Playbooks and tools | Love of the game |
| Working with a Cx agent, an AHJ or smoke control | Backup · Lab smoke control | Extreme ownership |
| Testing fairly; data integrity; a test that was set up wrong | Backup · FM burn test | First principles |

## Story 1 — Three occupied towers, one cutover

**Value:** Extreme ownership / Be a barrel · **Length:** 251 words, about 105 s, about 115 s once the result line is in.

**Script**

Three occupied high-rise towers had to lose their fire alarm for a few hours, and my job was to make that window as short and as safe as possible. It's a campus in Hawaii I'm finishing right now, fifteen to sixteen floors a tower. We're replacing the legacy fire alarm, bringing it to code and moving it onto a new fiber backbone, sixteen nodes and about fifteen hundred devices. I own it end to end, from the job walk and design through programming, and I'm leading a crew of twelve through cutover and testing.

Two things could have sunk it before we started. A month before cutover I flew out and built every panel on site. That caught four parts critical to the install that the warehouse had missed, early enough to get them shipped to the island. Then the fiber: the contractor pulled the runs but never jumpered the cassettes and left no redlines. Nobody owned that gap, so I did. A coworker and I went panel by panel with a light source, found every missing jumper and labeled every run end to end.

For cutover I gave the twelve defined roles and a schedule, and I set the bar for sending the crew home before we started: every waterflow and tamper, elevator recall and shunt trip, audibility, the sequence for every device type on every floor, and all manual paging. Proven, not sampled.

The result: three occupied towers were impaired for under eight hours, shutdown to waterflow back in service, with fire watch the whole time.

&#91;Result after Oct 30: we cut over on \_\_\_, \_\_\_ devices tested, \_\_\_ punch items open, most of the crew home on \_\_\_.\]

The lesson I keep: ownership starts a month before the outage. That's where you buy the eight-hour window.

**Beats to memorize**

1. Hook: three occupied towers lose their fire alarm for a few hours; my job is to make that short and safe · 16 nodes · \~1,500 devices · crew of 12 · I own it end to end
2. Built every panel on site a month early → 4 missing critical parts caught in time to ship
3. Fiber never jumpered, no redlines → light source, panel by panel, every run labeled
4. Defined roles · bar for going home set before we started: proven, not sampled
5. Result: under 8 hours impaired, fire watch throughout. Pause. → "ownership starts a month before the outage"

**Number spine:** 3 towers · 16 nodes · 1,500 devices · 12 people, then 1 month · 4 parts · under 8 hours. The setup numbers come first; the action numbers count up 1, 4, 8. The 8 opens the story (hook), lands it (result) and closes it (lesson).

**Follow-ups, 15 seconds each**

- *How did you split the twelve?* \[Fill in: crews per tower, test team, programmer, who ran each morning.\]
- *What would you do differently?* The radios: I ordered them late. A coworker suggested a push-to-talk phone app; I bought licenses, the client let us on site Wi-Fi, and it cost less than radios. \[Confirm what you do now — e.g. comms goes on the mobilization list with the same lead time as materials.\]
- *Why build the panels a month out?* On an island, a shortage found at cutover is a slipped date. A month gave shipping time, and it found four.
- *How did you prove the fiber?* A light source at each panel, run by run, and a label on both ends, since there were no redlines to trust.

**If the cutover isn't closed out when they ask:** "We cut over this week. Everything we tested was proven to a standard that needed no fire watch, and most of the crew flies home once the sequences are proven."

**Keep out:** any blame on the warehouse or the fiber contractor. State what was missing and what you did.

## Story 2 — A data center with no drawings

**Value:** Velocity / Insane urgency · **Length:** 235 words, about 100 s.

**Script**

A colocation data center: eight COLOs, three to four hundred thousand square feet. We were upgrading twenty VESDA units, VLP to VESDA-E, plus the fire alarm, and there were no drawings. Waiting for as-builts that didn't exist wasn't an option.

So I started with the data. I pulled the configuration from all twenty detectors, and every one was still at factory defaults. That's not something you rely on for very early warning in a data hall. Then I walked it: counted every sampling hole and paced every pipe run. That's where the speed came from. The above-ceiling and CRAC networks only came in four variations, so I modeled four networks in ASPIRE instead of twenty, about eighty percent less design work. We set new thresholds, normalized airflow and measured transport time on every pipe. The high-flow faults turned out to be damaged pipe above the ceiling, which we repaired.

Cause-and-effect testing then found the thing that mattered most. A pre-action release was tripping the wrong COLO's valve. It was double interlock, so that system primed but never filled. The releases for two COLOs were swapped, so in a real fire the COLO that needed water wouldn't have gotten it. I verified the release relay for every system and corrected the programming to the sequence of operations.

The whole job took about two weeks, end to end. Twenty detectors recommissioned from four designs, and a wrong-room release found in a test instead of a fire. Since then I treat every inherited system as unverified until I've tested cause and effect against the sequence, not just the devices.

**Beats to memorize**

1. 8 COLOs · 20 VESDAs · no drawings — waiting wasn't an option
2. Pulled data first: all 20 at factory defaults
3. Counted holes, paced runs → only 4 pipe variations → 4 designs, not 20 (80% less)
4. Thresholds, airflow, transport time on every pipe; damaged pipe found and fixed
5. Cause and effect caught a wrong-COLO release → "every inherited system is unverified"

**Follow-ups, 15 seconds each**

- *What thresholds did you set, and why?* The factory defaults were Fire 1 at 2 %/ft and Fire 2 at 4 %/ft, no more sensitive than a spot photoelectric detector (roughly 0.5–4 %/ft). We set Fire 1 to 0.0625 %/ft and Fire 2 to 1 %/ft for very early detection. Tie the new settings to the alarm philosophy: Alert and Action call Ops, Fire 1 is the building alarm, Fire 2 releases.
- *How did you test transport time?* Smoke at the end cap of every pipe, timed against the ASPIRE calc and NFPA 72's 120-second limit. \[Add your worst measured time if you remember it.\]
- *How did you catch the wrong-COLO release?* Running cause and effect zone by zone against the sequence of operations, watching which valve actually operated, not just that a release output went active.
- *Why not wait for drawings?* None existed, and the detectors were at defaults, so the risk was in leaving it as it was.

**Keep out:** who programmed the release wrong. End on what you changed.

## Story 3 — Ground faults nobody could ground out

**Value:** First principles / Reason from first principles · **Length:** 250 words, about 105 s.

**Script**

A battery storage site in Texas. I'd reviewed the design and the BACnet sequence matrix, ran the crew installing twenty flame detectors, and programmed the panel and the BACnet link to the client's control house. Once more than about seven detectors were connected, the panel threw a ground fault on the SLC.

The usual move with a ground fault is to hunt for a nicked wire. I measured instead. There was half a volt to four volts induced on each leg of the detector circuits. Each monitor module passed a fraction of that onto the SLC, and around seven of them added up past the panel's 0.4-volt ground-fault threshold. That explained the seven-detector pattern, and we had induction diagnosed the same day.

The root cause was the cable. It was shielded but not twisted. A shield stops electric-field pickup; it does nothing for magnetic pickup. Twisting the pair is what cancels that. So no amount of textbook shield grounding was going to fix it.

The client understandably wanted to try everything short of a re-pull, and each attempt failed. So rather than argue, I proved it. I laid twisted replacement cable on the ground out to the detectors, and the faults cleared. That made the decision easy. We re-pulled every run from the control house, about two weeks to pull and retest, and commissioned the system.

What changed for me: I check cable data sheets at submittal review, not at start-up. The cheapest place to catch physics is on paper.

**Beats to memorize**

1. Texas BESS · 20 flame detectors · fault appears past \~7 connected
2. Measured, didn't hunt: 0.5–4 V induced per leg → \~7 modules sum past 0.4 V
3. Shielded, untwisted: a shield blocks electric fields, twisting cancels magnetic
4. Client tried cheaper fixes → I proved it with twisted cable laid on the ground
5. Re-pull \~2 weeks, commissioned → "check cable data sheets at submittal"

**Follow-ups, 15 seconds each**

- *Explain the physics.* Induced voltage scales with the loop area between the two conductors. Twisting makes each half-twist's pickup cancel the next, so the net loop area goes to nearly zero. A grounded foil shield drains capacitive pickup but magnetic flux passes right through it.
- *How did you handle the client pushing back?* I let them try their options, because each was cheaper than a re-pull if it worked. When they didn't, I put the proof on the ground in front of them instead of arguing.
- *Who approved that cable?* Treat it as a process gap: the cable was approved before anyone read its data sheet. My fix is reading cable sheets at submittal, every job.
- *Did it stay clean after the re-pull?* \[Confirm: zero ground faults through commissioning?\]

**Keep out:** that the designer approved the cable without reading the sheet. It's a process story, not a blame story.

## Story 4 — Canned air at a data center

**Value:** Owning the failure · **Length:** 191 words, about 80 s. It's short on purpose: tell it straight, land the lesson, stop.

**Script**

Seven months into my career, I was sent to a data center in San Francisco for a smoke detector trouble. The head was dirty and needed cleaning. I didn't put the system on test, and I didn't pull the head. I blew it out with canned air from under the raised floor.

It went to alarm. The building evacuated, and the fire department came through rush-hour traffic.

What I did next is the part that mattered. I didn't reset the panel to make it go away. I confirmed the alarm was mine, silenced it, and waited for the trucks so I could tell them myself that it was me and exactly what happened.

That day set three habits I still run on. If I'm touching a panel or a device, the system is on test first. Every test script I write starts with isolation and ends with a verified return to normal, because the worst outcomes of a test are an unplanned alarm and a system left disabled. And heads get vacuumed, not blown out.

In commissioning that's the whole job: nobody should ever learn about your test from an evacuation.

**Beats to memorize**

1. 7 months in · SF data center · dirty head
2. No test mode, didn't pull the head, canned air from under the floor
3. Alarm → evacuation → fire department at rush hour
4. Didn't reset; confirmed, silenced, met the trucks and owned it
5. On test first · isolation-to-return-to-normal scripts · vacuum, don't blow → "nobody learns about your test from an evacuation"

**Follow-ups, 15 seconds each**

- *What would you do differently in the moment?* Call central station, put the system on test with outputs disabled, pull the head and clean it away from the base, then restore and confirm normal before leaving.
- *Did anything release?* \[Confirm: was any suppression or pre-action zone tied to that detector? Did the canned air reach two cross-zoned detectors?\]
- *How did the customer react?* \[Fill in, one line.\]
- *Something more recent?* Go to the radios backup.

**Keep out:** jokes or minimizing. The calm, specific telling is what scores.

## Story 5 — Turning field lessons into something others can repeat

**Value:** Love of the game · **Length:** 235 words, about 100 s.

**Script**

For me, the best part of this work is turning what one expert knows into something the next person can repeat.

When I solve something hard in the field, I write it down so the next crew doesn't have to solve it again. That's become four playbooks my company uses: linear heat detection in automated storage, thermal imaging for solar sites, flame detection for battery storage, and EST panel migrations. The result is far fewer go-backs, and those jobs no longer depend on a select few people. We can send a lot more techs. \[Number: go-backs before and after, or techs qualified then and now.\]

It goes past the playbooks. I work with a UL-listed thermal detection manufacturer on their training programs, and I built my own camera placement tool around lens angle, obstructions and commodity type.

At night I build fire protection software with frontier models. One tool turns an existing EST3 program into a priced EST4 upgrade bill of materials. Another captures panel output during testing and checks devices off the points list as they come in. That's commissioning automation, the same problem your team has at scale.

Nobody asked me to do any of it. A lesson that lives only in my head doesn't help the next crew. Productizing a data center is the same job: turn expertise into something repeatable. I've been doing that on my own time for years, and I want to do it where the scale makes it matter.

**Beats to memorize**

1. "Turn what one expert knows into something the next person can repeat"
2. 4 playbooks in company use → fewer go-backs, more techs can go
3. Thermal detection training with the manufacturer + my own camera placement tool
4. Night tools: EST3→EST4 priced BOM; panel capture that checks off the points list
5. "Productizing a data center is the same job"

**Follow-ups, 15 seconds each**

- *Which tool matters most for this role?* The panel-capture app: it records what the panel reports during testing and marks each device off the points list, so the test record builds itself. \[Add one number: devices per day, or hours saved per test.\]
- *How do you use AI in your work today?* I build these tools with frontier models, and I'm the liaison for my company's AI design tool, so I see both sides: what the model gets right and where an engineer has to check it.
- *Won't side projects pull focus?* Every tool starts as a field problem I hit on a job. The work feeds the tools, not the other way around.

**Keep out:** pricing or business details of the tools. Keep it about the work they make repeatable.

## Backup scripts (45–70 seconds)

Shorter on purpose: these come out when a follow-up asks for a second example.

**Lab with smoke control and a third-party Cx FPE** — for questions about a commissioning agent, the AHJ or smoke control.

On a high-rise lab I ran the subs and programmed the fire alarm, and I was the contractor's liaison to the third-party commissioning FPE, so I was on the receiving end of every Cx script. We tested smoke control and the generator backup for the emergency circuits, and I was the main troubleshooter on fan and damper monitoring. \[The hardest one was \_\_\_, and the cause was \_\_\_.\] I ran the AHJ inspection \[result: \_\_\_\] and trained the owners before turnover. It taught me what makes a test day go right from the contractor's side: a script they've seen in advance, a pre-test that has already passed, and one person running the room. That's how I'd run it from the commissioning seat.

**FM Global live burn** — for questions about testing fairly or data integrity.

FM Global ran a live burn comparing aspirating smoke detection with linear heat in a flash freezer's exhaust, in very high airflow \[about \_\_\_ air changes per hour\]. I verified the ASD install beforehand. A one-square-foot pan fire was lit, and the ASD alarmed in about fifteen to twenty seconds. I'd noticed the linear heat was mounted behind steel beams, so I flagged it; otherwise the comparison would have measured the installation, not the technology. They retested it separately, and I never saw those results. A test only proves something if the setup is fair to every system in it.

**The radios** — for "a recent mistake".

On the Hawaii job I was late ordering radios for a crew of twelve. A coworker suggested a push-to-talk app on our phones. I bought the licenses, got the client's OK to use the site Wi-Fi, and we ran on it for less than radios would have cost. \[Confirm what you do now — e.g. comms goes on my mobilization list with the same lead time as materials.\] On a cutover, communication is part of the safety plan, not an afterthought.

## Open questions to finish the stories

Answer these in chat (rough is fine) and the brackets above get filled. The first four matter most.

- [ ] **Story 1, after Oct 30:** cutover date, devices tested, punch items still open, the day most of the crew flew home, and whether the AHJ or fire department witnessed anything.
- [ ] **Story 1:** how you split the twelve (crews per tower, a test team, a programmer?) and the one moment in the eight-hour window that nearly went wrong.
- [x] **Story 2:** did the correct COLO's valve also get the release, or only the wrong one? That decides how you describe the stakes.
- [ ] **Story 5:** one number for the playbooks — go-backs before and after, or how many techs can run those jobs now versus before.
- [x] **Story 2:** were Fire 1 at 0.0625 %/ft and Fire 2 at 1 %/ft the factory defaults or your settings? How long did the whole job take?
- [ ] **Story 3:** how long had the faults gone on before you diagnosed them, the site's size in MW or MWh, and zero faults after the re-pull?
- [ ] **Story 4:** was any suppression or pre-action zone tied to that detector, and did the canned air reach two cross-zoned heads? How did the customer react?
- [ ] **Backups:** the lab's hardest damper or fan problem and whether the AHJ passed it first time; the freezer airflow (air changes per hour); what you do differently about comms now.
