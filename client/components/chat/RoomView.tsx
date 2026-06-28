import { useState, useRef } from "react";
import axios from "axios";
import { ChatMessage, TypingUser } from "../../types/chat";
import MessageList from "./MessageList";
import InputBar from "../shared/InputBar";
import ForwardBar from "../shared/ForwardBar";
import RoomHeader from "./RoomHeader";
import GroupIcon from "../shared/GroupIcon";
import { UserProfile } from "../../hooks/useChat";
import useVoiceRecorder from "../../hooks/useVoiceRecorder";

const UPLOAD_URL = "http://localhost:4000/upload";

type ReplyDraft = { _id: string; username: string; text: string } | null;
type ForwardDraft = { text: string; fromUsername: string } | null;
type RoomSummary = {
  id: string;
  name: string;
  memberCount: number;
  members: string[];
  createdBy: string;
  avatarUrl?: string;
};
type SendFile = { fileUrl: string; fileName: string; fileType: string; isImage: boolean };
type SendAudio = { audioUrl: string; audioDuration: number };

function getGroupGradient(name: string): string {
  const gradients = [
    "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
    "linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)",
    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "linear-gradient(135deg, #f7971e 0%, #ffd200 100%)",
    "linear-gradient(135deg, #30cfd0 0%, #330867 100%)",
    "linear-gradient(135deg, #ff6a00 0%, #ee0979 100%)",
    "linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)",
    "linear-gradient(135deg, #fddb92 0%, #d1fdff 100%)",
  ];
  if (!name) return gradients[0];
  let hash = 0;
  for (const char of name) {
    hash = char.codePointAt(0)! + ((hash << 5) - hash);
    hash = hash & hash;
  }
  return gradients[Math.abs(hash) % gradients.length];
}

