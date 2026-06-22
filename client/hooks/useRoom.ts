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

/**
 * Shape of a message as it actually comes off the wire from the server
 * (room.handlers.ts / message.handlers.ts) — covers chat_history,
 * older_messages, and receive_message payloads, which all share this
 * same field set.
 */
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

/**
 * Room/group chat state and actions.
 *
 * Mirrors the real backend contract in server/src/sockets/room.handlers.ts
 * and message.handlers.ts:
 *   - join_room      -> chat_history (also forcibly leaves any other room
 *                       you were in, server-side, so only call this when
 *                       the room actually changes)
 *   - send_message   -> receive_message (broadcast to the whole room,
 *                       including the sender)
 *   - typing/stop_typing -> user_typing/user_stop_typing (payload is just
 *                       a username string, not an object)
 *   - load_older_messages -> older_messages
 *   - add_reaction   -> message_reaction_updated, OR message_reaction_update
 *                       (no trailing "d") for the toggle-off case — the
 *                       backend genuinely uses two different event names,
 *                       so this hook listens for both.
 */
export function useRoom(socket: Socket | null, username: string) {
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [roomMessages, setRoomMessages] = useState<ChatMessage[]>([]);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [typingUser, setTypingUser] = useState<TypingUser | null>(null);

  const currentRoomRef = useRef<string | null>(null);
  useEffect(() => {
    currentRoomRef.current = currentRoom;
  }, [currentRoom]);

  // Pending sends keyed by tempId, so we can reconcile the optimistic
  // message with the server-confirmed one when receive_message echoes back.
  const pendingTempIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!socket) return;

    const onHistory = ({
      messages,
      hasMore,
    }: {
      messages: RawServerMessage[];
      hasMore: boolean;
    }) => {
      setRoomMessages(
        messages.map((m) => toChatMessage(m, username))
      );
      setHasMoreHistory(hasMore);
    };

    const onOlder = ({
      messages,
      hasMore,
    }: {
      messages: RawServerMessage[];
      hasMore: boolean;
    }) => {
      setRoomMessages((prev) => [
        ...messages.map((m) => toChatMessage(m, username)),
        ...prev,
      ]);
      setHasMoreHistory(hasMore);
    };

    const onReceive = (payload: RawServerMessage) => {
      // Only append if it belongs to the room we're currently viewing.
      if (payload.roomId !== currentRoomRef.current) return;

      setRoomMessages((prev) => {
        // Reconcile our own optimistic message via tempId instead of
        // appending a duplicate.
        if (payload.tempId && pendingTempIds.current.has(payload.tempId)) {
          pendingTempIds.current.delete(payload.tempId);
          return prev.map((m) =>
            m._id === payload.tempId
              ? toChatMessage(payload, username)
              : m
          );
        }
        return [...prev, toChatMessage(payload, username)];
      });
    };

    const onUserTyping = (typingUsername: string) => {
      if (typingUsername === username) return;
      setTypingUser({ name: typingUsername, color: getAvatarColor(typingUsername) });
    };

    const onUserStopTyping = () => setTypingUser(null);

    const onReactionUpdated = ({
      messageId,
      reactions,
    }: {
      messageId: string;
      reactions: Reaction[];
    }) => {
      setRoomMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, reactions } : m))
      );
    };

    const onJoined = (roomId: string) => {
      setCurrentRoom(roomId);
    };

    const onSeen = ({ messageIds }: { messageIds: string[] }) => {
      setRoomMessages((prev) =>
        prev.map((m) =>
          m._id && messageIds.includes(m._id) ? { ...m, status: "seen" } : m
        )
      );
    };

    socket.on("chat_history", onHistory);
    socket.on("older_messages", onOlder);
    socket.on("receive_message", onReceive);
    socket.on("user_typing", onUserTyping);
    socket.on("user_stop_typing", onUserStopTyping);
    // Backend emits both event names depending on toggle direction.
    socket.on("message_reaction_updated", onReactionUpdated);
    socket.on("message_reaction_update", onReactionUpdated);
    socket.on("joined_room", onJoined);
    socket.on("messages_seen", onSeen);

    return () => {
      socket.off("chat_history", onHistory);
      socket.off("older_messages", onOlder);
      socket.off("receive_message", onReceive);
      socket.off("user_typing", onUserTyping);
      socket.off("user_stop_typing", onUserStopTyping);
      socket.off("message_reaction_updated", onReactionUpdated);
      socket.off("message_reaction_update", onReactionUpdated);
      socket.off("joined_room", onJoined);
      socket.off("messages_seen", onSeen);
    };
  }, [socket, username]);

  /** Switch the active room. No-ops if already in that room. */
  const openRoom = useCallback(
    (roomId: string) => {
      if (!socket || !roomId) return;
      if (currentRoomRef.current === roomId) return;
      setRoomMessages([]);
      setHasMoreHistory(false);
      setTypingUser(null);
      socket.emit("join_room", roomId);
      // currentRoom is confirmed by the "joined_room" event, not set eagerly,
      // so the UI doesn't show a room as active before the server agrees.
    },
    [socket]
  );

  const closeRoom = useCallback(() => {
    setCurrentRoom(null);
    setRoomMessages([]);
    setTypingUser(null);
  }, []);

  const sendRoomMessage = useCallback(
    (
      text: string,
      file?: SendFile,
      audio?: SendAudio,
      replyTo?: ReplyDraft
    ) => {
      const roomId = currentRoomRef.current;
      if (!socket || !roomId || !username) return;
      if (!text.trim() && !file && !audio) return;

      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      pendingTempIds.current.add(tempId);

      // Optimistic local echo so the sender sees the message instantly,
      // matching the pattern implied by tempId reconciliation server-side.
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

  return {
    currentRoom,
    roomMessages,
    hasMoreHistory,
    typingUser,
    openRoom,
    closeRoom,
    sendRoomMessage,
    emitTyping,
    markRoomSeen,
    loadOlderMessages,
    reactToRoomMessage,
  };
}

/** Normalizes a raw server message into the ChatMessage shape the UI expects. */
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