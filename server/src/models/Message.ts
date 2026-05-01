import mongoose, { Schema, Document } from "mongoose";

export interface IMessage extends Document {
  text:      string;
  username:  string;
  room:      string;   
  reactions: { emoji: string; count: number; usernames: string[] }[];
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  isImage?: boolean;
  audioUrl?: string;
  audioDuration?: number;
  createdAt: Date;
}

const reactionSchema = new mongoose.Schema({
  emoji: { type: String, required: true },
  count: { type: Number, default: 0 },
  usernames: [{ type: String }],
}, { _id: false });

const MessageSchema = new Schema<IMessage>({
  text:     { type: String, default: " " },
  username: { type: String, required: true },
  room:     { type: String, required: true },
  reactions: { type: [reactionSchema], default: [] },

  // for image sent use cloudinary
  fileUrl: { type: String },
  fileName: { type: String},
  fileType: { type: String },
  isImage: { type: Boolean},

  // Sent voice 
  audioUrl: { type: String },
  audioDuration: { type: Number },

}, { timestamps: true });

MessageSchema.index({ room: 1, createdAt: -1 });

export const Message = mongoose.model<IMessage>("Message", MessageSchema);