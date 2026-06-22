import { Server } from "socket.io";
import { Room } from "../models/Room";
import { User } from "../models/User"; // ← add this import

export const onlineUsers = new Map<string, string>();
export const rooms = new Map<string, Set<string>>();

export const SYSTEM_ROOMS = [
  { name: "general" },
  { name: "random" },
  { name: "tech" },
];

export async function seedRooms() {
  // Get all existing users from DB
  const allUsers = await User.find({}, "username").lean();
  const allUsernames = allUsers.map((u) => u.username);

  for (const { name } of SYSTEM_ROOMS) {
    await Room.findOneAndUpdate(
      { name },
      {
        name,
        createdBy: "system",
        // Add ALL existing users as members
        $addToSet: { members: { $each: allUsernames } },
      },
      { upsert: true, returnDocument: "after" }
    );
    if (!rooms.has(name)) rooms.set(name, new Set());
    console.log(`Seeded system room: ${name} with ${allUsernames.length} users`);
  }
}

export async function broadcastRoomList(io: Server) {
  const dbRooms = await Room.find().sort({ createdAt: 1 });

  for (const [socketId, username] of onlineUsers.entries()) {
    const userRooms = dbRooms.filter((r) =>
      (r.members ?? []).includes(username)
    );

    const roomList = userRooms.map((r) => {
      const members = r.members ?? [];
      return {
        id: r.name,
        name: r.name,
        memberCount: members.length,
        members,
        createdBy: r.createdBy,
      };
    });

    io.to(socketId).emit("room_list", roomList);
  }
}

export function getSocketId(username: string): string | undefined {
  return Array.from(onlineUsers.entries()).find(
    ([, name]) => name === username
  )?.[0];
}