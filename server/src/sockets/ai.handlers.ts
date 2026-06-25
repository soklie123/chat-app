import { Server, Socket } from "socket.io";
import {
  chatWithAI,
  getSmartReplies,
  summarizeConversation,
  ChatMessage,
} from "../ai/ai.service";

export function registerAIHandlers(io: Server, socket: Socket) {
  // ── Real-time AI chat (streams typing indicator while AI thinks) ──────────
  socket.on(
    "ai:chat",
    async (data: { messages: ChatMessage[]; newMessage: string; conversationId: string }) => {
      const { messages, newMessage, conversationId } = data;

      // Tell the client AI is typing
      socket.emit("ai:typing", { conversationId, typing: true });

      try {
        const reply = await chatWithAI(messages, newMessage);
        socket.emit("ai:reply", { conversationId, reply });
      } catch (err) {
        console.error("[Socket ai:chat]", err);
        socket.emit("ai:error", { conversationId, message: "AI failed to respond. Try again." });
      } finally {
        socket.emit("ai:typing", { conversationId, typing: false });
      }
    }
  );

  // ── Smart reply suggestions ───────────────────────────────────────────────
  socket.on("ai:smart-replies", async (data: { lastMessage: string; messageId: string }) => {
    try {
      const replies = await getSmartReplies(data.lastMessage);
      socket.emit("ai:smart-replies:result", { messageId: data.messageId, replies });
    } catch {
      socket.emit("ai:smart-replies:result", { messageId: data.messageId, replies: [] });
    }
  });

  // ── Summarize a room's recent messages ───────────────────────────────────
  socket.on(
    "ai:summarize",
    async (data: { roomId: string; messages: { sender: string; content: string }[] }) => {
      try {
        const summary = await summarizeConversation(data.messages);
        socket.emit("ai:summary:result", { roomId: data.roomId, summary });
      } catch {
        socket.emit("ai:error", { roomId: data.roomId, message: "Could not summarize." });
      }
    }
  );
}