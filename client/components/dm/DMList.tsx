import { DMConversation } from "../../types/chat";
import Avatar from "../shared/Avatar";

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
  if (conversations.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-[#4a5568] text-[13px]">
        No conversations yet
      </div>
    );
  }

  return (
    <div className="pt-1">
      {conversations.map((conv) => {
        const isOnline = !conv.isGroup && onlineUsers.includes(conv.username);
        const isActive = activeDM === conv.username;

        return (
          <button
            key={conv.username}
            onClick={() => onOpen(conv.username)}
            className={`
              w-full flex items-center gap-3 px-3 py-2 rounded-xl
              border-none cursor-pointer text-left transition-colors duration-150 mb-px
              ${isActive ? "bg-[#2b5278]" : "bg-transparent hover:bg-[#202b36]"}
            `}
          >
            {/* Avatar */}
            <div className="relative shrink-0">
              <Avatar name={conv.username} size={46} />
              {!conv.isGroup && (
                <span
                  className={`
                    absolute bottom-0 right-0 w-[11px] h-[11px] rounded-full
                    border-2 border-[#17212b]
                    ${isOnline ? "bg-[#4ade80]" : "bg-[#6c7883]"}
                  `}
                />
              )}
            </div>

            {/* Text content */}
            <div className="flex-1 min-w-0">
              {/* Top row: name + time */}
              <div className="flex items-center justify-between mb-0.5">
                <div
                  className={`
                    text-[14.5px] font-semibold truncate max-w-[160px]
                    flex items-center gap-[5px]
                    ${isActive ? "text-white" : "text-[#e8ecf0]"}
                  `}
                >
                  {conv.isGroup && (
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#8b98a5"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="shrink-0"
                    >
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  )}
                  {conv.username}
                </div>
                <div
                  className={`
                    text-[11.5px] shrink-0 ml-1.5
                    ${isActive ? "text-white/55" : "text-[#6c7883]"}
                  `}
                >
                  {conv.time}
                </div>
              </div>

              {/* Bottom row: last message + unread badge */}
              <div className="flex items-center justify-between gap-1.5">
                <div
                  className={`
                    text-[13px] truncate flex-1
                    ${isActive ? "text-white/65" : "text-[#8b98a5]"}
                  `}
                >
                  {conv.lastMessage || "…"}
                </div>
                {conv.unread > 0 && !isActive && (
                  <div className="min-w-[20px] h-5 rounded-full bg-[#5288c1] text-white text-[11px] font-bold flex items-center justify-center px-1 shrink-0">
                    {conv.unread > 99 ? "99+" : conv.unread}
                  </div>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}