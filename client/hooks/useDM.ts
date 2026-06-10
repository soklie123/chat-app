import { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import { DMMessage, DMConversation, MessageStatus } from "../types/chat";

export function useDM(socket: Socket | null, username: string) {
  const [activeDM, setActiveDM]           = useState<string | null>(null);
  const [dmMessages, setDmMessages]       = useState<DMMessage[]>([]);
  const [conversations, setConversations] = useState<DMConversation[]>([]);
  const [dmTyping, setDmTyping]           = useState<string | null>(null);

  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeDMRef = useRef<string | null>(null);

  useEffect(() => {
    activeDMRef.current = activeDM;
  }, [activeDM]);

  const updateConversation = (
    withUser:   string,
    lastMessage: string,
    time:       string,
    addUnread:  boolean
  ) => {
    setConversations((prev) => {
      const existing = prev.find((c) => c.username === withUser);
      if (existing) {
        return prev.map((c) =>
          c.username === withUser
            ? { ...c, lastMessage, time, unread: addUnread ? c.unread + 1 : c.unread }
            : c
        );
      }
      return [...prev, { username: withUser, lastMessage, time, unread: addUnread ? 1 : 0 }];
    });
  };

  useEffect(() => {
    if (!socket) return;

    // ── DM history ────────────────────────────────────────
    socket.on("dm_history", ({ with: withUser, messages }: {
      with: string;
      messages: Array<{
        _id:       string;
        from:      string;
        to:        string;
        text:      string;
        createdAt: string;

        fileUrl?:  string;
        fileName?: string;
        fileType?: string;
        isImage?:  boolean;

        audioUrl?: string;
        audioDuration?: number;

        replyTo?: {
          _id: string;
          username: string;
          text: string;
        };

        forwarded?: boolean;

        reactions?: {
            emoji: string;
            count: number;
            usernames: string[];
          }[];
      }>;
    }) => {
      setDmMessages(
        messages.map((m) => ({
          _id:      m._id,
          text:     m.text,
          fromSelf: m.from === username,
          time:     new Date(m.createdAt).toLocaleTimeString([], {
            hour: "2-digit", minute: "2-digit",
          }),

          username:  m.from,

          fileUrl:   m.fileUrl,
          fileName:  m.fileName,
          fileType:  m.fileType,
          isImage:   m.isImage,

          audioUrl: m.audioUrl,
          audioDuration: m.audioDuration,

          replyTo: m.replyTo,
          forwarded: m.forwarded,

          reactions: m.reactions ?? [],

          status:    "seen" as MessageStatus, // history always seen
        }))
      );
    });

    // ── Receive DM ────────────────────────────────────────
    socket.on("dm_receive", (data: {
      _id: string;
      from: string;
      text: string;
      time: string;

      fileUrl?: string;
      fileName?: string;
      fileType?: string;
      isImage?: boolean;

      audioUrl?: string;
      audioDuration?: number;

      replyTo?: { _id: string; username: string; text: string };
      forwarded?: boolean;
      caption?: string;
      fromUsername?: string; // for forwarded messages
    }) => {
      const isOpen = activeDMRef.current === data.from;

      if (isOpen) {
        setDmMessages((prev) => [
          ...prev,
          {
            _id: data._id,
            text: data.text,
            fromSelf: false,
            time: data.time,
            username: data.from,

            fileUrl: data.fileUrl,
            fileName: data.fileName,
            fileType: data.fileType,
            isImage: data.isImage,

            audioUrl: data.audioUrl,
            audioDuration: data.audioDuration,

            replyTo: data.replyTo,
            forwarded: data.forwarded,
            caption: data.caption,
            fromUsername: data.fromUsername,

            status: "seen" as MessageStatus,
          },
        ]);

        socket.emit("messages_seen", {
          messageIds: [data._id],
          to: data.from,
        });
      } else {
        updateConversation(
          data.from,
          data.text
            ? data.text
            : data.audioUrl
            ? "Voice message"
            : "File",
          data.time,
          true
        );
      }
    });

    // ── DM sent confirmed ─────────────────────────────────
    socket.on("dm_sent", (data: {
      _id:    string;
      tempId?: string;
      from:   string;
      time:   string;
      forwarded?: boolean;
      caption?: string;
      fromUsername?: string;

      replyTo?: {
        _id: string;
        username: string;
        text: string;
      };

      audioUrl?: string;
      audioDuration?: number;
    }) => {
      setDmMessages((prev) =>
        prev.map((msg) =>
          msg._id === data.tempId
            ? { 
              ...msg, 
              _id: data._id, 
              status: "sent" as MessageStatus, 
              forwarded: data.forwarded ?? msg.forwarded,
              replyTo: data.replyTo ?? msg.replyTo,
              audioUrl: data.audioUrl ?? msg.audioUrl,
              audioDuration: data.audioDuration ?? msg.audioDuration,
              caption: data.caption ?? msg.caption,
              fromUsername: data.fromUsername ?? msg.fromUsername,
            }
            : msg
        )
      );
    });

    socket.on("dm_reaction_updated", ({ messageId, reactions}) => {
      setDmMessages(prev => 
        prev.map(msg => 
          msg._id === messageId
            ? { ...msg, reactions}
            : msg
        )
      );
    });

    // ── Delivered ─────────────────────────────────────────
    socket.on("message_delivered", ({ messageId }: { messageId: string }) => {
      setDmMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId && msg.status === "sent"
            ? { ...msg, status: "delivered" as MessageStatus }
            : msg
        )
      );
    });

    // ── Seen ──────────────────────────────────────────────
    socket.on("messages_seen", ({ messageIds }: { messageIds: string[] }) => {
      setDmMessages((prev) =>
        prev.map((msg) =>
          messageIds.includes(msg._id ?? "") && msg.fromSelf
            ? { ...msg, status: "seen" as MessageStatus }
            : msg
        )
      );
    });

    // ── Typing ────────────────────────────────────────────
    socket.on("dm_user_typing", (from: string) => {
      if (from === activeDMRef.current) {
        setDmTyping(from);
        if (typingTimer.current) clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => setDmTyping(null), 3000);
      }
    });

    socket.on("dm_user_stop_typing", () => setDmTyping(null));

    return () => {
      socket.off("dm_history");
      socket.off("dm_receive");
      socket.off("dm_sent");
      socket.off("message_delivered");
      socket.off("messages_seen");
      socket.off("dm_user_typing");
      socket.off("dm_user_stop_typing");
    };
  }, [socket, username]);

  // ── Open DM ───────────────────────────────────────────
  const openDM = (toUser: string) => {
    if (!socket || toUser === username) return;
    activeDMRef.current = toUser;
    setActiveDM(toUser);
    setDmMessages([]);
    setDmTyping(null);
    setConversations((prev) =>
      prev.map((c) => c.username === toUser ? { ...c, unread: 0 } : c)
    );
    socket.emit("dm_open", { from: username, to: toUser });
  };

  // ── Close DM ──────────────────────────────────────────
  const closeDM = () => {
    activeDMRef.current = null;
    setActiveDM(null);
    setDmMessages([]);
    setDmTyping(null);
  };

  // ── Send DM ───────────────────────────────────────────
  const sendDM = (
    text: string, 
    file?: {
      fileUrl: string; 
      fileName: string; 
      fileType: string; 
      isImage: boolean; 
    }, 
    audio?: {
      audioUrl: string;
      audioDuration: number;
    },
    replyTo?: { 
      _id: string; 
      username: string; 
      text: string;
    },

    forwarded?: boolean,

    fromUsername?: string, // for forwarded messages
    caption?: string,      // for forwarded messages

  ) => {
    if (
      !socket || 
      !activeDM || 
      (!text.trim() && !file && !audio)
    ) return;

    const time   = new Date().toLocaleTimeString([], {
      hour: "2-digit", minute: "2-digit",
    });
    const tempId = `temp-${Date.now()}`;

    setDmMessages((prev) => [
      ...prev,
      {
        _id: tempId,
        text,
        fromSelf: true,
        time,
        username,
        status: "sending" as MessageStatus,

        replyTo,
        forwarded,
        fromUsername,
        caption,

        ...file,
        ...audio,
      },
    ]);

    updateConversation(
      activeDM, text || (audio ? "🎤 Voice message" : "📎 File"),
      time, false
    );

    socket.emit("dm_send", {
      from: username,
      to:   activeDM,
      text,
      tempId,

      replyTo,
      forwarded,
      
      fromUsername,
      caption,

      ...file,
      ...audio,
    });
  };

  // ── Typing ────────────────────────────────────────────
  const emitDMTyping = (value: string) => {
    if (!socket || !activeDMRef.current) return;
    if (value.length > 0) {
      socket.emit("dm_typing",      { from: username, to: activeDMRef.current });
    } else {
      socket.emit("dm_stop_typing", { from: username, to: activeDMRef.current });
    }
  };

  // ── Mark seen ─────────────────────────────────────────
  const markDMSeen = (messageIds: string[]) => {
    if (!socket || !activeDMRef.current || messageIds.length === 0) return;
    socket.emit("messages_seen", {
      messageIds,
      to: activeDMRef.current,
    });
  };

  // ── Call event message ────────────────────────────────
  const addCallEventMessage = (
    event:    "missed" | "ended" | "rejected",
    callType: "voice" | "video",
    withUser: string,
    duration: number,
    fromSelf: boolean,
  ) => {
    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit", minute: "2-digit",
    });

    const msg: DMMessage = {
      _id:          `call-${Date.now()}`,
      text:         "",
      fromSelf,
      time,
      username:     fromSelf ? username : withUser,
      callEvent:    event,
      callType,
      callDuration: duration,
    };

    setDmMessages((prev) => [...prev, msg]);

    const label = event === "ended"
      ? `${callType === "video" ? "📹" : "📞"} Call ended`
      : event === "missed"
      ? "📵 Missed call"
      : "📵 Call declined";

    updateConversation(withUser, label, msg.time, false);
  };

  return {
    activeDM,
    dmMessages,
    conversations,
    dmTyping,
    openDM,
    closeDM,
    sendDM,
    emitDMTyping,
    markDMSeen,          //  new
    addCallEventMessage,
  };
}