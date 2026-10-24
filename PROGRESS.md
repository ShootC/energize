# ENERGIZE — PROGRESS

Hand-off file. Every session starts by reading this. Keep it current.

## Done

### Phase 1 · Scaffold and game engine (Opus, Oct 23)

- **Repo.** `content/` copied from the kit (source of truth for facts). `energize-kit/` and the zip are git-ignored duplicates. LF line endings enforced (`.gitattributes`).
- **Engine** (`src/engine/`, pure JS, no DOM):
  - `dates.js` — ISO-day helpers, UTC arithmetic.
  - `rating.js` — ladder, points, intervals, review cap 2026-11-01, `applySession`, readiness (overall / on tested / tested count / Core below Minor Refresh), debrief headline, XP.
  - `grader.js` — grading for all six card types, loose number and code-section matching.
  - `scheduler.js` — due queue, the daily shift (redo / coverage / spot check / out loud), follow-ups, Keep going, Drill this, special days (Oct 26–30 cutover, Nov 1 sweep, Nov 2 interview day, after Nov 2), Blitz deck.
  - `state.js` — create / record result / complete shift / save / load / export / import (topics.json or state.json).
  - `campus.js` — areas → buildings, the energize rule, a verbatim guide quote per building.
  - `schema.js` — the questions.json and mock.json schema (used by `validate.js`, `build.js`, tests).
- **Data.** `src/data/sample.json` = 10 hand-written cards used only while `questions.json` is empty (or with `?deck=sample`).
- **Build.** `build.js` → `dist/index.html`: one file, no external requests (the build refuses `<script src>`, `<link href>`, remote media, CSS `url()`, `@import`, `fetch`, XHR, WebSocket). Study guide and story scripts rendered to HTML (with the LaTeX formulas) for Browse.
- **UI** (`src/ui/`, ugly but working): home with readiness and a building list, the shift loop with all six card types, result screen (result, correction, hook on a miss, re-read link), debrief, building view with Drill this, Browse with search and deep links, Settings (cards per shift, sound/haptics flags, import, export, reset), basic Number Blitz, story list, mock-interview stub. `?date=YYYY-MM-DD` overrides today.
- **Tests.** `node:test`: spec tables, the hand-built Oct 24 queue and shift, special days, follow-ups, card picking, every grader rule, persistence and export/import round trip, schema errors, Markdown/TeX rendering, bundler, offline check.
- **Verified** (headless Edge over CDP, 390×844, network disabled): readiness on the page = engine = hand computation, a full sample shift, ratings update, reload persists, export → reset → import round-trips byte-for-byte, Browse search, Oct 26 / Nov 1 / Nov 2 / Nov 3 modes, no console errors, zero network requests.

Readiness for the shipped `content/topics.json` (Oct 23 quiz):

| | by hand | engine | page |
| --- | --- | --- | --- |
| overall | 3 × (7×40 + 3×75) = 1515 / 16600 = 9.13% | 1515 / 16600 | 9.1% |
| on tested | 1515 / (10 × 300) = 50.5% | 1515 / 3000 | 50.5% |
| tested | 10 of 65 (C1 C2 C3 C4 C5 C7 S2 S3 S4 I3, all Core) | 10 of 65 | 10 of 65 |

### Phase 2 · Question bank (Fable, Oct 23)

Sub-sessions 2a–2d ran as four parallel forks of one session and were merged; every card was then read against the guide / scripts by the parent session before the merge.

- **`src/data/questions.json` — 388 cards, all 65 topics.** `node validate.js src/data/questions.json --strict` is clean (0 errors, 0 warnings). Every topic has ≥1 `interviewerPhrasing` card; every Core topic has ≥3 types. Types: number 134 · scenario 119 · defect 68 · order 40 · matrix 17 · story 10.

| Area | Cards | Per topic |
| --- | --- | --- |
| Cx framework (2a) | 45 | C1 7 · C2 6 · C3 7 · C4 7 · C5 7 · C6 5 · C7 6 |
| Sprinkler & underground (2a) | 42 | S1 5 · S2 7 · S3 6 · S4 6 · S5 3 · S6 7 · S7 5 · S8 3 |
| Pre-action (2a) | 47 | P1 6 · P2 6 · P3 6 · P4 4 · P5 7 · P6 7 · P7 5 · P8 6 |
| Fire pump (2b) | 43 | F1 7 · F2 6 · F3 6 · F4 4 · F5 5 · F6 4 · F7 3 · F8 6 · F9 2 |
| Emergency power (2b) | 18 | E1 7 · E2 6 · E3 5 |
| Smoke control & FA FPT (2b) | 26 | K1 6 · K2 7 · K3 8 · K4 5 |
| Gaseous & ASD (2c) | 39 | G1 9 · G2 7 · G3 5 · G4 5 · G5 8 · G6 5 |
| BESS, gas & mist (2c) | 27 | B1 8 · B2 7 · B3 6 · B4 6 |
| Applied & refresher (2c) | 26 | A1 3 · A2 7 · A3 7 · A4 6 · A5 3 |
| Interview (2d) | 75 | I1 7 · I2 6 · I3 8 · I4 8 · I5 8 · I6 7 · I7 7 · I8 6 · I9 6 · I10 6 · I11 6 |

