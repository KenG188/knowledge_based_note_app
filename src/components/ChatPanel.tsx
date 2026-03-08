'use client'

import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { Send, Loader2, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Source {
  noteId: number
  noteTitle: string
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  sources?: Source[]
}

interface ChatPanelProps {
  onSelectNote?: (noteId: number) => void
}

export function ChatPanel({ onSelectNote }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    const question = input.trim()
    if (!question || isLoading) return

    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: question }])
    setIsLoading(true)

    // Add placeholder assistant message for streaming
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

    try {
      const anthropicKey = typeof window !== 'undefined' ? localStorage.getItem('anthropic_api_key') : null
      const openaiKey = typeof window !== 'undefined' ? localStorage.getItem('openai_api_key') : null

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          apiKey: anthropicKey ?? undefined,
          openaiApiKey: openaiKey ?? undefined,
        }),
      })

      if (!response.ok || !response.body) {
        throw new Error(`Server error: ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const jsonStr = line.slice(6).trim()
          if (!jsonStr) continue

          try {
            const event = JSON.parse(jsonStr)
            if (event.type === 'text') {
              setMessages((prev) => {
                const updated = [...prev]
                const last = updated[updated.length - 1]
                if (last.role === 'assistant') {
                  updated[updated.length - 1] = { ...last, content: last.content + event.content }
                }
                return updated
              })
            } else if (event.type === 'sources') {
              setMessages((prev) => {
                const updated = [...prev]
                const last = updated[updated.length - 1]
                if (last.role === 'assistant') {
                  updated[updated.length - 1] = { ...last, sources: event.sources }
                }
                return updated
              })
            }
          } catch {
            // ignore malformed JSON
          }
        }
      }
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev]
        const last = updated[updated.length - 1]
        if (last.role === 'assistant' && last.content === '') {
          updated[updated.length - 1] = {
            ...last,
            content: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
          }
        }
        return updated
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full border-l border-border bg-background">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold">AI Chat</h2>
        <p className="text-xs text-muted-foreground">Ask questions about your notes</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-sm text-muted-foreground mt-8">
            Ask a question to search your knowledge base.
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground'
              }`}
            >
              {msg.role === 'assistant' && msg.content === '' && isLoading ? (
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              ) : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}

              {/* Sources */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-2 pt-2 border-t border-border/50 space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">Sources:</p>
                  {msg.sources.map((source) => (
                    <button
                      key={source.noteId}
                      onClick={() => onSelectNote?.(source.noteId)}
                      className="flex items-center gap-1.5 text-xs text-primary hover:underline w-full text-left"
                    >
                      <FileText className="size-3 shrink-0" />
                      <span className="truncate">{source.noteTitle}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your notes..."
          disabled={isLoading}
          className="flex-1"
        />
        <Button size="icon-sm" onClick={sendMessage} disabled={isLoading || !input.trim()}>
          {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        </Button>
      </div>
    </div>
  )
}
