import { useEffect, useRef, useState } from "react";
import { ChatMessage, TypingUser } from "../../types/chat";
import Avatar from "../shared/Avatar";
import TypingDots from "../shared/TypingDots";
import FilePreview from "../shared/FilePreview";
import AudioPlayer from "../shared/AudioPlayer";
import CallEventBubble from "../call/CallEventBubble";
import MessageStatusIcon from "./MessageStatus";
import ReplyPreview from "./Replypreview";
import { MessageBubble } from "./MessageBubble";

// ── Inline style objects ──────────────────────────────
// These are a deliberate fallback. If Tailwind's arbitrary-value classes
// (bg-[#182533] etc.) are for any reason not being generated in this
// project's build, these inline styles guarantee the bubble still looks
// correct. Once Tailwind is confirmed working, these can be removed and
// the className-only version restored — but for now this can't fail.
const sentBubbleStyle: React.CSSProperties = {
  background: "#2b5278",
  border: "1px solid #244565",
  borderRadius: "16px",
  borderTopRightRadius: "4px",
  padding: "8px 14px",
  fontSize: "14.5px",
  color: "#f5f6f7",
  lineHeight: 1.5,
  boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
  position: "relative",
};

const receivedBubbleStyle: React.CSSProperties = {
  background: "#182533",
  border: "1px solid #101921",
  borderRadius: "16px",
  borderTopLeftRadius: "4px",
  padding: "8px 14px",
  fontSize: "14.5px",
  color: "#f5f6f7",
  lineHeight: 1.5,
  boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
  position: "relative",
};

const containerStyle: React.CSSProperties = {
  flex: 1,
  overflowY: "auto",
  padding: "16px 20px",
  background: "#0e1621",
};

