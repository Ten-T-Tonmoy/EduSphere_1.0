import { io } from "socket.io-client";

const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
const socket = io(baseUrl, {
  autoConnect: true,
  reconnection: true,
});

export default socket;
