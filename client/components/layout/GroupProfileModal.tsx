import { useRef, useState } from "react";
import Avatar from "../shared/Avatar";
import { UserProfile } from "../../hooks/useChat";

type RoomSummary = {
  id: string;
  name: string;
  memberCount: number;
  members: string[];
  createdBy: string;
  avatarUrl?: string;
};

type Props = {
  room: RoomSummary;
  currentUsername: string;
  onlineUsers: string[];
  userProfiles: Record<string, UserProfile>;
  onClose: () => void;
  onOpenDM: (username: string) => void;
  onUpdateAvatar?: (roomId: string, file: File) => void;
};

export default function GroupProfileModal({
  room,
  currentUsername,
  onlineUsers,
  userProfiles,
  onClose,
  onOpenDM,
  onUpdateAvatar,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const isCreator = room.createdBy === currentUsername;

  const onlineCount = room.members.filter((m) => onlineUsers.includes(m)).length;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpdateAvatar) return;
    setUploading(true);
    await onUpdateAvatar(room.id, file);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-[380px] max-h-[85vh] bg-[#17212b] rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.7)] overflow-hidden border border-[#0d1821] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-end px-3 py-2.5 shrink-0">
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-[#8b98a5] hover:bg-[#202b36] hover:text-white bg-transparent border-none cursor-pointer transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Avatar + name */}
          <div className="flex flex-col items-center pt-0 pb-5 px-4">
            <div className="relative group">
              {room.avatarUrl ? (
                <img
                  src={room.avatarUrl}
                  alt={room.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-[#0d1821]"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#5288c1] to-[#3a6491] flex items-center justify-center text-[36px] font-bold text-white border-4 border-[#0d1821]">
                  #
                </div>
              )}

              {isCreator && onUpdateAvatar && (
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="absolute inset-0 rounded-full bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-none"
                >
                  {uploading ? (
                    <svg className="animate-spin" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                        <circle cx="12" cy="13" r="4" />
                      </svg>
                      <span className="text-[10px] text-white mt-1 font-medium">Change</span>
                    </>
                  )}
                </button>
              )}

              <input
                ref={fileRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>

            <div className="mt-3 text-[19px] font-bold text-white">#{room.name}</div>
            <div className="text-[13px] text-[#8b98a5] mt-0.5">
              {room.members.length} members · {onlineCount} online
            </div>
          </div>

          {/* Info cards */}
          <div className="px-4 pb-2 flex flex-col gap-1">
            <div className="bg-[#202b36] rounded-xl px-4 py-3">
              <div className="text-[11px] font-bold text-[#5288c1] uppercase tracking-wide mb-1">Group ID</div>
              <div className="text-[13.5px] text-[#e8ecf0] font-mono">#{room.id}</div>
            </div>
            <div className="bg-[#202b36] rounded-xl px-4 py-3">
              <div className="text-[11px] font-bold text-[#5288c1] uppercase tracking-wide mb-1">Created by</div>
              <div className="text-[13.5px] text-[#e8ecf0]">@{room.createdBy}</div>
            </div>
          </div>

          <div className="h-2 bg-[#0e1621] mt-2" />

          {/* Members list */}
          <div className="px-4 py-3">
            <div className="text-[11px] font-bold text-[#5288c1] uppercase tracking-wide mb-2">
              {room.members.length} Members
            </div>
            <div className="flex flex-col gap-0.5">
              {[
                ...room.members.filter((m) => onlineUsers.includes(m) && m !== currentUsername),
                ...room.members.filter((m) => m === currentUsername),
                ...room.members.filter((m) => !onlineUsers.includes(m) && m !== currentUsername),
              ].map((member) => {
                const isOnline = onlineUsers.includes(member);
                const isSelf = member === currentUsername;
                const profile = userProfiles[member];
                const isAdmin = member === room.createdBy;
                return (
                  <button
                    key={member}
                    onClick={() => {
                      if (!isSelf) { onOpenDM(member); onClose(); }
                    }}
                    disabled={isSelf}
                    className={`flex items-center gap-3 px-2 py-2.5 rounded-xl transition-colors text-left ${
                      isSelf ? "cursor-default" : "cursor-pointer hover:bg-[#202b36]"
                    }`}
                  >
                    <div className="relative shrink-0">
                      <Avatar name={member} size={40} avatarUrl={profile?.avatarUrl} />
                      <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#17212b] ${isOnline ? "bg-[#4ade80]" : "bg-[#566372]"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-semibold text-[#e8ecf0] truncate">
                        {isSelf ? "You" : member}
                      </div>
                      <div className="text-[12px] text-[#6c7883] truncate">
                        {profile?.bio || (isOnline ? "online" : "offline")}
                      </div>
                    </div>
                    {isAdmin && (
                      <span className="text-[11px] text-[#5288c1] bg-[#5288c1]/10 px-2 py-0.5 rounded-full shrink-0 font-medium">
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
    </div>
  );
}