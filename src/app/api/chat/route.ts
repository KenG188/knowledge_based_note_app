import { NextRequest, NextResponse } from 'next/server'
import { searchSimilar } from '@/lib/rag'
import { streamAnswer } from '@/lib/claude'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { question, apiKey, openaiApiKey } = body as {
      question?: string
      apiKey?: string
      openaiApiKey?: string
    }

    if (!question || typeof question !== 'string') {
      return NextResponse.json({ error: 'question is required' }, { status: 400 })
    }

    const chunks = await searchSimilar(question, 5, openaiApiKey)

    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const text of streamAnswer(question, chunks, apiKey)) {
            const payload = JSON.stringify({ type: 'text', content: text })
            controller.enqueue(encoder.encode(`data: ${payload}\n\n`))
          }

          const sources = chunks.map((c) => ({
            noteId: c.noteId,
            noteTitle: c.noteTitle,
          }))
          // Deduplicate sources by noteId
          const seenIds = new Set<number>()
          const uniqueSources = sources.filter((s) => {
            if (seenIds.has(s.noteId)) return false
            seenIds.add(s.noteId)
            return true
          })

          const sourcesPayload = JSON.stringify({ type: 'sources', sources: uniqueSources })
          controller.enqueue(encoder.encode(`data: ${sourcesPayload}\n\n`))
          controller.close()
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Stream error'
          const errorPayload = JSON.stringify({ type: 'error', message })
          controller.enqueue(encoder.encode(`data: ${errorPayload}\n\n`))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
