import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import { connectDB } from "./db/conn";
import { Message} from "./models/Message"; 
import { Room } from "./models/Room";
import { User } from "./models/User";
import { DirectMessage } from "./models/DirectMessage";
import dotenv from "dotenv";
import { upload, uploadToCloudinary } from "./cloudinary"; // ← make sure both are imported

dotenv.config();
connectDB(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/chat_app");

const app = express();
app.use(cors());
app.use(express.json());

const server =  http.createServer(app);

app.get("/", (_req, res) => {
  res.send("Chat server is running");
});

const io = new Server(server, {
  cors: { origin: "*" },
});

// In-memory (session only — DB is source of truth)
const onlineUsers = new Map<string, string>(); // socketId → username
const rooms       = new Map<string, Set<string>>(); // roomId → Set<username>

const DEFAULT_ROOMS = ["general", "random", "tech"];

async function broadcastRoomList() {
  const dbRooms = await Room.find().sort({ createdAt: 1 });
  const roomList = dbRooms.map((r) => ({
    id:          r.name,
    name:        r.name,
    memberCount: rooms.get(r.name)?.size ?? 0,
  }));
  io.emit("room_list", roomList);
}

// Seed default rooms on startup
async function seedRooms() {
  for (const name of DEFAULT_ROOMS) {
    await Room.findOneAndUpdate(
      { name },
      { name, createdBy: "system" },
      { upsert: true, returnDocument: "after" }
    );
    if (!rooms.has(name)) rooms.set(name, new Set());
  }
}

seedRooms();

  // ── File upload endpoint ──────────────────────────────
  app.post("/upload", upload.single("file"), async (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    try {
      const { url, isImage, isAudio } = await uploadToCloudinary(
        req.file.buffer,
        req.file.mimetype,
        req.file.originalname
      );

      res.json({
        url,
        originalName: req.file.originalname,
        mimetype:     req.file.mimetype,
        isImage,
        isAudio,      // new
      });
    } catch (err: any) {
      console.error("Cloudinary upload error:", err?.message ?? err);
      res.status(500).json({ error: err?.message ?? "Upload failed" });
    }
  });

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // ── WebRTC Call Signaling ──────────────────────────────

  // Helper to get socket id by username
  const getSocketId = (username: string) => 
    Array.from(onlineUsers.entries()).find(([, name]) => name === username) ?.[0];

  // 1. Caller initiates call
  socket.on("call_user", ({ to, from, type, callId, offer} : {
    to: string;
    from: string;
    type: "voice" | "video";
    callId: string;
    offer: RTCSessionDescriptionInit;
  }) => {
    const reciptientId = getSocketId(to);
    if (!reciptientId) {
      socket.emit("call_failed", {reason: "User is offline"});
      return;
    }
    io.to(reciptientId).emit("incoming_call", { from, type, callId, offer });
  });

  // 2. Reciptient answer
  socket.on("call_answer", ({ to, callId, answer}: {
    to: string;
    callId: string;
    answer: RTCSessionDescriptionInit;
  }) => {
    const callerSocketId = getSocketId(to);
    if (callerSocketId) {
      io.to(callerSocketId).emit("call_answered", { callId, answer });
    }
  });

  // 3. ICE candidates exchange
  socket.on("ice_candidate", ({ to, candidate } : {
    to: string;
    candidate: RTCIceCandidateInit;
  }) => {
    const targetId = getSocketId(to);
    if (targetId) {
      io.to(targetId).emit("ice_candidate", { candidate });
    }
  });

  // 4. End call
  socket.on("end_call", ({ to, callId }: {
    to: string;
    callId: string;
  }) => {
    const targetId = getSocketId(to);
    if (targetId) {
      io.to(targetId).emit("call_ended", { callId });
    }
  });

  // 5. Reject call
  socket.on("reject_call", ({to, callId} : {
    to: string; callId: string;
  }) => {
    const targetId = getSocketId(to);
    if (targetId) {
      io.to(targetId).emit("call_rejected", { callId });
    }
  });
  // ========================================================================
  // Message delivery and seen
  // When reciptient receives a message - mark as delivered
  socket.on("message_delivered", ({messageId, to} : {
    messageId: string;
    to: string;
  }) => {
    const senderSocketId = getSocketId(to);
    if (senderSocketId) {
      io.to(senderSocketId).emit("message_delivered", { messageId });
    }
  });

  // when reciptient opens/reads messages - mark as seen
  socket.on("messages_seen", ({ messageIds, to, roomId} : {
    messageIds: string[];
    to?: string;
    roomId?: string;
  }) => {
    if (to) {
      // DM seen
      const senderSocketId = getSocketId(to);
      if (senderSocketId) {
        io.to(senderSocketId).emit("messages_seen", { messageIds });
      }
    } else if (roomId) {
      // Room seen - broadcast to room
      socket.to(roomId).emit("messages_seen", { messageIds });
    }
  });
  // ========================================================================
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
    await broadcastRoomList();
  });

  socket.on("unregister_user", async () => {
    const username = onlineUsers.get(socket.id);
    if (username) {
      await User.findOneAndUpdate({ username }, { lastSeen: new Date() });
      rooms.forEach((members) => members.delete(username));
    }
    onlineUsers.delete(socket.id);
    io.emit("online_users", Array.from(onlineUsers.values()));
    await broadcastRoomList();
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

    // Send last 30 messages from MongoDB (your existing logic)
    const messages = await Message.find({ room: roomId })
      .sort({ createdAt: -1 })
      .limit(30);

    socket.emit("chat_history", {
      messages: messages.reverse(),
      hasMore:  messages.length === 30,
    });

    socket.emit("joined_room", roomId);
    socket.to(roomId).emit("user_joined_room", { username, roomId });

    io.emit("online_users", Array.from(onlineUsers.values()));
    await broadcastRoomList();
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
    await broadcastRoomList();
    socket.emit("room_created", roomId);
  });

  // ── Pagination (your existing logic, kept as-is) ───────
  socket.on("load_older_messages", async ({ room, before }) => {
    const older = await Message.find({
      room,
      createdAt: { $lt: new Date(before) },
    })
      .sort({ createdAt: -1 })
      .limit(30);

    socket.emit("older_messages", {
      messages: older.reverse(),
      hasMore:  older.length === 30,
    });
  });

  // ── Messages ───────────────────────────────────────────
  socket.on("send_message", async ({ 
    text, username, roomId, tempId,
    fileUrl, fileName, fileType, isImage, 
    audioUrl, audioDuration, replyTo, forwarded
  }: {
    text:           string;
    username:       string;
    roomId:         string;
    tempId?:        string; // for client-side tracking
    fileUrl?:       string;
    fileName?:      string;
    fileType?:      string;
    isImage?:       boolean;
    audioUrl?:      string;   // 
    audioDuration?: number;   // 
    replyTo?: { _id: string; username: string; text: string };
    forwarded?: boolean;
  }) => {
    if (!text && !fileUrl && !audioUrl) return;
    if (!username || !roomId) return;

    const saved = await Message.create({
      text:     text || "",
      username,
      room:     roomId,
      fileUrl,
      fileName,
      fileType,
      isImage,
      audioUrl,      // 
      audioDuration, // 
      replyTo,
      forwarded,
    });

    io.to(roomId).emit("receive_message", {
      _id: saved._id,
      tempId, // echo back tempId for client to reconcile
      text: text || "",
      username,
      roomId,
      fileUrl,
      fileName,
      fileType,
      isImage,
      audioUrl,      // ← new
      audioDuration, // ← new
      replyTo,
      forwarded,
      time: new Date(saved.createdAt).toLocaleTimeString([], {
        hour: "2-digit", minute: "2-digit",
      }),
    });
  });

  // ── Reactions ──────────────────────────────────────────
  socket.on("add_reaction", async ({ messageId, emoji, username, roomId }: {
    messageId: string;
    emoji: string;
    username: string;
    roomId: string;
  }) => {
    if (!messageId || !emoji || !username || !roomId) return;

    const message = await Message.findById(messageId);
    if (!message) return;

    if (!message.reactions) message.reactions = [];

    // Detect if uer already clicked SAME emoji (toggle case)

    const alreadyReacted = message.reactions.find(
        (r: any) => r.emoji === emoji && r.usernames.includes(username)
      );
    
      // Remove user from all reactions (very important)
      message.reactions.forEach((r: any) => {
        r.usernames = r.usernames.filter((u: string) => u !== username);
        r.count = r.usernames.length;
      });

      // Remove empty reaction
      message.reactions = message.reactions.filter(
        (r: any) => r.count > 0
      );

      // If same emoji -> stop (toggle off)
      if (alreadyReacted) {
        message.markModified("reactions");
        await message.save();

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
        reactions: message.reactions
      });
  });

  // ── Direct Messages ────────────────────────────────────
  socket.on("dm_open", async ({ from, to}: {from: string; to: string}) => {
    if (!from || !to) return;

    // Load last 30 messages between these two users
    const messages = await DirectMessage.find({
      $or: [
        { from, to },
        { from: to, to: from},
      ],
    })
    .sort({ createdAt: -1})
    .limit(30);

    socket.emit("dm_history", {
      with: to,
      messages: messages.reverse(),
    });
  });

  socket.on("dm_send", async ({
    from,
    to,
    text,
    tempId,    // pass back for client-side tracking
    fileUrl,
    fileName,
    fileType,
    isImage,
    audioUrl,
    audioDuration,
    replyTo,
    forwarded,
    caption,
    fromUsername,

  }: {
    from:      string;
    to:        string;
    text:      string;
    tempId?:   string;   // add this

    fileUrl?:  string;
    fileName?: string;
    fileType?: string;
    isImage?:  boolean;

    audioUrl?: string;
    audioDuration?: number;

    replyTo?: { _id: string; username: string; text: string };
    forwarded?: boolean;
    caption?: string;
    fromUsername?: string;
  }) => {
    if (!from || !to || (!text && !fileUrl && !audioUrl)) return;

    const saved = await DirectMessage.create({
      from,
      to,
      text:     text || "",

      fileUrl,
      fileName,
      fileType,
      isImage,

      audioUrl,
      audioDuration,

      replyTo,
      forwarded,
      caption,
      fromUsername
    });

    const payload = {    // ← fixed typo "playload" → "payload"
      _id:  saved._id,
      tempId,
      from,
      to,
      text,
      fileUrl,
      fileName,
      fileType,
      isImage,

      audioUrl,
      audioDuration,

      replyTo,
      forwarded,
      caption,
      fromUsername,
      time: new Date(saved.createdAt).toLocaleTimeString([], {
          hour: "2-digit", minute: "2-digit",
      }),
    };

    // Send to recipient if online
    const recipientSocketId = Array.from(onlineUsers.entries())
      .find(([, name]) => name === to)?.[0];

    if (recipientSocketId) {
      io.to(recipientSocketId).emit("dm_receive", payload); // ← fix typo "dm_recieve"
    }
    
    // Confirm back to sender
    socket.emit("dm_sent", payload); // ← fix "dm_send" → "dm_sent"
  });
  
  socket.on("dm_typing", ({ from, to}: { from: string; to: string}) => {
    const recipientSocketId = Array.from(onlineUsers.entries())
      .find(([, name]) => name === to)?.[0];
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("dm_user_typing", from);
    }
  });


  socket.on("dm_stop_typing", ({from, to}: { from: string; to: string}) => {
    const recipientSocketId = Array.from(onlineUsers.entries())
      .find(([, name]) => name === to)?.[0];
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("dm_user_stop_typing", from);
    }
  });

  // add reaction in dm room
  socket.on("add_dm_reaction", async({
    messageId,
    emoji,
    username,
    to,
  }) => {
    const message = await DirectMessage.findById(messageId);
    if(!message) return;

    if (!message.reactions) message.reactions = [];

    // Check toggle
    const alreadyReacted = message.reactions.find(
      (r) => r.emoji === emoji && r.usernames.includes(username)
    );

    // Remove user from all emojis
    message.reactions.forEach((r) => {
      r.usernames = r.usernames.filter((u) => u !== username);
      r.count = r.usernames.length;
    });

    // Remove empty reactions
    message.reactions = message.reactions.filter(r => r.count > 0);

    // toggle off
    if (alreadyReacted) {
      await message.save();
    } else {
      const existing = message.reactions.find(r => r.emoji === emoji);
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
      await message.save();
    }

    const playload = {
      messageId,
      reactions: message.reactions,
    };

    const recipientSocketId = 
      Array.from(onlineUsers.entries()).find(([, name]) => name === to)?.[0];
    
    // Send to both users
    socket.emit("dm_reaction_updated", playload);

    if (recipientSocketId) {
      io.to(recipientSocketId).emit("dm_reaction_updated", playload);
    }
  });

  // ── Typing ─────────────────────────────────────────────
  socket.on("typing", ({ username, roomId }: { username: string; roomId: string }) => {
    socket.to(roomId).emit("user_typing", username);
  });

  socket.on("stop_typing", (roomId: string) => {
    socket.to(roomId).emit("user_stop_typing");
  });

  // ── Disconnect ─────────────────────────────────────────
  socket.on("disconnect", async () => {
    const username = onlineUsers.get(socket.id);
    if (username) {
      await User.findOneAndUpdate({ username }, { lastSeen: new Date() });
      rooms.forEach((members) => members.delete(username));
    }
    onlineUsers.delete(socket.id);
    io.emit("online_users", Array.from(onlineUsers.values()));
  await broadcastRoomList();
    console.log("User disconnected:", socket.id);
  });
});

server.listen(4000, () => {
  console.log("Server running on http://localhost:4000");
});