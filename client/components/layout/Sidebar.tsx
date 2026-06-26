"use client";
import { useState, useRef, useEffect } from "react";
import { DMConversation } from "../../types/chat";
import DMList from "../dm/DMList";
import { UserProfile } from "../../hooks/useChat";
import Avatar from "../shared/Avatar";
import ProfilePanel from "./ProfilePanel";
import UserProfileModal from "./UserProfileModal";
import AIButton from "../shared/Aibutton";

type RoomSummary = { id: string; name: string; memberCount: number; members: string[]; avatarUrl?: string };

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
  userProfiles,
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
  onCreateGroup: (name: string, members: string[], avatarFile?: File) => void;
  roomUnread: Record<string, number>;
  userProfiles: Record<string, UserProfile>;
}) {
  const [sidebarWidth, setSidebarWidth] = useState<number>(320);
  const minWidth = 220;
  const maxWidth = 520;
  const draggingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const [creatingGroup, setCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [groupAvatarFile, setGroupAvatarFile] = useState<File | null>(null);
  const [groupAvatarPreview, setGroupAvatarPreview] = useState<string>("");
  const groupAvatarInputRef = useRef<HTMLInputElement>(null);

  const [showMenu, setShowMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [viewingUser, setViewingUser] = useState<string | null>(null);

  const [avatarOverride, setAvatarOverride] = useState<string>("");
  const selfAvatarUrl = userProfiles[username]?.avatarUrl || avatarOverride;

  const menuRef = useRef<HTMLDivElement>(null);

  const toggleMember = (user: string) => {
    setSelectedMembers((prev) =>
      prev.includes(user) ? prev.filter((m) => m !== user) : [...prev, user]
    );
  };

  const handleGroupAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setGroupAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setGroupAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const resetGroupForm = () => {
    setNewGroupName("");
    setSelectedMembers([]);
    setGroupAvatarFile(null);
    setGroupAvatarPreview("");
    if (groupAvatarInputRef.current) groupAvatarInputRef.current.value = "";
  };

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return;
    onCreateGroup(newGroupName.trim(), selectedMembers, groupAvatarFile ?? undefined);
    resetGroupForm();
    setCreatingGroup(false);
  };

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Resize handle — mouse
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
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
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

  // Derived lists
  const existingUsernames = new Set(conversations.map((c) => c.username));
  const otherUsers = allUsers.filter((u) => u !== username && !existingUsernames.has(u));
  const onlineOthers = otherUsers.filter((u) => onlineUsers.includes(u));
  const offlineOthers = otherUsers.filter((u) => !onlineUsers.includes(u));

  const filteredConversations = conversations.filter((c) =>
    c.username.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredOnline = onlineOthers.filter((u) =>
    u.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredOffline = offlineOthers.filter((u) =>
    u.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredRooms = rooms.filter((r) =>
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
        {/* Group avatar */}
        {room.avatarUrl ? (
          <img
            src={room.avatarUrl}
            alt={room.name}
            className="w-[46px] h-[46px] rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="w-[46px] h-[46px] rounded-full bg-[#5288c1] flex items-center justify-center shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="#fff" strokeWidth="2.2" strokeLinecap="round">
              <line x1="4" y1="9" x2="20" y2="9" />
              <line x1="4" y1="15" x2="20" y2="15" />
              <line x1="10" y1="3" x2="8" y2="21" />
              <line x1="16" y1="3" x2="14" y2="21" />
            </svg>
          </div>
        )}
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
    const isActive = activeDM === user;

    return (
      <button
        key={user}
        onClick={() => onOpenDM(user)}
        className={`w-full flex items-center gap-3 px-2.5 py-2 border-none rounded-xl cursor-pointer mb-px text-left transition-colors duration-150 ${
          isActive ? "bg-[#2b5278]" : "bg-transparent hover:bg-[#202b36]"
        }`}
      >
        <div
          className="relative shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            setViewingUser(user);
          }}
          title={`View ${user}'s profile`}
          style={{ opacity: isOnline ? 1 : 0.65 }}
        >
          <Avatar name={user} size={46} avatarUrl={profile?.avatarUrl} />
          <span
            className={`absolute bottom-0 right-0 w-[11px] h-[11px] rounded-full border-2 border-[#17212b] ${
              isOnline ? "bg-[#4ade80]" : "bg-[#6c7883]"
            }`}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-[14.5px] font-semibold text-[#e8ecf0] truncate">{user}</div>
          <div className="text-[12px] text-[#6c7883] mt-px truncate">
            {profile?.bio ? profile.bio : isOnline ? "Online" : "Offline"}
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
          onAvatarChange={(url) => setAvatarOverride(url)}
        />
      )}

      {viewingUser && (
        <UserProfileModal
          username={viewingUser}
          profile={userProfiles[viewingUser]}
          isOnline={onlineUsers.includes(viewingUser)}
          onClose={() => setViewingUser(null)}
          onOpenDM={(u) => {
            onOpenDM(u);
            setViewingUser(null);
          }}
        />
      )}

      <div
        className="h-full bg-[#17212b] flex flex-col shrink-0 border-r border-[#0d1821] text-white relative"
        style={{
          width: sidebarWidth,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          WebkitFontSmoothing: "antialiased",
        }}
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
              onClick={() => setShowMenu((v) => !v)}
              className={`w-[38px] h-[38px] flex items-center justify-center rounded-full border-none text-[#8b98a5] cursor-pointer shrink-0 transition-colors duration-150 hover:bg-[#202b36] ${
                showMenu ? "bg-[#202b36]" : "bg-transparent"
              }`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.2" strokeLinecap="round">
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </svg>
            </button>

            {showMenu && (
              <div className="absolute top-[calc(100%+6px)] left-0 w-[250px] bg-[#17212b] rounded-[14px] shadow-[0_8px_32px_rgba(0,0,0,0.6)] border border-[#0d1821] z-[200] overflow-hidden">
                <button
                  onClick={() => { setShowMenu(false); setShowProfile(true); }}
                  className="w-full p-4 border-b border-[#0d1821] flex items-center gap-3 bg-transparent cursor-pointer hover:bg-[#202b36] transition-colors text-left"
                >
                  <div className="relative shrink-0">
                    <Avatar name={username} size={48} avatarUrl={selfAvatarUrl} />
                    <span className="absolute bottom-0 right-0 w-[11px] h-[11px] rounded-full bg-[#4ade80] border-2 border-[#17212b]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-semibold text-white truncate">{username}</div>
                    <div className="text-[12px] text-[#5288c1] mt-0.5">View profile</div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6c7883"
                    strokeWidth="2.2" strokeLinecap="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>

                <div className="p-1.5">
                  <button
                    onClick={() => { setShowMenu(false); setCreatingGroup(true); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 bg-transparent border-none rounded-xl cursor-pointer text-left transition-colors duration-150 hover:bg-[#202b36]"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b98a5"
                      strokeWidth="2" strokeLinecap="round">
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
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444"
                      strokeWidth="2" strokeLinecap="round">
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

          {/* Search bar */}
          <div className="flex-1 relative flex items-center">
            <svg className="absolute left-2.5 pointer-events-none text-[#6c7883]" width="15" height="15"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="w-full h-9 bg-[#242f3d] border-none rounded-full pl-[34px] pr-3 text-[14px] text-white outline-none placeholder:text-[#6c7883]"
            />
          </div>
        </div>

        {/* ── Create Group Panel ── */}
        {creatingGroup && (
          <div className="mx-2.5 my-2 p-3.5 bg-[#202b36] rounded-[14px] border border-[#0d1821] flex flex-col gap-2.5 shrink-0">
            <div className="text-[11.5px] font-bold text-[#5288c1] uppercase tracking-[0.08em]">New Group</div>

            {/* Avatar picker */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => groupAvatarInputRef.current?.click()}
                className="relative w-14 h-14 rounded-full shrink-0 bg-[#17212b] border-2 border-dashed border-[#4a5568] flex items-center justify-center cursor-pointer hover:border-[#5288c1] transition-colors group overflow-hidden"
                title="Add group photo"
              >
                {groupAvatarPreview ? (
                  <img src={groupAvatarPreview} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-0.5">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6c7883" strokeWidth="2" strokeLinecap="round" className="group-hover:stroke-[#5288c1] transition-colors">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                    <span className="text-[9px] text-[#6c7883] group-hover:text-[#5288c1] transition-colors">Photo</span>
                  </div>
                )}
                {groupAvatarPreview && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  </div>
                )}
              </button>
              <input
                ref={groupAvatarInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleGroupAvatarChange}
              />
              <input
                autoFocus
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateGroup()}
                placeholder="Group name…"
                className="flex-1 px-3 py-2 bg-[#17212b] border border-[#0d1821] rounded-xl text-white text-[13.5px] outline-none transition-colors duration-150 focus:border-[#5288c1] placeholder:text-[#4a5568]"
              />
            </div>

            {groupAvatarPreview && (
              <button
                onClick={() => { setGroupAvatarFile(null); setGroupAvatarPreview(""); if (groupAvatarInputRef.current) groupAvatarInputRef.current.value = ""; }}
                className="text-[11px] text-red-400 hover:text-red-300 bg-transparent border-none cursor-pointer text-left"
              >
                Remove photo
              </button>
            )}

            <div className="text-[11px] text-[#6c7883] font-semibold">Add members</div>
            <div className="max-h-[150px] overflow-y-auto bg-[#17212b] rounded-xl border border-[#0d1821] p-1">
              {allUsers.filter((u) => u !== username).length === 0 ? (
                <div className="p-3 text-center text-[#4a5568] text-[12px]">No other users yet</div>
              ) : (
                allUsers
                  .filter((u) => u !== username)
                  .map((user) => {
                    const checked = selectedMembers.includes(user);
                    const isOnline = onlineUsers.includes(user);
                    return (
                      <div
                        key={user}
                        onClick={() => toggleMember(user)}
                        className="flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-colors duration-100 hover:bg-[#202b36]"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="relative">
                            <Avatar name={user} size={32} avatarUrl={userProfiles[user]?.avatarUrl} />
                            <span
                              className={`absolute bottom-0 right-0 w-[9px] h-[9px] rounded-full border-2 border-[#17212b] ${
                                isOnline ? "bg-[#4ade80]" : "bg-[#6c7883]"
                              }`}
                            />
                          </div>
                          <span className="text-[13.5px] text-[#e8ecf0] font-medium">{user}</span>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-150 ${
                            checked ? "bg-[#5288c1] border-none" : "bg-transparent border-2 border-[#4a5568]"
                          }`}
                        >
                          {checked && (
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff"
                              strokeWidth="3" strokeLinecap="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreateGroup}
                className="flex-1 py-2 bg-[#5288c1] border-none rounded-xl text-white text-[13.5px] font-semibold cursor-pointer transition-colors duration-150 hover:bg-[#4377aa]"
              >
                Create
              </button>
              <button
                onClick={() => { setCreatingGroup(false); resetGroupForm(); }}
                className="flex-1 py-2 bg-[#2c3e50] border-none rounded-xl text-[#8b98a5] text-[13.5px] cursor-pointer transition-colors duration-150 hover:bg-[#364f68]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── List ── */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-1.5 py-1">
          {filteredRooms.length > 0 && <>{filteredRooms.map(renderRoomRow)}</>}
          {filteredConversations.length > 0 && (
            <DMList
              conversations={filteredConversations}
              activeDM={activeDM}
              onOpen={onOpenDM}
              onlineUsers={onlineUsers}
              userProfiles={userProfiles}
            />
          )}
          {filteredOnline.length > 0 && <>{filteredOnline.map((u) => renderUserRow(u, true))}</>}
          {filteredOffline.length > 0 && <>{filteredOffline.map((u) => renderUserRow(u, false))}</>}
          {filteredRooms.length === 0 &&
            filteredConversations.length === 0 &&
            filteredOnline.length === 0 &&
            filteredOffline.length === 0 && (
              <div className="px-4 py-12 text-center text-[#4a5568] text-[13px]">
                {searchQuery ? "No results found" : "No users yet"}
              </div>
            )}
        </div>

        {/* ── Self row at bottom ── */}
        <button
          onClick={() => setShowProfile(true)}
          className="px-3.5 py-2.5 border-t border-[#0d1821] flex items-center gap-2.5 shrink-0 bg-transparent w-full text-left hover:bg-[#202b36] transition-colors cursor-pointer"
        >
          <div className="relative shrink-0">
            <Avatar name={username} size={36} avatarUrl={selfAvatarUrl} />
            <span className="absolute bottom-0 right-0 w-[9px] h-[9px] rounded-full bg-[#4ade80] border-2 border-[#17212b]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13.5px] font-semibold text-[#e8ecf0] truncate">{username}</div>
            <div className="text-[11px] text-[#4ade80]">online</div>
          </div>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6c7883"
            strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>

      <AIButton />
    </>
  );
}