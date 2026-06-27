import mongoose, { Schema, Document } from "mongoose";

export interface IRoom extends Document {
  name: string;
  createdBy: string;
  members: string[];
  avatarUrl?: string;
  pinnedMessages: string[];
  archivedBy: string[];
  createdAt: Date;
}

const RoomSchema = new Schema<IRoom>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    createdBy: { type: String, required: true },
    members: { type: [String], default: [] },
    avatarUrl: { type: String, default: "" },
    pinnedMessages: { type: [String], default: [] },
    archivedBy: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const Room = mongoose.model<IRoom>("Room", RoomSchema);