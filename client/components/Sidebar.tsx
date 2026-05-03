import { useState } from "react";
import { DMConversation } from "../types/chat";
import DMList from "./DMList";

type Room = { id: string; name: string; memberCount: number };

export default function Sidebar({
  rooms,
  currentRoom,
  username,
  onJoin,
  onCreate,
  onLogout,
  onlineUsers,
  conversations,
  activeDM,
  onOpenDM,
}: {
  rooms: Room[];
  currentRoom: string;
  username: string;
  onJoin: (id: string) => void;
  onCreate: (name: string) => void;
  onLogout: () => void;
  onlineUsers: string[];
  conversations: DMConversation[];
  activeDM: string | null;
  onOpenDM: (username: string) => void;
}) {
  const [creating, setCreating] = useState(false);
  const [newRoom, setNewRoom]   = useState("");

  const handleCreate = () => {
    if (!newRoom.trim()) return;
    onCreate(newRoom.trim());
    setNewRoom("");
    setCreating(false);
  };

  // Total unread across all DMs
  const totalUnread = conversations.reduce((sum, c) => sum + c.unread, 0);

  return (
    <div className="w-[220px] h-full bg-[#1e2a35] flex flex-col flex-shrink-0">

      {/* Title */}
      <div className="px-4 py-4 border-b border-white/10">
        <div className="text-white font-semibold text-[15px]">💬 ChatApp</div>
        <div className="text-white/40 text-[11px] mt-0.5">@{username}</div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3">

        {/* Rooms */}
        <div className="text-white/40 text-[10px] uppercase tracking-widest px-2 mb-2">
          Rooms
        </div>
        {rooms.map((room) => (
          <button
            key={room.id}
            onClick={() => onJoin(room.id)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm mb-0.5 transition-all ${
              currentRoom === room.id && !activeDM
                ? "bg-[#0088cc] text-white"
                : "text-white/60 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span># {room.name}</span>
            {room.memberCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                currentRoom === room.id && !activeDM ? "bg-white/20" : "bg-white/10"
              }`}>
                {room.memberCount}
              </span>
            )}
          </button>
        ))}

        {/* Create room */}
        {creating ? (
          <div className="mt-2 px-2">
            <input
              autoFocus
              className="w-full px-3 py-2 rounded-lg bg-white/10 text-white text-sm outline-none placeholder:text-white/30 border border-white/20 focus:border-[#0088cc]"
              placeholder="room-name"
              value={newRoom}
              onChange={(e) => setNewRoom(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") setCreating(false);
              }}
            />
            <div className="flex gap-1.5 mt-1.5">
              <button onClick={handleCreate} className="flex-1 py-1.5 rounded-lg bg-[#0088cc] text-white text-xs hover:bg-[#0077b6]">Create</button>
              <button onClick={() => setCreating(false)} className="flex-1 py-1.5 rounded-lg bg-white/10 text-white/60 text-xs hover:bg-white/20">Cancel</button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setCreating(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/10 text-sm mt-1 transition-all"
          >
            <span className="text-lg leading-none">+</span>
            <span>New Room</span>
          </button>
        )}

        {/* Online users — click to DM */}
        {onlineUsers.filter((u) => u !== username).length > 0 && (
          <div className="mt-4">
            <div className="text-white/40 text-[10px] uppercase tracking-widest px-2 mb-2">
              Online
            </div>
            {onlineUsers
              .filter((u) => u !== username)
              .map((u) => (
                <button
                  key={u}
                  onClick={() => onOpenDM(u)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-white/60 hover:bg-white/10 hover:text-white text-sm transition-all"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                  {u}
                </button>
              ))}
          </div>
        )}

        {/* DM conversations */}
        <DMList
          conversations={conversations}
          activeDM={activeDM}
          onOpen={onOpenDM}
          onlineUsers={onlineUsers}
        />
      </div>

      {/* Logout */}
      <div className="px-3 py-3 border-t border-white/10">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-white/40 hover:text-red-400 hover:bg-white/10 text-sm transition-all"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Logout
          {totalUnread > 0 && (
            <span className="ml-auto w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              {totalUnread > 9 ? "9+" : totalUnread}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}