import { NextRequest, NextResponse } from 'next/server'
import { getNote, updateNote, deleteNote } from '@/lib/db'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const note = getNote(Number(id))
  if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 })
  return NextResponse.json(note)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const note = getNote(Number(id))
  if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 })
  const body = await request.json()
  const { title, content, tags } = body
  const updated = updateNote(Number(id), {
    title: title ?? note.title,
    content: content ?? note.content,
    tags: tags ?? note.tags,
  })
  return NextResponse.json(updated)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const note = getNote(Number(id))
  if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 })
  deleteNote(Number(id))
  return NextResponse.json({ success: true })
}
