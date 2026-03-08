import { getDb, getNote } from './db'
import { chunkText } from './chunker'
import { getEmbedding, getEmbeddings } from './embedding'

export interface ChunkResult {
  noteId: number
  noteTitle: string
  chunkText: string
  similarity: number
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) throw new Error('Vectors must have the same length')
  let dot = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB)
  if (denom === 0) return 0
  return dot / denom
}

export async function indexNote(noteId: number, apiKey?: string): Promise<number> {
  const note = getNote(noteId)
  if (!note) throw new Error(`Note ${noteId} not found`)

  const chunks = chunkText(note.content)
  const embeddings = await getEmbeddings(chunks, apiKey)

  const db = getDb()
  // Remove old chunks for this note
  db.prepare('DELETE FROM note_chunks WHERE note_id = ?').run(noteId)

  const insert = db.prepare('INSERT INTO note_chunks (note_id, chunk_text, embedding) VALUES (?, ?, ?)')
  for (let i = 0; i < chunks.length; i++) {
    const floatArray = new Float64Array(embeddings[i])
    const buffer = Buffer.from(floatArray.buffer)
    insert.run(noteId, chunks[i], buffer)
  }

  return chunks.length
}

interface ChunkRow {
  id: number
  note_id: number
  chunk_text: string
  embedding: Buffer | null
}

interface NoteRow {
  id: number
  title: string
}

export async function searchSimilar(
  query: string,
  topK: number = 5,
  apiKey?: string
): Promise<ChunkResult[]> {
  const queryEmbedding = await getEmbedding(query, apiKey)
  const db = getDb()

  const rows = db.prepare(`
    SELECT nc.id, nc.note_id, nc.chunk_text, nc.embedding, n.title
    FROM note_chunks nc
    JOIN notes n ON n.id = nc.note_id
    WHERE nc.embedding IS NOT NULL
  `).all() as (ChunkRow & { title: string })[]

  const scored: ChunkResult[] = []
  for (const row of rows) {
    if (!row.embedding) continue
    const floatArray = new Float64Array(row.embedding.buffer, row.embedding.byteOffset, row.embedding.byteLength / 8)
    const vec = Array.from(floatArray)
    const similarity = cosineSimilarity(queryEmbedding, vec)
    scored.push({
      noteId: row.note_id,
      noteTitle: row.title,
      chunkText: row.chunk_text,
      similarity,
    })
  }

  scored.sort((a, b) => b.similarity - a.similarity)
  return scored.slice(0, topK)
}
