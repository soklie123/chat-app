import { Socket } from "socket.io";
import { Request, Response, NextFunction } from "express";
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

// Augment Express's Request type so req.userId / req.username are typed
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      username?: string;
    }
  }
}

// HTTP middleware — protects any route it's attached to.
// Trims stray whitespace and tolerates "bearer"/"Bearer" casing so a
// slightly malformed header from the client doesn't produce a cryptic
// "jwt malformed" error with no context.
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const raw = req.headers.authorization;

  if (!raw || typeof raw !== "string") {
    res.status(401).json({ error: "No token provided." });
    return;
  }

  const match = raw.trim().match(/^Bearer\s+(.+)$/i);
  const token = match ? match[1].trim() : null;

  if (!token) {
    res.status(401).json({ error: "No token provided." });
    return;
  }

  try {
    const payload = verifyToken(token) as { userId: string; username: string };
    req.userId = payload.userId;
    req.username = payload.username;
    next();
  } catch (err: any) {
    console.error("Auth middleware error:", err?.message ?? err);
    res.status(401).json({ error: "Invalid or expired token." });
  }
}



//guards every socket connection