# ENERGIZE

*Commission the campus. Ace the interview.*

A study game for the Fluidstack fire-protection commissioning interview (Mon Nov 2, 2026). The campus is dark; every study area is a building, every topic a system that has to pass commissioning before its lights come on. Each day you run a short shift of cards that are due, graded with the same ratings, intervals and readiness formula as the morning-quiz tracker, so the game and the tracker agree.

- 388 cards over the 65 tracker topics, six card types: cold numbers with code sections, order-the-steps, build-the-IST-matrix, interviewer scenarios on a timer, story rehearsal with beats and optional local recording, spot-the-defect.
- Every number, section and sequence comes from `content/study-guide.md` and `content/story-scripts.md`; `scripts/audit.js` checks that it still does.
- One file, no server, no accounts, no network. Installs to a phone's home screen and runs offline.

## Get it on your phone

**The hosted link (recommended — installs like an app, works offline).** Once the repository is on GitHub under the ShootC account (steps below), the app lives at:

```
https://shootc.github.io/energize/
```

- **iPhone** (Safari): open the link → Share → **Add to Home Screen** → Add. It opens full-screen with its own icon and keeps working with no signal after the first visit.
- **Android** (Chrome): open the link → ⋮ menu → **Install app** (or in the app: Settings → App → *Install on this phone*).

Progress lives in that browser's storage. When a newer build is published, the next time you open the app online the campus screen shows *A newer build is ready — Reload*.

**Just the file.** Send yourself `dist/index.html` (email, Drive, USB, AirDrop) and open it in a browser. Everything works and progress stays in that browser; there is no home-screen icon or offline install on a plain file. This is the dependable route on a laptop or Android. iOS Safari does not open local HTML files well, so on an iPhone use the hosted link.

## A day with it

1. Open the app. The header shows readiness overall, on tested topics, and N of 65 tested; the map shows which buildings are dark, warming up or energized.
2. Tap **Start shift**: 15 cards by default (10 in cutover week Oct 26–30, up to 20 on the Nov 1 sweep, six confidence cards plus the 60-second intro on Nov 2). Redos first, then coverage, one card out loud.
3. Answer every blank; the card tells you how many it has. After each card: the result, the correction in the guide's words, and the memory hook if you missed.
4. The debrief shows the readiness before → after, the three topics to re-read tonight (tap one to open the guide at that section) and tonight's plan line. **Keep going** pulls the next five due topics.
5. Any time: **Number Blitz** (60 seconds of numbers from your stronger topics), **Stories** (rehearse one with the timer and beats), **Mock interview** (five questions with follow-ups, Days 6, 12 and 13 are flagged), **Browse** (the guide and scripts, searchable).

Tap a building for its topics, each with its rating, streak and next review, and a **Drill this** button.

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

## Hosting on GitHub Pages (one-time)

Pages on a free GitHub account needs a public repository. The repo includes the study guide and the story scripts; if that should stay private, skip this and use the file.

```bash
gh auth login                                   # sign in as ShootC (gh auth switch --user ShootC if already added)
gh repo create ShootC/energize --public --source . --remote origin --push
gh api -X POST repos/ShootC/energize/pages -f build_type=workflow
```

The last command sets the Pages source to GitHub Actions (also: repo → Settings → Pages → Source: *GitHub Actions*). `.github/workflows/pages.yml` then builds `dist/` and publishes it on every push to `main`; the first run takes about a minute. The app is at `https://shootc.github.io/energize/`.

**Re-deploy after editing cards or content:**

```bash
npm test && node build.js
git add -A && git commit -m "Cards: what changed" && git push
```

Wait for the Actions run (repo → Actions), then open the app once while online: it shows the Reload note and switches to the new build. Nothing else to do on the phone.

## Developing

Needs Node 20+ and no `npm install` (there are no dependencies).

```bash
npm test                     # 95 tests: engine rules, bank coverage and answerability, build, audit
node build.js                # dist/index.html + manifest, service worker and icons
node tools/smoke.js          # headless Edge/Chrome: full shifts at 390×844, 430×932 and landscape, offline, install
node scripts/audit.js        # the accuracy audit → audit-report.md
node validate.js --headings  # the headings a card's source may start with
```

Dev parameters on the page: `?date=2026-11-01` (any ISO date) to test special days, `?card=P2-num-01` to open one card, `?deck=sample` for the 10-card sample deck. State is in `localStorage` under `energize.state.v1`; Settings → Reset clears it.

Layout: `src/engine/` (rules, pure JS, tested), `src/ui/` (screens and cards), `src/pwa/` (manifest and service worker templates), `src/data/` (cards and mock decks), `content/` (the source of truth), `tools/` (markdown renderer, icon, smoke test), `scripts/` (the audit), `tests/`.
