import { useState, useRef, useEffect } from "react";
import { useDM } from "../hooks/useDM";
import { useRoom } from "../hooks/useRoom";
import { useCall } from "../hooks/useCall";
import { useChat } from "../hooks/useChat";
import { useNotifications } from "../hooks/useNotifications";
import { useUnseenNotifications } from "../hooks/useUnseenNotifications";
import NotificationBanner, { useToasts } from "../components/shared/NotificationBanner";
import AuthGate from "../components/auth/AuthGate";
import Sidebar from "../components/layout/Sidebar";
import DMPanel from "../components/dm/DMPanel";
import RoomView from "../components/chat/RoomView";
import CallScreen from "../components/call/CallScreen";
import { AuthUser } from "../lib/api";
import { RoomSummary } from "../hooks/useChat";

type ReplyDraft = { _id: string; username: string; text: string } | null;
type ForwardDraft = { text: string; fromUsername: string } | null;
type SendFile = {
  fileUrl: string;
  fileName: string;
  fileType: string;
  isImage: boolean;
};
type AudioDraft = {
  audioUrl: string;
  audioDuration: number | string;
};

export default function Home() {
  const [username, setUsername] = useState("");

  const handleAuthed = (user: AuthUser, _token: string) => {
    setUsername(user.username);
  };

  const {
    socket, connected, onlineUsers, allUsers, rooms, createRoom, logout,userProfiles
  } = useChat(username);

  const {
    activeDM, dmMessages, conversations, dmTyping,
    openDM, closeDM, sendDM, emitDMTyping, markDMSeen,
  } = useDM(socket, username);

  const {
    currentRoom,
    roomMessages,
    typingUser: roomTyping,
    roomUnread,           // ← destructure roomUnread here
    openRoom,
    closeRoom,
    sendRoomMessage,
    emitTyping: emitRoomTyping,
    markRoomSeen,
    reactToRoomMessage,
    leaveGroup,
    deleteGroup,
    deleteRoomChat,
  } = useRoom(socket, username);

  const activeDMRef = useRef<string | null>(null);
  useEffect(() => {
    activeDMRef.current = activeDM;
  }, [activeDM]);

  const { permission, notifyMessage, notifyDM, notifyRoom, notifyCall, notifyInvite } =
    useNotifications(username);
  const { toasts, addToast, removeToast } = useToasts();

  const {
    callState, callInfo, localStream, remoteStream,
    isMuted, isCamOff, isSharing, isSpeaker,
    startCall, answerCall, endCall, rejectCall,
    toggleMute, toggleCamera, toggleScreenShare, toggleSpeaker,
  } = useCall(socket, username, (event) => {
    const withUser = event.with || activeDMRef.current || "";
    if (!withUser) return;
    // addCallEventMessage(event.type, event.callType, withUser, event.duration, event.type !== "missed");
    if (!activeDMRef.current) openDM(withUser);
  });

  // ── Incoming call notification (sound + toast), independent of DM/room message flow ──
  const lastNotifiedCallId = useRef<string | null>(null);
  useEffect(() => {
    if (callState !== "receiving" || !callInfo) return;
    if (lastNotifiedCallId.current === callInfo.callId) return;
    lastNotifiedCallId.current = callInfo.callId;

    notifyCall(callInfo.from, callInfo.type);
    addToast(callInfo.from, callInfo.type === "video" ? "Incoming video call" : "Incoming voice call", true, undefined, "call");
  }, [callState, callInfo, notifyCall, addToast]);

  const [dmReplyTo, setDMReplyTo] = useState<ReplyDraft>(null);
  const [roomReplyTo, setRoomReplyTo] = useState<ReplyDraft>(null);
  const [forwardData, setForwardData] = useState<ForwardDraft>(null);

  const handleOpenDM = (otherUsername: string) => {
    closeRoom();
    openDM(otherUsername);
  };

  const handleOpenRoom = (roomId: string) => {
    closeDM();
    openRoom(roomId);
  };

  const handleForward = (
    text: string,
    fromUsername: string,
    to: string,
    isRoom: boolean
  ) => {
    if (isRoom) {
      handleOpenRoom(to);
    } else {
      handleOpenDM(to);
    }
    setTimeout(() => setForwardData({ text, fromUsername }), 200);
  };

  const sendForward = (caption: string) => {
    if (!forwardData) return;
    if (currentRoom) {
      sendRoomMessage(caption.trim() || forwardData.text);
    } else {
      sendDM(
        forwardData.text,
        undefined,
        undefined,
        undefined,
        true,
        forwardData.fromUsername,
        caption.trim()
      );
    }
    setForwardData(null);
  };

  // ── Watches incoming room/DM/conversation activity and fires toast + sound
  //    only when the relevant chat isn't the one currently open & focused ──
  useUnseenNotifications({
    messages: roomMessages,
    dmMessages,
    conversations,
    activeDM,
    currentRoom: currentRoom ?? "",
    notifyMessage,
    notifyRoom,
    notifyDM,
    addToast,
  });

  // ── Group invite notification ──
  useEffect(() => {
    if (!socket) return;

    const onInvited = ({ groupName }: { groupName: string }) => {
      notifyInvite(groupName);
      addToast(groupName, "You were added to the group", false, groupName, "room");
    };

    socket.on("invited_to_group", onInvited);

    return () => {
      socket.off("invited_to_group", onInvited);
    };
  }, [socket, notifyInvite, addToast]);

  const handleCreateGroup = (name: string, members: string[]) => {
    const roomId = name.trim().toLowerCase().replace(/\s+/g, "-");

    if (socket) {
      const onCreated = (createdRoomId: string) => {
        if (createdRoomId !== roomId) return;
        socket.off("room_created", onCreated);
        handleOpenRoom(createdRoomId);
        if (members.length > 0) {
          setTimeout(() => {
            socket.emit("invite_to_group", { room: createdRoomId, users: members });
          }, 300);
        }
      };
      socket.on("room_created", onCreated);
    }

    createRoom(name);
  };

  const handleSend = (text: string, file?: SendFile, audio?: AudioDraft) => {
    if (!text.trim() && !file && !audio) return;
    const normalizedAudio = audio
      ? {
          ...audio,
          audioDuration:
            typeof audio.audioDuration === "string"
              ? Number(audio.audioDuration)
              : audio.audioDuration,
        }
      : undefined;

    if (currentRoom) {
      sendRoomMessage(text ?? "", file, normalizedAudio, roomReplyTo ?? undefined);
      setRoomReplyTo(null);
      return;
    }

    sendDM(text ?? "", file, normalizedAudio, dmReplyTo ?? undefined);
    setDMReplyTo(null);
  };

  const handleReact = (messageId: string, emoji: string) => {
    if (currentRoom) {
      reactToRoomMessage(messageId, emoji);
      return;
    }
    socket?.emit("add_dm_reaction", {
      messageId,
      emoji,
      username,
      to: activeDM,
    });
  };

  if (!username) return <AuthGate onAuthed={handleAuthed} />;

  return (
    <>
      <style>{`
        @keyframes tg-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>

      <CallScreen
        callState={callState} callInfo={callInfo}
        localStream={localStream} remoteStream={remoteStream}
        isMuted={isMuted} isCamOff={isCamOff} isSharing={isSharing} isSpeaker={isSpeaker}
        username={username}
        onAnswer={answerCall} onReject={rejectCall} onEnd={endCall}
        onToggleMute={toggleMute} onToggleCamera={toggleCamera}
        onToggleScreenShare={toggleScreenShare} onToggleSpeaker={toggleSpeaker}
      />

      <NotificationBanner
        toasts={toasts}
        onDismiss={removeToast}
        onOpenDM={handleOpenDM}
        onJoinRoom={handleOpenRoom}
      />

      <div className="h-screen flex overflow-hidden bg-[#0e1621]" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

        <Sidebar
          username={username}
          onLogout={() => { logout(); setUsername(""); }}
          onlineUsers={onlineUsers}
          allUsers={allUsers}
          conversations={conversations}
          activeDM={activeDM}
          rooms={rooms}
          currentRoom={currentRoom}
          onOpenDM={handleOpenDM}
          onOpenRoom={handleOpenRoom}
          onCreateGroup={handleCreateGroup}
          roomUnread={roomUnread}  
          userProfiles={userProfiles}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          {currentRoom ? (
            <RoomView
              currentRoom={currentRoom}
              connected={connected}
              onlineUsers={onlineUsers}
              currentUsername={username}
              messages={roomMessages}
              typingUser={roomTyping}
              rooms={rooms}
              onOpenDM={handleOpenDM}
              onReact={handleReact}
              onSeen={markRoomSeen}
              replyTo={roomReplyTo}
              setReplyTo={setRoomReplyTo}
              forwardData={forwardData}
              setForwardData={setForwardData}
              sendForward={sendForward}
              onSend={handleSend}
              onTyping={emitRoomTyping}
              onForward={handleForward}
              onLeaveGroup={leaveGroup}
              onDeleteGroup={deleteGroup}
              onDeleteChat={deleteRoomChat} allUsers={[]}            />
          ) : activeDM ? (
            <DMPanel
              currentUsername={username}
              withUser={activeDM}
              messages={dmMessages}
              dmTyping={dmTyping}
              isOnline={onlineUsers.includes(activeDM)}
              onSend={handleSend}
              onTyping={emitDMTyping}
              onClose={closeDM}
              onReact={handleReact}
              onVoiceCall={() => startCall(activeDM, "voice")}
              onVideoCall={() => startCall(activeDM, "video")}
              onSeen={(ids) => markDMSeen(ids)}
              onReply={(msg) => setDMReplyTo(msg)}
              onForward={handleForward}
              onlineUsers={onlineUsers}
              rooms={rooms}
              replyTo={dmReplyTo ?? undefined}
              onCancelReply={() => setDMReplyTo(null)}
              forwardMsg={forwardData ?? undefined}
              onCancelForward={() => setForwardData(null)}
              onForwardSend={(_text, _from, caption) => sendForward(caption)}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-[#0e1621] gap-4 select-none">
              <div className="w-[88px] h-[88px] rounded-full bg-[#17212b] flex items-center justify-center">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
                  stroke="#5288c1" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div className="text-center">
                <div className="text-[20px] font-semibold text-[#8b98a5] mb-2">
                  Select a chat
                </div>
                <div className="text-[13.5px] text-[#4a5568] max-w-[240px] leading-relaxed">
                  Choose a conversation from the sidebar to start messaging
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}