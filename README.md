# 🤖 AI Assistant Feature

An AI-powered assistant built into the chat app using **Groq** (free, fast LLM API). It supports chat, smart replies, translation, message improvement, summarization, and code explanation.

---

## Features

| Feature | Description |
|---|---|
| 💬 AI Chat | Talk directly with the AI assistant |
| 💡 Smart Replies | Get 3 suggested replies for any message |
| 🌐 Translate | Translate text into 8 languages |
| ✍️ Improve Message | Rewrite your draft to be clearer |
| 📝 Summarize | Summarize a conversation in 2-3 sentences |
| 🔍 Explain Code | Explain a code snippet in plain English |

---

## Setup (Each Team Member)

### Step 1 — Get a Free Groq API Key

1. Go to [https://console.groq.com](https://console.groq.com)
2. Sign up for a free account
3. Go to **API Keys** → click **Create API Key**
4. Copy the key (starts with `gsk_...`)

> You can also share one key across the team for testing — Groq's free tier is generous enough for small teams.

---

### Step 2 — Add the Key to Your `.env`

Inside the `server/` folder, open (or create) the `.env` file and add:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/chat-app
PORT=4000
JWT_SECRET=dev_only_change_this_secret
JWT_EXPIRES_IN=7d

CLOUDINARY_CLOUD_NAME=your_value
CLOUDINARY_API_KEY=your_value
CLOUDINARY_API_SECRET=your_value

GROQ_API_KEY=gsk_your_key_here
```

> ⚠️ Never commit `.env` to Git. It is already listed in `.gitignore`.

---

### Step 3 — Install Dependencies

```bash
# Server
cd server
npm install

# Client
cd ../client
npm install
```

---

### Step 4 — Run the Project

Open two terminals:

```bash
# Terminal 1 — backend
cd server
npm run dev

# Terminal 2 — frontend
cd client
npm run dev
```

You should see:
```
✅ MongoDB connected
Server running on http://localhost:4000
```

---

## How It Works

### Tech Stack

- **Groq SDK** — calls the LLM API (`llama-3.3-70b-versatile` model)
- **Express routes** — `/api/ai/*` endpoints (protected by JWT auth)
- **React hooks** — `useAIChat`, `useSmartReplies`, `useTranslate`, `useImproveMessage`
- **AIChatPanel** — the floating UI panel in the bottom-right corner

### API Endpoints

| Method | Endpoint | Body | Response |
|---|---|---|---|
| POST | `/api/ai/chat` | `{ messages, newMessage }` | `{ reply }` |
| POST | `/api/ai/smart-replies` | `{ lastMessage }` | `{ replies[] }` |
| POST | `/api/ai/translate` | `{ text, targetLanguage }` | `{ translated }` |
| POST | `/api/ai/improve` | `{ text }` | `{ improved }` |
| POST | `/api/ai/summarize` | `{ messages[] }` | `{ summary }` |
| POST | `/api/ai/explain-code` | `{ code }` | `{ explanation }` |

All endpoints require a valid JWT token in the `Authorization: Bearer <token>` header.

---

## File Structure

```
server/src/
├── ai/
│   ├── gemini.ts        # Groq client setup + model config
│   ├── ai.service.ts    # All AI functions (chat, translate, etc.)
│   └── prompts.ts       # Prompt templates for each feature
├── routes/
│   └── ai.routes.ts     # Express routes for /api/ai/*
└── sockets/
    └── ai.handlers.ts   # Socket.io handlers for real-time AI

client/src/
├── hooks/
│   └── useAi.ts         # React hooks for all AI features
└── components/shared/
    ├── AIChatPanel.tsx   # The chat panel UI
    └── AIButton.tsx      # Floating action button
```

---

## Troubleshooting

**500 Internal Server Error on `/api/ai/chat`**
- Check that `GROQ_API_KEY` is set in `server/.env`
- Make sure you restarted the server after editing `.env`
- Confirm dotenv version is 16: `npm list dotenv` — if it shows v17, run `npm install dotenv@16`

**"Model decommissioned" error**
- The model in `server/src/ai/gemini.ts` must be `llama-3.3-70b-versatile`
- Check [https://console.groq.com/docs/models](https://console.groq.com/docs/models) for the latest available models

**AI panel opens but shows "Sorry, I couldn't respond right now"**
- Open browser DevTools → Network tab → click the failed request → check the response body for the specific error

---

## Groq Free Tier Limits

| Limit | Value |
|---|---|
| Requests per minute | 30 |
| Tokens per minute | 6,000 |
| Tokens per day | 500,000 |

For a small dev team this is more than enough. If you hit limits, each person should use their own key.