import { Server, Socket } from "socket.io";
import { Message } from "../models/Message";
import { Room } from "../models/Room";
import { getSocketId, onlineUsers } from "./state";

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
      tempId?: string;
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

      const payload = {
        _id: saved._id,
        tempId,
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
      };

      // Broadcast to all sockets currently joined to the Socket.io room
      // (these are members who have that room open right now)
      io.to(roomId).emit("receive_message", payload);

      // ── Unread bump for members NOT currently in the Socket.io room ──
      // Fetch all room members from DB, then notify each online member
      // whose socket is NOT already in the room (i.e. they're in another chat).
      const roomDoc = await Room.findOne({ name: roomId }).lean();
      if (roomDoc?.members) {
        for (const member of roomDoc.members) {
          if (member === username) continue; // don't notify the sender

          const memberSocketId = getSocketId(member);
          if (!memberSocketId) continue; // member is offline

          // Check if this socket is already in the Socket.io room
          const memberSocket = io.sockets.sockets.get(memberSocketId);
          if (!memberSocket) continue;

          const alreadyInRoom = memberSocket.rooms.has(roomId);
          if (alreadyInRoom) continue; // already got the broadcast above

          // Send a lightweight unread-bump event to their personal socket
          io.to(memberSocketId).emit("room_unread_bump", {
            roomId,
            username, // who sent it
          });
        }
      }
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