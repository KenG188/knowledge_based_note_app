import { describe, it, expect } from 'vitest';
import { chunkText } from '../chunker';

describe('chunkText', () => {
  it('returns short text as a single chunk', () => {
    const text = 'This is a short piece of text.';
    const chunks = chunkText(text);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toBe(text);
  });

  it('uses custom maxChunkSize option', () => {
    const text = 'Hello world. '.repeat(20); // ~260 chars
    const chunks = chunkText(text, { maxChunkSize: 50 });
    expect(chunks.length).toBeGreaterThan(1);
  });

  it('splits long text on paragraph boundaries', () => {
    const para1 = 'A'.repeat(200);
    const para2 = 'B'.repeat(200);
    const para3 = 'C'.repeat(200);
    const text = `${para1}\n\n${para2}\n\n${para3}`;
    const chunks = chunkText(text, { maxChunkSize: 300, overlap: 0 });
    expect(chunks.length).toBeGreaterThan(1);
    // Each chunk should not exceed maxChunkSize by much
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThan(600);
    }
  });

  it('produces no empty chunks', () => {
    const text = '\n\n'.repeat(5) + 'Some content' + '\n\n'.repeat(5);
    const chunks = chunkText(text, { maxChunkSize: 5 });
    for (const chunk of chunks) {
      expect(chunk.trim().length).toBeGreaterThan(0);
    }
  });
});
