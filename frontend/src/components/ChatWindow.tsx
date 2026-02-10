// components/ChatWindow.tsx - Jendela Chat Utama
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Phone, Video, Search, MoreVertical, Smile, Paperclip,
  Mic, Send, X, Reply, Trash2, ChevronDown, Loader2,
  Image as ImageIcon, FileText, Download, MapPin, AlertCircle
} from 'lucide-react';
import useStore from '../store/useStore';
import Avatar from './Avatar';
import {
  getDisplayName, formatMessageTime, formatDateSeparator,
  isDifferentDay, isGroupJid, formatMessagePreview
} from '../utils/helpers';
import { messageApi, chatApi } from '../services/api';
import type { Message } from '../types';
import toast from 'react-hot-toast';

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
  } = useStore();

  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [selectedMsgs, setSelectedMsgs] = useState<string[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load messages saat chat dipilih
  useEffect(() => {
    if (selectedChat && sessionId) {
      fetchMessages(sessionId, selectedChat.jid);
      resetUnread(selectedChat.jid);
      chatApi.markRead(sessionId, selectedChat.jid).catch(() => {});
    }
  }, [selectedChat?.jid, sessionId]);

  // Scroll ke bawah saat ada pesan baru
  useEffect(() => {
    if (messages.length > 0) {
      const container = messagesContainerRef.current;
      if (container) {
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 200;
        if (isNearBottom) scrollToBottom();
      }
    }
  }, [messages.length]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollBtn(false);
  }, []);

  // Deteksi scroll untuk tombol scroll-to-bottom
  const handleScroll = useCallback(async () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;

    // Tampilkan tombol scroll jika jauh dari bawah
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 300);

    // Load lebih banyak pesan saat scroll ke atas
    if (scrollTop < 50 && hasMoreMessages && !isLoadingMore && selectedChat) {
      setIsLoadingMore(true);
      const prevScrollHeight = scrollHeight;
      await fetchMessages(sessionId, selectedChat.jid, true);
      setIsLoadingMore(false);

      // Pertahankan posisi scroll setelah load
      requestAnimationFrame(() => {
        const newScrollHeight = container.scrollHeight;
        container.scrollTop = newScrollHeight - prevScrollHeight;
      });
    }
  }, [hasMoreMessages, isLoadingMore, selectedChat, sessionId, fetchMessages]);

  // Send pesan teks
  const handleSend = async () => {
    if (!inputText.trim() || !selectedChat || isSending) return;

    const text = inputText.trim();
    setInputText('');
    setIsSending(true);

    try {
      await messageApi.sendText(
        sessionId,
        selectedChat.jid,
        text,
        replyTo?.message_id
      );
      setReplyTo(null);
      scrollToBottom();
    } catch (err: any) {
      toast.error(`Gagal kirim: ${err.message}`);
      setInputText(text); // Kembalikan text jika gagal
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  // Handle file attachment
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedChat) return;

    setIsSending(true);
    try {
      await messageApi.sendMedia(sessionId, selectedChat.jid, file, '');
      toast.success('Media berhasil dikirim');
    } catch (err: any) {
      toast.error(`Gagal kirim media: ${err.message}`);
    } finally {
      setIsSending(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!selectedChat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0B141A] gap-6">
        <div className="relative">
          <div className="w-32 h-32 bg-[#202C33] rounded-full flex items-center justify-center shadow-lg">
            <svg className="w-16 h-16 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#25D366] rounded-full flex items-center justify-center">
            <span className="text-white text-xs">✓</span>
          </div>
        </div>
        <div className="text-center max-w-sm">
          <h2 className="text-[#E9EDEF] text-2xl font-light mb-2">WhatsApp Web</h2>
          <p className="text-[#8696A0] text-sm leading-relaxed">
            Pilih chat untuk mulai percakapan.<br />
            Kirim dan terima pesan langsung dari browser.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[#8696A0] text-xs">
          <div className="w-1.5 h-1.5 bg-[#25D366] rounded-full animate-pulse" />
          <span>End-to-end encrypted</span>
        </div>
      </div>
    );
  }

  const displayName = getDisplayName(selectedChat);
  const isGroup = isGroupJid(selectedChat.jid);

  return (
    <div className="flex-1 flex flex-col bg-[#0B141A] relative overflow-hidden">
      {/* Chat Header */}
      <div className="bg-[#202C33] px-4 py-2.5 flex items-center gap-3 border-b border-[#111B21] flex-shrink-0 z-10">
        <Avatar
          name={displayName}
          imageUrl={selectedChat.profile_pic_url}
          size="md"
          isGroup={isGroup}
          className="cursor-pointer"
        />
        <div className="flex-1 min-w-0">
          <p className="text-[#E9EDEF] font-medium text-sm truncate">{displayName}</p>
          <p className="text-[#8696A0] text-xs truncate">
            {isGroup ? 'Grup WhatsApp' : selectedChat.jid.split('@')[0]}
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button className="p-2 text-[#8696A0] hover:text-white hover:bg-[#2A3942] rounded-full transition-all">
            <Search className="w-4.5 h-4.5" />
          </button>
          <button className="p-2 text-[#8696A0] hover:text-white hover:bg-[#2A3942] rounded-full transition-all">
            <MoreVertical className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* Messages Area - Background Pattern WhatsApp */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-1"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='400' height='400' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='p' x='0' y='0' width='400' height='400' patternUnits='userSpaceOnUse'%3E%3Cpath d='M50 50c0-5.5 4.5-10 10-10S70 44.5 70 50 65.5 60 60 60 50 55.5 50 50z' fill='none' stroke='%23ffffff' stroke-width='1' opacity='0.03'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='400' height='400' fill='url(%23p)'/%3E%3C/svg%3E")`,
          backgroundColor: '#0B141A',
        }}
      >
        {/* Load More */}
        {isLoadingMore && (
          <div className="flex justify-center py-2">
            <Loader2 className="w-5 h-5 text-[#25D366] animate-spin" />
          </div>
        )}

        {isLoadingMessages && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full gap-3">
            <Loader2 className="w-6 h-6 text-[#25D366] animate-spin" />
            <span className="text-[#8696A0] text-sm">Memuat pesan...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <AlertCircle className="w-10 h-10 text-[#8696A0]" />
            <p className="text-[#8696A0] text-sm">Belum ada pesan. Mulai percakapan!</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const prevMsg = index > 0 ? messages[index - 1] : null;
            const showDateSep = !prevMsg || isDifferentDay(prevMsg.timestamp, msg.timestamp);
            const showAvatar = isGroup && !msg.is_from_me;

            return (
              <React.Fragment key={msg.message_id}>
                {showDateSep && (
                  <div className="flex justify-center my-4">
                    <span className="bg-[#182229] text-[#8696A0] text-xs px-3 py-1 rounded-full shadow-sm">
                      {formatDateSeparator(msg.timestamp)}
                    </span>
                  </div>
                )}
                <MessageBubble
                  message={msg}
                  showAvatar={showAvatar}
                  onReply={() => setReplyTo(msg)}
                />
              </React.Fragment>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to Bottom Button */}
      {showScrollBtn && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-24 right-6 w-10 h-10 bg-[#202C33] hover:bg-[#2A3942] rounded-full shadow-lg flex items-center justify-center text-[#8696A0] hover:text-white transition-all border border-[#2A3942] z-10"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      )}

      {/* Reply Preview */}
      {replyTo && (
        <div className="bg-[#202C33] px-4 py-2 flex items-center gap-3 border-t border-[#2A3942] flex-shrink-0">
          <div className="w-1 h-10 bg-[#25D366] rounded-full flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[#25D366] text-xs font-semibold">
              {replyTo.is_from_me ? 'Anda' : (replyTo.sender_name || 'Pengirim')}
            </p>
            <p className="text-[#8696A0] text-xs truncate">
              {replyTo.content || formatMessagePreview(replyTo.message_type, replyTo.content)}
            </p>
          </div>
          <button onClick={() => setReplyTo(null)} className="text-[#8696A0] hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-[#202C33] px-3 py-2.5 flex items-end gap-2 flex-shrink-0 border-t border-[#111B21]">
        {/* Emoji */}
        <button
          className="p-2 text-[#8696A0] hover:text-white transition-colors flex-shrink-0 mb-0.5"
          title="Emoji"
        >
          <Smile className="w-5 h-5" />
        </button>

        {/* File Attachment */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-[#8696A0] hover:text-white transition-colors flex-shrink-0 mb-0.5"
          title="Lampirkan file"
        >
          <Paperclip className="w-5 h-5" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx"
          onChange={handleFileSelect}
        />

        {/* Text Input */}
        <div className="flex-1 bg-[#2A3942] rounded-xl overflow-hidden">
          <textarea
            ref={inputRef}
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ketik pesan"
            rows={1}
            className="w-full bg-transparent text-[#E9EDEF] placeholder-[#8696A0] px-4 py-3 outline-none resize-none text-sm leading-relaxed"
            style={{ maxHeight: '120px' }}
          />
        </div>

        {/* Send / Mic Button */}
        {inputText.trim() ? (
          <button
            onClick={handleSend}
            disabled={isSending}
            className="w-10 h-10 bg-[#00A884] hover:bg-[#00BD96] disabled:opacity-50 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-95 shadow-sm"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : (
              <Send className="w-5 h-5 text-white ml-0.5" />
            )}
          </button>
        ) : (
          <button
            className="w-10 h-10 bg-[#00A884] hover:bg-[#00BD96] rounded-full flex items-center justify-center flex-shrink-0 transition-all"
            title="Rekam pesan suara"
          >
            <Mic className="w-5 h-5 text-white" />
          </button>
        )}
      </div>
    </div>
  );
};

// ============================================================
// Message Bubble Component
// ============================================================
interface MessageBubbleProps {
  message: Message;
  showAvatar: boolean;
  onReply: () => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, showAvatar, onReply }) => {
  const isFromMe = message.is_from_me === 1;
  const [showActions, setShowActions] = useState(false);

  const renderContent = () => {
    if (message.is_deleted) {
      return (
        <span className="italic text-[#8696A0] text-sm flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5" />
          Pesan telah dihapus
        </span>
      );
    }

    switch (message.message_type) {
      case 'text':
        return (
          <p className="text-[#E9EDEF] text-sm leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </p>
        );
      case 'image':
        return (
          <div className="space-y-1">
            <div className="bg-[#1E2A30] rounded-lg h-32 flex items-center justify-center w-48">
              <ImageIcon className="w-8 h-8 text-[#8696A0]" />
            </div>
            {message.caption && (
              <p className="text-[#E9EDEF] text-sm mt-1">{message.caption}</p>
            )}
          </div>
        );
      case 'document':
        return (
          <div className="flex items-center gap-3 bg-[#1E2A30] rounded-lg p-3 min-w-[200px]">
            <FileText className="w-8 h-8 text-[#25D366] flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[#E9EDEF] text-xs font-medium truncate">{message.content}</p>
              <p className="text-[#8696A0] text-[10px]">Dokumen</p>
            </div>
            <Download className="w-4 h-4 text-[#8696A0] flex-shrink-0" />
          </div>
        );
      case 'audio':
        return (
          <div className="flex items-center gap-2 min-w-[200px]">
            <Mic className="w-5 h-5 text-[#25D366]" />
            <div className="flex-1 h-8 bg-[#1E2A30] rounded-full overflow-hidden relative">
              <div className="absolute inset-y-0 left-0 bg-[#25D366] w-1/3 rounded-full opacity-60" />
              <div className="absolute inset-0 flex items-center justify-center gap-0.5">
                {[...Array(15)].map((_, i) => (
                  <div key={i} className="w-0.5 bg-[#8696A0] rounded-full opacity-50"
                    style={{ height: `${20 + Math.sin(i) * 15}%` }} />
                ))}
              </div>
            </div>
            <span className="text-[#8696A0] text-xs">0:00</span>
          </div>
        );
      case 'location':
        return (
          <div className="flex items-center gap-2 text-[#E9EDEF] text-sm">
            <MapPin className="w-4 h-4 text-[#25D366]" />
            <span>{message.content}</span>
          </div>
        );
      default:
        return (
          <p className="text-[#8696A0] text-sm italic">
            {formatMessagePreview(message.message_type, message.content)}
          </p>
        );
    }
  };

  return (
    <div
      className={`flex items-end gap-2 animate-fade-in group ${isFromMe ? 'justify-end' : 'justify-start'}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar (untuk grup / pesan orang lain) */}
      {showAvatar && (
        <Avatar name={message.sender_name || '?'} size="sm" className="mb-1 flex-shrink-0" />
      )}
      {!showAvatar && !isFromMe && <div className="w-8 flex-shrink-0" />}

      {/* Action buttons (hover) */}
      {showActions && (
        <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mb-1 ${isFromMe ? 'order-first' : 'order-last'}`}>
          <button
            onClick={onReply}
            className="p-1 text-[#8696A0] hover:text-white bg-[#202C33] rounded-full hover:bg-[#2A3942] transition-all"
            title="Balas"
          >
            <Reply className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Message Bubble */}
      <div
        className={`
          max-w-[70%] lg:max-w-[60%] rounded-xl px-3 py-2 shadow-message relative
          ${isFromMe
            ? 'bg-[#005C4B] rounded-br-sm'
            : 'bg-[#202C33] rounded-bl-sm'
          }
        `}
      >
        {/* Sender name (grup) */}
        {showAvatar && message.sender_name && (
          <p className="text-[#25D366] text-xs font-semibold mb-1">{message.sender_name}</p>
        )}

        {/* Quoted message */}
        {message.quoted_content && (
          <div className={`
            mb-2 pl-2 border-l-2 border-[#25D366] bg-black/20 rounded-r py-1 pr-2
          `}>
            <p className="text-[#25D366] text-xs font-medium">Pesan dikutip</p>
            <p className="text-[#8696A0] text-xs truncate">{message.quoted_content}</p>
          </div>
        )}

        {/* Message Content */}
        {renderContent()}

        {/* Timestamp & Status */}
        <div className={`flex items-center gap-1 mt-1 ${isFromMe ? 'justify-end' : 'justify-end'}`}>
          <span className="text-[#8696A0] text-[10px]">
            {formatMessageTime(message.timestamp)}
          </span>
          {isFromMe && (
            <span className={`text-[10px] font-bold ${
              message.status === 'read' ? 'text-[#53BDEB]' : 'text-[#8696A0]'
            }`}>
              {message.status === 'pending' ? '⏳' :
               message.status === 'sent' ? '✓' :
               message.status === 'delivered' ? '✓✓' :
               message.status === 'read' ? '✓✓' :
               message.status === 'failed' ? '⚠' : '✓'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;