import { NextRequest, NextResponse } from 'next/server'
import { getAllNotes, searchNotes, createNote } from '@/lib/db'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')
  const notes = q ? searchNotes(q) : getAllNotes()
  return NextResponse.json(notes)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { title, content, tags } = body
  const note = createNote({ title, content, tags: tags ?? [] })
  return NextResponse.json(note, { status: 201 })
}
