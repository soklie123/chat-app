import mongoose, {Schema, Document} from "mongoose";

export interface IRoom extends Document {
    name: string;
    createdBy: string;
    createdAt: Date;
}
const RoomSchema = new Schema<IRoom>({
  name:      { type: String, required: true, unique: true, trim: true },
  createdBy: { type: String, required: true },
}, { timestamps: true });
 
export const Room = mongoose.model<IRoom>("Room", RoomSchema);
 