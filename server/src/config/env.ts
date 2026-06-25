<<<<<<< HEAD
import dotenv from "dotenv";

dotenv.config();

=======
>>>>>>> 0378d05a57b015d813c4c194c226eb231a3eccbc
export const env = {
  PORT: Number(process.env.PORT) || 4000,
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/chat_app",
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "",
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || "",
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || "",
  JWT_SECRET: process.env.JWT_SECRET || "dev_only_change_this_secret",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
<<<<<<< HEAD
=======
  GROQ_API_KEY: process.env.GROQ_API_KEY || "",
>>>>>>> 0378d05a57b015d813c4c194c226eb231a3eccbc
};