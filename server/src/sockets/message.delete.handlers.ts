import { Server, Socket } from "socket.io";
import { Message } from "../models/Message";

/**
 * Delete handling for room (group) messages.
 * Soft-delete, matching the same deletedFor / deletedForEveryone /
 * deletedAt pattern now used by DirectMessage, for consistency across
 * both message types.
 */
export function registerMessageDeleteHandlers(io: Server, socket: Socket) {
  socket.on(
    "delete_message",
    async ({
      messageId,
      username,
      roomId,
    }: {
      messageId: string;
      username: string;
      roomId: string;
    }) => {
      if (!messageId || !username || !roomId) return;

      const message = await Message.findById(messageId);
      if (!message) return;

      // Only the author can delete their own message.
      // (Extend this check later if you add admin-delete for groups.)
      if (message.username !== username) return;

      message.deletedForEveryone = true;
      message.deletedAt = new Date();
      await message.save();

      io.to(roomId).emit("message_deleted", {
        messageId,
        roomId,
      });
    }
  );

  // ── Optional: "delete for me" only ──────────────────────────────
  // socket.on(
  //   "delete_message_for_me",
  //   async ({ messageId, username }: { messageId: string; username: string }) => {
  //     if (!messageId || !username) return;
  //     const message = await Message.findById(messageId);
  //     if (!message) return;
  //
  //     if (!message.deletedFor) message.deletedFor = [];
  //     if (!message.deletedFor.includes(username)) {
  //       message.deletedFor.push(username);
  //       await message.save();
  //     }
  //
  //     // Only the requester's client needs to update — emit to their socket only.
  //     socket.emit("message_deleted_for_me", { messageId });
  //   }
  // );
}