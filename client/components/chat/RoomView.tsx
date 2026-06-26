import { ChatMessage, TypingUser } from "../../types/chat";
import MessageList from "./MessageList";
import InputBar from "../shared/InputBar";
import ForwardBar from "../shared/ForwardBar";
import RoomHeader from "./RoomHeader";
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

type SendFile = {
  fileUrl: string;
  fileName: string;
  fileType: string;
  isImage: boolean;
};
type SendAudio = {
  audioUrl: string;
  audioDuration: number;
};

export default function RoomView({
  currentRoom,
  connected,
  allUsers,
  onlineUsers,
  currentUsername,
  messages,
  typingUser,
  rooms,
  userProfiles,
  onOpenDM,
  onReact,
  onSeen,
  replyTo,
  setReplyTo,
  forwardData,
  setForwardData,
  sendForward,
  onSend,
  onTyping,
  onForward,
  onLeaveGroup,
  onDeleteGroup,
  onDeleteChat,
  onUpdateGroupAvatar,
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
}) {
  const room = rooms.find((r) => r.id === currentRoom);

  if (!room) return null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0e1621]">
      <RoomHeader
        room={room}
        connected={connected}
        onlineUsers={onlineUsers}
        currentUsername={currentUsername}
        userProfiles={userProfiles}
        onOpenDM={onOpenDM}
        onLeaveGroup={() => onLeaveGroup(currentRoom)}
        onDeleteGroup={() => onDeleteGroup(currentRoom)}
        onDeleteChat={() => onDeleteChat(currentRoom)}
        onUpdateGroupAvatar={onUpdateGroupAvatar}
      />

      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 select-none px-6">
          <div className="w-16 h-16 rounded-full bg-[#17212b] flex items-center justify-center">
            <span className="text-2xl text-[#5288c1] font-semibold">#</span>
          </div>
          <div className="text-center">
            <div className="text-[#8b98a5] font-semibold text-[15px] mb-1">
              No messages yet
            </div>
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
        onSend={(text, file, audio) => {
          onSend(text ?? "", file, audio);
          setReplyTo(null);
        }}
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