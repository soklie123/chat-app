import { useState } from "react";
import Avatar from "./Avatar";

export default function ForwardModal({
  text,
  fromUsername,   // ← new — original sender
  onlineUsers,
  rooms,
  username,
  onForwardToDM,
  onForwardToRoom,
  onClose,
}: {
  text:         string;
  fromUsername: string;  // ← new
  onlineUsers:  string[];
  rooms:        { id: string; name: string }[];
  username:     string;
  onForwardToDM:   (to: string, caption: string) => void;
  onForwardToRoom: (roomId: string, caption: string) => void;
  onClose:      () => void;
}) {
  const [tab, setTab]       = useState<"dm" | "room">("dm");
  const [caption, setCaption] = useState("");

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-2xl w-[320px] shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <span className="font-semibold text-gray-800 text-[15px]">Forward Message</span>
          <button title="head" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Original message preview — shows sender */}
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
          <p className="text-[11px] text-slate-400 mb-2 flex items-center gap-1">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 17 20 12 15 7" />
              <path d="M4 18v-2a4 4 0 0 1 4-4h12" />
            </svg>
            Forwarded from
          </p>

          {/* Sender info */}
          <div className="flex items-center gap-2 mb-2">
            <Avatar name={fromUsername} size={24} />
            <span className="text-[12px] font-medium text-gray-700">{fromUsername}</span>
          </div>

          {/* Original message */}
          <div className="bg-white rounded-xl px-3 py-2 border border-gray-100">
            <p className="text-[12px] text-gray-600 line-clamp-2">{text || "📎 File"}</p>
          </div>
        </div>

        {/* Caption input */}
        <div className="px-4 py-2.5 border-b border-gray-100">
          <input
            className="w-full text-[13px] text-gray-700 placeholder:text-slate-400 outline-none bg-transparent"
            placeholder="Add a caption… (optional)"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && onClose()}
          />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setTab("dm")}
            className={`flex-1 py-2.5 text-[13px] font-medium transition-colors ${
              tab === "dm"
                ? "text-[#0088cc] border-b-2 border-[#0088cc]"
                : "text-slate-400"
            }`}
          >
            People
          </button>
          <button
            onClick={() => setTab("room")}
            className={`flex-1 py-2.5 text-[13px] font-medium transition-colors ${
              tab === "room"
                ? "text-[#0088cc] border-b-2 border-[#0088cc]"
                : "text-slate-400"
            }`}
          >
            Rooms
          </button>
        </div>

        {/* List */}
        <div className="max-h-[180px] overflow-y-auto py-2">
          {tab === "dm" ? (
            onlineUsers.filter((u) => u !== username).length === 0 ? (
              <p className="text-center text-slate-400 text-sm py-4">No other users online</p>
            ) : (
              onlineUsers.filter((u) => u !== username).map((u) => (
                <button
                  key={u}
                  onClick={() => { onForwardToDM(u, caption); onClose(); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
                >
                  <Avatar name={u} size={32} />
                  <span className="text-[13px] text-gray-800">{u}</span>
                  {/* Send arrow */}
                  <svg className="ml-auto text-slate-300" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              ))
            )
          ) : (
            rooms.map((r) => (
              <button
                key={r.id}
                onClick={() => { onForwardToRoom(r.id, caption); onClose(); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-[#0088cc]/10 flex items-center justify-center text-[#0088cc] text-[13px] font-medium">
                  #
                </div>
                <span className="text-[13px] text-gray-800">{r.name}</span>
                <svg className="ml-auto text-slate-300" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            ))
          )}
        </div>

        {/* Cancel button */}
        <div className="px-4 py-3 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-2 rounded-xl text-[13px] text-slate-500 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}