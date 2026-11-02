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

### Phase 5 · Phone QA and ship (Fable, Oct 24)

- **Installable app.** `build.js` now writes, beside `dist/index.html`: `manifest.webmanifest` (standalone, `start_url: ./`, scope `./`), `sw.js` (the service worker from `src/pwa/sw.js`, stamped with the build version — a 10-hex hash of content + code + styles), and the icons from `tools/icon.js` — one geometry (a dark building with its windows coming on, inside the maskable safe zone) drawn as `icon.svg` and rasterised by hand into `icon-192.png`, `icon-512.png` (maskable) and `apple-touch-icon.png` (180, iOS ignores SVG). No dependencies: the PNG encoder is `node:zlib` plus a CRC. `index.html` links the manifest and icons (the only `<link>`s; `checkOffline` now allows links to files beside the page and the build refuses any it did not write) and still works alone from `file://`.
- **Service worker** (`src/pwa/sw.js`): cache-first app shell under `energize-<version>`; any navigation (`?date=`, `?card=`…) is served from the cached `index.html`; a new build installs behind the running one (`skipWaiting` + `clients.claim`), old caches are deleted, and the page — `src/ui/pwa.js`, registered only over http(s) — notices `controllerchange` and shows *A newer build is ready — Reload* on the campus screen (`#update-note`). The page also calls `registration.update()` when it comes back online or becomes visible. Settings gets an **App** panel: Add to Home Screen instructions when served, an *Install on this phone* button when Android offers `beforeinstallprompt`, a note when opened as a file; the build line shows the version.
- **Hosting.** `.github/workflows/pages.yml` runs `npm test`, builds `dist/` and publishes it with `actions/deploy-pages` on every push to `main` (Pages source: GitHub Actions). **Live since Oct 24:** the public repo is `github.com/ShootC/energize` (created with `gh repo create`, Pages set to the Actions workflow through the API, `main` and the `v1.0` tag pushed); the first workflow run published `https://shootc.github.io/energize/`, verified serving `index.html`, `sw.js` and the manifest with the same build version. README has the re-deploy steps. The plain-file route (send yourself `dist/index.html`) is documented too.
- **QA** (`tools/smoke.js`, headless Edge/Chrome, 74 checks): everything from Phase 3, plus home / number card / story card at 430×932 and landscape 844×390 (Submit reachable, no sideways scroll); `content/topics.json` imported by paste and through the file picker (`DOM.setFileInputFiles`); full reset leaves a fresh state in `localStorage`; story recording with a microphone (Chrome's fake device: Record → *Recording* → Done speaking → a blob-URL `<audio>` on the result) and with the microphone refused (the card says *Microphone not available here* and still grades); boot under 4× CPU throttling; card-top stability across a shift; the app served over http with the service worker registered and the shell cached, an offline reload with a different `?query`, manifest and icons from the cache offline, a "new build" (the test server rewrites `sw.js`'s version and marks `index.html`) producing the Reload note, and Reload running it. Every DevTools call has a 30 s timeout and the browser is killed on failure.
- **Performance** at 4× CPU throttle from `file://`: first contentful paint ~110 ms, DOMContentLoaded ~150 ms, home screen drawn at ~130 ms (the gate is 1 s). The bank and the rendered guide are parsed once; the Browse search index is now built on first open, not at boot. **Layout shift**: the slot label (kind, topic, rating pill) wrapped to 1–3 lines and the progress dots wrapped when follow-ups extended a shift, so the card moved by up to 41 px between cards. Now the slot label is a fixed 72 px grid (topic clamped to two lines) and the dots shrink on one row; the card starts at the same y on every swap (checked).
- **README.md**: what it is, install on iPhone and Android, the plain-file route, a day with it, export to the chat tracker, updating content, hosting and re-deploy steps, developing.
- **Verified**: `npm test` 95/95 · `node build.js` → `dist/` (767 KB page + 6 companion files) · `node tools/smoke.js` 77/77 (74 at v1.0, plus the three tap-guard checks of decision 55) · `node scripts/audit.js` 0 findings.

#### Screens added in Phase 5

| Screen | How to reach it | What it shows / does | Checked |
| --- | --- | --- | --- |
| Update note | served over http, a newer build has installed | amber bar on the campus screen: "A newer build is ready" + Reload | smoke (test server serves a second build) |
| Settings › App | gear → App panel | install instructions (iPhone / Android), *Install on this phone* when offered, file-mode note, build version | smoke (served) |

### Round 2 · Session A · Retarget and follow-up engine (Opus, Nov 2)

Spec: `GAME_SPEC_ROUND2.md` (a delta that wins over `GAME_SPEC.md`), `ROUND2_UPDATE_PROMPT.md` (the session prompts), `content/rounds.md` (framing only). Work is on the local branch **`round2`**; `main` (what Pages serves) is untouched until session E. The round-1 build is tagged **`v1.0-round1`** (= `51c775f`, the last commit on `main`; `v1.0` stays on `8410e50`).

