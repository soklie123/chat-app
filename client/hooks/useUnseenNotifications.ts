import { useEffect, useRef } from "react";
import { ChatMessage, DMMessage, DMConversation } from "../types/chat";

/**
 * Watches messages / DM messages / conversation unread counts and fires
 * toast + system notifications exactly once per new item.
 *
 * NOTE: the previous implementation mutated state directly in the render
 * body ("if (messages.length > prevLen) { ... setPrevLen(...) }"). That
 * runs on *every* render (including ones caused by unrelated state
 * changes elsewhere in Home), and can double-fire or read stale closures.
 * Moving the same logic into useEffect keyed on the actual dependency
 * makes it run exactly once per real update, in the correct order.
 */
export function useUnseenNotifications({
  messages,
  dmMessages,
  conversations,
  activeDM,
  currentRoom,
  notifyMessage,
  notifyDM,
  addToast,
}: {
  messages: ChatMessage[];
  dmMessages: DMMessage[];
  conversations: DMConversation[];
  activeDM: string | null;
  currentRoom: string;
  notifyMessage: (username: string, text: string) => void;
  notifyDM: (username: string, text: string) => void;
  addToast: (
    username: string,
    text: string,
    isDM: boolean,
    room?: string
  ) => void;
}) {
  const prevMsgLen = useRef(0);
  const prevDMLen = useRef(0);
  const prevUnread = useRef(0);

  // Room messages
  useEffect(() => {
    if (messages.length > prevMsgLen.current) {
      const newMsg = messages[messages.length - 1];
      if (newMsg && !newMsg.fromSelf && activeDM) {
        notifyMessage(newMsg.username, newMsg.text);
        addToast(newMsg.username, newMsg.text, false, currentRoom);
      }
    }
    prevMsgLen.current = messages.length;
  }, [messages, activeDM, currentRoom, notifyMessage, addToast]);

  // DM messages
  useEffect(() => {
    if (dmMessages.length > prevDMLen.current) {
      const newDM = dmMessages[dmMessages.length - 1];
      if (newDM && !newDM.fromSelf) {
        notifyDM(newDM.username, newDM.text);
      }
    }
    prevDMLen.current = dmMessages.length;
  }, [dmMessages, notifyDM]);

  // Conversation unread totals
  useEffect(() => {
    const totalUnread = conversations.reduce((sum, c) => sum + c.unread, 0);
    if (totalUnread > prevUnread.current) {
      const newConv = conversations.find((c) => c.unread > 0);
      if (newConv) {
        notifyDM(newConv.username, newConv.lastMessage);
        addToast(newConv.username, newConv.lastMessage, true);
      }
    }
    prevUnread.current = totalUnread;
  }, [conversations, notifyDM, addToast]);
}