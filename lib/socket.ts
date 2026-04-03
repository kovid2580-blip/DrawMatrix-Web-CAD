import { io } from "socket.io-client";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ["websocket"],
});

const getStoredValue = (key: string, fallback: string) =>
  typeof window !== "undefined"
    ? window.localStorage.getItem(key) || fallback
    : fallback;

export const USER_ID = getStoredValue(
  "drawmatrix_user_id",
  getStoredValue("drawmatrix_presence_key", "guest")
);

if (typeof window !== "undefined")
  window.localStorage.setItem("cad_user_id", USER_ID);

export const USER_COLOR = getStoredValue("drawmatrix_user_color", "#38bdf8");
export const USER_NAME = getStoredValue("drawmatrix_display_name", "Guest");
