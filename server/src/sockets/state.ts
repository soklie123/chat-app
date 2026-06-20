import { Server } from "socket.io";
import { Room } from "../models/Room";

// In-memory (session only — DB is source of truth)
export const onlineUsers = new Map<string, string>(); // socketId → username
export const rooms = new Map<string, Set<string>>(); // roomId → Set<username>

export const DEFAULT_ROOMS = ["general"];

// Seed default rooms on startup
export async function seedRooms() {
  for (const name of DEFAULT_ROOMS) {
    await Room.findOneAndUpdate(
      { name },
      { name, createdBy: "system" },
      { upsert: true, returnDocument: "after" }
    );
    if (!rooms.has(name)) rooms.set(name, new Set());
  }
}

export async function broadcastRoomList(io: Server) {
  const dbRooms = await Room.find().sort({ createdAt: 1 });
  const roomList = dbRooms.map((r) => ({
    id: r.name,
    name: r.name,
    memberCount: rooms.get(r.name)?.size ?? 0,
  }));
  io.emit("room_list", roomList);
}

// Find a connected socket id by username
export function getSocketId(username: string): string | undefined {
  return Array.from(onlineUsers.entries()).find(
    ([, name]) => name === username
  )?.[0];
}