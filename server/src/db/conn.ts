import mongoose from "mongoose";

export const connectDB = async( uri: string ) => {
    try {
        await 
        mongoose.connect(uri);
        console.log("✅ MongoDB connected");
    }catch (err) {
        console.log("MongoDB connection error:", err);
        process.exit(1);
    }
};