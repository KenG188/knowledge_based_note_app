'use client'

import { Plus, Trash2, Search } from 'lucide-react'
import type { Note } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface NoteListProps {
  notes: Note[]
  selectedNoteId: number | null
  searchQuery: string
  onSearchChange: (q: string) => void
  onSelectNote: (note: Note) => void
  onNewNote: () => void
  onDeleteNote: (id: number) => void
}

export function NoteList({
  notes,
  selectedNoteId,
  searchQuery,
  onSearchChange,
  onSelectNote,
  onNewNote,
  onDeleteNote,
}: NoteListProps) {
  return (
    <div className="flex flex-col h-full border-r border-border bg-muted/30">
      {/* Header */}
      <div className="p-3 border-b border-border space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm flex-1">Notes</span>
          <Button size="icon-sm" variant="ghost" onClick={onNewNote} title="New Note">
            <Plus />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-7"
          />
        </div>
      </div>

      {/* Note list */}
      <div className="flex-1 overflow-y-auto">
        {notes.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            {searchQuery ? 'No notes match your search.' : 'No notes yet. Create one!'}
          </div>
        ) : (
          <ul>
            {notes.map((note) => (
              <li
                key={note.id}
                className={`group relative cursor-pointer border-b border-border px-3 py-2 hover:bg-muted/60 transition-colors ${
                  selectedNoteId === note.id ? 'bg-muted' : ''
                }`}
                onClick={() => onSelectNote(note)}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{note.title || 'Untitled'}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(note.updated_at).toLocaleDateString()}
                    </p>
                    {note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {note.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} className="text-[10px] px-1 py-0">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteNote(note.id)
                    }}
                    title="Delete note"
                  >
                    <Trash2 />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
