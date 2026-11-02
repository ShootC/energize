# ENERGIZE — Round 2 update (spec delta)

This file sits on top of `GAME_SPEC.md`. Where the two conflict, this file wins. Everything it doesn't mention stays exactly as built.

---

## 1. What changed and why

Round 1 (the hiring manager, 30–45 min, 35% technical / 65% EQ) happened Mon Nov 2, 2026. Fluidstack says to expect no more than five interviews including the recruiter screen, usually over 1–3 weeks, so three rounds are probably left. The best guess at what they are (one comparable candidate report plus Fluidstack's FAQ; see `content/rounds.md`):

| Round | Likely format | Weight in this update |
| --- | --- | --- |
| 2 | Technical with a peer engineer, ~45 min, conversational: past work plus scenario questions, with follow-ups | **Primary — about 80% of the work** |
| 3 | Behavioral with a senior manager, ~30 min: one "hardest challenge" question, then lots of drill-down | Secondary — about 20% |
| 4 | Executive (VP/COO/CEO): mission, pace, fit | Out of scope |

The order isn't confirmed, so the app must let Brandon set the next round's focus and date himself.

The update does four things:
1. Replaces the hard-coded Nov 1 / Nov 2 dates with a **next-round date** he sets.
2. Rebuilds the daily shift so it is **mostly technical and mostly out loud**.
3. Adds **follow-up chains** to scenario and story cards — the one real content addition, because a peer engineer will not stop at the first answer.
4. Replaces the three mock interviews with **Round 2 (peer technical)** and **Round 3 (behavioral drill-down)** decks, and turns his **round 1 debrief** into cards.

---

## 2. Next-round date replaces the Nov 2 hard-coding

New setting:

```json
"nextRound": { "label": "Round 2", "focus": "technical", "date": null }
```

`focus` is `"technical"` or `"behavioral"`. `date` is `"YYYY-MM-DD"` or `null`.

| Old rule (GAME_SPEC.md / procedure-notes.md) | New rule |
| --- | --- |
| No review date past 2026-11-01 | No review date past **date − 1**. If `date` is null, the cap is a rolling **today + 7**. |
| Nov 1 = sweep (every topic not Locked In, up to 20 cards) | **date − 1** = sweep. Technical focus sweeps technical topics only; behavioral focus sweeps all. |
| Nov 2 = interview-day mode | **date** = day-of mode (below). |
| Oct 26–30 cutover (10-card shifts) | Removed. |
| After Nov 2: retire | After **date**: a "Round done — set the next one" screen (label, focus, date). Ratings carry over. Never retire. |

**Day-of mode**
- Technical focus: six quick confidence cards from Locked In technical topics, one 90 s walkthrough as a warm-up, then the stop screen and the day-of checklist from the guide.
- Behavioral focus: six Locked In cards, the 60-second intro (I1), the hook line of Story 1 and Story 3, then stop.

The rating ladder, points, intervals, streak rules and the readiness formula are **unchanged**. Only the dates move. Append a short "Round 2 dates" section to `content/procedure-notes.md` describing the table above, so the chat tracker can match the app if the morning quiz resumes.

---

## 3. Readiness

Keep overall and on-tested readiness exactly as they are (all 65 topics). Add two numbers using the same formula:

- **Technical readiness**: every area except Interview (54 topics: 33 Core, 15 Support, 6 Light).
- **Interview readiness**: the Interview area only (I1–I11).

Header in technical focus: `Technical 62% · Overall 58% · 31 of 54 tested`. Behavioral focus leads with Interview readiness.

Target: **technical readiness ≥ 85% by the sweep day, with no Core technical topic below Minor Refresh.**

---

## 4. Shift composition

Plan-date gating is off: every topic has been studied, so Not Tested topics are eligible from day one.

**Technical focus — 15 cards (the default)**

| Slots | What | Rule |
| --- | --- | --- |
| 6 | Redos | Technical topics only: Not Ready → Needs Improvement, Core first, then area priority. |
| 6 | Coverage | Technical topics: Not Tested first, by area priority, then due Minor Refresh, then 1 spot check on a Locked In topic not tested in 3+ days. |
| 1 | Out-loud walkthrough | A card tagged `walkthrough: true` (120 s). Rotate; prefer topics below Locked In. |
| 2 | Behavioral | One story card with follow-ups, one drill card or backup story. From the Interview queue by the normal order. |

Fewer than 6 redos → fill with coverage. Report how many of the 15 are out loud (scenario, walkthrough, story); aim for ≥ 8.

**Area priority for technical slots** (data-hall relevance first): Cx framework (C) → Pre-action (P) → Emergency power (E) → Smoke control & FA FPT (K) → Gaseous & ASD (G) → BESS, gas & mist (B) → Fire pump (F) → Sprinkler & underground (S) → Applied & refresher (A).

**Card choice within a technical topic:** scenario with follow-ups → defect → order → matrix → number. Exception: if the topic's last miss was a number or code section, serve a Cold Number card. Don't show the same card two shifts in a row when the topic has others.

**Behavioral focus — 15 cards:** 8 Interview (stories with follow-ups, the two drill ladders, backups, I10), 6 technical maintenance (due topics by the technical rules), 1 walkthrough.

---

## 5. Follow-up chains (the main content change)

Scenario and story cards gain an optional `answer.followUps` array. A card without it behaves exactly as before.

```json
{
  "id": "G2-scn-01",
  "topicId": "G2",
  "type": "scenario",
  "prompt": "A clean agent room fails its door fan test a week before turnover. What do you do?",
  "answer": {
    "beats": ["Find leaks under depressurization: smoke pencil, thermal camera", "Usual paths: cable and conduit penetrations, raised floor, ceiling plenum, dampers", "Seal and retest", "If turnover proceeds, document the risk acceptance"],
    "codeRef": "NFPA 2001",
    "followUps": [
      {
        "id": "G2-scn-01-f1",
        "kind": "why-not",
        "prompt": "Why not just add more agent and call it done?",
        "beats": ["It changes concentration against NOAEL", "It changes overpressure vent sizing"],
        "source": "Likely questions › Commissioning technical › 10",
        "par": 45
      },
      {
        "id": "G2-scn-01-f2",
        "kind": "own-it",
        "prompt": "Have you dealt with a room like that yourself?",
        "beats": ["(Only from story-scripts.md — or say plainly there's no direct story and bridge to the closest one)"],
        "source": "story-scripts.md",
        "par": 45
      }
    ]
  }
}
```

(The example's beats are from the guide's question 10; the own-it beats are a placeholder for the content session to fill from the scripts.)

**Follow-up kinds**

| kind | What it tests | Typical prompt |
| --- | --- | --- |
| `why-not` | The alternative the guide rejects, and why | "Why not just disable the hall during load banks?" |
| `what-if` | Failure, pushback or pressure | "It fails again on retest." / "The contractor says it passed." / "The AHJ disagrees." / "The schedule says skip it." |
| `number` | The criterion and its section | "What's the pass criterion, and where's it from?" |
| `own-it` | Experience bridge | "Where have you done this yourself?" |
| `find-out` | Graceful "I don't know" — only on `confirmInEdition: true` cards | "Which section would you check, and what do you do on site until you've confirmed it?" |
| `drill` | Behavioral drill-down | "Why that call?" / "What constrained you?" / "What would you do differently?" |

**Flow:** main prompt with its timer → Reveal → tick beats → a "They follow up…" panel slides in with follow-up 1 and a 45 s timer → Reveal → tick → follow-up 2 → result.

**Grading:** each layer graded like a scenario (all beats = clean; one missing = slipped; framework only = missed). **The card's result is the worst layer.** History records every layer. The debrief shows per-layer dots so a dropped follow-up is visible.

**Interrupt mode** (Settings, default **on** in technical focus): at a random moment 40–70 s into the main timer, follow-up 1 interrupts. The main timer pauses, he answers the follow-up, then the main answer resumes with its remaining time. It's still self-graded; the point is practicing being cut off mid-answer.

---

## 6. Round 1 debrief → cards

`content/round1-debrief.md` is a template Brandon fills in. Every question he lists there becomes at least one card, tagged to the closest topic, with `source: "Round 1 debrief"` and a follow-up that goes one level deeper than round 1 did. Model beats come from the guide or the scripts. A question the guide doesn't cover becomes a fill-in card and goes on the Open questions list. If the file still holds only the template, skip this step and note it.

---

## 7. Mock interviews

Replace Mock 1–3 on the home screen with decks from `src/data/mock.json`, grouped by a new `round` field.

- **Round 2 · Peer technical** (`round: "r2"`, three variants, ~45 min): 60-second intro (I1) as a warm-up; five technical questions with two follow-ups each — at least one walkthrough, one troubleshooting question and one experience question ("Walk me through a fire system you commissioned in a data center — what failed and what did you do?"); close with two of his questions for them (I10). Between the three decks, every Core technical area appears.
- **Round 3 · Behavioral drill-down** (`round: "r3"`, two variants, ~30 min): one "hardest challenge" question run as a 5-layer drill ladder (Story 1 in one deck, Story 3 in the other); two values questions from Likely questions 1–7 with two follow-ups each; close with I10.

Debrief format unchanged: headline ("4 of 5 framework right · 2 close · 1 clean"), weakest answer, what to re-read tonight.

---

## 8. Content rules — additions to GAME_SPEC.md §7

All of §7 still applies. In addition:

1. **Never invent Brandon's experience.** `own-it` and `drill` beats come only from `content/story-scripts.md`, the Interview playbook in `content/study-guide.md`, or the "Facts about my own work" section of `content/round1-debrief.md`. Bracketed `[…]` items stay fill-in chips.
2. `content/rounds.md` frames the mock decks. It is not a source for any technical fact.
3. `content/study-guide.md` and `content/story-scripts.md` are refreshed in this update (exported Nov 2). Cards whose `source` section changed since the Oct 23 export get re-audited (`content/guide-diff.md` lists them).
4. Follow-up prompts are open recall in a peer's spoken voice. No multiple choice.
5. Existing card ids, types and beats don't change unless a fact is wrong. New cards use an `-r2` id suffix.

---

## 9. Non-goals

No campus map redesign. No new card types beyond follow-up chains on existing types. No runtime AI, backend or accounts. Nothing for the executive round.
