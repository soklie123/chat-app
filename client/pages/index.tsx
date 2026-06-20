import { useState, useRef, useEffect } from "react";
import { useChat } from "../hooks/useChat";
import { useDM } from "../hooks/useDM";
import { useNotifications } from "../hooks/useNotifications";
import { useCall } from "../hooks/useCall"
import NotificationBanner, { useToasts } from "../components/shared/NotificationBanner";
import Avatar from "../components/shared/Avatar";
import UsernameGate from "../components/shared/UsernameGate";
import Sidebar from "../components/layout/Sidebar";
import MessageList from "../components/chat/MessageList";
import InputBar from "../components/shared/InputBar";
import DMPanel from "../components/dm/DMPanel";
import CallScreen from "../components/call/CallScreen";
import ForwardBar from "../components/shared/ForwardBar";

export default function Home() {
  const [username, setUsername] = useState("");

  const {
    socket,
    connected,
    messages,
    onlineUsers,
    typingUser,
    currentRoom,
    rooms,
    sendMessage,
    emitTyping,
    joinRoom,
    createRoom,
    addReaction,
    logout,
    markRoomSeen,
  } = useChat(username);

  const {
    activeDM,
    dmMessages,
    conversations,
    dmTyping,
    openDM,
    closeDM,
    sendDM,
    emitDMTyping,
    markDMSeen,
    addCallEventMessage,
  } = useDM(socket, username);
  
  const activeDMRef = useRef<string | null>(null);

  useEffect(() => {
    activeDMRef.current = activeDM;
  }, [activeDM]);

  const {
    callState,
    callInfo,
    localStream,
    remoteStream,
    isMuted,
    isCamOff,
    isSharing,
    isSpeaker,
    startCall,
    answerCall,
    endCall,
    rejectCall,
    toggleMute,
    toggleCamera,
    toggleScreenShare,
    toggleSpeaker,
  } = useCall(socket, username, (event) => {
    console.log("onCallEvent received:", event);
    const withUser = event.with || activeDMRef.current || "";

    // When a call event happens, add it to DM messages
    if (!withUser) {
      console.warn("No withUser — call event lost");
      return;
    }
      addCallEventMessage(
        event.type,
        event.callType,
        withUser,
        event.duration,
        event.type !== "missed",
      );

      // If DM not open, open it to show the event
      if (!activeDMRef.current) {
        openDM(withUser);
      
    }
  });

  // for replying to messages in rooms or DMs
  const [replyTo, setReplyTo] = useState<{ 
    _id: string; username: string; text: string 
  } | null>(null);

  // ========= Forward ========================================================
  const [forwardData, setForwardData] = useState<{
    text: string;
    fromUsername: string;
  } | null>(null);

  const cancelForward = () => setForwardData(null);
  // Hanle forward
  const handleForward = (
    text: string,
    fromUsername: string,
    to: string,
    isRoom: boolean
  ) => {
    console.log("FORWARDING:", { text, fromUsername, to, isRoom });
    if (isRoom) {
      closeDM();
      joinRoom(to);
    } else {
      openDM(to);
    }

    setTimeout(() => {
      setForwardData({
        text,
        fromUsername,
      });
    }, 200);
  };

  const sendForward = (caption: string) => {
    if (!forwardData) return;

    if (activeDM) {
      sendDM(
        forwardData.text,
        undefined,
        undefined,
        undefined,
        true,
        forwardData.fromUsername,
        caption.trim()
      );
    } else {
      sendMessage(
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
  }

  const [dmReplyTo, setDMReplyTo] = useState<{ 
    _id: string; username: string; text: string 
  } | null>(null);

  // ====================================================================================

  const { notifyMessage, notifyDM } = useNotifications(username);
  const { toasts, addToast, removeToast } = useToasts();

  // Track previous message count to detect new ones
  const [prevLen, setPrevLen] = useState(0);

  if (messages.length > prevLen) {
    const newMsg = messages[messages.length - 1];
    if (newMsg && !newMsg.fromSelf) {
      // Only notify if user is in a different room or DM is open
      if (activeDM) {
        notifyMessage(newMsg.username, newMsg.text);
        addToast(newMsg.username, newMsg.text, false, currentRoom);
      }
    }
    setPrevLen(messages.length);
  }

  // ── Notify on new DM ────────────────────────────────
  const [prevDMLen, setPrevDMLen] = useState(0);
  if (dmMessages.length > prevDMLen) {
    const newDM = dmMessages[dmMessages.length - 1];
    if (newDM && !newDM.fromSelf) {
      notifyDM(newDM.username, newDM.text);
    }
    setPrevDMLen(dmMessages.length);
  }


  // ── Notify on new DM from conversations (when DM not open) ──
  const [prevConvUnread, setPrevConvUnread ] = useState(0);
  const totalUnread = conversations.reduce((s, c) => s + c.unread, 0);
  if (totalUnread > prevConvUnread) {
    const newConv = conversations.find((c) => c.unread > 0);
    if (newConv) {
      notifyDM(newConv.username, newConv.lastMessage);
      addToast(newConv.username, newConv.lastMessage, true);
    }
  }
  if (totalUnread !== prevConvUnread) setPrevConvUnread(totalUnread);
  // ====================================================================================

  const handleLogout = () => {
    logout();
    setUsername("");
  };

  // When user opens a DM, close the room view
  const handleOpenDM = (toUser: string) => {
    console.log("Opening DM with", toUser);
    openDM(toUser);
  };

  // When user clicks a room, close DM
  const handleJoinRoom = (roomId: string) => {
    closeDM();
    joinRoom(roomId);
  };

  if (!username) {
    return <UsernameGate onJoin={setUsername} />;
  }
// console.log("callState:", callState, "callInfo:", callInfo);


  return (
    <>
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
        @keyframes slide-in {
          from { transform: translateX(120%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}
      </style>
      <CallScreen
        callState={callState}
        callInfo={callInfo}
        localStream={localStream}
        remoteStream={remoteStream}
        isMuted={isMuted}
        isCamOff={isCamOff}
        isSharing={isSharing}
        isSpeaker={isSpeaker}
        username={username}
        onAnswer={answerCall}
        onReject={rejectCall}
        onEnd={endCall}
        onToggleMute={toggleMute}
        onToggleCamera={toggleCamera}
        onToggleScreenShare={toggleScreenShare}
        onToggleSpeaker={toggleSpeaker}
      />

      {/* ── Toast notifications ── */}
      <NotificationBanner
        toasts={toasts}
        onDismiss={removeToast}
        onOpenDM={handleOpenDM}
        onJoinRoom={handleJoinRoom}
      />

      <div className="h-screen bg-[#1e2a35] flex overflow-hidden">
  <div className="flex-1 flex overflow-hidden">

          {/* Sidebar */}
          <Sidebar
            rooms={rooms}
            currentRoom={currentRoom}
            username={username}
            onJoin={handleJoinRoom}
            onCreate={createRoom}
            onLogout={handleLogout}
            onlineUsers={onlineUsers}
            conversations={conversations}
            activeDM={activeDM}
            onOpenDM={handleOpenDM}
          />

          {/* Main panel — DM or Room */}
          {activeDM ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              <DMPanel
                withUser={activeDM}
                messages={dmMessages}
                dmTyping={dmTyping}
                isOnline={onlineUsers.includes(activeDM)}

                onSend={(text, file, audio) => {
                  const reply = dmReplyTo;
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

                  console.log("DMPanel onSend, dmReplyTo:", dmReplyTo);
                  sendDM(text ?? "", file, normalizedAudio, reply ?? undefined);
                  setDMReplyTo(null);
                }}
                onTyping={emitDMTyping}
                onClose={closeDM}

                onReact={(messageId, emoji) => 
                  socket?.emit("add_dm_reaction", {
                    messageId,
                    emoji,
                    username,
                    to: activeDM,
                  })
                }
                onVoiceCall={() => startCall(activeDM, "voice")}
                onVideoCall={() => startCall(activeDM, "video")}
                onSeen={(ids) => markDMSeen(ids)}
                onReply={(msg) => {
                  console.log("DM reply set:", msg);
                  setDMReplyTo(msg)
                }}
                onForward={handleForward}
                onlineUsers={onlineUsers}
                rooms={rooms}
                replyTo={dmReplyTo ?? undefined}
                onCancelReply={() => setDMReplyTo(null)}

                forwardMsg={forwardData ?? undefined}
                onCancelForward={() => setForwardData(null)}
                onForwardSend={(text, fromUsername, caption) => sendForward(caption)}
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">

              {/* Header */}
              <div className="bg-[#0088cc] px-4 py-3 flex items-center gap-3 flex-shrink-0">
                <div className="flex-1 min-w-0">
                  <div className="text-white font-medium text-[15px]"># {currentRoom}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-[7px] h-[7px] rounded-full flex-shrink-0"
                      style={{ background: connected ? "#4ade80" : "#f44336" }} />
                    <span className="text-[12px] text-white/75">
                      {connected ? `${onlineUsers.length} online` : "offline"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Online users strip — click to open DM */}
              {onlineUsers.length > 0 && (
                <div className="px-3.5 py-2.5 border-b border-gray-200 bg-[#f7f9fb] flex items-center gap-4 overflow-x-auto flex-shrink-0">
                  {onlineUsers.map((name) => (
                    <button
                      key={name}
                      onClick={() => name !== username && handleOpenDM(name)}
                      className="flex flex-col items-center gap-1 flex-shrink-0 group"
                    >
                      <Avatar name={name} size={34} ring />
                      <span className="text-[10px] text-slate-500 group-hover:text-[#0088cc] transition-colors">
                        {name}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Messages */}
              <MessageList
                messages={messages}
                typingUser={typingUser}
                currentRoom={currentRoom}
                currentUsername={username}
                onReact={(messageId, emoji) => addReaction(messageId, emoji, currentRoom)}
                onSeen={(ids) => markRoomSeen(ids)}
                onReply={(msg) => setReplyTo(msg)}
                onForward={handleForward}
                onlineUsers={onlineUsers}
                rooms={rooms}
              />       
              {forwardData && (
                <ForwardBar
                  text={forwardData.text}
                  fromUsername={forwardData.fromUsername}
                  onSend={sendForward}
                  onCancel={cancelForward}
                />
              )}
              {/* Input */}
              <InputBar
                currentRoom={currentRoom}
                onSend={(text, file, audio) => {
                  sendMessage(text ?? "", file, audio, replyTo ?? undefined);
                  setReplyTo(null);
                }}
                onTyping={emitTyping}
                replyTo={replyTo ?? undefined}
                onCancelReply={() => setReplyTo(null)}

                forwardMsg={forwardData ?? undefined}
                onCancelForward={() => setForwardData(null)}
                onForwardSend={(text, fromUsername, caption) => sendForward(caption)}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}