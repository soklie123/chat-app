import { useEffect, useRef, useState } from "react";
import { ChatMessage, TypingUser } from "../types/chat";
import Avatar from "./Avatar";
import TypingDots from "./TypingDots";
import FilePreview from "./FilePreview";
import AudioPlayer from "./AudioPlayer";
import CallEventBubble from "./CallEventBubble";
import MessageStatusIcon from "./MessageStatus";
import ReplyPreview from "./ReplyPreview";
import ForwardModal from "./ForwardModal";
import { MessageBubble } from "./MessageBubble";


// ── Reaction bubbles ──────────────────────────────────
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

// ── Main component ────────────────────────────────────
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
  messages:        ChatMessage[];
  typingUser:      TypingUser | null;
  currentRoom:     string;
  currentUsername: string;
  onReact:   (messageId: string, emoji: string) => void;
  onSeen?:   (messageIds: string[]) => void;
  onReply:   (msg: { _id: string; username: string; text: string }) => void;
  onForward: (text: string, fromUsername: string, to: string, isRoom: boolean) => void;
  onlineUsers: string[];
  rooms:       { id: string; name: string }[];
}) {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [hoveredId,  setHoveredId]  = useState<string | null>(null);
  // const [forwardMsg, setForwardMsg] = useState<{
  //   text: string;
  //   fromUsername: string;
  // } | null>(null);

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
    <div className="flex-1 overflow-y-auto px-3 py-3.5 bg-[#e5eff5]">
      <div className="flex flex-col gap-2">
        <div className="flex-1 h-px bg-black/10" />
        <span className="text-[11px] text-slate-500 bg-[#dce8f0] px-2.5 py-0.5 rounded-full">
          # {currentRoom}
        </span>
        <div className="flex-1 h-px bg-black/10" />
      </div>

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
          // ── Own message ──────────────────────────────
          <div key={id} className="flex justify-end self-end max-w-[80%]">
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
              <div className="bg-[#dcf8c6] rounded-2xl rounded-tr-sm px-3.5 py-2.5 text-sm text-[#1c3906] leading-relaxed shadow-[0_1px_2px_rgba(0,0,0,0.06)] max-w-full">

                {/* ✅ FORWARDED LABEL */}
                {msg.forwarded && (
                  <div className="text-[10px] text-[#4a7a3a] mb-1 flex items-center gap-1">
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="15 17 20 12 15 7" />
                      <path d="M4 18v-2a4 4 0 0 1 4-4h12" />
                    </svg>
                    <span>
                      Forwarded from @{msg.fromUsername || msg.username}
                    </span>
                  </div>
                )}

                {/* ✅ Reply */}
                {msg.replyTo && (
                  <ReplyPreview replyTo={msg.replyTo} fromSelf={true} />
                )}

                {/* ✅ Main text */}
                {msg.text && <span>{msg.text}</span>}

                {/* ✅ Caption */}
                {msg.caption && (
                  <div className="text-[11px] text-gray-600 mt-1">
                    {msg.caption}
                  </div>
                )}

                {/* ✅ Audio */}
                {msg.audioUrl && (
                  <AudioPlayer
                    audioUrl={msg.audioUrl}
                    audioDuration={msg.audioDuration}
                    fromSelf={true}
                  />
                )}

                {/* ✅ File */}
                {msg.fileUrl && (
                  <FilePreview
                    fileUrl={msg.fileUrl}
                    fileName={msg.fileName}
                    fileType={msg.fileType}
                    isImage={msg.isImage}
                  />
                )}

                {/* ✅ Reactions */}
                {msg.reactions && msg.reactions.length > 0 && (
                  <ReactionBubbles
                    reactions={msg.reactions}
                    currentUsername={currentUsername}
                    onReact={(emoji) => msg._id && onReact(msg._id, emoji)}
                  />
                )}

                {/* ✅ Footer */}
                <div className="flex items-center justify-end gap-1 mt-1">
                  <span className="text-[10px] text-[#6a9c5a]">{msg.time}</span>
                  <MessageStatusIcon status={msg.status} />
                </div>
              </div>
            </MessageBubble>
          </div>
        ) : (
          // ── Other user message ────────────────────────
          <div key={id} className="flex items-end gap-1.5 max-w-[80%]">
            <Avatar name={msg.username} size={28} />
            <div className="flex-1 min-w-0">
              <div className="text-[11px] text-slate-500 mb-1 ml-0.5">
                {msg.username}
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
                <div className="bg-white rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-sm text-[#1a1a1a] leading-relaxed shadow-[0_1px_2px_rgba(0,0,0,0.06)] max-w-full">

                  {/* ✅ FORWARDED LABEL */}
                  {msg.forwarded && (
                    <div className="text-[10px] text-slate-400 mb-1 flex items-center gap-1">
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="15 17 20 12 15 7" />
                        <path d="M4 18v-2a4 4 0 0 1 4-4h12" />
                      </svg>
                      <span>
                        Forwarded from @{msg.fromUsername || msg.username}
                      </span>
                    </div>
                  )}

                  {/* ✅ Reply */}
                  {msg.replyTo && (
                    <ReplyPreview replyTo={msg.replyTo} fromSelf={false} />
                  )}

                  {/* ✅ Main text */}
                  {msg.text && <span>{msg.text}</span>}

                  {/* ✅ Caption */}
                  {msg.caption && (
                    <div className="text-[11px] text-gray-500 mt-1">
                      {msg.caption}
                    </div>
                  )}

                  {/* ✅ Audio */}
                  {msg.audioUrl && (
                    <AudioPlayer
                      audioUrl={msg.audioUrl}
                      audioDuration={msg.audioDuration}
                      fromSelf={false}
                    />
                  )}

                  {/* ✅ File */}
                  {msg.fileUrl && (
                    <FilePreview
                      fileUrl={msg.fileUrl}
                      fileName={msg.fileName}
                      fileType={msg.fileType}
                      isImage={msg.isImage}
                    />
                  )}

                  {/* ✅ Reactions */}
                  {msg.reactions && msg.reactions.length > 0 && (
                    <ReactionBubbles
                      reactions={msg.reactions}
                      currentUsername={currentUsername}
                      onReact={(emoji) => msg._id && onReact(msg._id, emoji)}
                    />
                  )}

                  <div className="text-[10px] text-slate-400 mt-1 text-right">
                    {msg.time}
                  </div>
                </div>
              </MessageBubble>
            </div>
          </div>
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

      {/* {forwardMsg && (
        <ForwardModal
          text={forwardMsg.text}
          fromUsername={forwardMsg.fromUsername}
          onlineUsers={onlineUsers}
          rooms={rooms}
          username={currentUsername}
          onForwardToDM={(to) => { 
            onForward(forwardMsg.text, forwardMsg.fromUsername, to, false); 
            setForwardMsg(null); 
          }}
          onForwardToRoom={(roomId) => { 
            onForward(forwardMsg.text, forwardMsg.fromUsername, roomId, true); 
            setForwardMsg(null); 
          }}
          onClose={() => setForwardMsg(null)}
        />
      )} */}

      <div ref={messagesEndRef} />
    </div>
  );
}