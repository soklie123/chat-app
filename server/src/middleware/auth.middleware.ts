import { Socket } from "socket.io";
import { verifyToken } from "../utils/jwt";

export function socketAuthMiddleware(
  socket: Socket,
  next: (err?: Error) => void
) {
  const token = socket.handshake.auth?.token as string | undefined;

  if (!token) {
    return next(new Error("Authentication error: no token provided"));
  }

  try {
    const payload = verifyToken(token) as { userId: string; username: string };
    socket.data.userId = payload.userId;
    socket.data.username = payload.username;
    next();
  } catch {
    next(new Error("Authentication error: invalid or expired token"));
  }
}