# ENERGIZE — Fluidstack Interview Game

**Working title:** ENERGIZE · *Commission the campus. Ace the interview.*
**Player:** Brandon (ShootC) · **Interview:** Mon Nov 2, 2026, Cx, QA & Field Engineer, Fire Protection, Fluidstack · Stage 1 = 35% technical, 65% EQ
**Platform:** one self-contained `index.html`, runs offline in a phone browser, added to the home screen. No backend, no accounts, no build step required to play.

This document is the design spec. `CLAUDE_CODE_PROMPT.md` is the build order. Everything in `content/` is the source of truth for facts — **no number or code section in the game may come from anywhere else.**

---

## 1. The idea in one paragraph

You are the commissioning engineer on a modular AI data-center campus that is dark. Every study area from the 14-day plan is a building or yard on that campus, and every topic inside it is a system that has to pass commissioning before the building can energize. You run a short shift each day (10–15 minutes, longer if you want), the game hands you the cards that are due using the same spaced-repetition rules as the morning quiz tracker, and as topics reach *Locked In* the lights come on building by building. Campus readiness is the same weighted number the tracker reports. On Nov 2 the whole campus should be lit and the last screen is the interview room.

Why a game and not flashcards: the three failure patterns so far are (1) answering half the question, (2) forgetting the code section, (3) rambling the stories. Each card type below is built to attack one of those directly, and the campus map makes the "what's still dark" question impossible to ignore.

---

## 2. Source content (in `content/`)

| File | What it is | Used for |
| --- | --- | --- |
| `study-guide.md` | The full 14-day plan and study guide (~80 KB). Every number, table, sequence, formula, and "likely question" with its model answer. | The entire technical question bank, memory hooks, model answers, interviewer scenarios. |
| `story-scripts.md` | The five STAR stories, backups, 60-second intro, and "why Fluidstack" as 90–120 s spoken scripts. | Story rehearsal cards, the mock-interview boss fight, the day-of mode. |
| `topics.json` | The 65 topics from the tracker: id, area, topic, plan day, weight (Core/Support/Light), current rating, points, tests, streak, dates. | The campus map, the scheduling queue, and the starting state (import on first run so current ratings carry over). |
| `procedure-notes.md` | The rating scale, review intervals, readiness formula, queue-building rules, and special-day rules copied from the morning-quiz procedure. | The scheduler and the scoreboard must match these exactly so the game and the tracker agree. |

Areas → buildings (from `topics.json`, 65 topics):

| Area | Topics | Building on the map |
| --- | --- | --- |
| Cx framework (C1–C7) | 7 | Commissioning trailer (HQ — lit first, it's the hub) |
| Sprinkler & underground (S1–S8) | 8 | Yard, underground main, riser room |
| Pre-action (P1–P8) | 8 | Data Hall 1 |
| Fire pump (F1–F9) | 9 | Pump house |
| Emergency power (E1–E3) | 3 | Generator block / islanded power plant |
| Smoke control & FA FPT (K1–K4) | 4 | Office block and stair tower |
| Gaseous & ASD (G1–G6) | 6 | Electrical rooms and Data Hall 2 (VESDA) |
| BESS, gas & mist (B1–B4) | 4 | Energy yard: BESS containers, turbine enclosure |
| Applied & refresher (A1–A5) | 5 | Field office: scripts and calcs |
| Interview (I1–I11) | 11 | Conference room (the Google Meet) — the final building |

Weights: Core = 3, Support = 2, Light = 1 (42 Core, 17 Support, 6 Light).

---

## 3. Ratings, scoring, scheduling — must match the tracker

**Rating ladder** (per topic):

| Rating | Points | Earned by | Next review |
| --- | --- | --- | --- |
| Locked In | 100 | Clean cold answer with number + code section + follow-up, on a second day (streak ≥ 2) | +4 days |
| Minor Refresh | 75 | Right but one detail slipped, slow, or needed a nudge; or the first clean answer (streak 1) | +2 days |
| Needs Improvement | 40 | Framework right, a key number/step/reason missing | +1 day |
| Not Ready | 10 | Wrong, guessed, blank | +1 day |
| Not Tested | 0 | Never quizzed | the morning after its plan day |

- No review date past **2026-11-01**. Anything not Locked In by then is due Nov 1 for the sweep.
- **Readiness** = Σ(weight × points) / Σ(weight × 100). Show it two ways: *overall* (all 65) and *on tested* (topics with tests ≥ 1), plus "N of 65 tested". Target: **85% overall by Nov 1, no Core topic below Minor Refresh.**
- A topic's rating moves by the *worst* card result in that session on that topic (so one card can't lock in a topic that has an unanswered half). A topic needs at least 2 distinct cards clean in a session to count as a clean session for streak purposes, except Light topics (1 is fine).
- **Streak** increments on a clean session, resets to 0 otherwise. Locked In requires streak ≥ 2 on different days.
- Every card result records: topic id, card id, result (clean / slipped / missed), seconds taken, date.

