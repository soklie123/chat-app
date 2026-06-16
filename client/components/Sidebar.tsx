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
  const [newRoom, setNewRoom] = useState("");

  const handleCreate = () => {
    if (!newRoom.trim()) return;
    onCreate(newRoom.trim());
    setNewRoom("");
    setCreating(false);
  };

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread, 0);

  return (
    <div className="w-[240px] h-full bg-[#1a2332] flex flex-col flex-shrink-0 border-r border-white/5">

      {/* Header */}
      <div className="px-4 pt-5 pb-4 border-b border-white/8">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-lg bg-[#0088cc] flex items-center justify-center flex-shrink-0">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <span className="text-white font-semibold text-[15px] tracking-tight">ChatApp</span>
        </div>
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/5">
          <div className="w-6 h-6 rounded-full bg-[#0088cc] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
            {username[0]?.toUpperCase()}
          </div>
          <span className="text-white/60 text-[12px] truncate">@{username}</span>
          <span className="ml-auto w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4">

        {/* Rooms */}
        <div>
          <div className="text-white/30 text-[10px] uppercase tracking-widest px-2 mb-1.5 font-medium">
            Rooms
          </div>
          {rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => onJoin(room.id)}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-[13px] mb-0.5 transition-all ${
                currentRoom === room.id && !activeDM
                  ? "bg-[#0088cc] text-white"
                  : "text-white/50 hover:bg-white/8 hover:text-white/80"
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="text-white/30">#</span>
                {room.name}
              </span>
              {room.memberCount > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                  currentRoom === room.id && !activeDM
                    ? "bg-white/20 text-white"
                    : "bg-white/10 text-white/40"
                }`}>
                  {room.memberCount}
                </span>
              )}
            </button>
          ))}

          {creating ? (
            <div className="mt-1.5 px-1">
              <input
                autoFocus
                className="w-full px-3 py-2 rounded-lg bg-white/8 text-white text-[13px] outline-none placeholder:text-white/25 border border-white/15 focus:border-[#0088cc] transition-colors"
                placeholder="room-name"
                value={newRoom}
                onChange={(e) => setNewRoom(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                  if (e.key === "Escape") setCreating(false);
                }}
              />
              <div className="flex gap-1.5 mt-1.5">
                <button onClick={handleCreate} className="flex-1 py-1.5 rounded-lg bg-[#0088cc] text-white text-[12px] font-medium hover:bg-[#0077b6] transition-colors">Create</button>
                <button onClick={() => setCreating(false)} className="flex-1 py-1.5 rounded-lg bg-white/8 text-white/50 text-[12px] hover:bg-white/15 transition-colors">Cancel</button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setCreating(true)}
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/8 text-[13px] mt-0.5 transition-all"
            >
              <span className="text-base leading-none">+</span>
              <span>New Room</span>
            </button>
          )}
        </div>

        {/* Online users */}
        {onlineUsers.filter((u) => u !== username).length > 0 && (
          <div>
            <div className="text-white/30 text-[10px] uppercase tracking-widest px-2 mb-1.5 font-medium">
              Online
            </div>
            {onlineUsers.filter((u) => u !== username).map((u) => (
              <button
                key={u}
                onClick={() => onOpenDM(u)}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-white/50 hover:bg-white/8 hover:text-white/80 text-[13px] transition-all"
              >
                <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                {u}
              </button>
            ))}
          </div>
        )}

        {/* DMs */}
        <DMList
          conversations={conversations}
          activeDM={activeDM}
          onOpen={onOpenDM}
          onlineUsers={onlineUsers}
        />
      </div>

      {/* Logout */}
      <div className="px-3 py-3 border-t border-white/8">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-white/8 text-[13px] transition-all"
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