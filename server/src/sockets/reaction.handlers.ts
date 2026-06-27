import { Server, Socket } from "socket.io";
import { Message } from "../models/Message";

export function registerReactionHandlers(io: Server, socket: Socket) {
  socket.on( "add_reaction", async ({
      messageId,
      emoji,
      username,
      roomId,
    }: {
      messageId: string;
      emoji: string;
      username: string;
      roomId: string;
    }) => {
      if (!messageId || !emoji || !username || !roomId) return;

      const message = await Message.findById(messageId);
      if (!message) return;

      if (!message.reactions) message.reactions = [];

      // Detect if user already clicked SAME emoji (toggle case)
      const alreadyReacted = message.reactions.find(
        (r: any) => r.emoji === emoji && r.usernames.includes(username)
      );

      // Remove user from all reactions (very important)
      message.reactions.forEach((r: any) => {
        r.usernames = r.usernames.filter((u: string) => u !== username);
        r.count = r.usernames.length;
      });

      // Remove empty reaction
      message.reactions = message.reactions.filter((r: any) => r.count > 0);

      // If same emoji -> stop (toggle off)
      if (alreadyReacted) {
        message.markModified("reactions");
        await message.save();

        // NOTE: kept as "message_reaction_update" (no trailing "d") to match
        // your original toggle-off behavior exactly. Verify your client
        // listens for this event name too — see the "new reaction" emit
        // below which uses "message_reaction_updated" instead.
        io.to(roomId).emit("message_reaction_update", {
          messageId,
          reactions: message.reactions,
        });
        return;
      }

      // Add new reaction
      const existing = message.reactions.find((r: any) => r.emoji === emoji);

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

      message.markModified("reactions");
      await message.save();

      io.to(roomId).emit("message_reaction_updated", {
        messageId,
        reactions: message.reactions,
      });
    }
  );
}