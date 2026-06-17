import { Server, Socket } from "socket.io";
import { Message } from "../models/Message";
import { getSocketId } from "./state";

export function registerMessageHandlers(io: Server, socket: Socket) {
  // Recipient received a message → mark as delivered
  socket.on(
    "message_delivered",
    ({ messageId, to }: { messageId: string; to: string }) => {
      const senderSocketId = getSocketId(to);
      if (senderSocketId) {
        io.to(senderSocketId).emit("message_delivered", { messageId });
      }
    }
  );

  // Recipient opened/read messages → mark as seen
  socket.on(
    "messages_seen",
    ({
      messageIds,
      to,
      roomId,
    }: {
      messageIds: string[];
      to?: string;
      roomId?: string;
    }) => {
      if (to) {
        // DM seen
        const senderSocketId = getSocketId(to);
        if (senderSocketId) {
          io.to(senderSocketId).emit("messages_seen", { messageIds });
        }
      } else if (roomId) {
        // Room seen - broadcast to room
        socket.to(roomId).emit("messages_seen", { messageIds });
      }
    }
  );

  // ── Send message ───────────────────────────────────────
  socket.on(
    "send_message",
    async ({
      text,
      username,
      roomId,
      tempId,
      fileUrl,
      fileName,
      fileType,
      isImage,
      audioUrl,
      audioDuration,
      replyTo,
      forwarded,
    }: {
      text: string;
      username: string;
      roomId: string;
      tempId?: string; // for client-side tracking
      fileUrl?: string;
      fileName?: string;
      fileType?: string;
      isImage?: boolean;
      audioUrl?: string;
      audioDuration?: number;
      replyTo?: { _id: string; username: string; text: string };
      forwarded?: boolean;
    }) => {
      if (!text && !fileUrl && !audioUrl) return;
      if (!username || !roomId) return;

      const saved = await Message.create({
        text: text || "",
        username,
        room: roomId,
        fileUrl,
        fileName,
        fileType,
        isImage,
        audioUrl,
        audioDuration,
        replyTo,
        forwarded,
      });

      io.to(roomId).emit("receive_message", {
        _id: saved._id,
        tempId, // echo back tempId for client to reconcile
        text: text || "",
        username,
        roomId,
        fileUrl,
        fileName,
        fileType,
        isImage,
        audioUrl,
        audioDuration,
        replyTo,
        forwarded,
        time: new Date(saved.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
    }
  );

  // ── Typing ─────────────────────────────────────────────
  socket.on(
    "typing",
    ({ username, roomId }: { username: string; roomId: string }) => {
      socket.to(roomId).emit("user_typing", username);
    }
  );

  socket.on("stop_typing", (roomId: string) => {
    socket.to(roomId).emit("user_stop_typing");
  });
}