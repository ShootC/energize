# Claude Code build prompts — ENERGIZE

Five phases. Each one is a self-contained prompt you paste into Claude Code. The header of each phase tells you which model to be on. Switch with `/model` before pasting. Start each phase with `/clear` so the next model doesn't pay to re-read the previous one's conversation — all hand-off state lives in `PROGRESS.md` in the repo, not in the chat.

**Model plan**

| Phase | Model | Why |
| --- | --- | --- |
| 1 · Scaffold + engine | **Opus** | Plumbing: scheduler, state, card renderer, build script. Lots of code, no fire-protection judgment. |
| 2 · Question bank | **Fable** | The only part where domain judgment matters: turning the study guide into ~400 graded cards with the right numbers, sections, beats and hooks. |
| 3 · Full UI + campus map | **Opus** | Design and front-end work. |
| 4 · Accuracy audit | **Fable** | Every card checked against the guide. Cheap in tokens, high in stakes. |
| 5 · Phone QA + ship | **Opus** | Testing, PWA, polish, install instructions. |

Phase 2 is split into four sub-sessions by area so each Fable run stays small. If Fable credits run short, Phases 2c and 2d can be done by Opus — but run Phase 4 on Fable regardless.

**Before Phase 1:** make a folder (e.g. `~/Projects/energize`), copy `GAME_SPEC.md`, `CLAUDE_CODE_PROMPT.md` and the whole `content/` folder into it, open Claude Code there.

---

## PHASE 1 — Scaffold and game engine  ·  `/model opus`  ·  `/clear`

```
You are building ENERGIZE, a single-file HTML study game that runs offline on my phone. Read GAME_SPEC.md completely, then content/procedure-notes.md and content/topics.json. Skim content/study-guide.md only enough to understand the structure (headings) — do NOT write any question content in this phase; another session will do that.

Deliver, in this order, and commit after each:

1. PROGRESS.md — a hand-off file. Sections: Done / In progress / Decisions / Open questions / How to run. Keep it current; every later session starts by reading it.

2. Repo layout:
   src/engine/          pure JS modules, no DOM, fully unit-tested
     scheduler.js       queue building (spec §3), due dates, special days (Oct 26–30 cutover, Nov 1 sweep, Nov 2 interview-day, post-Nov 2)
     rating.js          rating ladder, points, streaks, next_review (cap 2026-11-01), readiness overall / on-tested / tested count — must reproduce content/procedure-notes.md exactly
     grader.js          grading for every card type: number (tolerance + loose code-ref match), order, matrix, scenario/story (beats), defect
     state.js           load/save/export/import; import of topics.json; history
   src/ui/              card components, screens (stub them — Phase 3 builds the real UI)
   src/data/            questions.json (EMPTY ARRAY for now) + a sample.json with 10 hand-written cards of mixed types using ONLY facts from content/study-guide.md so the engine can be exercised
   build.js             Node script that inlines everything into dist/index.html (one file, no external requests, content/study-guide.md and story-scripts.md rendered into it for the Browse screen)
   tests/               node:test or vitest — scheduler, rating and grader must have tests that encode the spec tables (e.g. a clean answer with streak 1 → Minor Refresh, +2 days; streak 2 → Locked In, +4 days; nothing schedules past 2026-11-01; readiness formula against a hand-computed fixture of topics.json)

3. A minimal playable loop: open dist/index.html → see readiness numbers computed from topics.json → Start shift → the queue is built per spec → the 10 sample cards render with ugly-but-working UI → grading works → ratings and readiness update → state persists in localStorage → export/import JSON round-trips.

4. Verify: run the tests, open dist/index.html in a headless browser or at least node-render the engine, confirm readiness for the shipped topics.json matches what you compute by hand (print both).

Rules: no frameworks that need a build to run (plain JS modules bundled by build.js is fine; Preact via CDN is NOT fine — single file, offline). No external fonts or images. Keep the engine framework-free so Phase 3 can restyle freely. When something in the spec is ambiguous, pick the option that matches content/procedure-notes.md and write the decision in PROGRESS.md.

Finish by updating PROGRESS.md with exactly what the next session (question bank, different model) needs to know: the questions.json schema as implemented, the card type names, and the command to validate a questions.json against the schema (write that validator: `node validate.js src/data/questions.json`).
```

---

## PHASE 2 — Question bank  ·  `/model fable`  ·  `/clear` before each sub-session

Run 2a → 2d as separate sessions. Paste the common block first, then the sub-session block.

**Common block (paste at the top of every 2x session):**