**Queue building (the daily shift):**
1. Due = topics with `next_review` ≤ today. Order: Not Ready → Needs Improvement → Not Tested → Minor Refresh → Locked In; then Core → Support → Light; then plan day. Skip Not Tested topics whose plan date is after yesterday (don't quiz what hasn't been studied yet).
2. Default shift = 15 cards: up to 6 redos (Not Ready / Needs Improvement, Core first), 8 coverage cards (Not Tested first by plan day, then due Minor Refresh, plus 1 spot-check on a Locked In topic not tested in 3+ days), 1 out-loud story/scenario card. Fewer than 6 redos → fill with coverage.
3. Pick cards within a topic so the same card isn't shown two sessions in a row if the topic has alternatives; prefer the card type the topic missed last time.
4. "Keep going" after the shift pulls the next 5 from the queue, forever, until the queue is empty. Then offer a Number Blitz or a Story.

**XP and fun layer (on top, never instead of the ratings):**
- XP per card: clean 10, slipped 5, missed 1, +5 bonus if under the par time, +10 for naming the code section unprompted on a self-graded card. Daily shift complete: +50. 
- Levels are the buildings: a building *energizes* when every topic in it is ≥ Minor Refresh and ≥ 60% of its weighted points are at Locked In. Show a short light-up animation and a one-line "what this building proves" quote from the guide (e.g. "At L4 I prove the system. At L5 I prove the building.").
- Streak flame: consecutive days with a completed shift. Breaks are shown, never punished with lost ratings.
- No lives, no timers that lock you out, no fake urgency. The only real deadline is Nov 2 and the header shows days remaining.

---

## 4. Card types

Each card has: `topicId`, `type`, `prompt` (phrased the way an interviewer or a test script would phrase it), `answer` (structured, see §6), `codeRef` (the section/standard the guide gives — or `null` when the guide says "confirm in your edition"), `hook` (one-line memory hook shown after a miss), `source` (the heading in `study-guide.md` it came from), `par` (seconds).

### 4.1 Cold Number (auto-graded)
"Dry and double-interlock air test: ___ psi for ___ h, loss ≤ ___ psi. Code section?" — numeric fields with tolerance (exact for integers, ±2% for decimals), plus a code-section field matched loosely (e.g. accepts "NFPA 13 29.2.2", "13 §29.2.2"). Partial credit = *slipped*. Blank number = *missed*. This card attacks "skipped the second half": every blank must be filled before Submit is enabled, and the card tells you how many blanks it has.

### 4.2 Order the Steps (auto-graded)
Tap the steps into order: acceptance sequences (L2→L5→turnover), the double-interlock L4 script (7 steps), the pull-the-plug IST (5 steps), the IST fire scenario, the pump troubleshoot order (test setup → suction → pump), the door-fan fix order. Shuffled; clean = exact; one swap = slipped; more = missed. Shows the correct order with the guide's wording afterward.

