import Avatar from "../shared/Avatar";

export default function RoomHeader({
  currentRoom,
  members,
  connected,
  onlineUsers,
  currentUsername,
  onOpenDM,
}: {
  /** Display name of the room (e.g. "friend"), not the slug. */
  currentRoom: string;
  /** Usernames who belong to this specific room — not the global online list. */
  members: string[];
  connected: boolean;
  /** Global online roster, used only to check each member's status. */
  onlineUsers: string[];
  currentUsername: string;
  onOpenDM: (username: string) => void;
}) {
  // Defensive fallback: the room list can briefly be empty/stale right
  // after switching rooms (one render before useRoom/useChat catch up),
  // so this component must never assume members is a populated array.
  const safeMembers = members ?? [];
  const safeOnline = onlineUsers ?? [];

  const onlineMembers = safeMembers.filter((m) => safeOnline.includes(m));
  const offlineMembers = safeMembers.filter((m) => !safeOnline.includes(m));
  // Online members first, current user pinned last within their group so
  // the strip reads "who else is here" before "and also me".
  const orderedMembers = [
    ...onlineMembers.filter((m) => m !== currentUsername),
    ...onlineMembers.filter((m) => m === currentUsername),
    ...offlineMembers,
  ];

  return (
    <>
      {/* Top bar */}
      <div className="bg-[#17212b] border-b border-[#0d1821] px-4 py-3 flex items-center gap-3 shrink-0">
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#5288c1] to-[#3a6491] flex items-center justify-center text-white font-semibold text-lg shrink-0 shadow-sm">
          #
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-white font-semibold text-[15.5px] truncate leading-tight">
            {currentRoom}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className="w-[7px] h-[7px] rounded-full shrink-0"
              style={{ background: connected ? "#4ade80" : "#f44336" }}
            />
            <span className="text-[12.5px] text-[#8b98a5]">
              {connected
                ? `${safeMembers.length} member${safeMembers.length === 1 ? "" : "s"}${
                    onlineMembers.length > 0 ? ` · ${onlineMembers.length} online` : ""
                  }`
                : "offline"}
            </span>
          </div>
        </div>
      </div>

      {/* Member strip */}
      {safeMembers.length > 0 && (
        <div className="px-3.5 py-2.5 border-b border-[#0d1821] bg-[#17212b] flex items-center gap-4 overflow-x-auto shrink-0">
          {orderedMembers.map((name) => {
            const isOnline = safeOnline.includes(name);
            const isSelf = name === currentUsername;
            return (
              <button
                key={name}
                onClick={() => !isSelf && onOpenDM(name)}
                disabled={isSelf}
                className={`flex flex-col items-center gap-1 shrink-0 group ${
                  isSelf ? "cursor-default" : "cursor-pointer"
                }`}
              >
                <div className="relative">
                  <Avatar name={name} size={36} ring={isOnline} />
                  <span
                    className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#17212b]"
                    style={{ background: isOnline ? "#4ade80" : "#566372" }}
                  />
                </div>
                <span
                  className={`text-[10.5px] transition-colors max-w-[48px] truncate ${
                    isOnline ? "text-[#c5cdd6]" : "text-[#566372]"
                  } ${!isSelf ? "group-hover:text-[#5288c1]" : ""}`}
                >
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