import { Router } from "express";
import { User } from "../models/User";
import { hashPassword, comparePassword } from "../utils/password";
import { signToken } from "../utils/jwt";

export const authRouter = Router();

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /auth/register
authRouter.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body ?? {};

    if (!username || !email || !password) {
      res.status(400).json({ error: "Username, email and password are required." });
      return;
    }

    if (!USERNAME_REGEX.test(username)) {
      res.status(400).json({
        error: "Username must be 3-20 characters: letters, numbers, underscores only.",
      });
      return;
    }

    if (!EMAIL_REGEX.test(email)) {
      res.status(400).json({ error: "Please provide a valid email address." });
      return;
    }

    if (typeof password !== "string" || password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters." });
      return;
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const existing = await User.findOne({
      $or: [{ username }, { email: normalizedEmail }],
    });

    if (existing) {
      if (existing.username === username) {
        res.status(409).json({ error: "Username is already taken." });
        return;
      }
      res.status(409).json({ error: "An account with this email already exists." });
      return;
    }

    const passwordHash = await hashPassword(password);

    const user = await User.create({
      username,
      email: normalizedEmail,
      passwordHash,
    });

    const token = signToken({ userId: user._id.toString(), username: user.username });

    res.status(201).json({
      token,
      user: { username: user.username, email: user.email },
    });
  } catch (err: any) {
    console.error("Register error:", err?.message ?? err);
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
});

// POST /auth/login
authRouter.post("/login", async (req, res) => {
  try {
    const { identifier, password } = req.body ?? {};

    if (!identifier || !password) {
      res.status(400).json({ error: "Username/email and password are required." });
      return;
    }

    const normalized = String(identifier).trim().toLowerCase();

    const user = await User.findOne({
      $or: [{ username: identifier }, { email: normalized }],
    });

    if (!user) {
      res.status(401).json({ error: "Invalid credentials." });
      return;
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials." });
      return;
    }

    user.lastSeen = new Date();
    await user.save();

    const token = signToken({ userId: user._id.toString(), username: user.username });

    res.json({
      token,
      user: { username: user.username, email: user.email },
    });
  } catch (err: any) {
    console.error("Login error:", err?.message ?? err);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});

// GET /auth/me  (used by frontend to validate a stored token on app load)
authRouter.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      res.status(401).json({ error: "No token provided." });
      return;
    }

    const { verifyToken } = await import("../utils/jwt.js");
    const payload = verifyToken(token);

    const user = await User.findById(payload.userId);
    if (!user) {
      res.status(401).json({ error: "User not found." });
      return;
    }

    res.json({ user: { username: user.username, email: user.email } });
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token." });
  }
});