### 4.3 Build the Matrix (auto-graded)
A mini IST matrix: inputs down, outputs across, tap each cell to cycle ● / — / "per BOD". Graded against the example matrix in the guide. The *blank* cells count — proving an output does **not** happen is half the job, and the card says so.

### 4.4 Interviewer Scenario (self-graded, timed)
"The 24-hour air test lost 3 psi. What next?" / "Stair pressurization reads high with all doors closed. What do you check?" A 90-second countdown starts; you answer out loud (or type bullets); tap *Reveal*; the model answer from the guide appears as a checklist of beats; tick the beats you actually hit; the card grades itself: all beats + a number + the code reference = clean; one beat missing = slipped; framework only = missed. Honor system on purpose — it's how the real interview works.

### 4.5 Story Rehearsal (self-graded, timed)
One of the five stories or backups from `story-scripts.md`. A 120-second bar fills; the four beats are shown as empty chips (Hook · Decision + reason · A number · Lesson); you tap each chip as you hit it while speaking. Optional: record audio locally (MediaRecorder, never uploaded) and play it back. Clean = all four chips in 90–120 s; over time or a missing number = slipped; rambled past 150 s or no lesson = missed. After the card: the script text, with the numbers highlighted.

### 4.6 Spot the Defect (auto-graded)
A short FPT script excerpt (6–8 lines) with one planted error: a wrong number, a missing prerequisite (central station not on test), a missing return-to-normal, an actuator left connected. Tap the bad line. This is the "most dangerous outcome of a test is a system left disabled" lesson as a game.

### 4.7 Number Blitz (bonus mode)
60 seconds, rapid tap-to-reveal numbers from Locked In and Minor Refresh topics only. "40 psi / 24 h / 1.5 psi" → tap *Knew it* / *Nope*. Doesn't change ratings; it's the warm-up and the reward. Tracks best score.

### 4.8 Boss Fight: Mock Interview (Days 6, 12, 13, and on demand)
Five questions, 35/65 mix (2 technical, 3 values), each with a timer and a follow-up ("What would you do differently?" / "What did that cost?"). Pulled from the "Likely questions" list in the guide, follow-ups included. Self-graded with beats like 4.4/4.5. Produces a one-screen debrief: headline in the morning-quiz format ("4 of 5 framework right · 2 close · 1 clean"), weakest answer, and what to re-read tonight.

---

## 5. Screens and flow

1. **Home / Campus map.** An SVG campus, each building colored by its readiness (dark → amber → lit). Header: date, "9 days to interview", readiness overall / on tested / N of 65. One big button: **Start shift** (shows how many cards and the estimated minutes). Secondary: Blitz · Stories · Mock interview · Browse.
2. **Shift.** Full-screen cards, one at a time, progress dots at top. Swipe is *not* used for answering (too easy to fat-finger); big buttons. After each card: result, the exact correction from the guide in 1–2 lines, the hook if missed. Between cards nothing else.
3. **Shift debrief.** Headline (framework right · close · clean), readiness before → after (both numbers), the three weakest topics with the study-guide section to re-read tonight, tonight's plan line from the 14-day table, and any building that just energized.
4. **Building view.** Tap a building: its topics, each with rating, streak, last result, next review, and a *Drill this* button that runs only that topic's cards.
5. **Browse / Study.** The study guide rendered as readable sections (from `study-guide.md`), searchable, so you can re-read a section right after a miss without leaving the app. Stories render as scripts with numbers highlighted and a start-timer button.
6. **Settings.** Import `topics.json` (carries over tracker ratings), export state as JSON (same shape as `topics.json` so it can be pasted back to the tracker), reset, sound on/off, haptics on/off, cards per shift.

**Special days** (the app reads the real date):
- Oct 26–30 (cutover week): shifts default to 10 cards; stories get 2 of them.
- **Nov 1:** the sweep — the shift is every topic not Locked In, up to 20 cards, redo any missed before it ends.
- **Nov 2:** interview-day mode. Six quick confidence cards from Locked In topics + the 60-second intro timer, then a full-screen "Stop. You're ready. Go win it." and the day-of checklist from the guide. Nothing else is offered.
- After Nov 2: the home screen shows the final campus and total stats. Retire gracefully.

