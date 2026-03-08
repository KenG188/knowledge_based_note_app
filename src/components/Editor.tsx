'use client'

import { useEffect, useState, useCallback, KeyboardEvent } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { X } from 'lucide-react'
import type { Note } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface EditorProps {
  note: Note | null
  onSave: (note: { title: string; content: string; tags: string[] }) => void
}

export function Editor({ note, onSave }: EditorProps) {
  const [title, setTitle] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Start writing your note...' }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none outline-none min-h-[200px] px-1',
      },
    },
  })

  // Sync note into editor when selection changes
  useEffect(() => {
    if (!editor) return
    if (note) {
      setTitle(note.title)
      setTags(note.tags)
      editor.commands.setContent(note.content)
    } else {
      setTitle('')
      setTags([])
      editor.commands.setContent('')
    }
    setLastSaved(null)
  }, [note?.id, editor])

  const handleSave = useCallback(() => {
    if (!note || !editor) return
    onSave({ title, content: editor.getHTML(), tags })
    setLastSaved(new Date())
  }, [note, editor, title, tags, onSave])

  // Ctrl+S shortcut
  useEffect(() => {
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleSave])

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const trimmed = tagInput.trim()
      if (trimmed && !tags.includes(trimmed)) {
        setTags((prev) => [...prev, trimmed])
      }
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag))
  }

  if (!note) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground text-sm">
        Select a note or create a new one
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <span className="text-xs text-muted-foreground">
          {lastSaved ? `Last saved ${lastSaved.toLocaleTimeString()}` : 'Unsaved changes'}
        </span>
        <Button size="sm" variant="default" onClick={handleSave}>
          Save
        </Button>
      </div>

      {/* Title */}
      <div className="px-4 pt-4 pb-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note title"
          className="w-full text-2xl font-bold bg-transparent outline-none placeholder:text-muted-foreground"
        />
      </div>

      {/* Tags */}
      <div className="px-4 pb-3 flex flex-wrap items-center gap-1.5">
        {tags.map((tag) => (
          <Badge key={tag} className="flex items-center gap-1 pr-1">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:text-destructive transition-colors"
              aria-label={`Remove tag ${tag}`}
            >
              <X className="size-3" />
            </button>
          </Badge>
        ))}
        <Input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleTagKeyDown}
          placeholder="Add tag…"
          className="h-6 w-28 text-xs px-2"
        />
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
