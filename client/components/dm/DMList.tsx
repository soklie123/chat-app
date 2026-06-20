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
      <div style={{
        padding: "32px 16px",
        textAlign: "center",
        color: "#4a5568",
        fontSize: "13px",
      }}>
        No conversations yet
      </div>
    );
  }

  return (
    <div style={{ paddingTop: "4px" }}>
      {conversations.map((conv) => {
        const isOnline = !conv.isGroup && onlineUsers.includes(conv.username);
        const isActive = activeDM === conv.username;

        return (
          <button
            key={conv.username}
            onClick={() => onOpen(conv.username)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "8px 12px",
              background: isActive ? "#2b5278" : "transparent",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              textAlign: "left",
              transition: "background 0.15s",
              marginBottom: "1px",
            }}
            onMouseEnter={e => {
              if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "#202b36";
            }}
            onMouseLeave={e => {
              if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            }}
          >
            {/* Avatar */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <Avatar name={conv.username} size={46} />
              {/* Online dot — only for DMs */}
              {!conv.isGroup && (
                <span style={{
                  position: "absolute",
                  bottom: 1,
                  right: 1,
                  width: 11,
                  height: 11,
                  borderRadius: "50%",
                  background: isOnline ? "#4ade80" : "#6c7883",
                  border: "2px solid #17212b",
                }} />
              )}
            </div>

            {/* Text content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Top row: name + time */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2px" }}>
                <div style={{
                  fontSize: "14.5px",
                  fontWeight: 600,
                  color: isActive ? "#fff" : "#e8ecf0",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "160px",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}>
                  {conv.isGroup && (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8b98a5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  )}
                  {conv.username}
                </div>
                <div style={{
                  fontSize: "11.5px",
                  color: isActive ? "rgba(255,255,255,0.55)" : "#6c7883",
                  flexShrink: 0,
                  marginLeft: "6px",
                }}>
                  {conv.time}
                </div>
              </div>

              {/* Bottom row: last message + unread badge */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" }}>
                <div style={{
                  fontSize: "13px",
                  color: isActive ? "rgba(255,255,255,0.65)" : "#8b98a5",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  flex: 1,
                }}>
                  {conv.lastMessage || "…"}
                </div>
                {conv.unread > 0 && !isActive && (
                  <div style={{
                    minWidth: "20px",
                    height: "20px",
                    borderRadius: "10px",
                    background: "#5288c1",
                    color: "#fff",
                    fontSize: "11px",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 5px",
                    flexShrink: 0,
                  }}>
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