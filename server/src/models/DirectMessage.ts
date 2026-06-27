import mongoose, { Document, Schema } from 'mongoose';
export interface IDirectMessage extends Document {
    text: string;
    from: string;
    to: string;
    caption?: string; 
    fromUsername?: string;

    // NEW FIELDS (DELETE FEATURE)
    deletedFor?: string[];            // delete for me
    deletedForEveryone?: boolean;    // unsent
    deletedAt?: Date;

    reactions?: {
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

    replyTo?: { _id: string; username: string; text: string };
    forwarded?: boolean;

    // ── Call events ──────────────────────────────
    type?: "text" | "call" | "screen_share";
    event?: "started" | "stopped";
    callType?:  "voice" | "video";
    callEvent?: "ended" | "missed" | "rejected";
    duration?:  number;
    // ───────────────────────────────────────────

    createdAt: Date;
}

const reactionSchema = new Schema({
  emoji: { type: String, required: true },
  count: { type: Number, default: 0 },
  usernames: [{ type: String }],
}, { _id: false });

const DirectMessageSchema = new Schema<IDirectMessage>({
    text: { type: String, default: "" },
    from: { type: String, required: true },
    to: { type: String, required: true },
    caption: { type: String },
    fromUsername: { type: String },

    deletedFor: { type: [String], default: [] },
    deletedForEveryone: { type: Boolean, default: false },
    deletedAt: { type: Date },

    reactions: { type: [reactionSchema], default: [] },

    fileUrl: { type: String },
    fileName: { type: String },
    fileType: { type: String },
    isImage: { type: Boolean},
    
    audioUrl: { type: String },
    audioDuration: { type: Number },

    replyTo: {
        _id: { type: String },
        username: { type: String },
        text: { type: String }
    },
    forwarded: { type: Boolean, default: false },

     // ── Call events ──────────────────────────────
    
    type: {
        type: String,
        enum: ["text", "call", "screen_share"],
        default: "text",
    },
    // "text" | "call"
        
    event: {
        type: String,
        enum: ["started", "stopped"],
    },

    callType: {
        type: String,
        enum: ["voice", "video"],
    },

    callEvent: {
        type: String,
        enum: ["ended", "missed", "rejected"],
    },
                   // "ended" | "missed" | "rejected"
    duration:  { type: Number, default: 0},                   // seconds
    // ─────────────────────────────────────────────


}, { timestamps: true});

DirectMessageSchema.index({ from: 1, to: 1, createdAt: -1});

export const DirectMessage = mongoose.model<IDirectMessage>(
    "DirectMessage",
    DirectMessageSchema
);