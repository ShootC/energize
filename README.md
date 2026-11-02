# ENERGIZE

*Commission the campus. Ace the interview.*

A study game for the Fluidstack fire-protection commissioning interviews (round 1 on Mon Nov 2, 2026; the round 2 update retargets it at the rounds still to come). The campus is dark; every study area is a building, every topic a system that has to pass commissioning before its lights come on. Each day you run a short shift of cards that are due, graded with the same ratings, intervals and readiness formula as the morning-quiz tracker, so the game and the tracker agree.

- 407 cards over the 65 tracker topics, six card types: cold numbers with code sections, order-the-steps, build-the-IST-matrix, interviewer scenarios on a timer, story rehearsal with beats and optional local recording, spot-the-defect. 108 scenario and story cards carry follow-up chains — what a peer engineer asks next — and 13 are out-loud walkthroughs.
- Every number, section and sequence comes from `content/study-guide.md` and `content/story-scripts.md`; `scripts/audit.js` checks that it still does.
- One file, no server, no accounts, no network. Installs to a phone's home screen and runs offline.

## Get it on your phone

**The hosted link (recommended — installs like an app, works offline).** The app lives at:

```
https://shootc.github.io/energize/
```

- **iPhone** (Safari): open the link → Share → **Add to Home Screen** → Add. It opens full-screen with its own icon and keeps working with no signal after the first visit.
- **Android** (Chrome): open the link → ⋮ menu → **Install app** (or in the app: Settings → App → *Install on this phone*).

Progress lives in that browser's storage. When a newer build is published, the next time you open the app online the campus screen shows *A newer build is ready — Reload*. (Coming from v1.0 after Nov 2, the old build sits on its final screen, which has no note: open it once with a connection, close it completely, and open it again — your ratings, history, XP and streaks carry over.)

**Just the file.** Send yourself `dist/index.html` (email, Drive, USB, AirDrop) and open it in a browser. Everything works and progress stays in that browser; there is no home-screen icon or offline install on a plain file. This is the dependable route on a laptop or Android. iOS Safari does not open local HTML files well, so on an iPhone use the hosted link.

## A day with it

1. Open the app. The header leads with the readiness for your next round's focus (technical, or interview), then overall and how many of those topics you've tested; the line under the date counts down to the round. The map shows which buildings are dark, warming up or energized.
2. Tap **Start shift**: 15 cards by default, mostly technical and mostly out loud (see *Round 2 update* below). The hint under the button says how many are spoken.
3. Answer every blank; the card tells you how many it has. Spoken cards are graded by what you tick, and a chained card's follow-ups come after you grade the main answer. After each card: the result, the correction in the guide's words, the memory hook if you missed, one dot per layer of a chain.
4. The debrief shows the readiness before → after and the three topics to re-read tonight (tap one to open the guide at that section). **Keep going** pulls the next five due topics.
5. Any time: **Number Blitz** (60 seconds of numbers from your stronger topics), **Stories** (rehearse one with the timer and beats, then its drill-down), **Mock interview** (Round 2 and Round 3 decks), **Browse** (the guide and scripts, searchable).

Tap a building for its topics, each with its rating, streak and next review, and a **Drill this** button.

## Round 2 update

Round 1 (the hiring manager) is done. The update points the app at whatever round comes next — most likely a ~45-minute technical conversation with a peer engineer, then a ~30-minute behavioral drill-down (`content/rounds.md`).

**Set the next round.** Settings → **Next round**: a name ("Round 2"), a focus (**Technical** — a peer engineer, scenarios and follow-ups; or **Behavioral** — drill-down on your stories) and a date. Until you set a date the home screen asks for one and reviews run on a rolling 7-day horizon. Once it's set: the header counts down to it; the day before is the **sweep** (every topic not Locked In — technical topics only in technical focus — up to 20 cards, misses redone before it ends); the day itself is **day-of mode** (technical: six quick confidence cards and one 90-second walkthrough warm-up; behavioral: six quick cards, the 60-second intro and the hook lines of Story 1 and Story 3 — then stop, with the day-of checklist). The day after, the app asks for the next round; every rating carries over. The ratings, points, intervals and readiness formula are unchanged.

**What changed in shifts.** Every topic is eligible from day one (no more plan dates). A technical-focus shift is 6 redos, 6 coverage (Not Tested first, data-hall areas first: Cx → Pre-action → Emergency power → Smoke control → Gaseous & ASD → BESS → Fire pump → Sprinkler → Applied), one out-loud walkthrough and two story cards. Within a technical topic the shift serves a scenario with follow-ups first, then defect, order, matrix, number — but a Cold Number card if your last miss on that topic was a number or a code section. A behavioral-focus shift is 8 interview cards, 6 technical and a walkthrough. The header's lead number is technical readiness (behavioral focus: interview readiness); the target is 85% technical by the sweep day with no Core technical topic below Minor Refresh. Clean first answers still add a follow-up card on the same topic, so a good day runs longer than the estimate.

