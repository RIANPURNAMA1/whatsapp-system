// services/socket.ts - Socket.IO Service
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: true,
    });

    socket.on('connect', () => {
      console.log('🔌 Socket.IO terhubung:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket.IO terputus:', reason);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket.IO error:', err.message);
    });
  }

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function joinSession(sessionId: string) {
  getSocket().emit('join:session', sessionId);
}

export function leaveSession(sessionId: string) {
  getSocket().emit('leave:session', sessionId);
}

// export function emitMessage(message: any) {
//   getSocket().emit('message:new', message);
// }

export default { getSocket, disconnectSocket, joinSession, leaveSession };