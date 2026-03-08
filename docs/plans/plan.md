# Knowledge Base + AI Q&A Web App Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a personal knowledge base web app with Markdown notes and RAG-powered AI Q&A using Claude API.

**Architecture:** Next.js 14+ App Router with SQLite (better-sqlite3) for local storage, OpenAI Embedding API for vectorization, and Claude API for AI answers. Three-panel layout: note list, editor, AI chat panel.

**Tech Stack:** Next.js 14+, TypeScript, Tailwind CSS, shadcn/ui, Tiptap editor, better-sqlite3, Anthropic SDK, OpenAI SDK (embeddings only)

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.js`, `tailwind.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx`

**Step 1: Initialize Next.js project**

Run:
```bash
cd /Users/kenlinguo/Desktop/ai_playgroud/knowledge-base-app
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

Expected: Project scaffolded with App Router, TypeScript, Tailwind CSS.

**Step 2: Install core dependencies**

Run:
```bash
cd /Users/kenlinguo/Desktop/ai_playgroud/knowledge-base-app
npm install better-sqlite3 @anthropic-ai/sdk openai
npm install -D @types/better-sqlite3
```

**Step 3: Install shadcn/ui**

Run:
```bash
cd /Users/kenlinguo/Desktop/ai_playgroud/knowledge-base-app
npx shadcn@latest init -d
```

Then install needed components:
```bash
npx shadcn@latest add button input textarea card dialog badge scroll-area separator sheet tabs
```

**Step 4: Create data directory**

Run:
```bash
mkdir -p /Users/kenlinguo/Desktop/ai_playgroud/knowledge-base-app/data
echo "*.db" >> /Users/kenlinguo/Desktop/ai_playgroud/knowledge-base-app/.gitignore
```

**Step 5: Verify dev server starts**

Run:
```bash
cd /Users/kenlinguo/Desktop/ai_playgroud/knowledge-base-app && npm run dev
```

Expected: Server starts on http://localhost:3000 without errors.

**Step 6: Initialize git and commit**

Run:
```bash
cd /Users/kenlinguo/Desktop/ai_playgroud/knowledge-base-app
git init
git add .
git commit -m "chore: scaffold Next.js project with dependencies"
```

---

## Task 2: SQLite Database Layer

**Files:**
- Create: `src/lib/db.ts`
- Test: `src/lib/__tests__/db.test.ts`

**Step 1: Install test runner**

Run:
```bash
cd /Users/kenlinguo/Desktop/ai_playgroud/knowledge-base-app
npm install -D vitest @vitejs/plugin-react
```

Create `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

**Step 2: Write failing tests for database initialization and CRUD**

Create `src/lib/__tests__/db.test.ts`:
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { getDb, createNote, getNote, getAllNotes, updateNote, deleteNote, searchNotes } from '../db'
import fs from 'fs'
import path from 'path'

const TEST_DB_PATH = path.join(__dirname, 'test.db')

describe('Database', () => {
  beforeEach(() => {
    // Use test database
    process.env.DB_PATH = TEST_DB_PATH
  })

  afterEach(() => {
    // Clean up test database
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH)
    }
  })

  it('should initialize database with tables', () => {
    const db = getDb()
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[]
    const tableNames = tables.map(t => t.name)
    expect(tableNames).toContain('notes')
    expect(tableNames).toContain('note_chunks')
    expect(tableNames).toContain('conversations')
  })

  it('should create a note', () => {
    const note = createNote({ title: 'Test Note', content: '# Hello\nWorld', tags: ['test', 'demo'] })
    expect(note.id).toBeDefined()
    expect(note.title).toBe('Test Note')
    expect(note.content).toBe('# Hello\nWorld')
    expect(note.tags).toEqual(['test', 'demo'])
  })

  it('should get a note by id', () => {
    const created = createNote({ title: 'My Note', content: 'Content here', tags: [] })
    const note = getNote(created.id)
    expect(note).not.toBeNull()
    expect(note!.title).toBe('My Note')
  })

  it('should get all notes', () => {
    createNote({ title: 'Note 1', content: 'Content 1', tags: [] })
    createNote({ title: 'Note 2', content: 'Content 2', tags: ['tag1'] })
    const notes = getAllNotes()
    expect(notes).toHaveLength(2)
  })

  it('should update a note', () => {
    const note = createNote({ title: 'Original', content: 'Original content', tags: [] })
    const updated = updateNote(note.id, { title: 'Updated', content: 'Updated content', tags: ['updated'] })
    expect(updated.title).toBe('Updated')
    expect(updated.content).toBe('Updated content')
    expect(updated.tags).toEqual(['updated'])
  })

  it('should delete a note', () => {
    const note = createNote({ title: 'To Delete', content: 'Delete me', tags: [] })
    deleteNote(note.id)
    const result = getNote(note.id)
    expect(result).toBeNull()
  })

  it('should search notes by title and content', () => {
    createNote({ title: 'JavaScript Guide', content: 'Learn JS basics', tags: [] })
    createNote({ title: 'Python Guide', content: 'Learn Python basics', tags: [] })
    const results = searchNotes('JavaScript')
    expect(results).toHaveLength(1)
    expect(results[0].title).toBe('JavaScript Guide')
  })
})
```

