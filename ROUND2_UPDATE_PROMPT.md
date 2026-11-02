# ENERGIZE — Round 2 update prompts for Claude Code

Five sessions, same rhythm as the original build: switch model, `/clear`, paste the block, let it run, check `PROGRESS.md`, move on. All hand-off state lives in `PROGRESS.md`, so switching models costs no context.

These prompts are written against the ENERGIZE spec, not your actual code. Each session starts by reading `PROGRESS.md` and adapting to what was really built.

| Session | Model | What it does |
| --- | --- | --- |
| A · Retarget + follow-up engine | **Opus** | Next-round date, technical-first shifts, follow-up chains, interrupt mode, new readiness numbers. Code only. |
| B1 · Technical follow-ups: data hall core | **Fable** | Follow-ups and walkthroughs for Cx, pre-action, emergency power, smoke control; round 1 debrief cards. |
| B2 · Technical follow-ups: everything else + Round 2 mocks | **Fable** | Pump, sprinkler, gaseous/ASD, BESS; three Round 2 mock decks. |
| C · Behavioral slice | **Opus** | Story follow-ups and drill ladders transcribed from your scripts; two Round 3 mock decks. |
| D · Audit | **Fable** | Every new or changed card checked against the guide and scripts. |
| E · Ship | **Opus** | Cache bump, QA with date overrides, redeploy, tag v1.1. |

If Fable credits run short, B2 can run on Opus. Keep D on Fable.

**Fast path — Round 2 is three days out or less:** run A → B1 → D (B1 cards only) → E. Skip B2 and C; use the chat for live mock rounds instead.

---

## Before session A (about 10 minutes)

1. **Unzip this kit into the root of your ENERGIZE folder.** It only adds files: `GAME_SPEC_ROUND2.md`, this file, `content/rounds.md`, `content/round1-debrief.md`, and `content/incoming/` (today's study guide and story scripts, plus the tracker's topic ratings as of Oct 29 for reference). Nothing existing is overwritten.
2. **Fill in `content/round1-debrief.md`** — rough is fine. Session B1 turns it into cards. If you skip it, B1 skips that step.
3. If you already know the date and focus of the next round, write them down; you'll set them in the app's Settings after session E.

---

## SESSION A — Retarget and follow-up engine  ·  `/model opus`  ·  `/clear`

