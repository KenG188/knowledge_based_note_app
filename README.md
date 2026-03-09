# Knowledge Base — AI-Powered Note Taking App

A personal knowledge base where you write notes in Markdown and ask an AI questions about them. The AI reads your actual notes to answer — not the internet, not generic knowledge, just what you've written.

---

## What It Is

A local-first note taking app that combines a **Markdown editor** with a **RAG-powered AI chat**. All notes are stored in a SQLite database on your machine. The AI (Claude) answers questions by searching through your notes using vector embeddings, so answers are grounded in your own writing.

Think of it as a second brain you can have a conversation with.

---

## What It Does

**Note Management**
- Create, edit, and delete notes
- Add tags to organize notes
- Search notes by title or content (live, debounced)
- Notes auto-save with `Ctrl+S`

**Markdown Editor**
- Rich text editing powered by Tiptap
- Supports headings, bold, italic, lists, and more
- Title field separate from content

**AI Chat**
- Ask questions in natural language — "What did I write about React hooks?"
- Claude reads your notes and answers with context from them
- Responses stream in real-time, word by word
- Each answer links back to the source notes it used — click to jump directly to that note

**Theming**
- Light and dark mode toggle
- Follows system preference by default

---

## What It Looks Like

The app has a **three-panel layout**:

```
┌─────────────────┬──────────────────────────┬─────────────────┐
│   Notes List    │         Editor           │    AI Chat      │
│                 │                          │                 │
│  [+ New Note]   │  Note Title              │  AI Chat        │
│  [Search...]    │  ──────────────────────  │  Ask questions  │
│                 │  # Heading               │  about your     │
│  > My Note      │                          │  notes          │
│    2026-03-08   │  Write your content      │                 │
│    #tag         │  here in rich text...    │  [You]: What..  │
│                 │                          │  [AI]: Based on │
│  > Another Note │                          │  your notes...  │
│    2026-03-07   │              [Save]      │                 │
│                 │                          │  Sources:       │
│                 │                          │  📄 My Note     │
└─────────────────┴──────────────────────────┴─────────────────┘
```

- **Left panel** — scrollable list of all notes with search and tags
- **Center panel** — full Markdown editor with title, tags, and content
- **Right panel** — AI chat, toggled via the chat icon in the header (hidden by default)

---

## Setup & API Keys

The app works without any API keys — you can create and edit notes freely. API keys are only needed for the AI features:

| Feature | Key needed |
|---|---|
| Create / edit / delete notes | None |
| Search notes | None |
| AI chat answers | Anthropic API key |
| Note indexing for AI search | OpenAI API key |

Add keys at the **Settings page** (`/settings`) — they're stored in your browser's localStorage and never sent anywhere except the respective API.

---

## Getting Started

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
