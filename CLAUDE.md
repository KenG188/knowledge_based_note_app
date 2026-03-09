# Knowledge Base App — Project Context

Personal knowledge base web app with Markdown notes and RAG-powered AI Q&A using Claude.

## Tech Stack

- **Framework:** Next.js 16 (App Router, `src/` dir, TypeScript)
- **Styling:** Tailwind CSS v4, shadcn/ui components
- **Database:** SQLite via `better-sqlite3` (file: `data/knowledge.db`)
- **Editor:** Tiptap v3 (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-placeholder`)
- **AI:** Anthropic SDK (`claude-sonnet-4-6`) for chat, OpenAI SDK for embeddings (`text-embedding-3-small`)
- **Theme:** `next-themes` with `attribute="class"`
- **Tests:** Vitest 4 — config must use `.mts` extension (`vitest.config.mts`) due to vite 7 ESM-only

## Commands

```bash
npm run dev        # start dev server at http://localhost:3000
npm run build      # production build
npm run typecheck  # npx tsc --noEmit
npm test           # npx vitest run
```

## Development Rules

- **Always run `npm test` after any change to `src/lib/`** — db, chunker, rag, embedding, claude
- **Always run `npm run typecheck` before considering a change done**
- **Write or update tests when adding/changing logic** in `src/lib/`
- UI components (`src/components/`, `src/app/`) don't have tests yet — verify manually in browser

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout — wraps with ThemeProvider, suppressHydrationWarning on <html>
│   ├── page.tsx                # Main page — three-panel layout (NoteList | Editor | ChatPanel)
│   ├── settings/page.tsx       # API key management (localStorage)
│   └── api/
│       ├── notes/route.ts          # GET (all/search ?q=), POST (create)
│       ├── notes/[id]/route.ts     # GET, PUT, DELETE single note
│       ├── notes/[id]/embed/route.ts  # POST — triggers RAG indexing
│       └── chat/route.ts           # POST — SSE streaming chat with RAG
├── components/
│   ├── NoteList.tsx            # Left sidebar: search, note list, create/delete
│   ├── Editor.tsx              # Center: Tiptap editor, title, tags, Ctrl+S save
│   ├── ChatPanel.tsx           # Right: SSE streaming chat, source citations
│   ├── ThemeProvider.tsx       # next-themes wrapper
│   ├── ThemeToggle.tsx         # Sun/Moon toggle (uses mounted guard to avoid hydration mismatch)
│   └── ui/                     # shadcn/ui: button, input, badge
├── lib/
│   ├── db.ts                   # SQLite CRUD: getDb, createNote, getNote, getAllNotes, updateNote, deleteNote, searchNotes, closeDb
│   ├── hooks.ts                # useNotes() — fetch/create/delete notes, debounced search
│   ├── chunker.ts              # chunkText(text, {maxChunkSize, overlap}) for RAG pipeline
│   ├── embedding.ts            # getEmbedding/getEmbeddings via OpenAI (apiKey param or env)
│   ├── rag.ts                  # indexNote, searchSimilar, cosineSimilarity — Float64Array BLOBs in SQLite
│   ├── claude.ts               # streamAnswer() async generator — Anthropic streaming
│   └── utils.ts                # cn() Tailwind class merger
│   └── __tests__/
│       ├── db.test.ts          # 7 tests — call closeDb() in afterEach before deleting test DB
│       ├── chunker.test.ts     # 4 tests
│       └── rag.test.ts         # 3 tests — pure math, no API calls needed
```

## Key Patterns & Gotchas

- **Next.js App Router dynamic params are a Promise:** `const { id } = await params`
- **SQLite tags:** stored as JSON string, returned as `string[]` via `JSON.parse`
- **DB singleton:** `getDb()` caches connection; call `closeDb()` in tests before deleting DB file
- **Embeddings:** stored as `Float64Array` serialized to `Buffer` BLOB in `note_chunks` table
- **SSE streaming:** chat route uses `ReadableStream` + `data: {...}\n\n` format; client reads via `fetch` + `ReadableStream` (not `EventSource`, which doesn't support POST)
- **Embed on save:** fire-and-forget (`.catch(() => {})`) — never blocks note save UX
- **API keys:** stored in `localStorage` as `anthropic_api_key` / `openai_api_key`, passed in request body
- **ThemeToggle:** uses `mounted` state to avoid hydration mismatch with `resolvedTheme`
- **Tiptap:** requires `immediatelyRender: false` in `useEditor` to avoid SSR hydration error

## Database Schema

```sql
notes (id, title, content, tags TEXT /* JSON array */, created_at, updated_at)
note_chunks (id, note_id FK→notes, chunk_text, embedding BLOB /* Float64Array */)
conversations (id, question, answer, sources TEXT /* JSON array */, created_at)
```

## API Keys (optional — only needed for AI features)

Set at `/settings` page. Stored in `localStorage`. Without keys:
- Note CRUD works fully
- Embed call silently fails (fire-and-forget)
- Chat panel shows an error if used

## Environment

```bash
# .env.local (optional — keys can also be set via /settings UI)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
```

## Ralph Loop (autonomous implementation)

The `scripts/ralph/` directory contains the Ralph autonomous agent setup used to build this project. `prd.json` tracks story completion. To add new features, convert requirements to user stories in `prd.json` and run:

```bash
env -u CLAUDECODE ./scripts/ralph/ralph.sh --tool claude 10
```