```
Read PROGRESS.md, GAME_SPEC.md, then GAME_SPEC_ROUND2.md in full — it is a delta that wins over GAME_SPEC.md where they conflict. Then read content/rounds.md. Do not write any question content in this session.

Step 0 — Check the ground.
- If this isn't a git repo, git init and commit everything as it stands. Commit any uncommitted work, then tag v1.0-round1.
- Run the tests and the build. If the original build was never finished (PROGRESS.md says so, questions.json is empty, or dist/ doesn't build), stop and tell me exactly what exists before changing anything.
- Grep src/ and tests/ for every hard-coded date and special-day rule (2026-11-01, 2026-11-02, 2026-10-2, interview, sweep, cutover, retire). List each hit in PROGRESS.md under "Round 2 retarget".

Step 1 — Content swap.
- Move content/study-guide.md and content/story-scripts.md to content/archive/ with a -2026-10-23 suffix. Move content/incoming/study-guide.md and content/incoming/story-scripts.md into content/.
- Leave content/incoming/topics-tracker-2026-10-29.json where it is. It is reference only. Do NOT import it into app state: the app's own saved state stays the source of truth for ratings.
- Write scripts/guide-diff.js: compare archive vs new guide and scripts heading by heading and write content/guide-diff.md listing every heading (and table) whose text changed, was added or was removed. Session D audits the cards that cite those sections.
- Rebuild so the Browse screen shows the new guide and scripts.

Step 2 — Engine (src/engine). Write the tests first, then the code.
a. settings.nextRound = {label, focus: "technical"|"behavioral", date: "YYYY-MM-DD"|null}, default {label: "Round 2", focus: "technical", date: null}. Old saved state must load with these defaults: no rating reset, history, XP and streaks intact. The export shape doesn't change — topic records stay identical to topics.json.
b. Replace every hard-coded date with functions of nextRound.date per GAME_SPEC_ROUND2.md §2: cap = date − 1 (rolling today + 7 when null), sweep = date − 1, day-of = date, after date = "set the next round". Delete the Oct 26–30 cutover rule. Append a "Round 2 dates" section to content/procedure-notes.md describing the new rules.
c. Readiness: add technical readiness (every area except Interview) and interview readiness (Interview only), each with its tested count. Overall and on-tested stay exactly as they are.
d. Shift builder: the two profiles in §4, plan-date gating off, the area priority list, the card-choice order with the number-miss exception, no repeat of a topic's card two shifts running. Return how many cards in the shift are out loud.
e. Follow-up chains (§5): scenario and story cards accept answer.followUps[] = {id, kind, prompt, beats[], source, par}. kind is one of why-not, what-if, number, own-it, find-out, drill. Grade each layer like a scenario; the card result is the worst layer; history stores every layer's result. A card without followUps behaves exactly as before. Cards may also carry walkthrough: true (scenario type, par 120).
f. validate.js: accept and check the new fields (kind enum, non-empty beats, par, source, find-out only when the card has confirmInEdition: true). Every existing card must still validate.
Tests must encode: cap/sweep/day-of/after for a set date; rolling cap when null; technical readiness excludes I1–I11 (hand-computed fixture); shift composition for both profiles with 0, 3 and 6+ redos; chain grading (clean, clean, slipped → slipped); old-state migration.

Step 3 — UI (src/ui). Keep the existing look; change only what's listed.
a. Follow-up chain on scenario and story cards: after Reveal and ticks, a "They follow up…" panel slides in with the prompt and a 45 s timer; Reveal, tick; next layer; the result shows one dot per layer.
b. Interrupt mode toggle in Settings (default on in technical focus): at a random moment 40–70 s into the main timer, follow-up 1 cuts in; the main timer pauses; after the follow-up, the main answer resumes with its remaining time.
c. Home header per §3 (technical focus leads with technical readiness), a banner to set the next round's date when it's null, and "N days to Round 2" when it's set.
d. Settings: next round label, focus, date. After the date passes: the "Round done — set the next one" screen. Day-of screens for both focuses per §2.
e. Mock menu: list decks from src/data/mock.json grouped by a round field (r2, r3). Hide the old Mock 1–3 entries. Show "coming in a later session" when a round has no decks yet.
Don't touch the campus map, the other card UIs or Browse.

Step 4 — Verify. Add two sample cards with followUps to src/data/sample.json (facts from the guide only) to exercise the chain. Run the tests, rebuild, and check dist/index.html headless at 390×844 with ?date= overrides for: date unset; date set 7 days out; the sweep day; day-of in both focuses; the day after. No console errors; works offline.

Finish: update PROGRESS.md with what changed, the followUps schema as implemented (one JSON example), the validator command, and exactly what the content sessions need to know. Commit.
```

---

## SESSION B — Technical follow-ups  ·  `/model fable`  ·  `/clear` before each of B1 and B2

Paste the common block, then the sub-session block.

**Common block (top of B1 and B2):**

