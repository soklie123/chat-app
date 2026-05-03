import { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import { DMMessage, DMConversation } from "../types/chat";
import { getAvatarColor } from "./useChat";

const getTime = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export function useDM(socket: Socket | null, username: string) {
  const [activeDM, setActiveDM]           = useState<string | null>(null);
  const [dmMessages, setDmMessages]       = useState<DMMessage[]>([]);
  const [conversations, setConversations] = useState<DMConversation[]>([]);
  const [dmTyping, setDmTyping]           = useState<string | null>(null);

  const typingTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeDMRef  = useRef<string | null>(null); // ← tracks activeDM without stale closure

  // Keep ref in sync with state
  useEffect(() => {
    activeDMRef.current = activeDM;
  }, [activeDM]);


  const updateConversation = (
    withUser: string,
    lastMessage: string,
    time: string,
    addUnread: boolean
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

    // DM history loaded
    socket.on("dm_history", ({ with: withUser, messages }: {
      with: string;
      messages: Array<{ _id: string; from: string; to: string; text: string; createdAt: string }>;
    }) => {
      setDmMessages(
        messages.map((m) => ({
          _id:      m._id,
          text:     m.text,
          fromSelf: m.from === username,
          time:     new Date(m.createdAt).toLocaleTimeString([], {
            hour: "2-digit", minute: "2-digit",
          }),
          username: m.from,
        }))
      );
    });

    //  Use ref instead of state — avoids stale closure
    socket.on("dm_receive", (data: { _id: string; from: string; text: string; time: string }) => {
      const isOpen = activeDMRef.current === data.from;

      if (isOpen) {
        setDmMessages((prev) => [
          ...prev,
          {
            _id:      data._id,
            text:     data.text,
            fromSelf: false,
            time:     data.time,
            username: data.from,
          },
        ]);
      }
      updateConversation(data.from, data.text, data.time, !isOpen);
    });

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
      socket.off("dm_user_typing");
      socket.off("dm_user_stop_typing");
    };
  }, [socket, username]); // ← remove activeDM from deps — ref handles it now

  const openDM = (toUser: string) => {
    if (!socket || toUser === username) return;
    activeDMRef.current = toUser; // sync ref immediately before state update
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

  // Optimistic update — message appears immediately
  const sendDM = (text: string) => {
    if (!socket || !activeDMRef.current || !text.trim()) return;

    const time = getTime();

    setDmMessages((prev) => [
      ...prev,
      {
        text,
        fromSelf: true,
        time,
        username,
      },
    ]);

    updateConversation(activeDMRef.current, text, time, false);
    socket.emit("dm_send", { from: username, to: activeDMRef.current, text });
  };

  const emitDMTyping = (value: string) => {
    if (!socket || !activeDMRef.current) return;
    if (value.length > 0) {
      socket.emit("dm_typing", { from: username, to: activeDMRef.current });
    } else {
      socket.emit("dm_stop_typing", { from: username, to: activeDMRef.current });
    }
  };



  const addCallEventMessage = (
    event: "missed" | "ended" | "rejected",
    callType: "voice" | "video",
    withUser: string,
    duration: number,
    fromSelf: boolean,
  ) => {
    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit", minute: "2-digit",
    });

    const msg: DMMessage = {
      _id: `call-${Date.now()}`,
      text: "",
      fromSelf,
      time,
      username: fromSelf ? username : withUser,
      callEvent: event,
      callType,
      callDuration: duration,
    };

    console.log("Adding call event message:", msg);
    setDmMessages((prev) => [...prev, msg]);

    // Update conversation last message
    const label = event === "ended"
      ? `${callType === "video" ? "📹" : "📞"} Call ended`
      : event === "missed"
      ? "📵 Missed call"
      : "📵 Call declined";
    updateConversation(withUser, label, msg.time, false);
  }

  return {
    activeDM,
    dmMessages,
    conversations,
    dmTyping,
    openDM,
    closeDM,
    sendDM,
    emitDMTyping,
    addCallEventMessage,
  };
}