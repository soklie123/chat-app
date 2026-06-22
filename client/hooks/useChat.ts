import { useEffect, useRef, useState } from "react";
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
};

export function useChat(username: string) {
  const socketRef = useRef<Socket | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [allUsers, setAllUsers] = useState<string[]>([]);
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [authError, setAuthError] = useState<string | null>(null);

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
      sock.emit("register_user"); // ← just emit, no username needed (server reads from JWT)
    });

    sock.on("connect_error", (err) => {
      setConnected(false);
      setAuthError(err.message || "Connection failed.");
    });

    sock.on("disconnect", () => setConnected(false));
    sock.on("online_users", (users: string[]) => setOnlineUsers(users));
    sock.on("all_users", (users: string[]) => setAllUsers(users));
    sock.on("room_list", (roomList: RoomSummary[]) => setRooms(roomList));

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
  };
}