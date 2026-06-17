import { Server, Socket } from "socket.io";
import { Message } from "../models/Message";
import { Room } from "../models/Room";
import { User } from "../models/User";
import { onlineUsers, rooms, broadcastRoomList } from "./state";

export function registerRoomHandlers(io: Server, socket: Socket) {
  // ── Register ───────────────────────────────────────────
  socket.on("register_user", async (username: string) => {
    if (!username) return;

    onlineUsers.set(socket.id, username);

    await User.findOneAndUpdate(
      { username },
      { username, lastSeen: new Date() },
      { upsert: true, returnDocument: "after" }
    );

    io.emit("online_users", Array.from(onlineUsers.values()));
    await broadcastRoomList(io);
  });

  socket.on("unregister_user", async () => {
    const username = onlineUsers.get(socket.id);
    if (username) {
      await User.findOneAndUpdate({ username }, { lastSeen: new Date() });
      rooms.forEach((members) => members.delete(username));
    }
    onlineUsers.delete(socket.id);
    io.emit("online_users", Array.from(onlineUsers.values()));
    await broadcastRoomList(io);
  });

  // ── Rooms ──────────────────────────────────────────────
  socket.on("join_room", async (roomId: string) => {
    const username = onlineUsers.get(socket.id);
    if (!username || !roomId) return;

    // Leave all previous rooms
    Array.from(socket.rooms).forEach((r) => {
      if (r !== socket.id) {
        socket.leave(r);
        rooms.get(r)?.delete(username);
      }
    });

    if (!rooms.has(roomId)) rooms.set(roomId, new Set());
    socket.join(roomId);
    rooms.get(roomId)!.add(username);

    // Send last 30 messages from MongoDB
    const messages = await Message.find({ room: roomId })
      .sort({ createdAt: -1 })
      .limit(30);

    socket.emit("chat_history", {
      messages: messages.reverse(),
      hasMore: messages.length === 30,
    });

    socket.emit("joined_room", roomId);
    socket.to(roomId).emit("user_joined_room", { username, roomId });

    io.emit("online_users", Array.from(onlineUsers.values()));
    await broadcastRoomList(io);
  });

  socket.on("create_room", async (roomName: string) => {
    const username = onlineUsers.get(socket.id);
    if (!username || !roomName) return;

    const roomId = roomName.toLowerCase().replace(/\s+/g, "-");
    const exists = await Room.findOne({ name: roomId });

    if (exists) {
      socket.emit("room_exists", roomId);
      return;
    }

    await Room.create({ name: roomId, createdBy: username });
    rooms.set(roomId, new Set());
    await broadcastRoomList(io);
    socket.emit("room_created", roomId);
  });

  // ── Pagination ──────────────────────────────────────────
  socket.on(
    "load_older_messages",
    async ({ room, before }: { room: string; before: string | Date }) => {
      const older = await Message.find({
        room,
        createdAt: { $lt: new Date(before) },
      })
        .sort({ createdAt: -1 })
        .limit(30);

      socket.emit("older_messages", {
        messages: older.reverse(),
        hasMore: older.length === 30,
      });
    }
  );
}