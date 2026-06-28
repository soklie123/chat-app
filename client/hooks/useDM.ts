import { CallType } from "./../types/chat";
import { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import { DMMessage, DMConversation, MessageStatus } from "../types/chat";

export function useDM(socket: Socket | null, username: string) {
  const [activeDM, setActiveDM] = useState<string | null>(null);
  const [dmMessages, setDmMessages] = useState<DMMessage[]>([]);
  const [conversations, setConversations] = useState<DMConversation[]>([]);
  const [dmTyping, setDmTyping] = useState<string | null>(null);

  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeDMRef = useRef<string | null>(null);

  useEffect(() => {
    activeDMRef.current = activeDM;
  }, [activeDM]);

  const updateConversation = (
    withUser: string,
    lastMessage: string,
    time: string,
    addUnread: boolean,
    isGroup?: boolean
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
      return [...prev, {
        username: withUser,
        lastMessage,
        time,
        unread: addUnread ? 1 : 0,
        isGroup: isGroup ?? false,
      }];
    });
  };

  useEffect(() => {
    if (!socket) return;

    // ── DM history ────────────────────────────────────────────────
    socket.on("dm_history", ({ with: withUser, messages, isGroup }: {
      with: string;
      isGroup?: boolean;
      messages: Array<{
        _id: string;
        from: string;
        to: string;
        text: string;
        type?: string;
        callType?: "voice" | "video";
        callEvent?: "ended" | "missed" | "rejected";
        duration?: number;
        createdAt: string;
        fileUrl?: string;
        fileName?: string;
        fileType?: string;
        isImage?: boolean;
        audioUrl?: string;
        audioDuration?: number;
        replyTo?: { _id: string; username: string; text: string };
        forwarded?: boolean;
        reactions?: { emoji: string; count: number; usernames: string[] }[];
        deletedForEveryone?: boolean;
      }>;
    }) => {
      const mapped: DMMessage[] = messages.map((m) => ({
        _id: m._id,
        text: m.text,
        fromSelf: m.from === username,
        time: new Date(m.createdAt).toLocaleTimeString([], {
          hour: "2-digit", minute: "2-digit",
        }),
        username: m.from,
        fileUrl: m.fileUrl,
        fileName: m.fileName,
        fileType: m.fileType,
        isImage: m.isImage,
        audioUrl: m.audioUrl,
        audioDuration: m.audioDuration,
        replyTo: m.replyTo,
        forwarded: m.forwarded,
        reactions: m.reactions ?? [],
        deletedForEveryone: m.deletedForEveryone ?? false,
        callEvent:    m.type === "call" ? m.callEvent : undefined,
        callType:     m.type === "call" ? m.callType  : undefined,
        callDuration: m.type === "call" ? m.duration  : undefined,
        status: "seen" as MessageStatus,
      }));
      setDmMessages(mapped);

      if (isGroup) {
        setConversations(prev => prev.map(c =>
          c.username === withUser ? { ...c, isGroup: true } : c
        ));
      }
    });

    // ── Receive DM ────────────────────────────────────────────────
    socket.on("dm_receive", (data: {
      _id: string;
      from: string;
      to: string;
      text: string;
      fromSelf: string;
      time: string;
      type?: string;
      callType?: "voice" | "video";
      callEvent?: "ended" | "missed" | "rejected";
      duration?: number;
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
      isGroup?: boolean;
      groupName?: string;
    }) => {
      const isCall = data.type === "call";
      const otherUser = data.from === username ? data.to : data.from;
      const isOutgoing = data.from === username;
      const isOpen =
        activeDMRef.current === otherUser ||
        (data.isGroup && activeDMRef.current === data.groupName);

      if (isOpen) {
        setDmMessages((prev) => {
          if (prev.some((m) => m._id === data._id)) return prev;
          return [
            ...prev,
            {
              _id: data._id,
              text: data.text,
              fromSelf: isOutgoing,
              time: data.time,
              username: otherUser,
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
              callEvent: isCall ? data.callEvent : undefined,
              callType: isCall ? data.callType : undefined,
              callDuration: isCall ? data.duration ?? 0 : undefined,
            },
          ];
        });

        if (!isCall) {
          socket.emit("messages_seen", { messageIds: [data._id], to: data.from });
        }
      } else {
        const convKey = data.isGroup ? (data.groupName ?? otherUser) : otherUser;
        const preview = isCall
          ? data.callEvent === "missed"
            ? isOutgoing ? "📞 No answer" : "📵 Missed call"
            : data.callEvent === "rejected"
            ? isOutgoing ? "🚫 Declined" : "❌ You declined"
            : isOutgoing ? "📞 Outgoing call" : "📞 Incoming call"
          : data.text
          ? data.text
          : data.audioUrl
          ? "🎤 Voice message"
          : "📎 File";

        updateConversation(convKey, preview, data.time, true, data.isGroup);
      }
    });

    // ── DM sent confirmed ─────────────────────────────────────────
    socket.on("dm_sent", (data: {
      _id: string;
      tempId?: string;
      from: string;
      time: string;
      text?: string;
      forwarded?: boolean;
      caption?: string;
      fromUsername?: string;
      replyTo?: { _id: string; username: string; text: string };
      audioUrl?: string;
      audioDuration?: number;
      fileUrl?: string;
      fileName?: string;
      fileType?: string;
      isImage?: boolean;
    }) => {
      setDmMessages((prev) =>
        prev.map((msg) =>
          msg._id === data.tempId
            ? {
                ...msg,
                _id: data._id,
                status: "sent" as MessageStatus,
                ...(data.audioUrl      && { audioUrl:      data.audioUrl }),
                ...(data.audioDuration && { audioDuration: data.audioDuration }),
                ...(data.fileUrl       && { fileUrl:        data.fileUrl }),
                ...(data.fileName      && { fileName:       data.fileName }),
                ...(data.fileType      && { fileType:       data.fileType }),
                ...(data.isImage !== undefined && { isImage: data.isImage }),
                ...(data.forwarded !== undefined && { forwarded: data.forwarded }),
                ...(data.replyTo      && { replyTo:      data.replyTo }),
                ...(data.caption      && { caption:      data.caption }),
                ...(data.fromUsername && { fromUsername: data.fromUsername }),
              }
            : msg
        )
      );
    });

    // ── Reaction updated ──────────────────────────────────────────
    socket.on("dm_reaction_updated", ({ messageId, reactions }: {
      messageId: string;
      reactions: { emoji: string; count: number; usernames: string[] }[];
    }) => {
      setDmMessages(prev =>
        prev.map(msg => msg._id === messageId ? { ...msg, reactions } : msg)
      );
    });

    // ── Message unsent (deleted for everyone) ─────────────────────
    socket.on("dm_unsent", ({ messageId }: { messageId: string }) => {
      setDmMessages(prev =>
        prev.map(msg =>
          msg._id === messageId
            ? {
                ...msg,
                text: "",
                deletedForEveryone: true,
                fileUrl: undefined,
                fileName: undefined,
                fileType: undefined,
                audioUrl: undefined,
                audioDuration: undefined,
                replyTo: undefined,
                reactions: [],
              }
            : msg
        )
      );
    });

    // ── Delivery / seen status ────────────────────────────────────
    socket.on("message_delivered", ({ messageId }: { messageId: string }) => {
      setDmMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId && msg.status === "sent"
            ? { ...msg, status: "delivered" as MessageStatus }
            : msg
        )
      );
    });

    socket.on("messages_seen", ({ messageIds }: { messageIds: string[] }) => {
      setDmMessages((prev) =>
        prev.map((msg) =>
          messageIds.includes(msg._id ?? "") && msg.fromSelf
            ? { ...msg, status: "seen" as MessageStatus }
            : msg
        )
      );
    });

    // ── Typing ────────────────────────────────────────────────────
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
      socket.off("dm_reaction_updated");
      socket.off("dm_unsent");
      socket.off("message_delivered");
      socket.off("messages_seen");
      socket.off("dm_user_typing");
      socket.off("dm_user_stop_typing");
    };
  }, [socket, username]);

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

  const closeDM = () => {
    activeDMRef.current = null;
    setActiveDM(null);
    setDmMessages([]);
    setDmTyping(null);
  };

  const sendDM = (
    text: string,
    file?: { fileUrl: string; fileName: string; fileType: string; isImage: boolean },
    audio?: { audioUrl: string; audioDuration: number },
    replyTo?: { _id: string; username: string; text: string },
    forwarded?: boolean,
    fromUsername?: string,
    caption?: string,
  ) => {
    if (!socket || !activeDM || (!text.trim() && !file && !audio)) return;

    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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
      activeDM,
      text || (audio ? "🎤 Voice message" : "📎 File"),
      time,
      false
    );

    socket.emit("dm_send", {
      from: username,
      to: activeDM,
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

  const emitDMTyping = (value: string) => {
    if (!socket || !activeDMRef.current) return;
    if (value.length > 0) {
      socket.emit("dm_typing", { from: username, to: activeDMRef.current });
    } else {
      socket.emit("dm_stop_typing", { from: username, to: activeDMRef.current });
    }
  };

  const markDMSeen = (messageIds: string[]) => {
    if (!socket || !activeDMRef.current || messageIds.length === 0) return;
    socket.emit("messages_seen", { messageIds, to: activeDMRef.current });
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
    markDMSeen,
  };
}