import { useState, useRef, useEffect } from "react";
import Avatar from "../shared/Avatar";
import GroupIcon from "../shared/GroupIcon";
import { UserProfile } from "../../hooks/useChat";
import GroupProfileModal from "../layout/GroupProfileModal";
import AddMembersModal from "../layout/AddMembersModal";

type RoomSummary = {
  id: string;
  name: string;
  memberCount: number;
  members: string[];
  createdBy: string;
  avatarUrl?: string;
};

function getGroupGradient(name: string): string {
  const gradients = [
    "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
    "linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)",
    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "linear-gradient(135deg, #f7971e 0%, #ffd200 100%)",
    "linear-gradient(135deg, #30cfd0 0%, #330867 100%)",
    "linear-gradient(135deg, #ff6a00 0%, #ee0979 100%)",
    "linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)",
    "linear-gradient(135deg, #fddb92 0%, #d1fdff 100%)",
  ];
  if (!name) return gradients[0];
  let hash = 0;
  for (const char of name) {
    hash = char.codePointAt(0)! + ((hash << 5) - hash);
    hash = hash & hash;
  }
  return gradients[Math.abs(hash) % gradients.length];
}

export default function RoomHeader({
  room, connected, onlineUsers, allUsers, currentUsername, userProfiles,
  onOpenDM, onLeaveGroup, onDeleteGroup, onDeleteChat, onUpdateGroupAvatar,
  onAddMembers, onRenameGroup,
}: {
  room: RoomSummary;
  connected: boolean;
  onlineUsers: string[];
  allUsers?: string[];
  currentUsername: string;
  userProfiles?: Record<string, UserProfile>;
  onOpenDM: (username: string) => void;
  onLeaveGroup: () => void;
  onDeleteGroup: () => void;
  onDeleteChat: () => void;
  onUpdateGroupAvatar?: (roomId: string, file: File) => void;
  onAddMembers?: (roomId: string, members: string[]) => void;
  onRenameGroup?: (roomId: string, newName: string) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);
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
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
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
          onAddMembers={onAddMembers ? () => { setShowProfile(false); setShowAddMembers(true); } : undefined}
          onRenameGroup={onRenameGroup}
        />
      )}

      {showAddMembers && onAddMembers && (
        <AddMembersModal
          allUsers={allUsers ?? []}
          existingMembers={safeMembers}
          onlineUsers={onlineUsers}
          userProfiles={userProfiles ?? {}}
          onClose={() => setShowAddMembers(false)}
          onAdd={(members) => { onAddMembers(room.id, members); setShowAddMembers(false); }}
        />
      )}

      {/* Top bar */}
      <div className="bg-[#17212b] border-b border-[#0d1821] px-4 py-3 flex items-center gap-3 shrink-0">
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
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 shadow-sm ring-2 ring-transparent group-hover:ring-white/30 transition-all select-none"
              style={{ background: getGroupGradient(room.name) }}
            >
              <GroupIcon size={22} />
            </div>
          )}
        </button>

        <button
          onClick={() => setShowProfile(true)}
          className="flex-1 min-w-0 bg-transparent border-none cursor-pointer text-left p-0"
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <GroupIcon size={13} className="text-[#8b98a5] shrink-0" />
            <span className="text-white font-semibold text-[15.5px] truncate leading-tight hover:text-[#e8ecf0] transition-colors">
              {room.name}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`w-[7px] h-[7px] rounded-full shrink-0 ${connected ? "bg-[#4ade80]" : "bg-red-500"}`} />
            {connected ? (
              <span className="text-[12.5px] text-[#8b98a5]">
                {totalCount} member{totalCount === 1 ? "" : "s"}
                {onlineCount > 0 && <span className="text-[#4ade80]"> · {onlineCount} online</span>}
              </span>
            ) : (
              <span className="text-[12.5px] text-[#8b98a5]">offline</span>
            )}
          </div>
        </button>

        {/* Menu */}
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
              <button onClick={() => { setShowProfile(true); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#202b36] transition-colors">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#8b98a5" strokeWidth="2" strokeLinecap="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <span className="text-[13.5px] text-[#e8ecf0]">Group info</span>
              </button>
              {onAddMembers && (
                <button onClick={() => { setShowAddMembers(true); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#202b36] transition-colors">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#8b98a5" strokeWidth="2" strokeLinecap="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" />
                    <line x1="20" y1="8" x2="20" y2="14" /><line x1="17" y1="11" x2="23" y2="11" />
                  </svg>
                  <span className="text-[13.5px] text-[#e8ecf0]">Add members</span>
                </button>
              )}
              <div className="h-px bg-[#0d1821] mx-3 my-1" />
              <button onClick={() => { setConfirmAction("clear"); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#202b36] transition-colors">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#8b98a5" strokeWidth="2" strokeLinecap="round">
                  <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
                  <path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
                </svg>
                <span className="text-[13.5px] text-[#e8ecf0]">Clear chat history</span>
              </button>
              <div className="h-px bg-[#0d1821] mx-3 my-1" />
              {!isCreator && (
                <button onClick={() => { setConfirmAction("leave"); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-red-500/10 transition-colors">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  <span className="text-[13.5px] text-red-400">Leave group</span>
                </button>
              )}
              {isCreator && (
                <button onClick={() => { setConfirmAction("delete"); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-red-500/10 transition-colors">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round">
                    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
                    <path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
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
              {confirmAction === "clear" && (isCreator ? "This will clear all messages for everyone in the group." : "This will clear messages only on your side.")}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setConfirmAction(null)} className="flex-1 py-2 rounded-xl bg-[#202b36] text-[#8b98a5] text-[13.5px] hover:bg-[#2c3e50] transition-colors">Cancel</button>
              <button onClick={handleConfirm} className="flex-1 py-2 rounded-xl bg-red-500 text-white text-[13.5px] font-semibold hover:bg-red-600 transition-colors">
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
                  <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#17212b] ${isOnline ? "bg-[#4ade80]" : "bg-[#566372]"}`} />
                </div>
                <span className={`text-[10.5px] transition-colors max-w-[48px] truncate ${isOnline ? "text-[#c5cdd6]" : "text-[#566372]"} ${!isSelf ? "group-hover:text-[#5288c1]" : ""}`}>
                  {isSelf ? "You" : name}
                </span>
              </button>
            );
          })}
          {onAddMembers && (
            <button
              onClick={() => setShowAddMembers(true)}
              className="flex flex-col items-center gap-1 shrink-0 group"
              title="Add members"
            >
              <div className="w-9 h-9 rounded-full border-2 border-dashed border-[#4a5568] flex items-center justify-center group-hover:border-[#5288c1] transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b98a5" strokeWidth="2.2" strokeLinecap="round" className="group-hover:stroke-[#5288c1] transition-colors">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </div>
              <span className="text-[10.5px] text-[#566372] group-hover:text-[#5288c1] transition-colors">Add</span>
            </button>
          )}
        </div>
      )}
    </>
  );
}