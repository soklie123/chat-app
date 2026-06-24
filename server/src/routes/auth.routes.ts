import { Router } from "express";
import { User } from "../models/User";
import { hashPassword, comparePassword } from "../utils/password";
import { signToken } from "../utils/jwt";
import { upload, uploadToCloudinary } from "../cloudinary";
import { requireAuth } from "../middleware/auth.middleware";
import { Server } from "socket.io";
export const authRouter = Router();

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function publicUser(user: any) {
  return {
    username: user.username,
    email: user.email,
    bio: user.bio ?? "",
    avatarUrl: user.avatarUrl ?? "",
    lastSeen: user.lastSeen,
    createdAt: user.createdAt,
  };
}

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
      user: publicUser(user),
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
      user: publicUser(user),
    });
  } catch (err: any) {
    console.error("Login error:", err?.message ?? err);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});

// GET /auth/me
authRouter.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(401).json({ error: "User not found." });
      return;
    }

    res.json({ user: publicUser(user) });
  } catch (err: any) {
    console.error("Me error:", err?.message ?? err);
    res.status(500).json({ error: "Failed to load profile." });
  }
});

// PATCH /auth/profile  (multipart/form-data: optional "avatar" file, optional "bio" text field)
authRouter.patch("/profile", requireAuth, upload.single("avatar"), async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(401).json({ error: "User not found." });
      return;
    }

    if (typeof req.body?.bio === "string") {
      user.bio = req.body.bio.slice(0, 140);
    }

    const file = req.file as Express.Multer.File | undefined;
    if (file) {
      const { url } = await uploadToCloudinary(file.buffer, file.mimetype, file.originalname);
      user.avatarUrl = url;
    }

   await user.save();

const io = req.app.get("io") as Server;

io.emit("user_profile_updated", {
  username: user.username,
  avatarUrl: user.avatarUrl ?? "",
  bio: user.bio ?? "",
});


    res.json({ user: publicUser(user) });
  } catch (err: any) {
    console.error("Update profile error:", err?.message ?? err);
    res.status(400).json({ error: "Failed to update profile." });
  }
});

// PATCH /auth/change-password
authRouter.patch("/change-password", requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body ?? {};

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: "Current and new password are required." });
      return;
    }

    if (typeof newPassword !== "string" || newPassword.length < 6) {
      res.status(400).json({ error: "New password must be at least 6 characters." });
      return;
    }

    const user = await User.findById(req.userId);
    if (!user) {
      res.status(401).json({ error: "User not found." });
      return;
    }

    const valid = await comparePassword(currentPassword, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Current password is incorrect." });
      return;
    }

    user.passwordHash = await hashPassword(newPassword);
    await user.save();

    res.json({ success: true });
  } catch (err: any) {
    console.error("Change password error:", err?.message ?? err);
    res.status(400).json({ error: "Failed to change password." });
  }
});