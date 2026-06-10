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

  // for image sent use cloudinary
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  isImage?: boolean;

  // sent voice
  audioUrl?: string;
  audioDuration?: number;

  callEvent?: "missed" | "ended" | "rejected";
  callType?: "voice" | "video";
  callDuration?: number; // seconds
  status?: MessageStatus;

  replyTo?: {
    _id: string;
    username: string;
    text: string;
  };
  forwarded?: boolean;
  fromUsername?: string; // for forwarded messages
  caption?: string;      // for forwarded messages
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

  reactions?: {
    emoji: string;
    count: number;
    usernames: string[];
  }[];

  // for image sent use cloudinary
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  isImage?: boolean;

  // sent voice
  audioUrl?: string;
  audioDuration?: number;

  // 
  callEvent?:    "missed" | "ended" | "rejected";
  callType?:     "voice" | "video";
  callDuration?: number;

  status?: MessageStatus;

  replyTo?: {
    _id: string;
    username: string;
    text: string;
  };
  forwarded?: boolean;
  caption?: string;
  fromUsername?: string; // for forwarded messages
};

export type DMConversation = {
  username: string;       // the other person
  lastMessage: string;
  time: string;
  unread: number;
};

export type CallType = "voice" | "video";

export type CallState =
| "idle"
| "calling" // outgoing - waiting for answer
| "receiving" // incoming - ringing
| "connected" // in call
| "ended";

export type CallInfo = {
  callId: string;
  from: string;
  to: string;
  type: CallType;
  roomId?: string; // for group calls
};