function ReactionBubbles({
  reactions,
  currentUsername,
  onReact,
}: {
  reactions: ChatMessage["reactions"];
  currentUsername: string;
  onReact: (emoji: string) => void;
}) {
  if (!reactions || reactions.length === 0) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
      {reactions.map((r) => {
        const reacted = r.usernames.includes(currentUsername);
        return (
          <button
            key={r.emoji}
            onClick={() => onReact(r.emoji)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "2px 10px",
              borderRadius: "999px",
              fontSize: "12px",
              border: reacted ? "1px solid rgba(82,136,193,0.4)" : "1px solid #101921",
              background: reacted ? "rgba(82,136,193,0.2)" : "#202b36",
              color: reacted ? "#5288c1" : "#9aa5b1",
              fontWeight: reacted ? 600 : 400,
              cursor: "pointer",
            }}
          >
            <span>{r.emoji}</span>
            <span style={{ fontSize: "11px", opacity: 0.9 }}>{r.count}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function MessageList({
  messages,
  typingUser,
  currentRoom,
  currentUsername,
  onReact,
  onSeen,
  onReply,
  onForward,
  onlineUsers,
  rooms,
}: {
  messages: ChatMessage[];
  typingUser: TypingUser | null;
  currentRoom: string;
  currentUsername: string;
  onReact: (messageId: string, emoji: string) => void;
  onSeen?: (messageIds: string[]) => void;
  onReply: (msg: { _id: string; username: string; text: string }) => void;
  onForward: (text: string, fromUsername: string, to: string, isRoom: boolean) => void;
  onlineUsers: string[];
  rooms: { id: string; name: string }[];
}) {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUser]);

  useEffect(() => {
    const dismiss = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-hover-panel]")) return;
      setHoveredId(null);
    };
    document.addEventListener("touchstart", dismiss);
    return () => document.removeEventListener("touchstart", dismiss);
  }, []);

  useEffect(() => {
    const unseenIds = messages
      .filter((m) => !m.fromSelf && m._id && m.status !== "seen")
      .map((m) => m._id!);
    if (unseenIds.length > 0) onSeen?.(unseenIds);
  }, [messages]);

  return (
    <div className="custom-scrollbar" style={containerStyle}>
      {/* Room divider */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
        <div style={{ flex: 1, height: "1px", background: "#101921" }} />
        <span
          style={{
            fontSize: "12px",
            color: "#5288c1",
            background: "#17212b",
            border: "1px solid #101921",
            padding: "4px 16px",
            borderRadius: "999px",
            fontWeight: 600,
            letterSpacing: "0.02em",
          }}
        >
          # {currentRoom}
        </span>
        <div style={{ flex: 1, height: "1px", background: "#101921" }} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {messages.map((msg, i) => {
          const id = msg._id ?? String(i);

          if (msg.callEvent) {
            return (
              <CallEventBubble
                key={id}
                callEvent={msg.callEvent}
                callType={msg.callType ?? "voice"}
                callDuration={msg.callDuration}
                fromSelf={msg.fromSelf}
                username={msg.username}
                time={msg.time}
              />
            );
          }

          return msg.fromSelf ? (
            /* Sent message row */
            <div key={id} style={{ display: "flex", justifyContent: "flex-end" }}>
              <div style={{ maxWidth: "70%" }}>
                <MessageBubble
                  id={id}
                  hoveredId={hoveredId}
                  setHoveredId={setHoveredId}
                  fromSelf={true}
                  msgId={msg._id}
                  msgUsername={msg.username}
                  msgText={msg.text}
                  onReact={onReact}
                  onReply={onReply}
                  onForward={(text, fromUsername) =>
                    onForward(text, fromUsername, currentRoom, true)
                  }
                  onlineUsers={onlineUsers}
                  rooms={rooms}
                  currentUsername={currentUsername}
                >
                  <div style={sentBubbleStyle}>
                    {msg.forwarded && (
                      <div style={{ fontSize: "11px", color: "#8ab4f8", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px", borderLeft: "2px solid #5288c1", paddingLeft: "10px" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="15 17 20 12 15 7" />
                          <path d="M4 18v-2a4 4 0 0 1 4-4h12" />
                        </svg>
                        <span style={{ fontWeight: 500 }}>Forwarded from @{msg.fromUsername || msg.username}</span>
                      </div>
                    )}

                    {msg.replyTo && <ReplyPreview replyTo={msg.replyTo} fromSelf={true} />}
                    {msg.text && <span style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", display: "block" }}>{msg.text}</span>}
                    {msg.caption && <div style={{ fontSize: "12px", color: "#d1d5db", marginTop: "4px", fontStyle: "italic" }}>{msg.caption}</div>}
                    {msg.audioUrl && <AudioPlayer audioUrl={msg.audioUrl} audioDuration={msg.audioDuration} fromSelf={true} />}
                    {msg.fileUrl && <FilePreview fileUrl={msg.fileUrl} fileName={msg.fileName} fileType={msg.fileType} isImage={msg.isImage} />}

                    {msg.reactions && msg.reactions.length > 0 && (
                      <ReactionBubbles reactions={msg.reactions} currentUsername={currentUsername} onReact={(emoji) => msg._id && onReact(msg._id, emoji)} />
                    )}

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "6px", marginTop: "4px", opacity: 0.75 }}>
                      <span style={{ fontSize: "10px", color: "rgba(209,213,219,0.8)", fontWeight: 500 }}>{msg.time}</span>
                      <MessageStatusIcon status={msg.status} />
                    </div>
                  </div>
                </MessageBubble>
              </div>
            </div>
          ) : (
            /* Received message row */
            <div key={id} style={{ display: "flex", alignItems: "flex-end", gap: "10px", maxWidth: "70%" }}>
              <div style={{ flexShrink: 0, marginBottom: "4px" }}>
                <Avatar name={msg.username} size={32} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "12px", color: "#5288c1", marginBottom: "4px", marginLeft: "6px", fontWeight: 600, letterSpacing: "0.02em" }}>
                  @{msg.username}
                </div>
                <MessageBubble
                  id={id}
                  hoveredId={hoveredId}
                  setHoveredId={setHoveredId}
                  fromSelf={false}
                  msgId={msg._id}
                  msgUsername={msg.username}
                  msgText={msg.text}
                  onReact={onReact}
                  onReply={onReply}
                  onForward={onForward}
                  onlineUsers={onlineUsers}
                  rooms={rooms}
                  currentUsername={currentUsername}
                >
                  <div style={receivedBubbleStyle}>
                    {msg.forwarded && (
                      <div style={{ fontSize: "11px", color: "#6c7883", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px", borderLeft: "2px solid #475569", paddingLeft: "10px" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="15 17 20 12 15 7" />
                          <path d="M4 18v-2a4 4 0 0 1 4-4h12" />
                        </svg>
                        <span style={{ fontWeight: 500 }}>Forwarded from @{msg.fromUsername || msg.username}</span>
                      </div>
                    )}

                    {msg.replyTo && <ReplyPreview replyTo={msg.replyTo} fromSelf={false} />}
                    {msg.text && <span style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", display: "block" }}>{msg.text}</span>}
                    {msg.caption && <div style={{ fontSize: "12px", color: "#9ca3af", marginTop: "4px", fontStyle: "italic" }}>{msg.caption}</div>}
                    {msg.audioUrl && <AudioPlayer audioUrl={msg.audioUrl} audioDuration={msg.audioDuration} fromSelf={false} />}
                    {msg.fileUrl && <FilePreview fileUrl={msg.fileUrl} fileName={msg.fileName} fileType={msg.fileType} isImage={msg.isImage} />}

                    {msg.reactions && msg.reactions.length > 0 && (
                      <ReactionBubbles reactions={msg.reactions} currentUsername={currentUsername} onReact={(emoji) => msg._id && onReact(msg._id, emoji)} />
                    )}

                    <div style={{ fontSize: "10px", color: "#9ca3af", marginTop: "4px", textAlign: "right", fontWeight: 500, opacity: 0.75 }}>
                      {msg.time}
                    </div>
                  </div>
                </MessageBubble>
              </div>
            </div>
          );
        })}
      </div>

      {/* Typing indicator */}
      {typingUser && (
        <div style={{ display: "flex", alignItems: "flex-end", gap: "10px", maxWidth: "70%", marginTop: "12px" }}>
          <Avatar name={typingUser.name} size={32} />
          <div>
            <div style={{ fontSize: "12px", color: "#5288c1", marginBottom: "4px", marginLeft: "6px", fontWeight: 600 }}>
              @{typingUser.name}
            </div>
            <div style={{ ...receivedBubbleStyle, padding: "10px 14px" }}>
              <TypingDots />
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}