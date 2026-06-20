import { useState, useRef, useEffect } from "react";
import { DMMessage } from "../../types/chat";
import Avatar from "../shared/Avatar";
import TypingDots from "../shared/TypingDots";
import FilePreview from "../shared/FilePreview";
import axios from "axios";
import { MdPhone, MdVideocam } from "react-icons/md";
import CallEventBubble from "../call/CallEventBubble";
import MessageStatusIcon from "../chat/MessageStatus";
import ReplyPreview from "../chat/Replypreview";
import ReplyBar from "../chat/ReplyBar";
import { MessageBubble } from "../chat/MessageBubble";

const UPLOAD_URL = "http://localhost:4000/upload";

const sentBubble: React.CSSProperties = {
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

const receivedBubble: React.CSSProperties = {
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

export default function DMPanel({
  currentUsername,
  withUser,
  messages,
  dmTyping,
  isOnline,
  onSend,
  onTyping,
  onClose,
  onReact,
  onVideoCall,
  onVoiceCall,
  onSeen,
  onReply,
  onForward,
  onlineUsers,
  rooms,
  replyTo,
  onCancelReply,
  forwardMsg,
  onCancelForward,
  onForwardSend,
}: {
  currentUsername: string;
  withUser: string;
  messages: DMMessage[];
  dmTyping: string | null;
  isOnline: boolean;
  onSend: (
    text: string,
    file?: { fileUrl: string; fileName: string; fileType: string; isImage: boolean },
    audio?: { audioUrl: string; audioDuration: string },
    replyTo?: { _id: string; username: string; text: string }
  ) => void;
  onTyping: (value: string) => void;
  onClose: () => void;
  onReact?: (messageId: string, emoji: string) => void;
  onVoiceCall: () => void;
  onVideoCall: () => void;
  onSeen?: (messageIds: string[]) => void;
  onReply?: (msg: { _id: string; username: string; text: string }) => void;
  onForward?: (text: string, fromUsername: string, to: string, isRoom: boolean) => void;
  onlineUsers?: string[];
  rooms?: { id: string; name: string }[];
  replyTo?: { _id: string; username: string; text: string };
  onCancelReply?: () => void;
  forwardMsg?: { text: string; fromUsername: string };
  onCancelForward?: () => void;
  onForwardSend?: (text: string, fromUsername: string, caption: string) => void;
}) {
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    fileUrl: string; fileName: string; fileType: string; isImage: boolean;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, dmTyping]);

  useEffect(() => {
    const dismiss = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-reaction-picker]") || target.closest("[data-hover-panel]")) return;
      setHoveredId(null);
    };
    document.addEventListener("touchstart", dismiss);
    return () => document.removeEventListener("touchstart", dismiss);
  }, []);

  useEffect(() => {
    const unseenIds = messages.filter((m) => !m.fromSelf && m._id).map((m) => m._id!);
    if (unseenIds.length > 0) onSeen?.(unseenIds);
  }, [messages]);

  const handleSend = () => {
    if (forwardMsg && onForwardSend) {
      onForwardSend(forwardMsg.text, forwardMsg.fromUsername, message.trim());
      setMessage("");
      setPreview(null);
      return;
    }
    if (!message.trim() && !preview) return;
    onSend(message, preview ?? undefined, undefined, replyTo);
    onCancelReply?.();
    setMessage("");
    setPreview(null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await axios.post(UPLOAD_URL, formData);
      setPreview({
        fileUrl: res.data.url,
        fileName: res.data.originalName,
        fileType: res.data.mimetype,
        isImage: res.data.isImage,
      });
    } catch {
      alert("Upload failed.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const hasContent = !!(message.trim() || preview || forwardMsg);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#0e1621" }}>

      {/* ── Header ── */}
      <div style={{
        background: "#17212b",
        borderBottom: "1px solid #0d1821",
        padding: "10px 16px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        flexShrink: 0,
      }}>
        <div style={{ position: "relative" }}>
          <Avatar name={withUser} size={38} />
          <span style={{
            position: "absolute", bottom: 1, right: 1,
            width: 11, height: 11, borderRadius: "50%",
            background: isOnline ? "#4ade80" : "#6c7883",
            border: "2px solid #17212b",
          }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "15px", fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {withUser}
          </div>
          <div style={{ fontSize: "12px", color: isOnline ? "#4ade80" : "#8b98a5", marginTop: "1px" }}>
            {isOnline ? "online" : "offline"}
          </div>
        </div>

        {/* Voice call */}
        <button title="Voice call" onClick={onVoiceCall} style={headerBtnStyle}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#202b36"; (e.currentTarget as HTMLButtonElement).style.color = "#5288c1"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "#8b98a5"; }}>
          <MdPhone size={19} />
        </button>

        {/* Video call */}
        <button title="Video call" onClick={onVideoCall} style={headerBtnStyle}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#202b36"; (e.currentTarget as HTMLButtonElement).style.color = "#5288c1"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "#8b98a5"; }}>
          <MdVideocam size={19} />
        </button>

        {/* Back / close */}
        <button onClick={onClose} style={headerBtnStyle}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#202b36"; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "#8b98a5"; }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
      </div>

      {/* ── Messages ── */}
      <div className="custom-scrollbar" style={{
        flex: 1,
        overflowY: "auto",
        padding: "16px 20px",
        background: "#0e1621",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
      }}>
        {messages.length === 0 && (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", flex: 1, gap: "12px", color: "#6c7883",
          }}>
            <Avatar name={withUser} size={56} />
            <p style={{ fontSize: "13px", textAlign: "center" }}>
              Start a conversation with{" "}
              <strong style={{ color: "#8b98a5" }}>{withUser}</strong>
            </p>
          </div>
        )}

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
            <div key={id} style={{ display: "flex", justifyContent: "flex-end" }}>
              <div style={{ maxWidth: "70%" }}>
                <MessageBubble
                  id={id} hoveredId={hoveredId} setHoveredId={setHoveredId}
                  fromSelf={true} msgId={msg._id} msgUsername={msg.username} msgText={msg.text}
                  onReact={(msgId, emoji) => onReact?.(msgId, emoji)}
                  onReply={(m) => onReply?.(m)}
                  onForward={(text, fromUsername) => onForward?.(text, fromUsername, withUser, false)}
                  onlineUsers={onlineUsers ?? []} rooms={rooms ?? []} currentUsername={currentUsername}
                >
                  <div style={sentBubble}>
                    {msg.forwarded && (
                      <div style={{ fontSize: "11px", color: "#8ab4f8", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px", borderLeft: "2px solid #5288c1", paddingLeft: "10px" }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 17 20 12 15 7" /><path d="M4 18v-2a4 4 0 0 1 4-4h12" /></svg>
                        <span style={{ fontWeight: 500 }}>Forwarded</span>
                      </div>
                    )}
                    {msg.replyTo && <ReplyPreview replyTo={msg.replyTo} fromSelf={true} />}
                    {msg.text && <span style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", display: "block" }}>{msg.text}</span>}
                    {msg.caption && <div style={{ fontSize: "12px", color: "#d1d5db", marginTop: "4px", fontStyle: "italic" }}>{msg.caption}</div>}
                    {msg.fileUrl && <FilePreview fileUrl={msg.fileUrl} fileName={msg.fileName} fileType={msg.fileType} isImage={msg.isImage} />}
                    {msg.reactions && msg.reactions.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
                        {msg.reactions.map((r) => {
                          const reacted = r.usernames.includes(currentUsername);
                          return (
                            <button key={r.emoji}
                              onClick={() => msg._id && onReact?.(msg._id, r.emoji)}
                              style={{ display: "flex", alignItems: "center", gap: "5px", padding: "2px 10px", borderRadius: "999px", fontSize: "12px", border: reacted ? "1px solid rgba(82,136,193,0.4)" : "1px solid #244565", background: reacted ? "rgba(82,136,193,0.2)" : "#1e3a56", color: reacted ? "#5288c1" : "#9aa5b1", fontWeight: reacted ? 600 : 400, cursor: "pointer" }}>
                              <span>{r.emoji}</span><span style={{ fontSize: "11px" }}>{r.count}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "5px", marginTop: "4px", opacity: 0.75 }}>
                      <span style={{ fontSize: "10px", color: "rgba(209,213,219,0.8)", fontWeight: 500 }}>{msg.time}</span>
                      <MessageStatusIcon status={msg.status} />
                    </div>
                  </div>
                </MessageBubble>
              </div>
            </div>
          ) : (
            <div key={id} style={{ display: "flex", alignItems: "flex-end", gap: "10px", maxWidth: "70%" }}>
              <div style={{ flexShrink: 0, marginBottom: "4px" }}>
                <Avatar name={msg.username} size={32} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <MessageBubble
                  id={id} hoveredId={hoveredId} setHoveredId={setHoveredId}
                  fromSelf={false} msgId={msg._id} msgUsername={msg.username} msgText={msg.text}
                  onReact={(msgId, emoji) => onReact?.(msgId, emoji)}
                  onReply={(m) => onReply?.(m)}
                  onForward={(text, fromUsername) => onForward?.(text, fromUsername, withUser, false)}
                  onlineUsers={onlineUsers ?? []} rooms={rooms ?? []} currentUsername={currentUsername}
                >
                  <div style={receivedBubble}>
                    {msg.forwarded && (
                      <div style={{ fontSize: "11px", color: "#6c7883", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px", borderLeft: "2px solid #475569", paddingLeft: "10px" }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 17 20 12 15 7" /><path d="M4 18v-2a4 4 0 0 1 4-4h12" /></svg>
                        <span style={{ fontWeight: 500 }}>Forwarded</span>
                      </div>
                    )}
                    {msg.replyTo && <ReplyPreview replyTo={msg.replyTo} fromSelf={false} />}
                    {msg.text && <span style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", display: "block" }}>{msg.text}</span>}
                    {msg.caption && <div style={{ fontSize: "12px", color: "#9ca3af", marginTop: "4px", fontStyle: "italic" }}>{msg.caption}</div>}
                    {msg.fileUrl && <FilePreview fileUrl={msg.fileUrl} fileName={msg.fileName} fileType={msg.fileType} isImage={msg.isImage} />}
                    {msg.reactions && msg.reactions.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
                        {msg.reactions.map((r) => {
                          const reacted = r.usernames.includes(currentUsername);
                          return (
                            <button key={r.emoji}
                              onClick={() => msg._id && onReact?.(msg._id, r.emoji)}
                              style={{ display: "flex", alignItems: "center", gap: "5px", padding: "2px 10px", borderRadius: "999px", fontSize: "12px", border: reacted ? "1px solid rgba(82,136,193,0.4)" : "1px solid #101921", background: reacted ? "rgba(82,136,193,0.2)" : "#202b36", color: reacted ? "#5288c1" : "#9aa5b1", fontWeight: reacted ? 600 : 400, cursor: "pointer" }}>
                              <span>{r.emoji}</span><span style={{ fontSize: "11px" }}>{r.count}</span>
                            </button>
                          );
                        })}
                      </div>
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

        {dmTyping && (
          <div style={{ display: "flex", alignItems: "flex-end", gap: "10px", maxWidth: "70%", marginTop: "4px" }}>
            <Avatar name={withUser} size={32} />
            <div style={{ ...receivedBubble, padding: "10px 14px" }}>
              <TypingDots />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Bottom bar (reply + forward + input) ── */}
      <div style={{ background: "#17212b", borderTop: "1px solid #0d1821", flexShrink: 0 }}>

        {/* File preview strip */}
        {preview && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", padding: "10px 16px 0" }}>
            <FilePreview {...preview} />
            <button onClick={() => setPreview(null)} style={iconBtnStyle}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#202b36"; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "#6c7883"; }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}

        {/* Reply bar */}
        {replyTo && onCancelReply && (
          <ReplyBar replyTo={replyTo} onCancel={onCancelReply} />
        )}

        {/* Forward bar */}
        {forwardMsg && onCancelForward && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "7px 14px 7px 12px", borderTop: "1px solid #0d1821" }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#f4a93f" strokeWidth="2.2" strokeLinecap="round" style={{ flexShrink: 0 }}>
              <polyline points="15 17 20 12 15 7" /><path d="M4 18v-2a4 4 0 0 1 4-4h12" />
            </svg>
            <div style={{ display: "flex", alignItems: "stretch", gap: "9px", flex: 1, minWidth: 0 }}>
              <div style={{ width: "2px", minHeight: "34px", background: "#f4a93f", borderRadius: "2px", flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "12.5px", fontWeight: 600, color: "#f4a93f", marginBottom: "1px" }}>
                  Forwarded from {forwardMsg.fromUsername}
                </div>
                <div style={{ fontSize: "12.5px", color: "#8b98a5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {forwardMsg.text || "📎 File"}
                </div>
              </div>
            </div>
            <button onClick={() => { setMessage(""); setPreview(null); onCancelForward?.(); }} style={iconBtnStyle}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#202b36"; (e.currentTarget as HTMLButtonElement).style.color = "#c5cdd6"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "#6c7883"; }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}

        {/* Main input row */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 10px" }}>
          {/* Attach button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{ ...roundBtnStyle, color: uploading ? "#5288c1" : "#8b98a5" }}
            onMouseEnter={e => { if (!uploading) { (e.currentTarget as HTMLButtonElement).style.background = "#202b36"; (e.currentTarget as HTMLButtonElement).style.color = "#5288c1"; }}}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "#8b98a5"; }}
          >
            {uploading ? (
              <svg style={{ animation: "tg-spin 1s linear infinite" }} width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            ) : (
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            )}
          </button>

          <input ref={fileInputRef} type="file" style={{ display: "none" }}
            accept=".jpg,.jpeg,.png,.gif,.pdf,.docx,.doc"
            onChange={handleFileChange}
          />

          {/* Text input */}
          <input
            style={{
              flex: 1,
              height: 40,
              background: "#242f3d",
              border: "none",
              borderRadius: "22px",
              padding: "0 18px",
              fontSize: "14.5px",
              color: "#fff",
              outline: "none",
            }}
            value={message}
            onChange={e => { setMessage(e.target.value); onTyping(e.target.value); }}
            placeholder={
              forwardMsg ? "Add a caption…"
              : preview ? `Caption for ${withUser}…`
              : `Message ${withUser}…`
            }
            onKeyDown={e => e.key === "Enter" && handleSend()}
          />

          {/* Send (when has content) or Mic (when empty) */}
          <button
            onClick={hasContent ? handleSend : undefined}
            style={{
              ...roundBtnStyle,
              width: 40, height: 40,
              background: "#5288c1",
              color: "#fff",
              flexShrink: 0,
            }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "#4377aa"}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "#5288c1"}
            onMouseDown={e => (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.92)"}
            onMouseUp={e => (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"}
          >
            {hasContent ? (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            ) : (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Spin keyframe */}
      <style>{`@keyframes tg-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Shared button styles ──────────────────────────────
const headerBtnStyle: React.CSSProperties = {
  width: 36, height: 36,
  display: "flex", alignItems: "center", justifyContent: "center",
  borderRadius: "50%",
  border: "none",
  background: "transparent",
  color: "#8b98a5",
  cursor: "pointer",
  transition: "background 0.15s, color 0.15s",
  flexShrink: 0,
};

const roundBtnStyle: React.CSSProperties = {
  width: 38, height: 38,
  display: "flex", alignItems: "center", justifyContent: "center",
  borderRadius: "50%",
  border: "none",
  background: "transparent",
  cursor: "pointer",
  transition: "background 0.15s, color 0.15s, transform 0.1s",
  flexShrink: 0,
};

const iconBtnStyle: React.CSSProperties = {
  width: 28, height: 28,
  display: "flex", alignItems: "center", justifyContent: "center",
  borderRadius: "50%",
  border: "none",
  background: "transparent",
  color: "#6c7883",
  cursor: "pointer",
  transition: "background 0.15s, color 0.15s",
  flexShrink: 0,
};