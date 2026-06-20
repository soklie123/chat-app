
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
            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] border transition-all duration-200 select-none ${
              reacted
                ? "bg-[#5288c1]/20 border-[#5288c1]/40 text-[#5288c1] shadow-sm font-semibold"
                : "bg-[#202b36] border-[#101921] text-gray-400 hover:bg-[#2b3946] hover:text-white"
            }`}
          >
            <span>{r.emoji}</span>
            <span className="text-[11px] font-medium opacity-90">{r.count}</span>
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
    <div className="flex-1 overflow-y-auto px-5 py-4 bg-[#0e1621] custom-scrollbar selection:bg-[#5288c1]/30">

      {/* Modern Static Room Sticky Badge Divider */}
      <div className="flex items-center gap-4 mb-6 sticky top-0 z-10 opacity-95">
        <div className="flex-1 h-[1px] bg-[#101921]" />
        <span className="text-[12px] text-[#5288c1] bg-[#17212b] border border-[#101921] px-4 py-1 rounded-full font-semibold shadow-md tracking-wide backdrop-blur-sm">
          # {currentRoom}
        </span>
        <div className="flex-1 h-[1px] bg-[#101921]" />
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
            /* Telegram Authentic Premium Sent Message Bubble Row Setup */
            <div key={id} className="flex justify-end group/row">
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
                  <div className="bg-[#2b5278] border border-[#244565] rounded-2xl rounded-tr-[4px] px-3.5 py-2 text-[14.5px] text-[#f5f6f7] leading-relaxed shadow-md relative">

                    {msg.forwarded && (
                      <div className="text-[11px] text-[#8ab4f8] mb-1.5 flex items-center gap-1.5 border-l-2 border-[#5288c1] pl-2.5 py-0.5">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="15 17 20 12 15 7" />
                          <path d="M4 18v-2a4 4 0 0 1 4-4h12" />
                        </svg>
                        <span className="font-medium">Forwarded from @{msg.fromUsername || msg.username}</span>
                      </div>
                    )}

                    {msg.replyTo && <ReplyPreview replyTo={msg.replyTo} fromSelf={true} />}
                    {msg.text && <span className="whitespace-pre-wrap break-words block">{msg.text}</span>}
                    {msg.caption && <div className="text-[12px] text-gray-300 mt-1 italic">{msg.caption}</div>}
                    {msg.audioUrl && <AudioPlayer audioUrl={msg.audioUrl} audioDuration={msg.audioDuration} fromSelf={true} />}
                    {msg.fileUrl && <FilePreview fileUrl={msg.fileUrl} fileName={msg.fileName} fileType={msg.fileType} isImage={msg.isImage} />}
                    
                    {msg.reactions && msg.reactions.length > 0 && (
                      <ReactionBubbles reactions={msg.reactions} currentUsername={currentUsername} onReact={(emoji) => msg._id && onReact(msg._id, emoji)} />
                    )}

                    <div className="flex items-center justify-end gap-1.5 mt-1 -mb-0.5 select-none opacity-75">
                      <span className="text-[10px] text-gray-300/80 font-medium">{msg.time}</span>
                      <MessageStatusIcon status={msg.status} />
                    </div>
                  </div>
                </MessageBubble>
              </div>
            </div>
          ) : (
            /* Telegram Authentic Premium Received Message Bubble Row Setup */
            <div key={id} className="flex items-end gap-2.5 max-w-[70%] group/row">
              <div className="flex-shrink-0 mb-1">
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
                  <div className="bg-[#182533] border border-[#101921] rounded-2xl rounded-tl-[4px] px-3.5 py-2 text-[14.5px] text-[#f5f6f7] leading-relaxed shadow-md relative">

                    {msg.forwarded && (
                      <div className="text-[11px] text-[#6c7883] mb-1.5 flex items-center gap-1.5 border-l-2 border-slate-600 pl-2.5 py-0.5">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="15 17 20 12 15 7" />
                          <path d="M4 18v-2a4 4 0 0 1 4-4h12" />
                        </svg>
                        <span className="font-medium">Forwarded from @{msg.fromUsername || msg.username}</span>
                      </div>
                    )}

                    {msg.replyTo && <ReplyPreview replyTo={msg.replyTo} fromSelf={false} />}
                    {msg.text && <span className="whitespace-pre-wrap break-words block">{msg.text}</span>}
                    {msg.caption && <div className="text-[12px] text-gray-400 mt-1 italic">{msg.caption}</div>}
                    {msg.audioUrl && <AudioPlayer audioUrl={msg.audioUrl} audioDuration={msg.audioDuration} fromSelf={false} />}
                    {msg.fileUrl && <FilePreview fileUrl={msg.fileUrl} fileName={msg.fileName} fileType={msg.fileType} isImage={msg.isImage} />}
                    
                    {msg.reactions && msg.reactions.length > 0 && (
                      <ReactionBubbles reactions={msg.reactions} currentUsername={currentUsername} onReact={(emoji) => msg._id && onReact(msg._id, emoji)} />
                    )}

                    <div className="text-[10px] text-gray-400 mt-1 -mb-0.5 text-right font-medium select-none opacity-75">
                      {msg.time}
                    </div>
                  </div>
                </MessageBubble>
              </div>
            </div>
          );
        })}
      </div>

      {/* Typing Indicator Strip Wrap Container */}
      {typingUser && (
        <div className="flex items-end gap-2.5 max-w-[70%] mt-3 animate-pulse duration-1000">
          <Avatar name={typingUser.name} size={32} />
          <div>
            <div className="text-[12px] text-[#5288c1] mb-1 ml-1.5 font-semibold">
              @{typingUser.name}
            </div>
            <div className="bg-[#182533] border border-[#101921] rounded-2xl rounded-tl-[4px] shadow-md px-3.5 py-2.5">
              <TypingDots />
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}

