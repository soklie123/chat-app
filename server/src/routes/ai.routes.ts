import { Router, Request, Response } from "express";
import {
  chatWithAI,
  getSmartReplies,
  summarizeConversation,
  translateMessage,
  explainCode,
  improveMessage,
} from "../ai/ai.service";

const router = Router();

router.post("/chat", async (req: Request, res: Response) => {
  try {
    const { messages, newMessage } = req.body;
    console.log("[AI /chat] body:", req.body);        // ADD THIS
    console.log("[AI /chat] GROQ key:", process.env.GROQ_API_KEY ? "loaded" : "EMPTY");  // ADD THIS
    
    if (!newMessage) return res.status(400).json({ error: "newMessage is required" });

    const reply = await chatWithAI(messages || [], newMessage);
    res.json({ reply });
  } catch (err) {
    console.error("[AI /chat] ERROR:", err);   // change to log full error
    res.status(500).json({ error: "AI service error" });
  }
});

// POST /api/ai/smart-replies — get 3 quick reply suggestions
router.post("/smart-replies", async (req: Request, res: Response) => {
  try {
    const { lastMessage } = req.body;
    if (!lastMessage) return res.status(400).json({ error: "lastMessage is required" });

    const replies = await getSmartReplies(lastMessage);
    res.json({ replies });
  } catch (err) {
    console.error("[AI /smart-replies]", err);
    res.status(500).json({ error: "AI service error" });
  }
});

// POST /api/ai/summarize — summarize a conversation
router.post("/summarize", async (req: Request, res: Response) => {
  try {
    const { messages } = req.body;
    if (!messages?.length) return res.status(400).json({ error: "messages is required" });

    const summary = await summarizeConversation(messages);
    res.json({ summary });
  } catch (err) {
    console.error("[AI /summarize]", err);
    res.status(500).json({ error: "AI service error" });
  }
});

// POST /api/ai/translate — translate a message
router.post("/translate", async (req: Request, res: Response) => {
  try {
    const { text, targetLanguage } = req.body;
    if (!text || !targetLanguage) return res.status(400).json({ error: "text and targetLanguage required" });

    const translated = await translateMessage(text, targetLanguage);
    res.json({ translated });
  } catch (err) {
    console.error("[AI /translate]", err);
    res.status(500).json({ error: "AI service error" });
  }
});

// POST /api/ai/explain-code — explain a code snippet
router.post("/explain-code", async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: "code is required" });

    const explanation = await explainCode(code);
    res.json({ explanation });
  } catch (err) {
    console.error("[AI /explain-code]", err);
    res.status(500).json({ error: "AI service error" });
  }
});

// POST /api/ai/improve — improve a draft message
router.post("/improve", async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "text is required" });

    const improved = await improveMessage(text);
    res.json({ improved });
  } catch (err) {
    console.error("[AI /improve]", err);
    res.status(500).json({ error: "AI service error" });
  }
});

export default router;