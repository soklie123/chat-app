import Groq from "groq-sdk";
import { env } from "../config/env";

const groq = new Groq({
  apiKey: env.GROQ_API_KEY,
});

export const geminiModel = {
  generateContent: async (prompt: string) => {
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",  
    });
    return {
      response: {
        text: () => completion.choices[0]?.message?.content || "",
      },
    };
  },
};

export const geminiModelFast = geminiModel;