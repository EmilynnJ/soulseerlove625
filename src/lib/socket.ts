// src/lib/socket.ts
// Socket.IO client utility for SoulSeer
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket: Socket | null = null;

export function getSocket(userId: string) {
  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: { userId },
      withCredentials: true,
    });
  }
  return socket;
}

export function joinChatRoom(sessionId: string) {
  if (!socket) return;
  socket.emit('join-chat', { sessionId });
}

export function sendMessage(sessionId: string, message: string) {
  if (!socket) return;
  socket.emit('chat-message', { sessionId, message });
}

export function onMessage(cb: (msg: any) => void) {
  if (!socket) return;
  socket.on('chat-message', cb);
}

export function offMessage(cb: (msg: any) => void) {
  if (!socket) return;
  socket.off('chat-message', cb);
}
