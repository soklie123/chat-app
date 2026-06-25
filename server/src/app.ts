import express from "express";
import cors from "cors";
import { uploadRouter } from "./routes/upload.routes";
import { authRouter } from "./routes/auth.routes";
import aiRoutes from "./routes/ai.routes";
import { requireAuth } from "./middleware/auth.middleware";

export function createApp() {
  const app = express();

  app.use(cors({
    origin: "http://localhost:3000",
    credentials: true,
  }));
  app.use(express.json());

  app.get("/", (_req, res) => {
    res.send("Chat server is running");
  });

  app.use("/auth", authRouter);
  app.use("/upload", uploadRouter);
  app.use("/api/ai", requireAuth, aiRoutes);

  return app;
}