**Step 3: Run tests to verify they fail**

Run: `cd /Users/kenlinguo/Desktop/ai_playgroud/knowledge-base-app && npx vitest run src/lib/__tests__/db.test.ts`

Expected: FAIL — module `../db` not found.

**Step 4: Implement the database module**

Create `src/lib/db.ts`:
```typescript
import Database from 'better-sqlite3'
import path from 'path'

export interface Note {
  id: number
  title: string
  content: string
  tags: string[]
  created_at: string
  updated_at: string
}

export interface NoteInput {
  title: string
  content: string
  tags: string[]
}

interface NoteRow {
  id: number
  title: string
  content: string
  tags: string
  created_at: string
  updated_at: string
}

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (db) return db

  const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'data', 'knowledge.db')
  db = new Database(dbPath)

  // Enable WAL mode for better performance
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      tags TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS note_chunks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      note_id INTEGER NOT NULL,
      chunk_text TEXT NOT NULL,
      embedding BLOB,
      FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      sources TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)

  return db
}

function rowToNote(row: NoteRow): Note {
  return {
    ...row,
    tags: JSON.parse(row.tags || '[]'),
  }
}

export function createNote(input: NoteInput): Note {
  const db = getDb()
  const stmt = db.prepare('INSERT INTO notes (title, content, tags) VALUES (?, ?, ?)')
  const result = stmt.run(input.title, input.content, JSON.stringify(input.tags))
  return getNote(result.lastInsertRowid as number)!
}

export function getNote(id: number): Note | null {
  const db = getDb()
  const row = db.prepare('SELECT * FROM notes WHERE id = ?').get(id) as NoteRow | undefined
  return row ? rowToNote(row) : null
}

export function getAllNotes(): Note[] {
  const db = getDb()
  const rows = db.prepare('SELECT * FROM notes ORDER BY updated_at DESC').all() as NoteRow[]
  return rows.map(rowToNote)
}

export function updateNote(id: number, input: NoteInput): Note {
  const db = getDb()
  db.prepare('UPDATE notes SET title = ?, content = ?, tags = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(input.title, input.content, JSON.stringify(input.tags), id)
  return getNote(id)!
}

export function deleteNote(id: number): void {
  const db = getDb()
  db.prepare('DELETE FROM notes WHERE id = ?').run(id)
}

export function searchNotes(query: string): Note[] {
  const db = getDb()
  const pattern = `%${query}%`
  const rows = db.prepare('SELECT * FROM notes WHERE title LIKE ? OR content LIKE ? ORDER BY updated_at DESC')
    .all(pattern, pattern) as NoteRow[]
  return rows.map(rowToNote)
}
```

**Step 5: Run tests to verify they pass**

Run: `cd /Users/kenlinguo/Desktop/ai_playgroud/knowledge-base-app && npx vitest run src/lib/__tests__/db.test.ts`

Expected: All 7 tests PASS.

**Step 6: Commit**

```bash
cd /Users/kenlinguo/Desktop/ai_playgroud/knowledge-base-app
git add src/lib/db.ts src/lib/__tests__/db.test.ts vitest.config.ts package.json package-lock.json
git commit -m "feat: add SQLite database layer with notes CRUD"
```

---

## Task 3: Notes API Routes

**Files:**
- Create: `src/app/api/notes/route.ts` (GET all, POST create)
- Create: `src/app/api/notes/[id]/route.ts` (GET one, PUT update, DELETE)

**Step 1: Write the GET all / POST route**

Create `src/app/api/notes/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getAllNotes, createNote, searchNotes } from '@/lib/db'

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')
  const notes = query ? searchNotes(query) : getAllNotes()
  return NextResponse.json(notes)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { title, content, tags } = body

  if (!title || !content) {
    return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
  }

  const note = createNote({ title, content, tags: tags || [] })
  return NextResponse.json(note, { status: 201 })
}
```

**Step 2: Write the single-note routes**

Create `src/app/api/notes/[id]/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getNote, updateNote, deleteNote } from '@/lib/db'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const note = getNote(Number(id))
  if (!note) {
    return NextResponse.json({ error: 'Note not found' }, { status: 404 })
  }
  return NextResponse.json(note)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const { title, content, tags } = body

  const existing = getNote(Number(id))
  if (!existing) {
    return NextResponse.json({ error: 'Note not found' }, { status: 404 })
  }

  const updated = updateNote(Number(id), {
    title: title ?? existing.title,
    content: content ?? existing.content,
    tags: tags ?? existing.tags,
  })
  return NextResponse.json(updated)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const existing = getNote(Number(id))
  if (!existing) {
    return NextResponse.json({ error: 'Note not found' }, { status: 404 })
  }
  deleteNote(Number(id))
  return NextResponse.json({ success: true })
}
```

**Step 3: Manually test API with curl**

Start dev server, then test:
```bash
# Create a note
curl -X POST http://localhost:3000/api/notes -H "Content-Type: application/json" -d '{"title":"Test","content":"Hello world","tags":["test"]}'

# Get all notes
curl http://localhost:3000/api/notes

# Search
curl "http://localhost:3000/api/notes?q=test"
```

Expected: JSON responses with note data.

**Step 4: Commit**

