import { io } from "socket.io-client";

// Same domain in production, localhost in development
const SOCKET_URL = import.meta.env.DEV ? import.meta.env.VITE_SOCKET_URL : "/";

const socket = io(SOCKET_URL);

export default socket;
