import { useState } from "react";
import Avatar from "./shared/Avatar";

export default function ForwardBar({
  text,
  fromUsername,
  onSend,
  onCancel,
}: {
  text:         string;
  fromUsername: string;
  onSend:       (caption: string) => void;
  onCancel:     () => void;
}) {
  const [caption, setCaption] = useState("");

  return (
    <div className="border-t border-gray-100 bg-white">
      {/* Forward preview */}
      <div className="px-3 pt-2.5 pb-1 flex items-start gap-2">
        {/* Left accent */}
        <div className="w-1 h-full min-h-[36px] bg-[#0088cc] rounded-full flex-shrink-0" />

        <div className="flex-1 min-w-0">
          {/* Forwarded from label */}
          <div className="flex items-center gap-1 mb-1">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0088cc" strokeWidth="2">
              <polyline points="15 17 20 12 15 7" />
              <path d="M4 18v-2a4 4 0 0 1 4-4h12" />
            </svg>
            <span className="text-[11px] text-[#0088cc] font-medium">
              Forwarded from {fromUsername}
            </span>
          </div>

          {/* Original message preview */}
          <p className="text-[12px] text-slate-500 truncate">{text || "📎 File"}</p>
        </div>

        {/* Cancel */}
        <button
          title="cancel"
          onClick={onCancel}
          className="flex-shrink-0 text-slate-400 hover:text-red-400 transition-colors mt-0.5"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Caption input */}
      <div className="flex items-center gap-2 px-3 py-2">
        <input
          autoFocus
          className="flex-1 px-3 py-1.5 rounded-full border border-gray-200 bg-[#f1f3f4] text-sm text-gray-800 outline-none focus:border-[#0088cc] focus:ring-2 focus:ring-[#0088cc]/20 transition-all placeholder:text-gray-400"
          placeholder="Add a caption… (optional)"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSend(caption);
            if (e.key === "Escape") onCancel();
          }}
        />
        <button
          title="caption input"
          onClick={() => onSend(caption)}
          className="w-8 h-8 rounded-full bg-[#0088cc] flex items-center justify-center text-white hover:bg-[#0077b6] active:scale-95 transition-all flex-shrink-0"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}