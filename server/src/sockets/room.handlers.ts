import { Server, Socket } from "socket.io";
import { Message } from "../models/Message";
import { Room } from "../models/Room";
import { User } from "../models/User";
import { onlineUsers, rooms, broadcastRoomList, getSocketId, SYSTEM_ROOMS } from "./state";

async function sendSystemMessage(io: Server, roomId: string, text: string) {
  const msg = await Message.create({
    room: roomId,
    username: "system",
    text,
  });

  const timeStr = new Date(msg.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  io.to(roomId).emit("receive_message", {
    _id: msg._id,
    roomId,
    username: "system",
    text,
    time: timeStr,
    reactions: [],
  });
}

export function registerRoomHandlers(io: Server, socket: Socket) {

  socket.on("register_user", async () => {
    const username = socket.data.username as string | undefined;
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
    socket.emit("all_users", allUsers.map((u) => u.username));
    await broadcastRoomList(io);
  });

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

  // ── Create room — accepts { roomName, members?, avatarUrl? } ──
  socket.on(
    "create_room",
    async ({
      roomName,
      members,
      avatarUrl,
    }: {
      roomName: string;
      members?: string[];
      avatarUrl?: string;
    }) => {
      const username = onlineUsers.get(socket.id);
      if (!username || !roomName) return;

      const roomId = roomName.toLowerCase().replace(/\s+/g, "-");
      const exists = await Room.findOne({ name: roomId });
      if (exists) {
        socket.emit("room_exists", roomId);
        return;
      }

      // Always include the creator; deduplicate
      const allMembers = Array.from(new Set([username, ...(members ?? [])]));

      await Room.create({
        name: roomId,
        createdBy: username,
        members: allMembers,
        ...(avatarUrl ? { avatarUrl } : {}),
      });

      rooms.set(roomId, new Set(allMembers));

      // Notify each invited member so their sidebar updates immediately
      for (const member of allMembers) {
        if (member === username) continue;
        const targetSocketId = getSocketId(member);
        if (targetSocketId) {
          io.to(targetSocketId).emit("invited_to_group", {
            groupName: roomId,
            invitedBy: username,
          });
        }
      }

      await broadcastRoomList(io);
      socket.emit("room_created", roomId);
    }
  );

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

      await sendSystemMessage(io, roomId, `${invitedBy} added ${targetUsername}`);
    }

    socket.emit("group_members_updated", {
      groupName: roomId,
      members: Array.from(rooms.get(roomId) ?? []),
    });
    await broadcastRoomList(io);
  });

  socket.on("leave_group", async ({ roomId }: { roomId: string }) => {
    const username = onlineUsers.get(socket.id);
    if (!username || !roomId) return;

    await Room.findOneAndUpdate(
      { name: roomId },
      { $pull: { members: username } }
    );

    rooms.get(roomId)?.delete(username);

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

  socket.on(
    "update_group_avatar",
    async ({ roomId, avatarUrl }: { roomId: string; avatarUrl: string }) => {
      const username = onlineUsers.get(socket.id);
      if (!username || !roomId || !avatarUrl) return;

      const roomDoc = await Room.findOne({ name: roomId });
      if (!roomDoc) return;

      if (!roomDoc.members.includes(username)) {
        socket.emit("update_group_avatar_denied", { roomId, reason: "not_a_member" });
        return;
      }

      await Room.findOneAndUpdate({ name: roomId }, { avatarUrl });
      io.to(roomId).emit("group_avatar_updated", { roomId, avatarUrl });
      await broadcastRoomList(io);
    }
  );

  socket.on(
    "load_older_messages",
    async ({ room, before }: { room: string; before: string | Date }) => {
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
    }
  );

  // ── Pin / unpin a message ──────────────────────────────
  socket.on("pin_message", async ({ roomId, messageId }: { roomId: string; messageId: string }) => {
    const username = onlineUsers.get(socket.id);
    if (!username || !roomId || !messageId) return;

    const roomDoc = await Room.findOne({ name: roomId });
    if (!roomDoc || !roomDoc.members.includes(username)) return;

    const alreadyPinned = (roomDoc.pinnedMessages ?? []).includes(messageId);

    if (alreadyPinned) {
      await Room.findOneAndUpdate({ name: roomId }, { $pull: { pinnedMessages: messageId } });
      io.to(roomId).emit("message_unpinned", { roomId, messageId });
    } else {
      await Room.findOneAndUpdate({ name: roomId }, { $addToSet: { pinnedMessages: messageId } });
      const msg = await Message.findById(messageId).lean();
      io.to(roomId).emit("message_pinned", { roomId, messageId, message: msg });
    }
  });

  // ── Get pinned messages for a room ────────────────────
  socket.on("get_pinned_messages", async ({ roomId }: { roomId: string }) => {
    const username = onlineUsers.get(socket.id);
    if (!username || !roomId) return;

    const roomDoc = await Room.findOne({ name: roomId });
    if (!roomDoc || !roomDoc.members.includes(username)) return;

    if (!roomDoc.pinnedMessages?.length) {
      socket.emit("pinned_messages", { roomId, messages: [] });
      return;
    }

    const msgs = await Message.find({ _id: { $in: roomDoc.pinnedMessages } }).lean();
    socket.emit("pinned_messages", { roomId, messages: msgs });
  });

  // ── Rename group (creator only) ────────────────────────
  socket.on("rename_group", async ({ roomId, newName }: { roomId: string; newName: string }) => {
    const username = onlineUsers.get(socket.id);
    if (!username || !roomId || !newName) return;

    const trimmed = newName.trim().toLowerCase().replace(/\s+/g, "-");
    if (!trimmed || trimmed.length < 2) return;

    const roomDoc = await Room.findOne({ name: roomId });
    if (!roomDoc) return;

    if (roomDoc.createdBy !== username) {
      socket.emit("rename_group_denied", { roomId, reason: "not_creator" });
      return;
    }

    const exists = await Room.findOne({ name: trimmed });
    if (exists && trimmed !== roomId) {
      socket.emit("rename_group_denied", { roomId, reason: "name_taken" });
      return;
    }

    await Room.findOneAndUpdate({ name: roomId }, { name: trimmed });
    await Message.updateMany({ room: roomId }, { room: trimmed });

    const members = rooms.get(roomId);
    if (members) {
      rooms.delete(roomId);
      rooms.set(trimmed, members);
    }

    io.to(roomId).emit("group_renamed", { oldRoomId: roomId, newRoomId: trimmed });

    await sendSystemMessage(io, trimmed, `${username} renamed the group to #${trimmed}`);
    await broadcastRoomList(io);
  });

  // ── Archive / unarchive a room (per user) ─────────────
  socket.on("archive_room", async ({ roomId }: { roomId: string }) => {
    const username = onlineUsers.get(socket.id);
    if (!username || !roomId) return;

    const roomDoc = await Room.findOne({ name: roomId });
    if (!roomDoc || !roomDoc.members.includes(username)) return;

    const isArchived = (roomDoc.archivedBy ?? []).includes(username);

    if (isArchived) {
      await Room.findOneAndUpdate({ name: roomId }, { $pull: { archivedBy: username } });
      socket.emit("room_unarchived", { roomId });
    } else {
      await Room.findOneAndUpdate({ name: roomId }, { $addToSet: { archivedBy: username } });
      socket.emit("room_archived", { roomId });
    }

    await broadcastRoomList(io);
  });
}