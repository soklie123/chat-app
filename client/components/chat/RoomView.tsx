import { ChatMessage, TypingUser } from "../../types/chat";
import MessageList from "./MessageList";
import InputBar from "../shared/InputBar";
import ForwardBar from "../shared/ForwardBar";
import RoomHeader from "./RoomHeader";
import GroupIcon from "../shared/GroupIcon";
import { UserProfile } from "../../hooks/useChat";

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
}) {
  const room = rooms.find((r) => r.id === currentRoom);
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

      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 select-none px-6">
          {/* ── Empty state: gradient group icon instead of letter ── */}
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

      <InputBar
        currentRoom={currentRoom}
        onSend={(text, file, audio) => { onSend(text ?? "", file, audio); setReplyTo(null); }}
        onTyping={onTyping}
        replyTo={replyTo ?? undefined}
        onCancelReply={() => setReplyTo(null)}
        forwardMsg={forwardData ?? undefined}
        onCancelForward={() => setForwardData(null)}
        onForwardSend={(text, fromUsername, caption) => sendForward(caption)}
      />
    </div>
  );
}