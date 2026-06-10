import mongoose, { Document, Schema } from 'mongoose';
export interface IDirectMessage extends Document {
    text: string;
    from: string;
    to: string;

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

}, { timestamps: true});

DirectMessageSchema.index({ from: 1, to: 1, createdAt: -1});

export const DirectMessage = mongoose.model<IDirectMessage>(
    "DirectMessage",
    DirectMessageSchema
);