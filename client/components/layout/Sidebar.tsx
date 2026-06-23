import { useState, useRef, useEffect } from "react";
import { DMConversation } from "../../types/chat";
import DMList from "../dm/DMList";
import { getAvatarColor } from "../../hooks/useChat";
import ProfilePanel from "./ProfilePanel";

import { UserProfile } from "../../hooks/useChat"; 

type RoomSummary = { id: string; name: string; memberCount: number; members: string[] };


export default function Sidebar({
  username,
  onLogout,
  onlineUsers,
  allUsers,
  conversations,
  activeDM,
  rooms,
  currentRoom,
  onOpenDM,
  onOpenRoom,
  onCreateGroup,
  roomUnread,
  userProfiles, // ✅ add this
}: {
  username: string;
  onLogout: () => void;
  onlineUsers: string[];
  allUsers: string[];
  conversations: DMConversation[];
  activeDM: string | null;
  rooms: RoomSummary[];
  currentRoom: string | null;
  onOpenDM: (username: string) => void;
  onOpenRoom: (roomId: string) => void;
  onCreateGroup: (name: string, members: string[]) => void;
  roomUnread: Record<string, number>;

  userProfiles: Record<string, UserProfile>; 
}){
  const [sidebarWidth, setSidebarWidth] = useState<number>(320);
  const minWidth = 220;
  const maxWidth = 520;
  const draggingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleMember = (user: string) => {
    setSelectedMembers(prev =>
      prev.includes(user) ? prev.filter(m => m !== user) : [...prev, user]
    );
  };

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return;
    onCreateGroup(newGroupName.trim(), selectedMembers);
    setNewGroupName("");
    setSelectedMembers([]);
    setCreatingGroup(false);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      const delta = e.clientX - startXRef.current;
      const newWidth = Math.min(maxWidth, Math.max(minWidth, startWidthRef.current + delta));
      setSidebarWidth(newWidth);
      document.body.style.userSelect = "none";
    };

    const onMouseUp = () => {
      if (draggingRef.current) {
        draggingRef.current = false;
        document.body.style.userSelect = "auto";
      }
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    if (draggingRef.current) {
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      document.body.style.userSelect = "auto";
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    draggingRef.current = true;
    startXRef.current = e.clientX;
    startWidthRef.current = sidebarWidth;
    window.addEventListener("mousemove", () => {});
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    draggingRef.current = true;
    startXRef.current = e.touches[0].clientX;
    startWidthRef.current = sidebarWidth;

    const onTouchMove = (ev: TouchEvent) => {
      if (!draggingRef.current) return;
      const delta = ev.touches[0].clientX - startXRef.current;
      const newWidth = Math.min(maxWidth, Math.max(minWidth, startWidthRef.current + delta));
      setSidebarWidth(newWidth);
    };

    const onTouchEnd = () => {
      draggingRef.current = false;
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };

    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("touchend", onTouchEnd);
  };

  const existingUsernames = new Set(conversations.map(c => c.username));
  const otherUsers = allUsers.filter(u => u !== username && !existingUsernames.has(u));
  const onlineOthers = otherUsers.filter(u => onlineUsers.includes(u));
  const offlineOthers = otherUsers.filter(u => !onlineUsers.includes(u));

  const filteredConversations = conversations.filter(c =>
    c.username.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredOnline = onlineOthers.filter(u =>
    u.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredOffline = offlineOthers.filter(u =>
    u.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredRooms = rooms.filter(r =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderRoomRow = (room: RoomSummary) => {
    const isActive = currentRoom === room.id;
    const unread = roomUnread[room.id] ?? 0;

    return (
      <button
        key={room.id}
        onClick={() => onOpenRoom(room.id)}
        className={`w-full flex items-center gap-3 px-2.5 py-2 border-none rounded-xl cursor-pointer mb-px text-left transition-colors duration-150 ${
          isActive ? "bg-[#2b5278]" : "bg-transparent hover:bg-[#202b36]"
        }`}
      >
        <div className="w-[46px] h-[46px] rounded-full bg-[#5288c1] flex items-center justify-center shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="#fff" strokeWidth="2.2" strokeLinecap="round">
            <line x1="4" y1="9" x2="20" y2="9" />
            <line x1="4" y1="15" x2="20" y2="15" />
            <line x1="10" y1="3" x2="8" y2="21" />
            <line x1="16" y1="3" x2="14" y2="21" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[14.5px] font-semibold text-[#e8ecf0] truncate">{room.name}</div>
          <div className="text-[12px] text-[#6c7883] mt-px">
            {room.memberCount ?? room.members?.length ?? 0} members
          </div>
        </div>
        {unread > 0 && (
          <div className="shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-[#5288c1] flex items-center justify-center">
            <span className="text-[11px] font-bold text-white leading-none">
              {unread > 99 ? "99+" : unread}
            </span>
          </div>
        )}
      </button>
    );
  };

  const renderUserRow = (user: string, isOnline: boolean) => {
    const profile = userProfiles[user];
    const avatarUrl = profile?.avatarUrl;
    const isActive = activeDM === user;

    return (
      <button
        key={user}
        onClick={() => onOpenDM(user)}
        className={`w-full flex items-center gap-3 px-2.5 py-2 border-none rounded-xl cursor-pointer mb-px text-left transition-colors duration-150 ${
          isActive ? "bg-[#2b5278]" : "bg-transparent hover:bg-[#202b36]"
        }`}
      >
        <div className="relative shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={user}
              className="w-[46px] h-[46px] rounded-full object-cover"
              style={{ opacity: isOnline ? 1 : 0.65 }}
            />
          ) : (
            <div
              className="w-[46px] h-[46px] rounded-full flex items-center justify-center text-[19px] font-semibold text-white"
              style={{ background: isOnline ? getAvatarColor(user) : "#2c3e50", opacity: isOnline ? 1 : 0.65 }}
            >
              {user[0]?.toUpperCase()}
            </div>
          )}
          <span
            className={`absolute bottom-0 right-0 w-[11px] h-[11px] rounded-full border-2 border-[#17212b] ${isOnline ? "bg-[#4ade80]" : "bg-[#6c7883]"}`}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[14.5px] font-semibold text-[#e8ecf0] truncate">{user}</div>
          <div className="text-[12px] text-[#6c7883] mt-px">
            {profile?.bio ?? (isOnline ? "Online" : "Offline")}
          </div>
        </div>
      </button>
    );
  };

  return (
    <>
      {showProfile && (
        <ProfilePanel
          username={username}
          onClose={() => setShowProfile(false)}
          onAvatarChange={(url) => setAvatarUrl(url)}
        />
      )}

      <div
        className="h-full bg-[#17212b] flex flex-col shrink-0 border-r border-[#0d1821] text-white relative"
        style={{ width: sidebarWidth, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", WebkitFontSmoothing: "antialiased" }}
      >
        {/* Resize handle */}
        <div
          className="absolute top-0 right-0 h-full w-2 -mr-1 cursor-col-resize z-50"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          aria-hidden
        >
          <div className="h-full w-full hover:bg-white/5" />
        </div>
        {/* ── Header ── */}
        <div className="px-3 py-2.5 flex items-center gap-2 bg-[#17212b] border-b border-[#0d1821] shrink-0">
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(v => !v)}
              className={`w-[38px] h-[38px] flex items-center justify-center rounded-full border-none text-[#8b98a5] cursor-pointer shrink-0 transition-colors duration-150 hover:bg-[#202b36] ${showMenu ? "bg-[#202b36]" : "bg-transparent"}`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </svg>
            </button>

            {showMenu && (
              <div className="absolute top-[calc(100%+6px)] left-0 w-[250px] bg-[#17212b] rounded-[14px] shadow-[0_8px_32px_rgba(0,0,0,0.6)] border border-[#0d1821] z-[200] overflow-hidden">
                {/* Profile preview row */}
                <button
                  onClick={() => { setShowMenu(false); setShowProfile(true); }}
                  className="w-full p-4 border-b border-[#0d1821] flex items-center gap-3 bg-transparent cursor-pointer hover:bg-[#202b36] transition-colors text-left"
                >
                  <div className="relative shrink-0">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={username} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-[20px] font-bold text-white"
                        style={{ background: getAvatarColor(username) }}
                      >
                        {username[0]?.toUpperCase()}
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 w-[11px] h-[11px] rounded-full bg-[#4ade80] border-2 border-[#17212b]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-semibold text-white truncate">{username}</div>
                    <div className="text-[12px] text-[#5288c1] mt-0.5">View profile</div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6c7883" strokeWidth="2.2" strokeLinecap="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>

                <div className="p-1.5">
                  <button
                    onClick={() => { setShowMenu(false); setCreatingGroup(true); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 bg-transparent border-none rounded-xl cursor-pointer text-left transition-colors duration-150 hover:bg-[#202b36]"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b98a5" strokeWidth="2" strokeLinecap="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <span className="text-[14px] text-[#e8ecf0]">New Group</span>
                  </button>

                  <div className="h-px bg-[#0d1821] mx-1.5 my-1" />

                  <button
                    onClick={() => { setShowMenu(false); onLogout(); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 bg-transparent border-none rounded-xl cursor-pointer text-left transition-colors duration-150 hover:bg-red-500/10"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    <span className="text-[14px] text-red-500">Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 relative flex items-center">
            <svg className="absolute left-2.5 pointer-events-none text-[#6c7883]" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="w-full h-9 bg-[#242f3d] border-none rounded-full pl-[34px] pr-3 text-[14px] text-white outline-none placeholder:text-[#6c7883]"
            />
          </div>
        </div>

        {/* ── Create Group Panel ── */}
        {creatingGroup && (
          <div className="mx-2.5 my-2 p-3.5 bg-[#202b36] rounded-[14px] border border-[#0d1821] flex flex-col gap-2.5 shrink-0">
            <div className="text-[11.5px] font-bold text-[#5288c1] uppercase tracking-[0.08em]">New Group</div>
            <input
              autoFocus
              value={newGroupName}
              onChange={e => setNewGroupName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleCreateGroup()}
              placeholder="Group name…"
              className="px-3 py-2 bg-[#17212b] border border-[#0d1821] rounded-xl text-white text-[13.5px] outline-none transition-colors duration-150 focus:border-[#5288c1] placeholder:text-[#4a5568]"
            />
            <div className="text-[11px] text-[#6c7883] font-semibold">Add members</div>
            <div className="max-h-[150px] overflow-y-auto bg-[#17212b] rounded-xl border border-[#0d1821] p-1">
              {allUsers.filter(u => u !== username).length === 0 ? (
                <div className="p-3 text-center text-[#4a5568] text-[12px]">No other users yet</div>
              ) : (
                allUsers.filter(u => u !== username).map(user => {
                  const checked = selectedMembers.includes(user);
                  const isOnline = onlineUsers.includes(user);
                  return (
                    <div key={user} onClick={() => toggleMember(user)} className="flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-colors duration-100 hover:bg-[#202b36]">
                      <div className="flex items-center gap-2.5">
                        <div className="relative">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-semibold text-white" style={{ background: getAvatarColor(user) }}>
                            {user[0]?.toUpperCase()}
                          </div>
                          <span className={`absolute bottom-0 right-0 w-[9px] h-[9px] rounded-full border-2 border-[#17212b] ${isOnline ? "bg-[#4ade80]" : "bg-[#6c7883]"}`} />
                        </div>
                        <span className="text-[13.5px] text-[#e8ecf0] font-medium">{user}</span>
                      </div>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-150 ${checked ? "bg-[#5288c1] border-none" : "bg-transparent border-2 border-[#4a5568]"}`}>
                        {checked && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={handleCreateGroup} className="flex-1 py-2 bg-[#5288c1] border-none rounded-xl text-white text-[13.5px] font-semibold cursor-pointer transition-colors duration-150 hover:bg-[#4377aa]">Create</button>
              <button onClick={() => { setCreatingGroup(false); setNewGroupName(""); setSelectedMembers([]); }} className="flex-1 py-2 bg-[#2c3e50] border-none rounded-xl text-[#8b98a5] text-[13.5px] cursor-pointer transition-colors duration-150 hover:bg-[#364f68]">Cancel</button>
            </div>
          </div>
        )}

        {/* ── List ── */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-1.5 py-1">
          {filteredRooms.length > 0 && <>{filteredRooms.map(renderRoomRow)}</>}
          {filteredConversations.length > 0 && (
            <DMList conversations={filteredConversations} activeDM={activeDM} onOpen={onOpenDM} onlineUsers={onlineUsers} />
          )}
          {filteredOnline.length > 0 && <>{filteredOnline.map(u => renderUserRow(u, true))}</>}
          {filteredOffline.length > 0 && <>{filteredOffline.map(u => renderUserRow(u, false))}</>}
          {filteredRooms.length === 0 && filteredConversations.length === 0 && filteredOnline.length === 0 && filteredOffline.length === 0 && (
            <div className="px-4 py-12 text-center text-[#4a5568] text-[13px]">{searchQuery ? "No results found" : "No users yet"}</div>
          )}
        </div>

        {/* ── Self row at bottom — click opens profile ── */}
        <button
          onClick={() => setShowProfile(true)}
          className="px-3.5 py-2.5 border-t border-[#0d1821] flex items-center gap-2.5 shrink-0 bg-transparent w-full text-left hover:bg-[#202b36] transition-colors cursor-pointer"
        >
          <div className="relative shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt={username} className="w-9 h-9 rounded-full object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-[14px] font-bold text-white" style={{ background: getAvatarColor(username) }}>
                {username[0]?.toUpperCase()}
              </div>
            )}
            <span className="absolute bottom-0 right-0 w-[9px] h-[9px] rounded-full bg-[#4ade80] border-2 border-[#17212b]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13.5px] font-semibold text-[#e8ecf0] truncate">{username}</div>
            <div className="text-[11px] text-[#4ade80]">online</div>
          </div>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6c7883" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>
    </>
  );
}