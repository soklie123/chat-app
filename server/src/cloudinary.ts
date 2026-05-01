import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Store in memory, then stream to Cloudinary manually
export const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 10 * 1024 * 1024 }, // 10MB
});

export const uploadToCloudinary = (
  buffer: Buffer,
  mimetype: string,
  originalname: string
): Promise<{ url: string; isImage: boolean }> => {
  return new Promise((resolve, reject) => {
    const isImage = mimetype.startsWith("image/");
    const isAudio = mimetype.startsWith("audio/");

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder:        "chat-app",
        resource_type: isAudio? "video" : isImage ? "image" : "raw", // audio uses "video" in Cloudinary
        public_id:     `${Date.now()}-${originalname.replace(/\s+/g, "_")}`,
      },
      (error, result) => {
        if (error || !result) return reject(error);
        resolve({ url: result.secure_url, isImage, isAudio });
      }
    );
    uploadStream.end(buffer);
  });
};

export { cloudinary };