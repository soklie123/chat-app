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
  } catch (err: unknown) {                                          // ✅ unknown instead of any
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
    }}>

      {/* ── LEFT panel — unchanged branding ── */}
      <div style={{
        flex: "0 0 45%",
        background: "linear-gradient(145deg, #38bdf8 0%, #818cf8 60%, #6366f1 100%)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "52px 56px",
        overflow: "hidden",
      }}>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "40px", height: "40px", borderRadius: "12px",
            background: "rgba(255,255,255,0.22)",
            display: "flex", alignItems: "center", justifyContent: "center",
            backdropFilter: "blur(4px)",
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <span style={{ color: "white", fontWeight: 700, fontSize: "18px", letterSpacing: "-0.3px" }}>ChatApp</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "18px", maxWidth: "460px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "12px" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "rgba(255,255,255,0.3)", flexShrink: 0 }} />
            <div style={{
              background: "rgba(255,255,255,0.22)", color: "white",
              fontSize: "15px", padding: "13px 20px",
              borderRadius: "22px 22px 22px 5px",
              boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
            }}>
              Hey, what&apos;s up! 👋
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "12px", flexDirection: "row-reverse" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "rgba(255,255,255,0.3)", flexShrink: 0 }} />
            <div style={{
              background: "rgba(255,255,255,0.35)", color: "white",
              fontSize: "15px", padding: "13px 20px",
              borderRadius: "22px 22px 5px 22px",
              boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
            }}>
              Nothing much, you? 😄
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "12px" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "rgba(255,255,255,0.3)", flexShrink: 0 }} />
            <div style={{
              background: "rgba(255,255,255,0.22)", color: "white",
              fontSize: "15px", padding: "13px 20px",
              borderRadius: "22px 22px 22px 5px",
              boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
            }}>
              Just joined the chat! 🎉
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "12px", flexDirection: "row-reverse" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "rgba(255,255,255,0.3)", flexShrink: 0 }} />
            <div style={{
              background: "rgba(255,255,255,0.15)",
              padding: "13px 20px",
              borderRadius: "22px 22px 5px 22px",
              display: "flex", gap: "6px", alignItems: "center",
            }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "rgba(255,255,255,0.9)", display: "inline-block" }} />
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "rgba(255,255,255,0.6)", display: "inline-block" }} />
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "rgba(255,255,255,0.3)", display: "inline-block" }} />
            </div>
          </div>
        </div>

        <div>
          <h2 style={{ color: "white", fontSize: "32px", fontWeight: 800, margin: "0 0 12px", letterSpacing: "-1px", lineHeight: 1.2 }}>
            Connect instantly.
          </h2>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "15px", lineHeight: 1.7, margin: 0, maxWidth: "400px" }}>
            Real-time chat with people around you. Create an account to get started.
          </p>
        </div>
      </div>

      {/* ── RIGHT panel — form ── */}
      <div style={{
        flex: "0 0 60%",
        background: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px",
      }}>
        <div style={{ width: "100%", maxWidth: "380px" }}>

          <div style={{ marginBottom: "32px" }}>
            <h1 style={{ fontSize: "32px", fontWeight: 800, color: "#0f172a", margin: "0 0 10px", letterSpacing: "-1px" }}>
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
            display: "flex", gap: "4px", background: "#f1f5f9",
            borderRadius: "12px", padding: "4px", marginBottom: "28px",
          }}>
            {(["login", "register"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                style={{
                  flex: 1, padding: "10px", borderRadius: "9px", border: "none",
                  fontSize: "14px", fontWeight: 700, cursor: "pointer",
                  background: mode === m ? "white" : "transparent",
                  color: mode === m ? "#0f172a" : "#94a3b8",
                  boxShadow: mode === m ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
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
              fontSize: "13px", color: "#dc2626", background: "#fef2f2",
              border: "1px solid #fecaca", borderRadius: "10px",
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
                : "#e2e8f0",
              color: isValid && !submitting ? "white" : "#94a3b8",
              boxShadow: isValid && !submitting ? "0 8px 24px rgba(99,102,241,0.35)" : "none",
              transition: "all 0.2s",
              marginTop: "4px",
            }}
          >
            {submitting
              ? "Please wait…"
              : mode === "login" ? "Log In →" : "Create Account →"}
          </button>

          <p style={{ fontSize: "12px", color: "#cbd5e1", textAlign: "center", marginTop: "20px" }}>
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
  border: "2px solid #e2e8f0",
  background: "#f8fafc",
  outline: "none",
  fontSize: "16px",
  color: "#1e293b",
  boxSizing: "border-box",
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