- **Requested items present.** IST matrix cards covering all nine rows of the guide's table (C4-mat-01/02/03, plus A3-mat-01, B2-mat-01, K3-mat-01); order cards for the sprinkler checklist (S6-ord-01), the double-interlock L4 script (P5-ord-01, A2-ord-01), trip-test records (P6-ord-01), the pump troubleshooting order (F8-ord-01), the pull-the-plug IST (E2-ord-01), smoke control acceptance (K2-ord-01), clean agent acceptance (G1-ord-01), the door-fan fix order (G2-ord-01), the BESS L5 scenario (B2-ord-01), ASD acceptance (G5-ord-01), the IST fire scenario (C4-ord-01, A3-ord-01); the affinity-laws-in-words card (F6-num-01); defect cards on every topic that has an FPT (68 in all, including the asked-for C3, C5, P5, P6, F1, E2, K2, G1 actuators, G5 learn-in-dust, B3 surrogate gas). Scenario cards from the 14 likely questions: Q1–Q4 → the story topics, Q5 → C2, Q6 → C7, Q7 → I2, Q8 → C1, Q9 → C4 and A3, Q10 → G2, Q11 → F8, Q12 → B2, Q13 → P5, Q14 → S7; every section "Likely question" has its scenario (S6, P8, F8, E2, K1, G1, G4, B4, G5, B3, B1). Story cards: the five stories (I3–I7), the three backups (I8), the 60-second intro (I1) and Why Fluidstack (I2).
- **`src/data/mock.json` — 3 decks × 5 questions**, each exactly 2 technical / 3 values, with follow-ups, par 90–120, beats, source, topicId and cardId links. Mock 1: Q1 Story 1, Q8 Cx levels, Q2 Story 2, Q14 containment, Q7 Why Fluidstack. Mock 2 (technical deep dive): Q9 IST fire scenario, Q3 Story 3, Q11 pump 150%, Q5 skip a test, the lab backup. Mock 3: Q4 Story 4, Q10 door fan, Q6 disagreement, Q12 Li-ion, Story 5. All seven values questions and six of seven technical (Q13 lives only in the bank).
- **Tests.** `tests/bank.test.js` (8 tests): the bank validates with no errors and no warnings; every topic is within the spec range with ≥3 types on Core and an interviewer phrasing; every card grades **clean on its own model answer** through the real grader; every codeRef alias and word-field alias is accepted; story scripts are verbatim from the docs, each has exactly one lesson beat and no graded beat quotes a bracketed line; confirmInEdition cards name the standard only; order steps and defect lines are unique and no prompt is multiple choice. `tests/schema.test.js` and `tests/build.test.js` no longer expect an empty bank. 87 tests, all passing.
- **App.** `?deck=sample` forces the sample deck (otherwise it is only the empty-bank fallback). `tools/smoke.js` now runs two passes: the original sample-deck checks (`?date=2026-10-24&deck=sample`) and a real-bank pass that plays the Oct 24 shift with right answers (every card clean; a 0-second story slips), checks the debrief, and checks Nov 2 = six confidence cards + the I1 intro. 34/34.
- **Verified.** `npm test` 87/87 · `node build.js` → `dist/index.html` 678 KB · `node tools/smoke.js` 34/34 · a quick fact audit (every number field, every codeRef section token, every story paragraph found in the guide / scripts) reports nothing except deliberately planted defect values — Phase 4 writes the real `scripts/audit.js`.

### Phase 3 · Full UI and campus map (Opus, Oct 23–24)

Six commits, one per deliverable. Everything in `src/ui/` was rebuilt on the Phase 1 engine; one pure engine module was added (`src/engine/mock.js`).

- **Design tokens and base styles** (`src/ui/styles.css`): dark campus palette as CSS variables — one amber accent (coming up, Minor Refresh, slipped), warm white (energized, Locked In, clean), amber-dim (Needs Improvement), red only for Not Ready; overtime and wrong items are amber, never red. 17px body, ≥48px tap targets, inputs ≥16px (no iOS zoom), safe-area padding, 640px page, reduced-motion guard. No external fonts or images.
- **Campus map** (`src/ui/map.js`): an original flat isometric SVG, hand-rolled projection, ten buildings placed so the conference room is front and center. Each building's windows light in proportion to its area's weighted readiness (scattered by a seeded shuffle), amber while coming up; when the §3 energize rule is met the building turns warm white with a halo. A building that energized during a shift plays a light-up (windows flick on one by one, then the glow) on the next home visit (`app.pendingCelebrate`). Buildings are tappable and keyboard-focusable; the list below repeats them with readiness bars. `buildingArt()` draws one building alone for the building view.
- **Header**: date, days to Nov 2, readiness overall / on tested / N of 65 tiles (with an 85% target tick), Core-below-Minor count, streak flame + XP, settings gear, special-day banner.
- **Cards** (`src/ui/cards.js`, `src/ui/audio.js`): all six types per spec §4 — see the checklist below. Timers and the microphone stop on every route change (`stopCardActivity`).
- **Result screen**: Clean / Slipped / Missed coloured by ladder level, animated check on clean, XP, the correction from the guide, the hook on a miss, a per-item review (fields, step positions, matrix cells with notes, ticked beats, the planted line), the story script with numbers highlighted and the recording to play back, the rating change as pills, the re-read deep link. Haptic tick and a soft Web Audio chime on clean (Settings → Haptics / Sound).
- **Screens** (`src/ui/screens.js`, `src/ui/boss.js`): building view, shift debrief, Browse, Number Blitz, stories, Mock Interview, settings, Nov 2 and post-interview screens.
- **Mock interview**: `src/engine/mock.js` grades an answer like a scenario — problems = beats missed + no number (only when the model answer carries one) + over par; 0 clean, 1 close, more missed; framework if ≥ half the beats. Headline in the morning-quiz format, weakest answer, re-read list. Practice only — no rating changes. 5 tests in `tests/mock.test.js`, including every shipped question grading clean on a perfect answer.
- **Dev parameters**: `?date=YYYY-MM-DD`, `?deck=sample`, and new `?card=<id>` (opens one card as a practice drill — handy for Phase 4 and 5). `window.energize.go(route, arg)` navigates from the console.
- **Verified**: `npm test` 92/92 · `node build.js` → `dist/index.html` 758 KB · `node tools/smoke.js` 53/53 — the third pass visits every screen and card type at 390×844 with the network disabled, checks each renders its key parts and none scrolls sideways, runs a full mock deck to its debrief, follows a missed card's re-read link into Browse (scrolls to and flashes the heading) and back, and checks the Nov 2 home offers nothing but the shift. No console errors, zero network requests. Screenshots of every screen were reviewed by eye during the build.

