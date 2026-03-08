import Anthropic from '@anthropic-ai/sdk'
import type { ChunkResult } from './rag'

export async function* streamAnswer(
  question: string,
  chunks: ChunkResult[],
  apiKey?: string
): AsyncGenerator<string> {
  const client = new Anthropic({ apiKey: apiKey ?? process.env.ANTHROPIC_API_KEY })

  const context = chunks
    .map((c, i) => `[Source ${i + 1}: ${c.noteTitle}]\n${c.chunkText}`)
    .join('\n\n---\n\n')

  const systemPrompt = context.length > 0
    ? `You are a helpful assistant answering questions based on the user's personal knowledge base.\n\nRelevant context from the knowledge base:\n\n${context}\n\nAnswer the user's question using the context above. If the context doesn't contain enough information, say so.`
    : `You are a helpful assistant. The knowledge base has no indexed notes yet. Answer the user's question as best you can.`

  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: question }],
    system: systemPrompt,
  })

  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta'
    ) {
      yield event.delta.text
    }
  }
}
