# ENERGIZE kit — what's in here and what to do

1. Make a project folder on your computer (e.g. `~/Projects/energize`) and copy everything in this kit into it, keeping the `content/` folder intact.
2. Open Claude Code in that folder.
3. Open `CLAUDE_CODE_PROMPT.md`. It has five phases. Each one says which model to use (`/model opus` or `/model fable`), and each one starts with `/clear`. Paste the phase's prompt block, let it run, check `PROGRESS.md`, move to the next phase.
4. Phase 2 (the question bank, on Fable) is four smaller sessions: paste the common block, then the sub-session block.
5. When Phase 5 finishes you get a URL and a single `index.html` you can add to your phone's home screen.

Files:

- `GAME_SPEC.md` — the full game design: mechanics, card types, scoring that matches the chat tracker, screens, data shapes, content rules. Claude Code reads it; you can too.
- `CLAUDE_CODE_PROMPT.md` — the build order with model switches.
- `content/study-guide.md` — your 14-day plan and study guide, exported Oct 23. The only source of technical facts.
- `content/story-scripts.md` — the five stories, backups, intro and "why Fluidstack" as spoken scripts.
- `content/topics.json` — the 65 topics with your current ratings from the tracker (as of the Oct 23 quiz). The game imports this on first run so you don't start from zero.
- `content/procedure-notes.md` — the rating ladder, readiness formula, queue rules and special-day rules the game must match.

If you update the study guide in Claude later, re-export it over `content/study-guide.md` and re-run Phase 4.
