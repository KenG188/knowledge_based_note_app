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