```bash
cd /Users/kenlinguo/Desktop/ai_playgroud/knowledge-base-app
git add src/app/api/notes/
git commit -m "feat: add notes REST API routes"
```

---

## Task 4: Text Chunking Utility

**Files:**
- Create: `src/lib/chunker.ts`
- Test: `src/lib/__tests__/chunker.test.ts`

**Step 1: Write failing tests for text chunking**

Create `src/lib/__tests__/chunker.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { chunkText } from '../chunker'

describe('chunkText', () => {
  it('should return a single chunk for short text', () => {
    const chunks = chunkText('Short text.')
    expect(chunks).toHaveLength(1)
    expect(chunks[0]).toBe('Short text.')
  })

  it('should split long text into multiple chunks by paragraphs', () => {
    const paragraphs = Array.from({ length: 20 }, (_, i) => `Paragraph ${i}. `.repeat(50))
    const text = paragraphs.join('\n\n')
    const chunks = chunkText(text, { maxChunkSize: 500 })
    expect(chunks.length).toBeGreaterThan(1)
    chunks.forEach(chunk => {
      expect(chunk.length).toBeLessThanOrEqual(600) // some tolerance for not splitting mid-paragraph
    })
  })

  it('should not produce empty chunks', () => {
    const text = 'Hello\n\n\n\nWorld\n\n\n\nFoo'
    const chunks = chunkText(text)
    chunks.forEach(chunk => {
      expect(chunk.trim().length).toBeGreaterThan(0)
    })
  })

  it('should handle markdown headers as split points', () => {
    const text = '# Section 1\nContent 1\n\n# Section 2\nContent 2'
    const chunks = chunkText(text, { maxChunkSize: 30 })
    expect(chunks.length).toBeGreaterThanOrEqual(2)
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `cd /Users/kenlinguo/Desktop/ai_playgroud/knowledge-base-app && npx vitest run src/lib/__tests__/chunker.test.ts`

Expected: FAIL — module `../chunker` not found.

**Step 3: Implement the chunker**

Create `src/lib/chunker.ts`:
```typescript
interface ChunkOptions {
  maxChunkSize?: number // in characters
  overlap?: number
}

export function chunkText(text: string, options: ChunkOptions = {}): string[] {
  const { maxChunkSize = 1000, overlap = 100 } = options

  if (text.length <= maxChunkSize) {
    return [text]
  }

  // Split by double newlines (paragraphs) or markdown headers
  const sections = text.split(/\n(?=# |\n)/).filter(s => s.trim().length > 0)

  const chunks: string[] = []
  let currentChunk = ''

  for (const section of sections) {
    const trimmed = section.trim()
    if (!trimmed) continue

    if (currentChunk.length + trimmed.length + 1 <= maxChunkSize) {
      currentChunk = currentChunk ? currentChunk + '\n' + trimmed : trimmed
    } else {
      if (currentChunk) {
        chunks.push(currentChunk)
      }
      // If a single section is longer than maxChunkSize, split it further
      if (trimmed.length > maxChunkSize) {
        const sentences = trimmed.split(/(?<=[.!?])\s+/)
        let subChunk = ''
        for (const sentence of sentences) {
          if (subChunk.length + sentence.length + 1 <= maxChunkSize) {
            subChunk = subChunk ? subChunk + ' ' + sentence : sentence
          } else {
            if (subChunk) chunks.push(subChunk)
            subChunk = sentence
          }
        }
        if (subChunk) currentChunk = subChunk
      } else {
        currentChunk = trimmed
      }
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk)
  }

  return chunks
}
```

**Step 4: Run tests to verify they pass**

Run: `cd /Users/kenlinguo/Desktop/ai_playgroud/knowledge-base-app && npx vitest run src/lib/__tests__/chunker.test.ts`

Expected: All 4 tests PASS.

**Step 5: Commit**

```bash
cd /Users/kenlinguo/Desktop/ai_playgroud/knowledge-base-app
git add src/lib/chunker.ts src/lib/__tests__/chunker.test.ts
git commit -m "feat: add text chunking utility for RAG pipeline"
```

---

## Task 5: Embedding and Vector Search

**Files:**
- Create: `src/lib/embedding.ts`
- Create: `src/lib/rag.ts`
- Test: `src/lib/__tests__/rag.test.ts`

**Step 1: Implement embedding module**

Create `src/lib/embedding.ts`:
```typescript
import OpenAI from 'openai'

let client: OpenAI | null = null

function getClient(): OpenAI {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) throw new Error('OPENAI_API_KEY environment variable is required')
    client = new OpenAI({ apiKey })
  }
  return client
}

export async function getEmbedding(text: string): Promise<number[]> {
  const openai = getClient()
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  })
  return response.data[0].embedding
}

export async function getEmbeddings(texts: string[]): Promise<number[][]> {
  const openai = getClient()
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: texts,
  })
  return response.data.map(d => d.embedding)
}
```

**Step 2: Write failing tests for RAG search (using cosine similarity)**

Create `src/lib/__tests__/rag.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { cosineSimilarity } from '../rag'