```
Read PROGRESS.md, GAME_SPEC.md §4, §6, §7, then content/procedure-notes.md. You are writing cards for ENERGIZE, a study game for my Fluidstack fire-protection commissioning interview. You are the domain expert in this build; the UI is someone else's job.

Hard rules:
- Every number, time, pressure, percentage, section number, sequence and phrase comes from content/study-guide.md or content/story-scripts.md. If the guide doesn't say it, the card doesn't exist. Do not use your own knowledge of NFPA to add or "correct" anything — if you think the guide is wrong, write it in PROGRESS.md under Open questions and still follow the guide.
- Where the guide hedges ("confirm in your edition", "confirm table number"), set confirmInEdition: true and make codeRef the standard name only.
- Open recall only. No multiple choice except matrix and defect cards.
- Per topic: Core 6–10 cards over ≥3 types, Support 4–6, Light 2–3. Every topic gets ≥1 card in interviewer phrasing (interviewerPhrasing field). Core topics that have a "Likely question" in the guide get a scenario card built from that question and its model answer, beats = the answer's clauses.
- Each explanation: 1–2 lines, guide wording, right answer first. Each hook: one line, concrete, uses the numbers (e.g. "40 · 24 · 1.5 — forty for a day, lose a buck-fifty"). Hooks are the only place you may be playful.
- Number cards: every blank the question asks for is a field. If the guide gives a code section, codeRef is required and the card asks for it. Add codeRefAliases (3–5 loose spellings).
- Order cards: steps are the guide's own sequence items, 4–8 steps, in the guide's words shortened to one line each.
- Defect cards: write a 6–8 line realistic FPT script excerpt for the topic with exactly one planted defect (wrong number, missing prerequisite like central station on test, missing return-to-normal, actuator still connected, learn run in construction dust…). defectIndex points at it; explanation names the rule it breaks.
- Story cards (Interview area): use content/story-scripts.md verbatim for the script text; beats = Hook / Decision with reason / A number / Lesson, each beat quoting the specific line or number that satisfies it. Bracketed [...] items are open — mark them "fill in", never present as fact.
- Source field = the exact heading (and sub-heading or table) in study-guide.md.
- Write to src/data/questions.json (append to the existing array, don't overwrite other sessions' cards), run `node validate.js src/data/questions.json`, fix until clean, then run the whole test suite. Commit.
- Finish: update PROGRESS.md with counts per topic and anything you flagged.
```

**2a** — Cx framework (C1–C7), Sprinkler & underground (S1–S8), Pre-action (P1–P8). *(The heaviest technical block — about 150 cards.)*
```
Sub-session 2a. Topics: C1–C7, S1–S8, P1–P8. Guide sections: "Data center commissioning language", "Sprinkler and underground", "Pre-action", plus questions 5, 6, 8, 9, 13, 14 from "Likely questions". Include: one matrix card built from the IST matrix table (C4); order cards for the sprinkler acceptance checklist, the double-interlock L4 script (P5), and the trip-test records (P6); defect cards for C3, C5, P5, P6.
```

**2b** — Fire pump (F1–F9), Emergency power (E1–E3), Smoke control & FA FPT (K1–K4). *(~100 cards.)*
```
Sub-session 2b. Topics: F1–F9, E1–E3, K1–K4. Guide sections: "Fire pump", "Emergency power interface", "Smoke control", plus question 11 from "Likely questions" and the two "Likely question" prompts inside those sections. Include order cards for the pump troubleshooting order (F8: test setup → suction → pump), the pull-the-plug IST (E2, 5 steps), the smoke control acceptance sequence (K2); a number card for the affinity laws (F6) that asks for the formula shape in words; defect cards for F1, E2, K2.
```

**2c** — Gaseous & ASD (G1–G6), BESS/gas/mist (B1–B4), Applied & refresher (A1–A5). *(~90 cards.)*
```
Sub-session 2c. Topics: G1–G6, B1–B4, A1–A5. Guide sections: "Clean agent and CO2", "Condensed aerosol", "Water mist", "Aspirating smoke detection (ASD)", "Gas detection", "Battery and BESS", "FPE refresher", "Hydraulic calculations" (light — A1 and A5 only need the formulas and the 7 psi / 0.433 / C-factor numbers), plus questions 10 and 12 from "Likely questions". A4 (NFPA 241 / IFC Ch. 33) comes from the Lake Mariner paragraph in the Interview playbook. Include order cards for the clean agent acceptance sequence (G1), the door-fan fix order (G2), the BESS L5 scenario (B2), ASD acceptance (G5); defect cards for G1 (actuators), G5 (learn in dust), B3 (surrogate cal gas without correction factor).
```

**2d** — Interview (I1–I11) and the Mock Interview boss fight. *(~60 cards + 3 boss decks.)*
```
Sub-session 2d. Topics: I1–I11. Sources: content/story-scripts.md (primary) and the "Interview playbook" + "Likely questions › Values and judgment" sections of the guide. Cards: a story card for each of the five stories and each backup (I3–I8); the 60-second intro (I1) and Why Fluidstack (I2) as story cards with 60 s and 45 s timers; number/recall cards for the Fluidstack facts table (I9: sites, MW, funding, renamed values, what NOT to cite); recall cards for the five questions to ask and the R&D closing line (I10); a scenario card for the travel/location answer (I11) whose beats are "decide before they ask" — leave the answer itself as a fill-in. Then write src/data/mock.json: three boss decks (Mock 1, 2 technical-deep-dive, 3) of 5 questions each with a follow-up per question, 35/65 technical/values mix, drawn from the 14 likely questions and the story cards, with par times (90–120 s) and the debrief headline format from procedure-notes.md.
```

