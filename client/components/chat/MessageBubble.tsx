
import { useRef, useState } from "react";
import { useLongPress } from "../../hooks/useLongPress";
import ForwardPicker from "../shared/ForwardPicker";

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
  const [emojiExpanded, setEmojiExpanded] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(msgText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <>
      <div
        className={`flex flex-col gap-1.5 ${align === "right" ? "items-end animate-[slide-in_0.15s_ease-out]" : "items-start animate-[slide-in_0.15s_ease-out]"} mb-2 z-20 relative select-none`}
        data-hover-panel
      >
        {/* Emoji Quick Reaction Panel Bar */}
        <div className="flex items-center gap-1 p-1 bg-[#17212b] border border-[#101921] rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.4)] backdrop-blur-md">
          {emojiExpanded ? (
            <div className="flex items-center gap-0.5">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (msgId) onReact(msgId, emoji);
                    setEmojiExpanded(false);
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#202b36] active:scale-125 transition-all text-[18px]"
                >
                  {emoji}
                </button>
              ))}
              <button
                onMouseDown={(e) => { e.preventDefault(); setEmojiExpanded(false); }}
                className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-[#202b36] text-gray-400 hover:text-white text-[10px] ml-1 transition-colors"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onMouseDown={(e) => { e.preventDefault(); setEmojiExpanded(true); }}
              className="flex items-center gap-1.5 px-2.5 py-1 text-[13px] text-gray-300 font-medium rounded-lg hover:bg-[#202b36] transition-colors"
            >
              <span>😊</span>
              <span className="text-[11px] text-[#5288c1] font-bold">+ React</span>
            </button>
          )}
        </div>

        {/* Telegram Core Quick Actions Bar Menu */}
        <div className="flex items-center bg-[#17212b] border border-[#101921] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.5)] overflow-hidden">
          {/* Reply Action */}
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (msgId) onReply({ _id: msgId, username: msgUsername, text: msgText });
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-[12.5px] font-medium text-gray-300 hover:bg-[#202b36] hover:text-[#5288c1] transition-all"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 17 4 12 9 7" />
              <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
            </svg>
            Reply
          </button>

          <div className="w-[1px] h-4 bg-[#101921]" />

          {/* Forward Action */}
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowPicker(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-[12.5px] font-medium text-gray-300 hover:bg-[#202b36] hover:text-[#5288c1] transition-all"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 17 20 12 15 7" />
              <path d="M4 18v-2a4 4 0 0 1 4-4h12" />
            </svg>
            Forward
          </button>

          <div className="w-[1px] h-4 bg-[#101921]" />

          {/* Copy Text Clipboard Action */}
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleCopy();
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-[12.5px] font-medium text-gray-300 hover:bg-[#202b36] transition-all min-w-[72px] justify-center"
          >
            {copied ? (
              <span className="text-[#4ade80] flex items-center gap-1 font-semibold">✓ Copied</span>
            ) : (
              <div className="flex items-center gap-1.5 hover:text-[#5288c1]">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                <span>Copy</span>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Modern Forward Overlay Interface Modal Picker */}
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

// ── Message Bubble Container Wrapper ───────────────────
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
      className={`flex flex-col ${fromSelf ? "items-end" : "items-start"} w-full relative group`}
      onMouseEnter={() => {
        if (leaveTimer.current) clearTimeout(leaveTimer.current);
        setHoveredId(id);
      }}
      onMouseLeave={() => {
        leaveTimer.current = setTimeout(() => {
          setHoveredId((cur) => (cur === id ? null : cur));
        }, 300);
      }}
      {...longPress}
    >
      {/* Absolute floating action display layer */}
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
      
      {/* Message Text Bubble Markup Child Element Render Node */}
      <div className="transition-transform duration-150 active:scale-[0.99] origin-left">
        {children}
      </div>
    </div>
  );
}