describe('cosineSimilarity', () => {
  it('should return 1 for identical vectors', () => {
    const v = [1, 0, 0]
    expect(cosineSimilarity(v, v)).toBeCloseTo(1, 5)
  })

  it('should return 0 for orthogonal vectors', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0, 5)
  })

  it('should return -1 for opposite vectors', () => {
    expect(cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1, 5)
  })
})
```

**Step 3: Run tests to verify they fail**

Run: `cd /Users/kenlinguo/Desktop/ai_playgroud/knowledge-base-app && npx vitest run src/lib/__tests__/rag.test.ts`

Expected: FAIL — module `../rag` not found.

**Step 4: Implement RAG module**

Create `src/lib/rag.ts`:
```typescript
import { getDb } from './db'
import { getEmbedding, getEmbeddings } from './embedding'
import { chunkText } from './chunker'

export function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

interface ChunkRow {
  id: number
  note_id: number
  chunk_text: string
  embedding: Buffer
}

export async function indexNote(noteId: number, content: string): Promise<void> {
  const db = getDb()

  // Delete existing chunks for this note
  db.prepare('DELETE FROM note_chunks WHERE note_id = ?').run(noteId)

  // Chunk the content
  const chunks = chunkText(content)
  if (chunks.length === 0) return

  // Get embeddings for all chunks
  const embeddings = await getEmbeddings(chunks)

  // Store chunks with embeddings
  const stmt = db.prepare('INSERT INTO note_chunks (note_id, chunk_text, embedding) VALUES (?, ?, ?)')
  const insertMany = db.transaction((items: { noteId: number; text: string; embedding: number[] }[]) => {
    for (const item of items) {
      const buffer = Buffer.from(new Float64Array(item.embedding).buffer)
      stmt.run(item.noteId, item.text, buffer)
    }
  })

  insertMany(chunks.map((text, i) => ({ noteId, text, embedding: embeddings[i] })))
}

export interface SearchResult {
  noteId: number
  chunkText: string
  similarity: number
}

export async function searchSimilar(query: string, topK: number = 5): Promise<SearchResult[]> {
  const db = getDb()
  const queryEmbedding = await getEmbedding(query)

  // Get all chunks with embeddings
  const rows = db.prepare('SELECT * FROM note_chunks WHERE embedding IS NOT NULL').all() as ChunkRow[]

  // Calculate cosine similarity for each
  const results: SearchResult[] = rows.map(row => {
    const embedding = Array.from(new Float64Array(row.embedding.buffer, row.embedding.byteOffset, row.embedding.byteLength / 8))
    return {
      noteId: row.note_id,
      chunkText: row.chunk_text,
      similarity: cosineSimilarity(queryEmbedding, embedding),
    }
  })

  // Sort by similarity descending and return top K
  return results.sort((a, b) => b.similarity - a.similarity).slice(0, topK)
}
```

**Step 5: Run tests to verify they pass**

Run: `cd /Users/kenlinguo/Desktop/ai_playgroud/knowledge-base-app && npx vitest run src/lib/__tests__/rag.test.ts`

Expected: All 3 tests PASS.

**Step 6: Commit**

```bash
cd /Users/kenlinguo/Desktop/ai_playgroud/knowledge-base-app
git add src/lib/embedding.ts src/lib/rag.ts src/lib/__tests__/rag.test.ts
git commit -m "feat: add embedding and vector search for RAG pipeline"
```

---

## Task 6: Claude AI Chat Integration

**Files:**
- Create: `src/lib/claude.ts`
- Create: `src/app/api/chat/route.ts`

**Step 1: Implement Claude API wrapper**

Create `src/lib/claude.ts`:
```typescript
import Anthropic from '@anthropic-ai/sdk'

let client: Anthropic | null = null

function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY environment variable is required')
    client = new Anthropic({ apiKey })
  }
  return client
}

interface ChatContext {
  chunkText: string
  noteId: number
}

export async function* streamAnswer(question: string, contexts: ChatContext[]): AsyncGenerator<string> {
  const anthropic = getClient()

  const contextText = contexts
    .map((ctx, i) => `[Source ${i + 1}, Note #${ctx.noteId}]\n${ctx.chunkText}`)
    .join('\n\n---\n\n')

  const systemPrompt = `You are a helpful assistant that answers questions based on the user's personal knowledge base.
Use the provided context to answer questions accurately.
Always cite your sources using [Source N] notation.
If the context doesn't contain enough information to answer, say so honestly.
Answer in the same language as the question.`

  const userMessage = contexts.length > 0
    ? `Context from knowledge base:\n\n${contextText}\n\n---\n\nQuestion: ${question}`
    : `Question: ${question}\n\n(No relevant context found in knowledge base. Please answer based on your general knowledge and note that no matching notes were found.)`

  const stream = anthropic.messages.stream({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  })

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      yield event.delta.text
    }
  }
}
```

**Step 2: Implement chat API route with streaming**

Create `src/app/api/chat/route.ts`:
```typescript
import { NextRequest } from 'next/server'
import { searchSimilar } from '@/lib/rag'
import { streamAnswer } from '@/lib/claude'
import { getNote } from '@/lib/db'