- **Content swap.** `content/archive/study-guide-2026-10-23.md` and `story-scripts-2026-10-23.md` hold the Oct 23 copies; the kit's Nov 2 exports are now `content/study-guide.md` / `story-scripts.md`. **They are byte-identical to the Oct 23 copies**, so `content/guide-diff.md` (from the new `scripts/guide-diff.js`) lists 0 changed sections and session D has no source-change re-audits. `content/incoming/topics-tracker-2026-10-29.json` stays where it is, reference only — not imported. The kit's `content/rounds.md` and `content/round1-debrief.md` (still the blank template) were added; `content/procedure-notes.md` gained a "Round 2 dates" section.
- **`src/engine/round.js`** (new): `settings.nextRound = { label, focus: technical | behavioral, date: YYYY-MM-DD | null }`, default `{ "Round 2", technical, null }`; `reviewCap`, `sweepDate`, `dayMode` (normal · sweep · dayof · after), `daysToRound`, `interruptOn`. Every hard-coded date is gone (list below).
- **Readiness** (`rating.js`): `readiness()` adds `technical` (54 topics, all but Interview) and `interview` (I1–I11) slices, each `{ value, earned, possible, tested, total, coreBelowMinor, targetMet }`; overall and on tested are unchanged. `nextReview(rating, today, cap)` takes the cap.
- **Shift builder** (`scheduler.js`, §4): the two profiles, plan-date gating off, area priority, technical card choice with the number-miss exception, no card two shifts running when the topic has others, walkthrough rotation, the sweep by focus, day-of plans for both focuses; every plan reports `outLoud` (scenario + story cards, walkthroughs included).
- **Follow-up chains** (`grader.js`, §5): `gradeCard(card, response)` grades `answer.followUps` layers when present (`response.followUps = [{ hits }]`), the card takes the worst layer, the grade carries `layers`, and `recordResult` stores them on the history entry. A card without followUps grades exactly as before. Mock questions with `followUps[].beats` grade the same way (`mock.js`).
- **Validator** (`schema.js` / `validate.js`): checks followUps, walkthrough, ladder, dontSay, `-r2` ids, the "Round 1 debrief" source, round mock decks. All 388 cards and the v1 mock decks still validate with 0 warnings.
- **State**: old saves load with the new defaults (`migrateSettings`); history, XP, streaks and ratings untouched; the export shape is unchanged (topic records = topics.json). `tests/fixtures/state-v1.0.json` was exported by the v1.0 engine before any change and is loaded both as an import and as a raw localStorage save.
- **UI**: header leads with technical (or interview) readiness — `Technical 10.3% · overall 9.1% · 9 of 54 technical tested`, on tested on the meta line; a banner asks for the round's date while it's unset, "N days to Round 2 · Thu Nov 12" once set; the follow-up panel ("They follow up…", 45 s timer, Reveal, tick, next) on scenario and story cards; interrupt mode (follow-up 1 cuts in 40–70 s into a scenario answer, the main clock pauses and resumes); the result shows one dot per layer and each follow-up's beats; `answer.dontSay` shows after grading; walkthrough cards are labelled; Settings has a Next round panel (name, focus, date, "No date yet") and the Interrupt mode toggle; day-of screens for both focuses (with a not-graded "hook line" card for Story 1 / Story 3); after the date, "Round 2 is done — set the next one" with the form; the mock menu lists decks by `round` (r2, r3), hides Mock 1–3, says "coming in a later session" for a round with no decks, asks each follow-up in turn, ticks every layer and shows layer dots in the debrief. Campus map, the other card UIs and Browse are untouched.
- **Sample deck**: `G2-scn-01-r2` (door fan; the bank's audited G2-scn-01 answer plus a why-not and a number follow-up) and `E2-scn-01-r2` (the pull-the-plug IST as a walkthrough, plus a what-if and a number follow-up). Every beat was checked verbatim against `content/study-guide.md`.
- **Verified**: `npm test` 124/124 · `node validate.js src/data/questions.json --strict` and `… mock.json --strict` clean · `node scripts/audit.js` 0 findings · `node build.js` → 817 KB · `node tools/smoke.js` 100/100 at 390×844 (plus 430×932 and landscape) with the network off: date unset (banner), set 7 days out (countdown), the sweep day, day-of technical and behavioral played to the stop screen (nothing rated), the day after and saving the next round, a chain card with interrupt mode (cut-in at 1 s, clock held, resumed, clean · clean · slipped → Slipped with three dots), the walkthrough label, Settings, the mock screen grouped by round with an injected r2 deck run end to end, the installable app offline; no console errors. Screenshots of the new screens were checked by eye (one fix: the finished follow-up panel inherited the home screen's centred `.done` style; renamed `answered`).

#### Round 2 retarget — every hard-coded date and special-day rule (grep of `v1.0-round1`)

`git grep -n -i -E "2026-11-01|2026-11-02|2026-10-2|interview|sweep|cutover|retire" v1.0-round1 -- src tests` (the `interviewerPhrasing` field left out):

| File | Lines at v1.0-round1 | What it was → what it is now |
| --- | --- | --- |
| `src/engine/rating.js` | 35, 36, 37 | `REVIEW_CAP = '2026-11-01'`, `INTERVIEW_DATE = '2026-11-02'` → removed; the cap is `reviewCap(today, nextRound)` passed into `nextReview` / `applySession` |
| `src/engine/scheduler.js` | 7, 11–13, 16, 17, 19, 25, 27–30, 34, 35, 161, 162, 169, 171, 199, 213, 215, 217, 219, 304, 312, 328, 371, 380, 388 | `CUTOVER_START/END` (Oct 26–30), `CUTOVER_SHIFT`, `SWEEP_DATE`, `dayMode` (cutover / sweep / interview / after), `daysToInterview`, the cutover out-loud rule, the Nov 1 sweep, the Nov 2 `interviewDayPlan` → cutover deleted; `dayMode` and the dates live in `round.js`; sweep = date − 1 by focus; `dayOfPlan` for both focuses |
| `src/engine/state.js` | 17, 79 | cards-per-shift comment ("10 in cutover week, 20 on Nov 1"), "interview-day confidence cards" → reworded; `DEFAULT_SETTINGS` gains `nextRound` and `interrupt` |
| `src/engine/campus.js` | 73 | `area: 'Interview'` — the area name, kept |
| `src/engine/mock.js` | 1 | "Mock interview" comment — kept, extended |
| `src/ui/app.js` | 17, 46, 167, 192, 202, 206, 207, 214, 216, 221, 228, 259, 325, 366, 495 | `daysToInterview`, `?date=2026-11-01` comment, `mode === 'interview'` (× 8), the plan's "Mock N · today" lookup, the `interview` slot labels → `daysToRound`, `mode === 'dayof'`, plan lookup removed, new slot labels |
| `src/ui/screens.js` | 11–14, 45, 110, 243 | `MODE_LABEL` (cutover, Nov 1 sweep, interview day, after), "N days to the interview · Nov 2", the interactive-map guard, the plan row's interview line → `modeLabel(mode, nextRound)`, `whenLine`, `dayof`; the plan row line is kept (no plan rows after Nov 2) |
| `src/ui/boss.js` | 1, 28 | "Mock interview" title — kept |
| `src/ui/cards.js` | 8 | "Interviewer scenario" type name — kept |
| `src/ui/styles.css` | 726 | "mock interview" section comment — kept |
| `src/ui/map.js` | 4 | "conference room (Interview)" comment — kept |
| `src/ui/index.html`, `src/pwa/manifest.webmanifest` | 8, 4 | "…drills for the Fluidstack interview" description — kept |
| `tests/rating.test.js` | 10, 16, 24, 29, 33, 39, 42, 50, 54, 70, 88, 91, 95, 106, 117–130 | Oct 24 fixtures kept; the `REVIEW_CAP` assertion and the "nothing past 2026-11-01" test → moved to `tests/round.test.js` as date − 1 / rolling cap |
| `tests/scheduler.test.js` | 61 lines (4–280) | rewritten for the round-2 rules (Nov 5 fixtures, both profiles, sweep, day-of, after) |
| `tests/state.test.js` | 18 lines (28–123) | Oct 24 dates kept (rolling cap = old intervals); interview-day `mode` label kept |
| `tests/build.test.js` | 88, 89 | the 14-day plan's dates — kept (the plan table still parses) |
| `tests/helpers.js` | 19, 24, 39, 47, 54 | Interview area and Oct fixtures — kept |
| `tests/markdown.test.js` | 14 | "one cutover" in a story title — kept |

### Round 2 · Session B1 · Technical follow-ups, the data hall core (Fable, Nov 2)

Topics C1–C7, P1–P8, E1–E3, K1–K4, A2, A3, per `ROUND2_UPDATE_PROMPT.md` (common block + B1). Six commits on `round2`, one per area plus the wrap-up. **The round 1 debrief step was skipped by Brandon's choice** — `content/round1-debrief.md` is still the blank template, so no "Round 1 debrief" cards exist and no "Facts about my own work" fed the own-it beats; it can be run later per "After it ships" in `ROUND2_UPDATE_PROMPT.md`.

- **Backup.** `src/data/questions.round1.json` is the bank as it stood before this session (388 cards, byte-identical to `v1.0-round1`'s plus session A's validator-only changes — none).
- **Bank: 397 cards** (388 + 9 `-r2`), **53 cards with follow-ups, 103 follow-ups** (what-if 44 · number 29 · why-not 18 · own-it 10 · find-out 2), **6 walkthroughs**. Every existing card keeps its id, type, beats and explanation; the only edits to existing cards are the added `answer.followUps`.
- **Walkthrough cards** (scenario, `walkthrough: true`, par 120, beats = the guide's steps in order, 2 follow-ups each): `C1-scn-04-r2` (the L1–L5 ladder for a pre-action system, Q8 — the Cx table rows), `C4-scn-03-r2` (the IST matrix's "ASD Fire 2, Hall 1" row turned into test steps, blank Elevator cell included), `A2-scn-03-r2` (the double-interlock L4 script, start to restore — the Pre-action sample script's seven steps), `A3-scn-03-r2` (the data hall IST fire scenario, Q9), `E2-scn-01-r2` (the pull-the-plug IST — carried in from `sample.json` under the same id), `K2-scn-03-r2` (smoke control acceptance, L0 to close-out).
- **New scenario cards** (Core topics that had one scenario card): `E1-scn-02-r2` (NFPA 110 generator acceptance and periodic numbers; `confirmInEdition: true`, `codeRef: "NFPA 110"`, with a find-out follow-up), `K1-scn-02-r2` (IBC stair / hoistway ranges and door force; `confirmInEdition: true`, `codeRef: "IBC"`, with a find-out), `K3-scn-02-r2` (notification: audibility, candela, STI, secondary power from the fire alarm refresher).
- **Follow-ups**: prompts in a peer's spoken voice, 2–4 checkable beats each, `par: 45`, `source` a guide heading path (or the story's heading for own-its). Every number, section and step in a follow-up beat was located in the guide the same way the audit locates main beats: the audit was run over a synthetic bank with every follow-up as a scenario card (a scratchpad harness, not committed) — **0 findings**, 3 review notes (E1-scn-02-r2-f1's "NFPA 110" and K1-scn-02-r2-f1's "2012" sit in the card's section, not in "Read this first"; P4-scn-01-f1's "2 sprinklers" takes its noun from the table header). Session D's extended audit should see the same.
- **own-it beats** come only from `content/story-scripts.md`: Story 2 (cause-and-effect zone by zone, the wrong-COLO release, the VESDA thresholds), Story 3 (the client who tried every cheaper fix), Story 4 (on test first, isolation to return to normal), and the lab backup (AHJ inspection, generator backup, fan and damper monitoring — its bracketed lines are fill-in beats). A3-scn-01-f2 uses the common block's shape for a test no story covers: say plainly there's no direct story → the closest thing (Story 2) → how he'd run it per the guide.
- **No engine or audit change.** `-r2` ids pass `ID_RE`, the validator, the bank tests and the audit as session A left them; no topic exceeds its `CARD_MINIMUMS` range (K3 is the largest at 9), so the range was not raised. `scripts/audit-allow.json` is unchanged.
- **Verified**: `npm test` 124/124 · `node validate.js src/data/questions.json --strict` 0 errors, 0 warnings · `node scripts/audit.js` 0 findings (397 cards; `audit-report.md` recommitted with the new count) · `node build.js` → `dist/index.html` 878 KB (dist/ recommitted, as session A did) · the stock `node tools/smoke.js` passes its first 40 checks and stops at its plain-scenario fixture (`P6-scn-01` now has follow-ups — decision 79, Open questions); a scratchpad copy of the smoke with that fixture switched to `C6-scn-02` ran the whole suite over this build: **100/100** at 390×844 (plus 430×932 and landscape), offline, with the chain / interrupt / walkthrough / round-deck / installable-app checks, 397 cards in the cached shell, no console errors, no network requests.

| Topic | Weight | Cards | Scenario cards | Follow-ups added, by kind | New cards | Debrief cards | Flagged |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C1 | Core | 8 | 4 (4 with follow-ups) | why-not 2 · what-if 2 · number 3 · own-it 1 | C1-scn-04-r2 (walkthrough) | skipped | — |
| C2 | Core | 6 | 2 (2 with follow-ups) | why-not 1 · what-if 2 · number 1 | — | skipped | — |
| C3 | Core | 7 | 2 (2 with follow-ups) | why-not 1 · what-if 2 · number 1 | — | skipped | — |
| C4 | Core | 8 | 3 (3 with follow-ups) | why-not 2 · what-if 2 · number 1 · own-it 1 | C4-scn-03-r2 (walkthrough) | skipped | — |
| C5 | Core | 7 | 3 (3 with follow-ups) | why-not 1 · what-if 3 · number 1 · own-it 1 | — | skipped | — |
| C6 | Support | 5 | 2 (1 with follow-ups) | why-not 1 · own-it 1 | — | skipped | — |
| C7 | Core | 6 | 3 (3 with follow-ups) | what-if 3 · number 2 · own-it 1 | — | skipped | — |
| P1 | Core | 6 | 2 (2 with follow-ups) | why-not 1 · what-if 1 · number 2 | — | skipped | — |
| P2 | Core | 6 | 2 (2 with follow-ups) | why-not 1 · what-if 2 · number 1 | — | skipped | — |
| P3 | Core | 6 | 2 (2 with follow-ups) | why-not 1 · what-if 2 · number 1 | — | skipped | — |
| P4 | Support | 4 | 1 (1 with follow-ups) | what-if 1 | — | skipped | — |
| P5 | Core | 7 | 2 (2 with follow-ups) | what-if 2 · number 2 | — | skipped | the L4-script walkthrough sits on A2 (decision 74) |
| P6 | Core | 7 | 2 (2 with follow-ups) | why-not 1 · what-if 2 · number 1 | — | skipped | — |
| P7 | Support | 5 | 1 (1 with follow-ups) | what-if 1 | — | skipped | — |
| P8 | Core | 6 | 3 (3 with follow-ups) | why-not 1 · what-if 2 · number 2 · own-it 1 | — | skipped | — |
| E1 | Core | 8 | 2 (2 with follow-ups) | what-if 2 · number 1 · find-out 1 | E1-scn-02-r2 (confirmInEdition) | skipped | — |
| E2 | Core | 7 | 3 (3 with follow-ups) | why-not 1 · what-if 3 · number 1 · own-it 1 | E2-scn-01-r2 (walkthrough) | skipped | — |
| E3 | Support | 5 | 1 (1 with follow-ups) | what-if 1 · number 1 | — | skipped | — |
| K1 | Core | 7 | 2 (2 with follow-ups) | why-not 1 · what-if 1 · number 1 · find-out 1 | K1-scn-02-r2 (confirmInEdition) | skipped | — |
| K2 | Core | 8 | 3 (3 with follow-ups) | why-not 1 · what-if 3 · number 1 · own-it 1 | K2-scn-03-r2 (walkthrough) | skipped | — |
| K3 | Core | 9 | 2 (2 with follow-ups) | what-if 2 · number 2 | K3-scn-02-r2 | skipped | — |
| K4 | Support | 5 | 1 (1 with follow-ups) | what-if 1 | — | skipped | — |
| A2 | Core | 8 | 3 (3 with follow-ups) | why-not 1 · what-if 2 · number 2 · own-it 1 | A2-scn-03-r2 (walkthrough) | skipped | — |
| A3 | Core | 8 | 3 (3 with follow-ups) | why-not 1 · what-if 2 · number 2 · own-it 1 | A3-scn-03-r2 (walkthrough) | skipped | — |

Coverage targets (common block): every Core scenario card has 2 follow-ups with at least one why-not or what-if; every Core topic has ≥ 2 scenario cards with follow-ups; every Core `confirmInEdition` scenario (the two new ones — none existed) has a find-out; every area has an own-it (Cx 5 · Pre-action 1 · Emergency power 1 · Smoke control 1 · Applied 2); every Support topic has one scenario card with 1–2 follow-ups; Light (A1, A5) untouched.

### Round 2 · Session B2 · Technical follow-ups, everything else, and the Round 2 mocks (Fable, Nov 2)

Topics F1–F9, S1–S8, G1–G6, B1–B4, A1, A4, A5, per `ROUND2_UPDATE_PROMPT.md` (common block + B2). Five content commits on `round2` (Fire pump · Sprinkler · Gaseous & ASD · BESS + A4 · mock decks) plus the wrap-up. The round 1 debrief was skipped (Brandon's choice, as in B1): own-it beats come only from `content/story-scripts.md`.

- **Bank: 405 cards** (397 + 8 `-r2`), **101 cards with follow-ups, 198 follow-ups** (what-if 82 · number 55 · why-not 43 · own-it 14 · find-out 4), **13 walkthroughs**. B2 added 95 follow-ups on 48 cards (what-if 38 · number 26 · why-not 25 · own-it 4 · find-out 2). Every existing card keeps its id, type, beats and explanation; the only edits to existing cards are the added `answer.followUps`.
- **Walkthrough cards** (scenario, `walkthrough: true`, par 120, beats = the guide's steps in order, 2 follow-ups each): `F1-scn-02-r2` (pump acceptance test, L1–L5), `F8-scn-03-r2` (the 150% miss in the guide's order, Q11), `S6-scn-03-r2` (the sprinkler acceptance checklist, flush to certificates, with the table numbers at each stop), `G1-scn-03-r2` (clean agent acceptance L2–L5 with abort and manual release), `G2-scn-04-r2` (door fan failure a week before turnover, Q10), `G5-scn-03-r2` (VESDA in a contained data hall — the four beats, each with its level's steps), `B2-scn-03-r2` (Li-ion off-gas → BMS trip → exhaust, through the utility drop).
- **New scenario card**: `F2-scn-02-r2` (electric pump starts, run time and the minimum run timer) so F2 has two scenario cards with follow-ups. The door-fan card `G2-scn-01` got its follow-ups in place (the sample deck's `G2-scn-01-r2` is unchanged).
- **Follow-ups**: peer-voice prompts, 2–4 tickable beats, `par: 45`, `source` = the guide heading path whose lines carry the beats' numbers (a story heading for own-its, "Read this first" for find-outs, as B1). No hypothetical numbers in prompts (decision 78): "95%", "480 volts", "an 8-inch main", "60 air changes an hour" are all guide numbers; the mock `r2-a-q3` reuses the bank's own "lost 3 psi" prompt. The B1 harness (the audit over a synthetic bank with every follow-up as a scenario card, scratchpad only) was rebuilt and run per area and over the mock decks' follow-ups: **0 findings** beyond the synthetic coverage warnings; review notes are paraphrases, the single-letter identifiers in `F6-scn-01-f2` (Q2/Q1, N2/N1 — as on `F6-scn-01` itself), and the find-outs' standard names sitting outside "Read this first" (decision 75).
- **own-it beats**: Story 2 (`G5-scn-01-f1` — the VESDA job, thresholds, 4 designs instead of 20), Story 1 (`S6-scn-02-f2` — the waterflow / tamper / recall bar, under 8 hours, fire watch), Story 3 (`B2-scn-02-f2` — the Texas BESS: 20 flame detectors, ~7 past 0.4 V, twisted cable on the ground; then "say plainly there's no direct story of an off-gas IST → how I'd run it"), the lab backup (`F3-scn-01-f2` — "say plainly there's no direct story of a fire pump acceptance test" → generator backup on the lab → how I'd run the transfer per the guide). Nothing about his experience was written that the scripts don't say.
- **find-outs** on the area's two `confirmInEdition` scenarios, both Support: `G4-scn-02-f1` (NFPA 2010's occupied-space wording) and `G6-scn-01-f1` (the NFPA 72 airflow table number). No Core `confirmInEdition` scenario exists in these areas.
- **Mock decks** (`src/data/mock.json`, three decks with `"round": "r2"`, the v1 decks untouched): each is the 60-second intro (`intro`, I1, no follow-ups) → five technical questions with two graded follow-ups each (`technical` ×4 + `experience` ×1) → two of his questions for them (`close`, I10, no follow-ups). Technical questions copy a bank card's beats and both follow-ups (`cardId` set, par 120 for walkthroughs, 90 otherwise, follow-ups 45). The experience question is Story 2 in every deck (the scripts' only data-center commissioning story) with different scripted follow-ups per deck.

| Deck | Questions (kind · card) | Areas |
| --- | --- | --- |
| `r2-a` · Round 2 · Deck A | intro · C1-scn-04-r2 (walkthrough: Cx levels for pre-action) · P2-scn-01 (troubleshooting: the air test lost 3 psi) · F8-scn-03-r2 (walkthrough + troubleshooting: the 150% miss) · experience (Story 2: wrong-COLO release, thresholds) · G2-scn-01 (door fan fail) · close (ladder, R&D feedback) | Cx · Pre-action · Fire pump · Gaseous & ASD |
| `r2-b` · Round 2 · Deck B | intro · E2-scn-01-r2 (walkthrough: pull-the-plug IST) · K1-scn-01 (troubleshooting: stair pressure high) · S6-scn-01 (sprinkler checklist) · experience (Story 2: transport time, why not wait) · B2-scn-03-r2 (walkthrough: off-gas IST) · close (constraint, rederived assumptions) | Emergency power · Smoke control · Sprinkler · BESS |
| `r2-c` · Round 2 · Deck C | intro · A3-scn-03-r2 (walkthrough: data hall IST fire scenario) · G5-scn-02 (troubleshooting: VESDA flow faults) · P5-scn-01 (pre-action failure modes, Q13) · experience (Story 2: threshold numbers, what was miswired) · B1-scn-02 (the UPS is an ESS) · close (modular build, ladder) | Applied · Gaseous & ASD · Pre-action · BESS |

All nine Core technical areas appear across the three decks. `node validate.js src/data/mock.json --strict` is clean; `tests/mock.test.js` grades all 36 questions clean on a perfect answer; `scripts/audit.js` locates every main beat of the r2 questions (review notes only: prompt paraphrases and the "3 psi" of `r2-a-q3`).

- **No engine or audit change.** G1 reached exactly 10 cards (the Core maximum, not above it); no other topic is near its bound, so `CARD_MINIMUMS` and `scripts/audit.js` are untouched; `scripts/audit-allow.json` is unchanged. `tools/smoke.js` was not touched.
- **Verified**: `npm test` 124/124 · `node validate.js src/data/questions.json --strict` 0 errors, 0 warnings · `node validate.js src/data/mock.json --strict` clean · `node scripts/audit.js` 0 findings (405 cards, 36 mock questions; `audit-report.md` recommitted) · `node build.js` → `dist/index.html` 962 KB, 405 questions, 6 mock decks (dist/ recommitted) · `node tools/smoke.js` **100/100** on the second run; the first run died at a DevTools `Page.captureScreenshot` 30 s timeout right after the chain check (a transient browser stall, not a failed check — nothing in `tools/` was changed).

| Topic | Weight | Cards | Scenario cards | Follow-ups added, by kind | New cards | Debrief cards | Flagged |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F1 | Core | 8 | 2 (2 with follow-ups) | why-not 1 · what-if 2 · number 1 | F1-scn-02-r2 (walkthrough) | skipped | — |
| F2 | Core | 7 | 2 (2 with follow-ups) | why-not 1 · what-if 1 · number 2 | F2-scn-02-r2 | skipped | — |
| F3 | Core | 6 | 2 (2 with follow-ups) | why-not 1 · what-if 1 · number 1 · own-it 1 | — | skipped | own-it bridges to the lab backup (no pump story) |
| F4 | Support | 4 | 1 (1 with follow-ups) | why-not 1 · number 1 | — | skipped | — |
| F5 | Support | 5 | 1 (1 with follow-ups) | why-not 1 · what-if 1 | — | skipped | — |
| F6 | Support | 4 | 1 (1 with follow-ups) | what-if 1 · number 1 | — | skipped | Q2/Q1, N2/N1 identifiers (review note, as F6-scn-01) |
| F7 | Light | 3 | 0 | — | — | skipped | untouched |
| F8 | Core | 7 | 3 (3 with follow-ups) | why-not 1 · what-if 3 · number 2 | F8-scn-03-r2 (walkthrough) | skipped | — |
| F9 | Light | 2 | 1 (0 with follow-ups) | — | — | skipped | untouched |
| S1 | Support | 5 | 1 (1 with follow-ups) | why-not 1 · number 1 | — | skipped | — |
| S2 | Core | 7 | 2 (2 with follow-ups) | why-not 1 · what-if 2 · number 1 | — | skipped | — |
| S3 | Core | 6 | 2 (2 with follow-ups) | why-not 1 · what-if 3 | — | skipped | — |
| S4 | Core | 6 | 3 (3 with follow-ups) | why-not 2 · what-if 2 · number 2 | — | skipped | the 10% rule's follow-ups cite Pre-action › Test-day details (where it lives — S4-num-01 is allowlisted for the same split) |
| S5 | Light | 3 | 0 | — | — | skipped | untouched |
| S6 | Core | 8 | 3 (3 with follow-ups) | why-not 1 · what-if 2 · number 2 · own-it 1 | S6-scn-03-r2 (walkthrough) | skipped | — |
| S7 | Support | 5 | 3 (1 with follow-ups) | why-not 1 · what-if 1 | — | skipped | — |
| S8 | Light | 3 | 0 | — | — | skipped | untouched |
| G1 | Core | 10 | 3 (3 with follow-ups) | why-not 1 · what-if 3 · number 2 | G1-scn-03-r2 (walkthrough) | skipped | at the Core maximum (10) |
| G2 | Core | 8 | 4 (4 with follow-ups) | why-not 2 · what-if 4 · number 2 | G2-scn-04-r2 (walkthrough) | skipped | — |
| G3 | Support | 5 | 2 (1 with follow-ups) | why-not 1 · what-if 1 | — | skipped | — |
| G4 | Support | 5 | 2 (2 with follow-ups) | why-not 1 · what-if 1 · find-out 1 | — | skipped | find-out on G4-scn-02 (confirmInEdition) |
| G5 | Core | 9 | 3 (3 with follow-ups) | why-not 2 · what-if 2 · number 1 · own-it 1 | G5-scn-03-r2 (walkthrough) | skipped | — |
| G6 | Support | 5 | 1 (1 with follow-ups) | number 1 · find-out 1 | — | skipped | find-out on G6-scn-01 (confirmInEdition) |
| B1 | Core | 8 | 2 (2 with follow-ups) | why-not 1 · what-if 1 · number 2 | — | skipped | — |
| B2 | Core | 8 | 3 (3 with follow-ups) | why-not 1 · what-if 3 · number 1 · own-it 1 | B2-scn-03-r2 (walkthrough) | skipped | own-it is Story 3 (flame detection), not an off-gas IST — says so |
| B3 | Support | 6 | 2 (1 with follow-ups) | what-if 1 · number 1 | — | skipped | — |
| B4 | Support | 6 | 2 (1 with follow-ups) | why-not 1 · number 1 | — | skipped | — |
| A1 | Light | 3 | 1 (0 with follow-ups) | — | — | skipped | untouched (the smoke's nudge fixture) |
| A4 | Core | 6 | 3 (3 with follow-ups) | why-not 2 · what-if 3 · number 1 | — | skipped | — |
| A5 | Light | 3 | 1 (0 with follow-ups) | — | — | skipped | untouched |

Coverage targets (common block): every Core scenario card has 2 follow-ups with at least one why-not or what-if; every Core topic has ≥ 2 scenario cards with follow-ups (F2 and F1 through their new cards); no Core `confirmInEdition` scenario exists in these areas (the two Support ones got find-outs anyway); every area has an own-it (Fire pump 1 · Sprinkler 1 · Gaseous & ASD 1 · BESS 1 · Applied 2 from B1); every Support topic has one scenario card with 1–2 follow-ups; Light (F7, F9, S5, S8, A1, A5) untouched.

### Round 2 · Session C · Behavioral slice (Opus, Nov 2)

Transcribed and structured from `content/story-scripts.md`; no new story content. The round 1 debrief is still the blank template, so nothing came from "Facts about my own work".

- **Story drill-downs.** Each story card got its script's "Follow-ups, 15 seconds each" as `followUps` (kind `drill`, par 20, source `Story N — … › Follow-ups, 15 seconds each`), beats = the scripted answer's clauses in the script's words; a bracketed answer is a fill-in beat, so a follow-up whose whole answer is still a bracket (Story 1 "How did you split the twelve?", Story 3 "Did it stay clean after the re-pull?", Story 4 "Did anything release?" and "How did the customer react?") is shown and not graded. Each script's **Keep out** line is the card's `answer.dontSay`, shown after grading under "Don't say". Story 4's "Something more recent?" ("Go to the radios backup") carries the radios backup's clauses (source: Backup scripts). I8 (the backups) has no scripted follow-ups and is unchanged.

| Card | Story | Follow-ups (graded / fill-in only) | Don't say |
| --- | --- | --- | --- |
| `I3-sty-01` | 1 · Hawaii towers | 4 (3 / 1) | blame on the warehouse or the fiber contractor |
| `I4-sty-01` | 2 · VESDA, no drawings | 4 (4 / 0) | who programmed the release wrong |
| `I5-sty-01` | 3 · BESS ground faults | 4 (3 / 1) | that the designer approved the cable unread |
| `I6-sty-01` | 4 · Canned air | 4 (2 / 2) | jokes or minimizing |
| `I7-sty-01` | 5 · Playbooks and tools | 3 (3 / 0) | pricing or business details |

- **Drill ladders** — `I3-sty-02-r2` (Story 1) and `I5-sty-02-r2` (Story 3): story cards with `ladder: true`, interviewer phrasing "What's the most difficult challenge you've faced?", the main answer the story itself (same script, beats and timing as the story card), then five drill layers: Why did you make that call? · What constrained you? · What did it cost, or what was the risk? · What would you do differently? · What did the client or crew think? Every graded beat is a clause of that story's script, beats list or follow-ups, verbatim (checked clause by clause); the open ones are fill-ins (below). I3 and I5 now hold 9 cards each (Core max 10).
- **Round 3 mock decks** (`src/data/mock.json`, `round: "r3"`), about 12 minutes of answering each:
  - `r3-a` · Round 3 · Deck A: the hardest challenge as the Story 1 ladder (5 layers) · Likely question 2, "A decision you made without complete information" (Story 2; follow-ups: why not wait for drawings, how you caught the wrong-COLO release) · Likely question 7, "Why Fluidstack?" (the v1 deck's beats; Story 5's follow-ups: which tool matters most, how you use AI) · close (I10: guide questions 2 and 5).
  - `r3-b` · Round 3 · Deck B: the Story 3 ladder · Likely question 1, "Something you owned end to end, including what went wrong" (Story 1; why build the panels a month out, how you proved the fiber) · Likely question 4, "A mistake you made" (Story 4; what you'd do differently in the moment, something more recent → the radios) · close (I10: guide questions 3 and 4).
  - The values questions' prompts and beats are the v1 decks' (already audited); every follow-up is the story card's scripted drill, copied. All five stories appear across the two decks.
- **UI**: the mock reveal shows a fill-in beat as a chip instead of a tick box (the ladders have fill-in layers). `tools/smoke.js`: the "nothing tapped" and recording checks moved to the I8 backups (no follow-ups by design), the story list count comes from the bank (12 with the ladders), and a new check plays `I3-sty-01`'s drill-down to the result (a fill-in layer shown as an open dot, "Don't say" after grading).
- **Verified**: `npm test` 124/124 · both strict validator runs clean · `node scripts/audit.js` 0 findings (181 review notes) · `node build.js` → 990 KB, 407 cards, 8 decks · `node tools/smoke.js` 101/101.

#### Story gaps to fill

Layers and follow-ups the scripts don't answer yet — each is a fill-in until you answer it (in chat, or under "Facts about my own work" in `content/round1-debrief.md`), matched to the scripts' "Open questions to finish the stories":

| Where | What's open | Scripts' open question |
| --- | --- | --- |
| `I3-sty-02-r2` layer 5 (What did the client or crew think?) | the whole layer — what the client and the crew said once the towers were back in service | **Not on the list** — new |
| `I3-sty-02-r2` layer 3 (What did it cost, or what was the risk?) | the one moment in the eight-hour window that nearly went wrong | Story 1: "how you split the twelve … and the one moment in the eight-hour window that nearly went wrong" |
| `I3-sty-02-r2` layer 4 · `I3-sty-01` f2 · `I6-sty-01` f4 | what you do now about comms | Backups: "what you do differently about comms now" |
| `I3-sty-01` f1 (How did you split the twelve?) | the whole answer | Story 1: "how you split the twelve (crews per tower, a test team, a programmer?)" |
| `I5-sty-02-r2` layer 3 | how long the faults had gone on before the diagnosis; the site's size in MW or MWh | Story 3: "how long had the faults gone on before you diagnosed them, the site's size in MW or MWh" |
| `I5-sty-01` f4 (Did it stay clean after the re-pull?) | the whole answer | Story 3: "zero faults after the re-pull?" |
| `I6-sty-01` f2 (Did anything release?) | the whole answer | Story 4: "was any suppression or pre-action zone tied to that detector, and did the canned air reach two cross-zoned heads?" |
| `I6-sty-01` f3 (How did the customer react?) | the whole answer | Story 4: "How did the customer react?" |
| `I4-sty-01` f2 (How did you test transport time?) | your worst measured time | **Not on the list** — the script's own bracket |
| `I7-sty-01` f1 (Which tool matters most?) | one number: devices per day, or hours saved per test | Story 5: "one number for the playbooks" (a sibling — the tool's number isn't asked there) |

### Round 2 · Session D · Audit (Fable, Nov 2)

Scope (`ROUND2_UPDATE_PROMPT.md` › Session D): every card with `answer.followUps` (108 cards, 227 follow-ups: what-if 82 · number 55 · why-not 43 · drill 29 · own-it 14 · find-out 4; 14 fill-in beats), every `-r2` card (19: 13 walkthroughs, 3 new scenarios, 2 drill ladders, `E2-scn-01-r2`), and the five round decks (`r2-a/b/c`, `r3-a/b`: 29 questions, 48 graded follow-up layers). `content/guide-diff.md` lists 0 changed sections, so no older card needed a source re-audit; `content/round1-debrief.md` is still the template, so no "Round 1 debrief" cards exist and the debrief's "Facts about my own work" list is empty (the audit reads it anyway, for later). Two commits on `round2`: the audit extension with its reports and the rebuilt `dist/`, then this hand-off.

- **`scripts/audit.js` now walks `followUps[].beats`** (it used to stop at the main answer). Per follow-up: the `source` resolves like a card's (heading path, bold label, table, list number, table-row key) or as one of the validator's whole-document sources (`story-scripts.md`, `study-guide.md`, `round1-debrief.md` / `Round 1 debrief` → the debrief's "Facts about my own work" list items only); the prompt and every graded beat go through the same fact extraction as a main answer (numbers with units, section references, identifiers) against the chain *follow-up source → (experience sources for own-it / drill) → the card's section → the files → both files* — not found is a finding, found only outside the named source is a review note (as scenario beats already were); fill-in beats are skipped as facts. **own-it / drill beats** must trace (≥ 50% of content words on one line, or every clause of a multi-line beat) to `story-scripts.md` with its "Open questions to finish the stories" list cut out, the guide's Interview playbook, or the debrief facts; the only other things accepted are the common block's disclaimer ("say plainly there's no direct story…") and a "how I'd run it" line that sits in the guide and carries no first-person experience marker ("I ran", "on the lab", "my crew"…) — both are listed as *bridge* review notes so they get read. **Bracketed items**: a graded beat may not contain `[…]` and may not restate a bracketed line of the sources (≥ 60% of its words inside one bracket). **Kinds**: find-out only on `confirmInEdition: true`; ladder layers all drills; par noted when it differs from 45 / 20. **Prompts**: the multiple-choice regex, a `number` follow-up whose prompt contains every number its beats teach (finding) or some of them (review note), and a two-outcome tail ("Pass, or punch item?") as a review note. **`dontSay`** must be a verbatim line of the scripts (the "Keep out" lines). **Walkthrough cards**: each beat's step name (the text before its first " — " / ":") must sit in the guide's order in the source block (a one-row matrix walkthrough is noted, not checked). **Mock decks with a round**: each follow-up layer with beats is scoped to the question's chain plus the linked card's follow-up sources (decision 84) plus the experience sources for own-it / drill, with the same checks; a layer beat that is not a verbatim copy of the linked card's is noted (the experience question's scripted layers, by design). **Coverage targets** from the session B common block are checked per topic and area (and session C's shape for Interview: I3–I7 story cards with drill follow-ups, two 5-layer ladders, I8 untouched); failures are findings. New finding kinds print in the lean `audit-report.md` too, so `tests/audit.test.js` fails on any of them.
- **`audit-report-r2.md`** (repo root, written on every run beside `audit-report.md`; `--out-r2 <file>`): the scope line, what is checked, every round-2 finding by kind, "Other findings on round-2 cards", a **coverage table per topic** (cards, scenario cards, cards with follow-ups, follow-ups by kind, new cards, walkthrough / ladder), the allowlisted items on in-scope cards, and — always, not only with `--review` — the reading-pass notes: bridges, paraphrases, outside-the-source facts, prompt leaks, two-outcome prompts, non-copied mock layers, shown-not-graded layers, par deviations. `tests/audit.test.js` now also asserts the r2 report says 0 findings and carries the coverage table. `--card <id>` traces follow-up facts, experience ratios, walkthrough step positions and `dontSay`.
- **What the extended audit found.** The first run over the bank reported 4 findings; all four were the audit's own design, not the content, and were fixed in `scripts/audit.js`: (1) `G5-scn-01-f1` beat 0 joins two Story 2 lines ("…there were no drawings — I pulled the configuration…"), so the single-line trace read 42% — the experience trace now accepts a beat whose every clause traces on its own; (2–4) the walkthrough order check located whole beats, which carry each level's numbers from elsewhere in the section (decision 80), so `C4-scn-03-r2` (one matrix row), `S6-scn-03-r2` (table numbers before the list order) and `B2-scn-03-r2` (the suppression row before "alarm to Ops") came out non-monotone — it now anchors on the step name only, in the source block the card names, and skips a one-row matrix. Second run: `S6-scn-03-r2` beat 7 ("Certificates — …") and `G2-scn-04-r2` beat 2 ("Seal and retest") — a one-word step name was not accepted and an unlocated step ("Usual paths") fell back to the whole section; fixed the same way. After that: **0 findings, 0 round-2 findings**, no card changed. No new allowlist entry; the r2 view shows the two existing `S3-scn-02` "130 s" items (decision 35) because that card now carries follow-ups.
- **Reading pass.** Every follow-up prompt and beat on the 108 cards, the five story cards' drills, both ladders and all 48 mock layers were read against the guide and the scripts (the dumps lived in the session scratchpad), with the audit's 211 review notes as the index: the 5 bridge beats (`F3-scn-01-f2` 0 and 2, `B2-scn-02-f2` 3, `A3-scn-01-f2` 2 and 3) are the common block's shape and their procedures are the guide's lines; every own-it and drill beat is a clause of its story, the playbook or the radios / lab backup, and no beat adds a tail the scripts don't say; every number, unit, section and step in a follow-up sits in the source it names (the "outside" notes are the known borrowings of decision 83 — the 10% rule, the NOAEL figures, the 480 V line, the issues-log fields — plus the scenario cards' own numbers); every fill-in is one of the scripts' brackets, and no bracketed line appears as a graded beat; the 7 prompt-number leaks are setup numbers (an 8-inch main, NFPA 92, "28 by 28", "Fire 2", 60 / 7.5 air changes, the 150% point, "that 10% rule" asking where it lives); the 13 non-copied mock layers are the experience question's scripted Story 2 follow-ups (decision 84); the one two-outcome prompt (`P4-scn-01-f1` "Pass, or punch item?") is the guide's own dichotomy ("a code failure, not a punch item") and its beats are the grade (decision 92). **No card content was changed and nothing in the guide was found wrong.**
- **Coverage targets** (common block), from the r2 report's table: every Core technical scenario card (walkthroughs aside) has 2 follow-ups with a why-not or what-if; every Core technical topic has ≥ 2 scenario cards with follow-ups; the two Core `confirmInEdition` scenarios (`E1-scn-02-r2`, `K1-scn-02-r2`) have find-outs (and the two Support ones, `G4-scn-02`, `G6-scn-01`); own-its per area — Cx framework 5 · Sprinkler & underground 1 · Pre-action 1 · Fire pump 1 · Emergency power 1 · Smoke control & FA FPT 1 · Gaseous & ASD 1 · BESS, gas & mist 1 · Applied & refresher 2; every Support topic has one scenario card with 1–2 follow-ups (G4 has two such cards); Light topics (F7, F9, S5, S8, A1, A5) are untouched; the 13 walkthroughs are scenario cards at par 120 with 2 follow-ups each; Interview: I3–I7 story cards carry 4 / 4 / 4 / 4 / 3 drills, the ladders `I3-sty-02-r2` and `I5-sty-02-r2` have 5 drill layers, I8–I11 unchanged.
- **Verified**: `npm test` 124/124 · `node validate.js src/data/questions.json --strict` 0 errors, 0 warnings · `node validate.js src/data/mock.json --strict` clean · `node scripts/audit.js` 0 findings, 0 round-2 findings (13 allowlisted, 313 review notes) · `node build.js` → `dist/index.html` 990 KB, 407 cards, 8 decks (dist/ recommitted — only the build stamp changed) · `node tools/smoke.js` **101/101** in the foreground, first run, no screenshot skipped.

- **Checked after D (Opus).** Planting four bad items in a scratch copy of the bank: invented experience in an own-it beat, a find-out on an unhedged card and a bracketed answer stated as fact were all findings; a wrong criterion in a `number` follow-up ("loss ≤ 2.5 psi") was only a review note, because 2.5 psi appears elsewhere in the guide. Fixed in `5cc4483` (decision 98); the bank still audits clean.

### Round 2 · Session E · Ship (Opus, Nov 2)

- **Cache version.** Automatic: the service worker's cache name is a hash of the build, so this build is `energize-<new hash>` against the installed v1.0's `energize-dbcee6e060` (the committed v1.0-round1 `dist/`); the Pages workflow builds its own `dist/` from the same sources. `package.json` → 1.1.0.
- **Upgrade proof** (`tools/smoke.js`): the actual `v1.0-round1` build is served over http and installed (service worker controlling, offline-capable), given `tests/fixtures/state-v1.0.json` as its save, then the server switches to this build. Opening the app updates the service worker behind the page and drops the v1.0 cache; the next open runs the new build with every rating, history entry, XP total, streak, Blitz best, energized building, snapshot and setting kept, the round-2 defaults (`nextRound` Round 2 · technical · no date, `interrupt` default) added, the migrated save written back, and the home screen saying "Round 2 · date not set" with the banner; the carried-over 10-card setting plays a 10-card shift. **Found on the way:** v1.0 after Nov 2 sits on its final screen, which never drew the "newer build" note — so on the phone the update arrives by closing the app fully and reopening it (the README says so). The new build shows the note on the day-of stop and round-done screens too, so later updates aren't hidden that way.
- **QA** (`tools/smoke.js`): every next-round state — unset, 7 and 5 days out, the sweep, day-of in both focuses, the day after — at 390×844 and 430×932 with no sideways scroll; a full technical shift (28 cards with the follow-up cards, 13 chained scenarios) and Round 2 deck A played end to end with interrupt mode on (every chained scenario and every technical / experience question cut into, each cut-in answered, every answer clean); Settings → Interrupt mode off, then the next day's shift and deck B with no cut-in. **Found on the way:** long runs sometimes stalled a DevTools evaluate or screenshot for 30 s — Chromium throttling a backgrounded headless page's timers; the launch now passes the standard no-throttling flags, and two back-to-back runs passed 119/119 with nothing skipped.
- **README**: a "Round 2 update" section (setting the next round's date and focus, what changed in shifts, follow-ups, interrupt mode, mock decks, adding the next round's debrief), the stale Nov 1 / Nov 2 day rules and counts replaced, the v1.0 → new-build update path, the new dev parameters.
- **Deploy**: waiting for Brandon's go-ahead to merge `round2` into `main` and push (the Pages workflow publishes on every push to `main`), then tag `v1.1-round2`.

### For the content sessions (B1, B2, C, D) — read this before writing cards

**Card fields added in round 2** (validator-enforced; `node validate.js src/data/questions.json --strict`):

| Field | Where | Rule |
| --- | --- | --- |
| `answer.followUps` | scenario and story cards only | array of `{ id, kind, prompt, beats, source, par }`; `id` = `<card id>-f1`, `-f2`…; `kind` ∈ `why-not` · `what-if` · `number` · `own-it` · `find-out` · `drill`; `beats` non-empty, strings or `{ "label": "…", "fillIn": true }` (shown, never graded); `source` non-empty (a guide heading path where you can — "Pre-action › Data center points to make" — else `story-scripts.md`, `study-guide.md` or `round1-debrief.md`); `par` seconds (45 technical, 20 for drill). `find-out` only on `confirmInEdition: true` cards. The prompt must not read as multiple choice. No other keys. |
| `walkthrough` | top-level, scenario only | `true` → labelled "Walkthrough"; `par` must be 120 (warning otherwise); beats = the guide's steps in order. Served only in the shift's walkthrough slot (and as the day-of warm-up), never as an ordinary card. |
| `ladder` | top-level, story only | `true` = a drill-ladder card (session C: the 5-layer "hardest challenge" for Story 1 and Story 3); its follow-ups must all be `kind: "drill"`. Keep the plain Story 1 / Story 3 cards (prompts starting "Story 1 —" / "Story 3 —", no `ladder`): day-of mode finds the hook lines there. |
| `answer.dontSay` | any card (session C: story cards) | a string or an array of strings, shown after grading under "Don't say" (each script's "Keep out" line). |
| ids | new cards | `-r2` suffix: `P5-scn-04-r2`. Existing ids, types and beats don't change unless a fact is wrong. |
| `source: "Round 1 debrief"` | debrief cards | accepted as the first segment (no Browse deep link). |

One follow-up chain as implemented (`src/data/sample.json`, E2-scn-01-r2 trimmed to one beat per layer):

```json
{
  "id": "E2-scn-01-r2", "topicId": "E2", "type": "scenario", "walkthrough": true, "par": 120,
  "prompt": "Walk me through the pull-the-plug IST, start to restore.",
  "answer": {
    "beats": ["Halls at load-bank heat; fire alarm normal. Then repeat with a fire scenario already in alarm", "…"],
    "requiresNumber": false, "codeRef": null, "explanation": "…",
    "followUps": [
      { "id": "E2-scn-01-r2-f1", "kind": "what-if", "prompt": "Say the campus is islanded — there's no utility to drop. What changes?",
        "beats": ["Trip a generation block instead of opening the utility main", "…"], "source": "Emergency power interface", "par": 45 },
      { "id": "E2-scn-01-r2-f2", "kind": "number", "prompt": "What does fire alarm have to carry on secondary power, and where's that from?",
        "beats": ["24 h standby + 5 min alarm on batteries", "…"], "source": "Emergency power interface › Fire alarm secondary power", "par": 45 }
    ]
  },
  "hook": "…", "source": "Emergency power interface › The L5 pull-the-plug test", "confirmInEdition": false
}
```

**How the chain grades** — each layer like a scenario on its own beats: all ticked = clean; one missing (with at least one ticked) = slipped; otherwise missed, framework if at least half. A layer with nothing ticked is a miss; a layer whose beats are all fill-ins is shown and not graded. The main layer keeps its own rules ("I said a number" unless `requiresNumber: false`; "I named the code reference" when `codeRef` is set). The card takes the worst layer. So **every beat in a follow-up must be something he can say and tick** — 2–4 per layer; put the number and its section in the beats of a `number` follow-up.

**What the shift does with your cards** — in a technical topic the shift serves a scenario with follow-ups first, then a plain scenario, defect, order, matrix, number (a number first if the topic's last miss was a number or a code section). Adding follow-ups to a topic's scenario makes it that topic's default card. The walkthrough slot rotates through `walkthrough: true` cards on topics below Locked In (until B1 adds them, it falls back to a scenario). The technical shift's two behavioral slots take a story with follow-ups, then a `ladder` story or an I8 backup.

**Mock decks** (`src/data/mock.json`, B2 and C — append; the v1 decks stay in the file, hidden): `{ "id", "round": "r2" | "r3", "title", "questions": [...] }`. A question is `{ id, kind, prompt, par, beats, source, topicId?, cardId?, followUps? }` with `kind` ∈ `intro` · `technical` · `experience` · `values` · `close`; `followUps: [{ prompt, beats?, kind?, par? }]` — with beats it is a graded layer, without beats it is asked but not graded; intro and close need no follow-ups; `par` 60–150; `source` must start with a real heading; `cardId` adds a "Practice the card" button to the debrief. Interrupt mode cuts in on technical and experience questions. `node validate.js src/data/mock.json --strict`; `tests/mock.test.js` grades every shipped question clean on a perfect answer, follow-ups included.

**Checks to run after each area**: `node validate.js src/data/questions.json --strict` · `npm test` (the bank test grades every card clean on its own model answer, every follow-up layer included) · `node scripts/audit.js` (since session D it walks `followUps[].beats`, the mock layers and the coverage targets too, and writes `audit-report-r2.md` beside `audit-report.md`) · `node build.js`, then open `dist/index.html?card=<id>` to see a card (`&interruptAt=1` to watch the first follow-up cut in).

**After B1**: `src/data/questions.round1.json` is the round-1 bank (do not edit it). `content/round1-debrief.md` is still the blank template — B1 skipped the debrief cards by Brandon's choice, so no own-it or drill beat may claim anything the story scripts don't say until that file is filled in. B2 and C add to the same bank; keep topic order and the `-r2` suffix on new ids. The follow-up harness B1 used (the audit run over a synthetic bank with every follow-up as a scenario card) lived in the session scratchpad; session D replaces it by extending `scripts/audit.js` to walk `followUps[].beats`.

**After B2**: the bank is 405 cards (17 `-r2`, 101 with follow-ups, 13 walkthroughs); every technical topic that is Core or Support now has follow-up chains, so session C touches only Interview topics (I3–I7 story follow-ups, the two ladders) and appends the `r3` decks to `src/data/mock.json` after the three `r2` decks. Mock follow-ups carry no `source` of their own — session D should scope them like the question's main beats (the question's section plus the sections its topic's cards cite); B2 checked them that way (0 findings). G1 sits at the Core maximum of 10 cards: a new G1 card would need `CARD_MINIMUMS` raised.

**After D**: `scripts/audit.js` is the follow-up audit (B1's scratchpad harness is retired): any later card, follow-up or deck goes through `node scripts/audit.js`, and `audit-report-r2.md` is where to read the follow-up-specific results and the coverage table. When `content/round1-debrief.md` is filled in, the audit already reads its "Facts about my own work" list items as an experience source, so own-it beats drawn from it will trace; a follow-up may cite it as `source: "round1-debrief.md"` or `"Round 1 debrief"`.

## In progress

- **Round 2 update.** Sessions A, B1, B2, C and D done; E done up to the deploy (branch `round2`, not pushed). Left: merge `round2` into `main`, push (Pages redeploys), tag `v1.1-round2` — waiting for Brandon's go-ahead. The round 1 debrief step was skipped (template unfilled) and can be run later. `main` and the live site are still v1.0 until then.

## For later sessions (re-audits, re-deploys)

- **Content or cards changed:** edit `content/*.md` or `src/data/*.json`, run `node scripts/audit.js --review`, fix the cards it lists by following the guide (never from memory), re-run until the report says `0 findings`; `npm test` fails while it has any. Follow-ups, ladders and round decks are reported in `audit-report-r2.md` (written on every run), with the coverage table and the reading-pass notes. A card that deliberately carries a non-guide number (a hypothetical reading in an interviewer prompt) goes in `scripts/audit-allow.json` with a reason. To eyeball a card: `node build.js`, then open `dist/index.html?card=<id>`.
- **Re-deploy:** `npm test && node build.js`, commit, push — the Pages workflow publishes `dist/`; the installed app offers Reload on its next online open. The build version (Settings, bottom line) tells you which build a phone is on.
- **Smoke hooks to keep** (tools/smoke.js): `#r-overall`, `#start-shift`, `#nav-settings` (the gear), `#nav-browse`, `#nav-blitz`, `#nav-stories`, `#nav-mock`, `#pause-shift`, `#export-state`, `#export-topics`, `#export-text`, `#import-paste`, `input.file`, `#settings-msg`, `#browse-search`, `#deck-<deck id>`, `#mock-done`, `#mock-reveal`, `#mock-grade`, `#mock-headline`, `#update-note`, `#reload-app`, `#app-panel`, `.btn.rec`; round 2: `#r-focus`, `#round-when`, `#round-banner`, `#grade-main`, `#followup-N`, `#followup-N-reveal`, `#followup-N-next`, `#interrupt`, `#interrupt-back`, `#interrupt-done`, `#hook-reveal`, `#round-form-{label,focus,date,save}`, `#next-round-{date,focus,save}`, `#set-interrupt`, `.round-group`, `.ldot`, `.round-done`; button texts `Submit`, `Submit order`, `Submit matrix`, `Reveal`, `Grade it`, `Done speaking`, `This line`, `Reset progress`; `.result h2` starts with Clean / Slipped / Missed and Next / Finish is the last `.result button`; `energize.bootMs`, `energize.updateReady`, `energize.data.build.version` on `window.energize`.
- **Rebuilding while the smoke runs** rewrites `dist/` under it — run them one after the other.

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

Phase 5 (ship):

49. **Companion files, not inlining.** The manifest and the service worker have to be real files on the server (a `data:` manifest is not installable everywhere, and a service worker must be a script URL), so the build writes six files beside `index.html`. `index.html` stays self-contained: nothing in it is needed from those files, so the single file still works from `file://`, where `pwa.js` registers nothing.
50. **Cache-first, update behind.** The shell is served from the cache (instant, offline), and a new build takes over on install (`skipWaiting` + `claim`) rather than waiting for every tab to close; the page is told through `controllerchange` and offers Reload instead of reloading itself (never mid-card). The cache name carries the build version, so every rebuild is an update and old caches are deleted on activate.
51. **Pages through Actions, not a committed `docs/` folder**, so the repo carries one copy of the build (`dist/`, kept committed for the plain-file route) and a push is the whole deploy. The workflow runs `npm test` first, so a card that fails the audit cannot ship.
52. **Layout stability over compactness.** The slot label is a fixed 72 px block and the progress dots never wrap, so a card starts at the same y as the one before it even when the topic name is long or follow-ups have extended the shift. Topic names longer than two lines are clamped on the card (they are in full in the building view).
53. **Boot work deferred, not removed.** The Browse search index (a walk over the rendered guide) is built on first open; the bank and the rendered guide are still parsed once, at load.
54. **The smoke test owns its own http server** (`serveDist`) for the installable-app checks, and can serve a "second build" by rewriting the service worker's version and marking `index.html`, which is how the update path is exercised without a second build on disk.
55. **Spoken cards never listen; they ask before grading a blank** (Oct 24, after the first real use: every story graded as a miss because the beats were spoken but not tapped). Story cards say "The taps are the grade" up front; the first *Done speaking* stops the clock and the recording, and if no beat is tapped the card asks — tap the beats you hit and *Grade it* (no time penalty), or *Grade as a miss*. Scenario cards say "Nobody is listening" before Reveal, and *Grade it* with nothing ticked asks the same way. Speech recognition stays out: the honor system is the spec (§4.4, §4.5) and it is how the interview works.

Round 2 · session A (retarget and follow-up engine):

56. **Day modes come from `settings.nextRound`**: normal · sweep (date − 1) · dayof (date) · after. The review cap is date − 1 while today is before the date; with no date, or once it has passed, it rolls at today + 7 (no interval is longer than 4 days, so nothing is capped and nothing is ever capped into the past).
57. **A review date beyond the cap comes due on the cap** (`isDue` compares `min(next_review, cap)`), so setting a date three days out pulls everything in for the sweep without rewriting topic records.
58. **Plan-date gating is off**: a Not Tested topic is always due. The 14-day plan rows stay in the data (the debrief's "Tonight" line simply never matches after Nov 2).
59. **Profiles scale with Settings → cards per shift.** Technical: 1 walkthrough, max(1, round(N × 2/15)) behavioral, the rest technical with a redo cap of round(N × 6/15) — 15 → 6 + 6 + 1 + 2. Behavioral: round(N × 8/15) Interview, 1 walkthrough, the rest technical with a redo cap of half of them — 15 → 8 + 3 redos max + 3 coverage + 1.
60. **Order in a shift**: technical — redos, coverage (spot check last), walkthrough, story, drill-down; behavioral — Interview × 8, technical, walkthrough. The walkthrough is chosen first so its topic is not spent on an ordinary slot.
61. **Sorting**: Not Tested coverage by area priority, then weight (§4 says "by area priority"); redos, due Minor Refresh, Keep going and the technical sweep by rating → weight → area priority. One coverage slot stays reserved for a stale Locked In spot check (decision 6).
62. **Technical card choice** (scenario with follow-ups → scenario → defect → order → matrix → number; walkthroughs last) is used for redo, coverage, spot, fill, Keep going and sweep slots on technical topics. "Drill this" and the follow-up *card* after a clean first answer keep the v1 picking rules (decision 8).
63. **Number-miss exception**: when the topic's most recent non-clean rated result was a number card, or its note says "code section" or "no number", number cards come first — but the "not the same card two shifts running" filter applies first, so a topic with one number card that was just missed gets its next-best card.
64. **Behavioral slots in a technical shift** come from the Interview queue: due topics in the normal order, then the others by least recently tested, so both slots always fill. Slot A: a story with follow-ups (not a ladder) → any story → any spoken card. Slot B ("drill-down"): a `ladder` story or an I8 backup → any story → any spoken card. In behavioral focus each Interview topic serves a story with follow-ups first (ladders included), then a story, a scenario, anything else.
65. **Sweep**: technical focus takes technical topics not Locked In (rating → weight → area priority); behavioral focus takes every topic not Locked In in the normal order. Misses still get one redo at the end.
66. **Day-of** results are logged with `rated: false` (as on Nov 2). Technical: six quick cards from Locked In, then Minor Refresh, technical topics; then the strongest topic's least recently seen walkthrough at par 90 with the chain off (else a technical scenario on a Locked In / Minor Refresh topic). Behavioral: six quick cards from any area, the I1 intro, then a "hook line" card for the story cards whose prompts start "Story 1" and "Story 3" — say it, Reveal the hook, Next; nothing recorded.
67. **After the date** the home screen is "Round 2 is done — set the next one": the campus, readiness, the form prefilled with the next label (Round 2 → Round 3), the same focus and no date. Saving returns home on the new schedule; ratings never change.
68. **Follow-up grading**: a layer is a scenario on its own beats, except that nothing ticked is always a miss (a one-beat drill can't "slip" on silence); fill-in-only layers are shown, not graded; the card's result, framework and note come from the worst graded layer (the note names it: "slipped: follow-up 2 (what-if) — 1 beat missed"). XP is per card, as before.
69. **Interrupt mode** (`settings.interrupt`, null = on in technical focus) applies to scenario cards with follow-ups and to technical / experience mock questions — not to story cards, where a drill-down question would land before the story reached the decision it asks about. Reveal is disabled during the cut-in; once the main answer is graded, follow-up 1 goes straight to its ticks.
70. **Mock round decks** ask every follow-up before the reveal (as v1 did) and the reveal ticks the main answer and each follow-up's beats; the question takes its worst layer; the debrief shows layer dots; the weakest-answer ranking counts beats across layers.
71. **Header**: the lead tile is technical (behavioral focus: interview) readiness with the 85% tick, then overall, then "N of 54 technical tested"; on tested moved to the meta line (`#r-tested`). The debrief keeps overall and on tested.
72. **QA overrides** `?round=YYYY-MM-DD|none`, `?focus=technical|behavioral`, `?interruptAt=<seconds>` are never saved (a "dev round" badge shows); `recordResult` takes the effective `nextRound` so the cap matches what the page shows.
73. **`tools/smoke.js` reads the DevTools port from the profile's `DevToolsActivePort`** (current Edge on Windows hands off to another process and prints nothing on stderr) and closes the browser over DevTools at the end, so no headless Edge is left running.

Round 2 · session B1 (technical follow-ups, data hall core):

74. **The L4-script walkthrough lives on A2, not P5.** The brief's "(P5, A2)" reads like its "(Q9, A3)": the first names where the content lives (P5's sample script; Q9), the second the topic that carries the walkthrough — the two Day 12 exercises are A2 and A3. `A2-scn-03-r2`'s beats are the Pre-action sample script's seven steps; P5 keeps its two scenario cards with follow-ups (`P5-scn-02` is already the seven steps at par 120). A topic's walkthrough is a separate card from its plain scenario on purpose (`C1-scn-04-r2` / `C1-scn-01`, `E2-scn-01-r2` / `E2-scn-01`, `A3-scn-03-r2` / `A3-scn-01` share their steps): the walkthrough is served only in the walkthrough slot, the plain card is the topic's default.
75. **Find-out follow-ups cite "Read this first".** Their first and third beats are that section's lines ("I don't know — here's how I'd find out" scores above a guess; name the section you'd check before writing the script); the middle beat repeats the card section's own hedge (NFPA 110 / the 2012 IBC), which the beat audit notes as "found outside the section" (a review note, not a finding). `study-guide.md` as a first segment passes the validator but does not resolve in `scripts/audit.js`, so it is not used anywhere.
76. **`E2-scn-01-r2` is the sample deck's card carried into the bank under the same id** (as Phase 2 did, decision 37); `sample.json` is unchanged.
77. **own-it beats when no story covers the exact test** follow the common block: say plainly there's no direct story → the closest thing the scripts support → how he'd run it per the guide (`A3-scn-01-f2`). Where a story covers the question, the own-it goes straight to it: Story 2 (cause-and-effect zone by zone, the wrong-COLO release, the VESDA thresholds), Story 3 (the client who tried every cheaper fix), Story 4 (on test first, isolation to return to normal), the lab backup (AHJ inspection, generator backup, fan and damper monitoring; its bracketed lines are fill-in beats). Nothing about his experience was written that the scripts don't say.
78. **No hypothetical numbers in follow-up prompts** ("over 500 gallons", "after the 50-second mark", "more than thirty pounds" are all guide numbers), so session D's extended audit has nothing to allowlist; the only follow-up that cites a number from another section names that section as its source (`C5-scn-02-f2` → Smoke control › table for IFC 901.6.2.2, as decision 48).
79. **`CARD_MINIMUMS` unchanged.** The nine `-r2` cards leave the largest Core topic (K3) at 9 and no Support topic grew, so neither the schema range nor the audit needed touching. `tools/smoke.js` was not touched either: its plain-scenario fixture `P6-scn-01` now carries follow-ups, so its "Grade it" button reads "Next — they follow up" and the stock smoke stops at that check (see Open questions — a one-line fixture change for session E).

Round 2 · session B2 (technical follow-ups, everything else, and the Round 2 mocks):

80. **Walkthroughs stay separate from the plain scenario** (as decision 74): `F1-scn-02-r2` / `F1-scn-01`, `F8-scn-03-r2` / `F8-scn-01`, `S6-scn-03-r2` / `S6-scn-01`, `G1-scn-03-r2` / `G1-scn-02`, `G2-scn-04-r2` / `G2-scn-01`, `G5-scn-03-r2` / `G5-scn-01`, `B2-scn-03-r2` / `B2-scn-02` share their steps. Where the brief's walkthrough is the guide's one-line list (the sprinkler checklist, the VESDA four beats, the BESS L5 scenario), each step carries that level's items and numbers from the same section, so the 120-second card has more to say than the plain card's list; the Q10 and Q11 walkthroughs are the guide's answer steps as written.
81. **own-it bridges where no story covers the area.** Fire pump → the lab backup's generator backup (`F3-scn-01-f2`); BESS → Story 3 (`B2-scn-02-f2`), which is flame detection and the BACnet link, so the beat says plainly there's no direct story of an off-gas IST before giving the guide's sequence; Sprinkler → Story 1's bar for sending the crew home (`S6-scn-02-f2`); Gaseous & ASD → Story 2 directly (`G5-scn-01-f1`). Each follows the common block's shape: no direct story → the closest thing the scripts support → how I'd run it per the guide.
82. **Find-outs on the Support `confirmInEdition` cards too** (`G4-scn-02`, `G6-scn-01`): the common block requires them only on Core, but these are the only hedged scenarios in the areas and the "I'd confirm the edition" answer is exactly what a peer will probe; their first and last beats are "Read this first" lines (decision 75).
83. **A follow-up's `source` names the section whose lines carry its numbers**, not necessarily the card's section: the 10% main-drain follow-ups on S4 cite Pre-action › Test-day details, the NOAEL follow-up on `G2-scn-03` cites the Clean agent table, the 480 V follow-up on `G1-scn-03-r2` cites Emergency power › Data center points, the IST-matrix follow-up on `B2-scn-03-r2` cites the Cx matrix. Beats that borrow only words from another section (the issues-log fields, "a deferral is a documented risk acceptance, an impairment entry and a fire watch") are left as paraphrase notes.
84. **Mock decks copy cards.** A technical question is its card's beats and both follow-ups verbatim with `cardId` set (so the audit's scope and the debrief's "Practice the card" button both resolve), par 120 for walkthroughs and 90 otherwise, follow-ups par 45 with their card kinds. The experience question is Story 2 in all three decks — the scripts' only data-center commissioning story — with its scripted follow-ups split across the decks as `own-it` layers; the intro's software number is a fill-in beat; intro and close carry no follow-ups. Prompts use the card's `interviewerPhrasing`.
85. **No engine, audit or tools change.** G1 reached exactly 10 (the Core maximum), nothing exceeds a bound, so `CARD_MINIMUMS` stays; `scripts/audit-allow.json` is unchanged (no new hypothetical numbers). The stock `tools/smoke.js` runs 100/100 on this build (its nudge fixture is `A1-scn-01` since `65133e0`); its one failure in this session was a transient DevTools screenshot timeout on the first run.

Round 2 · session C (behavioral slice):

86. **All of a story's scripted follow-ups go on its card**, in the script's order (four for Stories 1–4, three for Story 5), not just two: the drill-down is the point of Round 3, and a follow-up whose answer is still a bracket costs nothing (shown, not graded). The beats keep the script's sentences, split at its clause breaks.
87. **Story 4's "Something more recent?"** is answered in the scripts by "Go to the radios backup", so that layer's beats are the radios backup's clauses (source: Backup scripts) — the scripted answer, said in full.
88. **A drill ladder is its own story card** (`ladder: true`, `-r2` id, next to the story card) with the same script and beats as the story, so the shift can serve it in the drill-down slot and the story card keeps its scripted follow-ups. The ladder's layers are re-sorted script clauses (the decisions, the constraints, the cost, the radios, the client); where nothing answers a layer it is a fill-in (decision 68: not graded).
89. **The Round 3 decks reuse the v1 decks' values questions** (prompt and beats, already audited) and swap their single spoken follow-up for two scripted drills with beats. The hardest-challenge question's beats are the story's "beats to memorize" (the v1 deck's, minus their closing coaching line); the "Why Fluidstack?" beats drop the v1 line that answered its old follow-up.
90. **The ladders are `values` questions in the mock**, so interrupt mode never cuts into them (decision 69); every r3 follow-up runs 20 s.

Round 2 · session D (audit):

91. **A follow-up's scope chain starts at its own `source`, then the card's section.** Decision 83 lets a follow-up name the section that carries its numbers, so a fact in the follow-up's source is "in a section"; a fact only in the card's section is a review note ("the beat's words sit in the card's section"), never a finding — the same soft rule as scenario beats (decision 41). The validator's whole-document sources resolve too: `story-scripts.md` / `study-guide.md` as the whole file (counted as a section-level hit), `round1-debrief.md` / `Round 1 debrief` as the debrief's "Facts about my own work" list items only — never its template prose.
92. **What an own-it / drill beat may be.** Traced to the scripts (minus their "Open questions" list, which names what is *not* known), the Interview playbook or the debrief facts — whole or clause by clause; else the common block's disclaimer; else a guide procedure that carries no first-person experience marker. Anything else is a finding ("reads as experience but is found only in the guide" / "traces to neither"). The two bridges are always listed as review notes because a bag-of-words trace cannot see an invented tail on a true clause — that is the reading pass, done this session over every follow-up.
93. **Two-outcome prompts are not multiple choice.** "…after the 50-second mark. Pass, or punch item?" (`P4-scn-01-f1`) names the guide's own dichotomy ("a code failure, not a punch item") and its three beats are the grade; decision 46's definition (option markers, "which of the following", true/false, yes/no, a word answer offered) stands, and such tails are review notes, not findings.
94. **A `number` follow-up may carry the setup number in its prompt** ("At 60 air changes an hour, how much floor per hole?"); it is a finding only when the prompt contains every number the beats teach. Numbers inside a standard's name ("NFPA 92") are not criteria.
95. **Walkthrough order is checked on step names, in the source block.** A walkthrough beat is "step — that level's items" (decision 80), so only the text before the first " — " / ":" is located, in the list, line or label block the card's source names (no fallback to the section, whose line order is not the list's), and a one-row matrix walkthrough (`C4-scn-03-r2`) is noted rather than checked.
96. **The round-2 report is written on every run** beside the lean report (same `--out` directory, or `--out-r2`), with its review notes always included: it is the reading-pass artifact for later debrief cards, so it must not depend on `--review`. The new finding kinds also print in `audit-report.md`, so one zero gates both.
97. **No content change, no new allowlist entry.** Every first-run finding was the audit's own design (single-line traces, whole-beat order anchors) and was fixed in the audit, not by editing a card against it.

Round 2 · after D and session E:

98. **Numbers and references in a `number` follow-up are graded facts**: found only outside the follow-up's source and the card's section is a finding there, as for a number card's fields (other follow-ups keep decision 41's review note). Added after a planted "loss ≤ 2.5 psi" passed as a note.
99. **The upgrade path is "open, close, reopen"** for phones on v1.0 after Nov 2 (its final screen has no update note); from this build on, the note also shows on the day-of stop and round-done screens. The app still never reloads itself (decision 50).
100. **The smoke test launches its browser with the no-throttling flags** (`--disable-background-timer-throttling`, `--disable-renderer-backgrounding`, `--disable-backgrounding-occluded-windows`, `--disable-features=IntensiveWakeUpThrottling`); a stalled screenshot still retries once and is then skipped with a note.

## Open questions

- **Round 2 (session A):** `content/round1-debrief.md` is still the blank template. B1 turns it into cards and C/B use its "Facts about my own work" for own-it and drill beats — fill it in before B1, or B1 skips that step.
- **Round 2 (session A):** the kit's "Nov 2" study guide and story scripts are byte-identical to the Oct 23 copies. If the Claude Doc was edited after Oct 23, re-export it over `content/study-guide.md` / `story-scripts.md` and run `node scripts/guide-diff.js` before session B.
- **Round 2 (session A):** behavioral focus caps technical redos at 3 of its 6 technical slots (my reading of "due topics by the technical rules"); say if all 6 should go to redos first.
- **Round 2 (session A):** interrupt mode skips story cards (decision 69); say if the behavioral drill-downs should be cut in on too.
- **Round 2 (B1):** the round 1 debrief step was skipped by your choice (`content/round1-debrief.md` is the blank template). To run it later: fill the file in and ask Fable to "turn content/round1-debrief.md into cards, the same way as the round 1 debrief" (ROUND2_UPDATE_PROMPT.md › After it ships), then D on those cards and E to redeploy.
- **Round 2 (B1):** `A3-scn-01-f2` carries the beat "say plainly there's no direct story of a full data hall IST with load banks and a utility drop" because no script covers one. If you have run one, write it under "Facts about my own work" in the debrief file and the beat gets replaced with the facts.
- ~~**Round 2 (B1):** `tools/smoke.js` hard-codes `P6-scn-01` as its plain scenario~~ — fixed in `65133e0` (the fixture is `A1-scn-01`, a Light topic that never gets follow-ups).
- **Round 2 (C):** the story gaps — see "Story gaps to fill" in the session C section. One question isn't on the scripts' own list: what the client and the crew said after the Hawaii cutover (the Story 1 ladder's last layer is a fill-in until you answer it).
- **Round 2 (B1):** nothing in the guide was found wrong while writing these cards; no guide fix is pending.
- **Round 2 (B2):** the experience question ("Walk me through a fire system you commissioned in a data center — what failed and what did you do?") is Story 2 in all three r2 decks because the scripts hold no other data-center commissioning story. If you have one (the lab? a second COLO job?), write it under "Facts about my own work" in the debrief file and deck B or C can take it.
- **Round 2 (B2):** `F3-scn-01-f2` ("Have you proven a fire pump's transfer to the alternate source yourself?") and `B2-scn-02-f2` (the off-gas IST) carry a "say plainly there's no direct story" beat, as `A3-scn-01-f2` does. If you have run a pump acceptance test or a BESS off-gas IST, write it under "Facts about my own work" and the beat gets replaced with the facts.
- **Round 2 (B2):** G1 is at the Core maximum of 10 cards. If session D or a later debrief needs another G1 card, raise `CARD_MINIMUMS.Core[1]` in `src/engine/schema.js` (and the range check in `scripts/audit.js`, which calls `validateBank`) to 11, or retire one of G1's four number cards.
- **Round 2 (B2):** nothing in the guide was found wrong while writing these cards; no guide fix is pending.
- **Round 2 (D):** nothing needs your decision — the extended audit and the reading pass found no follow-up beat, prompt, ladder layer or mock layer that the guide or the scripts don't support, and no fact was changed. The only judgment calls are decisions 93 (two-outcome prompts stay) and 94 (setup numbers in `number` prompts stay); say if you want either tightened into a finding.
- **Round 2 (D):** the audit cannot see a true story clause with an invented tail; this session read every own-it and drill beat by eye (none found). When you fill `content/round1-debrief.md`, re-run `node scripts/audit.js` and read the bridge notes in `audit-report-r2.md` again before the next content session.

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

- Story recording is verified only with Chrome's fake microphone in the headless smoke run (granted and refused paths). On a real phone over https it should prompt once; on a plain `file://` open most browsers refuse it and the card says so.
- An iPhone cannot usefully open `dist/index.html` from the Files app (Safari's local-file handling); the hosted link is the iOS route.
- The "Install on this phone" button appears only where the browser fires `beforeinstallprompt` (Android Chrome); iOS has no such event, so the panel gives the Share → Add to Home Screen steps instead.
- The Start shift label shows the planned cards and minutes; clean first answers add follow-ups (decision 4), so a strong day runs longer than the estimate. The hint under the button says so.
- Number Blitz shuffles with `Math.random`, so two runs differ — on purpose.
- Mock interview results are not saved; the debrief is one screen and gone when you leave it.
- Browse deep links go to the longest matching *heading*; sources that end in a bold label or "table" land on the section heading above it.
- Story highlighting marks digits and number words in the script; it can over-mark (e.g. "one" in "nobody owned that gap").
- The map's small buildings (Field office, HQ, Pump) are ~40px tap targets on a 390px screen; the building list below the map is the full-size alternative.

## How to run

Needs Node ≥ 20 (built on 24). No npm install — there are no dependencies.

```
npm test                                   # 124 engine / data / bank / mock / build / audit / round tests
node validate.js src/data/questions.json   # schema check for the bank (also sample.json, mock.json); add --strict
node validate.js --headings                # headings a card's source may start with
node scripts/audit.js [--review] [--card <id>]   # every fact against the guide → audit-report.md + audit-report-r2.md (follow-ups, round decks, coverage; exit 1 on findings)
node build.js                              # → dist/index.html + manifest, sw.js, icons
node tools/smoke.js [--shots <dir>]        # headless Edge/Chrome: 390×844, 430×932, landscape, offline, install/update (100 checks)
node scripts/guide-diff.js                 # archived vs current guide and scripts → content/guide-diff.md
npm run check                              # tests + validate + audit + build
```

Play: open `dist/index.html` in any browser (double-click works; `file://` is fine), or serve `dist/` over http(s) for the installable, offline version (README › Get it on your phone). Special days follow the next round's date (Settings → Next round). To test them without saving anything: `?date=2026-11-11&round=2026-11-12` (the sweep), `?date=2026-11-12&round=2026-11-12` (day-of; add `&focus=behavioral`), `?date=2026-11-13&round=2026-11-12` (the day after), `?round=none` (no date). `?interruptAt=1` makes the first follow-up cut in after 1 s; `?deck=sample` forces the 12-card sample deck; `?card=P2-num-01` opens one card. State lives in `localStorage` under `energize.state.v1`; Settings → Reset clears it.
