import { useState, useRef, useEffect } from "react";
import { DMConversation } from "../../types/chat";
import DMList from "../dm/DMList";
import { getAvatarColor } from "../../hooks/useChat";

export default function Sidebar({
  username,
  onLogout,
  onlineUsers,
  allUsers,
  conversations,
  activeDM,
  onOpenDM,
  onCreateGroup,
}: {
  username: string;
  onLogout: () => void;
  onlineUsers: string[];
  allUsers: string[];
  conversations: DMConversation[];
  activeDM: string | null;
  onOpenDM: (username: string) => void;
  onCreateGroup: (name: string, members: string[]) => void;
}) {
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleMember = (user: string) => {
    setSelectedMembers(prev =>
      prev.includes(user) ? prev.filter(m => m !== user) : [...prev, user]
    );
  };

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return;
    onCreateGroup(newGroupName.trim(), selectedMembers);
    setNewGroupName("");
    setSelectedMembers([]);
    setCreatingGroup(false);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Users that already have a conversation entry
  const existingUsernames = new Set(conversations.map(c => c.username));

  // All other users excluding self and those already in conversations
  const otherUsers = allUsers.filter(u => u !== username && !existingUsernames.has(u));
  const onlineOthers = otherUsers.filter(u => onlineUsers.includes(u));
  const offlineOthers = otherUsers.filter(u => !onlineUsers.includes(u));

  // Filter conversations by search
  const filteredConversations = conversations.filter(c =>
    c.username.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredOnline = onlineOthers.filter(u =>
    u.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredOffline = offlineOthers.filter(u =>
    u.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderUserRow = (user: string, isOnline: boolean) => (
    <button
      key={user}
      onClick={() => onOpenDM(user)}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "8px 10px",
        background: "transparent",
        border: "none",
        borderRadius: "10px",
        cursor: "pointer",
        marginBottom: "1px",
        transition: "background 0.15s",
        textAlign: "left",
      }}
      onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "#202b36"}
      onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "transparent"}
    >
      <div style={{ position: "relative", flexShrink: 0 }}>
        <div style={{
          width: 46,
          height: 46,
          borderRadius: "50%",
          background: isOnline ? getAvatarColor(user) : "#2c3e50",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "19px",
          fontWeight: 600,
          color: "#fff",
          opacity: isOnline ? 1 : 0.65,
        }}>
          {user[0]?.toUpperCase()}
        </div>
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
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontSize: "14.5px",
          fontWeight: 600,
          color: isOnline ? "#e8ecf0" : "#8b98a5",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {user}
        </div>
        <div style={{
          fontSize: "12px",
          color: isOnline ? "#4ade80" : "#6c7883",
          marginTop: "1px",
        }}>
          {isOnline ? "online" : "offline"}
        </div>
      </div>
    </button>
  );

  const sectionLabel = (text: string) => (
    <div style={{
      fontSize: "10.5px",
      fontWeight: 700,
      color: "#4a5568",
      textTransform: "uppercase",
      letterSpacing: "0.1em",
      padding: "8px 10px 4px",
    }}>
      {text}
    </div>
  );

  return (
    <div style={{
      width: "320px",
      height: "100%",
      background: "#17212b",
      display: "flex",
      flexDirection: "column",
      flexShrink: 0,
      borderRight: "1px solid #0d1821",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      WebkitFontSmoothing: "antialiased",
      color: "#fff",
      position: "relative",
    }}>

      {/* ── Header ── */}
      <div style={{
        padding: "10px 12px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        background: "#17212b",
        borderBottom: "1px solid #0d1821",
        flexShrink: 0,
      }}>
        {/* Hamburger */}
        <div style={{ position: "relative" }} ref={menuRef}>
          <button
            onClick={() => setShowMenu(v => !v)}
            style={{
              width: 38, height: 38,
              display: "flex", alignItems: "center", justifyContent: "center",
              borderRadius: "50%",
              border: "none",
              background: showMenu ? "#202b36" : "transparent",
              color: "#8b98a5",
              cursor: "pointer",
              flexShrink: 0,
              transition: "background 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "#202b36"}
            onMouseLeave={e => {
              if (!showMenu)(e.currentTarget as HTMLButtonElement).style.background = "transparent";
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="4" y1="7" x2="20" y2="7" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="17" x2="20" y2="17" />
            </svg>
          </button>

          {/* Dropdown menu */}
          {showMenu && (
            <div style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              left: 0,
              width: 250,
              background: "#17212b",
              borderRadius: "14px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
              border: "1px solid #0d1821",
              zIndex: 200,
              overflow: "hidden",
            }}>
              {/* Profile */}
              <div style={{
                padding: "16px",
                borderBottom: "1px solid #0d1821",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}>
                <div style={{
                  width: 48, height: 48,
                  borderRadius: "50%",
                  background: getAvatarColor(username),
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "20px", fontWeight: 700, color: "#fff",
                  flexShrink: 0,
                }}>
                  {username[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: "15px", fontWeight: 600, color: "#fff" }}>
                    {username}
                  </div>
                  <div style={{ fontSize: "12px", color: "#4ade80", marginTop: "2px" }}>
                    online
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <div style={{ padding: "6px" }}>
                <button
                  onClick={() => { setShowMenu(false); setCreatingGroup(true); }}
                  style={menuItemStyle}
                  onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "#202b36"}
                  onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "transparent"}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                    stroke="#8b98a5" strokeWidth="2" strokeLinecap="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <span style={{ fontSize: "14px", color: "#e8ecf0" }}>New Group</span>
                </button>

                <div style={{ height: "1px", background: "#0d1821", margin: "4px 6px" }} />

                <button
                  onClick={() => { setShowMenu(false); onLogout(); }}
                  style={{ ...menuItemStyle }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.1)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                    stroke="#ef4444" strokeWidth="2" strokeLinecap="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  <span style={{ fontSize: "14px", color: "#ef4444" }}>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Search */}
        <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center" }}>
          <svg style={{ position: "absolute", left: 10, pointerEvents: "none", color: "#6c7883" }}
            width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search"
            style={{
              width: "100%",
              height: 36,
              background: "#242f3d",
              border: "none",
              borderRadius: "20px",
              paddingLeft: "34px",
              paddingRight: "12px",
              fontSize: "14px",
              color: "#fff",
              outline: "none",
            }}
          />
        </div>
      </div>

      {/* ── Create Group Panel ── */}
      {creatingGroup && (
        <div style={{
          margin: "8px 10px",
          padding: "14px",
          background: "#202b36",
          borderRadius: "14px",
          border: "1px solid #0d1821",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          flexShrink: 0,
        }}>
          <div style={{
            fontSize: "11.5px",
            fontWeight: 700,
            color: "#5288c1",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}>
            New Group
          </div>

          <input
            autoFocus
            value={newGroupName}
            onChange={e => setNewGroupName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleCreateGroup()}
            placeholder="Group name…"
            style={{
              padding: "9px 12px",
              background: "#17212b",
              border: "1px solid #0d1821",
              borderRadius: "10px",
              color: "#fff",
              fontSize: "13.5px",
              outline: "none",
              transition: "border-color 0.15s",
            }}
            onFocus={e => (e.currentTarget as HTMLInputElement).style.borderColor = "#5288c1"}
            onBlur={e => (e.currentTarget as HTMLInputElement).style.borderColor = "#0d1821"}
          />

          <div style={{ fontSize: "11px", color: "#6c7883", fontWeight: 600 }}>
            Add members
          </div>

          <div style={{
            maxHeight: "150px",
            overflowY: "auto",
            background: "#17212b",
            borderRadius: "10px",
            border: "1px solid #0d1821",
            padding: "4px",
          }}>
            {allUsers.filter(u => u !== username).length === 0 ? (
              <div style={{ padding: "12px", textAlign: "center", color: "#4a5568", fontSize: "12px" }}>
                No other users yet
              </div>
            ) : (
              allUsers.filter(u => u !== username).map(user => {
                const checked = selectedMembers.includes(user);
                const isOnline = onlineUsers.includes(user);
                return (
                  <div
                    key={user}
                    onClick={() => toggleMember(user)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 10px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "#202b36"}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "transparent"}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                      <div style={{ position: "relative" }}>
                        <div style={{
                          width: 32, height: 32,
                          borderRadius: "50%",
                          background: getAvatarColor(user),
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "13px", fontWeight: 600, color: "#fff",
                        }}>
                          {user[0]?.toUpperCase()}
                        </div>
                        <span style={{
                          position: "absolute", bottom: 0, right: 0,
                          width: 9, height: 9, borderRadius: "50%",
                          background: isOnline ? "#4ade80" : "#6c7883",
                          border: "2px solid #17212b",
                        }} />
                      </div>
                      <span style={{ fontSize: "13.5px", color: "#e8ecf0", fontWeight: 500 }}>
                        {user}
                      </span>
                    </div>
                    <div style={{
                      width: 20, height: 20,
                      borderRadius: "50%",
                      border: checked ? "none" : "2px solid #4a5568",
                      background: checked ? "#5288c1" : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                      transition: "all 0.15s",
                    }}>
                      {checked && (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                          stroke="#fff" strokeWidth="3" strokeLinecap="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={handleCreateGroup}
              style={{
                flex: 1, padding: "9px",
                background: "#5288c1",
                border: "none", borderRadius: "10px",
                color: "#fff", fontSize: "13.5px", fontWeight: 600,
                cursor: "pointer",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "#4377aa"}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "#5288c1"}
            >
              Create
            </button>
            <button
              onClick={() => {
                setCreatingGroup(false);
                setNewGroupName("");
                setSelectedMembers([]);
              }}
              style={{
                flex: 1, padding: "9px",
                background: "#2c3e50",
                border: "none", borderRadius: "10px",
                color: "#8b98a5", fontSize: "13.5px",
                cursor: "pointer",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "#364f68"}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "#2c3e50"}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Conversation + User List ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "4px 6px" }}>

        {/* Existing conversations (DMs + groups) */}
        {filteredConversations.length > 0 && (
          <>
            {sectionLabel("Recent")}
            <DMList
              conversations={filteredConversations}
              activeDM={activeDM}
              onOpen={onOpenDM}
              onlineUsers={onlineUsers}
            />
          </>
        )}

        {/* Online users not yet in conversations */}
        {filteredOnline.length > 0 && (
          <>
            {sectionLabel("Online")}
            {filteredOnline.map(u => renderUserRow(u, true))}
          </>
        )}

        {/* Offline users not yet in conversations */}
        {filteredOffline.length > 0 && (
          <>
            {sectionLabel("Offline")}
            {filteredOffline.map(u => renderUserRow(u, false))}
          </>
        )}

        {/* Empty state */}
        {filteredConversations.length === 0 &&
          filteredOnline.length === 0 &&
          filteredOffline.length === 0 && (
          <div style={{
            padding: "48px 16px",
            textAlign: "center",
            color: "#4a5568",
            fontSize: "13px",
          }}>
            {searchQuery ? "No results found" : "No users yet"}
          </div>
        )}
      </div>

      {/* ── Self avatar at bottom-left ── */}
      <div style={{
        padding: "10px 14px",
        borderTop: "1px solid #0d1821",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        flexShrink: 0,
      }}>
        <div style={{
          width: 36, height: 36,
          borderRadius: "50%",
          background: getAvatarColor(username),
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "14px", fontWeight: 700, color: "#fff",
          flexShrink: 0,
        }}>
          {username[0]?.toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "13.5px", fontWeight: 600, color: "#e8ecf0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {username}
          </div>
          <div style={{ fontSize: "11px", color: "#4ade80" }}>online</div>
        </div>
      </div>
    </div>
  );
}

const menuItemStyle: React.CSSProperties = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "10px 12px",
  background: "transparent",
  border: "none",
  borderRadius: "10px",
  cursor: "pointer",
  transition: "background 0.15s",
  textAlign: "left",
};