import { useEffect, useCallback } from 'react';
import { getSocket, joinSession } from '../services/socket';
import useStore from '../store/useStore';
import { useSettings } from '../context/SettingsContext';
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
  } = useStore();

  const { settings } = useSettings();

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
    toast.success(`✅ WhatsApp terhubung!`, { icon: '🚀' });
  }, [sessionId, updateSession]);

  const handleNewMessage = useCallback((message: Message) => {
    if (!sessionId) return;

    // 1. Tambah pesan ke jendela chat (Realtime)
    addMessage(message);

    // 2. Update sidebar (Chat Terakhir & Waktu) agar naik ke atas
    updateChat(message.chat_jid, {
      last_message: message.content || '📎 Media',
      last_message_time: message.timestamp,
      last_message_from: message.is_from_me ? 'me' : 'them'
    });

    // 3. Logika Notifikasi & Unread
    const isCurrentChat = selectedChat?.jid === message.chat_jid;
    
    if (!message.is_from_me && !isCurrentChat) {
      incrementUnread(message.chat_jid);
      
      if (settings.desktopNotification && "Notification" in window && Notification.permission === "granted") {
        new Notification("Pesan Baru", {
          body: message.content || "Media",
          icon: "/favicon.ico",
        });
      }

      if (settings.notificationSound) {
        const audio = new Audio("/notification.mp3");
        audio.play().catch(() => {});
      }
    }
  }, [sessionId, addMessage, updateChat, incrementUnread, selectedChat, settings.desktopNotification, settings.notificationSound]);

  const handleMessageStatus = useCallback((data: {
    messageId: string;
    status: string;
    chatJid: string;
  }) => {
    updateMessageStatus(data.messageId, data.status);
  }, [updateMessageStatus]);

  const handleChatUpdate = useCallback(({ chatJid }: { chatJid: string }) => {
    if (!sessionId) return;
    // Jika ada perubahan profil atau nama grup, refresh list chat
    fetchChats(sessionId);
  }, [sessionId, fetchChats]);

  useEffect(() => {
    if (!sessionId) return;

    const socket = getSocket();
    joinSession(sessionId);

    // Listeners
    socket.on(`qr:${sessionId}`, handleQR);
    socket.on('session:update', handleSessionUpdate);
    socket.on(`session:connected:${sessionId}`, handleSessionConnected);
    socket.on(`message:new:${sessionId}`, handleNewMessage);
    socket.on(`message:status:${sessionId}`, handleMessageStatus);
    socket.on(`chat:update:${sessionId}`, handleChatUpdate);

    return () => {
      socket.off(`qr:${sessionId}`);
      socket.off('session:update');
      socket.off(`session:connected:${sessionId}`);
      socket.off(`message:new:${sessionId}`);
      socket.off(`message:status:${sessionId}`);
      socket.off(`chat:update:${sessionId}`);
    };
  }, [sessionId, handleQR, handleSessionUpdate, handleSessionConnected, handleNewMessage, handleMessageStatus, handleChatUpdate]);
}