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

    // DM history
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

        // ── call fields ──
        callEvent:    m.type === "call" ? m.callEvent : undefined,
        callType:     m.type === "call" ? m.callType  : undefined,
        callDuration: m.type === "call" ? m.duration  : undefined,

        status: "seen" as MessageStatus,
      }))
      setDmMessages(mapped); // use mapped, not inline .map() again

      // Mark this conversation as group if applicable
      if (isGroup) {
        setConversations(prev => prev.map(c =>
          c.username === withUser ? { ...c, isGroup: true } : c
        ));
      }
    });

    // Receive DM
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

      // ← For calls, "other user" depends on which side you are
      // Caller: data.from === username, so other = data.to
      // Receiver: data.from !== username, so other = data.from
      const otherUser = data.from === username ? data.to : data.from;
      // const isOutgoing = data.from !== username;
      const isOutgoing = data.from === username;


      // const isOutgoing = data.from === username && data.to === otherUser;

      const isOpen = activeDMRef.current === otherUser || // ← use otherUser, not data.from
        (data.isGroup && activeDMRef.current === data.groupName);

      if (isOpen) {
        setDmMessages((prev) => {
          if (prev.some((m) => m._id === data._id)) return prev; // ✅ prevent duplicate

          return [
            ...prev,
            {
              _id: data._id,
              text: data.text,
              fromSelf: isOutgoing,
              time: data.time,
              username: otherUser, //  FIXED
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
        // ← use otherUser as convKey too, not data.from
        const convKey = data.isGroup ? (data.groupName ?? otherUser) : otherUser;

        // const preview = isCall
        //   ? data.callEvent === "missed"   ? "📵 Missed call"
        //   : data.callEvent === "rejected" ? "🚫 Call declined"
        //   : "📞 Call ended"
        //   : data.text     ? data.text
        //   : data.audioUrl ? "🎤 Voice message"
        //   : "📎 File";
        const isOutgoing = data.from === username;

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

    // DM sent confirmed
    socket.on("dm_sent", (data: {
      _id: string;
      tempId?: string;
      from: string;
      time: string;
<<<<<<< HEAD
      text?: string;
=======
>>>>>>> 0378d05a57b015d813c4c194c226eb231a3eccbc
      forwarded?: boolean;
      caption?: string;
      fromUsername?: string;
      replyTo?: { _id: string; username: string; text: string };
      audioUrl?: string;
      audioDuration?: number;
<<<<<<< HEAD
      fileUrl?: string;
      fileName?: string;
      fileType?: string;
      isImage?: boolean;
    }) => {
=======
    }) => {
      // Normal message only — call messages now come through dm_receive
>>>>>>> 0378d05a57b015d813c4c194c226eb231a3eccbc
      setDmMessages((prev) =>
        prev.map((msg) =>
          msg._id === data.tempId
            ? {
<<<<<<< HEAD
                ...msg,          // keep everything from optimistic message
                _id:           data._id,
                status:        "sent" as MessageStatus,
                // only override if server sent a value
                ...(data.audioUrl      && { audioUrl:      data.audioUrl }),
                ...(data.audioDuration && { audioDuration: data.audioDuration }),
                ...(data.fileUrl       && { fileUrl:        data.fileUrl }),
                ...(data.fileName      && { fileName:       data.fileName }),
                ...(data.fileType      && { fileType:       data.fileType }),
                ...(data.isImage  !== undefined && { isImage: data.isImage }),
                ...(data.forwarded    !== undefined && { forwarded:    data.forwarded }),
                ...(data.replyTo      && { replyTo:      data.replyTo }),
                ...(data.caption      && { caption:      data.caption }),
                ...(data.fromUsername && { fromUsername: data.fromUsername }),
=======
                ...msg,
                _id:           data._id,
                status:        "sent" as MessageStatus,
                forwarded:     data.forwarded     ?? msg.forwarded,
                replyTo:       data.replyTo       ?? msg.replyTo,
                audioUrl:      data.audioUrl      ?? msg.audioUrl,
                audioDuration: data.audioDuration ?? msg.audioDuration,
                caption:       data.caption       ?? msg.caption,
                fromUsername:  data.fromUsername  ?? msg.fromUsername,
>>>>>>> 0378d05a57b015d813c4c194c226eb231a3eccbc
              }
            : msg
        )
      );
    });

    socket.on("dm_reaction_updated", ({ messageId, reactions }) => {
      setDmMessages(prev =>
        prev.map(msg => msg._id === messageId ? { ...msg, reactions } : msg)
      );
    });

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

    socket.on("dm_user_typing", (from: string) => {
      if (from === activeDMRef.current) {
        setDmTyping(from);
        if (typingTimer.current) clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => setDmTyping(null), 3000);
      }
    });

    socket.on("dm_user_stop_typing", () => setDmTyping(null));

    // NOTE: "room_created" listener intentionally removed.
    // Groups live exclusively in `rooms` state (via useRoom.ts / "room_list").
    // Previously this handler also called updateConversation(roomId, "Group created", ...),
    // which created a duplicate sidebar entry for every new group — one from `rooms`
    // (the "# room" row) and one from `conversations` (the "Group created" row).

    return () => {
      socket.off("dm_history");
      socket.off("dm_receive");
      socket.off("dm_sent");
      socket.off("dm_reaction_updated");
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
    // addCallEventMessage,
  };
}