---

## 6. Data shapes

**`questions.json`** (generated by Claude Code from `content/`, ~350–450 cards):
```json
{
  "id": "P2-num-01",
  "topicId": "P2",
  "type": "number",            // number | order | matrix | scenario | story | defect
  "prompt": "Dry and double-interlock air test — pressure, duration, allowed loss, and the section.",
  "interviewerPhrasing": "The 24-hour air test lost 3 psi. What next?",
  "answer": {
    "fields": [
      {"label": "psi", "value": 40, "tolerance": 0},
      {"label": "hours", "value": 24, "tolerance": 0},
      {"label": "max loss psi", "value": 1.5, "tolerance": 0.01}
    ],
    "codeRef": "NFPA 13 §29.2.2",
    "codeRefAliases": ["13 29.2.2", "NFPA 13 29.2.2", "29.2.2"],
    "explanation": "40 psi for 24 h, loss ≤ 1.5 psi. A 3 psi loss fails: find the leak (grooved couplings, threaded joints), fix, and retest the full 24 h."
  },
  "hook": "40 · 24 · 1.5 — forty for a day, lose a buck-fifty.",
  "source": "Sprinkler and underground › table",
  "par": 25,
  "confirmInEdition": false
}
```
Other types carry `answer.steps[]` (ordered strings), `answer.grid` (inputs, outputs, cells), `answer.beats[]` (scenario/story checklist), `answer.lines[]` + `answer.defectIndex`.

**`state.json`** (localStorage, exportable): the 65 topic records exactly as in `topics.json` plus `history[]` of card results, `xp`, `dayStreak`, `blitzBest`, `energized[]`, `settings`.

---

## 7. Content rules for the question bank (non-negotiable)

1. Every number, time, pressure, percentage, section number and sequence comes from `content/study-guide.md` or `content/story-scripts.md`. If it isn't there, the card doesn't exist.
2. Where the guide hedges ("confirm sections in your edition", "confirm table number"), set `confirmInEdition: true`, make `codeRef` the standard name only (e.g. "NFPA 110"), and the card says so after grading. Never invent a section number to fill the field.
3. Prompts are open recall — no multiple choice anywhere except Spot the Defect and the Matrix (which are inherently selection tasks).
4. Every Core topic gets 6–10 cards across at least 3 types; Support 4–6; Light 2–3. Every topic gets at least one card phrased as an interviewer would ask it.
5. Each card's `explanation` is 1–2 lines in the guide's wording, right answer first. Each `hook` is one line, concrete, and uses the numbers.
6. The Likely-questions list (14 items) and their model answers become the Scenario and Mock-Interview cards verbatim in substance.
7. Stories use the exact numbers in the script doc (e.g. 16 nodes, ~1,500 devices, 12 people, under 8 h; 20 detectors from 4 designs; ~7 modules past 0.4 V). Bracketed `[…]` items in the scripts are open — show them as "fill in" chips, never as facts.

---

## 8. Look and feel

- Dark by default (it's a dark campus coming online). One accent: amber for "coming up", a warm white for "energized", a red only for Not Ready. High contrast, 16px+ body, big tap targets, thumb-zone buttons.
- The campus map is a flat isometric-ish SVG, hand-drawn simple shapes, not a stock illustration. Buildings get window lights proportional to topic readiness. The conference room is the last to light and sits center-front.
- Tiny, honest animations: a light coming on, a progress bar filling, a checkmark. Haptic tick on clean (navigator.vibrate), optional.
- Copy is in the guide's voice: direct, second person, no cheerleading. The game is encouraging by showing progress, not by saying "great job".
- Works at 390×844 first; fine on desktop.

---

## 9. Non-goals

No login, no server, no analytics, no AI calls at runtime, no spaced-repetition library (the rules above are small enough to write by hand and must match the tracker), no multiple-choice technical questions, no content outside `content/`.