export async function POST(request: NextRequest) {
  const { question } = await request.json()

  if (!question) {
    return new Response(JSON.stringify({ error: 'Question is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Search for relevant chunks
  const results = await searchSimilar(question, 5)

  // Build sources metadata
  const sources = results.map(r => {
    const note = getNote(r.noteId)
    return {
      noteId: r.noteId,
      noteTitle: note?.title || 'Unknown',
      chunkText: r.chunkText,
      similarity: r.similarity,
    }
  })

  // Stream the response
  const encoder = new TextEncoder()
  const readableStream = new ReadableStream({
    async start(controller) {
      // First, send sources as a JSON line
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'sources', sources })}\n\n`))

      // Then stream the answer
      try {
        for await (const chunk of streamAnswer(question, results)) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', text: chunk })}\n\n`))
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`))
      } catch (error) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: String(error) })}\n\n`))
      }
      controller.close()
    },
  })

  return new Response(readableStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
```

**Step 3: Commit**

```bash
cd /Users/kenlinguo/Desktop/ai_playgroud/knowledge-base-app
git add src/lib/claude.ts src/app/api/chat/route.ts
git commit -m "feat: add Claude AI chat with streaming SSE response"
```

---

## Task 7: Embed API Route (Index Notes)

**Files:**
- Create: `src/app/api/notes/[id]/embed/route.ts`

**Step 1: Create embed route**

This route is called after a note is saved to index it for RAG search.

Create `src/app/api/notes/[id]/embed/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getNote } from '@/lib/db'
import { indexNote } from '@/lib/rag'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const note = getNote(Number(id))

  if (!note) {
    return NextResponse.json({ error: 'Note not found' }, { status: 404 })
  }

  await indexNote(note.id, note.content)
  return NextResponse.json({ success: true, noteId: note.id })
}
```

**Step 2: Commit**

```bash
cd /Users/kenlinguo/Desktop/ai_playgroud/knowledge-base-app
git add src/app/api/notes/[id]/embed/
git commit -m "feat: add embed API route for indexing notes"
```

---

## Task 8: Note List Sidebar Component

**Files:**
- Create: `src/components/NoteList.tsx`
- Create: `src/lib/hooks.ts`

**Step 1: Create custom hooks for notes state management**

Create `src/lib/hooks.ts`:
```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'

export interface Note {
  id: number
  title: string
  content: string
  tags: string[]
  created_at: string
  updated_at: string
}

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchNotes = useCallback(async (query?: string) => {
    setLoading(true)
    const url = query ? `/api/notes?q=${encodeURIComponent(query)}` : '/api/notes'
    const res = await fetch(url)
    const data = await res.json()
    setNotes(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchNotes(searchQuery || undefined)
  }, [fetchNotes, searchQuery])

  const createNote = async (): Promise<Note> => {
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Untitled', content: '', tags: [] }),
    })
    const note = await res.json()
    await fetchNotes()
    return note
  }

  const deleteNote = async (id: number) => {
    await fetch(`/api/notes/${id}`, { method: 'DELETE' })
    await fetchNotes()
  }

  return { notes, loading, searchQuery, setSearchQuery, fetchNotes, createNote, deleteNote }
}
```

**Step 2: Create NoteList component**

Create `src/components/NoteList.tsx`:
```tsx
'use client'

import { Note } from '@/lib/hooks'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Search } from 'lucide-react'

interface NoteListProps {
  notes: Note[]
  selectedId: number | null
  searchQuery: string
  onSearchChange: (query: string) => void
  onSelect: (note: Note) => void
  onCreate: () => void
  onDelete: (id: number) => void
}