```
Read PROGRESS.md, GAME_SPEC.md §4, §6 and §7, GAME_SPEC_ROUND2.md §5, §6 and §8, then content/rounds.md and content/round1-debrief.md. You are adding round-2 technical content to ENERGIZE. My next interview is likely a ~45-minute technical conversation with a peer engineer at Fluidstack: my past work plus scenario questions, with follow-ups. Write what a sharp data center commissioning engineer would actually ask next.

Hard rules:
- Everything in GAME_SPEC.md §7 still applies. Every number, section, sequence and criterion in a beat comes from content/study-guide.md. Don't add or "correct" anything from your own NFPA knowledge — if you think the guide is wrong, flag it under Open questions in PROGRESS.md and still follow the guide.
- Never invent my experience. own-it beats come only from content/story-scripts.md (use its "Which story answers which question" table), the Interview playbook in the guide, or the "Facts about my own work" section of content/round1-debrief.md. When nothing covers the topic, the beats are: say plainly I haven't done that exact thing → name the closest thing I have done, only if the scripts support it → how I'd run it, per the guide. Bracketed [...] items stay fill-in chips.
- Follow-up kinds: why-not (the alternative the guide rejects, and why), what-if (fails again on retest / the contractor says it passed / the AHJ disagrees / the schedule says skip it), number (the criterion and its section), own-it (the experience bridge), find-out (only on confirmInEdition cards: which section or edition I'd check and what I'd do on site until it's confirmed — beats from the guide's "Read this first" and Sources notes).
- Prompts are short and spoken, in a peer's voice: "Okay, but why not just…", "Say the contractor tells you…". 2–4 checkable beats per follow-up. No multiple choice.
- Back up src/data/questions.json to src/data/questions.round1.json once, if that file doesn't exist yet. Edit cards in place. Don't change existing ids, types or beats unless a fact is wrong. New cards get an -r2 id suffix.
- After each area: node validate.js src/data/questions.json, run the tests, commit.

Coverage targets for the topics in this session:
- Core: every existing scenario card gets 2 follow-ups, at least one of them why-not or what-if. Every Core topic ends with at least 2 scenario cards that have follow-ups — write new ones from the guide where needed. Every Core scenario card with confirmInEdition: true gets a find-out follow-up.
- Each area gets at least one own-it follow-up.
- Support: at least 1 scenario card with 1–2 follow-ups.
- Light: no changes.
- Walkthrough cards: scenario type, walkthrough: true, par 120, beats = the guide's steps in order, plus 1–2 follow-ups.

Finish: PROGRESS.md gets a table per topic — scenario cards, follow-ups added by kind, new cards, debrief cards, anything flagged.
```

**B1 — the data hall core**

```
Sub-session B1. Topics: C1–C7, P1–P8, E1–E3, K1–K4, A2, A3. Guide sections: "Data center commissioning language", "Pre-action", "Emergency power interface", "Smoke control", Likely questions 8, 9 and 13, and the in-section "Likely question" lines for these areas.
Walkthrough cards: the L1–L5 ladder for a pre-action system (Q8); the data hall IST fire scenario (Q9, A3); the double-interlock L4 script, start to restore (P5, A2); one IST matrix row turned into test steps, blank cells included (C4); the pull-the-plug IST (E2); the smoke control acceptance sequence (K2).
Then the round 1 debrief: every question in content/round1-debrief.md becomes at least one card, tagged to the closest topic, source "Round 1 debrief", with a follow-up that goes one level deeper than round 1 did and beats from the guide or scripts. A question the guide doesn't cover becomes a fill-in card and goes on Open questions. If the file still holds only the template, skip this and say so in PROGRESS.md.
```

**B2 — everything else, plus the Round 2 mocks**

```
Sub-session B2. Topics: F1–F9, S1–S8, G1–G6, B1–B4, A1, A4, A5. Guide sections: "Fire pump", "Sprinkler and underground", "Clean agent and CO2", "Condensed aerosol", "Water mist", "Aspirating smoke detection (ASD)", "Gas detection", "Battery and BESS", "Hydraulic calculations" (A1 and A5 stay light), the Lake Mariner paragraph in the Interview playbook for A4 (NFPA 241 / IFC Chapter 33), Likely questions 10, 11, 12 and 14, and the in-section "Likely question" lines for these areas.
Walkthrough cards: pump acceptance test (F1); the 150% miss, in order (Q11, F8); clean agent acceptance with abort and manual release (G1); door fan failure a week before turnover (Q10, G2); VESDA in a contained data hall, four beats (G5); Li-ion off-gas → BMS trip → exhaust (B2); the sprinkler acceptance checklist (S6).
Then write the Round 2 mock decks into src/data/mock.json — append, keep any existing decks, set round: "r2". Three decks of about 45 minutes: the 60-second intro (I1) as the warm-up; five technical questions with 2 follow-ups each, drawn from the cards B1 and you wrote, including at least one walkthrough, one troubleshooting question and one experience question ("Walk me through a fire system you commissioned in a data center — what failed and what did you do?", own-it beats from the scripts only); close with two of my questions for them (I10). Vary the questions so all Core technical areas appear across the three decks. Debrief headline format from content/procedure-notes.md.
```

---

## SESSION C — Behavioral slice  ·  `/model opus`  ·  `/clear`

