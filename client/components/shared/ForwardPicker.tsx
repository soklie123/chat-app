import { useState } from "react";
import Avatar from "./Avatar";

export default function ForwardPicker({
  text,
  fromUsername,
  onlineUsers,
  allUsers = [],
  rooms,
  username,
  onPick,
  onClose,
}: {
  text:         string;
  fromUsername: string;
  onlineUsers:  string[];
  allUsers?: string[];
  rooms:        { id: string; name: string }[];
  username:     string;
  onPick:       (to: string, isRoom: boolean) => void;
  onClose:      () => void;
}) {
  const [tab, setTab] = useState<"dm" | "room">("dm");

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
      <div className="bg-[#17212b] rounded-[18px] w-[300px] shadow-[0_16px_48px_rgba(0,0,0,0.6)] overflow-hidden border border-[#0d1821]">

        {/* Header */}
        <div className="px-4 py-3 border-b border-[#0d1821] flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-semibold text-[15px]">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#5288c1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 17 20 12 15 7" />
              <path d="M4 18v-2a4 4 0 0 1 4-4h12" />
            </svg>
            Forward to…
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-transparent border-none text-[#6c7883] cursor-pointer transition-colors duration-150 hover:bg-[#202b36] hover:text-white"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Original message preview */}
        <div className="px-4 py-3 bg-[#0e1621] border-b border-[#0d1821]">
          <div className="flex items-center gap-1.5 mb-2">
            <Avatar name={fromUsername} size={18} />
            <span className="text-[12px] font-semibold text-[#5288c1]">{fromUsername}</span>
          </div>
          <div className="bg-[#182533] border border-[#101921] rounded-xl px-3 py-2">
            <p className="text-[12px] text-[#8b98a5] line-clamp-2">{text || "📎 File"}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#0d1821]">
          {(["dm", "room"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-[13px] font-semibold transition-colors border-none bg-transparent cursor-pointer ${
                tab === t
                  ? "text-[#5288c1] border-b-2 border-[#5288c1]"
                  : "text-[#6c7883] hover:text-[#8b98a5]"
              }`}
            >
              {t === "dm" ? "People" : "Rooms"}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="max-h-[200px] overflow-y-auto custom-scrollbar py-1.5">
          {tab === "dm" ? (
            allUsers.filter((u) => u !== username).length === 0 ? (
              <p className="text-center text-[#6c7883] text-[13px] py-6">No other users online</p>
            ) : (
              allUsers.filter((u) => u !== username).map((u) => {
                const isOnline = onlineUsers.includes(u);
                return (
                  <button
                    key={u}
                    onClick={() => { onPick(u, false); onClose(); }}
                    className="w-full flex items-center gap-3 px-3.5 py-2 bg-transparent border-none cursor-pointer transition-colors duration-150 hover:bg-[#202b36]"
                  >
                    <div className="relative shrink-0">
                      <Avatar name={u} size={34} />
                      <span className={`absolute bottom-0 right-0 w-[9px] h-[9px] rounded-full border-2 border-[#17212b] ${isOnline ? "bg-[#4ade80]" : "bg-[#6c7883]"}`} />
                    </div>
                    <span className="text-[13.5px] text-[#e8ecf0] font-medium flex-1 text-left">{u}</span>
                    <svg className="text-[#5288c1] shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                );
              })
            )
          ) : (
            rooms.length === 0 ? (
              <p className="text-center text-[#6c7883] text-[13px] py-6">No rooms available</p>
            ) : (
              rooms.map((r) => (
                <button
                  key={r.id}
                  onClick={() => { onPick(r.id, true); onClose(); }}
                  className="w-full flex items-center gap-3 px-3.5 py-2 bg-transparent border-none cursor-pointer transition-colors duration-150 hover:bg-[#202b36]"
                >
                  <div className="w-[34px] h-[34px] rounded-full bg-[#5288c1] flex items-center justify-center shrink-0">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round">
                      <line x1="4" y1="9" x2="20" y2="9" /><line x1="4" y1="15" x2="20" y2="15" />
                      <line x1="10" y1="3" x2="8" y2="21" /><line x1="16" y1="3" x2="14" y2="21" />
                    </svg>
                  </div>
                  <span className="text-[13.5px] text-[#e8ecf0] font-medium flex-1 text-left">{r.name}</span>
                  <svg className="text-[#5288c1] shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              ))
            )
          )}
        </div>

        {/* Cancel */}
        <div className="px-4 py-3 border-t border-[#0d1821]">
          <button
            onClick={onClose}
            className="w-full py-2 rounded-xl text-[13px] font-medium text-[#8b98a5] bg-transparent border border-[#202b36] cursor-pointer transition-colors duration-150 hover:bg-[#202b36] hover:text-[#c5cdd6]"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}