
import { useState, useRef, useEffect } from "react";
import { DMConversation } from "../../types/chat";
import DMList from "../dm/DMList";

export default function Sidebar({
  username,
  onLogout,
  onlineUsers,
  conversations,
  activeDM,
  onOpenDM,
  onCreateGroup,   
  onCreateChannel, 
}: {
  username: string;
  onLogout: () => void;
  onlineUsers: string[];
  conversations: DMConversation[];
  activeDM: string | null;
  onOpenDM: (username: string) => void;
  onCreateGroup: (name: string, members: string[]) => void;
  onCreateChannel: (name: string) => void;
}) {
  const [creatingType, setCreatingType] = useState<"group" | "channel" | null>(null);
  const [newName, setNewName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  const [isNightMode, setIsNightMode] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleMemberSelection = (user: string) => {
    if (selectedMembers.includes(user)) {
      setSelectedMembers(selectedMembers.filter((m) => m !== user));
    } else {
      setSelectedMembers([...selectedMembers, user]);
    }
  };

  const handleCreateChat = () => {
    if (!newName.trim()) return;
    
    if (creatingType === "group") {
      onCreateGroup(newName.trim(), selectedMembers);
    } else if (creatingType === "channel") {
      onCreateChannel(newName.trim());
    }
    
    setNewName("");
    setSelectedMembers([]);
    setCreatingType(null);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="w-[320px] h-full bg-[#17212b] flex flex-col flex-shrink-0 border-r border-[#101921] font-sans antialiased relative text-white selection:bg-[#5288c1]/30">
      
      {/* Top Header Bar */}
      <div className="p-2.5 flex items-center gap-2 bg-[#17212b]">
        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className={`w-[42px] h-[42px] flex items-center justify-center rounded-xl text-[#6c7883] transition-all duration-200 ${
              showMenu ? "bg-[#202b36] text-[#5288c1]" : "hover:bg-[#202b36] active:scale-95"
            }`}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="12" x2="20" y2="12"></line>
              <line x1="4" y1="6" x2="20" y2="6"></line>
              <line x1="4" y1="18" x2="20" y2="18"></line>
            </svg>
          </button>

          {/* Telegram Dropdown Popup Menu */}
          {showMenu && (
            <div className="absolute left-1 mt-2 w-[290px] bg-[#17212b] rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] border border-[#101921] py-2 z-50 text-white">
              <div className="px-4.5 py-4 border-b border-[#101921] flex flex-col gap-3">
                <div className="w-14 h-14 rounded-full bg-[#5288c1] flex items-center justify-center text-white text-xl font-semibold">
                  {username[0]?.toUpperCase()}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[16px] font-semibold truncate">@{username}</span>
                </div>
              </div>

              <div className="py-1.5 px-2 space-y-[2px]">
                <button 
                  onClick={() => { setShowMenu(false); setCreatingType("group"); }}
                  className="w-full flex items-center gap-4 px-3 py-2.5 rounded-xl text-[14px] text-left hover:bg-[#202b36] text-[#e1e5e9]"
                >
                  <span>New Group</span>
                </button>
                <button 
                  onClick={() => { setShowMenu(false); setCreatingType("channel"); }}
                  className="w-full flex items-center gap-4 px-3 py-2.5 rounded-xl text-[14px] text-left hover:bg-[#202b36] text-[#e1e5e9]"
                >
                  <span>New Channel</span>
                </button>
                <button onClick={onLogout} className="w-full flex items-center gap-4 px-3 py-2.5 rounded-xl text-[14px] text-left text-red-400 hover:bg-red-500/10">
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 relative flex items-center">
          <input
            type="text"
            readOnly
            placeholder="Search"
            className="w-full bg-[#24303f] text-[#ffffff] placeholder-[#6c7883] text-[15px] rounded-xl pl-10 pr-4 h-[42px] outline-none"
          />
          <svg className="absolute left-3.5 text-[#6c7883]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
      </div>

      {/* Creation Interface Panel */}
      {creatingType && (
        <div className="mx-3 mb-2 p-3 rounded-xl border border-[#101921] bg-[#202b36] flex flex-col gap-2 max-h-[280px] overflow-hidden">
          <div className="text-[12px] font-bold text-[#5288c1] uppercase tracking-wider">
            New {creatingType === "group" ? "Group Chat" : "Channel Feed"}
          </div>
          <input
            autoFocus
            className="w-full px-3 py-2 rounded-lg bg-[#17212b] border border-[#101921] text-white text-[14px] outline-none focus:border-[#5288c1]"
            placeholder={creatingType === "group" ? "Enter group name..." : "Enter channel title..."}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />

          {/* Member Invitation Selection List */}
          {creatingType === "group" && (
            <div className="flex-1 flex flex-col min-h-0 mt-1">
              <span className="text-[11px] text-[#6c7883] mb-1 font-semibold">Select contacts to invite:</span>
              <div className="overflow-y-auto space-y-1 pr-1 flex-1 bg-[#17212b] p-1.5 rounded-lg border border-[#101921]">
                {onlineUsers
                  .filter((u) => u !== username)
                  .map((user) => {
                    const isChecked = selectedMembers.includes(user);
                    return (
                      <div 
                        key={user}
                        onClick={() => toggleMemberSelection(user)}
                        className="flex items-center justify-between p-1.5 rounded-md hover:bg-[#202b36] cursor-pointer transition-colors"
                      >
                        <span className="text-[13px] font-medium text-gray-200">@{user}</span>
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                          isChecked ? "bg-[#5288c1] border-[#5288c1]" : "border-gray-500"
                        }`}>
                          {isChecked && <span className="text-[10px] text-white font-bold">✓</span>}
                        </div>
                      </div>
                    );
                  })}
                {onlineUsers.filter((u) => u !== username).length === 0 && (
                  <div className="text-[12px] text-gray-500 text-center py-2">No active contacts online</div>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-2 mt-1.5">
            <button onClick={handleCreateChat} className="flex-1 py-1.5 rounded-lg bg-[#5288c1] text-white text-[13px] font-semibold hover:bg-[#4376aa]">
              Create
            </button>
            <button onClick={() => { setCreatingType(null); setSelectedMembers([]); }} className="flex-1 py-1.5 rounded-lg bg-gray-700 text-gray-200 text-[13px]">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Unified Feed View Layout */}
      <div className="flex-1 overflow-y-auto px-1.5 py-1">
        <DMList 
          conversations={conversations} 
          activeDM={activeDM} 
          onOpen={onOpenDM} 
          onlineUsers={onlineUsers} 
        />
      </div>
    </div>
  );
}

