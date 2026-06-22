import mongoose from "mongoose";
import { env } from "./config/env";
import { Room } from "./models/Room";
import { Message } from "./models/Message";

async function run() {
  await mongoose.connect(env.MONGODB_URI);

  // Delete all rooms created by system
  const systemRooms = await Room.find({ createdBy: "system" }, "name").lean();
  for (const r of systemRooms) {
    await Message.deleteMany({ room: r.name });
    await Room.deleteOne({ name: r.name });
    console.log(`Deleted system room: ${r.name}`);
  }

  await mongoose.disconnect();
}

run();