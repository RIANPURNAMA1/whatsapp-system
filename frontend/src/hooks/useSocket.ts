// hooks/useSocket.ts - Socket.IO Real-time Hook
import { useEffect, useCallback } from 'react';
import { getSocket, joinSession } from '../services/socket';
import useStore from '../store/useStore';
import type { Message, Session } from '../types';
import toast from 'react-hot-toast';

export function useSocket(sessionId: string | null) {
  const {
    updateSession,
    addMessage,
    updateChat,
    incrementUnread,
    updateMessageStatus,
    selectedChat,
    fetchChats,
    resetUnread,
  } = useStore();

  const handleQR = useCallback((data: { qr: string }) => {
    if (!sessionId) return;
    updateSession({ id: sessionId, qr_code: data.qr, status: 'connecting' });
  }, [sessionId, updateSession]);

  const handleSessionUpdate = useCallback((session: Session) => {
    updateSession(session);
  }, [updateSession]);

  const handleSessionConnected = useCallback((data: { phoneNumber: string }) => {
    if (!sessionId) return;
    updateSession({
      id: sessionId,
      status: 'connected',
      phone_number: data.phoneNumber,
      qr_code: null,
    });
    toast.success(`✅ WhatsApp terhubung! Nomor: ${data.phoneNumber}`);
  }, [sessionId, updateSession]);

  const handleNewMessage = useCallback((message: Message) => {
    if (!sessionId) return;

    // Tambah ke daftar pesan jika chat terbuka
    addMessage(message);

    // Update info chat terakhir
    if (fetchChats) fetchChats(sessionId);

    // Tambah unread jika bukan pesan sendiri & chat tidak sedang dibuka
    if (!message.is_from_me && message.chat_jid !== selectedChat?.jid) {
      incrementUnread(message.chat_jid);

      // Notifikasi
      const senderName = message.sender_name || message.from_jid?.split('@')[0];
      const preview = message.content?.substring(0, 50) || '📎 Media';
      toast(`💬 ${senderName}: ${preview}`, {
        duration: 3000,
        icon: '📱',
        style: {
          background: '#128C7E',
          color: '#fff',
          borderRadius: '8px',
        },
      });
    }
  }, [sessionId, addMessage, incrementUnread, selectedChat, fetchChats]);

  const handleMessageStatus = useCallback((data: {
    messageId: string;
    status: string;
    chatJid: string;
  }) => {
    updateMessageStatus(data.messageId, data.status);
  }, [updateMessageStatus]);

  const handleChatUpdate = useCallback(({ chatJid }: { chatJid: string }) => {
    if (!sessionId) return;
    // Refresh list chat
    fetchChats(sessionId);
  }, [sessionId, fetchChats]);

  useEffect(() => {
    if (!sessionId) return;

    const socket = getSocket();
    joinSession(sessionId);

    // Register semua event listeners
    socket.on(`qr:${sessionId}`, handleQR);
    socket.on('session:update', handleSessionUpdate);
    socket.on(`session:connected:${sessionId}`, handleSessionConnected);
    socket.on(`message:new:${sessionId}`, handleNewMessage);
    socket.on(`message:status:${sessionId}`, handleMessageStatus);
    socket.on(`chat:update:${sessionId}`, handleChatUpdate);

    return () => {
      // Cleanup event listeners
      socket.off(`qr:${sessionId}`, handleQR);
      socket.off('session:update', handleSessionUpdate);
      socket.off(`session:connected:${sessionId}`, handleSessionConnected);
      socket.off(`message:new:${sessionId}`, handleNewMessage);
      socket.off(`message:status:${sessionId}`, handleMessageStatus);
      socket.off(`chat:update:${sessionId}`, handleChatUpdate);
    };
  }, [
    sessionId,
    handleQR,
    handleSessionUpdate,
    handleSessionConnected,
    handleNewMessage,
    handleMessageStatus,
    handleChatUpdate,
  ]);
}