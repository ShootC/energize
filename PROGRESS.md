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
- **Data.** `src/data/questions.json` = `[]`. `src/data/sample.json` = 10 hand-written cards (4 number, 2 order, 1 matrix, 1 defect, 1 scenario, 1 story) using only guide / script facts. The app uses the sample deck **only while questions.json is empty**.
- **Build.** `build.js` → `dist/index.html` (≈266 KB): one file, no external requests (the build refuses `<script src>`, `<link href>`, remote media, CSS `url()`, `@import`, `fetch`, XHR, WebSocket). Study guide and story scripts rendered to HTML (with the LaTeX formulas) for Browse.
- **UI** (`src/ui/`, ugly but working): home with readiness and a building list, the shift loop with all six card types, result screen (result, correction, hook on a miss, re-read link), debrief, building view with Drill this, Browse with search and deep links, Settings (cards per shift, sound/haptics flags, import, export, reset), basic Number Blitz, story list, mock-interview stub. `?date=YYYY-MM-DD` overrides today.
- **Tests.** 79 `node:test` tests: spec tables, the hand-built Oct 24 queue and shift, special days, follow-ups, card picking, every grader rule, persistence and export/import round trip, schema errors, Markdown/TeX rendering, bundler, offline check.
- **Verified** (headless Edge over CDP, 390×844, network disabled): readiness on the page = engine = hand computation, a full 9-card sample shift, ratings update, reload persists, export → reset → import round-trips byte-for-byte, Browse search, Oct 26 / Nov 1 / Nov 2 / Nov 3 modes, no console errors, zero network requests — 28/28 checks (`node tools/smoke.js`).

Readiness for the shipped `content/topics.json` (Oct 23 quiz):

| | by hand | engine | page |
| --- | --- | --- | --- |
| overall | 3 × (7×40 + 3×75) = 1515 / 16600 = 9.13% | 1515 / 16600 | 9.1% |
| on tested | 1515 / (10 × 300) = 50.5% | 1515 / 3000 | 50.5% |
| tested | 10 of 65 (C1 C2 C3 C4 C5 C7 S2 S3 S4 I3, all Core) | 10 of 65 | 10 of 65 |

## In progress

- Nothing. Next: **Phase 2a** (question bank, Fable).

## For the next session (Phase 2 — question bank)

**Write cards to `src/data/questions.json`** (append; never overwrite another session's cards; leave `sample.json` alone). Then:

```
node validate.js src/data/questions.json      # errors must be 0; warnings = coverage nudges
node validate.js src/data/questions.json --strict   # when a whole area is done
node validate.js --headings                   # every heading a `source` may start with
npm test && node build.js
```

The validator checks: schema per type, unique ids, id ↔ topic ↔ type agreement, topicId exists, `source` starts with a real heading, `confirmInEdition` cards have no section number in `codeRef`; it warns on per-topic counts (Core 6–10 over ≥3 types, Support 4–6, Light 2–3), missing `interviewerPhrasing`, order cards outside 4–8 steps, defect scripts outside 6–8 lines, number cards with a codeRef but no aliases. A topic with zero cards gets no warning (another session's job).

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
- `codeRefAliases`: 3–5 loose spellings. Matching is already loose (case, "NFPA", "§", "section", "table", edition years like `13-2022` are ignored; the bare section `29.2.2` matches; a different standard number fails), so aliases are for genuinely different spellings.

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
    "options": ["●", "—", "per BOD"],   // optional; this is the default cycle
    "notes": [["", "Pre-action solenoid (valve trips only on loss of air)"]], // optional, mirrors cells, shown after
    "prefilled": [[0, 0]]                // optional, cells given to the player
  }, "codeRef": null, "explanation": "…" }
// scenario — self-graded; beats = the model answer's clauses
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
  "timing": { "min": 45, "max": 60, "limit": 75 },   // optional; default 90 / 120 / 150 (use for I1 60 s, I2 45 s)
  "codeRef": null, "explanation": "…"
}
// defect — 6–8 script lines, exactly one planted defect
"answer": { "lines": ["1. …", "2. …"], "defectIndex": 5, "codeRef": null, "explanation": "Line 6 — …" }
```

`kind` on story beats is `hook | decision | number | lesson | beat`. A missing `lesson` beat makes the story a miss, so every story card needs one beat with `kind: "lesson"`.

### mock.json schema (Phase 2d writes it; Phase 3 builds the UI)

```jsonc
{ "decks": [ { "id": "mock-1", "title": "Mock 1", "questions": [
  { "id": "mock-1-q1", "kind": "technical",          // technical | values (spec: 2 technical, 3 values per deck)
    "prompt": "…", "followUp": "What would you do differently?",
    "par": 105,                                       // 60–150 s accepted; 90–120 typical
    "beats": ["…", "…"],                              // strings or {label, quote}
    "source": "Likely questions and day-of checklist › Values and judgment (the 65%)",
    "topicId": "I3", "cardId": "I3-sty-01" }           // optional links into the bank
] } ] }
```

`node validate.js src/data/mock.json` validates it (detected by the `decks` key). The build includes it automatically when the file exists. The debrief headline format is the morning-quiz one: `"4 of 5 framework right · 2 close · 1 clean"`.

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
23. **Deck fallback:** sample deck while `questions.json` is empty; ignored as soon as it has one card.
24. **Building quotes** are verbatim guide lines (a test checks each is in the guide).
25. **Bundler rules** for everything under `src/`: named imports only (`import { a, b as c } from './x.js';` on one line), `export function|const|let|class` or `export { a }`; no default exports, no dynamic import. `build.js` errors on anything else.

## Open questions

- Defect card, wrong line → Not Ready. If that feels too harsh for a recognition task, change one line in `gradeDefect` (`src/engine/grader.js`) to give `framework: true` (Needs Improvement).
- Nov 1 sweep includes Not Tested topics whose study day is Nov 1 (A4, A5); they sort late, so they rarely make the 20. Say if they should be skipped.
- Interview-day cards are unrated so a slip on Nov 2 can't knock a topic down. Say if you want them rated.

## Known rough edges (for Phase 3)

- Looks: plain dark styles, a building *list* with text "windows" instead of the isometric SVG campus, no energize animation, no sound (the setting exists), haptics only on clean.
- Story card: no audio record / playback yet (MediaRecorder is Phase 3).
- Mock interview: stub screen. Number Blitz: minimal.
- Matrix table scrolls sideways on a phone with long labels.
- Browse: search lists matching sections with a snippet; no in-text highlighting.
- Story highlighting marks digits and number words in the script; it can over-mark (e.g. "one" in "nobody owned that gap").

## How to run

Needs Node ≥ 20 (built on 24). No npm install — there are no dependencies.

```
npm test                                   # 79 engine / data / build tests
node validate.js src/data/questions.json   # schema check for the bank (also sample.json, mock.json)
node validate.js --headings                # headings a card's source may start with
node build.js                              # → dist/index.html
node tools/smoke.js [--shots <dir>]        # headless Chrome/Edge check of dist/index.html (390×844, offline)
npm run check                              # tests + validate + build
```

Play: open `dist/index.html` in any browser (double-click works; `file://` is fine). Add `?date=2026-11-01` (or `2026-10-26`, `2026-11-02`, `2026-11-03`) to test special days. State lives in `localStorage` under `energize.state.v1`; Settings → Reset clears it.
