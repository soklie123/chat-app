import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { getToken } from "../lib/api";

const SOCKET_URL = "http://localhost:4000";

export const getAvatarColor = (name: string): string => {
  const colors = [
    "#f44736", "#e91e63", "#9c27b0",
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

export type RoomSummary = {
  id: string;
  name: string;
  memberCount: number;
  members: string[];
  createdBy: string;
  // ── client-tracked, not from server room_list ──
  unread: number;
  lastMessage?: string;
  lastMessageFrom?: string;
  lastMessageTime?: string;
};

export function useChat(username: string) {
  const socketRef = useRef<Socket | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [allUsers, setAllUsers] = useState<string[]>([]);
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [authError, setAuthError] = useState<string | null>(null);

  // Keep a ref mirror so socket event handlers always see fresh room state
  // without needing to be re-registered on every rooms change.
  const roomsRef = useRef<RoomSummary[]>([]);
  useEffect(() => {
    roomsRef.current = rooms;
  }, [rooms]);

  useEffect(() => {
    if (!username) return;

    const token = getToken();

    if (!token) {
      const id = setTimeout(() => {
        setAuthError("No session found. Please log in again.");
      }, 0);
      return () => clearTimeout(id);
    }

    const sock = io(SOCKET_URL, {
      timeout: 5000,
      reconnectionAttempts: 3,
      auth: { token },
    });
    socketRef.current = sock;

    sock.on("connect", () => {
      setConnected(true);
      setSocket(sock);
      setAuthError(null);
      sock.emit("register_user");
    });

    sock.on("connect_error", (err) => {
      setConnected(false);
      setAuthError(err.message || "Connection failed.");
    });

    sock.on("disconnect", () => setConnected(false));
    sock.on("online_users", (users: string[]) => setOnlineUsers(users));
    sock.on("all_users", (users: string[]) => setAllUsers(users));

    // Merge server room_list with locally-tracked unread/lastMessage state,
    // so a fresh broadcast (e.g. someone else joins) doesn't wipe badges.
    sock.on("room_list", (roomList: Omit<RoomSummary, "unread" | "lastMessage" | "lastMessageFrom" | "lastMessageTime">[]) => {
      setRooms((prev) => {
        const prevById = new Map(prev.map((r) => [r.id, r]));
        return roomList.map((r) => {
          const existing = prevById.get(r.id);
          return {
            ...r,
            unread: existing?.unread ?? 0,
            lastMessage: existing?.lastMessage,
            lastMessageFrom: existing?.lastMessageFrom,
            lastMessageTime: existing?.lastMessageTime,
          };
        });
      });
    });

    return () => {
      sock.emit("unregister_user");
      sock.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, [username]);

  const createRoom = (roomName: string) => {
    socketRef.current?.emit("create_room", roomName);
  };

  // ── Called by useRoom when a message arrives for a room that ISN'T open ──
  const bumpRoomUnread = useCallback((roomId: string, lastMessage: string, from: string, time: string) => {
    setRooms((prev) =>
      prev.map((r) =>
        r.id === roomId
          ? { ...r, unread: r.unread + 1, lastMessage, lastMessageFrom: from, lastMessageTime: time }
          : r
      )
    );
  }, []);

  // ── Called by useRoom whenever a room IS open, to keep preview text fresh without bumping unread ──
  const setRoomPreview = useCallback((roomId: string, lastMessage: string, from: string, time: string) => {
    setRooms((prev) =>
      prev.map((r) =>
        r.id === roomId ? { ...r, lastMessage, lastMessageFrom: from, lastMessageTime: time } : r
      )
    );
  }, []);

  // ── Called by useRoom.openRoom to clear the badge ──
  const clearRoomUnread = useCallback((roomId: string) => {
    setRooms((prev) =>
      prev.map((r) => (r.id === roomId ? { ...r, unread: 0 } : r))
    );
  }, []);

  const logout = () => {
    if (socketRef.current) {
      socketRef.current.emit("unregister_user");
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setOnlineUsers([]);
    setAllUsers([]);
    setConnected(false);
    setSocket(null);
  };

  return {
    socket,
    connected,
    onlineUsers,
    allUsers,
    rooms,
    createRoom,
    logout,
    authError,
    bumpRoomUnread,
    setRoomPreview,
    clearRoomUnread,
  };
}