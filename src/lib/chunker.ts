export interface ChunkOptions {
  maxChunkSize?: number;
  overlap?: number;
}

export function chunkText(text: string, options: ChunkOptions = {}): string[] {
  const maxChunkSize = options.maxChunkSize ?? 1000;
  const overlap = options.overlap ?? 100;

  if (text.length <= maxChunkSize) {
    return [text];
  }

  // Split on paragraph boundaries (double newlines) and markdown headers
  const rawParts = text.split(/\n(?=# |\n)/);
  const parts = rawParts.map(p => p.trim()).filter(p => p.length > 0);

  const chunks: string[] = [];
  let current = '';

  for (const segment of parts) {
    if (current.length === 0) {
      current = segment;
    } else if (current.length + segment.length + 2 <= maxChunkSize) {
      current += '\n\n' + segment;
    } else {
      if (current) chunks.push(current);
      // Start new chunk with overlap from end of previous chunk
      const overlapText = overlap > 0 ? current.slice(-overlap) : '';
      current = overlapText ? overlapText + '\n\n' + segment : segment;
    }
  }

  if (current) chunks.push(current);

  const result = chunks.filter(c => c.trim().length > 0);

  // If no splits happened (e.g. no paragraph breaks), force-split at maxChunkSize boundaries
  if (result.length === 1 && result[0].length > maxChunkSize) {
    return splitBySize(result[0], maxChunkSize, overlap);
  }

  return result;
}

function splitBySize(text: string, maxChunkSize: number, overlap: number): string[] {
  const chunks: string[] = [];
  // Ensure overlap is less than maxChunkSize to guarantee forward progress
  const effectiveOverlap = Math.min(overlap, maxChunkSize - 1);
  const step = maxChunkSize - effectiveOverlap;
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + maxChunkSize, text.length);
    chunks.push(text.slice(start, end));
    start += step;
  }
  return chunks.filter(c => c.trim().length > 0);
}
