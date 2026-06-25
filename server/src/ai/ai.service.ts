import { geminiModel, geminiModelFast } from "./gemini";
import { PROMPTS } from "./prompts";

export interface ChatMessage {
  role: "user" | "ai";
  content: string;
}

// ─── 1. Direct AI Chat ───────────────────────────────────────────────────────
export async function chatWithAI(
  messages: ChatMessage[],
  newMessage: string
): Promise<string> {
  const history = messages
    .map((m) => `${m.role === "user" ? "User" : "AI"}: ${m.content}`)
    .join("\n");

  const prompt = PROMPTS.chat(history, newMessage);
  const result = await geminiModel.generateContent(prompt);
  return result.response.text().trim();
}

// ─── 2. Smart Reply Suggestions ──────────────────────────────────────────────
export async function getSmartReplies(lastMessage: string): Promise<string[]> {
  try {
    const prompt = PROMPTS.smartReplies(lastMessage);
    const result = await geminiModelFast.generateContent(prompt);
    const text = result.response.text().trim();

    // Strip markdown code fences if present
    const cleaned = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    if (Array.isArray(parsed)) {
      return parsed.slice(0, 3).map(String);
    }
    return [];
  } catch {
    return [];
  }
}

// ─── 3. Summarize Conversation ───────────────────────────────────────────────
export async function summarizeConversation(
  messages: { sender: string; content: string }[]
): Promise<string> {
  const formatted = messages
    .map((m) => `${m.sender}: ${m.content}`)
    .join("\n");

  const prompt = PROMPTS.summarize(formatted);
  const result = await geminiModel.generateContent(prompt);
  return result.response.text().trim();
}

// ─── 4. Translate Message ────────────────────────────────────────────────────
export async function translateMessage(
  text: string,
  targetLanguage: string
): Promise<string> {
  const prompt = PROMPTS.translate(text, targetLanguage);
  const result = await geminiModelFast.generateContent(prompt);
  return result.response.text().trim();
}

// ─── 5. Explain Code ─────────────────────────────────────────────────────────
export async function explainCode(code: string): Promise<string> {
  const prompt = PROMPTS.explainCode(code);
  const result = await geminiModel.generateContent(prompt);
  return result.response.text().trim();
}

// ─── 6. Improve Message ──────────────────────────────────────────────────────
export async function improveMessage(text: string): Promise<string> {
  const prompt = PROMPTS.improveMessage(text);
  const result = await geminiModelFast.generateContent(prompt);
  return result.response.text().trim();
}