import { useState } from "react";

const MIN_LENGTH = 3;
const MAX_LENGTH = 20;

export default function UsernameGate({ onJoin }: {onJoin: (name: string) => void}) {
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
    <div className="h-screen bg-[#d5e3eb] flex justify-center items-center">
      <div className="bg-white rounded-[24px] shadow-[0_20px_60px_rgba(0,136,204,0.15)] p-10 w-[340px] flex flex-col items-center gap-6">

        <div className="w-16 h-16 rounded-2xl bg-[#0088cc] flex items-center justify-center shadow-[0_8px_24px_rgba(0,136,204,0.35)]">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>

        <div className="text-center">
          <h1 className="text-[22px] font-semibold text-gray-900 tracking-tight">General Chat</h1>
          <p className="text-sm text-slate-400 mt-1">Pick a username to get started</p>
        </div>

        <div className="w-full flex flex-col gap-1.5">
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border bg-[#f7f9fb] transition-all ${
            error
              ? "border-red-400 ring-2 ring-red-400/20"
              : touched && isValid
              ? "border-green-400 ring-2 ring-green-400/20"
              : "border-gray-200 focus-within:border-[#0088cc] focus-within:ring-2 focus-within:ring-[#0088cc]/20"
          }`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 flex-shrink-0">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <input
              autoFocus
              className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-slate-400"
              placeholder="e.g. cool_user42"
              value={value}
              maxLength={MAX_LENGTH}
              onChange={(e) => { setValue(e.target.value); setTouched(true); }}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
            <span className={`text-[11px] flex-shrink-0 tabular-nums ${
              trimmed.length > MAX_LENGTH ? "text-red-400" : "text-slate-300"
            }`}>
              {trimmed.length}/{MAX_LENGTH}
            </span>
          </div>
          <div className={`text-[12px] text-red-500 px-1 transition-all ${error ? "opacity-100" : "opacity-0"}`} style={{ minHeight: "18px" }}>
            {error ?? ""}
          </div>
        </div>

        <button
          onClick={submit}
          className={`w-full py-3 rounded-xl text-sm font-medium text-white transition-all active:scale-[0.98] ${
            isValid
              ? "bg-[#0088cc] hover:bg-[#0077b6] shadow-[0_4px_14px_rgba(0,136,204,0.35)]"
              : "bg-slate-300 cursor-not-allowed"
          }`}
        >
          Join Chat →
        </button>

        <p className="text-[11px] text-slate-300 text-center -mt-2">
          Letters, numbers and underscores only · 3–20 chars
        </p>
      </div>
    </div>
  );
}