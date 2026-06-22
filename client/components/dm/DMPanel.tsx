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

export default function DMPanel({
  currentUsername, withUser, messages, dmTyping, isOnline,
  onSend, onTyping, onClose, onReact, onVideoCall, onVoiceCall,
  onSeen, onReply, onForward, allUsers, onlineUsers, rooms, replyTo,
  onCancelReply, forwardMsg, onCancelForward, onForwardSend,
}: {
  currentUsername: string;
  withUser: string;
  messages: DMMessage[];
  dmTyping: string | null;
  isOnline: boolean;
  onSend: (text: string, file?: { fileUrl: string; fileName: string; fileType: string; isImage: boolean }, audio?: { audioUrl: string; audioDuration: string }, replyTo?: { _id: string; username: string; text: string }) => void;
  onTyping: (value: string) => void;
  onClose: () => void;
  onReact?: (messageId: string, emoji: string) => void;
  onVoiceCall: () => void;
  onVideoCall: () => void;
  onSeen?: (messageIds: string[]) => void;
  onReply?: (msg: { _id: string; username: string; text: string }) => void;
  onForward?: (text: string, fromUsername: string, to: string, isRoom: boolean) => void;
  allUsers?: [];
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
  const [showJumpBtn, setShowJumpBtn] = useState(false);
  const [preview, setPreview] = useState<{
    fileUrl: string; fileName: string; fileType: string; isImage: boolean;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const isNearBottomRef = useRef(true);

  // ── Scroll position tracker — MUST be inside useEffect so `el` exists ──
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
      isNearBottomRef.current = atBottom;
      setShowJumpBtn(!atBottom);          // ← show button when NOT near bottom
    };
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  // ── Smart auto-scroll: only jump if already near bottom ──
  useEffect(() => {
    if (!isNearBottomRef.current) return;
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;  // instant, no animation jank
  }, [messages]);

  // ── Dismiss hover panel on touch outside ──
  useEffect(() => {
    const dismiss = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-reaction-picker]") || target.closest("[data-hover-panel]")) return;
      setHoveredId(null);
    };
    document.addEventListener("touchstart", dismiss);
    return () => document.removeEventListener("touchstart", dismiss);
  }, []);

  // ── Mark messages as seen ──
  useEffect(() => {
    const unseenIds = messages.filter((m) => !m.fromSelf && m._id).map((m) => m._id!);
    if (unseenIds.length > 0) onSeen?.(unseenIds);
  }, [messages]);

  const scrollToBottom = () => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    setShowJumpBtn(false);
  };

  const handleSend = () => {
    if (forwardMsg && onForwardSend) {
      onForwardSend(forwardMsg.text, forwardMsg.fromUsername, message.trim());
      setTimeout(scrollToBottom, 50);
      setMessage("");
      setPreview(null);
      return;
    }

    if (!message.trim() && !preview) return;

    onSend(message, preview ?? undefined, undefined, replyTo);
    setTimeout(scrollToBottom, 50);

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
    <div className="h-full flex flex-col overflow-hidden bg-[#0e1621]">

      {/* ── Header ── */}
      <div className="bg-[#17212b] border-b border-[#0d1821] px-4 py-2.5 flex items-center gap-3 shrink-0">
        <div className="relative">
          <Avatar name={withUser} size={38} />
          <span className={`absolute bottom-0 right-0 w-[11px] h-[11px] rounded-full border-2 border-[#17212b] ${isOnline ? "bg-[#4ade80]" : "bg-[#6c7883]"}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-semibold text-white truncate">{withUser}</div>
          <div className={`text-[12px] mt-px ${isOnline ? "text-[#4ade80]" : "text-[#8b98a5]"}`}>
            {isOnline ? "online" : "offline"}
          </div>
        </div>
        <button title="Voice call" onClick={onVoiceCall}
          className="w-9 h-9 flex items-center justify-center rounded-full border-none bg-transparent text-[#8b98a5] cursor-pointer transition-colors duration-150 hover:bg-[#202b36] hover:text-[#5288c1] shrink-0">
          <MdPhone size={19} />
        </button>
        <button title="Video call" onClick={onVideoCall}
          className="w-9 h-9 flex items-center justify-center rounded-full border-none bg-transparent text-[#8b98a5] cursor-pointer transition-colors duration-150 hover:bg-[#202b36] hover:text-[#5288c1] shrink-0">
          <MdVideocam size={19} />
        </button>
        <button onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-full border-none bg-transparent text-[#8b98a5] cursor-pointer transition-colors duration-150 hover:bg-[#202b36] hover:text-white shrink-0">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
      </div>

      {/* ── Messages + Jump Button — relative wrapper so button can be absolute ── */}
      <div className="flex-1 overflow-hidden relative">

        <div ref={scrollRef} className="custom-scrollbar h-full overflow-y-auto px-5 py-4 bg-[#0e1621]">
          <div className="flex flex-col gap-1.5">

            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-3 text-[#6c7883] py-16">
                <Avatar name={withUser} size={56} />
                <p className="text-[13px] text-center">
                  Start a conversation with <strong className="text-[#8b98a5]">{withUser}</strong>
                </p>
              </div>
            )}

            {messages.map((msg, i) => {
              const id = msg._id ?? String(i);
              if (msg.callEvent) {
                return (
                  <CallEventBubble key={id} callEvent={msg.callEvent} callType={msg.callType ?? "voice"}
                    callDuration={msg.callDuration} fromSelf={msg.fromSelf} username={msg.username} time={msg.time} />
                );
              }
              return msg.fromSelf ? (
                <div key={id} className="flex justify-end">
                  <div className="max-w-[70%]">
                    <MessageBubble id={id} hoveredId={hoveredId} setHoveredId={setHoveredId}
                      fromSelf={true} msgId={msg._id} msgUsername={msg.username} msgText={msg.text}
                      onReact={(msgId, emoji) => onReact?.(msgId, emoji)}
                      onReply={(m) => onReply?.(m)}
                      allUsers={allUsers ?? []}
                      onForward={(text, fromUsername) => onForward?.(text, fromUsername, withUser, false)}
                      onlineUsers={onlineUsers ?? []} 
                      rooms={rooms ?? []} 
                      currentUsername={currentUsername}>
                      <div className="bg-[#2b5278] border border-[#244565] rounded-2xl rounded-tr-[4px] px-3.5 py-2 text-[14.5px] text-[#f5f6f7] leading-relaxed shadow-[0_2px_6px_rgba(0,0,0,0.25)] relative">
                        {msg.forwarded && (
                          <div className="text-[11px] text-[#8ab4f8] mb-1.5 flex items-center gap-1.5 border-l-2 border-[#5288c1] pl-2.5">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polyline points="15 17 20 12 15 7" /><path d="M4 18v-2a4 4 0 0 1 4-4h12" />
                            </svg>
                            <span className="font-medium">Forwarded</span>
                          </div>
                        )}
                        {msg.replyTo && <ReplyPreview replyTo={msg.replyTo} fromSelf={true} />}
                        {msg.text && <span className="whitespace-pre-wrap break-words block">{msg.text}</span>}
                        {msg.caption && <div className="text-[12px] text-[#d1d5db] mt-1 italic">{msg.caption}</div>}
                        {msg.fileUrl && <FilePreview fileUrl={msg.fileUrl} fileName={msg.fileName} fileType={msg.fileType} isImage={msg.isImage} />}
                        {msg.reactions && msg.reactions.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {msg.reactions.map((r) => {
                              const reacted = r.usernames.includes(currentUsername);
                              return (
                                <button key={r.emoji} onClick={() => msg._id && onReact?.(msg._id, r.emoji)}
                                  className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[12px] cursor-pointer transition-colors ${reacted ? "border border-[rgba(82,136,193,0.4)] bg-[rgba(82,136,193,0.2)] text-[#5288c1] font-semibold" : "border border-[#244565] bg-[#1e3a56] text-[#9aa5b1]"}`}>
                                  <span>{r.emoji}</span><span className="text-[11px]">{r.count}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                        <div className="flex items-center justify-end gap-1 mt-1 opacity-75">
                          <span className="text-[10px] text-[rgba(209,213,219,0.8)] font-medium">{msg.time}</span>
                          <MessageStatusIcon status={msg.status} />
                        </div>
                      </div>
                    </MessageBubble>
                  </div>
                </div>
              ) : (
                <div key={id} className="flex items-end gap-2.5 max-w-[70%]">
                  <div className="shrink-0 mb-1"><Avatar name={msg.username} size={32} /></div>
                  <div className="flex-1 min-w-0">
                    <MessageBubble id={id} hoveredId={hoveredId} setHoveredId={setHoveredId}
                      fromSelf={false} msgId={msg._id} msgUsername={msg.username} msgText={msg.text}
                      onReact={(msgId, emoji) => onReact?.(msgId, emoji)}
                      onReply={(m) => onReply?.(m)}
                      onForward={(text, fromUsername) => onForward?.(text, fromUsername, withUser, false)}
                      allUsers={allUsers ?? []}
                      onlineUsers={onlineUsers ?? []} 
                      rooms={rooms ?? []} 
                      currentUsername={currentUsername}>
                      <div className="bg-[#182533] border border-[#101921] rounded-2xl rounded-tl-[4px] px-3.5 py-2 text-[14.5px] text-[#f5f6f7] leading-relaxed shadow-[0_2px_6px_rgba(0,0,0,0.25)] relative">
                        {msg.forwarded && (
                          <div className="text-[11px] text-[#6c7883] mb-1.5 flex items-center gap-1.5 border-l-2 border-[#475569] pl-2.5">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polyline points="15 17 20 12 15 7" /><path d="M4 18v-2a4 4 0 0 1 4-4h12" />
                            </svg>
                            <span className="font-medium">Forwarded</span>
                          </div>
                        )}
                        {msg.replyTo && <ReplyPreview replyTo={msg.replyTo} fromSelf={false} />}
                        {msg.text && <span className="whitespace-pre-wrap break-words block">{msg.text}</span>}
                        {msg.caption && <div className="text-[12px] text-[#9ca3af] mt-1 italic">{msg.caption}</div>}
                        {msg.fileUrl && <FilePreview fileUrl={msg.fileUrl} fileName={msg.fileName} fileType={msg.fileType} isImage={msg.isImage} />}
                        {msg.reactions && msg.reactions.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {msg.reactions.map((r) => {
                              const reacted = r.usernames.includes(currentUsername);
                              return (
                                <button key={r.emoji} onClick={() => msg._id && onReact?.(msg._id, r.emoji)}
                                  className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[12px] cursor-pointer transition-colors ${reacted ? "border border-[rgba(82,136,193,0.4)] bg-[rgba(82,136,193,0.2)] text-[#5288c1] font-semibold" : "border border-[#101921] bg-[#202b36] text-[#9aa5b1]"}`}>
                                  <span>{r.emoji}</span><span className="text-[11px]">{r.count}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                        <div className="text-[10px] text-[#9ca3af] mt-1 text-right font-medium opacity-75">{msg.time}</div>
                      </div>
                    </MessageBubble>
                  </div>
                </div>
              );
            })}

            {dmTyping && (
              <div className="flex items-end gap-2.5 max-w-[70%] mt-1">
                <Avatar name={withUser} size={32} />
                <div className="bg-[#182533] border border-[#101921] rounded-2xl rounded-tl-[4px] px-3.5 py-2.5 shadow-[0_2px_6px_rgba(0,0,0,0.25)]">
                  <TypingDots />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* ── Jump to Bottom button — floats over the scroll area ── */}
        {showJumpBtn && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-[#17212b] border border-[#2a3a4a] text-[#5288c1] shadow-[0_4px_16px_rgba(0,0,0,0.5)] hover:bg-[#202b36] hover:text-white transition-all z-10"
            title="Jump to bottom"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        )}

      </div>{/* end relative wrapper */}

      {/* ── Bottom bar ── */}
      <div className="bg-[#17212b] border-t border-[#0d1821] shrink-0">
        {preview && (
          <div className="flex items-start gap-2 px-4 pt-2.5">
            <FilePreview {...preview} />
            <button onClick={() => setPreview(null)}
              className="w-7 h-7 flex items-center justify-center rounded-full border-none bg-transparent text-[#6c7883] cursor-pointer transition-colors duration-150 hover:bg-[#202b36] hover:text-white shrink-0">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}
        {replyTo && onCancelReply && <ReplyBar replyTo={replyTo} onCancel={onCancelReply} />}
        {forwardMsg && onCancelForward && (
          <div className="flex items-center gap-2.5 px-3.5 py-[7px] border-t border-[#0d1821]">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#f4a93f" strokeWidth="2.2" strokeLinecap="round" className="shrink-0">
              <polyline points="15 17 20 12 15 7" /><path d="M4 18v-2a4 4 0 0 1 4-4h12" />
            </svg>
            <div className="flex items-stretch gap-2.5 flex-1 min-w-0">
              <div className="w-0.5 min-h-[34px] bg-[#f4a93f] rounded-sm shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[12.5px] font-semibold text-[#f4a93f] mb-px">Forwarded from {forwardMsg.fromUsername}</div>
                <div className="text-[12.5px] text-[#8b98a5] truncate">{forwardMsg.text || "📎 File"}</div>
              </div>
            </div>
            <button onClick={() => { setMessage(""); setPreview(null); onCancelForward?.(); }}
              className="w-7 h-7 flex items-center justify-center rounded-full border-none bg-transparent text-[#6c7883] cursor-pointer transition-colors duration-150 hover:bg-[#202b36] hover:text-[#c5cdd6] shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}
        <div className="flex items-center gap-1.5 px-2.5 py-2">
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
            className={`w-[38px] h-[38px] flex items-center justify-center rounded-full border-none bg-transparent cursor-pointer transition-colors duration-150 shrink-0 hover:bg-[#202b36] hover:text-[#5288c1] ${uploading ? "text-[#5288c1]" : "text-[#8b98a5]"}`}>
            {uploading ? (
              <svg className="animate-spin" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            ) : (
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            )}
          </button>
          <input ref={fileInputRef} type="file" className="hidden" accept=".jpg,.jpeg,.png,.gif,.pdf,.docx,.doc" onChange={handleFileChange} />
          <input
            className="flex-1 h-10 bg-[#242f3d] border-none rounded-[22px] px-[18px] text-[14.5px] text-white outline-none placeholder:text-[#6c7883]"
            value={message}
            onChange={e => { setMessage(e.target.value); onTyping(e.target.value); }}
            placeholder={forwardMsg ? "Add a caption…" : preview ? `Caption for ${withUser}…` : `Message ${withUser}…`}
            onKeyDown={e => e.key === "Enter" && handleSend()}
          />
          <button onClick={hasContent ? handleSend : undefined}
            className="w-10 h-10 flex items-center justify-center rounded-full border-none bg-[#5288c1] text-white cursor-pointer transition-colors duration-150 shrink-0 hover:bg-[#4377aa] active:scale-95">
            {hasContent ? (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            ) : (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            )}
          </button>
        </div>
      </div>

    </div>
  );
}