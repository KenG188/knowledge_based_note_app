import { NextRequest, NextResponse } from 'next/server'
import { getNote } from '@/lib/db'
import { indexNote } from '@/lib/rag'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const note = getNote(Number(id))
  if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 })

  let apiKey: string | undefined
  try {
    const body = await request.json()
    apiKey = body.apiKey
  } catch {
    // No body or invalid JSON — apiKey stays undefined
  }

  try {
    const chunks = await indexNote(Number(id), apiKey)
    return NextResponse.json({ success: true, chunks })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Embedding failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
