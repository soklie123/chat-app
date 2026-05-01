import mongoose, { Document, Schema } from 'mongoose';

export interface IDirectMessage extends Document {
    text: string;
    from: string;
    to: string;
    createdAt: Date;
}

const DirectMessageSchema = new Schema<IDirectMessage>({
    text: { type: String, required: true },
    from: { type: String, required: true },
    to: { type: String, required: true },
}, { timestamps: true});

DirectMessageSchema.index({ from: 1, to: 1, createdAt: -1});

export const DirectMessage = mongoose.model<IDirectMessage>(
    "DirectMessage",
    DirectMessageSchema
);