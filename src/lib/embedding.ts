import OpenAI from 'openai'

function getClient(apiKey?: string): OpenAI {
  return new OpenAI({ apiKey: apiKey || process.env.OPENAI_API_KEY })
}

export async function getEmbedding(text: string, apiKey?: string): Promise<number[]> {
  const client = getClient(apiKey)
  const response = await client.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  })
  return response.data[0].embedding
}

export async function getEmbeddings(texts: string[], apiKey?: string): Promise<number[][]> {
  const client = getClient(apiKey)
  const response = await client.embeddings.create({
    model: 'text-embedding-3-small',
    input: texts,
  })
  return response.data.map((item) => item.embedding)
}
