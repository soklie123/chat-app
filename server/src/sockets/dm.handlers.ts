import { Server, Socket } from "socket.io";
import { DirectMessage, IDirectMessage } from "../models/DirectMessage";
import { onlineUsers, getSocketId } from "./state";

export function registerDMHandlers(io: Server, socket: Socket) {
  socket.on("dm_open", async ({ from, to }: { from: string; to: string }) => {
    if (!from || !to) return;

    // Load last 30 messages between these two users
    const messages = await DirectMessage.find({
      $or: [
        { from, to },
        { from: to, to: from },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(30);

    socket.emit("dm_history", {
      with: to,
      messages: messages.reverse(),
    });
  });

  socket.on("dm_send", async ({
    from,
    to,
    text,
    tempId,
    fileUrl,
    fileName,
    fileType,
    isImage,
    audioUrl,
    audioDuration,
    replyTo,
    forwarded,
    caption,
    fromUsername,
  }: {
    from: string;
    to: string;
    text: string;
    tempId?: string;

    fileUrl?: string;
    fileName?: string;
    fileType?: string;
    isImage?: boolean;

    audioUrl?: string;
    audioDuration?: number;

    replyTo?: { _id: string; username: string; text: string };
    forwarded?: boolean;
    caption?: string;
    fromUsername?: string;
  }) => {
    if (!from || !to || (!text && !fileUrl && !audioUrl)) return;

      const saved = await DirectMessage.create({
        from,
        to,
        text: text || "",

        fileUrl,
        fileName,
        fileType,
        isImage,

        audioUrl,
        audioDuration,

        replyTo,
        forwarded,
        caption,
        fromUsername,
      }) as IDirectMessage;

      const payload = {
        _id: saved._id,
        tempId,
        from,
        to,
        text,
        fileUrl,
        fileName,
        fileType,
        isImage,

        audioUrl,
        audioDuration,

        replyTo,
        forwarded,
        caption,
        fromUsername,
        time: new Date(saved.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      // Send to recipient if online
      const recipientSocketId = getSocketId(to);

      if (recipientSocketId) {
        io.to(recipientSocketId).emit("dm_receive", payload);
      }

      // Confirm back to sender
      socket.emit("dm_sent", payload);
    }
  );

  socket.on("dm_typing", ({ from, to }: { from: string; to: string }) => {
    const recipientSocketId = getSocketId(to);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("dm_user_typing", from);
    }
  });

  socket.on(
    "dm_stop_typing",
    ({ from, to }: { from: string; to: string }) => {
      const recipientSocketId = getSocketId(to);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("dm_user_stop_typing", from);
      }
    }
  );

  // ── DM Reactions ───────────────────────────────────────
  socket.on("add_dm_reaction",async ({
      messageId,
      emoji,
      username,
      to,
    }: {
      messageId: string;
      emoji: string;
      username: string;
      to: string;
    }) => {
      const message = await DirectMessage.findById(messageId);
      if (!message) return;

      if (!message.reactions) message.reactions = [];

      // Check toggle
      const alreadyReacted = message.reactions.find(
        (r) => r.emoji === emoji && r.usernames.includes(username)
      );

      // Remove user from all emojis
      message.reactions.forEach((r) => {
        r.usernames = r.usernames.filter((u) => u !== username);
        r.count = r.usernames.length;
      });

      // Remove empty reactions
      message.reactions = message.reactions.filter((r) => r.count > 0);

      if (alreadyReacted) {
        // toggle off
        await message.save();
      } else {
        const existing = message.reactions.find((r) => r.emoji === emoji);
        if (existing) {
          existing.usernames.push(username);
          existing.count = existing.usernames.length;
        } else {
          message.reactions.push({
            emoji,
            usernames: [username],
            count: 1,
          });
        }
        await message.save();
      }

      const payload = {
        messageId,
        reactions: message.reactions,
      };

      const recipientSocketId = getSocketId(to);

      // Send to both users
      socket.emit("dm_reaction_updated", payload);

      if (recipientSocketId) {
        io.to(recipientSocketId).emit("dm_reaction_updated", payload);
      }
    }
  );
}