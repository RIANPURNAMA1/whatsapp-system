import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Search, MoreVertical, Smile, Paperclip,
  Send, X, Reply, ChevronDown, Loader2
} from 'lucide-react';
import useStore from '../store/useStore';
import Avatar from './Avatar';
import {
  getDisplayName, formatMessageTime, formatDateSeparator,
  isDifferentDay, isGroupJid
} from '../utils/helpers';
import { messageApi, chatApi } from '../services/api';
import toast from 'react-hot-toast';

// Jika pakai Socket.io, import di sini:
// import { socket } from '../services/socket'; 

interface ChatWindowProps {
  sessionId: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ sessionId }) => {
  const {
    selectedChat,
    messages,
    isLoadingMessages,
    hasMoreMessages,
    replyTo,
    fetchMessages,
    setReplyTo,
    resetUnread,
    addMessage,
    updateChat
  } = useStore();

  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- 1. REAL-TIME LOGIC ---
  useEffect(() => {
    if (!sessionId || !selectedChat) return;

    /** * OPSI A: Menggunakan Socket.io (Sangat Direkomendasikan)
     * Aktifkan ini jika Backend kamu mengirim emit 'new_message'
     */
    /*
    socket.on('new_message', (data) => {
       if (data.chat_jid === selectedChat.jid) {
         addMessage(data); 
       }
    });
    return () => socket.off('new_message');
    */

    /** * OPSI B: Polling (Cek Database tiap 3 detik)
     * Gunakan ini jika belum ada WebSocket di backend.
     */
    const pollInterval = setInterval(async () => {
      try {
        // Ambil pesan terbaru saja (misal filter by timestamp terakhir)
        // Untuk sederhananya, kita panggil fetchMessages tanpa reset state
        await fetchMessages(sessionId, selectedChat.jid);
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 3000); // 3 detik sekali

    return () => clearInterval(pollInterval);
  }, [sessionId, selectedChat?.jid, fetchMessages]);

  // --- 2. LOAD DATA AWAL SAAT CHAT DIPILIH ---
  useEffect(() => {
    if (selectedChat && sessionId) {
      fetchMessages(sessionId, selectedChat.jid);
      resetUnread(selectedChat.jid);
      chatApi.markRead(sessionId, selectedChat.jid).catch(() => { });
    }
  }, [selectedChat?.jid, sessionId, fetchMessages, resetUnread]);

  // --- 3. SCROLL AUTOMATIC ---
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
      setShowScrollBtn(false);
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0 && !isLoadingMore) {
      const container = messagesContainerRef.current;
      if (container) {
        // Jika user sedang di bawah, otomatis scroll saat pesan masuk
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 400;
        if (isNearBottom) {
          setTimeout(() => scrollToBottom('smooth'), 100);
        }
      }
    }
  }, [messages.length, isLoadingMore, scrollToBottom]);

  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 300);

    // Infinite Scroll (Load More)
    if (scrollTop < 50 && hasMoreMessages && !isLoadingMore && selectedChat) {
      const loadMore = async () => {
        setIsLoadingMore(true);
        const prevHeight = scrollHeight;
        await fetchMessages(sessionId, selectedChat.jid, true);
        setIsLoadingMore(false);
        requestAnimationFrame(() => {
          container.scrollTop = container.scrollHeight - prevHeight;
        });
      };
      loadMore();
    }
  }, [hasMoreMessages, isLoadingMore, selectedChat, sessionId, fetchMessages]);

  // --- 4. KIRIM PESAN ---
  const handleSend = async () => {
    const state = useStore.getState();
    const currentChat = state.selectedChat;
    const currentReplyTo = state.replyTo;

    if (!inputText.trim() || !currentChat || isSending) return;

    const text = inputText.trim();
    const chatJid = currentChat.jid;

    setIsSending(true);
    setInputText(''); 
    setReplyTo(null);

    try {
      const response = await messageApi.sendText(sessionId, chatJid, text, currentReplyTo?.message_id);

      if (response.success) {
        const newMessage = {
          ...response.data,
          chat_jid: chatJid,
          content: text,
          is_from_me: 1, 
          timestamp: new Date().toISOString(),
          status: 'sent'
        };

        addMessage(newMessage); // Update UI Instan
        updateChat(chatJid, {
          last_message: text,
          last_message_time: newMessage.timestamp,
          last_message_from: 'me'
        });

        scrollToBottom('smooth');
      }
    } catch (err) {
      toast.error("Gagal mengirim pesan");
      setInputText(text);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!selectedChat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0B141A]">
        <div className="w-32 h-32 bg-[#202C33] rounded-full flex items-center justify-center shadow-lg mb-6 text-[#25D366]">
          <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
        </div>
        <h2 className="text-[#E9EDEF] text-2xl font-light">WhatsApp Web</h2>
        <p className="text-[#8696A0] text-sm mt-2">Pilih chat untuk memulai pesan</p>
      </div>
    );
  }

  const displayName = getDisplayName(selectedChat);

  return (
    <div className="flex-1 flex flex-col bg-[#0B141A] relative overflow-hidden">
      {/* Header */}
      <div className="bg-[#202C33] px-4 py-2.5 flex items-center gap-3 border-b border-[#111B21] z-10">
        <Avatar name={displayName} imageUrl={selectedChat.profile_pic_url} size="md" isGroup={isGroupJid(selectedChat.jid)} />
        <div className="flex-1 min-w-0">
          <p className="text-[#E9EDEF] font-medium text-sm truncate">{displayName}</p>
          <p className="text-[#8696A0] text-xs truncate">Online</p>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-2 text-[#8696A0] hover:text-white"><Search className="w-5 h-5" /></button>
          <button className="p-2 text-[#8696A0] hover:text-white"><MoreVertical className="w-5 h-5" /></button>
        </div>
      </div>

      {/* Chat Messages */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-1 bg-[#0B141A]"
        style={{
          backgroundImage: `linear-gradient(rgba(11, 20, 26, 0.95), rgba(11, 20, 26, 0.95)), url('/bg-chat.png')`,
          backgroundSize: '400px',
          backgroundRepeat: 'repeat'
        }}
      >
        {isLoadingMessages && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-[#25D366]" /></div>
        ) : (
          messages.map((msg, index) => (
            <React.Fragment key={msg.message_id || index}>
              {(!messages[index - 1] || isDifferentDay(messages[index - 1].timestamp, msg.timestamp)) && (
                <div className="flex justify-center my-4">
                  <span className="bg-[#182229] text-[#8696A0] text-xs px-3 py-1 rounded-full">
                    {formatDateSeparator(msg.timestamp)}
                  </span>
                </div>
              )}
              <MessageBubble
                message={msg}
                showAvatar={isGroupJid(selectedChat.jid) && Number(msg.is_from_me) !== 1}
                onReply={() => setReplyTo(msg)}
              />
            </React.Fragment>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Button Scroll ke Bawah */}
      {showScrollBtn && (
        <button 
          onClick={() => scrollToBottom()} 
          className="absolute bottom-24 right-6 w-10 h-10 bg-[#202C33] rounded-full shadow-lg flex items-center justify-center text-[#8696A0] border border-[#2A3942] z-10 hover:text-white"
        >
          <ChevronDown className="w-6 h-6" />
        </button>
      )}

      {/* Input Area */}
      <div className="bg-[#202C33] flex flex-col border-t border-[#111B21]">
        {replyTo && (
          <div className="px-4 py-2 flex items-center gap-3 bg-[#1e272d] border-l-4 border-[#25D366]">
            <div className="flex-1 truncate">
              <p className="text-[#25D366] text-xs font-bold">{Number(replyTo.is_from_me) === 1 ? 'Anda' : replyTo.sender_name}</p>
              <p className="text-[#8696A0] text-xs truncate">{replyTo.content}</p>
            </div>
            <button onClick={() => setReplyTo(null)}><X className="w-4 h-4 text-[#8696A0]" /></button>
          </div>
        )}

        <div className="px-3 py-2.5 flex items-end gap-2">
          <button className="p-2 text-[#8696A0] hover:text-white"><Smile /></button>
          <button className="p-2 text-[#8696A0] hover:text-white" onClick={() => fileInputRef.current?.click()}><Paperclip /></button>
          <input ref={fileInputRef} type="file" className="hidden" />

          <div className="flex-1 bg-[#2A3942] rounded-xl overflow-hidden">
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ketik pesan"
              className="w-full bg-transparent text-[#E9EDEF] px-4 py-3 outline-none resize-none text-sm min-h-[44px]"
              rows={1}
            />
          </div>

          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isSending}
            className="w-10 h-10 bg-[#00A884] rounded-full flex items-center justify-center text-white hover:bg-[#00BD96] disabled:opacity-50 transition-all"
          >
            {isSending ? <Loader2 className="animate-spin w-5 h-5" /> : <Send className="w-5 h-5 ml-0.5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

const MessageBubble = ({ message, showAvatar, onReply }: any) => {
  const isFromMe = Number(message.is_from_me) === 1;
  return (
    <div className={`flex items-end gap-2 mb-1 ${isFromMe ? 'justify-end' : 'justify-start'}`}>
      {showAvatar && <Avatar name={message.sender_name} size="sm" />}
      <div className={`group relative max-w-[75%] px-2 py-1.5 rounded-lg shadow-sm ${
        isFromMe ? 'bg-[#005C4B] rounded-tr-none' : 'bg-[#202C33] rounded-tl-none'
      }`}>
        <button onClick={onReply} className="absolute top-1 right-1 p-1 bg-[#202C33] rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <Reply className="w-3 h-3 text-[#8696A0]" />
        </button>
        {message.quoted_content && (
          <div className="bg-[rgba(0,0,0,0.2)] border-l-4 border-[#25D366] p-2 rounded mb-1 text-xs">
            <p className="text-[#25D366] font-bold">Dikutip</p>
            <p className="text-[#8696A0] line-clamp-2 italic">{message.quoted_content}</p>
          </div>
        )}
        <p className="text-[#E9EDEF] text-[14.2px] leading-relaxed whitespace-pre-wrap break-words px-1">
          {message.content}
        </p>
        <div className="flex items-center justify-end gap-1.5 mt-0.5 h-4">
          <span className="text-[#8696A0] text-[10px] tabular-nums">{formatMessageTime(message.timestamp)}</span>
          {isFromMe && (
            <span className={`text-[10px] ${message.status === 'read' ? 'text-[#53BDEB]' : 'text-[#8696A0]'}`}>
              {message.status === 'read' ? '✓✓' : '✓'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};