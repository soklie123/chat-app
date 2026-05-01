import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  username:  string;
  lastSeen:  Date;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true, trim: true },
  lastSeen: { type: Date, default: Date.now },
}, { timestamps: true });

export const User = mongoose.model<IUser>("User", UserSchema);