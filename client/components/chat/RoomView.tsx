import { ChatMessage, TypingUser } from "../../types/chat";
import MessageList from "./MessageList";
import InputBar from "../shared/InputBar";
import ForwardBar from "../shared/ForwardBar";
import RoomHeader from "./RoomHeader";

type ReplyDraft = { _id: string; username: string; text: string } | null;
type ForwardDraft = { text: string; fromUsername: string } | null;
type RoomSummary = { id: string; name: string; memberCount: number; members: string[] };

// Mirrors the exact shape useChat's sendMessage expects — there is no
// exported FileData/AudioData type in chat.ts, so these are defined
// inline here rather than invented.
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
  onlineUsers,
  currentUsername,
  messages,
  typingUser,
  rooms,
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
}: {
  /** Room id/slug (e.g. "friend") — used to look up its member list. */
  currentRoom: string;
  connected: boolean;
  onlineUsers: string[];
  currentUsername: string;
  messages: ChatMessage[];
  typingUser: TypingUser | null;
  rooms: RoomSummary[];
  onOpenDM: (username: string) => void;
  onReact: (messageId: string, emoji: string) => void;
  onSeen: (ids: string[]) => void;
  replyTo: ReplyDraft;
  setReplyTo: (msg: ReplyDraft) => void;
  forwardData: ForwardDraft;
  setForwardData: (data: ForwardDraft) => void;
  sendForward: (caption: string) => void;
  // text is always a string from useChat.sendMessage's perspective —
  // callers pass `text ?? ""` before this point.
  onSend: (text: string, file?: SendFile, audio?: SendAudio) => void;
  // emitTyping takes the *current input value*, not a room id — passing
  // "" tells the server to stop_typing, anything else tells it to type.
  onTyping: (value: string) => void;
  onForward: (text: string, fromUsername: string, to: string, isRoom: boolean) => void;
}) {
  const room = rooms.find((r) => r.id === currentRoom);
  const members = room?.members ?? [];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0e1621]">
      <RoomHeader
        currentRoom={room?.name ?? currentRoom}
        members={members}
        connected={connected}
        onlineUsers={onlineUsers}
        currentUsername={currentUsername}
        onOpenDM={onOpenDM}
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
              Send the first message in <span className="text-[#5288c1]">#{room?.name ?? currentRoom}</span> to get the conversation started
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
          onlineUsers={onlineUsers}
          rooms={rooms}
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