import React, { useEffect, useRef, useState, useCallback } from "react";
import { useSettings } from "../context/SettingsContext";
import {
  Search,
  MoreVertical,
  Smile,
  Paperclip,
  Send,
  X,
  Reply,
  ChevronDown,
  Loader2,
  ArrowLeft,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import useStore from "../store/useStore";
import Avatar from "./Avatar";
import {
  getDisplayName,
  formatMessageTime,
  formatDateSeparator,
  isDifferentDay,
  isGroupJid,
} from "../utils/helpers";
import { messageApi, chatApi } from "../services/api";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { getSocket } from "../services/socket";

interface ChatWindowProps {
  sessionId: string;
  onBack?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  sessionId,
  onBack,
}) => {
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
    updateChat,
  } = useStore();

  const { settings } = useSettings();

  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewCaption, setPreviewCaption] = useState("");

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
      setShowScrollBtn(false);
      setIsNearBottom(true);
    }
  }, []);

  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    setShowScrollBtn(distanceFromBottom > 300);
    setIsNearBottom(distanceFromBottom < 50);

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

  useEffect(() => {
    if (!sessionId || !selectedChat) return;
    
    const fetchAndScroll = async () => {
      try {
        await fetchMessages(sessionId, selectedChat.jid);
        if (isNearBottom) {
          setTimeout(() => scrollToBottom("smooth"), 100);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    };
    
    fetchAndScroll();
    
    const pollMs = settings.autoRefresh ? 2000 : parseInt(settings.refreshInterval, 10) * 1000;
    const pollInterval = setInterval(fetchAndScroll, pollMs);
    return () => clearInterval(pollInterval);
  }, [sessionId, selectedChat?.jid, fetchMessages, isNearBottom, settings.autoRefresh, settings.refreshInterval]);

  useEffect(() => {
    if (selectedChat && sessionId) {
      fetchMessages(sessionId, selectedChat.jid).then(() => {
        setTimeout(() => scrollToBottom(), 150);
      });
      resetUnread(selectedChat.jid);
      chatApi.markRead(sessionId, selectedChat.jid).catch(() => {});
      setIsNearBottom(true);
    }
  }, [selectedChat?.jid, sessionId, fetchMessages, resetUnread, scrollToBottom]);

  // Socket listener for real-time messages
  useEffect(() => {
    if (!sessionId || !selectedChat) return;

    const socket = getSocket();
    
    const handleNewMessage = (msg: any) => {
      const msgJid = msg.chat_jid?.toLowerCase()?.trim();
      const currentJid = selectedChat.jid?.toLowerCase()?.trim();
      
      if (msgJid === currentJid) {
        const isDuplicate = messages.some(m => m.message_id === msg.message_id);
        if (!isDuplicate) {
          addMessage(msg);
          if (isNearBottom) {
            setTimeout(() => scrollToBottom("smooth"), 100);
          }
        }
      }
    };

    socket.on(`message:new:${sessionId}`, handleNewMessage);
    
    return () => {
      socket.off(`message:new:${sessionId}`, handleNewMessage);
    };
  }, [sessionId, selectedChat?.jid, messages, addMessage, isNearBottom, scrollToBottom]);

  const handleSend = async () => {
    if (!inputText.trim() || !selectedChat || isSending) return;
    const text = inputText.trim();
    const chatJid = selectedChat.jid;
    setIsSending(true);
    setInputText("");
    setReplyTo(null);

    try {
      const response = await messageApi.sendText(
        sessionId,
        chatJid,
        text,
        replyTo?.message_id,
      );
      if (response.success) {
        const newMessage = {
          ...response.data,
          chat_jid: chatJid,
          content: text,
          is_from_me: 1,
          timestamp: new Date().toISOString(),
          status: "sent",
        };
        addMessage(newMessage);
        updateChat(chatJid, {
          last_message: text,
          last_message_time: newMessage.timestamp,
          last_message_from: "me",
        });
        setTimeout(() => scrollToBottom("smooth"), 100);
      }
    } catch (err) {
      toast.error("Gagal mengirim pesan");
      setInputText(text);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewFile(file);
      setPreviewUrl(url);
    } else {
      handleSendMedia(file, "document", file.name);
    }
  };

  const handleSendMedia = async (file: File, type: string, caption: string) => {
    if (!selectedChat || !sessionId) return;
    setIsSending(true);
    try {
      const response = await messageApi.sendMedia(
        sessionId,
        selectedChat.jid,
        file,
        type,
        caption,
      );
      if (response.success) {
        toast.success("File dikirim");
        fetchMessages(sessionId, selectedChat.jid);
        scrollToBottom("smooth");
      }
    } catch (err) {
      toast.error("Gagal mengirim file");
    } finally {
      setIsSending(false);
    }
  };

  const handleSendPreview = async () => {
    if (!previewFile || !selectedChat) return;
    const file = previewFile;
    const cap = previewCaption;
    cancelPreview();
    await handleSendMedia(file, "image", cap);
  };

  const cancelPreview = () => {
    setPreviewFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewCaption("");
  };

  if (!selectedChat) {
    return <WelcomeScreen />;
  }

  const rawDisplayName = getDisplayName(selectedChat);
  const displayName = rawDisplayName.includes('@') ? "Potential Lead" : rawDisplayName;

  return (
    <div className="flex-1 flex flex-col bg-gray-50 h-full w-full relative overflow-hidden">
      {/* HEADER */}
      <div className="flex-none h-[60px] md:h-[65px] bg-white px-4 flex items-center gap-3 border-b border-gray-200 z-20 shadow-sm">
        <Button
          onClick={onBack}
          variant="ghost"
          size="sm"
          className="md:hidden text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        <Avatar
          name={displayName}
          imageUrl={selectedChat.profile_pic_url}
          size="md"
          isGroup={isGroupJid(selectedChat.jid)}
          className="ring-2 ring-blue-200"
        />

        <div className="flex-1 min-w-0 ml-1">
          <p className="text-gray-900 font-semibold text-sm truncate">
            {displayName}
          </p>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <p className="text-emerald-600 text-[10px] font-medium">
              Online
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700 hover:bg-gray-100">
            <Search className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700 hover:bg-gray-100">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* MESSAGES AREA */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 bg-gray-100 relative"
      >
        {isLoadingMessages && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="animate-spin text-blue-500 w-8 h-8" />
          </div>
        ) : (
          messages.map((msg, index) => (
            <React.Fragment key={msg.message_id || index}>
              {(!messages[index - 1] ||
                isDifferentDay(
                  messages[index - 1].timestamp,
                  msg.timestamp,
                )) && (
                <div className="flex justify-center my-4">
                  <span className="bg-white text-gray-500 text-[11px] px-3 py-1 rounded-full shadow-sm font-medium">
                    {formatDateSeparator(msg.timestamp)}
                  </span>
                </div>
              )}
              <MessageBubble
                message={msg}
                isGroup={isGroupJid(selectedChat.jid)}
                onReply={() => setReplyTo(msg)}
              />
            </React.Fragment>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* SCROLL TO BOTTOM BUTTON */}
      {showScrollBtn && (
        <Button
          onClick={() => scrollToBottom()}
          variant="secondary"
          size="icon"
          className="absolute bottom-24 right-6 w-10 h-10 bg-white rounded-full shadow-lg border border-gray-200 z-30 text-gray-600 hover:text-gray-900 hover:bg-gray-50"
        >
          <ChevronDown className="w-5 h-5" />
        </Button>
      )}

      {/* INPUT AREA */}
      <div className="flex-none bg-white flex flex-col border-t border-gray-200 shadow-lg">
        {replyTo && (
          <div className="mx-3 mt-3 px-4 py-2 flex items-center gap-3 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
            <div className="flex-1 truncate">
              <p className="text-blue-600 text-xs font-semibold">
                {Number(replyTo.is_from_me) === 1
                  ? "Anda"
                  : (replyTo.sender_name?.includes('@') ? "Lead" : replyTo.sender_name)}
              </p>
              <p className="text-gray-500 text-xs truncate italic">
                {replyTo.content}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-gray-600 p-1 h-auto">
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        <div className="px-3 py-3 flex items-end gap-2">
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2">
            <Smile className="w-5 h-5" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2"
          >
            <Paperclip className="w-5 h-5" />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,.pdf,.doc,.docx"
            onChange={handleFileChange}
          />

          <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-2">
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                setInputText(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height =
                  Math.min(e.target.scrollHeight, 120) + "px";
              }}
              onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ketik pesan..."
              className="w-full bg-transparent text-gray-900 outline-none resize-none text-sm min-h-[36px] max-h-[120px] placeholder:text-gray-400"
              rows={1}
            />
          </div>

          <Button
            onClick={handleSend}
            disabled={!inputText.trim() || isSending}
            size="icon"
            className="w-10 h-10 bg-blue-500 hover:bg-blue-600 text-white rounded-full shrink-0 transition-all shadow-lg shadow-blue-500/25"
          >
            {isSending ? (
              <Loader2 className="animate-spin w-5 h-5" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>

      {/* PREVIEW MODAL */}
      {previewUrl && (
        <div className="absolute inset-0 z-[100] bg-white flex flex-col animate-in fade-in zoom-in duration-200">
          <div className="flex items-center p-4 gap-4 bg-gray-50 border-b border-gray-200">
            <Button
              onClick={cancelPreview}
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </Button>
            <span className="text-gray-900 font-semibold">Preview Media</span>
          </div>
          <div className="flex-1 flex items-center justify-center p-4 overflow-hidden bg-gray-100">
            <img
              src={previewUrl}
              alt="Preview"
              className="max-w-full max-h-full object-contain shadow-xl rounded-lg"
            />
          </div>
          <div className="bg-white p-4 flex items-center gap-3 border-t border-gray-200">
            <input
              className="flex-1 bg-gray-100 text-gray-900 rounded-xl px-4 py-3 outline-none border border-transparent focus:border-blue-500"
              placeholder="Tambahkan keterangan..."
              value={previewCaption}
              onChange={(e) => setPreviewCaption(e.target.value)}
            />
            <Button
              onClick={handleSendPreview}
              size="icon"
              className="w-12 h-12 bg-blue-500 hover:bg-blue-600 rounded-full text-white shadow-lg shadow-blue-500/25"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

const WelcomeScreen = () => (
  <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-white h-full p-8 text-center">
    <div className="w-24 h-24 bg-blue-100 rounded-3xl flex items-center justify-center shadow-xl mb-6">
      <ImageIcon className="w-12 h-12 text-blue-500" />
    </div>
    <h2 className="text-gray-900 text-2xl font-bold tracking-tight">
      SATU <span className="text-blue-500">PINTU</span>
    </h2>
    <p className="text-gray-500 text-sm mt-4 max-w-xs font-medium leading-relaxed">
      Pilih pesan masuk untuk mulai berinteraksi dengan Leads Anda secara real-time.
    </p>
  </div>
);

const MessageBubble = ({ message, isGroup, onReply }: any) => {
  const isFromMe = Number(message.is_from_me) === 1;
  const BASE_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";

  const getMediaUrl = (path: string) => {
    if (!path) return "";
    return path.startsWith("http") ? path : `${BASE_URL}${path}`;
  };

  return (
    <div
      className={`flex items-end gap-2 mb-2 ${isFromMe ? "justify-end" : "justify-start"}`}
    >
      {!isFromMe && isGroup && <Avatar name={message.sender_name?.includes('@') ? "Lead" : message.sender_name} size="sm" />}

      <div
        className={`group relative max-w-[85%] md:max-w-[70%] rounded-2xl shadow-sm ${
          isFromMe
            ? "bg-blue-500 rounded-tr-sm"
            : "bg-white rounded-tl-sm border border-gray-200"
        } ${message.message_type === "image" ? "p-1.5" : "px-4 py-2.5"}`}
      >
        <Button
          onClick={onReply}
          variant="ghost"
          size="sm"
          className={`absolute top-1 right-1 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-md ${isFromMe ? "bg-blue-400 text-white hover:bg-blue-300" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
        >
          <Reply className="w-3 h-3" />
        </Button>

        {message.message_type === "image" && (
          <img
            src={getMediaUrl(message.media_url)}
            className="max-h-[300px] w-full object-cover rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() =>
              window.open(getMediaUrl(message.media_url), "_blank")
            }
          />
        )}

        {message.message_type === "document" && (
          <div
            className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={() =>
              window.open(getMediaUrl(message.media_url), "_blank")
            }
          >
            <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm font-medium truncate text-gray-700">
              {message.content || "Dokumen File"}
            </span>
          </div>
        )}

        <div className="mt-1">
          <p className={`text-[14px] leading-[1.4] break-words whitespace-pre-wrap ${isFromMe ? "text-white" : "text-gray-700"}`}>
            {message.caption || message.content}
          </p>
          <div className="flex items-center justify-end gap-1.5 mt-1 h-3">
            <span className={`text-[9px] ${isFromMe ? "text-white/70" : "text-gray-400"} font-medium`}>
              {formatMessageTime(message.timestamp)}
            </span>
            {isFromMe && (
              <span
                className={
                  message.status === "read"
                    ? "text-white/90"
                    : "text-white/60"
                }
              >
                {message.status === "read" ? "✓✓" : "✓"}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
