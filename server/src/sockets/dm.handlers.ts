import { Server, Socket } from "socket.io";
import { DirectMessage, IDirectMessage } from "../models/DirectMessage";
import { onlineUsers, getSocketId } from "./state";

export function registerDMHandlers(io: Server, socket: Socket) {

  // ── Open DM: load history ───────────────────────────────────────
  socket.on("dm_open", async ({ from, to }: { from: string; to: string }) => {
    if (!from || !to) return;

    const messages = await DirectMessage.find({
      $or: [
        { from, to },
        { from: to, to: from },
      ],
      deletedFor: { $ne: from },
    })
      .sort({ createdAt: -1 })
      .limit(30);

    socket.emit("dm_history", {
      with: to,
      messages: messages.reverse(),
    });
  });

  // ── Send a DM ───────────────────────────────────────────────────
  socket.on("dm_send", async ({
    from, to, text, tempId,
    fileUrl, fileName, fileType, isImage,
    audioUrl, audioDuration,
    replyTo, forwarded, caption, fromUsername,
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
      fileUrl, fileName, fileType, isImage,
      audioUrl, audioDuration,
      replyTo, forwarded, caption, fromUsername,
    }) as IDirectMessage;

    const payload = {
      _id: saved._id,
      tempId,
      from,
      to,
      text,
      fileUrl, fileName, fileType, isImage,
      audioUrl, audioDuration,
      replyTo, forwarded, caption, fromUsername,
      time: new Date(saved.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    const recipientSocketId = getSocketId(to);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("dm_receive", payload);
    }

    socket.emit("dm_sent", payload);
  });

  // ── Mark messages as seen ────────────────────────────────────────
  socket.on(
    "dm_seen",
    ({ from, to, messageIds }: { from: string; to: string; messageIds: string[] }) => {
      const senderSocketId = getSocketId(to);
      if (senderSocketId) {
        io.to(senderSocketId).emit("dm_seen", { by: from, messageIds });
      }
    }
  );

  // ── Delete for me ────────────────────────────────────────────────
  socket.on("dm_delete_for_me", async ({ messageId, username }: { messageId: string; username: string }) => {
    const msg = await DirectMessage.findById(messageId);
    if (!msg) return;

    if (!msg.deletedFor) msg.deletedFor = [];
    if (!msg.deletedFor.includes(username)) {
      msg.deletedFor.push(username);
      await msg.save();
    }

    socket.emit("dm_deleted_for_me", { messageId });
  });

  // ── Delete for everyone (unsend) — THE canonical handler ─────────
  // Client emits:  socket.emit("dm_delete_for_everyone", { messageId, username, to })
  // Server emits:  "dm_unsent" to both participants
  socket.on(
    "dm_delete_for_everyone",
    async ({
      messageId,
      username,
      to,
    }: {
      messageId: string;
      username: string;
      to: string;
    }) => {
      if (!messageId || !username || !to) return;

      const msg = await DirectMessage.findById(messageId);
      if (!msg) return;

      // Already unsent — nothing to do
      if (msg.deletedForEveryone) return;

      // Only the original sender can unsend
      if (msg.from !== username) return;

      // 5-minute time limit
      const ageMs = Date.now() - new Date(msg.createdAt).getTime();
      if (ageMs > 5 * 60 * 1000) return;

      // Clear all content
      msg.deletedForEveryone = true;
      msg.deletedAt = new Date();
      msg.text = "";
      msg.caption = undefined;
      msg.fileUrl = undefined;
      msg.fileName = undefined;
      msg.fileType = undefined;
      msg.audioUrl = undefined;
      msg.audioDuration = undefined;
      msg.replyTo = undefined;
      msg.reactions = [];

      await msg.save();

      const payload = { messageId };

      // Emit to sender
      socket.emit("dm_unsent", payload);

      // Emit to recipient if online
      const recipientSocketId = getSocketId(to);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("dm_unsent", payload);
      }
    }
  );

  // ── Typing indicators ────────────────────────────────────────────
  socket.on("dm_typing", ({ from, to }: { from: string; to: string }) => {
    const recipientSocketId = getSocketId(to);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("dm_user_typing", from);
    }
  });

  socket.on("dm_stop_typing", ({ from, to }: { from: string; to: string }) => {
    const recipientSocketId = getSocketId(to);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("dm_user_stop_typing", from);
    }
  });

  // ── Reactions ────────────────────────────────────────────────────
  socket.on(
    "add_dm_reaction",
    async ({
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

      // Detect toggle (same emoji clicked again)
      const alreadyReacted = message.reactions.find(
        (r) => r.emoji === emoji && r.usernames.includes(username)
      );

      // Remove user from all emojis first
      message.reactions.forEach((r) => {
        r.usernames = r.usernames.filter((u) => u !== username);
        r.count = r.usernames.length;
      });

      // Remove empty reaction groups
      message.reactions = message.reactions.filter((r) => r.count > 0);

      if (!alreadyReacted) {
        // Add to the chosen emoji
        const existing = message.reactions.find((r) => r.emoji === emoji);
        if (existing) {
          existing.usernames.push(username);
          existing.count = existing.usernames.length;
        } else {
          message.reactions.push({ emoji, usernames: [username], count: 1 });
        }
      }
      // If alreadyReacted → we already removed them above (toggle off)

      await message.save();

      const payload = { messageId, reactions: message.reactions };

      // Send to both participants
      socket.emit("dm_reaction_updated", payload);

      const recipientSocketId = getSocketId(to);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("dm_reaction_updated", payload);
      }
    }
  );
}