---

## PHASE 3 — Full UI and campus map  ·  `/model opus`  ·  `/clear`

```
Read PROGRESS.md, then GAME_SPEC.md §4, §5, §8 in full. The engine and the full question bank exist and are tested. Build the real UI on top of them in src/ui/, then rebuild dist/index.html.

Deliver, committing after each:
1. Design tokens and base styles: dark default, one amber accent, warm-white "energized", red only for Not Ready; 16px+ body; 48px+ tap targets; safe-area insets; works at 390×844 first. No external fonts.
2. Campus map (home screen): an original flat isometric SVG with the 10 buildings from spec §2, each with windows that light up in proportion to that area's weighted readiness; the conference room front-and-center; a building "energizes" with a short animation when its rule in §3 is met. Header with date, days to Nov 2, readiness overall / on tested / N of 65. Big Start shift button showing card count and estimated minutes.
3. Card UIs for all six types exactly as spec §4 describes them: number (fields + code section, submit disabled until every blank is filled, blank count shown), order (tap-to-place with undo), matrix (tap-cycle cells ● / — / per BOD), scenario (90 s timer, reveal, tick beats, self-grade), story (120 s bar, beat chips, optional local audio record/playback with MediaRecorder, script shown after with numbers highlighted), defect (tap the bad line). After every card: result, the 1–2 line correction, the hook on a miss.
4. Shift debrief, Building view with Drill this, Browse (study guide and scripts rendered and searchable, deep-link from a missed card's source heading), Number Blitz, Mock Interview (from src/data/mock.json) with its debrief, Settings (import topics.json, export state, reset, sound, haptics, cards per shift).
5. Special-day behavior per spec §5 driven by the real date, with a dev override (?date=2026-11-01) for testing.
6. Haptic tick on clean (navigator.vibrate guarded), small honest animations, no confetti.

Run the tests, rebuild, and check dist/index.html in a headless browser at 390×844: every screen reachable, no console errors, works with network disabled. Update PROGRESS.md with a screen-by-screen checklist and known rough edges.
```

---

## PHASE 4 — Accuracy audit  ·  `/model fable`  ·  `/clear`

```
Read PROGRESS.md and GAME_SPEC.md §7. Audit src/data/questions.json and src/data/mock.json against content/study-guide.md and content/story-scripts.md. This is the step that keeps me from learning a wrong number for the interview.

Write scripts/audit.js that, for every card, extracts every numeric value, unit, section reference and step string and finds it verbatim (or as a trivially reformatted equivalent) in the source file named in its source field. Produce audit-report.md: cards whose facts could not be located, cards with codeRef where the guide hedged (must be confirmInEdition: true), order cards whose step order differs from the guide, story cards whose text differs from story-scripts.md, prompts that are secretly multiple choice, and topics under the per-weight card minimum.

Then fix every finding by hand in the JSON (follow the guide, never your own knowledge), re-run the audit until the report is empty except for items that genuinely need my decision, and list those under Open questions in PROGRESS.md in one line each. Run the tests, rebuild dist, commit.
```

---

## PHASE 5 — Phone QA and ship  ·  `/model opus`  ·  `/clear`

```
Read PROGRESS.md. Finish ENERGIZE for daily use on my phone starting tomorrow morning.

1. PWA: manifest + service worker so dist/index.html installs to the home screen and opens offline; app icon drawn as SVG (a building with lit windows), no external assets. Confirm the single-file version still works when opened directly from the file system too.
2. Hosting: add a GitHub Pages deploy (gh-pages branch or docs/) so the app has a URL I can open on my phone; write the exact steps in README.md including how to re-deploy after I update questions.json. Also keep a "just AirDrop/email yourself dist/index.html" path.
3. QA pass at 390×844 and 430×932 with a headless browser: every card type, timers, audio record/playback permission flow, import of content/topics.json, export round-trip, date override for Oct 26, Nov 1, Nov 2 and Nov 3, localStorage full-reset, rotation to landscape. Fix what you find.
4. Performance: first paint under 1 s on a mid-range phone; questions.json and the rendered guide loaded once; no layout shift when cards swap.
5. README.md: what it is, how to install on iPhone and Android, how to run a shift, how to export state back to my chat tracker, how to regenerate dist after editing content.
6. Final: run tests, rebuild, commit, tag v1.0, and give me the URL and the file.
```

---

## After it ships

- Each morning: do the shift in the app, then paste the exported `state.json` into the chat tracker conversation if you want the dashboard updated, or just keep the two in sync by hand.
- Found a wrong fact? Edit `content/study-guide.md` first (it's the source of truth), then re-run Phase 4 on Fable with: "The guide changed in section X. Re-audit and fix the affected cards."
- Want more cards on a weak topic? Opus can do it with the Phase 2 common block plus "Add 5 more cards to topic P6 in types number and scenario," then run Phase 4.
