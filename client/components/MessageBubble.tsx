import { useRef } from "react";
import { useState } from "react";
import { useLongPress } from "../hooks/useLongPress";
import ForwardPicker from "./ForwardPicker";

const EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "😡"];

// ── Hover Panel ───────────────────────────────────────
export function HoverPanel({
  msgId,
  msgUsername,
  msgText,
  onReact,
  onReply,
  onForward,
  align,
  onlineUsers,
  rooms,
  currentUsername,
}: {
  msgId?:         string;
  msgUsername:    string;
  msgText:        string;
  onReact:        (messageId: string, emoji: string) => void;
  onReply:        (msg: { _id: string; username: string; text: string }) => void;
  onForward:      (text: string, fromUsername: string, to: string, isRoom: boolean) => void;
  align:          "left" | "right";
  onlineUsers:    string[];
  rooms:          { id: string; name: string }[];
  currentUsername: string;
}) {
  const [emojiExpanded,   setEmojiExpanded]   = useState(false);
  const [showPicker,      setShowPicker]       = useState(false);
  const [copied,          setCopied]           = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(msgText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <>
      <div
        className={`flex flex-col gap-1 ${align === "right" ? "items-end" : "items-start"} mb-1`}
        data-hover-panel
      >
        {/* Emoji row */}
        <div className="flex items-center gap-0.5 px-2 py-1.5 bg-white rounded-2xl shadow-lg border border-gray-100">
          {emojiExpanded ? (
            <>
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (msgId) onReact(msgId, emoji);
                    setEmojiExpanded(false);
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 active:scale-110 transition-all text-[18px]"
                >
                  {emoji}
                </button>
              ))}
              <button
                onMouseDown={(e) => { e.preventDefault(); setEmojiExpanded(false); }}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-slate-400 text-[11px] ml-0.5"
              >
                ✕
              </button>
            </>
          ) : (
            <button
              onMouseDown={(e) => { e.preventDefault(); setEmojiExpanded(true); }}
              className="flex items-center gap-1 px-2 py-1 rounded-full hover:bg-gray-100 transition-colors text-[16px]"
            >
              😊 <span className="text-[11px] text-slate-400">+</span>
            </button>
          )}
        </div>

        {/* Action row */}
        <div className="flex items-center bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Reply */}
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (msgId) onReply({ _id: msgId, username: msgUsername, text: msgText });
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-[12px] text-slate-600 hover:bg-gray-50 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 17 4 12 9 7" />
              <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
            </svg>
            Reply
          </button>

          <div className="w-px h-5 bg-gray-200" />

          {/* Forward — opens picker */}
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowPicker(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-[12px] text-slate-600 hover:bg-gray-50 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 17 20 12 15 7" />
              <path d="M4 18v-2a4 4 0 0 1 4-4h12" />
            </svg>
            Forward
          </button>

          <div className="w-px h-5 bg-gray-200" />

          {/* Copy */}
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleCopy();
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-[12px] text-slate-600 hover:bg-gray-50 transition-colors"
          >
            {copied ? (
              <span className="text-green-500">✓ Copied</span>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                Copy
              </>
            )}
          </button>
        </div>
      </div>

      {/* Forward picker modal */}
      {showPicker && (
        <ForwardPicker
          text={msgText}
          fromUsername={msgUsername}
          onlineUsers={onlineUsers}
          rooms={rooms}
          username={currentUsername}
          onPick={(to, isRoom) => {
            onForward(msgText, msgUsername, to, isRoom);
            setShowPicker(false);
          }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  );
}

// ── Message Bubble ────────────────────────────────────
export function MessageBubble({
  id,
  hoveredId,
  setHoveredId,
  fromSelf,
  children,
  msgId,
  msgUsername,
  msgText,
  onReact,
  onReply,
  onForward,
  onlineUsers,
  rooms,
  currentUsername,
}: {
  id:           string;
  hoveredId:    string | null;
  setHoveredId: React.Dispatch<React.SetStateAction<string | null>>;
  fromSelf:     boolean;
  children:     React.ReactNode;
  msgId?:       string;
  msgUsername:  string;
  msgText:      string;
  onReact:      (messageId: string, emoji: string) => void;
  onReply:      (msg: { _id: string; username: string; text: string }) => void;
  onForward:    (text: string, fromUsername: string, to: string, isRoom: boolean) => void;
  onlineUsers:    string[];
  rooms:          { id: string; name: string }[];
  currentUsername: string;
}) {
  const longPress  = useLongPress(() => setHoveredId(id));
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHovered  = hoveredId === id;
  
  return (
    <div
      className={`flex flex-col ${fromSelf ? "items-end" : "items-start"} w-full`}
      onMouseEnter={() => {
        if (leaveTimer.current) clearTimeout(leaveTimer.current);
        setHoveredId(id);
      }}
      onMouseLeave={() => {
        leaveTimer.current = setTimeout(() => {
          setHoveredId((cur) => (cur === id ? null : cur));
        }, 400);
      }}
      {...longPress}
    >
      {isHovered && (
        <HoverPanel
          msgId={msgId}
          msgUsername={msgUsername}
          msgText={msgText}
          onReact={onReact}
          onReply={onReply}
          onForward={onForward}
          align={fromSelf ? "right" : "left"}
          onlineUsers={onlineUsers}
          rooms={rooms}
          currentUsername={currentUsername}
        />
      )}
      {children}
    </div>
  );
}