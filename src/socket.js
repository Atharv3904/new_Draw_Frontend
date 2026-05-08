import { io } from "socket.io-client";

const LOCAL_SOCKET_URL = "http://localhost:4990";
const PRODUCTION_SOCKET_URL = "https://new-draw-backend.onrender.com";

const isLocalHost =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

const socketUrl = isLocalHost
  ? LOCAL_SOCKET_URL
  : import.meta.env.VITE_SOCKET_URL || PRODUCTION_SOCKET_URL;

export const socket = io(socketUrl, {
  transports: ["websocket", "polling"],
});
