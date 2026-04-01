import { io } from "socket.io-client";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ["websocket"],
});

export const USER_ID =
  typeof window !== "undefined"
    ? window.localStorage.getItem("cad_user_id") ||
      Math.random().toString(36).substr(2, 9)
    : "guest";

if (typeof window !== "undefined")
  window.localStorage.setItem("cad_user_id", USER_ID);

export const USER_COLOR = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
export const USER_NAME = `Architect_${Math.floor(Math.random() * 1000)}`;
