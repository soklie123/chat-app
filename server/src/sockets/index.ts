import { Server, Socket } from "socket.io";
import { User } from "../models/User";
import { onlineUsers, rooms, broadcastRoomList } from "./state";
import { registerCallHandlers } from "./call.handlers";
import { registerRoomHandlers } from "./room.handlers";
import { registerMessageHandlers } from "./message.handlers";
import { registerReactionHandlers } from "./reaction.handlers";
import { registerDMHandlers } from "./dm.handlers";

export function registerSocketHandlers(io: Server) {
  io.on("connection", (socket: Socket) => {
    console.log("User connected:", socket.id);

    registerCallHandlers(io, socket);
    registerRoomHandlers(io, socket);
    registerMessageHandlers(io, socket);
    registerReactionHandlers(io, socket);
    registerDMHandlers(io, socket);

    // ── Disconnect ─────────────────────────────────────────
    socket.on("disconnect", async () => {
      const username = onlineUsers.get(socket.id);
      if (username) {
        await User.findOneAndUpdate({ username }, { lastSeen: new Date() });
        rooms.forEach((members) => members.delete(username));
      }
      onlineUsers.delete(socket.id);
      io.emit("online_users", Array.from(onlineUsers.values()));
      await broadcastRoomList(io);
      console.log("User disconnected:", socket.id);
    });
  });
}