import { useState } from "react";
import { registerRequest, loginRequest, saveToken, AuthUser } from "../../lib/api";

const USERNAME_MIN = 3;
const USERNAME_MAX = 20;

type Mode = "login" | "register";

export default function AuthGate({
  onAuthed,
}: {
  onAuthed: (user: AuthUser, token: string) => void;
}) {
  const [mode, setMode] = useState<Mode>("login");

  // shared
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // login
  const [identifier, setIdentifier] = useState("");

  // register
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  const usernameError = (() => {
    if (mode !== "register" || !username) return null;
    const trimmed = username.trim();
    if (trimmed.length < USERNAME_MIN) return `At least ${USERNAME_MIN} characters.`;
    if (trimmed.length > USERNAME_MAX) return `Max ${USERNAME_MAX} characters.`;
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) return "Only letters, numbers and underscores.";
    return null;
  })();

  const canSubmitLogin = identifier.trim().length > 0 && password.length >= 6;
  const canSubmitRegister =
    !usernameError &&
    username.trim().length >= USERNAME_MIN &&
    /\S+@\S+\.\S+/.test(email) &&
    password.length >= 6;

  const isValid = mode === "login" ? canSubmitLogin : canSubmitRegister;

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setPassword("");
  };

  const submit = async () => {
    if (!isValid || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res =
        mode === "login"
          ? await loginRequest(identifier.trim(), password)
          : await registerRequest(username.trim(), email.trim(), password);

      saveToken(res.token);
      onAuthed(res.user, res.token);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      display: "flex",
      width: "100vw",
      height: "100vh",
      overflow: "hidden",
      fontFamily: "Arial, Helvetica, sans-serif",
      background: "#080d16",
    }}>

      {/* Dynamic Keyframes for the Floating Chat Elements & Emojis */}
      <style>{`
        @keyframes floatOne {
          0% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(30px, -50px) scale(1.15); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes floatTwo {
          0% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(-40px, 40px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes floatEmojiUp {
          0% {
            transform: translateY(105vh) translateX(0) rotate(0deg) scale(0.4);
            opacity: 0;
          }
          10% {
            opacity: 0.35;
          }
          50% {
            transform: translateY(50vh) translateX(25px) rotate(15deg) scale(1);
            opacity: 0.45;
          }
          90% {
            opacity: 0.35;
          }
          100% {
            transform: translateY(-10vh) translateX(-15px) rotate(-10deg) scale(0.7);
            opacity: 0;
          }
        }
        @keyframes gentlePulse {
          0% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.02); opacity: 1; }
          100% { transform: scale(1); opacity: 0.9; }
        }
      `}</style>

      {/* ── LEFT panel — 40% Width with Ambient Mesh Background ── */}
      <div style={{
        flex: "0 0 40%",
        background: "#0b1220", 
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "52px 56px",
        overflow: "hidden",
        position: "relative",
        boxSizing: "border-box",
        borderRight: "1px solid rgba(255, 255, 255, 0.04)"
      }}>
        
        {/* Left Side Ambient mesh glow circles */}
        <div style={{
          position: "absolute", width: "450px", height: "450px", bottom: "-100px", right: "-50px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.14) 0%, rgba(56,189,248,0) 70%)",
          animation: "floatTwo 18s infinite ease-in-out", pointerEvents: "none"
        }} />
        <div style={{
          position: "absolute", width: "400px", height: "400px", top: "-50px", left: "-80px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(56,189,248,0.12) 0%, rgba(99,102,241,0) 70%)",
          animation: "floatOne 14s infinite ease-in-out", pointerEvents: "none", animationDelay: "1s"
        }} />

        {/* Left Side Floating Background Emojis */}
        <div style={{ position: "absolute", left: "10%", fontSize: "36px", animation: "floatEmojiUp 12s infinite linear", animationDelay: "0s", pointerEvents: "none", zIndex: 1 }}>💬</div>
        <div style={{ position: "absolute", left: "45%", fontSize: "28px", animation: "floatEmojiUp 16s infinite linear", animationDelay: "4s", pointerEvents: "none", zIndex: 1 }}>👋</div>
        <div style={{ position: "absolute", right: "15%", fontSize: "32px", animation: "floatEmojiUp 14s infinite linear", animationDelay: "8s", pointerEvents: "none", zIndex: 1 }}>✨</div>

        {/* Brand Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", position: "relative", zIndex: 2 }}>
          <div style={{
            width: "40px", height: "40px", borderRadius: "12px",
            background: "linear-gradient(135deg, #38bdf8, #6366f1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 14px rgba(99,102,241,0.4)"
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <span style={{ color: "white", fontWeight: 700, fontSize: "18px", letterSpacing: "-0.3px" }}>ChatApp</span>
        </div>

        {/* Chat Mockup Centerpiece with Glassmorphism */}
        <div style={{ display: "flex", flexDirection: "column", gap: "18px", maxWidth: "460px", position: "relative", zIndex: 2 }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "12px" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "linear-gradient(135deg, #38bdf8, #818cf8)", flexShrink: 0 }} />
            <div style={{
              background: "rgba(255, 255, 255, 0.05)", color: "#e2e8f0",
              fontSize: "15px", padding: "13px 20px",
              borderRadius: "22px 22px 22px 5px",
              border: "1px solid rgba(255,255,255,0.06)",
              backdropFilter: "blur(8px)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
            }}>
              Hey, what&apos;s up! 👋
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "12px", flexDirection: "row-reverse" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #818cf8)", flexShrink: 0 }} />
            <div style={{
              background: "linear-gradient(135deg, rgba(56,189,248,0.2), rgba(99,102,241,0.2))", color: "#ffffff",
              fontSize: "15px", padding: "13px 20px",
              borderRadius: "22px 22px 5px 22px",
              border: "1px solid rgba(56,189,248,0.2)",
              backdropFilter: "blur(8px)",
              boxShadow: "0 4px 16px rgba(99,102,241,0.15)",
              animation: "gentlePulse 4s infinite ease-in-out"
            }}>
              Nothing much, you? 😄
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "12px" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "linear-gradient(135deg, #38bdf8, #818cf8)", flexShrink: 0 }} />
            <div style={{
              background: "rgba(255, 255, 255, 0.05)", color: "#e2e8f0",
              fontSize: "15px", padding: "13px 20px",
              borderRadius: "22px 22px 22px 5px",
              border: "1px solid rgba(255,255,255,0.06)",
              backdropFilter: "blur(8px)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
            }}>
              Just joined the chat! 🎉
            </div>
          </div>
        </div>

        {/* Bottom Heading Info */}
        <div style={{ position: "relative", zIndex: 2 }}>
          <h2 style={{ color: "white", fontSize: "32px", fontWeight: 800, margin: "0 0 12px", letterSpacing: "-1px", lineHeight: 1.2 }}>
            Connect instantly.
          </h2>
          <p style={{ color: "#94a3b8", fontSize: "15px", lineHeight: 1.7, margin: 0, maxWidth: "400px" }}>
            Real-time chat with people around you. Create an account to get started.
          </p>
        </div>
      </div>

      {/* ── RIGHT panel — 60% Width layout with Form Card ── */}
      <div style={{
        flex: "0 0 60%",
        background: "#080d16", 
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px",
        position: "relative",
        overflow: "hidden",
        boxSizing: "border-box"
      }}>
        
        {/* Right Side Deep Ambient Mesh Glows */}
        <div style={{
          position: "absolute", width: "500px", height: "500px", top: "-100px", right: "-50px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(56,189,248,0.18) 0%, rgba(99,102,241,0) 70%)",
          animation: "floatOne 16s infinite ease-in-out", pointerEvents: "none"
        }} />
        <div style={{
          position: "absolute", width: "550px", height: "550px", bottom: "-150px", left: "-100px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(56,189,248,0) 70%)",
          animation: "floatTwo 20s infinite ease-in-out", pointerEvents: "none", animationDelay: "1.5s"
        }} />

        {/* Right Side Floating Background Emojis */}
        <div style={{ position: "absolute", left: "15%", fontSize: "26px", animation: "floatEmojiUp 11s infinite linear", animationDelay: "2s", pointerEvents: "none", zIndex: 1 }}>🚀</div>
        <div style={{ position: "absolute", left: "40%", fontSize: "34px", animation: "floatEmojiUp 15s infinite linear", animationDelay: "6s", pointerEvents: "none", zIndex: 1 }}>💬</div>
        <div style={{ position: "absolute", right: "20%", fontSize: "30px", animation: "floatEmojiUp 13s infinite linear", animationDelay: "1s", pointerEvents: "none", zIndex: 1 }}>🔥</div>
        <div style={{ position: "absolute", right: "45%", fontSize: "24px", animation: "floatEmojiUp 17s infinite linear", animationDelay: "9s", pointerEvents: "none", zIndex: 1 }}>🎉</div>

        {/* Form Box Card container */}
        <div style={{ 
          width: "100%", 
          maxWidth: "400px", 
          position: "relative", 
          zIndex: 2,
          background: "rgba(13, 22, 38, 0.75)",
          padding: "40px",
          borderRadius: "24px",
          border: "1px solid rgba(255, 255, 255, 0.07)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.45)"
        }}>

          <div style={{ marginBottom: "32px" }}>
            <h1 style={{ fontSize: "32px", fontWeight: 800, color: "#ffffff", margin: "0 0 10px", letterSpacing: "-1px" }}>
              {mode === "login" ? "Welcome back 👋" : "Create account 🚀"}
            </h1>
            <p style={{ fontSize: "15px", color: "#94a3b8", margin: 0, lineHeight: 1.6 }}>
              {mode === "login"
                ? "Log in to continue the conversation."
                : "Sign up to join the conversation."}
            </p>
          </div>

          {/* Mode toggle */}
          <div style={{
            display: "flex", gap: "4px", background: "rgba(255,255,255,0.05)",
            borderRadius: "12px", padding: "4px", marginBottom: "28px",
          }}>
            {(["login", "register"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                style={{
                  flex: 1, padding: "12px", borderRadius: "9px", border: "none",
                  fontSize: "14px", fontWeight: 700, cursor: "pointer",
                  background: mode === m ? "rgba(255,255,255,0.1)" : "transparent",
                  color: mode === m ? "#ffffff" : "#64748b",
                  boxShadow: mode === m ? "0 4px 12px rgba(0,0,0,0.25)" : "none",
                  transition: "all 0.2s",
                }}
              >
                {m === "login" ? "Log In" : "Sign Up"}
              </button>
            ))}
          </div>

          {/* ── Register-only: Username ── */}
          {mode === "register" && (
            <Field label="Username">
              <input
                style={inputStyle}
                placeholder="e.g. cool_user42"
                value={username}
                maxLength={USERNAME_MAX}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
              />
              {usernameError && <FieldError text={usernameError} />}
            </Field>
          )}

          {/* ── Register-only: Email ── */}
          {mode === "register" && (
            <Field label="Email">
              <input
                style={inputStyle}
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
              />
            </Field>
          )}

          {/* ── Login-only: identifier ── */}
          {mode === "login" && (
            <Field label="Username or Email">
              <input
                autoFocus
                style={inputStyle}
                placeholder="cool_user42 or you@example.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
              />
            </Field>
          )}

          {/* ── Password (both modes) ── */}
          <Field label="Password">
            <input
              style={inputStyle}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </Field>

          {error && (
            <div style={{
              fontSize: "13px", color: "#f87171", background: "rgba(220,38,38,0.08)",
              border: "1px solid rgba(248,113,113,0.18)", borderRadius: "10px",
              padding: "10px 14px", marginBottom: "16px",
            }}>
              {error}
            </div>
          )}

          <button
            onClick={submit}
            disabled={!isValid || submitting}
            style={{
              width: "100%", padding: "16px",
              borderRadius: "14px", border: "none",
              fontSize: "16px", fontWeight: 700,
              cursor: isValid && !submitting ? "pointer" : "not-allowed",
              background: isValid && !submitting
                ? "linear-gradient(135deg, #38bdf8, #6366f1)"
                : "rgba(255,255,255,0.04)",
              color: isValid && !submitting ? "white" : "#475569",
              boxShadow: isValid && !submitting ? "0 8px 24px rgba(99,102,241,0.35)" : "none",
              transition: "all 0.2s",
              marginTop: "4px",
            }}
          >
            {submitting
              ? "Please wait…"
              : mode === "login" ? "Log In →" : "Create Account →"}
          </button>

          <p style={{ fontSize: "12px", color: "#475569", textAlign: "center", marginTop: "20px" }}>
            {mode === "login" ? "Password must be at least 6 characters." : "Letters, numbers and underscores · 3–20 chars"}
          </p>
        </div>
      </div>

    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 18px",
  borderRadius: "14px",
  border: "2px solid rgba(255,255,255,0.06)",
  background: "rgba(255,255,255,0.02)",
  outline: "none",
  fontSize: "16px",
  color: "#ffffff",
  boxSizing: "border-box",
  transition: "all 0.2s",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <label style={{
        display: "block", fontSize: "12px", fontWeight: 700,
        color: "#64748b", letterSpacing: "0.08em",
        textTransform: "uppercase", marginBottom: "10px",
      }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function FieldError({ text }: { text: string }) {
  return (
    <div style={{ fontSize: "13px", color: "#f87171", marginTop: "6px", paddingLeft: "2px" }}>
      {text}
    </div>
  );
}