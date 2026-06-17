import { Router } from "express";
import { upload, uploadToCloudinary } from "../cloudinary";

export const uploadRouter = Router();

// POST /upload  (mounted at "/upload" in app.ts, so route here is "/")
uploadRouter.post("/", upload.single("file"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  try {
    const { url, isImage, isAudio } = await uploadToCloudinary(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname
    );

    res.json({
      url,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      isImage,
      isAudio,
    });
  } catch (err: any) {
    console.error("Cloudinary upload error:", err?.message ?? err);
    res.status(500).json({ error: err?.message ?? "Upload failed" });
  }
});