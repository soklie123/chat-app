export const PROMPTS = {
  // User chats directly with AI assistant
  chat: (history: string, userMessage: string) => `
You are a friendly and helpful AI assistant inside a real-time chat application.
Keep responses concise and conversational (2-4 sentences unless a detailed answer is needed).
Use plain text only — no markdown, no bullet points, no headers.

Conversation so far:
${history}

User: ${userMessage}
AI:`.trim(),

  // Suggest 3 quick replies for the last message
  smartReplies: (lastMessage: string) => `
Generate exactly 3 short, natural reply suggestions for this chat message.
Each reply must be under 10 words. Return ONLY a JSON array of 3 strings.
No explanations, no markdown, just the array.

Message: "${lastMessage}"
`.trim(),

  // Summarize a chat room conversation
  summarize: (messages: string) => `
Summarize this chat conversation in 2-3 plain sentences.
Focus on the key topics discussed and any decisions made.
No bullet points, no headers, just plain text.

Messages:
${messages}
`.trim(),

  // Translate a message
  translate: (text: string, targetLanguage: string) => `
Translate the following text to ${targetLanguage}.
Return ONLY the translated text, nothing else.

Text: "${text}"
`.trim(),

  // Explain code found in chat
  explainCode: (code: string) => `
Explain what this code does in 2-3 simple sentences.
Write as if explaining to a teammate, not a beginner.
No markdown, plain text only.

Code:
${code}
`.trim(),

  // Check tone/grammar of a message before sending
  improveMessage: (text: string) => `
Improve this message to be clearer and more professional.
Keep the same meaning. Return ONLY the improved message, nothing else.

Message: "${text}"
`.trim(),
};