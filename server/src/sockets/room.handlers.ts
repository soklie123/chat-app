import { Server, Socket } from "socket.io";
import { Message } from "../models/Message";
import { Room } from "../models/Room";
import { User } from "../models/User";
import { onlineUsers, rooms, broadcastRoomList, getSocketId } from "./state";

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

    // Emit ALL registered users (for sidebar — online + offline)
    const allUsers = await User.find({}, "username").lean();
    io.emit("all_users", allUsers.map(u => u.username));

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

    // Re-emit all users so sidebar stays accurate
    const allUsers = await User.find({}, "username").lean();
    io.emit("all_users", allUsers.map(u => u.username));

    await broadcastRoomList(io);
  });

  // ── Join room (kept for group chat) ───────────────────
  socket.on("join_room", async (roomId: string) => {
    const username = onlineUsers.get(socket.id);
    if (!username || !roomId) return;

    Array.from(socket.rooms).forEach((r) => {
      if (r !== socket.id) {
        socket.leave(r);
        rooms.get(r)?.delete(username);
      }
    });

    if (!rooms.has(roomId)) rooms.set(roomId, new Set());
    socket.join(roomId);
    rooms.get(roomId)!.add(username);

    const messages = await Message.find({ room: roomId })
      .sort({ createdAt: -1 })
      .limit(30);

    socket.emit("chat_history", {
      messages: messages.reverse(),
      hasMore: messages.length === 30,
    });

    socket.emit("joined_room", roomId);
    io.emit("online_users", Array.from(onlineUsers.values()));
    await broadcastRoomList(io);
  });

  // ── Create group ───────────────────────────────────────
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
    rooms.set(roomId, new Set([username]));
    await broadcastRoomList(io);

    // Notify the creator
    socket.emit("room_created", roomId);
  });

  // ── Invite members to group ────────────────────────────
  socket.on("invite_to_group", async ({ room, users }: { room: string; users: string[] }) => {
    const invitedBy = onlineUsers.get(socket.id);
    if (!invitedBy || !room || !users?.length) return;

    const roomId = room.toLowerCase().replace(/\s+/g, "-");

    for (const targetUsername of users) {
      // Add to room member set
      if (!rooms.has(roomId)) rooms.set(roomId, new Set());
      rooms.get(roomId)!.add(targetUsername);

      // Save invited user to Room model if you track members
      await Room.findOneAndUpdate(
        { name: roomId },
        { $addToSet: { members: targetUsername } }
      );

      // Notify invited user if online
      const targetSocketId = getSocketId(targetUsername);
      if (targetSocketId) {
        io.to(targetSocketId).emit("invited_to_group", {
          groupName: roomId,
          invitedBy,
        });
      }
    }

    // Also notify creator so their member list updates
    socket.emit("group_members_updated", {
      groupName: roomId,
      members: Array.from(rooms.get(roomId) ?? []),
    });
  });

  // ── Pagination ─────────────────────────────────────────
  socket.on("load_older_messages", async ({ room, before }: { room: string; before: string | Date }) => {
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
  });
}