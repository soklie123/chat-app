import { useEffect, useRef, useState } from "react";
import { ChatMessage, TypingUser } from "../types/chat";
import Avatar from "./Avatar";
import TypingDots from "./TypingDots";
import ReactionPicker from "./ReactionPicker";
import { useLongPress } from "../hooks/useLongPress";
import FilePreview from "./FilePreview";
import AudioPlayer from "./AudioPlayer";
import CallEventBubble from "./CallEventBubble";

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
    <div className="flex flex-wrap gap-1 mt-1.5">
      {reactions.map((r) => {
        const reacted = r.usernames.includes(currentUsername);
        return (
          <button
            key={r.emoji}
            onClick={() => onReact(r.emoji)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border transition-all ${
              reacted
                ? "bg-[#0088cc]/10 border-[#0088cc]/30 text-[#0088cc]"
                : "bg-black/5 border-transparent text-gray-600 hover:bg-black/10"
            }`}
          >
            <span>{r.emoji}</span>
            <span className="font-medium">{r.count}</span>
          </button>
        );
      })}
    </div>
  );
}

function MessageWrapper({
  id,
  hoveredId,
  setHoveredId,
  children,
  className,
}: {
  id: string;
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
  children: React.ReactNode;
  className?: string;
}) {
  const longPress = useLongPress(() => setHoveredId(id));
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    setHoveredId(id);
  };

  const handleMouseLeave = () => {
    // Delay closing so user has time to move mouse to picker
    leaveTimer.current = setTimeout(() => {
      setHoveredId((current) => (current === id ? null : current));
    }, 300); // 300ms grace period
  }

  return (
    <div
      className={className}
      {...longPress}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      >
      {children}
    </div>
  );
}

export default function MessageList({
  messages,
  typingUser,
  currentRoom,
  currentUsername,
  onReact,
}: {
  messages: ChatMessage[];
  typingUser: TypingUser | null;
  currentRoom: string;
  currentUsername: string;
  onReact: (messageId: string, emoji: string) => void;
}) {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUser]);

  // Dismiss picker when tapping outside on mobile
  useEffect(() => {
    const dismiss = (e: TouchEvent) => {
      // Don't dismiss if touching a reaction button
      const target = e.target as HTMLElement;  
      if ( target.closest("[data-reaction-picker]")) return;
      setHoveredId(null);  
    };
    document.addEventListener("touchstart", dismiss);
    return () => document.removeEventListener("touchstart", dismiss);
  }, []);

  return (
    <div className="flex-1 px-3 py-3.5 bg-[#e5eff5] overflow-y-auto flex flex-col gap-2">
      <div className="flex items-center gap-2 my-1">
        <div className="flex-1 h-px bg-black/10" />
        <span className="text-[11px] text-slate-500 bg-[#dce8f0] px-2.5 py-0.5 rounded-full">
          # {currentRoom}
        </span>
        <div className="flex-1 h-px bg-black/10" />
      </div>

      {messages.map((msg, i) => {
        const id = msg._id ?? String(i);

        // Call event message
        if (msg.callEvent) {
          <CallEventBubble
            key={id}
            callEvent={msg.callEvent}
            callType={msg.callType ?? "voice"}
            callDuration={msg.callDuration}
            fromSelf={msg.fromSelf}
            username={msg.username}
            time={msg.time}
          />
        }
        
        const isHovered = hoveredId === id;

        return msg.fromSelf ? (
          // Own message (right side)
          <MessageWrapper
            key={id}
            id={id}
            hoveredId={hoveredId}
            setHoveredId={setHoveredId}
            className="flex justify-end self-end max-w-[80%] relative group"
          >
            {/* Reaction picker — left of bubble */}
            {isHovered && msg._id && (
              <div 
                data-reaction-picker
                className="absolute right-0 mr-2 -top-10 z-20"
                onMouseEnter={() => {
                  // Cancel any pending close when hovering picker
                  setHoveredId(id);
                }}
                onMouseLeave={() => {
                  setHoveredId(null);
                }}
                >
                <ReactionPicker onSelect={(emoji) => {
                  onReact(msg._id!, emoji);
                  setHoveredId(null); // Close after selecting reaction
                  }} 
                />
              </div>
            )}

          <div className="bg-[#dcf8c6] rounded-2xl rounded-tr-sm px-3.5 py-2.5 text-sm text-[#1c3906] leading-relaxed shadow-[0_1px_2px_rgba(0,0,0,0.06)] max-w-full">
            {msg.text}

            {msg.audioUrl && (
                <AudioPlayer
                  audioUrl={msg.audioUrl}
                  audioDuration={msg.audioDuration}
                  fromSelf={msg.fromSelf}
                />
            )}
            {msg.fileUrl && (
              <FilePreview
                fileUrl={msg.fileUrl}
                fileName={msg.fileName}
                fileType={msg.fileType}
                isImage={msg.isImage}
              />
            )}
            
            {msg.reactions && msg.reactions.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5 max-w-full">
                <ReactionBubbles
                  reactions={msg.reactions}
                  currentUsername={currentUsername}
                  onReact={(emoji) => msg._id && onReact(msg._id, emoji)}
                />
              </div>
            )}
            <div className="flex items-center justify-end gap-1 mt-1">
              <span className="text-[10px] text-[#6a9c5a]">{msg.time}</span>
              <svg width="14" height="10" viewBox="0 0 16 11" fill="none">
                <path d="M1 5.5L5 9.5L11 1.5" stroke="#4ade80" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M6 5.5L10 9.5L15.5 1.5" stroke="#4ade80" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          </MessageWrapper>
        ) : (
          // ── Other user message (left side) ──
          <MessageWrapper
            key={id}
            id={id}
            hoveredId={hoveredId}
            setHoveredId={setHoveredId}
            className="flex items-end gap-1.5 max-w-[80%] relative"
          >
            <Avatar name={msg.username} size={28} />
            <div>
              <div className="text-[11px] text-slate-500 mb-1 ml-0.5">
              {msg.username}
              </div>
              <div className="bg-white rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-sm text-[#1a1a1a] leading-relaxed shadow-[0_1px_2px_rgba(0,0,0,0.06)] max-w-full">
              {msg.text}

              {msg.audioUrl && (
                <AudioPlayer
                  audioUrl={msg.audioUrl}
                  audioDuration={msg.audioDuration}
                  fromSelf={msg.fromSelf}
                />
              )}
              {/* Add inside own message bubble after {msg.text} */}
              {msg.fileUrl && (
                <FilePreview
                  fileUrl={msg.fileUrl}
                  fileName={msg.fileName}
                  fileType={msg.fileType}
                  isImage={msg.isImage}
                />
              )}

              {msg.reactions && msg.reactions.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5 max-w-full">
                  <ReactionBubbles
                      reactions={msg.reactions}
                    currentUsername={currentUsername}
                    onReact={(emoji) => msg._id && onReact(msg._id, emoji)}
                  />
                </div>
              )}
              <div className="text-[10px] text-slate-400 mt-1 text-right">{msg.time}</div>
            </div>
            </div>

            {/* Reaction picker — right of bubble */}
            {isHovered && msg._id && (
              <div 
                data-reaction-picker
                className="absolute left-0 -top-10 z-20"
                onMouseEnter={() => {
                  setHoveredId(id);
                }}
                onMouseLeave={() => {
                  setHoveredId(null);
                }}
                >
                <ReactionPicker onSelect={(emoji) => {
                  onReact(msg._id!, emoji)
                  setHoveredId(null); // Close after selecting reaction
                  }} 
                />
              </div>
            )}
          </MessageWrapper>
        );
      })}

      {typingUser && (
        <div className="flex items-end gap-1.5 max-w-[80%]">
          <Avatar name={typingUser.name} size={28} />
          <div>
            <div className="text-[11px] text-slate-500 mb-1 ml-0.5">{typingUser.name}</div>
            <div className="bg-white rounded-2xl rounded-tl-sm shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
              <TypingDots />
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}