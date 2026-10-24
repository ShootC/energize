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

## In progress

- Nothing. Next: **Phase 3** (full UI + campus map, Opus).

## For the next session (Phase 3 — UI)

What the bank contains that the UI has to render well (the stub UI handles all of it; make it good):

- **Number cards**: 1–5 fields plus the code blank; some fields are **word answers** (string `value`, e.g. "detection", "OPR", "weekly") — render with `inputmode="text"`; labels carry units. `confirmInEdition` cards label the blank "Standard" and show the confirm line after grading.
- **Matrix cards**: up to 6 columns (C4-mat-03, B2-mat-01) and custom `options` beyond ● / — / per BOD: "Supervisory" (C4-mat-02, K3-mat-01), "Trouble" (C4-mat-03, A3-mat-01), High / Low / Breathing zone (B3-mat-01), and several ●/— only grids. Tables need a sideways-scroll or stacked layout on a phone.
- **Scenario cards**: `par` is the countdown and ranges 30 s (story follow-ups, "15 seconds each") to 120 s. Some beats are objects with `fillIn: true` (I3-scn-01, I4-scn-02, I7-scn-01/02, I11-scn-01): the grader ignores them, but the stub still renders a checkbox — show them as disabled "fill in" chips like story cards do.
- **Story cards** (10): `answer.timing` varies — default 90/120/150; Story 4 60/100/150; backups 45/70/90; I1 45/60/75; I2 30/45/60. Scripts contain `[bracketed]` fill-in lines; `highlightScript` marks numbers.
- **Mock interview**: `src/data/mock.json` is real now (3 decks); the screen is still a stub.
- First-shift mix: bank order is the picker's last tie-break, so the merged file alternates type order by topic (decision 26). A fresh Oct 24 shift is C1 number · C2 defect · C4 order · C7 number · S2 number · S3 defect · C6 order · S6 number · P1 matrix · P2 number · P3 defect · P5 order · P6 number · P8 number · I3 story.

### Adding or fixing cards later

Edit `src/data/questions.json` directly (keep topic order; one card per type gets picked first per topic), then:

```
node validate.js src/data/questions.json --strict
npm test && node build.js
```

The validator checks: schema per type, unique ids, id ↔ topic ↔ type agreement, topicId exists, `source` starts with a real heading (`node validate.js --headings`), `confirmInEdition` cards have no section number in `codeRef`; it warns on per-topic counts (Core 6–10 over ≥3 types, Support 4–6, Light 2–3), missing `interviewerPhrasing`, order cards outside 4–8 steps, defect scripts outside 6–8 lines, number cards with a codeRef but no aliases. `tests/bank.test.js` turns those warnings into failures and adds the answerability checks.

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
4. **Follow-ups.** A clean first card on a topic that needs a second gets a follow-up card on the same topic right after it (a different card, preferring a different type — the "follow-up handled" of Locked In). To keep the shift at its planned size, the last coverage / spot / fill card still to come goes back to Keep going. Redo and out-loud cards are never displaced. A miss gets no follow-up (the worst result already decides the topic).
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

## Open questions

- Defect card, wrong line → Not Ready. If that feels too harsh for a recognition task, change one line in `gradeDefect` (`src/engine/grader.js`) to give `framework: true` (Needs Improvement).
- Nov 1 sweep includes Not Tested topics whose study day is Nov 1 (A4, A5); they sort late, so they rarely make the 20. Say if they should be skipped.
- Interview-day cards are unrated so a slip on Nov 2 can't knock a topic down. Say if you want them rated.
- **Follow-ups displace coverage** (decision 4): with the full bank and all-clean answers, the Oct 24 shift of 15 cards covered 7 topics (each clean first card pulled in a second card on the same topic and pushed a coverage topic to Keep going). Say if follow-ups should extend the shift instead.
- IST matrix "Utility failure → Central station: *Trouble if a panel loses AC*" is encoded as a "Trouble" cell (C4-mat-03, A3-mat-01). Say if you'd rather it be "per BOD".
- "The documents" attributes the 10-year integrated retest to "the IFC" without a section; C2-num-01 and K4 use IFC 901.6.2.2 from the Smoke control table.
- The Fire pump table's "95% / 5% figure is NFPA 25's annual test" never says what the two figures are; F1-num-03 asks only the figures and the standard.
- Does a diesel pump also report "pump running" to the FACP, or only "engine running"? F3-mat-01 assumes only engine running (decision 39).
- The guide hedges the inert-gas Class C factor ("check whether your edition applies 1.35"); no card asks it. It gives no section for the hydrogen / off-gas exhaust numbers (25% LFL, 1 cfm/ft², 2–30 min) → `codeRef: null`.
- S1-ord-01 orders the underground hydro before the aboveground hydro; the guide says only "then both hydros". A swap grades as slipped.
- A4 (Lake Mariner paragraph) and I11 (posting facts) are thin on source material; trim to five cards if they feel stretched.
- I4-scn-02 (transport time) could carry `codeRef: "NFPA 72"` for the +10 tick; left null.
- Grader quirks, not card errors: "20-14" (hyphenated chapter) does not match "NFPA 20 Chapter 14"; "NFPA 20" alone fails on Chapter 14 cards; "9540A" needs the alias form (present).

## Known rough edges (for Phase 3)

- Looks: plain dark styles, a building *list* with text "windows" instead of the isometric SVG campus, no energize animation, no sound (the setting exists), haptics only on clean.
- Story card: no audio record / playback yet (MediaRecorder is Phase 3).
- Mock interview: stub screen (the data exists). Number Blitz: minimal.
- Scenario `fillIn` beats render as checkboxes (ignored by the grader); they should be disabled "fill in" chips.
- Matrix tables scroll sideways on a phone with long labels; the bank has 6-column grids.
- Browse: search lists matching sections with a snippet; no in-text highlighting.
- Story highlighting marks digits and number words in the script; it can over-mark (e.g. "one" in "nobody owned that gap").

## How to run

Needs Node ≥ 20 (built on 24). No npm install — there are no dependencies.

```
npm test                                   # 87 engine / data / bank / build tests
node validate.js src/data/questions.json   # schema check for the bank (also sample.json, mock.json); add --strict
node validate.js --headings                # headings a card's source may start with
node build.js                              # → dist/index.html
node tools/smoke.js [--shots <dir>]        # headless Chrome/Edge: sample-deck pass + real-bank pass (390×844, offline)
npm run check                              # tests + validate + build
```

Play: open `dist/index.html` in any browser (double-click works; `file://` is fine). Add `?date=2026-11-01` (or `2026-10-26`, `2026-11-02`, `2026-11-03`) to test special days; `?deck=sample` forces the 10-card sample deck. State lives in `localStorage` under `energize.state.v1`; Settings → Reset clears it.
