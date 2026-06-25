import { useState, useCallback } from "react";
import { getToken } from "../lib/api";
export interface AIMessage {
  role: "user" | "ai";
  content: string;
  timestamp: Date;
}

const API = "http://localhost:4000/api/ai";

async function post<T>(endpoint: string, body: object): Promise<T> {
  const token = getToken();

  const res = await fetch(`${API}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`AI request failed: ${res.status}`);
  return res.json();
}

// ── Main hook ─────────────────────────────────────────────────────────────────
export function useAIChat() {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      role: "ai",
      content: "Hi! I'm your AI assistant. Ask me anything — I can help you write messages, explain code, translate text, or just chat.",
      timestamp: new Date(),
    },
  ]);
  const [loading, setLoading] = useState(false);
const sendMessage = useCallback(async (text: string) => {
  const userMsg: AIMessage = { role: "user", content: text, timestamp: new Date() };

  // Capture history BEFORE adding the new user message
  const history = messages.map((m) => ({ role: m.role, content: m.content }));

  setMessages((prev) => [...prev, userMsg]);
  setLoading(true);

  try {
    const { reply } = await post<{ reply: string }>("/chat", {
      messages: history,   // ← send history without the new message
      newMessage: text,    // ← server appends this itself
    });
    const aiMsg: AIMessage = { role: "ai", content: reply, timestamp: new Date() };
    setMessages((prev) => [...prev, aiMsg]);
  } catch {
    const errMsg: AIMessage = {
      role: "ai",
      content: "Sorry, I couldn't respond right now. Please try again.",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, errMsg]);
  } finally {
    setLoading(false);
  }
}, [messages]);

  const clearChat = useCallback(() => {
    setMessages([
      {
        role: "ai",
        content: "Hi! I'm your AI assistant. Ask me anything — I can help you write messages, explain code, translate text, or just chat.",
        timestamp: new Date(),
      },
    ]);
  }, []);

  return { messages, loading, sendMessage, clearChat };
}

// ── Smart replies ─────────────────────────────────────────────────────────────
export function useSmartReplies() {
  const [replies, setReplies] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReplies = useCallback(async (lastMessage: string) => {
    if (!lastMessage.trim()) return;
    setLoading(true);
    try {
      const { replies } = await post<{ replies: string[] }>("/smart-replies", { lastMessage });
      setReplies(replies);
    } catch {
      setReplies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearReplies = useCallback(() => setReplies([]), []);

  return { replies, loading, fetchReplies, clearReplies };
}

// ── Summarize ─────────────────────────────────────────────────────────────────
export function useSummarize() {
  const [summary, setSummary] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const summarize = useCallback(async (messages: { sender: string; content: string }[]) => {
    setLoading(true);
    try {
      const { summary } = await post<{ summary: string }>("/summarize", { messages });
      setSummary(summary);
    } catch {
      setSummary("Could not summarize the conversation.");
    } finally {
      setLoading(false);
    }
  }, []);

  return { summary, loading, summarize, clearSummary: () => setSummary("") };
}

// ── Translate ─────────────────────────────────────────────────────────────────
export function useTranslate() {
  const [translated, setTranslated] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const translate = useCallback(async (text: string, targetLanguage: string) => {
    setLoading(true);
    try {
      const { translated } = await post<{ translated: string }>("/translate", { text, targetLanguage });
      setTranslated(translated);
    } catch {
      setTranslated("Translation failed.");
    } finally {
      setLoading(false);
    }
  }, []);

  return { translated, loading, translate, clearTranslated: () => setTranslated("") };
}

// ── Improve message ───────────────────────────────────────────────────────────
export function useImproveMessage() {
  const [improved, setImproved] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const improve = useCallback(async (text: string) => {
    setLoading(true);
    try {
      const { improved } = await post<{ improved: string }>("/improve", { text });
      setImproved(improved);
    } catch {
      setImproved("");
    } finally {
      setLoading(false);
    }
  }, []);

  return { improved, loading, improve, clearImproved: () => setImproved("") };
}