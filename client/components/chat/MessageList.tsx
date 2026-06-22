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
    <div className="flex flex-wrap gap-1.5 mt-2">
      {reactions.map((r) => {
        const reacted = r.usernames.includes(currentUsername);
        return (
          <button
            key={r.emoji}
            onClick={() => onReact(r.emoji)}
            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] cursor-pointer transition-colors ${
              reacted
                ? "border border-[rgba(82,136,193,0.4)] bg-[rgba(82,136,193,0.2)] text-[#5288c1] font-semibold"
                : "border border-[#101921] bg-[#202b36] text-[#9aa5b1]"
            }`}
          >
            <span>{r.emoji}</span>
            <span className="text-[11px] opacity-90">{r.count}</span>
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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isNearBottomRef = useRef(true);
  const [showJumpBtn, setShowJumpBtn] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // ── Scroll position tracker ──
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleScroll = () => {
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
      isNearBottomRef.current = atBottom;
      setShowJumpBtn(!atBottom);
    };
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  // ── Smart auto-scroll: only jump if already near bottom ──
  useEffect(() => {
    if (!isNearBottomRef.current) return;
    const el = containerRef.current; // scrollRef.current in DMPanel
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, typingUser]);

  // ── Dismiss hover panel on touch outside ──
  useEffect(() => {
    const dismiss = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-hover-panel]")) return;
      setHoveredId(null);
    };
    document.addEventListener("touchstart", dismiss);
    return () => document.removeEventListener("touchstart", dismiss);
  }, []);

  // ── Mark messages as seen ──
  useEffect(() => {
    const unseenIds = messages
      .filter((m) => !m.fromSelf && m._id && m.status !== "seen")
      .map((m) => m._id!);
    if (unseenIds.length > 0) onSeen?.(unseenIds);
  }, [messages]);

  const scrollToBottom = () => {
    const el = containerRef.current; // scrollRef.current in DMPanel
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    setShowJumpBtn(false);
  };

  return (
    // ── relative wrapper so the jump button can be absolute-positioned ──
    <div className="flex-1 overflow-hidden relative">

      <div ref={containerRef} className="custom-scrollbar h-full overflow-y-auto px-5 py-4 bg-[#0e1621]">

        {/* Room divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-[#101921]" />
          <span className="text-[12px] text-[#5288c1] bg-[#17212b] border border-[#101921] px-4 py-1 rounded-full font-semibold tracking-wide">
            # {currentRoom}
          </span>
          <div className="flex-1 h-px bg-[#101921]" />
        </div>

        <div className="flex flex-col gap-2.5">
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
              <div key={id} className="flex justify-end">
                <div className="max-w-[70%]">
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
                    <div className="bg-[#2b5278] border border-[#244565] rounded-2xl rounded-tr-[4px] px-3.5 py-2 text-[14.5px] text-[#f5f6f7] leading-relaxed shadow-[0_2px_6px_rgba(0,0,0,0.25)] relative">
                      {msg.forwarded && (
                        <div className="text-[11px] text-[#8ab4f8] mb-1.5 flex items-center gap-1.5 border-l-2 border-[#5288c1] pl-2.5">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="15 17 20 12 15 7" />
                            <path d="M4 18v-2a4 4 0 0 1 4-4h12" />
                          </svg>
                          <span className="font-medium">Forwarded from @{msg.fromUsername || msg.username}</span>
                        </div>
                      )}
                      {msg.replyTo && <ReplyPreview replyTo={msg.replyTo} fromSelf={true} />}
                      {msg.text && <span className="whitespace-pre-wrap break-words block">{msg.text}</span>}
                      {msg.caption && <div className="text-[12px] text-[#d1d5db] mt-1 italic">{msg.caption}</div>}
                      {msg.audioUrl && <AudioPlayer audioUrl={msg.audioUrl} audioDuration={msg.audioDuration} fromSelf={true} />}
                      {msg.fileUrl && <FilePreview fileUrl={msg.fileUrl} fileName={msg.fileName} fileType={msg.fileType} isImage={msg.isImage} />}
                      {msg.reactions && msg.reactions.length > 0 && (
                        <ReactionBubbles
                          reactions={msg.reactions}
                          currentUsername={currentUsername}
                          onReact={(emoji) => msg._id && onReact(msg._id, emoji)}
                        />
                      )}
                      <div className="flex items-center justify-end gap-1.5 mt-1 opacity-75">
                        <span className="text-[10px] text-[rgba(209,213,219,0.8)] font-medium">{msg.time}</span>
                        <MessageStatusIcon status={msg.status} />
                      </div>
                    </div>
                  </MessageBubble>
                </div>
              </div>
            ) : (
              <div key={id} className="flex items-end gap-2.5 max-w-[70%]">
                <div className="shrink-0 mb-1">
                  <Avatar name={msg.username} size={32} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] text-[#5288c1] mb-1 ml-1.5 font-semibold tracking-wide">
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
                    <div className="bg-[#182533] border border-[#101921] rounded-2xl rounded-tl-[4px] px-3.5 py-2 text-[14.5px] text-[#f5f6f7] leading-relaxed shadow-[0_2px_6px_rgba(0,0,0,0.25)] relative">
                      {msg.forwarded && (
                        <div className="text-[11px] text-[#6c7883] mb-1.5 flex items-center gap-1.5 border-l-2 border-[#475569] pl-2.5">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="15 17 20 12 15 7" />
                            <path d="M4 18v-2a4 4 0 0 1 4-4h12" />
                          </svg>
                          <span className="font-medium">Forwarded from @{msg.fromUsername || msg.username}</span>
                        </div>
                      )}
                      {msg.replyTo && <ReplyPreview replyTo={msg.replyTo} fromSelf={false} />}
                      {msg.text && <span className="whitespace-pre-wrap break-words block">{msg.text}</span>}
                      {msg.caption && <div className="text-[12px] text-[#9ca3af] mt-1 italic">{msg.caption}</div>}
                      {msg.audioUrl && <AudioPlayer audioUrl={msg.audioUrl} audioDuration={msg.audioDuration} fromSelf={false} />}
                      {msg.fileUrl && <FilePreview fileUrl={msg.fileUrl} fileName={msg.fileName} fileType={msg.fileType} isImage={msg.isImage} />}
                      {msg.reactions && msg.reactions.length > 0 && (
                        <ReactionBubbles
                          reactions={msg.reactions}
                          currentUsername={currentUsername}
                          onReact={(emoji) => msg._id && onReact(msg._id, emoji)}
                        />
                      )}
                      <div className="text-[10px] text-[#9ca3af] mt-1 text-right font-medium opacity-75">
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
          <div className="flex items-end gap-2.5 max-w-[70%] mt-3">
            <Avatar name={typingUser.name} size={32} />
            <div>
              <div className="text-[12px] text-[#5288c1] mb-1 ml-1.5 font-semibold">
                @{typingUser.name}
              </div>
              <div className="bg-[#182533] border border-[#101921] rounded-2xl rounded-tl-[4px] px-3.5 py-2.5 shadow-[0_2px_6px_rgba(0,0,0,0.25)]">
                <TypingDots />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Jump to Bottom button ── */}
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

    </div>
  );
}