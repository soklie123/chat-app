import { Server, Socket } from "socket.io";
import { Message } from "../models/Message";
import { Room } from "../models/Room";
import { User } from "../models/User";
import { onlineUsers, rooms, broadcastRoomList, getSocketId, SYSTEM_ROOMS } from "./state";

// ── Helper: save + broadcast a system message ──────────
async function sendSystemMessage(io: Server, roomId: string, text: string) {
  const msg = await Message.create({
    room: roomId,
    username: "system",
    text,
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  });

  io.to(roomId).emit("receive_message", {
    _id: msg._id,
    roomId,
    username: "system",
    text,
    time: msg.time,
    reactions: [],
  });
}

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

    for (const { name } of SYSTEM_ROOMS) {
      await Room.findOneAndUpdate(
        { name },
        { $addToSet: { members: username } }
      );
      if (!rooms.has(name)) rooms.set(name, new Set());
    }

    io.emit("online_users", Array.from(onlineUsers.values()));
    const allUsers = await User.find({}, "username").lean();
    io.emit("all_users", allUsers.map((u) => u.username));
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
    const allUsers = await User.find({}, "username").lean();
    io.emit("all_users", allUsers.map((u) => u.username));
    await broadcastRoomList(io);
  });

  // ── Join room ──────────────────────────────────────────
  socket.on("join_room", async (roomId: string) => {
    const username = onlineUsers.get(socket.id);
    if (!username || !roomId) return;

    const roomDoc = await Room.findOne({ name: roomId });
    if (!roomDoc || !(roomDoc.members ?? []).includes(username)) {
      socket.emit("join_room_denied", { roomId, reason: "not_a_member" });
      return;
    }

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

    await Room.create({ name: roomId, createdBy: username, members: [username] });
    rooms.set(roomId, new Set([username]));
    await broadcastRoomList(io);
    socket.emit("room_created", roomId);
  });

  // ── Invite members ─────────────────────────────────────
  socket.on("invite_to_group", async ({ room, users }: { room: string; users: string[] }) => {
    const invitedBy = onlineUsers.get(socket.id);
    if (!invitedBy || !room || !users?.length) return;

    const roomId = room.toLowerCase().replace(/\s+/g, "-");

    const roomDoc = await Room.findOne({ name: roomId });
    if (!roomDoc || !(roomDoc.members ?? []).includes(invitedBy)) {
      socket.emit("invite_denied", { roomId, reason: "not_a_member" });
      return;
    }

    for (const targetUsername of users) {
      await Room.findOneAndUpdate(
        { name: roomId },
        { $addToSet: { members: targetUsername } }
      );
      if (!rooms.has(roomId)) rooms.set(roomId, new Set());
      rooms.get(roomId)!.add(targetUsername);

      const targetSocketId = getSocketId(targetUsername);
      if (targetSocketId) {
        io.to(targetSocketId).emit("invited_to_group", {
          groupName: roomId,
          invitedBy,
        });
      }

      // ── System message: X added Y ──────────────────────
      await sendSystemMessage(io, roomId, `${invitedBy} added ${targetUsername}`);
    }

    socket.emit("group_members_updated", {
      groupName: roomId,
      members: Array.from(rooms.get(roomId) ?? []),
    });
    await broadcastRoomList(io);
  });

  // ── Leave group ────────────────────────────────────────
  socket.on("leave_group", async ({ roomId }: { roomId: string }) => {
    const username = onlineUsers.get(socket.id);
    if (!username || !roomId) return;

    await Room.findOneAndUpdate(
      { name: roomId },
      { $pull: { members: username } }
    );

    rooms.get(roomId)?.delete(username);

    // ── System message: X left the group ──────────────── 
    // Send BEFORE socket.leave so the leaver's socket still receives it
    await sendSystemMessage(io, roomId, `${username} left the group`);

    socket.leave(roomId);

    const updatedRoom = await Room.findOne({ name: roomId });
    if (!updatedRoom || updatedRoom.members.length === 0) {
      await Room.deleteOne({ name: roomId });
      await Message.deleteMany({ room: roomId });
      rooms.delete(roomId);
    }

    socket.emit("left_group", { roomId });
    io.to(roomId).emit("group_member_left", { roomId, username });
    await broadcastRoomList(io);
  });

  // ── Delete group (creator only) ────────────────────────
  socket.on("delete_group", async ({ roomId }: { roomId: string }) => {
    const username = onlineUsers.get(socket.id);
    if (!username || !roomId) return;

    const roomDoc = await Room.findOne({ name: roomId });
    if (!roomDoc) return;

    if (roomDoc.createdBy !== username) {
      socket.emit("delete_group_denied", { roomId, reason: "not_creator" });
      return;
    }

    await Message.deleteMany({ room: roomId });
    await Room.deleteOne({ name: roomId });
    rooms.delete(roomId);

    io.to(roomId).emit("group_deleted", { roomId });
    await broadcastRoomList(io);
  });

  // ── Delete room chat history ───────────────────────────
  socket.on("delete_room_chat", async ({ roomId }: { roomId: string }) => {
    const username = onlineUsers.get(socket.id);
    if (!username || !roomId) return;

    const roomDoc = await Room.findOne({ name: roomId });
    if (!roomDoc || !roomDoc.members.includes(username)) return;

    if (roomDoc.createdBy === username) {
      await Message.deleteMany({ room: roomId });
      io.to(roomId).emit("room_chat_cleared", { roomId });
    } else {
      socket.emit("room_chat_cleared", { roomId });
    }
  });

  // ── Pagination ─────────────────────────────────────────
  socket.on("load_older_messages", async ({ room, before }: { room: string; before: string | Date }) => {
    const username = onlineUsers.get(socket.id);
    if (!username) return;

    const roomDoc = await Room.findOne({ name: room });
    if (!roomDoc || !(roomDoc.members ?? []).includes(username)) return;

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