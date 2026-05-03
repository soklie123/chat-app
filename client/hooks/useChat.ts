import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { ChatMessage, TypingUser } from "../types/chat";

const SOCKET_URL = "http://localhost:4000";
const DEFAULT_ROOM = "general";

export const getAvatarColor = (name: string): string => {
  const colors = [
    "#f44336", "#e91e63", "#9c27b0",
    "#3f51b5", "#03a9f4", "#009688", "#ff9800",
  ];
  if (!name) return colors[0];
  let hash = 0;
  name = name.toLowerCase();
  for (const char of name) {
    hash = char.codePointAt(0)! + ((hash << 5) - hash);
    hash = hash & hash;
  }
  return colors[Math.abs(hash) % colors.length];
};

export function useChat(username: string) {
  const socketRef = useRef<Socket | null>(null);

  const [connected, setConnected]     = useState(false);
  const [messages, setMessages]       = useState<ChatMessage[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [typingUser, setTypingUser]   = useState<TypingUser | null>(null);
  const [currentRoom, setCurrentRoom] = useState(DEFAULT_ROOM);
  const [rooms, setRooms] = useState<{ id: string; name: string; memberCount: number}[]>([]);
  // Add this state near the top with other states
  const [socket, setSocket] = useState<Socket | null>(null);

  

  useEffect(() => {
    // Only connect once username is set
    if (!username) return;

    const socket = io(SOCKET_URL, {
  timeout: 5000,
  reconnectionAttempts: 3,
    });
    socketRef.current = socket;
    // setSocket(socket);

    socket.on("connect", () => {
      setConnected(true);
      setSocket(socket); // inside callback

      // Register user then join default room
      socket.emit("register_user", username);
      socket.emit("join_room", DEFAULT_ROOM);
      setCurrentRoom(DEFAULT_ROOM);
    });

    socket.on("disconnect", () => setConnected(false));

    socket.on("online_users", (users: string[]) => setOnlineUsers(users));

    // Load history sent after joining room
  socket.on("chat_history", ({ messages: history }: {
    messages: Array<{
      _id: string;        
      text: string;
      username: string;
      time?: string;
      createdAt?: string;
      reactions?: { emoji: string; count: number; usernames: string[] }[]; 
      // 
      fileUrl?: string;
      fileName?: string;
      fileType?: string;
      isImage?: boolean;
    }>;
    hasMore: boolean;
  }) => {
    setMessages(
      history.map((m) => ({
        _id:      m._id,           
        text:     m.text,
        fromSelf: m.username === username,
        time:     m.time ?? new Date(m.createdAt ?? "").toLocaleTimeString([], {
          hour: "2-digit", minute: "2-digit",
        }),
        username:  m.username,
        color:     getAvatarColor(m.username),
        reactions: m.reactions ?? [], 
        fileUrl: m.fileUrl,
        fileName: m.fileName,
        fileType: m.fileType,
        isImage: m.isImage,
        audioUrl:      m.audioUrl,
        audioDuration: m.audioDuration,
      }))
    );
  });

    // Reaction updated by anyone in the room
    socket.on("message_reaction_updated", ({ messageId, reactions}) => {
      setMessages((prev) =>
      prev.map((msg) =>
        msg._id === messageId ? { ...msg, reactions } : msg
        )
      );
    })

    // Now receives full shape from backend
    socket.on("receive_message", (data: { 
      _id: string;
      text: string; 
      username: string; 
      time: string; 
      fileUrl?:  string;  //  add
      fileName?: string;  //  add
      fileType?: string;  //  add
      isImage?:  boolean; //  add
      audioUrl?: string;    //  add
      audioDuration?: number; //  add
    }) => {
      setMessages((prev) => [
        ...prev,
        {
          _id: data._id,
          text:     data.text,
          fromSelf: data.username === username,
          time:     data.time,
          username: data.username,
          color:    getAvatarColor(data.username),
          reactions: [], //  reactions will be populated when we implement that feature
          fileUrl:  data.fileUrl,  //  add
          fileName: data.fileName, //  add
          fileType: data.fileType, //  add
          isImage:  data.isImage,  //  add
          audioUrl: data.audioUrl,   //  add
          audioDuration: data.audioDuration, //  add
        },
      ]);
    });

    // Typing now receives plain string (backend emits username string)
    socket.on("user_typing", (name: string) =>
      setTypingUser({ name, color: getAvatarColor(name) })
    );
    socket.on("user_stop_typing", () => setTypingUser(null));

// =======================================================================
    socket.on("room_list", (roomList) => setRooms(roomList));
    socket.on("room_created", (roomId: string) => {
      socket.emit("join_room", roomId);
      setCurrentRoom(roomId);
      setMessages([]);
    });
    socket.on("room_exists", (roomId: string) => {
      alert(`Room "${roomId}" already exists!`);
    })
// =======================================================================
    return () => {
      socket.emit("unregister_user");
      socket.disconnect();
      setSocket(null);
    };
  }, [username]); //  Re-run if username changes

  const sendMessage = (
    text: string, 
    file?: {
      fileUrl: string;
      fileName: string;
      fileType: string;
      isImage: boolean;
    },
    audio?: { audioUrl: string; audioDuration: number}
  ) => {

    if (!text.trim() && !file && !audio) return;
    if (!socketRef.current) return;

    //  Include roomId in payload
    socketRef.current.emit("send_message", { 
      text, 
      username, 
      roomId: currentRoom,
    ...file, // spreads fileUrl, fileName, fileType, isImage if present
    ...audio, // spreads audioUrl and audioDuration if present
    });
    socketRef.current.emit("stop_typing", currentRoom); //  pass roomId
  };

  const emitTyping = (value: string) => {
    if (!socketRef.current) return;
    if (value.length > 0) {
      //  Send object with username + roomId
      socketRef.current.emit("typing", { username, roomId: currentRoom });
    } else {
      socketRef.current.emit("stop_typing", currentRoom); //  pass roomId
    }
  };

  const joinRoom = (roomId: string) => {
    if (!socketRef.current) return;
    socketRef.current.emit("join_room", roomId);
    setCurrentRoom(roomId);
    setMessages([]); // clear messages while history loads
  };

  const createRoom = (roomName: string) => {
    if (!socketRef.current) return;
    socketRef.current.emit("create_room", roomName);
  };

  const addReaction = (messageId: string, emoji: string, roomId: string) => {
    if (!socketRef.current) return;
    socketRef.current.emit("add_reaction", { messageId, emoji, username, roomId});
  }

  const logout = () => {
    if (socketRef.current) {
      socketRef.current.emit("unregister_user");
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setMessages([]);
    setOnlineUsers([]);
    setTypingUser(null);
    setConnected(false);
  };

  return {
    socket,
    connected,
    messages,
    onlineUsers,
    typingUser,
    currentRoom,

    rooms, //

    sendMessage,
    emitTyping,
    joinRoom,

    createRoom, //
    addReaction, //
    logout,
  };
}