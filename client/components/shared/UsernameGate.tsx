import { useState } from "react";

const MIN_LENGTH = 3;
const MAX_LENGTH = 20;

export default function UsernameGate({ onJoin }: { onJoin: (name: string) => void }) {
  const [value, setValue] = useState("");
  const [touched, setTouched] = useState(false);

  const trimmed = value.trim();

  const error = (() => {
    if (!touched) return null;
    if (trimmed.length === 0) return "Username can't be empty.";
    if (trimmed.length < MIN_LENGTH) return `At least ${MIN_LENGTH} characters required.`;
    if (trimmed.length > MAX_LENGTH) return `Max ${MAX_LENGTH} characters allowed.`;
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) return "Only letters, numbers and underscores.";
    return null;
  })();

  const isValid =
    trimmed.length >= MIN_LENGTH &&
    trimmed.length <= MAX_LENGTH &&
    /^[a-zA-Z0-9_]+$/.test(trimmed);

  const submit = () => {
    setTouched(true);
    if (isValid) onJoin(trimmed);
  };

  return (
    <div style={{
      display: "flex",
      width: "100vw",
      height: "100vh",
      overflow: "hidden",
      fontFamily: "Arial, Helvetica, sans-serif",
    }}>

      {/* ── LEFT 55% ── */}
      <div style={{
        flex: "0 0 45%",
        background: "linear-gradient(145deg, #38bdf8 0%, #818cf8 60%, #6366f1 100%)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "52px 56px",
        overflow: "hidden",
      }}>

        {/* Logo */}
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

        {/* Chat bubbles — center of panel */}
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

        {/* Tagline */}
        <div>
          <h2 style={{ color: "white", fontSize: "32px", fontWeight: 800, margin: "0 0 12px", letterSpacing: "-1px", lineHeight: 1.2 }}>
            Connect instantly.
          </h2>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "15px", lineHeight: 1.7, margin: 0, maxWidth: "400px" }}>
            Real-time chat with people around you. No account needed — just pick a name and jump in.
          </p>
        </div>
      </div>

      {/* ── RIGHT 45% ── */}
      <div style={{
       flex: "0 0 60%",
        background: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px",
      }}>
        <div style={{ width: "100%", maxWidth: "380px" }}>

          <div style={{ marginBottom: "40px" }}>
            <h1 style={{ fontSize: "32px", fontWeight: 800, color: "#0f172a", margin: "0 0 10px", letterSpacing: "-1px" }}>
              Welcome 👋
            </h1>
            <p style={{ fontSize: "15px", color: "#94a3b8", margin: 0, lineHeight: 1.6 }}>
              Pick a username to join the conversation.
            </p>
          </div>

          <div style={{ marginBottom: "10px" }}>
            <label style={{
              display: "block", fontSize: "12px", fontWeight: 700,
              color: "#64748b", letterSpacing: "0.08em",
              textTransform: "uppercase", marginBottom: "10px",
            }}>
              Username
            </label>
            <div style={{
              display: "flex", alignItems: "center", gap: "10px",
              padding: "14px 18px", borderRadius: "14px",
              border: error
                ? "2px solid #f87171"
                : touched && isValid
                ? "2px solid #34d399"
                : "2px solid #e2e8f0",
              background: "#f8fafc",
              boxShadow: error
                ? "0 0 0 4px rgba(248,113,113,0.1)"
                : touched && isValid
                ? "0 0 0 4px rgba(52,211,153,0.1)"
                : "0 0 0 4px transparent",
              transition: "all 0.2s",
            }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <input
                autoFocus
                style={{
                  flex: 1, background: "transparent", border: "none",
                  outline: "none", fontSize: "16px", color: "#1e293b",
                }}
                placeholder="e.g. cool_user42"
                value={value}
                maxLength={MAX_LENGTH}
                onChange={(e) => { setValue(e.target.value); setTouched(true); }}
                onKeyDown={(e) => e.key === "Enter" && submit()}
              />
              <span style={{ fontSize: "12px", color: trimmed.length > MAX_LENGTH ? "#f87171" : "#cbd5e1", flexShrink: 0 }}>
                {trimmed.length}/{MAX_LENGTH}
              </span>
            </div>
            <div style={{ minHeight: "22px", fontSize: "13px", color: "#f87171", opacity: error ? 1 : 0, transition: "opacity 0.2s", marginTop: "6px", paddingLeft: "2px" }}>
              {error ?? ""}
            </div>
          </div>

          <button
            onClick={submit}
            style={{
              width: "100%", padding: "16px",
              borderRadius: "14px", border: "none",
              fontSize: "16px", fontWeight: 700,
              cursor: isValid ? "pointer" : "not-allowed",
              background: isValid
                ? "linear-gradient(135deg, #38bdf8, #6366f1)"
                : "#e2e8f0",
              color: isValid ? "white" : "#94a3b8",
              boxShadow: isValid ? "0 8px 24px rgba(99,102,241,0.35)" : "none",
              transition: "all 0.2s",
              marginTop: "4px",
            } as React.CSSProperties}
          >
            Join Chat →
          </button>

          <p style={{ fontSize: "12px", color: "#cbd5e1", textAlign: "center", marginTop: "20px" }}>
            Letters, numbers and underscores · 3–20 chars
          </p>
        </div>
      </div>

    </div>
  );
}