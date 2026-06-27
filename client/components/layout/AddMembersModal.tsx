import { useState } from "react";
import Avatar from "../shared/Avatar";
import { UserProfile } from "../../hooks/useChat";

export default function AddMembersModal({
  allUsers,
  existingMembers,
  onlineUsers,
  userProfiles,
  onClose,
  onAdd,
}: {
  allUsers: string[];
  existingMembers: string[];
  onlineUsers: string[];
  userProfiles: Record<string, UserProfile>;
  onClose: () => void;
  onAdd: (members: string[]) => void;
}) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const existingSet = new Set(existingMembers);
  const candidates = allUsers
    .filter((u) => !existingSet.has(u))
    .filter((u) => u.toLowerCase().includes(search.toLowerCase()));

  const toggle = (user: string) => {
    setSelected((prev) =>
      prev.includes(user) ? prev.filter((m) => m !== user) : [...prev, user]
    );
  };

  const handleAdd = () => {
    if (selected.length === 0) return;
    onAdd(selected);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-[#17212b] rounded-2xl shadow-2xl w-[400px] max-h-[80vh] flex flex-col border border-[#0d1821] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
          <div className="text-white font-bold text-[17px]">
            Add members{selected.length > 0 ? ` · ${selected.length}` : ""}
          </div>
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

        {/* Search */}
        <div className="px-5 pb-2 shrink-0">
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search people"
            className="w-full px-3.5 py-2.5 bg-[#202b36] border border-[#0d1821] rounded-xl text-white text-[14px] outline-none transition-colors duration-150 focus:border-[#5288c1] placeholder:text-[#4a5568]"
          />
        </div>

        {/* Selected chips */}
        {selected.length > 0 && (
          <div className="px-5 pb-2 flex flex-wrap gap-1.5 shrink-0">
            {selected.map((m) => (
              <button
                key={m}
                onClick={() => toggle(m)}
                className="flex items-center gap-1.5 pl-1 pr-2 py-1 bg-[#2b5278] rounded-full text-[12.5px] text-white hover:bg-[#345f8c] transition-colors"
              >
                <Avatar name={m} size={20} avatarUrl={userProfiles[m]?.avatarUrl} />
                {m}
                <span className="text-[#bcd2e8]">×</span>
              </button>
            ))}
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-2">
          {candidates.length === 0 ? (
            <div className="p-6 text-center text-[#4a5568] text-[13px]">
              {search ? "No matching users" : "Everyone is already in this group"}
            </div>
          ) : (
            candidates.map((user) => {
              const checked = selected.includes(user);
              const isOnline = onlineUsers.includes(user);
              return (
                <div
                  key={user}
                  onClick={() => toggle(user)}
                  className="flex items-center justify-between px-2.5 py-2.5 rounded-xl cursor-pointer transition-colors duration-100 hover:bg-[#202b36]"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar name={user} size={38} avatarUrl={userProfiles[user]?.avatarUrl} />
                      <span className={`absolute bottom-0 right-0 w-[10px] h-[10px] rounded-full border-2 border-[#17212b] ${isOnline ? "bg-[#4ade80]" : "bg-[#6c7883]"}`} />
                    </div>
                    <span className="text-[14px] text-[#e8ecf0] font-medium">{user}</span>
                  </div>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-150 ${checked ? "bg-[#5288c1] border-none" : "bg-transparent border-2 border-[#4a5568]"}`}>
                    {checked && (
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 py-4 shrink-0 border-t border-[#0d1821]">
          <button onClick={onClose} className="flex-1 py-2.5 bg-[#202b36] border-none rounded-xl text-[#8b98a5] text-[13.5px] cursor-pointer transition-colors duration-150 hover:bg-[#2c3e50]">
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={selected.length === 0}
            className="flex-1 py-2.5 bg-[#5288c1] border-none rounded-xl text-white text-[13.5px] font-semibold cursor-pointer transition-colors duration-150 hover:bg-[#4377aa] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}