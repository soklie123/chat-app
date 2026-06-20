import Avatar from "../shared/Avatar";

export default function RoomHeader({
  currentRoom,
  connected,
  onlineUsers,
  currentUsername,
  onOpenDM,
}: {
  currentRoom: string;
  connected: boolean;
  onlineUsers: string[];
  currentUsername: string;
  onOpenDM: (username: string) => void;
}) {
  return (
    <>
      {/* Top bar */}
      <div className="bg-[#17212b] border-b border-[#101921] px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-[#5288c1] flex items-center justify-center text-white font-semibold flex-shrink-0">
          #
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-white font-semibold text-[15px] truncate">
            {currentRoom}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className="w-[7px] h-[7px] rounded-full flex-shrink-0"
              style={{ background: connected ? "#4ade80" : "#f44336" }}
            />
            <span className="text-[12px] text-[#8b98a5]">
              {connected ? `${onlineUsers.length} online` : "offline"}
            </span>
          </div>
        </div>
      </div>

      {/* Online users strip */}
      {onlineUsers.length > 0 && (
        <div className="px-3.5 py-2.5 border-b border-[#101921] bg-[#17212b] flex items-center gap-4 overflow-x-auto flex-shrink-0">
          {onlineUsers.map((name) => (
            <button
              key={name}
              onClick={() => name !== currentUsername && onOpenDM(name)}
              className="flex flex-col items-center gap-1 flex-shrink-0 group"
            >
              <Avatar name={name} size={34} ring />
              <span className="text-[10px] text-[#8b98a5] group-hover:text-[#5288c1] transition-colors">
                {name}
              </span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}