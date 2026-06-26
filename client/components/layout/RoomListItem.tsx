import Avatar from "../shared/Avatar";
import { RoomSummary } from "../../hooks/useChat";

// Extend RoomSummary locally to handle the optional avatarUrl field
// that comes from the server room-list broadcast but may not be in the type yet.
type RoomSummaryWithAvatar = RoomSummary & { avatarUrl?: string };

interface RoomListItemProps {
  room: RoomSummaryWithAvatar;
  isActive: boolean;
  unreadCount?: number;
  roomAvatars: Record<string, string>;
  onClick: () => void;
}

export default function RoomListItem({
  room,
  isActive,
  unreadCount = 0,
  roomAvatars,
  onClick,
}: RoomListItemProps) {
  // Live socket update takes precedence over the persisted value
  const avatarUrl = roomAvatars[room.id] || room.avatarUrl || "";

  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 12px",
        borderRadius: 8,
        cursor: "pointer",
        background: isActive ? "#2b5278" : "transparent",
        transition: "background 0.12s",
        userSelect: "none",
        maxWidth: "260px",
      }}
      onMouseEnter={(e) => {
        if (!isActive)
          (e.currentTarget as HTMLDivElement).style.background = "#1e2d3d";
      }}
      onMouseLeave={(e) => {
        if (!isActive)
          (e.currentTarget as HTMLDivElement).style.background = "transparent";
      }}
    >
      {/* Group avatar */}
      <Avatar
        name={room.name ?? room.id}
        size={40}
        avatarUrl={avatarUrl || undefined}
      />

      {/* Room name */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: isActive ? 600 : 500,
            color: isActive ? "#fff" : "#c5cdd6",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          # {room.name ?? room.id}
        </div>
        <div
          style={{
            fontSize: 11.5,
            color: "#5d7285",
            marginTop: 1,
          }}
        >
          {room.members?.length ?? 0} members
        </div>
      </div>

      {/* Unread badge */}
      {unreadCount > 0 && (
        <div
          style={{
            minWidth: 18,
            height: 18,
            borderRadius: 9,
            background: "#5288c1",
            color: "#fff",
            fontSize: 11,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 5px",
            flexShrink: 0,
          }}
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </div>
      )}
    </div>
  );
}