export function NoteList({
  notes,
  selectedId,
  searchQuery,
  onSearchChange,
  onSelect,
  onCreate,
  onDelete,
}: NoteListProps) {
  return (
    <div className="flex flex-col h-full border-r">
      <div className="p-3 border-b space-y-2">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button onClick={onCreate} variant="outline" className="w-full" size="sm">
          <Plus className="h-4 w-4 mr-1" /> New Note
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {notes.map((note) => (
            <div
              key={note.id}
              onClick={() => onSelect(note)}
              className={`p-3 rounded-lg cursor-pointer group hover:bg-accent transition-colors ${
                selectedId === note.id ? 'bg-accent' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-sm">{note.title || 'Untitled'}</p>
                  <p className="text-xs text-muted-foreground truncate mt-1">
                    {note.content.slice(0, 80) || 'Empty note'}
                  </p>
                  {note.tags.length > 0 && (
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {note.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 ml-1"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(note.id)
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
          {notes.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No notes yet. Create your first note!
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
```

**Step 3: Install lucide-react icons**

Run:
```bash
cd /Users/kenlinguo/Desktop/ai_playgroud/knowledge-base-app && npm install lucide-react
```

**Step 4: Commit**

```bash
cd /Users/kenlinguo/Desktop/ai_playgroud/knowledge-base-app
git add src/components/NoteList.tsx src/lib/hooks.ts package.json package-lock.json
git commit -m "feat: add NoteList sidebar component with search"
```

---

## Task 9: Markdown Editor Component

**Files:**
- Create: `src/components/Editor.tsx`

**Step 1: Install Tiptap editor**

Run:
```bash
cd /Users/kenlinguo/Desktop/ai_playgroud/knowledge-base-app
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-placeholder @tiptap/pm
```

**Step 2: Create Editor component**

Create `src/components/Editor.tsx`:
```tsx
'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect, useCallback, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Save, X, Plus } from 'lucide-react'

interface EditorProps {
  noteId: number | null
  title: string
  content: string
  tags: string[]
  onSave: (data: { title: string; content: string; tags: string[] }) => void
}

export function Editor({ noteId, title: initialTitle, content: initialContent, tags: initialTags, onSave }: EditorProps) {
  const [title, setTitle] = useState(initialTitle)
  const [tags, setTags] = useState<string[]>(initialTags)
  const [newTag, setNewTag] = useState('')
  const [hasChanges, setHasChanges] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Start writing your note...' }),
    ],
    content: initialContent,
    onUpdate: () => setHasChanges(true),
  })

  // Reset editor when note changes
  useEffect(() => {
    setTitle(initialTitle)
    setTags(initialTags)
    setHasChanges(false)
    if (editor && initialContent !== editor.getHTML()) {
      editor.commands.setContent(initialContent)
    }
  }, [noteId, initialTitle, initialContent, initialTags, editor])

  const handleSave = useCallback(() => {
    if (!editor) return
    onSave({ title, content: editor.getHTML(), tags })
    setHasChanges(false)
  }, [editor, title, tags, onSave])

  // Ctrl+S / Cmd+S to save
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleSave])

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag('')
      setHasChanges(true)
    }
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
    setHasChanges(true)
  }

  if (noteId === null) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <p>Select a note or create a new one</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Title */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <Input
            value={title}
            onChange={(e) => { setTitle(e.target.value); setHasChanges(true) }}
            placeholder="Note title"
            className="text-lg font-semibold border-none shadow-none focus-visible:ring-0 px-0"
          />
          {hasChanges && (
            <Button onClick={handleSave} size="sm" variant="default">
              <Save className="h-4 w-4 mr-1" /> Save
            </Button>
          )}
        </div>
        {/* Tags */}
        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          {tags.map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
              <button onClick={() => removeTag(tag)} className="ml-1 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <div className="flex items-center gap-1">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTag()}
              placeholder="Add tag"
              className="h-6 w-20 text-xs"
            />
            <Button onClick={addTag} size="sm" variant="ghost" className="h-6 w-6 p-0">
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
      {/* Editor */}
      <div className="flex-1 overflow-auto p-4">
        <EditorContent editor={editor} className="prose prose-sm dark:prose-invert max-w-none min-h-full" />
      </div>
    </div>
  )
}
```

**Step 3: Commit**

```bash
cd /Users/kenlinguo/Desktop/ai_playgroud/knowledge-base-app
git add src/components/Editor.tsx package.json package-lock.json
git commit -m "feat: add Tiptap markdown editor component"
```

---

## Task 10: AI Chat Panel Component

**Files:**
- Create: `src/components/ChatPanel.tsx`

**Step 1: Create ChatPanel component**

Create `src/components/ChatPanel.tsx`:
```tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card } from '@/components/ui/card'
import { Send, Bot, User, FileText, X } from 'lucide-react'

interface Source {
  noteId: number
  noteTitle: string
  chunkText: string
  similarity: number
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  sources?: Source[]
}

interface ChatPanelProps {
  open: boolean
  onClose: () => void
  onNavigateToNote: (noteId: number) => void
}

export function ChatPanel({ open, onClose, onNavigateToNote }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return

    const question = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: question }])
    setIsLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      })

      const reader = res.body?.getReader()
      if (!reader) return

      let assistantContent = ''
      let sources: Source[] = []

      setMessages(prev => [...prev, { role: 'assistant', content: '', sources: [] }])

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = JSON.parse(line.slice(6))

          if (data.type === 'sources') {
            sources = data.sources
          } else if (data.type === 'text') {
            assistantContent += data.text
            setMessages(prev => {
              const updated = [...prev]
              updated[updated.length - 1] = {
                role: 'assistant',
                content: assistantContent,
                sources,
              }
              return updated
            })
          }
        }
      }
    } catch (error) {
      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: 'assistant', content: `Error: ${error}` },
      ])
    }

    setIsLoading(false)
  }

  if (!open) return null

  return (
    <div className="flex flex-col h-full border-l w-[400px]">
      <div className="p-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          <h3 className="font-semibold text-sm">AI Assistant</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Ask a question about your notes!
            </p>
          )}
          {messages.map((msg, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-start gap-2">
                {msg.role === 'user' ? (
                  <User className="h-4 w-4 mt-1 shrink-0" />
                ) : (
                  <Bot className="h-4 w-4 mt-1 shrink-0" />
                )}
                <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
              </div>
              {msg.sources && msg.sources.length > 0 && (
                <div className="ml-6 space-y-1.5">
                  <p className="text-xs text-muted-foreground font-medium">Sources:</p>
                  {msg.sources.map((src, j) => (
                    <Card
                      key={j}
                      className="p-2 cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => onNavigateToNote(src.noteId)}
                    >
                      <div className="flex items-center gap-1.5">
                        <FileText className="h-3 w-3 shrink-0" />
                        <span className="text-xs font-medium truncate">{src.noteTitle}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {src.chunkText.slice(0, 100)}...
                      </p>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Bot className="h-4 w-4 animate-pulse" />
              Thinking...
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-3 border-t">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Ask about your notes..."
            disabled={isLoading}
          />
          <Button onClick={handleSubmit} disabled={isLoading} size="sm">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
cd /Users/kenlinguo/Desktop/ai_playgroud/knowledge-base-app
git add src/components/ChatPanel.tsx
git commit -m "feat: add AI chat panel with streaming and source citations"
```

---

## Task 11: Main Page Assembly

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/layout.tsx`

**Step 1: Update layout with dark mode support**

Modify `src/app/layout.tsx` — add `suppressHydrationWarning` and ensure basic layout:
```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Knowledge Base',
  description: 'Personal knowledge base with AI-powered Q&A',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} h-screen overflow-hidden`}>
        {children}
      </body>
    </html>
  )
}
```

**Step 2: Build the main page**

Replace `src/app/page.tsx`:
```tsx
'use client'

import { useState, useCallback } from 'react'
import { NoteList } from '@/components/NoteList'
import { Editor } from '@/components/Editor'
import { ChatPanel } from '@/components/ChatPanel'
import { useNotes, Note } from '@/lib/hooks'
import { Button } from '@/components/ui/button'
import { MessageSquare } from 'lucide-react'

export default function Home() {
  const { notes, searchQuery, setSearchQuery, fetchNotes, createNote, deleteNote } = useNotes()
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [chatOpen, setChatOpen] = useState(false)

  const handleSelect = (note: Note) => {
    setSelectedNote(note)
  }

  const handleCreate = async () => {
    const note = await createNote()
    setSelectedNote(note)
  }

  const handleDelete = async (id: number) => {
    await deleteNote(id)
    if (selectedNote?.id === id) {
      setSelectedNote(null)
    }
  }

  const handleSave = useCallback(async (data: { title: string; content: string; tags: string[] }) => {
    if (!selectedNote) return

    const res = await fetch(`/api/notes/${selectedNote.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const updated = await res.json()
    setSelectedNote(updated)
    await fetchNotes()

    // Index note for RAG search (fire and forget)
    fetch(`/api/notes/${selectedNote.id}/embed`, { method: 'POST' })
  }, [selectedNote, fetchNotes])

  const handleNavigateToNote = (noteId: number) => {
    const note = notes.find(n => n.id === noteId)
    if (note) setSelectedNote(note)
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar - Note List */}
      <div className="w-64 shrink-0">
        <NoteList
          notes={notes}
          selectedId={selectedNote?.id ?? null}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelect={handleSelect}
          onCreate={handleCreate}
          onDelete={handleDelete}
        />
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="border-b p-2 flex justify-between items-center">
          <h1 className="text-sm font-semibold px-2">Knowledge Base</h1>
          <Button
            variant={chatOpen ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChatOpen(!chatOpen)}
          >
            <MessageSquare className="h-4 w-4 mr-1" /> AI Chat
          </Button>
        </div>
        <div className="flex-1 flex overflow-hidden">
          <Editor
            noteId={selectedNote?.id ?? null}
            title={selectedNote?.title ?? ''}
            content={selectedNote?.content ?? ''}
            tags={selectedNote?.tags ?? []}
            onSave={handleSave}
          />
        </div>
      </div>

      {/* AI Chat Panel */}
      <ChatPanel
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        onNavigateToNote={handleNavigateToNote}
      />
    </div>
  )
}
```

**Step 3: Verify the app runs**

Run:
```bash
cd /Users/kenlinguo/Desktop/ai_playgroud/knowledge-base-app && npm run dev
```

Open http://localhost:3000 — you should see the three-panel layout.

**Step 4: Commit**

```bash
cd /Users/kenlinguo/Desktop/ai_playgroud/knowledge-base-app
git add src/app/page.tsx src/app/layout.tsx
git commit -m "feat: assemble main page with three-panel layout"
```

---

## Task 12: Settings Page (API Keys)

**Files:**
- Create: `src/app/settings/page.tsx`

**Step 1: Create settings page**

Create `src/app/settings/page.tsx`:
```tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Save, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

export default function SettingsPage() {
  const [anthropicKey, setAnthropicKey] = useState('')
  const [openaiKey, setOpenaiKey] = useState('')
  const [showAnthropic, setShowAnthropic] = useState(false)
  const [showOpenai, setShowOpenai] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    // Load keys from localStorage
    setAnthropicKey(localStorage.getItem('ANTHROPIC_API_KEY') || '')
    setOpenaiKey(localStorage.getItem('OPENAI_API_KEY') || '')
  }, [])

  const handleSave = () => {
    localStorage.setItem('ANTHROPIC_API_KEY', anthropicKey)
    localStorage.setItem('OPENAI_API_KEY', openaiKey)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <div className="space-y-6">
        <Card className="p-6">
          <h2 className="font-semibold mb-4">API Keys</h2>
          <p className="text-sm text-muted-foreground mb-4">
            API keys are stored locally in your browser. They are sent to the server only for API calls and never persisted on disk.
          </p>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Anthropic API Key (Claude)</label>
              <div className="flex gap-2 mt-1">
                <Input
                  type={showAnthropic ? 'text' : 'password'}
                  value={anthropicKey}
                  onChange={(e) => setAnthropicKey(e.target.value)}
                  placeholder="sk-ant-..."
                />
                <Button variant="ghost" size="sm" onClick={() => setShowAnthropic(!showAnthropic)}>
                  {showAnthropic ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">OpenAI API Key (Embeddings)</label>
              <div className="flex gap-2 mt-1">
                <Input
                  type={showOpenai ? 'text' : 'password'}
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder="sk-..."
                />
                <Button variant="ghost" size="sm" onClick={() => setShowOpenai(!showOpenai)}>
                  {showOpenai ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          <Button onClick={handleSave} className="mt-4">
            <Save className="h-4 w-4 mr-1" /> Save Keys
          </Button>
          {saved && <span className="text-sm text-green-600 ml-3">Saved!</span>}
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold mb-2">About</h2>
          <p className="text-sm text-muted-foreground">
            Knowledge Base is a personal note-taking app with RAG-powered AI Q&A.
            Your notes are stored locally in SQLite. AI features require valid API keys.
          </p>
        </Card>
      </div>
    </div>
  )
}
```

**Step 2: Add settings link to main page header**

In `src/app/page.tsx`, add a settings icon/link next to the "Knowledge Base" title in the header bar. Import `Settings` from lucide-react and add:
```tsx
import { MessageSquare, Settings as SettingsIcon } from 'lucide-react'
import Link from 'next/link'

// In the header bar, add:
<Link href="/settings">
  <Button variant="ghost" size="sm">
    <SettingsIcon className="h-4 w-4" />
  </Button>
</Link>
```

**Step 3: Update API routes to accept API keys from request headers**

Modify `src/lib/claude.ts` and `src/lib/embedding.ts` to accept API keys passed via headers from the frontend (which reads them from localStorage). Add a header `x-anthropic-key` and `x-openai-key` to the API routes.

Update `src/app/api/chat/route.ts` to read `request.headers.get('x-anthropic-key')` and `request.headers.get('x-openai-key')` and set them as `process.env` before calling the functions. Alternatively, pass them directly to the client constructors.

**Step 4: Commit**

```bash
cd /Users/kenlinguo/Desktop/ai_playgroud/knowledge-base-app
git add src/app/settings/ src/app/page.tsx src/lib/claude.ts src/lib/embedding.ts src/app/api/chat/route.ts
git commit -m "feat: add settings page for API key management"
```

---

## Task 13: Environment Setup and .env

**Files:**
- Create: `.env.local.example`

**Step 1: Create env example file**

Create `.env.local.example`:
```
# Anthropic API Key for Claude AI
ANTHROPIC_API_KEY=sk-ant-...

# OpenAI API Key for Embeddings
OPENAI_API_KEY=sk-...
```

**Step 2: Add .env.local to .gitignore**

Ensure `.gitignore` includes:
```
.env.local
*.db
```

**Step 3: Commit**

```bash
cd /Users/kenlinguo/Desktop/ai_playgroud/knowledge-base-app
git add .env.local.example .gitignore
git commit -m "chore: add env example and update gitignore"
```

---

## Task 14: Dark/Light Theme Toggle

**Files:**
- Create: `src/components/ThemeToggle.tsx`
- Modify: `src/app/layout.tsx`

**Step 1: Install next-themes**

Run:
```bash
cd /Users/kenlinguo/Desktop/ai_playgroud/knowledge-base-app && npm install next-themes
```

**Step 2: Create ThemeProvider wrapper**

Create `src/components/ThemeProvider.tsx`:
```tsx
'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </NextThemesProvider>
  )
}
```

**Step 3: Create ThemeToggle component**

Create `src/components/ThemeToggle.tsx`:
```tsx
'use client'

