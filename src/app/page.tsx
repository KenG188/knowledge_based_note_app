'use client'

import { useState, useCallback } from 'react'
import { MessageSquare, Settings } from 'lucide-react'
import Link from 'next/link'
import type { Note } from '@/lib/db'
import { useNotes } from '@/lib/hooks'
import { NoteList } from '@/components/NoteList'
import { Editor } from '@/components/Editor'
import { ChatPanel } from '@/components/ChatPanel'
import { Button } from '@/components/ui/button'

export default function Home() {
  const { notes, searchQuery, setSearchQuery, createNote, deleteNote } = useNotes()
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [showChat, setShowChat] = useState(false)

  const handleNewNote = useCallback(async () => {
    const note = await createNote()
    if (note) setSelectedNote(note)
  }, [createNote])

  const handleSelectNote = useCallback((note: Note) => {
    setSelectedNote(note)
  }, [])

  const handleDeleteNote = useCallback(async (id: number) => {
    await deleteNote(id)
    if (selectedNote?.id === id) setSelectedNote(null)
  }, [deleteNote, selectedNote])

  const handleSelectNoteById = useCallback((noteId: number) => {
    const note = notes.find((n) => n.id === noteId)
    if (note) setSelectedNote(note)
  }, [notes])

  const handleSave = useCallback(async (data: { title: string; content: string; tags: string[] }) => {
    if (!selectedNote) return
    try {
      await fetch(`/api/notes/${selectedNote.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      // Fire-and-forget embed (don't block save UX)
      const openaiKey = typeof window !== 'undefined' ? localStorage.getItem('openai_api_key') : null
      fetch(`/api/notes/${selectedNote.id}/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: openaiKey ?? undefined }),
      }).catch(() => {/* ignore embed errors */})

      // Update local note state
      setSelectedNote((prev) => prev ? { ...prev, ...data } : prev)
    } catch (err) {
      console.error('Failed to save note:', err)
    }
  }, [selectedNote])

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
        <h1 className="text-base font-semibold">Knowledge Base</h1>
        <div className="flex items-center gap-2">
          <Button
            size="icon-sm"
            variant={showChat ? 'default' : 'ghost'}
            onClick={() => setShowChat((v) => !v)}
            title="Toggle AI Chat"
          >
            <MessageSquare className="size-4" />
          </Button>
          <Link href="/settings">
            <Button size="icon-sm" variant="ghost" title="Settings">
              <Settings className="size-4" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Three-panel layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Note list sidebar (~280px) */}
        <div className="w-[280px] shrink-0 overflow-hidden">
          <NoteList
            notes={notes}
            selectedNoteId={selectedNote?.id ?? null}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSelectNote={handleSelectNote}
            onNewNote={handleNewNote}
            onDeleteNote={handleDeleteNote}
          />
        </div>

        {/* Center: Editor */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <Editor note={selectedNote} onSave={handleSave} />
        </div>

        {/* Right: AI Chat panel (toggleable) */}
        {showChat && (
          <div className="w-[360px] shrink-0 overflow-hidden">
            <ChatPanel onSelectNote={handleSelectNoteById} />
          </div>
        )}
      </div>
    </div>
  )
}
