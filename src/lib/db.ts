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
let currentDbPath: string | null = null

export function getDb(): Database.Database {
  const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'data', 'knowledge.db')

  if (db && currentDbPath === dbPath) return db

  // Close existing connection if path changed
  if (db) {
    db.close()
    db = null
  }

  currentDbPath = dbPath
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

export function closeDb(): void {
  if (db) {
    db.close()
    db = null
    currentDbPath = null
  }
}

export function searchNotes(query: string): Note[] {
  const db = getDb()
  const pattern = `%${query}%`
  const rows = db.prepare('SELECT * FROM notes WHERE title LIKE ? OR content LIKE ? ORDER BY updated_at DESC')
    .all(pattern, pattern) as NoteRow[]
  return rows.map(rowToNote)
}
