# Rating scale, scheduling and readiness rules (from the morning-quiz procedure)

These are the rules the chat-based readiness tracker uses. The game must produce the same ratings and the same readiness numbers so the two agree.

## Rating scale

| Rating | Points | Earned by | Next review |
| --- | --- | --- | --- |
| Locked In | 100 | Clean, cold, numbers and code section right, follow-up handled — and the second clean answer on a different day (streak ≥ 2) | +4 days |
| Minor Refresh | 75 | Right, but one detail slipped, slow, or needed a nudge; or a first clean answer (streak 1) | +2 days |
| Needs Improvement | 40 | Framework right, key number, step or reason missing | +1 day |
| Not Ready | 10 | Wrong, guessed or blank | +1 day |
| Not Tested | 0 | Not quizzed yet | morning after its study day |

- No review date goes past 2026-11-01; anything not Locked In by then is set to 2026-11-01 for the final sweep.
- Weighted readiness = Σ(weight × points) / Σ(weight × 100), with Core 3, Support 2, Light 1.
- Target 85% by Nov 1, with no Core topic below Minor Refresh.
- Also compute "on tested" readiness (same formula over topics with tests ≥ 1) and the count of topics tested out of 65.

## Building a quiz (the daily queue)

1. Queue = topics with `next_review` ≤ today, ordered Not Ready → Needs Improvement → Not Tested → Minor Refresh → Locked In, then Core → Support → Light, then plan day. Skip Not Tested topics whose `plan_date` is after yesterday.
2. Fifteen questions: up to 6 redos from the top of the queue (Not Ready, then Needs Improvement; Core first); 8 coverage questions (Not Tested topics whose `plan_date` ≤ yesterday first, by plan day, then due Minor Refresh, plus 1 spot check on a Locked In topic not tested in 3+ days if any); and 1 out-loud prompt (a story or a scenario, 60–120 s). If there are fewer than 6 redos, fill the slots with coverage questions.
3. Open recall only, never multiple choice. Ask for the number and its code section, the steps in order, or "what do you do next, and why". Phrase several as an interviewer would ("The 24-hour air test lost 3 psi. What next?").

## Grading

Be strict, but frame it so progress is visible. Headline shows both sides, e.g. "13 of 15 framework right · 4 close · 2 clean" (framework right = Needs Improvement or better; close = Minor Refresh; clean = streak ≥ 1 or Locked In). For each answer: the rating, what was right (first), the exact correction from the study guide in one or two lines, and for Needs Improvement / Not Ready a one-line memory hook. Most misses so far are skipped second halves of questions and missing code sections. For the out-loud prompt, also judge the 90–120 s shape: hook, decision with reason, a number, a lesson; flag rambling or a missing number.

## Updating a topic after grading

`rating`, `points`, `tests` + 1, `streak` (clean → +1, otherwise 0), `last_tested` = today, `last_result` (12 words max: what slipped, or "clean"), `next_review` per the scale. Ungraded due topics keep their date and roll forward.

## Special days

- Nov 1: the quiz is the sweep — every topic not Locked In, up to 20 questions.
- Nov 2 (interview day): no new material. Six quick confidence questions on Locked In topics plus the 60-second intro, then stop.
- After Nov 2: nothing.

## Topic record shape (topics.json)

`id, area, topic, day, plan_date, weight, studied, rating, points, tests, streak, last_tested, next_review, last_result`
