import { DMConversation } from "../types/chat";
import { getAvatarColor } from "../hooks/useChat";
import Avatar from "./Avatar";

export default function DMList({
  conversations,
  activeDM,
  onOpen,
  onlineUsers,
}: {
  conversations: DMConversation[];
  activeDM: string | null;
  onOpen: (username: string) => void;
  onlineUsers: string[];
}) {
  if (conversations.length === 0) return null;

  return (
    <div className="mt-2">
      <div className="text-white/40 text-[10px] uppercase tracking-widest px-2 mb-2">
        Direct Messages
      </div>
      {conversations.map((conv) => {
        const isOnline = onlineUsers.includes(conv.username);
        const isActive = activeDM === conv.username;
        return (
          <button
            key={conv.username}
            onClick={() => onOpen(conv.username)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg mb-0.5 transition-all ${
              isActive
                ? "bg-[#0088cc] text-white"
                : "text-white/60 hover:bg-white/10 hover:text-white"
            }`}
          >
            {/* Avatar with online dot */}
            <div className="relative flex-shrink-0">
              <Avatar name={conv.username} size={26} />
              <span className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-[#1e2a35] ${
                isOnline ? "bg-green-400" : "bg-gray-500"
              }`} />
            </div>

            <div className="flex-1 min-w-0 text-left">
              <div className="text-[13px] font-medium truncate">{conv.username}</div>
              <div className={`text-[10px] truncate ${isActive ? "text-white/70" : "text-white/40"}`}>
                {conv.lastMessage}
              </div>
            </div>

            {/* Unread badge */}
            {conv.unread > 0 && !isActive && (
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#0088cc] text-white text-[10px] font-bold flex items-center justify-center">
                {conv.unread > 9 ? "9+" : conv.unread}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}