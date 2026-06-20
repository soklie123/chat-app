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
    <div className="flex-1 overflow-y-auto px-4 py-4 bg-[#f0f4f8]">

      {/* Room label */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-[11px] text-slate-400 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full font-medium">
          # {currentRoom}
        </span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      <div className="flex flex-col gap-1">
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
            // Own message
            <div key={id} className="flex justify-end">
              <div className="max-w-[72%]">
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
                  <div className="bg-[#0088cc] rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm text-white leading-relaxed shadow-sm">

                    {msg.forwarded && (
                      <div className="text-[10px] text-white/60 mb-1.5 flex items-center gap-1 border-l-2 border-white/30 pl-2">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="15 17 20 12 15 7" />
                          <path d="M4 18v-2a4 4 0 0 1 4-4h12" />
                        </svg>
                        Forwarded from @{msg.fromUsername || msg.username}
                      </div>
                    )}

                    {msg.replyTo && <ReplyPreview replyTo={msg.replyTo} fromSelf={true} />}
                    {msg.text && <span>{msg.text}</span>}
                    {msg.caption && <div className="text-[11px] text-white/70 mt-1">{msg.caption}</div>}
                    {msg.audioUrl && <AudioPlayer audioUrl={msg.audioUrl} audioDuration={msg.audioDuration} fromSelf={true} />}
                    {msg.fileUrl && <FilePreview fileUrl={msg.fileUrl} fileName={msg.fileName} fileType={msg.fileType} isImage={msg.isImage} />}
                    {msg.reactions && msg.reactions.length > 0 && (
                      <ReactionBubbles reactions={msg.reactions} currentUsername={currentUsername} onReact={(emoji) => msg._id && onReact(msg._id, emoji)} />
                    )}

                    <div className="flex items-center justify-end gap-1 mt-1">
                      <span className="text-[10px] text-white/60">{msg.time}</span>
                      <MessageStatusIcon status={msg.status} />
                    </div>
                  </div>
                </MessageBubble>
              </div>
            </div>
          ) : (
            // Other user message
            <div key={id} className="flex items-end gap-2 max-w-[72%]">
              <Avatar name={msg.username} size={30} />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-slate-400 mb-1 ml-1 font-medium">{msg.username}</div>
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
                  <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm text-slate-800 leading-relaxed shadow-sm">

                    {msg.forwarded && (
                      <div className="text-[10px] text-slate-400 mb-1.5 flex items-center gap-1 border-l-2 border-slate-200 pl-2">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="15 17 20 12 15 7" />
                          <path d="M4 18v-2a4 4 0 0 1 4-4h12" />
                        </svg>
                        Forwarded from @{msg.fromUsername || msg.username}
                      </div>
                    )}

                    {msg.replyTo && <ReplyPreview replyTo={msg.replyTo} fromSelf={false} />}
                    {msg.text && <span>{msg.text}</span>}
                    {msg.caption && <div className="text-[11px] text-slate-400 mt-1">{msg.caption}</div>}
                    {msg.audioUrl && <AudioPlayer audioUrl={msg.audioUrl} audioDuration={msg.audioDuration} fromSelf={false} />}
                    {msg.fileUrl && <FilePreview fileUrl={msg.fileUrl} fileName={msg.fileName} fileType={msg.fileType} isImage={msg.isImage} />}
                    {msg.reactions && msg.reactions.length > 0 && (
                      <ReactionBubbles reactions={msg.reactions} currentUsername={currentUsername} onReact={(emoji) => msg._id && onReact(msg._id, emoji)} />
                    )}

                    <div className="text-[10px] text-slate-400 mt-1 text-right">{msg.time}</div>
                  </div>
                </MessageBubble>
              </div>
            </div>
          );
        })}
      </div>

      {typingUser && (
        <div className="flex items-end gap-2 max-w-[72%] mt-2">
          <Avatar name={typingUser.name} size={30} />
          <div>
            <div className="text-[11px] text-slate-400 mb-1 ml-1 font-medium">{typingUser.name}</div>
            <div className="bg-white rounded-2xl rounded-tl-sm shadow-sm px-1">
              <TypingDots />
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}