import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Moon, Sun } from 'lucide-react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  )
}
```

**Step 4: Wrap layout with ThemeProvider**

Update `src/app/layout.tsx` to wrap children with `<ThemeProvider>`.

**Step 5: Add ThemeToggle to main page header**

Add `<ThemeToggle />` to the header bar in `src/app/page.tsx`.

**Step 6: Commit**

```bash
cd /Users/kenlinguo/Desktop/ai_playgroud/knowledge-base-app
git add src/components/ThemeProvider.tsx src/components/ThemeToggle.tsx src/app/layout.tsx src/app/page.tsx package.json package-lock.json
git commit -m "feat: add dark/light theme toggle"
```

---

## Task 15: Final Integration Testing and Polish

**Step 1: Run all tests**

Run:
```bash
cd /Users/kenlinguo/Desktop/ai_playgroud/knowledge-base-app && npx vitest run
```

Expected: All tests pass.

**Step 2: Start the dev server and verify end-to-end**

Run:
```bash
cd /Users/kenlinguo/Desktop/ai_playgroud/knowledge-base-app && npm run dev
```

Manual test checklist:
- [ ] Create a new note
- [ ] Edit note title, content, and tags
- [ ] Save note (Cmd+S)
- [ ] Delete a note
- [ ] Search notes
- [ ] Open AI chat panel
- [ ] Ask a question (requires API keys configured)
- [ ] Click source citation to navigate to note
- [ ] Toggle dark/light theme
- [ ] Settings page — save and load API keys

**Step 3: Fix any issues found during testing**

**Step 4: Final commit**

```bash
cd /Users/kenlinguo/Desktop/ai_playgroud/knowledge-base-app
git add .
git commit -m "chore: final polish and integration verification"
```
