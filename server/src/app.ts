import express from "express";
import cors from "cors";
import { uploadRouter } from "./routes/upload.routes";
import { authRouter } from "./routes/auth.routes";
<<<<<<< HEAD
=======
import aiRoutes from "./routes/ai.routes";
import { requireAuth } from "./middleware/auth.middleware";
>>>>>>> 0378d05a57b015d813c4c194c226eb231a3eccbc

export function createApp() {
  const app = express();

<<<<<<< HEAD
  app.use(cors());
=======
  app.use(cors({
    origin: "http://localhost:3000",
    credentials: true,
  }));
>>>>>>> 0378d05a57b015d813c4c194c226eb231a3eccbc
  app.use(express.json());

  app.get("/", (_req, res) => {
    res.send("Chat server is running");
  });

  app.use("/auth", authRouter);
  app.use("/upload", uploadRouter);
<<<<<<< HEAD
=======
  app.use("/api/ai", requireAuth, aiRoutes);
>>>>>>> 0378d05a57b015d813c4c194c226eb231a3eccbc

  return app;
}