export default function RoomView({
  currentRoom, connected, allUsers, onlineUsers, currentUsername,
  messages, typingUser, rooms, userProfiles,
  onOpenDM, onReact, onSeen, replyTo, setReplyTo,
  forwardData, setForwardData, sendForward,
  onSend, onTyping, onForward,
  onLeaveGroup, onDeleteGroup, onDeleteChat, onUpdateGroupAvatar, onAddMembers,
  pinnedMessages, onPinMessage,
}: {
  currentRoom: string;
  connected: boolean;
  allUsers: string[];
  onlineUsers: string[];
  currentUsername: string;
  messages: ChatMessage[];
  typingUser: TypingUser | null;
  rooms: RoomSummary[];
  userProfiles?: Record<string, UserProfile>;
  onOpenDM: (username: string) => void;
  onReact: (messageId: string, emoji: string) => void;
  onSeen: (ids: string[]) => void;
  replyTo: ReplyDraft;
  setReplyTo: (msg: ReplyDraft) => void;
  forwardData: ForwardDraft;
  setForwardData: (data: ForwardDraft) => void;
  sendForward: (caption: string) => void;
  onSend: (text: string, file?: SendFile, audio?: SendAudio) => void;
  onTyping: (value: string) => void;
  onForward: (text: string, fromUsername: string, to: string, isRoom: boolean) => void;
  onLeaveGroup: (roomId: string) => void;
  onDeleteGroup: (roomId: string) => void;
  onDeleteChat: (roomId: string) => void;
  onUpdateGroupAvatar?: (roomId: string, file: File) => void;
  onAddMembers?: (roomId: string, members: string[]) => void;
  pinnedMessages: ChatMessage[];
  onPinMessage: (messageId: string) => void;
}) {
  const room = rooms.find((r) => r.id === currentRoom);
  const [showPinnedList, setShowPinnedList] = useState(false);

  // ── Voice recorder ─────────────────────────────────────
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const timerRef = useRef<number | null>(null);
  const waveCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleVoiceRecorded = async (blob: Blob, duration: number) => {
    try {
      const formData = new FormData();
      formData.append("file", blob, `voice-${Date.now()}.webm`);
      const res = await axios.post(UPLOAD_URL, formData);
      onSend("", undefined, {
        audioUrl: res.data.url,
        audioDuration: duration,
      });
    } catch {
      alert("Voice upload failed.");
    }
  };

  const { recording, start, stop, cancel } = useVoiceRecorder(
    handleVoiceRecorded,
    waveCanvasRef,
  );

  const handleStartRecording = async () => {
    setRecordingSeconds(0);
    await start();
    timerRef.current = window.setInterval(() => {
      setRecordingSeconds((s) => s + 1);
    }, 1000);
  };

  const handleStopAndSend = () => {
    if (timerRef.current !== null) { window.clearInterval(timerRef.current); timerRef.current = null; }
    stop();
  };

  const handleCancelRecording = () => {
    if (timerRef.current !== null) { window.clearInterval(timerRef.current); timerRef.current = null; }
    setRecordingSeconds(0);
    cancel();
  };
  // ───────────────────────────────────────────────────────

  if (!room) return null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0e1621]">
      <RoomHeader
        room={room}
        connected={connected}
        onlineUsers={onlineUsers}
        allUsers={allUsers}
        currentUsername={currentUsername}
        userProfiles={userProfiles}
        onOpenDM={onOpenDM}
        onLeaveGroup={() => onLeaveGroup(currentRoom)}
        onDeleteGroup={() => onDeleteGroup(currentRoom)}
        onDeleteChat={() => onDeleteChat(currentRoom)}
        onUpdateGroupAvatar={onUpdateGroupAvatar}
        onAddMembers={onAddMembers}
      />

      {/* Pinned messages bar */}
      {pinnedMessages.length > 0 && (
        <div
          className="shrink-0 bg-[#17212b] border-b border-[#0d1821] px-4 py-2 flex items-center gap-3 cursor-pointer hover:bg-[#1e2c3a] transition-colors"
          onClick={() => setShowPinnedList((v) => !v)}
        >
          <div className="w-0.5 h-8 bg-[#5288c1] rounded-full shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[11px] text-[#5288c1] font-semibold mb-0.5">
              📌 {pinnedMessages.length} Pinned Message{pinnedMessages.length > 1 ? "s" : ""}
            </div>
            <div className="text-[12px] text-[#8b98a5] truncate">
              {pinnedMessages[pinnedMessages.length - 1]?.text || "📎 Attachment"}
            </div>
          </div>
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="#6c7883" strokeWidth="2" strokeLinecap="round"
            className={`shrink-0 transition-transform duration-200 ${showPinnedList ? "rotate-180" : ""}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      )}

      {/* Expanded pinned list */}
      {pinnedMessages.length > 0 && showPinnedList && (
        <div className="shrink-0 bg-[#151e27] border-b border-[#0d1821] max-h-[200px] overflow-y-auto">
          {pinnedMessages.map((msg) => (
            <div
              key={msg._id}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#1e2c3a] transition-colors border-b border-[#0d1821]/50 last:border-0"
            >
              <span className="text-[#5288c1] text-sm shrink-0">📌</span>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-[#5288c1] font-semibold mb-0.5">{msg.username}</div>
                <div className="text-[12px] text-[#8b98a5] truncate">
                  {msg.text || "📎 Attachment"}
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onPinMessage(msg._id!); }}
                className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-[#6c7883] hover:text-red-400 hover:bg-red-400/10 transition-colors text-[12px]"
                title="Unpin"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 select-none px-6">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg"
            style={{ background: room.avatarUrl ? undefined : getGroupGradient(room.name) }}
          >
            {room.avatarUrl ? (
              <img src={room.avatarUrl} alt={room.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              <GroupIcon size={36} />
            )}
          </div>
          <div className="text-center">
            <div className="text-[#e8ecf0] font-semibold text-[16px] mb-1">{room.name}</div>
            <div className="text-[#8b98a5] text-[13px] mb-1">No messages yet</div>
            <div className="text-[#4a5568] text-[13px] max-w-[260px] leading-relaxed">
              Send the first message in{" "}
              <span className="text-[#5288c1]">#{room.name}</span>{" "}
              to get the conversation started
            </div>
          </div>
        </div>
      ) : (
        <MessageList
          messages={messages}
          typingUser={typingUser}
          currentRoom={currentRoom}
          currentUsername={currentUsername}
          onReact={onReact}
          onSeen={onSeen}
          onReply={(msg) => setReplyTo(msg)}
          onForward={onForward}
          onPinMessage={onPinMessage}
          allUsers={allUsers}
          onlineUsers={onlineUsers}
          rooms={rooms}
          userProfiles={userProfiles}
        />
      )}

      {forwardData && (
        <ForwardBar
          text={forwardData.text}
          fromUsername={forwardData.fromUsername}
          onSend={sendForward}
          onCancel={() => setForwardData(null)}
        />
      )}

      {/* Recording waveform bar — shown above InputBar while recording */}
      {recording && (
        <div className="flex items-center gap-3 px-3 py-2.5 bg-[#1c2a38] border-t border-[#0d1821] shrink-0">
          <button
            onClick={handleCancelRecording}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-[#2a3a4a] text-[#8b98a5] hover:bg-red-500/20 hover:text-red-400 transition-colors shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shrink-0" />
          <div className="flex-1 min-w-0">
            <canvas
              ref={waveCanvasRef}
              style={{ width: "100%", height: "44px", display: "block" }}
            />
          </div>
          <span className="text-[13px] font-mono text-[#8b98a5] shrink-0 tabular-nums w-10 text-right">
            {String(Math.floor(recordingSeconds / 60)).padStart(2, "0")}:{String(recordingSeconds % 60).padStart(2, "0")}
          </span>
          <button
            onClick={handleStopAndSend}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-[#5288c1] text-white hover:bg-[#4377aa] active:scale-95 transition-all shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      )}

      <InputBar
        currentRoom={currentRoom}
        onSend={(text, file, audio) => { onSend(text ?? "", file, audio); setReplyTo(null); }}
        onTyping={onTyping}
        replyTo={replyTo ?? undefined}
        onCancelReply={() => setReplyTo(null)}
        forwardMsg={forwardData ?? undefined}
        onCancelForward={() => setForwardData(null)}
        onForwardSend={(text, fromUsername, caption) => sendForward(caption)}
        isRecording={recording}
        onStartRecording={handleStartRecording}
        onStopRecording={handleStopAndSend}
        onCancelRecording={handleCancelRecording}
      />
    </div>
  );
}