import { useState, useRef, useEffect } from "react";
import Avatar from "../shared/Avatar";
import { UserProfile } from "../../hooks/useChat";
import GroupProfileModal from "../layout/GroupProfileModal";

type RoomSummary = {
  id: string;
  name: string;
  memberCount: number;
  members: string[];
  createdBy: string;
  avatarUrl?: string;
};

export default function RoomHeader({
  room,
  connected,
  onlineUsers,
  currentUsername,
  userProfiles,
  onOpenDM,
  onLeaveGroup,
  onDeleteGroup,
  onDeleteChat,
  onUpdateGroupAvatar,
}: {
  room: RoomSummary;
  connected: boolean;
  onlineUsers: string[];
  currentUsername: string;
  userProfiles?: Record<string, UserProfile>;
  onOpenDM: (username: string) => void;
  onLeaveGroup: () => void;
  onDeleteGroup: () => void;
  onDeleteChat: () => void;
  onUpdateGroupAvatar?: (roomId: string, file: File) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"leave" | "delete" | "clear" | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const safeMembers = room.members ?? [];
  const safeOnline = onlineUsers ?? [];
  const isCreator = room.createdBy === currentUsername;

  const onlineMembers = safeMembers.filter((m) => safeOnline.includes(m));
  const offlineMembers = safeMembers.filter((m) => !safeOnline.includes(m));
  const orderedMembers = [
    ...onlineMembers.filter((m) => m !== currentUsername),
    ...onlineMembers.filter((m) => m === currentUsername),
    ...offlineMembers,
  ];

  const totalCount = safeMembers.length;
  const onlineCount = onlineMembers.length;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleConfirm = () => {
    if (confirmAction === "leave") onLeaveGroup();
    if (confirmAction === "delete") onDeleteGroup();
    if (confirmAction === "clear") onDeleteChat();
    setConfirmAction(null);
    setShowMenu(false);
  };

  return (
    <>
      {showProfile && (
        <GroupProfileModal
          room={room}
          currentUsername={currentUsername}
          onlineUsers={onlineUsers}
          userProfiles={userProfiles ?? {}}
          onClose={() => setShowProfile(false)}
          onOpenDM={(u) => { onOpenDM(u); setShowProfile(false); }}
          onUpdateAvatar={onUpdateGroupAvatar}
        />
      )}

      {/* Top bar */}
      <div className="bg-[#17212b] border-b border-[#0d1821] px-4 py-3 flex items-center gap-3 shrink-0">

        {/* Group avatar — clickable to open profile */}
        <button
          onClick={() => setShowProfile(true)}
          className="shrink-0 bg-transparent border-none cursor-pointer p-0 group"
          title="View group info"
        >
          {room.avatarUrl ? (
            <img
              src={room.avatarUrl}
              alt={room.name}
              className="w-11 h-11 rounded-full object-cover ring-2 ring-transparent group-hover:ring-[#5288c1] transition-all"
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#5288c1] to-[#3a6491] flex items-center justify-center text-white font-semibold text-lg shrink-0 shadow-sm ring-2 ring-transparent group-hover:ring-[#7aabdc] transition-all">
              #
            </div>
          )}
        </button>

        {/* Room name + member count — also clickable */}
        <button
          onClick={() => setShowProfile(true)}
          className="flex-1 min-w-0 bg-transparent border-none cursor-pointer text-left p-0"
        >
          <div className="text-white font-semibold text-[15.5px] truncate leading-tight hover:text-[#e8ecf0] transition-colors">
            {room.name}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`w-[7px] h-[7px] rounded-full shrink-0 ${connected ? "bg-[#4ade80]" : "bg-red-500"}`} />
            {connected ? (
              <span className="text-[12.5px] text-[#8b98a5]">
                {totalCount} member{totalCount === 1 ? "" : "s"}
                {onlineCount > 0 && (
                  <span className="text-[#4ade80]"> · {onlineCount} online</span>
                )}
              </span>
            ) : (
              <span className="text-[12.5px] text-[#8b98a5]">offline</span>
            )}
          </div>
        </button>

        {/* ⋮ Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu((v) => !v)}
            className="w-9 h-9 flex items-center justify-center rounded-full text-[#8b98a5] hover:bg-[#202b36] hover:text-white transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="19" r="1.5" />
            </svg>
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-52 bg-[#17212b] border border-[#0d1821] rounded-2xl shadow-2xl z-50 overflow-hidden py-1.5">
              <button
                onClick={() => { setShowProfile(true); setShowMenu(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#202b36] transition-colors"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#8b98a5" strokeWidth="2" strokeLinecap="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <span className="text-[13.5px] text-[#e8ecf0]">Group info</span>
              </button>

              <div className="h-px bg-[#0d1821] mx-3 my-1" />

              <button
                onClick={() => { setConfirmAction("clear"); setShowMenu(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#202b36] transition-colors"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#8b98a5" strokeWidth="2" strokeLinecap="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14H6L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4h6v2" />
                </svg>
                <span className="text-[13.5px] text-[#e8ecf0]">Clear chat history</span>
              </button>

              <div className="h-px bg-[#0d1821] mx-3 my-1" />

              {!isCreator && (
                <button
                  onClick={() => { setConfirmAction("leave"); setShowMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-red-500/10 transition-colors"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  <span className="text-[13.5px] text-red-400">Leave group</span>
                </button>
              )}

              {isCreator && (
                <button
                  onClick={() => { setConfirmAction("delete"); setShowMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-red-500/10 transition-colors"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14H6L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4h6v2" />
                  </svg>
                  <span className="text-[13.5px] text-red-400">Delete group</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirm dialog */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[#17212b] border border-[#0d1821] rounded-2xl shadow-2xl w-[300px] p-5">
            <div className="text-white font-semibold text-[15px] mb-2">
              {confirmAction === "leave" && "Leave group?"}
              {confirmAction === "delete" && "Delete group?"}
              {confirmAction === "clear" && "Clear chat history?"}
            </div>
            <div className="text-[#8b98a5] text-[13px] mb-5 leading-relaxed">
              {confirmAction === "leave" && "You will no longer see this group or its messages."}
              {confirmAction === "delete" && "This will permanently delete the group and all messages for everyone."}
              {confirmAction === "clear" && (
                isCreator
                  ? "This will clear all messages for everyone in the group."
                  : "This will clear messages only on your side."
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 py-2 rounded-xl bg-[#202b36] text-[#8b98a5] text-[13.5px] hover:bg-[#2c3e50] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-2 rounded-xl bg-red-500 text-white text-[13.5px] font-semibold hover:bg-red-600 transition-colors"
              >
                {confirmAction === "leave" ? "Leave" : confirmAction === "delete" ? "Delete" : "Clear"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Member strip */}
      {safeMembers.length > 0 && (
        <div className="px-3.5 py-2.5 border-b border-[#0d1821] bg-[#17212b] flex items-center gap-4 overflow-x-auto shrink-0">
          {orderedMembers.map((name) => {
            const isOnline = safeOnline.includes(name);
            const isSelf = name === currentUsername;
            const avatarUrl = userProfiles?.[name]?.avatarUrl;
            return (
              <button
                key={name}
                onClick={() => !isSelf && onOpenDM(name)}
                disabled={isSelf}
                className={`flex flex-col items-center gap-1 shrink-0 group ${isSelf ? "cursor-default" : "cursor-pointer"}`}
              >
                <div className="relative">
                  <Avatar name={name} size={36} ring={isOnline} avatarUrl={avatarUrl} />
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#17212b] ${isOnline ? "bg-[#4ade80]" : "bg-[#566372]"}`}
                  />
                </div>
                <span className={`text-[10.5px] transition-colors max-w-[48px] truncate ${isOnline ? "text-[#c5cdd6]" : "text-[#566372]"} ${!isSelf ? "group-hover:text-[#5288c1]" : ""}`}>
                  {isSelf ? "You" : name}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}