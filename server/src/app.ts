import express from "express";
import cors from "cors";
import { uploadRouter } from "./routes/upload.routes";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/", (_req, res) => {
    res.send("Chat server is running");
  });

  app.use("/upload", uploadRouter);

  return app;
}