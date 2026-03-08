# 个人知识库 + AI 问答 Web App - 设计文档

## 项目概述

一个个人使用的知识库管理工具，支持 Markdown 笔记管理和基于 RAG 的 AI 问答。用户保存笔记到本地知识库，然后可以用自然语言向 AI 提问，AI 基于知识库内容生成回答并引用来源。

## 核心功能

### 1. 笔记管理
- 创建/编辑/删除 Markdown 笔记
- 笔记支持标题 + 正文 + 标签
- 富文本 Markdown 编辑器（所见即所得）
- 笔记列表支持按标签筛选和搜索

### 2. AI 问答（RAG）
- 输入自然语言问题
- 系统从知识库中通过向量搜索找到最相关的笔记片段
- 将相关内容作为上下文发给 Claude API
- 返回答案，附带引用来源（点击可跳转到原笔记）
- 支持对话式追问

## 技术架构

### 前端
- **Next.js 14+**（App Router）
- **Tailwind CSS** + **shadcn/ui** 组件库
- Markdown 编辑器：**Tiptap** 或 **MDXEditor**
- AI 问答界面支持流式输出（streaming）

### 后端
- **Next.js API Routes** 处理后端逻辑
- **SQLite**（通过 **better-sqlite3**）存储笔记和对话
- 向量搜索：笔记量不大时在 Node.js 中用余弦相似度计算，或使用 **sqlite-vec**
- 无用户认证（个人使用）
- 无外部数据库依赖

### RAG 流程

```
笔记保存 → 文本分块(~500-1000 token/块) → Embedding API 生成向量 → 存入 SQLite
提问 → 问题向量化 → 余弦相似度搜索 → Top-K 相关片段 → Claude API 生成回答
```

### Embedding 方案
- 使用 **Voyage AI** 或 **OpenAI** 的 Embedding API
- 分块策略：按段落分块，每块约 500-1000 token

### 数据库表结构（SQLite）

```sql
-- 笔记表
CREATE TABLE notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT, -- JSON array
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 笔记分块 + 向量表
CREATE TABLE note_chunks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    note_id INTEGER NOT NULL,
    chunk_text TEXT NOT NULL,
    embedding BLOB, -- 序列化的向量
    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
);

-- 对话历史表
CREATE TABLE conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    sources TEXT, -- JSON array of {note_id, chunk_text}
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## UI 设计

### 整体布局
三栏式设计（可折叠侧边栏）：

```
┌──────────────────────────────────────────────────┐
│  Logo    [搜索]                    [AI 问答按钮]  │
├─────────┬────────────────────────┬────────────────┤
│         │                        │                │
│ 笔记列表 │     编辑器区域          │   AI 问答面板   │
│         │                        │   (可折叠)      │
│ - 笔记1  │  # 笔记标题            │                │
│ - 笔记2  │                        │  Q: 你的问题    │
│ - 笔记3  │  正文内容...           │  A: AI 回答...  │
│         │                        │  [来源: 笔记1]  │
│         │                        │                │
│ [+ 新建] │                        │  [输入框]       │
└─────────┴────────────────────────┴────────────────┘
```

### 关键页面
1. **主界面**：左侧笔记列表 + 中间编辑器 + 右侧 AI 面板
2. **AI 问答**：对话式界面，回答中高亮引用来源，点击跳转原笔记
3. **设置页**：配置 Claude API Key、Embedding API Key

### 交互细节
- 暗色/亮色主题切换
- AI 回答支持流式打字效果
- 引用来源用卡片展示，显示笔记标题 + 相关片段预览

## 外部依赖

- **Claude API** — AI 问答生成（需要 API Key）
- **Embedding API**（Voyage AI 或 OpenAI）— 文本向量化（需要 API Key）

## 项目结构（预期）

```
knowledge-base-app/
├── docs/plans/
│   └── design.md          # 本设计文档
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── page.tsx       # 主页面
│   │   ├── layout.tsx     # 布局
│   │   ├── settings/      # 设置页
│   │   └── api/           # API Routes
│   │       ├── notes/     # 笔记 CRUD
│   │       ├── chat/      # AI 问答
│   │       └── embed/     # 向量化
│   ├── components/        # UI 组件
│   │   ├── NoteList.tsx
│   │   ├── Editor.tsx
│   │   ├── ChatPanel.tsx
│   │   └── ...
│   ├── lib/
│   │   ├── db.ts          # SQLite 操作
│   │   ├── embedding.ts   # Embedding 逻辑
│   │   ├── rag.ts         # RAG 搜索逻辑
│   │   └── claude.ts      # Claude API 调用
│   └── types/             # TypeScript 类型
├── data/
│   └── knowledge.db       # SQLite 数据库文件
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.js
```
