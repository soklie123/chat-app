export type Reaction = {
  emoji: string;
  count: number;
  usernames: string[];
}

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

