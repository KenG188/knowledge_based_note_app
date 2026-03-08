'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Note } from '@/lib/db'

export interface UseNotesReturn {
  notes: Note[]
  loading: boolean
  searchQuery: string
  setSearchQuery: (q: string) => void
  createNote: (title?: string) => Promise<Note | null>
  deleteNote: (id: number) => Promise<void>
  refreshNotes: () => Promise<void>
}

export function useNotes(): UseNotesReturn {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchNotes = useCallback(async (q?: string) => {
    setLoading(true)
    try {
      const url = q ? `/api/notes?q=${encodeURIComponent(q)}` : '/api/notes'
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setNotes(data)
      }
    } catch (err) {
      console.error('Failed to fetch notes:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounce search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchNotes(searchQuery || undefined)
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchQuery, fetchNotes])

  const refreshNotes = useCallback(() => fetchNotes(searchQuery || undefined), [fetchNotes, searchQuery])

  const createNote = useCallback(async (title = 'Untitled Note'): Promise<Note | null> => {
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content: '', tags: [] }),
      })
      if (res.ok) {
        const note = await res.json()
        await fetchNotes(searchQuery || undefined)
        return note
      }
    } catch (err) {
      console.error('Failed to create note:', err)
    }
    return null
  }, [fetchNotes, searchQuery])

  const deleteNote = useCallback(async (id: number): Promise<void> => {
    try {
      await fetch(`/api/notes/${id}`, { method: 'DELETE' })
      await fetchNotes(searchQuery || undefined)
    } catch (err) {
      console.error('Failed to delete note:', err)
    }
  }, [fetchNotes, searchQuery])

  return { notes, loading, searchQuery, setSearchQuery, createNote, deleteNote, refreshNotes }
}
