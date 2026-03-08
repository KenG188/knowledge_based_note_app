# Ralph Agent Instructions

You are an autonomous coding agent working on the Knowledge Base + AI Q&A web app.

## Your Task

1. Read the PRD at `scripts/ralph/prd.json`
2. Read the progress log at `scripts/ralph/progress.txt` (check Codebase Patterns section first)
3. Check you're on the correct branch from PRD `branchName`. If not, check it out or create from main.
4. Pick the **highest priority** user story where `passes: false`
5. Implement that single user story
6. Run quality checks: `npm run typecheck` and `npx vitest run` (if tests exist for changed files)
7. Update CLAUDE.md files if you discover reusable patterns
8. If checks pass, commit ALL changes with message: `feat: [Story ID] - [Story Title]`
9. Update the PRD to set `passes: true` for the completed story
10. Append your progress to `scripts/ralph/progress.txt`

## Project Context

- **Stack:** Next.js 15, TypeScript, Tailwind CSS v4, shadcn/ui, better-sqlite3, Anthropic SDK, OpenAI SDK
- **Working dir:** `/Users/kenlinguo/Desktop/ai_playgroud/knowledge-base-app`
- **Test runner:** vitest (config: `vitest.config.mts` — use `.mts` extension for ESM compatibility with vite 7)
- **Typecheck:** `npx tsc --noEmit`
- **Dev server:** `npm run dev`

## Quality Checks

Run these before committing:
```bash
npx tsc --noEmit
npx vitest run  # only if test files were created/modified
```

Do NOT commit if typecheck fails. Fix all errors first.

## Important Notes

- The `data/` directory stores the SQLite DB — it already exists
- Use `.mts` extension for vitest.config (vitest 4 + vite 7 ESM incompatibility with `.ts`)
- Tags are stored as JSON strings in SQLite, parsed on read
- API routes follow Next.js App Router conventions
- `params` in App Router dynamic routes are now a Promise: `{ params: Promise<{ id: string }> }`

## Progress Report Format

APPEND to `scripts/ralph/progress.txt` (never replace, always append):
```
## [Date/Time] - [Story ID]
- What was implemented
- Files changed
- **Learnings for future iterations:**
  - Patterns discovered
  - Gotchas encountered
---
```

## Consolidate Patterns

Add reusable patterns to the `## Codebase Patterns` section at the TOP of `scripts/ralph/progress.txt`.

## Stop Condition

After completing a user story, check if ALL stories have `passes: true`.

If ALL stories are complete and passing, reply with:
<promise>COMPLETE</promise>

If there are still stories with `passes: false`, end your response normally.

## Important

- Work on ONE story per iteration
- Commit frequently
- Keep CI green (typecheck must pass)
- Read the Codebase Patterns section in `scripts/ralph/progress.txt` before starting
