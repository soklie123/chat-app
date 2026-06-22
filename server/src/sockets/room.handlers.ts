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

    const allUsers = await User.find({}, "username").lean();
    socket.emit("all_users", allUsers.map((u) => u.username));

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
    socket.emit("all_users", allUsers.map((u) => u.username));

    await broadcastRoomList(io);
  });

  // ── Join room ──────────────────────────────────────────
  socket.on("join_room", async (roomId: string) => {
    const username = onlineUsers.get(socket.id);
    if (!username || !roomId) return;

    // 🔒 Only members may join — prevents spoofed join_room events
    const roomDoc = await Room.findOne({ name: roomId });
    if (!roomDoc || !(roomDoc.members ?? []).includes(username)) {
      socket.emit("join_room_denied", { roomId, reason: "not_a_member" });
      return;
    }

    // Leave every other room this socket is currently in
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

    // Creator is automatically the first (and only) member
    await Room.create({ name: roomId, createdBy: username, members: [username] });
    rooms.set(roomId, new Set([username]));

    // broadcastRoomList is per-user, so only the creator will see this
    // new room appear in their sidebar until others are invited.
    await broadcastRoomList(io);

    socket.emit("room_created", roomId);
  });

  // ── Invite members to group ────────────────────────────
  socket.on("invite_to_group", async ({ room, users }: { room: string; users: string[] }) => {
    const invitedBy = onlineUsers.get(socket.id);
    if (!invitedBy || !room || !users?.length) return;

    const roomId = room.toLowerCase().replace(/\s+/g, "-");

    // Verify the inviter is themselves a member of this room
    const roomDoc = await Room.findOne({ name: roomId });
    if (!roomDoc || !(roomDoc.members ?? []).includes(invitedBy)) {
      socket.emit("invite_denied", { roomId, reason: "not_a_member" });
      return;
    }

    for (const targetUsername of users) {
      // Persist membership in DB first so broadcastRoomList picks it up
      await Room.findOneAndUpdate(
        { name: roomId },
        { $addToSet: { members: targetUsername } }
      );

      // Mirror in in-memory set
      if (!rooms.has(roomId)) rooms.set(roomId, new Set());
      rooms.get(roomId)!.add(targetUsername);

      // Notify the invited user if they are online so they can react
      // (e.g. auto-join or show a banner) — their sidebar will also
      // update automatically via broadcastRoomList below.
      const targetSocketId = getSocketId(targetUsername);
      if (targetSocketId) {
        io.to(targetSocketId).emit("invited_to_group", {
          groupName: roomId,
          invitedBy,
        });
      }
    }

    // Tell the inviter the updated member list for their UI
    socket.emit("group_members_updated", {
      groupName: roomId,
      members: Array.from(rooms.get(roomId) ?? []),
    });

    // Re-broadcast per-user room lists — newly invited users will now
    // see this room appear in their sidebar; everyone else is unaffected.
    await broadcastRoomList(io);
  });

  // ── Pagination ─────────────────────────────────────────
  socket.on("load_older_messages", async ({ room, before }: { room: string; before: string | Date }) => {
    const username = onlineUsers.get(socket.id);
    if (!username) return;

    // 🔒 Only members may load history
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