#### Screen-by-screen checklist (Phase 3)

| Screen | How to reach it | What it shows / does | Checked |
| --- | --- | --- | --- |
| Home | open the page | header tiles, campus map (tap a building), energize light-up, Start shift (cards · minutes), hint, Number Blitz · Stories · Mock interview · Browse, building list | smoke + shots |
| Shift card | Start shift | progress dots (follow-ups smaller), slot kind + topic + rating pill, Pause | smoke + shots |
| · Number | any `-num-` card | labelled blanks + code section, blank counter, Submit locked until all filled, Enter advances | smoke |
| · Order | any `-ord-` card | numbered slots, tap to place, tap a placed step to send it back, Undo | smoke |
| · Matrix | any `-mat-` card | stacked per input, tap cycles the card's options (custom ones too), "—" is an answer | smoke |
| · Scenario | any `-scn-` card | par countdown (overtime amber), optional typed bullets, Reveal → beat checklist, fill-in beats shown not graded, said a number / named the code | smoke |
| · Story | any `-sty-` card | elapsed bar with the shaded target window, beat chips, optional Record (local only), Done speaking | smoke (recording not automatable headless) |
| · Defect | any `-def-` card | tap a line, confirm | smoke |
| Result | after any card | see Done above; Next / Finish is the last button | smoke |
| Debrief | finish a shift | headline, before → after tiles, energized buildings, re-read tonight links, tonight's plan, Keep going | smoke |
| Building | tap a building | building art, readiness, distance to energize, quote, topics with Drill this | smoke |
| Browse | nav or a re-read link | tabs, search with highlighted snippets, contents list, deep link scroll + flash | smoke |
| Number Blitz | nav | 60 s from the first reveal, Knew it / Nope, best score | smoke |
| Stories | nav | the 10 story cards with target windows and ratings | smoke |
| Mock interview | nav | deck list (today's deck flagged from the plan), answer → follow-up → grade ×5, debrief | smoke |
| Settings | gear | cards per shift, sound, haptics, import file / paste, export topics.json / state.json, reset | smoke |
| Cutover / sweep | `?date=2026-10-27` / `2026-11-01` | banner, 10 / 20-card shifts, Mock N today | smoke + shots |
| Nov 2 | `?date=2026-11-02` | quick confidence cards + the 60-second intro, nothing else; then "Stop. You're ready. Go win it." + day-of checklist | smoke + shots |
| After Nov 2 | `?date=2026-11-03` | "The campus is commissioned.", the final campus, totals; gear kept for export | smoke + shots |

### Phase 4 · Accuracy audit (Fable, Oct 24)

- **`scripts/audit.js`** — for every card (and every mock question) extracts the facts it teaches — numbers with their units, section references, identifiers (L4, 9540A, EST3), word answers, order steps, beats, defect lines — and locates each one, verbatim or trivially reformatted (1,560 = 1560, 24-hour = 24 h, "sixteen" = 16, "annually" = 1 yr = 12 mo, a table cell's unit taken from its column header), in the block its `source` names, then the section, the file, then both files. Writes `audit-report.md` (repo root; exit 1 while it has findings). `--review` appends the soft signals (paraphrased beats and steps, facts drawn from another section, matrices built from prose, planted lines whose numbers are all real); `--card <id>` traces one card fact by fact.
- **What it reports**: facts in neither source file; graded facts (number fields, `codeRef`, order steps) found only outside the card's section; hedged references ("confirm in your edition") on cards without `confirmInEdition`, and `confirmInEdition` cards with a section number; order cards whose steps are not the guide's sequence or not in its order; story scripts and beat quotes that are not verbatim, graded beats that quote a bracketed line, cards without exactly one lesson beat; matrix cells against the guide's tables (the IST matrix, the gas-detection table, the which-story table); prompts that read as multiple choice, offer the word answer as an option, or contain a numeric answer; topics outside the per-weight range; source labels that do not resolve (headings, bold labels, "table", list numbers and table-row keys all resolve); mock.json beats against the question's section plus every section its topic's cards cite.
- **`scripts/audit-allow.json`** — 10 entries (13 reported items) that are deliberately not guide facts or are accepted cross-references, each with a reason: the hypothetical 130 s reading (S3-scn-02), the planted 0.03 in. w.c. repeated in K1-def-01's correction, the affinity laws in words (F6-num-01, asked for by the Phase 2 brief), the 0.7 S / CIS 0.70 coincidence (K3-num-04), the 10% main-drain rule that lives in Pre-action (S4-num-01), "NICET IV" as 4 (I1-num-01), IFC 901.6.2.2 from the Smoke control table on C2-num-01 (decision 48), and two order cards that sequence a guide paragraph (C6-ord-01 "in advance", F3-ord-01 "at peak load"). They are listed in the report's appendix, never hidden; an entry with `"decision": true` is an open question and prints under "Needs your decision" (none open: C2-num-01's IFC 901.6.2.2 was decided Oct 24 — keep it, decision 48).
- **Findings fixed by hand** (9 cards): S4-scn-01's hook invented "for 30 years" (now the guide's 10% rule) · E1-num-03's prompt said "power within 10 s" while asking for Type 10 (now two blanks) · A1-num-02's prompt printed the Hazen-Williams constants it asked for (now k, a, b) · A2-num-01 asked for the "60-second rule" while asking for 60 (now "delivery-time rule") · K3-scn-01 re-sourced from Story 2 to Cx › Script development (four of its six beats) · C3-def-01's excerpt listed Return to normal before Failure modes (reordered; planted line now line 7) · S1-ord-01 split "both hydros" into underground-then-aboveground, which the guide does not say (now the guide's L3 line into L4: flush → both hydros → signed certificates → inspector's test; closes the Phase 2 open question) · P6-num-01 accepted "orifice" for "K-factor" and the alias sat in the prompt (dropped) · F3-def-01's filler line equated peak load with 150% flow (now "Run the pump at peak load").
- **Reading pass.** Every one of the 388 cards was read against the guide / scripts by area (Cx, Sprinkler, Pre-action, Fire pump, Emergency power, Smoke control, Gaseous & ASD, BESS / gas / mist, Applied, Interview), plus the 15 mock questions against the likely-questions list and the story beats. The nine cards above were the only discrepancies; every other number, section, step order, matrix cell and beat matched the source. The only judgment calls left are under Open questions.
- **Gate.** `tests/audit.test.js` runs the audit and fails on any finding (and checks every allowlist entry names a real card with a reason). 94 tests.
- **Verified**: `npm test` 94/94 · `node validate.js … --strict` clean for the bank and mock.json · `node build.js` → 758 KB · `node tools/smoke.js` 53/53 at 390×844 offline.

## In progress

- Nothing. Next: **Phase 5** (phone QA + ship, Opus).

## For the next sessions (Phase 5 ship; re-audits)

- **Phase 4 is done** (`scripts/audit.js`, `audit-report.md`, `scripts/audit-allow.json`, `tests/audit.test.js`). When the guide or the scripts change: edit `content/*.md`, run `node scripts/audit.js --review`, fix the cards it lists by following the guide (never from memory), re-run until the report says `0 findings`; `npm test` fails while it has any. A card that deliberately carries a non-guide number (a hypothetical reading in an interviewer prompt) goes in `scripts/audit-allow.json` with a reason. To eyeball a card after fixing it: `node build.js`, then open `dist/index.html?card=<id>`.
- **Phase 5** builds on this UI. Things it should know:
  - Story recording uses `getUserMedia`, which most browsers refuse on `file://`; the card then says "Microphone not available here" and works without it. Served over https (GitHub Pages) it should prompt once — verify on a real phone.
  - Smoke hooks to keep: `#r-overall`, `#start-shift`, `#nav-settings` (the gear), `#nav-browse`, `#nav-blitz`, `#nav-stories`, `#nav-mock`, `#pause-shift`, `#export-state`, `#export-topics`, `#export-text`, `#import-paste`, `#settings-msg`, `#browse-search`, `#deck-mock-N`, `#mock-done`, `#mock-reveal`, `#mock-grade`, `#mock-headline`; button texts `Submit`, `Submit order`, `Submit matrix`, `Reveal`, `Grade it`, `Done speaking`, `This line`, `Reset progress`; `.result h2` starts with Clean / Slipped / Missed and Next / Finish is the last `.result button`.
  - Landscape and 430×932 are untested; the layout is a single 640px column, so it should hold.
  - First paint: the page is one 758 KB file (the rendered guide is ~half of it, inside `<template>` so it isn't laid out until Browse opens).

### Adding or fixing cards later

Edit `src/data/questions.json` directly (keep topic order; one card per type gets picked first per topic), then:

```
node validate.js src/data/questions.json --strict
node scripts/audit.js --review          # every fact against the guide → audit-report.md
npm test && node build.js
```

The audit locates every number, unit, reference, step, beat and line in the source the card names (see Phase 4 above); the validator checks: schema per type, unique ids, id ↔ topic ↔ type agreement, topicId exists, `source` starts with a real heading (`node validate.js --headings`), `confirmInEdition` cards have no section number in `codeRef`; it warns on per-topic counts (Core 6–10 over ≥3 types, Support 4–6, Light 2–3), missing `interviewerPhrasing`, order cards outside 4–8 steps, defect scripts outside 6–8 lines, number cards with a codeRef but no aliases. `tests/bank.test.js` turns those warnings into failures and adds the answerability checks.

### Card type names

`number` · `order` · `matrix` · `scenario` · `story` · `defect` (ids use `num` · `ord` · `mat` · `scn` · `sty` · `def`).

### questions.json schema (as implemented)

A JSON array of cards. Allowed top-level keys only:

| key | required | notes |
| --- | --- | --- |
| `id` | yes | `<topicId>-<abbr>-<NN>`, e.g. `P2-num-01`. Prefix must equal `topicId`, abbr must match `type`. |
| `topicId` | yes | one of the 65 ids in `content/topics.json` |
| `type` | yes | one of the six names above |
| `prompt` | yes | what the card asks (open recall) |
| `interviewerPhrasing` | no | how an interviewer would ask it; shown above the prompt when different |
| `answer` | yes | object, shape by type (below); always has `explanation` |
| `hook` | yes | one line, shown after a **missed** card (Needs Improvement / Not Ready level) |
| `source` | yes | `Heading › sub-heading or bold label or "table"`; the first segment must be an exact heading (`node validate.js --headings`); Browse deep-links to the longest matching heading path |
| `par` | yes | seconds; under par earns +5 XP on a right answer; also the scenario countdown |
| `confirmInEdition` | no | default false. If true, `answer.codeRef` must be the standard name only (e.g. `"NFPA 110"`); the result screen says "confirm this section in your edition" |

**`codeRef` lives in `answer`, not at the top level** (validator rejects a top-level `codeRef`). Common `answer` keys:

- `explanation` (required): 1–2 lines, guide wording, right answer first.
- `codeRef`: string or `null`. Required key on number cards (`null` only if the guide gives no reference). When present on a number card the player must type it; on a scenario card it becomes an "I named the code reference" tick (+10 XP).
- `codeRefAliases`: 3–5 loose spellings. Matching is already loose (case, "NFPA", "§", "section", "table", "chapter", edition years like `13-2022` are ignored; the bare section `29.2.2` matches; a different standard number fails). The key is the **last** token of `codeRef` ("14" in "NFPA 20 Chapter 14", "annex" in "NFPA 20 Annex", "5-32" in "FM Data Sheet 5-32"); letters glued to digits split ("9540A" → "9540", "a"), so alphanumerics need the bare form as an alias.

By type:

```jsonc
// number — every blank is a field; Submit stays disabled until all are filled
"answer": {
  "fields": [
    { "label": "psi", "value": 40 },                       // integer → exact
    { "label": "max loss psi", "value": 1.5, "tolerance": 0.01 }, // tolerance = absolute; decimals default ±2%
    { "label": "valve opens on", "value": "detection and loss of air", "aliases": ["detection + loss of air"] } // word answer: normalized exact match
  ],
  "codeRef": "NFPA 13 §29.2.2", "codeRefAliases": ["13 29.2.2", "29.2.2"], "explanation": "…"
}
// order — the guide's own sequence, 4–8 steps, in correct order (the UI shuffles)
"answer": { "steps": ["…", "…"], "codeRef": null, "explanation": "…" }
// matrix — rows = inputs, cols = outputs; cells must be one of options
"answer": { "grid": {
    "inputs": ["ASD Fire 1, Hall 1"], "outputs": ["Building alarm", "Release / trip"],
    "cells": [["●", "—"]],
    "options": ["●", "—", "per BOD"],   // optional; this is the default cycle (the bank also uses "Supervisory", "Trouble", High / Low / Breathing zone)
    "notes": [["", "Pre-action solenoid (valve trips only on loss of air)"]], // optional, mirrors cells, shown after
    "prefilled": [[0, 0]]                // optional, cells given to the player
  }, "codeRef": null, "explanation": "…" }
// scenario — self-graded; beats = the model answer's clauses (strings, or {label, fillIn: true} for open items)
"answer": { "beats": ["…", "…"], "requiresNumber": true, "codeRef": "FM Data Sheet 5-32", "codeRefAliases": ["FM 5-32"], "explanation": "…" }
// story — self-graded and timed; script verbatim from story-scripts.md (escapes resolved)
"answer": {
  "script": "Paragraph one…\n\nParagraph two… [Result after Oct 30: …]",  // [brackets] render as "fill in" chips
  "beats": [
    { "label": "Hook", "kind": "hook", "quote": "…" },
    { "label": "Decision with reason", "kind": "decision", "quote": "…" },
    { "label": "A number", "kind": "number", "quote": "…" },
    { "label": "Lesson", "kind": "lesson", "quote": "…" },
    { "label": "Result line", "kind": "number", "fillIn": true }   // open item: shown, never graded
  ],
  "timing": { "min": 45, "max": 60, "limit": 75 },   // optional; default 90 / 120 / 150
  "codeRef": null, "explanation": "…"
}
// defect — 6–8 script lines, exactly one planted defect
"answer": { "lines": ["1. …", "2. …"], "defectIndex": 5, "codeRef": null, "explanation": "Line 6 — …" }
```

`kind` on story beats is `hook | decision | number | lesson | beat`. A missing `lesson` beat makes the story a miss, so every story card has exactly one beat with `kind: "lesson"` (a test enforces it).

### mock.json schema (as written)

```jsonc
{ "decks": [ { "id": "mock-1", "title": "Mock 1", "questions": [
  { "id": "mock-1-q1", "kind": "technical",          // technical | values (2 technical, 3 values per deck)
    "prompt": "…", "followUp": "What would you do differently?",
    "par": 105,                                       // 60–150 s accepted; 90–120 used
    "beats": ["…", "…"],                              // strings or {label, quote}
    "source": "Likely questions and day-of checklist › Values and judgment (the 65%)",
    "topicId": "I3", "cardId": "I3-sty-01" }           // optional links into the bank
] } ] }
```

`node validate.js src/data/mock.json` validates it (detected by the `decks` key). The build includes it automatically. The debrief headline format is the morning-quiz one: `"4 of 5 framework right · 2 close · 1 clean"`.

## Decisions

Where the spec was ambiguous I followed `content/procedure-notes.md`; each choice is encoded in a test.

1. **A session is a calendar day.** After every card the topic is recomputed from its record as it stood before today's first result plus all of today's rated results, so the shift, Keep going, drills and the story list all count as one session; `tests` goes up once per day. Locked In therefore needs clean sessions on two different days.
2. **Card results → ladder.** A card is clean / slipped / missed; a miss carries `framework: true|false`. The topic takes the worst card of the day: clean session → Minor Refresh (streak 1) or Locked In (streak ≥ 2); slipped → Minor Refresh; missed with framework → Needs Improvement; missed without → Not Ready. Streak resets to 0 on anything but a clean session.
3. **"2 distinct clean cards"** (1 for Light) is capped at the number of cards the bank holds for the topic, so a topic with one card can still go clean. All-clean but only one card on a Core/Support topic = Minor Refresh, streak 0, last result "clean, but one card — needs a second clean card".
4. **Follow-ups.** A clean first card on a topic that needs a second gets a follow-up card on the same topic right after it (a different card, preferring a different type — the "follow-up handled" of Locked In). The shift grows by one card: nothing is displaced, so `slots.length` can exceed the planned `size` (Phase 1 pushed the last coverage card back to Keep going; changed after Phase 2 because a full bank of clean answers left a 15-card shift covering only 7 topics). A miss gets no follow-up (the worst result already decides the topic).
5. **Shift slots are cards.** 15 = up to 6 redos + 8 coverage + 1 out loud. The redo cap scales with the shift size (round(size × 6 / 15): 4 at 10, 8 at 20). If coverage runs short the rest of the due queue fills in.
6. **Coverage order:** Not Tested by plan day (then Core → Support → Light), then due Minor Refresh; one coverage slot goes to a spot check on a Locked In topic last tested ≥ 3 days ago (due first, Core first, oldest first), if any.
7. **Out loud** is chosen first and placed last: due story topics → due scenario topics → least recently tested studied topics. So with no story due, the top redo topic can take the slot as a scenario (tested either way).
8. **Card picking:** never a card already used today; not a card from the topic's previous session if there are alternatives; prefer the type missed last time; then auto-graded before out-loud types for ordinary slots; then least recently seen; then bank order. Deterministic (no randomness) so tests can pin it.
9. **Cutover (Oct 26–30):** 10 cards, 2 of them stories (story type only), redo cap 4. **Nov 1 sweep:** every topic not Locked In in queue order, up to 20 cards, the plan-date skip not applied (literal "every topic not Locked In" — A4/A5 are included); each missed card gets one redo appended at the end (a redo can't improve the day's rating, it's practice). **Nov 2:** six quick cards (number / order / defect / matrix) from Locked In topics, Minor Refresh if short, then the I1 story as the intro; results are logged with `rated: false` and never change ratings; then the "Stop. You're ready. Go win it." screen with the day-of checklist; nothing else is offered. **After Nov 2:** final screen and stats only.
10. **Number cards:** 0 wrong = clean; exactly 1 wrong = slipped, unless that one is the card's only number; otherwise missed, framework if at least half of the items (fields + code section) are right. A blank counts as wrong.
11. **Order cards:** "one swap" = any single swap of two steps (swap distance 1) → slipped; framework on a miss if ≥ ⌈2n/3⌉ steps are still in relative order.
12. **Matrix cards:** cells start untouched and an untouched cell never passes ("must not happen" has to be asserted); 1 wrong = slipped; framework if ≤ 20% wrong.
13. **Scenario cards:** missing items = beats not ticked + "said a number" (unless `requiresNumber: false`) + "named the code reference" (if `codeRef`); 0 = clean, 1 = slipped, else missed, framework if ≥ half the beats.
14. **Story cards:** problems = beats missed + (time outside min–max); 0 = clean, 1 = slipped; past `limit` or no lesson = missed; framework if ≥ half the beats. `fillIn` beats are shown but not graded.
15. **Defect cards:** tap a line, then confirm (no fat-finger grading); the wrong line = missed, framework false (Not Ready — "wrong, guessed").
16. **Imported topic already quizzed today by the tracker** (`last_tested` = today): same session — no second streak or test increment; a worse game result still pulls the rating down.
17. **Energize rule:** every topic ≥ Minor Refresh and Σ weight of Locked In topics ÷ Σ weight ≥ 60%.
18. **Debrief headline** counts topics graded in the session: framework right = Needs Improvement or better; close = Minor Refresh without a clean session; clean = a clean session (streak ≥ 1). "Re-read tonight" = up to three topics without a clean session, worst first, linked to the source of their worst card.
19. **XP:** clean 10, slipped 5, missed 1; +5 under par only on a right answer (a fast miss earns nothing extra); +10 code named on a self-graded card; +50 once per day for the daily shift. Day streak = consecutive days with a completed daily shift; a break shows 0 and never touches ratings.
20. **`codeRef` placement:** in `answer` (the §6 example), not top-level (§4 list). Hedged sections: `confirmInEdition: true` + standard name only (§7.2 wins over §4's "null").
21. **Hooks** show only on a missed card (procedure-notes: hook for Needs Improvement / Not Ready).
22. **Export:** Settings offers `state.json` (topics + history, XP, streaks, settings, the day's snapshots) and `topics.json` (tracker shape only, to paste back). Import accepts either: an array replaces topic records (ratings carry over, history and XP kept); an object replaces everything.
23. **Deck fallback:** sample deck while `questions.json` is empty, or with `?deck=sample`; otherwise ignored.
24. **Building quotes** are verbatim guide lines (a test checks each is in the guide).
25. **Bundler rules** for everything under `src/`: named imports only (`import { a, b as c } from './x.js';` on one line), `export function|const|let|class` or `export { a }`; no default exports, no dynamic import. `build.js` errors on anything else.

Phase 2 (question bank):

26. **Bank order.** Cards are in `topics.json` topic order; within a topic the type order alternates (even-indexed topics number → order → matrix → defect, odd-indexed order → matrix → defect → number; scenario and story last) because bank order is the picker's last tie-break (decision 8) and alphabetical ids would make a fresh shift 14 defect cards in a row.
27. **codeRef when the guide names only a standard.** Number cards carry the standard the guide ties to the fact ("NFPA 2001", "NFPA 25", "NFPA 750", "NFPA 12", "IFC 1207", "NFPA 20 Chapter 14" from the Fire pump "Governing" line, "NFPA 20 Annex" for pressure settings, "NFPA 20 Table 14.1.1.1" for the suction flush); `null` only where the guide gives no reference at all (pump hydro, minimum run timer, hydrogen / off-gas exhaust numbers, door force, duct leakage). The prompt says what it wants ("Chapter?", "Where in NFPA 20?") because "NFPA 20" alone does not match "NFPA 20 Chapter 14" (the key token is 14).
28. **confirmInEdition** is set exactly where the guide hedges: the NFPA 110 generator numbers (E1-num-03/04/05, E1-def-01 → "NFPA 110"), the IBC stair / hoistway ranges (K1-num-02 → "IBC"), the ASD high-airflow table (G6 → "NFPA 72"), NFPA 2010's occupied-space wording (G4-scn-02 → "NFPA 2010"). Explicit edition notes are not hedges: NFPA 13-2022 §29.2.1 (Ch. 29 in 2022, 28 in 2019), §8.2.3 (consolidated into §8.2.4 in 2025 — alias), NFPA 72-2019 §10.6.7.3.1 (renumbered in 2025) keep their section numbers.
29. **Scenario `codeRef`** is set only when the guide's model answer itself names a standard (FM Data Sheet 5-32, NFPA 13 §7.7 / §29.2.1 / §29.2.2 / §8.2.3 / §8.3.2.3, NFPA 25, FM 1011, NFPA 24 table, NFPA 12, NFPA 241, NFPA 2001 Annex C, NFPA 20 Chapter 14, NEC 700, NFPA 110, IFC 901.6.2.2, UL 60335-2-40 …); otherwise `null`, so the bonus tick can't make a right answer slip. `requiresNumber: false` where the model answer has no number.
30. **Word-answer fields** are used only for single canonical terms the guide uses ("detection", "or" / "and", "OPR" / "BOD" / "Cx plan", "static" / "residual", "weekly" / "monthly", "wintergreen", "speed ratio" / "speed ratio squared" / "discharge minus suction" …) with 3–6 aliases each; everything else is a number.
31. **Matrix options** beyond the default cycle: "Supervisory" (C4-mat-02, K3-mat-01), "Trouble" (C4-mat-03, A3-mat-01 — the IST matrix's "Trouble if a panel loses AC"), High / Low / Breathing zone (B3-mat-01), and ● / — only where the guide gives no per-BOD cell.
32. **Story timings.** Stories 1, 2, 3, 5 use the default 90 / 120 / 150 (par 120). Story 4 is "191 words, about 80 s, short on purpose" → 60 / 100 / 150, par 100. Backups (45–70 s) → 45 / 70 / 90, par 70. I1 intro → 45 / 60 / 75, par 60. I2 Why Fluidstack → 30 / 45 / 60, par 45. Story follow-up scenarios ("15 seconds each") use par 30 as the countdown.
33. **Story beats.** Story 4's "A number" beat is "That day set three habits I still run on" (its only number besides "seven months"). The I2 story has three beats (hook / decision / lesson), as the guide's "three beats" — no separate number beat; "18 years" is inside beat 1. The I1 and I2 scripts are verbatim from the guide (the only source for them), outer quotation marks kept.
34. **Defect cards on Interview topics** plant playbook violations instead of wrong technical facts: a blame line (I3, I4, I5), a bracketed result said as fact (I3-def-02), a joke or minimizing (I6), the passive instead of "I" (I6-def-02), pricing or business detail (I7), an R&D hedge in the intro (I1), a direct ask at the close (I10), an undecided location answer (I11), France cited as current (I2, I9), HQ in Austin (I2-def-02). The explanation names the rule from the story doc.
35. **Hypothetical numbers that are not guide facts** (so Phase 4's audit can skip them): prompts "lost 3 psi" (P2), 130 s (S3-scn-02), 70 s (P6-scn-01); planted defect values 45 min (P2-def-01), 5 years (C2-def-01), 1 h (S2-def-02), 12 spares above 1,000 (S5-def-01), ordinary 60 s (P4-def-01), jockey stop pressure (S2-def-01), 10% running drop (F4-def-01), 30 min at 30% as acceptance (E1-def-01), 0.03 in. w.c. (K1-def-01), quarterly (K4-def-01), 95% as acceptance (F1-def-01), 2.3 / 60 s misreadings in A2-def-01 / A3 defects. P5-num-01's "7 steps" counts the guide's numbered list; K4-num-02 renders semiannually / annually as 6 / 12 months.
36. **K3** (fire alarm FPT, no section of its own) is built from Cx language (ladder, script items, IST matrix rows), Emergency power (ride-through), FPE refresher › Fire alarm (secondary power, audibility, candela, spacing, STI) and Story 2's cause-and-effect line; each card's `source` names the actual heading. **A4** comes from the Lake Mariner paragraph (plus the FPT prerequisite lines). **I11** reaches six cards with the posting's facts (three cities, $220–300k, what the role owns, bonus certifications, site → state).
37. **Sample cards** (sample.json) that fit the bank were carried in under the same ids; sample.json itself is unchanged and still used with `?deck=sample`.
38. **mock.json** follow-ups for technical questions are grounded in the model answers' closing clauses ("document the risk acceptance", "manufacturer claim and an impairment plan") since the guide gives no literal follow-up text for them; story questions use the story-scripts follow-ups.
39. **F3-mat-01** reads the L5 pump-signal sentence literally: electric = pump running / loss of phase or phase reversal / controller trouble; diesel = engine running / controller trouble / switch off-automatic (diesel "pump running" and "loss of phase" are —).
40. **Verification gates added:** `tests/bank.test.js` (coverage and answerability of every card), the build test expects the bank and three mock decks inlined, and `tools/smoke.js` plays the real bank as well as the sample deck.

Phase 4 (accuracy audit):

41. **Scope chain.** A fact is looked for in the block the `source` label names, then the section, then the file, then both files. Found in another section is a hard finding only for graded facts (number fields, `codeRef`, order steps); for prompts, explanations, beats and defect lines it is a review note, because scenario answers legitimately pull related facts in (K3's cards, the NOAEL percentages in a door-fan card, the 19.5% O2 alarm in a nitrogen card) and every one of those was checked by eye.
42. **Units.** A number's unit is the token after it, a glued suffix (24-hour, 0.4-volt), the unit a field label ends with (ambiguous ones — min, s, h, V, in, ft, yr — must end the label; "(min)" means minimum; a `%` or `psi` anywhere in the label counts), or the table column header. "Annually" = 1 yr = 12 mo, "semiannually" = 6 mo, "weekly" = 1 wk, "half" = 50%, number words count, a year is never a duration. A value that exists only without its unit is a finding — that is how "40 min" for "40 psi" would be caught.
43. **Hooks** are mnemonic: checked in both files, numbers and acronym identifiers only, hyphenated wordplay split, number words ignored. A hook number that is in neither file is a finding (S4-scn-01's "30 years" was one).
44. **Hedges** are the lines matching "confirm … in your edition", "check whether your edition applies", "confirm the edition's wording". A bold label that ends in a hedge hedges the list or table under it (NFPA 110 numbers, the ASD airflow table); "IBC values above" hedges only the table rows that name IBC; a hedge inside a table cell hedges that cell; the Sources section's global caveat is not a hedge. A number field found only on hedged lines needs `confirmInEdition: true` and a standard-only `codeRef`.
45. **Order cards** are located line by line with a bag of content words (a step needs ≥ 50% of its words on one line; one- and two-word steps need all of them), all steps in one scope, and the positions must be monotone. Two cards keep a timeline the guide gives as prose and are allowlisted (C6-ord-01: "agree thresholds … in advance" precedes the burn-off; F3-ord-01: "simulate loss of normal power at peak load" puts the load first).
46. **Multiple choice** means option markers (A) … B), "(a) … (b)"), "which of the following", true/false, yes/no, a word answer or alias offered in the prompt, or a numeric answer printed in the prompt with no unit or the field's unit. Fill-in connector words ("detection ___ loss of air" → or / and, P1-num-02) are open recall and were left — see Open questions.
47. **The committed `audit-report.md`** is the default (lean) report; `--review` is for a reading pass and is not committed.
48. **C2-num-01 keeps `IFC 901.6.2.2`** (decided Oct 24). "The documents" names only "the IFC" for the 10-year integrated retest; the section number is the Smoke control table's integrated-retest row, which K4 also uses. Allowlisted as an accepted cross-reference, no longer a decision item.

## Open questions

- Defect card, wrong line → Not Ready. If that feels too harsh for a recognition task, change one line in `gradeDefect` (`src/engine/grader.js`) to give `framework: true` (Needs Improvement).
- Nov 1 sweep includes Not Tested topics whose study day is Nov 1 (A4, A5); they sort late, so they rarely make the 20. Say if they should be skipped.
- Interview-day cards are unrated so a slip on Nov 2 can't knock a topic down. Say if you want them rated.
- IST matrix "Utility failure → Central station: *Trouble if a panel loses AC*" is encoded as a "Trouble" cell (C4-mat-03, A3-mat-01). Say if you'd rather it be "per BOD".
- P1-num-02 asks for the connector words as blanks (non-interlock: detection ___ sprinkler operation → "or"; double-interlock → "and"; single-interlock opens on ___ → "detection"). Open recall by the letter of §7.3, but "or" vs "and" is a two-way choice; P1-mat-01 covers the same logic as a matrix. Say if you want P1-num-02 dropped or re-asked.
- E1-num-03 now has two blanks that are both 10 (Type ___ = power within ___ s): the guide's definition of Type 10 makes any phrasing leak one into the other. Say if you'd rather it asked only Level 1 and Class = fuel.
- The Fire pump table's "95% / 5% figure is NFPA 25's annual test" never says what the two figures are; F1-num-03 asks only the figures and the standard.
- Does a diesel pump also report "pump running" to the FACP, or only "engine running"? F3-mat-01 assumes only engine running (decision 39).
- The guide hedges the inert-gas Class C factor ("check whether your edition applies 1.35"); no card asks it. It gives no section for the hydrogen / off-gas exhaust numbers (25% LFL, 1 cfm/ft², 2–30 min) → `codeRef: null`.
- A4 (Lake Mariner paragraph) and I11 (posting facts) are thin on source material; trim to five cards if they feel stretched.
- I4-scn-02 (transport time) could carry `codeRef: "NFPA 72"` for the +10 tick; left null.
- Grader quirks, not card errors: "20-14" (hyphenated chapter) does not match "NFPA 20 Chapter 14"; "NFPA 20" alone fails on Chapter 14 cards; "9540A" needs the alias form (present).

## Known rough edges

- Story recording is unverified on a real phone (headless Chrome has no microphone, and `file://` usually refuses it).
- The Start shift label shows the planned cards and minutes; clean first answers add follow-ups (decision 4), so a strong day runs longer than the estimate. The hint under the button says so.
- Number Blitz shuffles with `Math.random`, so two runs differ — on purpose.
- Mock interview results are not saved; the debrief is one screen and gone when you leave it.
- Browse deep links go to the longest matching *heading*; sources that end in a bold label or "table" land on the section heading above it.
- Story highlighting marks digits and number words in the script; it can over-mark (e.g. "one" in "nobody owned that gap").
- The map's small buildings (Field office, HQ, Pump) are ~40px tap targets on a 390px screen; the building list below the map is the full-size alternative.

## How to run

Needs Node ≥ 20 (built on 24). No npm install — there are no dependencies.

```
npm test                                   # 94 engine / data / bank / mock / build / audit tests
node validate.js src/data/questions.json   # schema check for the bank (also sample.json, mock.json); add --strict
node validate.js --headings                # headings a card's source may start with
node scripts/audit.js [--review] [--card <id>]   # every fact against the guide → audit-report.md (exit 1 on findings)
node build.js                              # → dist/index.html
node tools/smoke.js [--shots <dir>]        # headless Chrome/Edge at 390×844, offline: sample deck, real bank, every screen
npm run check                              # tests + validate + build
```

Play: open `dist/index.html` in any browser (double-click works; `file://` is fine). Add `?date=2026-11-01` (or `2026-10-26`, `2026-11-02`, `2026-11-03`) to test special days; `?deck=sample` forces the 10-card sample deck; `?card=P2-num-01` opens one card. State lives in `localStorage` under `energize.state.v1`; Settings → Reset clears it.
