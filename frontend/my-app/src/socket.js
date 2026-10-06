import { io } from "socket.io-client";

// Singleton socket connection to backend
export const socket = io("http://localhost:9000", {
  withCredentials: true,
  autoConnect: true,
  transports: ["websocket", "polling"],
});

export default socket;