**Follow-ups.** After you grade the main answer of a chained card, "They follow up…" slides in with the next question and a 45-second timer (20 seconds for a story's drill-down): answer out loud, Reveal, tick what you said, next. Each layer is graded like a scenario and the card takes the worst layer, so a dropped follow-up shows — the result has one dot per layer. Kinds: *why not* (the alternative the guide rejects), *what if* (it fails again, the contractor says it passed, the AHJ disagrees), *the number* (the criterion and its section), *your own work* (only from your story scripts — where they don't cover something, the beat says so plainly), *find out* (on cards where the guide says to confirm the edition), *drill-down* (your stories). A bracketed detail you haven't confirmed yet shows as a "fill in" chip and is never graded — fill it in under "Facts about my own work" in `content/round1-debrief.md`.

**Interrupt mode** (Settings → Shift, on by default in technical focus): somewhere 40–70 seconds into a scenario answer, the first follow-up cuts in. Your clock pauses; answer it, tap *Done — back to your answer*, and pick up where you left off. It also cuts into technical questions in the Round 2 mock decks. Turn it off when you want to practice a clean, uninterrupted answer.

**Mock interviews.** Round 2 · Peer technical (three decks: your intro, five technical questions with two follow-ups each — a walkthrough, a troubleshooting question and one about your own work among them — then your questions for them) and Round 3 · Behavioral drill-down (two decks: your hardest challenge drilled five layers deep on Story 1 or Story 3, two values questions with follow-ups, your questions). Practice only; ratings don't move.

**Adding the next round's debrief.** After each round: copy `content/round1-debrief.md` to `content/round2-debrief.md` (and so on), fill it in — the questions they asked, where they dug in, and any true facts about your work the stories don't say yet — then run session B1's debrief step with "Turn content/round2-debrief.md into cards, the same way as the round 1 debrief", session D on just those cards, and session E to redeploy (`ROUND2_UPDATE_PROMPT.md` › After it ships). The round 1 debrief was skipped; it can be run the same way any time.

## Export to the chat tracker

Settings → Export → **topics.json**. Copy the text box (or use the downloaded file) and paste it into the tracker conversation: it is the tracker's own shape with the ratings, points, streaks and dates updated. **state.json** is a full backup (history, XP, settings); Settings → Import takes either, by file or by paste. The chat tracker's `topics.json` can be imported the same way to carry its ratings over.

## Updating the content

Facts live in `content/`; cards in `src/data/questions.json`; mock decks in `src/data/mock.json`. After editing:

```bash
node validate.js src/data/questions.json --strict   # schema
node scripts/audit.js --review                      # every fact against the guide → audit-report.md
npm test                                            # engine, bank, build and audit tests
node build.js                                       # → dist/
```

`PROGRESS.md` has the card schema, the rules the engine follows and how to add cards. The audit fails the tests until every number, section, step and beat is found in the guide (or listed with a reason in `scripts/audit-allow.json`).

## Hosting on GitHub Pages

Done on Oct 24, 2026: the public repository is [github.com/ShootC/energize](https://github.com/ShootC/energize) and the app is at `https://shootc.github.io/energize/`. For the record, the one-time setup was:

```bash
gh auth switch --user ShootC
gh repo create ShootC/energize --public --source . --remote origin
gh api -X POST repos/ShootC/energize/pages -f build_type=workflow   # Pages source: GitHub Actions
git push -u origin main && git push origin v1.0
```

`.github/workflows/pages.yml` builds `dist/` and publishes it on every push to `main`; a run takes about a minute (repo → Actions). Pages on a free account needs the repository to stay public.

**Re-deploy after editing cards or content:**

```bash
npm test && node build.js
git add -A && git commit -m "Cards: what changed" && git push
```

Wait for the Actions run (repo → Actions), then open the app once while online: it shows the Reload note and switches to the new build. Nothing else to do on the phone.

## Developing

Needs Node 20+ and no `npm install` (there are no dependencies).

```bash
npm test                     # 124 tests: engine rules, round dates, shift profiles, chains, bank, build, audit
node build.js                # dist/index.html + manifest, service worker and icons
node tools/smoke.js          # headless Edge/Chrome: shifts, chains, interrupt mode, mock decks, every round state at 390×844 and 430×932, offline, install, the v1.0 → round-2 upgrade
node scripts/audit.js        # the accuracy audit → audit-report.md and audit-report-r2.md (follow-ups, mock layers, coverage)
node validate.js --headings  # the headings a card's source may start with
```

Dev parameters on the page (never saved): `?date=2026-11-11` (any ISO date) for today, `?round=2026-11-12` (or `none`) and `?focus=technical|behavioral` for the next round, `?interruptAt=1` to make the first follow-up cut in after a second, `?card=P2-num-01` to open one card, `?deck=sample` for the 12-card sample deck. State is in `localStorage` under `energize.state.v1`; Settings → Reset clears it.

Layout: `src/engine/` (rules, pure JS, tested), `src/ui/` (screens and cards), `src/pwa/` (manifest and service worker templates), `src/data/` (cards and mock decks), `content/` (the source of truth), `tools/` (markdown renderer, icon, smoke test), `scripts/` (the audit), `tests/`.
