import { Server } from "socket.io";
import { Room } from "../models/Room";

// In-memory (session only — DB is source of truth)
export const onlineUsers = new Map<string, string>(); // socketId → username
export const rooms = new Map<string, Set<string>>();  // roomId → Set<username>

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

  // Send each connected socket only the rooms they are a member of
  for (const [socketId, username] of onlineUsers.entries()) {
    const userRooms = dbRooms.filter((r) =>
      (r.members ?? []).includes(username)
    );

    const roomList = userRooms.map((r) => {
      const liveMembers = rooms.get(r.name);
      // Prefer in-memory set (kept current by join/invite/leave),
      // fall back to persisted Room.members for offline-invited users.
      const members =
        liveMembers && liveMembers.size > 0
          ? Array.from(liveMembers)
          : (r.members ?? []);

      return {
        id: r.name,
        name: r.name,
        memberCount: members.length,
        members,
      };
    });

    io.to(socketId).emit("room_list", roomList);
  }
}

// Find a connected socket id by username
export function getSocketId(username: string): string | undefined {
  return Array.from(onlineUsers.entries()).find(
    ([, name]) => name === username
  )?.[0];
}