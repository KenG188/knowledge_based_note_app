'use client'

import { useState, useEffect } from 'react'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

function ApiKeyField({
  label,
  storageKey,
}: {
  label: string
  storageKey: string
}) {
  const [value, setValue] = useState('')
  const [show, setShow] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(storageKey)
    if (stored) setValue(stored)
  }, [storageKey])

  const handleSave = () => {
    localStorage.setItem(storageKey, value)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            type={show ? 'text' : 'password'}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={`Enter your ${label}`}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={show ? 'Hide key' : 'Show key'}
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        <Button onClick={handleSave} size="sm" variant={saved ? 'default' : 'outline'}>
          {saved ? 'Saved!' : 'Save'}
        </Button>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <Link href="/">
          <Button size="icon-sm" variant="ghost" title="Back">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <h1 className="text-base font-semibold">Settings</h1>
      </header>

      <main className="max-w-lg mx-auto p-6 space-y-8">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">API Keys</h2>
          <p className="text-sm text-muted-foreground">
            Keys are stored only in your browser&apos;s localStorage and sent directly to the API routes.
          </p>
        </div>

        <div className="space-y-6">
          <ApiKeyField label="Anthropic API Key" storageKey="anthropic_api_key" />
          <ApiKeyField label="OpenAI API Key" storageKey="openai_api_key" />
        </div>
      </main>
    </div>
  )
}
