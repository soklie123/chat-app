import { useEffect, useRef, useState, useCallback } from "react";
import { Socket } from "socket.io-client";
import { ChatMessage, TypingUser, Reaction } from "../types/chat";
import { getAvatarColor } from "./useChat";

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
type ReplyDraft = { _id: string; username: string; text: string } | null;

type RawServerMessage = {
  _id: string;
  tempId?: string;
  text: string;
  username: string;
  roomId?: string;
  time: string;
  reactions?: Reaction[];
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  isImage?: boolean;
  audioUrl?: string;
  audioDuration?: number;
  replyTo?: { _id: string; username: string; text: string };
  forwarded?: boolean;
  caption?: string;
  fromUsername?: string;
};

export function useRoom(socket: Socket | null, username: string) {
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [roomMessages, setRoomMessages] = useState<ChatMessage[]>([]);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [typingUser, setTypingUser] = useState<TypingUser | null>(null);
  const [roomUnread, setRoomUnread] = useState<Record<string, number>>({});

  const currentRoomRef = useRef<string | null>(null);
  useEffect(() => {
    currentRoomRef.current = currentRoom;
  }, [currentRoom]);

  const pendingTempIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!socket) return;

    const onHistory = ({ messages, hasMore }: { messages: RawServerMessage[]; hasMore: boolean }) => {
      setRoomMessages(messages.map((m) => toChatMessage(m, username)));
      setHasMoreHistory(hasMore);
    };

    const onOlder = ({ messages, hasMore }: { messages: RawServerMessage[]; hasMore: boolean }) => {
      setRoomMessages((prev) => [
        ...messages.map((m) => toChatMessage(m, username)),
        ...prev,
      ]);
      setHasMoreHistory(hasMore);
    };

    const onReceive = (payload: RawServerMessage) => {
      const targetRoom = payload.roomId;
      if (!targetRoom) return;

      // Bump unread for rooms not currently open (fallback for same-socket delivery)
      if (targetRoom !== currentRoomRef.current && payload.username !== username) {
        setRoomUnread((prev) => ({
          ...prev,
          [targetRoom]: (prev[targetRoom] ?? 0) + 1,
        }));
      }

      if (targetRoom !== currentRoomRef.current) return;

      setRoomMessages((prev) => {
        if (payload.tempId && pendingTempIds.current.has(payload.tempId)) {
          pendingTempIds.current.delete(payload.tempId);
          return prev.map((m) =>
            m._id === payload.tempId ? toChatMessage(payload, username) : m
          );
        }

        const alreadyPresent = prev.some((m) => m._id === payload._id);
        if (alreadyPresent) return prev;

        if (payload.tempId) {
          const stillHasOptimistic = prev.some((m) => m._id === payload.tempId);
          if (stillHasOptimistic) {
            return prev.map((m) =>
              m._id === payload.tempId ? toChatMessage(payload, username) : m
            );
          }
        }

        return [...prev, toChatMessage(payload, username)];
      });
    };

    // ── NEW: lightweight unread bump from server for background rooms ──
    const onUnreadBump = ({ roomId, username: fromUser }: { roomId: string; username: string }) => {
      // Ignore if we sent it or if that room is currently open
      if (fromUser === username) return;
      if (roomId === currentRoomRef.current) return;

      setRoomUnread((prev) => ({
        ...prev,
        [roomId]: (prev[roomId] ?? 0) + 1,
      }));
    };

    const onUserTyping = (typingUsername: string) => {
      if (typingUsername === username) return;
      setTypingUser({ name: typingUsername, color: getAvatarColor(typingUsername) });
    };

    const onUserStopTyping = () => setTypingUser(null);

    const onReactionUpdated = ({ messageId, reactions }: { messageId: string; reactions: Reaction[] }) => {
      setRoomMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, reactions } : m))
      );
    };

    const onJoined = (roomId: string) => {
      setCurrentRoom(roomId);
      setRoomUnread((prev) => {
        if (!prev[roomId]) return prev;
        const next = { ...prev };
        delete next[roomId];
        return next;
      });
    };

    const onSeen = ({ messageIds }: { messageIds: string[] }) => {
      setRoomMessages((prev) =>
        prev.map((m) =>
          m._id && messageIds.includes(m._id) ? { ...m, status: "seen" } : m
        )
      );
    };

    const onLeftGroup = ({ roomId }: { roomId: string }) => {
      if (currentRoomRef.current === roomId) {
        setCurrentRoom(null);
        setRoomMessages([]);
        setTypingUser(null);
      }
      setRoomUnread((prev) => {
        if (!(roomId in prev)) return prev;
        const next = { ...prev };
        delete next[roomId];
        return next;
      });
    };

    const onGroupDeleted = ({ roomId }: { roomId: string }) => {
      if (currentRoomRef.current === roomId) {
        setCurrentRoom(null);
        setRoomMessages([]);
        setTypingUser(null);
      }
      setRoomUnread((prev) => {
        if (!(roomId in prev)) return prev;
        const next = { ...prev };
        delete next[roomId];
        return next;
      });
    };

    const onRoomChatCleared = ({ roomId }: { roomId: string }) => {
      if (currentRoomRef.current === roomId) {
        setRoomMessages([]);
      }
    };

    const onGroupMemberLeft = (_: { roomId: string; username: string }) => {};

    socket.on("chat_history", onHistory);
    socket.on("older_messages", onOlder);
    socket.on("receive_message", onReceive);
    socket.on("room_unread_bump", onUnreadBump);   // ← new
    socket.on("user_typing", onUserTyping);
    socket.on("user_stop_typing", onUserStopTyping);
    socket.on("message_reaction_updated", onReactionUpdated);
    socket.on("message_reaction_update", onReactionUpdated);
    socket.on("joined_room", onJoined);
    socket.on("messages_seen", onSeen);
    socket.on("left_group", onLeftGroup);
    socket.on("group_deleted", onGroupDeleted);
    socket.on("room_chat_cleared", onRoomChatCleared);
    socket.on("group_member_left", onGroupMemberLeft);

    return () => {
      socket.off("chat_history", onHistory);
      socket.off("older_messages", onOlder);
      socket.off("receive_message", onReceive);
      socket.off("room_unread_bump", onUnreadBump);  // ← new
      socket.off("user_typing", onUserTyping);
      socket.off("user_stop_typing", onUserStopTyping);
      socket.off("message_reaction_updated", onReactionUpdated);
      socket.off("message_reaction_update", onReactionUpdated);
      socket.off("joined_room", onJoined);
      socket.off("messages_seen", onSeen);
      socket.off("left_group", onLeftGroup);
      socket.off("group_deleted", onGroupDeleted);
      socket.off("room_chat_cleared", onRoomChatCleared);
      socket.off("group_member_left", onGroupMemberLeft);
    };
  }, [socket, username]);

  const openRoom = useCallback(
    (roomId: string) => {
      if (!socket || !roomId) return;
      setRoomUnread((prev) => {
        if (!prev[roomId]) return prev;
        const next = { ...prev };
        delete next[roomId];
        return next;
      });
      if (currentRoomRef.current === roomId) return;
      setRoomMessages([]);
      setHasMoreHistory(false);
      setTypingUser(null);
      socket.emit("join_room", roomId);
    },
    [socket]
  );

  const closeRoom = useCallback(() => {
    setCurrentRoom(null);
    setRoomMessages([]);
    setTypingUser(null);
  }, []);

  const sendRoomMessage = useCallback(
    (text: string, file?: SendFile, audio?: SendAudio, replyTo?: ReplyDraft) => {
      const roomId = currentRoomRef.current;
      if (!socket || !roomId || !username) return;
      if (!text.trim() && !file && !audio) return;

      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      pendingTempIds.current.add(tempId);

      const optimistic: ChatMessage = {
        _id: tempId,
        text,
        fromSelf: true,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        username,
        color: getAvatarColor(username),
        reactions: [],
        status: "sending",
        replyTo: replyTo ?? undefined,
        ...(file ?? {}),
        ...(audio ?? {}),
      };
      setRoomMessages((prev) => [...prev, optimistic]);

      socket.emit("send_message", {
        text,
        username,
        roomId,
        tempId,
        replyTo,
        ...(file ?? {}),
        ...(audio ?? {}),
      });
    },
    [socket, username]
  );

  const emitTyping = useCallback(
    (value: string) => {
      const roomId = currentRoomRef.current;
      if (!socket || !roomId) return;
      if (value) {
        socket.emit("typing", { username, roomId });
      } else {
        socket.emit("stop_typing", roomId);
      }
    },
    [socket, username]
  );

  const markRoomSeen = useCallback(
    (messageIds: string[]) => {
      const roomId = currentRoomRef.current;
      if (!socket || !roomId || messageIds.length === 0) return;
      socket.emit("messages_seen", { messageIds, roomId });
    },
    [socket]
  );

  const loadOlderMessages = useCallback(() => {
    const roomId = currentRoomRef.current;
    const oldest = roomMessages[0];
    if (!socket || !roomId || !oldest?.time || !hasMoreHistory) return;
    socket.emit("load_older_messages", { room: roomId, before: oldest.time });
  }, [socket, roomMessages, hasMoreHistory]);

  const reactToRoomMessage = useCallback(
    (messageId: string, emoji: string) => {
      const roomId = currentRoomRef.current;
      if (!socket || !roomId) return;
      socket.emit("add_reaction", { messageId, emoji, username, roomId });
    },
    [socket, username]
  );

  const leaveGroup = useCallback(
    (roomId: string) => {
      if (!socket || !roomId) return;
      socket.emit("leave_group", { roomId });
    },
    [socket]
  );

  const deleteGroup = useCallback(
    (roomId: string) => {
      if (!socket || !roomId) return;
      socket.emit("delete_group", { roomId });
    },
    [socket]
  );

  const deleteRoomChat = useCallback(
    (roomId: string) => {
      if (!socket || !roomId) return;
      socket.emit("delete_room_chat", { roomId });
    },
    [socket]
  );

  return {
    currentRoom,
    roomMessages,
    hasMoreHistory,
    typingUser,
    roomUnread,
    openRoom,
    closeRoom,
    sendRoomMessage,
    emitTyping,
    markRoomSeen,
    loadOlderMessages,
    reactToRoomMessage,
    leaveGroup,
    deleteGroup,
    deleteRoomChat,
  };
}

function toChatMessage(m: RawServerMessage, currentUsername: string): ChatMessage {
  return {
    _id: m._id,
    text: m.text ?? "",
    fromSelf: m.username === currentUsername,
    time: m.time ?? "",
    username: m.username,
    color: getAvatarColor(m.username),
    reactions: m.reactions ?? [],
    fileUrl: m.fileUrl,
    fileName: m.fileName,
    fileType: m.fileType,
    isImage: m.isImage,
    audioUrl: m.audioUrl,
    audioDuration: m.audioDuration,
    replyTo: m.replyTo,
    forwarded: m.forwarded,
    caption: m.caption,
    fromUsername: m.fromUsername,
  };
}