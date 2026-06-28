export type Reaction = {
  emoji: string;
  count: number;
  usernames: string[];
}

export type MessageStatus = "sending" | "sent" | "delivered" | "seen";

export type ChatMessage = {
  _id?: string;
  text: string;
  fromSelf: boolean;
  time: string;
  username: string;
  color: string;
  reactions: Reaction[];
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  isImage?: boolean;
  audioUrl?: string;
  audioDuration?: number;
  callEvent?: "missed" | "ended" | "rejected";
  callType?: "voice" | "video";
  callDuration?: number;
  status?: MessageStatus;
  replyTo?: { _id: string; username: string; text: string };
  forwarded?: boolean;
  fromUsername?: string;
  caption?: string;
};

export type TypingUser = {
  name: string;
  color: string;
};

export type DMMessage = {
  _id?: string;
  text: string;
  fromSelf: boolean;
  time: string;
  username: string;
  reactions?: { emoji: string; count: number; usernames: string[] }[];
  isSystem?: boolean;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  isImage?: boolean;
  audioUrl?: string;
  audioDuration?: number;
  callEvent?: "missed" | "ended" | "rejected";
  callType?: "voice" | "video";
  callDuration?: number;
  status?: MessageStatus;
  replyTo?: { _id: string; username: string; text: string };
  forwarded?: boolean;
  caption?: string;
  fromUsername?: string;
  /** Set to true by the dm_unsent socket event — renders a "deleted" placeholder */
  deletedForEveryone?: boolean;
};

export type DMConversation = {
  username: string;
  lastMessage: string;
  time: string;
  unread: number;
  isGroup?: boolean;
  members?: string[];
};

export type CallType = "voice" | "video";

export type CallState =
  | "idle"
  | "calling"
  | "receiving"
  | "connected"
  | "ended";

export type CallInfo = {
  callId: string;
  from: string;
  to: string;
  type: CallType;
  roomId?: string;
};