```
Read PROGRESS.md, GAME_SPEC_ROUND2.md §4, §5, §7 and §8, content/story-scripts.md and content/rounds.md. This is the smaller behavioral slice: my Round 3 is likely ~30 minutes with a senior manager — one "most difficult challenge" question and a lot of drill-down. Transcribe and structure; don't write new story content.

1. Story follow-ups: each story card for I3–I7 gets that story's "Follow-ups, 15 seconds each" from the scripts as followUps (kind drill, par 20, beats = the scripted answer's clauses, same substance and numbers). A bracketed answer becomes a fill-in chip, never a fact. Each script's "Keep out" line becomes a "Don't say" note shown after grading. The backup scripts (I8) have no scripted follow-ups; leave those cards as they are.
2. Drill ladders: one 5-layer drill card each for Story 1 (Hawaii cutover) and Story 3 (BESS ground faults), the two "hardest challenge" candidates. Layers: Why did you make that call? · What constrained you? · What did it cost, or what was the risk? · What would you do differently? · What did the client or crew think? Beats only from that story's script, beats list, follow-ups, the playbook's numbers, or the "Facts about my own work" section of content/round1-debrief.md. A layer nothing answers becomes a fill-in layer. List those in PROGRESS.md under "Story gaps to fill", each matched to the item in the scripts' "Open questions to finish the stories" list.
3. Round 3 mock decks in src/data/mock.json (round: "r3"), two decks of about 30 minutes: the hardest-challenge question run as the 5-layer ladder (Story 1 in deck A, Story 3 in deck B); two values questions from Likely questions 1–7 with 2 follow-ups each; close with I10.
4. Validate, run the tests, rebuild, commit. Update PROGRESS.md.
```

---

## SESSION D — Audit  ·  `/model fable`  ·  `/clear`

```
Read PROGRESS.md, GAME_SPEC.md §7, GAME_SPEC_ROUND2.md §8 and content/guide-diff.md. Audit only what changed in this update: every card with followUps, every card with an -r2 id or source "Round 1 debrief", every mock deck with round r2 or r3, and every older card whose source section is listed in content/guide-diff.md.

Extend scripts/audit.js to walk followUps[].beats as well as the main answers. Check that:
- every number, unit, section reference and step in a beat is found in the source it names (verbatim or trivially reformatted);
- own-it and drill beats trace to story-scripts.md, the guide's Interview playbook, or the debrief's "Facts about my own work" section — no invented experience;
- find-out follow-ups appear only on confirmInEdition cards;
- no bracketed item is presented as fact;
- no follow-up prompt is secretly multiple choice;
- the coverage targets from the session B common block are met for every topic.

Write audit-report-r2.md. Fix every finding by hand, following the guide, never your own knowledge. Re-run until only items that need my decision remain, and list those under Open questions in PROGRESS.md, one line each. Run the tests, rebuild, commit.
```

---

## SESSION E — Ship  ·  `/model opus`  ·  `/clear`

```
Read PROGRESS.md. Ship the round 2 update to my phone.

1. Bump the service worker cache version so the installed app picks up the update. Prove an existing install keeps its data: load a v1.0 state fixture, load the new build, and confirm ratings, history, XP and streaks are intact.
2. QA at 390×844 and 430×932 with ?date= overrides: next-round date unset; set 5 days out; the sweep day; day-of in both focuses; the day after. Run one full technical shift and one Round 2 mock deck end to end, with interrupt mode on and off. Fix what you find.
3. Redeploy the same way v1.0 was deployed (see README.md and PROGRESS.md). Tag v1.1-round2 and commit.
4. README.md: add a "Round 2 update" section — setting the next round's date and focus, what changed in shifts, how follow-ups and interrupt mode work, how to add more round debriefs later.
5. Give me the URL and exactly what to set in Settings when I first open it.
```

---

## After it ships

- **Set the next round in Settings** as soon as the recruiter gives you a date; until then the app schedules on a rolling 7-day horizon.
- **After each round**, copy `content/round1-debrief.md` to `content/round2-debrief.md`, fill it in, and run session B1's debrief step on Fable with: "Turn content/round2-debrief.md into cards, the same way as the round 1 debrief." Then run D on just those cards and E to redeploy.
- **Found a wrong fact?** Fix it in the Claude Doc, re-export it over `content/study-guide.md`, then run D with: "The guide changed in section X. Re-audit and fix the affected cards."
