import "dotenv/config";
import http from "http";
import { Server } from "socket.io";
import { env } from "./config/env";
import { connectDB } from "./db/conn";
import { createApp } from "./app";
import { registerSocketHandlers } from "./sockets";
import { socketAuthMiddleware } from "./middleware/auth.middleware";

async function bootstrap() {
  await connectDB(env.MONGODB_URI);

  const app = createApp();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: "*" },
  });
  app.set("io", io);
  io.use(socketAuthMiddleware);
  registerSocketHandlers(io);

  server.listen(env.PORT, () => {
    console.log(`Server running on http://localhost:${env.PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});