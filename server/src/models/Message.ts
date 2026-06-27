import mongoose, { Schema, Document } from "mongoose";

export interface IMessage extends Document {
  text: string;
  username: string;
  room: string;

  reactions: {
    emoji: string;
    count: number;
    usernames: string[];
  }[];

  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  isImage?: boolean;

  audioUrl?: string;
  audioDuration?: number;

  replyTo?: {
    _id: string;
    username: string;
    text: string;
  };

  forwarded?: boolean;

  type?: "text" | "call" | "screen_share" | "file" | "audio";
  event?: "started" | "stopped";
  callType?: "voice" | "video";
  callEvent?: "ended" | "missed" | "rejected";
  duration?: number;

  fromUsername?: string;
  caption?: string;
  createdAt: Date;
}

const reactionSchema = new Schema(
  {
    emoji: { type: String, required: true },
    count: { type: Number, default: 0 },
    usernames: [{ type: String }],
  },
  { _id: false }
);

const MessageSchema = new Schema<IMessage>(
  {
    text: { type: String, default: "" },

    type: {
      type: String,
      enum: ["text", "call", "screen_share", "file", "audio"],
      default: "text",
    },

    username: { type: String, required: true },
    room: { type: String, required: true },
    reactions: { type: [reactionSchema], default: [] },

    fileUrl: { type: String },
    fileName: { type: String },
    fileType: { type: String },
    isImage: { type: Boolean },

    audioUrl: { type: String },
    audioDuration: { type: Number },

    replyTo: {
      _id: { type: String },
      username: { type: String },
      text: { type: String },
    },

    forwarded: { type: Boolean, default: false },

    // Call-related
    event: { type: String, enum: ["started", "stopped"] },
    callType: { type: String, enum: ["voice", "video"] },
    callEvent: { type: String, enum: ["ended", "missed", "rejected"] },
    duration: { type: Number },

    fromUsername: { type: String },
    caption: { type: String },
  },
  { timestamps: true }
);

MessageSchema.index({ conversationId: 1, createdAt: -1 });

export const Message = mongoose.model<IMessage>("Message", MessageSchema);