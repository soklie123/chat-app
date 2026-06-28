import { useRef, useState } from "react";
import Avatar from "../shared/Avatar";
import GroupIcon from "../shared/GroupIcon";
import { UserProfile } from "../../hooks/useChat";

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

export default function GroupProfileModal({
  room,
  currentUsername,
  onlineUsers,
  userProfiles,
  onClose,
  onOpenDM,
  onUpdateAvatar,
  onAddMembers,
  onRenameGroup,
}: {
  room: RoomSummary;
  currentUsername: string;
  onlineUsers: string[];
  userProfiles: Record<string, UserProfile>;
  onClose: () => void;
  onOpenDM: (username: string) => void;
  onUpdateAvatar?: (roomId: string, file: File) => void;
  onAddMembers?: () => void;
  onRenameGroup?: (roomId: string, newName: string) => void;
}) {
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const isCreator = room.createdBy === currentUsername;
  const onlineCount = (room.members ?? []).filter((m) => onlineUsers.includes(m)).length;

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(room.name);
  const [nameError, setNameError] = useState("");

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpdateAvatar) return;
    onUpdateAvatar(room.id, file);
  };

  const handleStartEditName = () => {
    setNameValue(room.name);
    setNameError("");
    setIsEditingName(true);
    setTimeout(() => nameInputRef.current?.focus(), 50);
  };

  const handleSaveName = () => {
    const trimmed = nameValue.trim().toLowerCase().replace(/\s+/g, "-");
    if (!trimmed) {
      setNameError("Name cannot be empty.");
      return;
    }
    if (trimmed.length < 2) {
      setNameError("Name must be at least 2 characters.");
      return;
    }
    if (trimmed === room.name) {
      setIsEditingName(false);
      return;
    }
    onRenameGroup?.(room.id, trimmed);
    setIsEditingName(false);
    setNameError("");
  };

  const handleCancelEdit = () => {
    setIsEditingName(false);
    setNameValue(room.name);
    setNameError("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-[#17212b] rounded-2xl shadow-2xl w-[420px] max-h-[85vh] overflow-y-auto border border-[#0d1821]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <div className="flex justify-end px-4 pt-4">
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-[#8b98a5] hover:bg-[#202b36] hover:text-white transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Avatar + name */}
        <div className="flex flex-col items-center gap-3 px-6 pb-6">
          <div className="relative group">
            {room.avatarUrl ? (
              <img
                src={room.avatarUrl}
                alt={room.name}
                className="w-24 h-24 rounded-full object-cover shadow-lg"
              />
            ) : (
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center shadow-lg select-none"
                style={{ background: getGroupGradient(room.name) }}
              >
                <GroupIcon size={44} />
              </div>
            )}

            {/* Camera overlay for creator */}
            {isCreator && onUpdateAvatar && (
              <>
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer border-none"
                  title="Change group photo"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </>
            )}
          </div>

          {/* Group name — editable for creator */}
          <div className="text-center w-full">
            {isEditingName ? (
              <div className="flex flex-col items-center gap-2 w-full px-4">
                <div className="flex items-center gap-2 w-full">
                  <span className="text-[#8b98a5] text-[15px] shrink-0">#</span>
                  <input
                    ref={nameInputRef}
                    value={nameValue}
                    onChange={(e) => { setNameValue(e.target.value); setNameError(""); }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveName();
                      if (e.key === "Escape") handleCancelEdit();
                    }}
                    className="flex-1 bg-[#202b36] border border-[#5288c1] rounded-lg px-3 py-1.5 text-white text-[15px] font-bold outline-none text-center"
                    maxLength={32}
                    placeholder="group-name"
                  />
                </div>
                {nameError && (
                  <p className="text-red-400 text-[12px]">{nameError}</p>
                )}
                <p className="text-[#6c7883] text-[11px]">
                  Spaces become hyphens · lowercase only
                </p>
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={handleCancelEdit}
                    className="px-4 py-1.5 rounded-lg bg-[#202b36] text-[#8b98a5] text-[13px] hover:bg-[#2c3e50] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveName}
                    className="px-4 py-1.5 rounded-lg bg-[#5288c1] text-white text-[13px] font-semibold hover:bg-[#4377aa] transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center justify-center gap-1.5">
                  <GroupIcon size={14} className="text-[#8b98a5] shrink-0" />
                  <span className="text-white font-bold text-[20px]">#{room.name}</span>
                  {/* Edit pencil — only creator */}
                  {isCreator && onRenameGroup && (
                    <button
                      onClick={handleStartEditName}
                      title="Rename group"
                      className="w-6 h-6 flex items-center justify-center rounded-full text-[#6c7883] hover:text-[#5288c1] hover:bg-[#202b36] transition-colors ml-0.5"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="text-[#8b98a5] text-[13px]">
                  {room.members?.length ?? room.memberCount ?? 0} members
                  {onlineCount > 0 && (
                    <span className="text-[#4ade80]"> · {onlineCount} online</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info cards */}
        <div className="px-4 flex flex-col gap-2 mb-4">
          <div className="bg-[#202b36] rounded-xl px-4 py-3">
            <div className="text-[11px] font-bold text-[#5288c1] uppercase tracking-[0.08em] mb-1">Group ID</div>
            <div className="text-[14px] text-[#e8ecf0]">#{room.id}</div>
          </div>
          <div className="bg-[#202b36] rounded-xl px-4 py-3">
            <div className="text-[11px] font-bold text-[#5288c1] uppercase tracking-[0.08em] mb-1">Created By</div>
            <div className="text-[14px] text-[#e8ecf0]">@{room.createdBy}</div>
          </div>
        </div>

        {/* Members */}
        <div className="px-4 pb-5">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] font-bold text-[#5288c1] uppercase tracking-[0.08em]">
              {room.members?.length ?? room.memberCount ?? 0} Members
            </div>
            {onAddMembers && (
              <button
                onClick={onAddMembers}
                className="flex items-center gap-1 text-[12px] font-semibold text-[#5288c1] hover:text-[#6ba0d8] bg-transparent border-none cursor-pointer"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add
              </button>
            )}
          </div>

          {onAddMembers && (
            <button
              onClick={onAddMembers}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left border-none cursor-pointer hover:bg-[#202b36] bg-transparent mb-1"
            >
              <div className="w-10 h-10 rounded-full border-2 border-dashed border-[#4a5568] flex items-center justify-center shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5288c1" strokeWidth="2.4" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </div>
              <span className="text-[14px] font-semibold text-[#5288c1]">Add members</span>
            </button>
          )}

          <div className="flex flex-col gap-1">
            {(room.members ?? []).map((member) => {
              const isSelf = member === currentUsername;
              const isOnline = onlineUsers.includes(member);
              const profile = userProfiles[member];
              return (
                <button
                  key={member}
                  onClick={() => !isSelf && onOpenDM(member)}
                  disabled={isSelf}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left border-none ${
                    isSelf ? "cursor-default bg-transparent" : "cursor-pointer hover:bg-[#202b36] bg-transparent"
                  }`}
                >
                  <div className="relative shrink-0">
                    <Avatar name={member} size={40} avatarUrl={profile?.avatarUrl} />
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#17212b] ${
                        isOnline ? "bg-[#4ade80]" : "bg-[#566372]"
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold text-[#e8ecf0] truncate">
                      {isSelf ? "You" : member}
                    </div>
                    {profile?.bio && (
                      <div className="text-[12px] text-[#6c7883] truncate">{profile.bio}</div>
                    )}
                  </div>
                  {member === room.createdBy && (
                    <span className="shrink-0 text-[11px] font-semibold text-[#5288c1] bg-[#5288c1]/15 px-2.5 py-1 rounded-full">
                      admin
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}