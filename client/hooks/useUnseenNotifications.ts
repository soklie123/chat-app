import { useEffect, useRef } from "react";
import { ChatMessage, DMMessage, DMConversation } from "../types/chat";

type ToastKind = "dm" | "room" | "call";

export function useUnseenNotifications({
  messages,
  dmMessages,
  conversations,
  activeDM,
  currentRoom,
  notifyMessage,
  notifyRoom,
  notifyDM,
  addToast,
}: {
  messages: ChatMessage[];
  dmMessages: DMMessage[];
  conversations: DMConversation[];
  activeDM: string | null;
  currentRoom: string;
  notifyMessage?: (from: string, text: string, isDM?: boolean) => void;
  notifyRoom?: (roomName: string, from: string, text: string) => void;
  notifyDM?: (from: string, text: string) => void;
  addToast: (from: string, text: string, isDM: boolean, room?: string, kind?: ToastKind) => void;
}) {
  // Track last-seen message id per surface so we only notify on genuinely new messages
  const lastRoomMsgId = useRef<string | undefined>(undefined);
  const lastDMMsgId = useRef<string | undefined>(undefined);
  const isFocusedRef = useRef(true);

  useEffect(() => {
    const onFocus = () => { isFocusedRef.current = true; };
    const onBlur = () => { isFocusedRef.current = false; };
    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  // ── Room messages (currently open room only — this is what `messages` holds) ──
  useEffect(() => {
    if (messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (!last._id || last._id === lastRoomMsgId.current) return;
    lastRoomMsgId.current = last._id;

    if (last.fromSelf) return;

    const chatIsOpenAndFocused = isFocusedRef.current && !!currentRoom;
    const text = last.text || (last.fileUrl ? "📎 File" : last.audioUrl ? "🎤 Voice message" : "");

    if (chatIsOpenAndFocused) return; // looking right at it — stay quiet

    notifyRoom?.(currentRoom, last.username, text);
    addToast(last.username, text, false, currentRoom, "room");
  }, [messages, currentRoom, notifyRoom, addToast]);

  // ── DM messages (currently open DM only — this is what `dmMessages` holds) ──
  useEffect(() => {
    if (dmMessages.length === 0) return;
    const last = dmMessages[dmMessages.length - 1];
    if (!last._id || last._id === lastDMMsgId.current) return;
    lastDMMsgId.current = last._id;

    if (last.fromSelf || last.callEvent) return;

    const chatIsOpenAndFocused = isFocusedRef.current && !!activeDM;
    const text = last.text || (last.fileUrl ? "📎 File" : last.audioUrl ? "🎤 Voice message" : "");

    if (chatIsOpenAndFocused) return;

    notifyDM?.(last.username, text);
    addToast(last.username, text, true, undefined, "dm");
  }, [dmMessages, activeDM, notifyDM, addToast]);

  // ── Background conversations (messages arriving for chats NOT currently open) ──
  // `conversations` updates its `unread`/`lastMessage` even when that chat isn't active;
  // this catches DMs and groups you're not currently looking at at all.
  const prevConvSnapshot = useRef<Record<string, string>>({});

  useEffect(() => {
    const next: Record<string, string> = {};

    for (const conv of conversations) {
      next[conv.username] = `${conv.lastMessage}|${conv.time}`;
      const prevSig = prevConvSnapshot.current[conv.username];
      const sig = next[conv.username];

      const isCurrentlyOpen = conv.isGroup
        ? conv.username === currentRoom
        : conv.username === activeDM;

      // Only fire if this conversation actually changed, isn't the one we're already in,
      // and we have a previous snapshot to compare against (skip the very first render).
      if (
        prevSig !== undefined &&
        prevSig !== sig &&
        !(isCurrentlyOpen && isFocusedRef.current) &&
        conv.unread > 0
      ) {
        if (conv.isGroup) {
          notifyRoom?.(conv.username, conv.username, conv.lastMessage);
          addToast(conv.username, conv.lastMessage, false, conv.username, "room");
        } else {
          notifyDM?.(conv.username, conv.lastMessage);
          addToast(conv.username, conv.lastMessage, true, undefined, "dm");
        }
      }
    }

    prevConvSnapshot.current = next;
  }, [conversations, activeDM, currentRoom, notifyRoom, notifyDM, addToast]);
}