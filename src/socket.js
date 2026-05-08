import { io } from "socket.io-client";

const isLocalHost =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

const socketUrl = isLocalHost
  ? "http://localhost:4990"
  : import.meta.env.VITE_SOCKET_URL;

export const socket = io(socketUrl, {
  transports: ["websocket", "polling"],
});
