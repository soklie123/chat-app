
# Gemini AI Integration Guide

## Files created

### Server
```
server/src/ai/gemini.ts        ← Gemini client init
server/src/ai/prompts.ts       ← All prompt templates
server/src/ai/ai.service.ts    ← All AI feature functions
server/src/routes/ai.routes.ts ← REST API endpoints
server/src/sockets/ai.handlers.ts ← Socket.IO real-time events
```

### Client
```
client/hooks/useAI.ts                        ← All React hooks
client/components/shared/AIChatPanel.tsx     ← Full chat UI panel
client/components/shared/AIButton.tsx        ← Floating button trigger
```

---

## Step 1 — Install dependencies

```bash
# In your server folder
cd server
npm install @google/generative-ai
```

---

## Step 2 — Add API key to .env

```bash
# server/.env
GEMINI_API_KEY=your_key_here
```

Get your free key at: https://aistudio.google.com/app/apikey

---

## Step 3 — Register AI routes in server/src/app.ts

```ts
import aiRoutes from "./routes/ai.routes";

// Add this line with your other routes
app.use("/api/ai", authMiddleware, aiRoutes);
```

---

## Step 4 — Register AI socket handlers in server/src/sockets/index.ts

```ts
import { registerAIHandlers } from "./ai.handlers";

io.on("connection", (socket) => {
  // ... your existing handlers
  registerAIHandlers(io, socket);  // ← add this line
});
```

---

## Step 5 — Add the AI button to your layout

Open `client/components/layout/Sidebar.tsx` (or wherever your main layout is) and add:

```tsx
import AIButton from "@/components/shared/AIButton";

// Inside your layout JSX, at the bottom:
<AIButton currentChatContext={currentMessages} />
```

That's it! The floating ✦ button appears in the bottom-right corner.

---

## What users can do

| Feature | How to use |
|---|---|
| **Chat with AI** | Click the ✦ button, type anything |
| **Smart replies** | AI suggests 3 replies after each message |
| **Translate** | Click "🌐 Translate" chip, paste text, pick language |
| **Improve message** | Click "✍️ Improve" chip, paste draft |
| **Explain code** | Type "explain code: [paste code]" |
| **Summarize chat** | Click "📝 Summarize chat" chip |

---

## API endpoints created

```
POST /api/ai/chat           { messages, newMessage }
POST /api/ai/smart-replies  { lastMessage }
POST /api/ai/summarize      { messages: [{sender, content}] }
POST /api/ai/translate      { text, targetLanguage }
POST /api/ai/explain-code   { code }
POST /api/ai/improve        { text }
```

## Socket events

```
Emit:    ai:chat           { messages, newMessage, conversationId }
Listen:  ai:reply          { conversationId, reply }
Listen:  ai:typing         { conversationId, typing }
Listen:  ai:error          { conversationId, message }

Emit:    ai:smart-replies  { lastMessage, messageId }
Listen:  ai:smart-replies:result { messageId, replies }

Emit:    ai:summarize      { roomId, messages }
Listen:  ai:summary:result { roomId, summary }
```