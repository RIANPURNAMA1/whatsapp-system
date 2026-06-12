import React, { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import axios from "axios";
import { X, Send, Loader2, BrainCircuit, User, Sparkles } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

const SUGGESTIONS = [
  "Berapa total leads hari ini?",
  "Bagaimana distribusi kategori lead?",
  "Berapa device yang online?",
  "Ringkasan performa dashboard",
];

const mdComponents = {
  p: ({ children }: any) => <p className="text-sm leading-relaxed mb-3 last:mb-0">{children}</p>,
  strong: ({ children }: any) => <strong className="font-semibold">{children}</strong>,
  ul: ({ children }: any) => <ul className="list-disc ml-5 mb-3 space-y-1.5">{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal ml-5 mb-3 space-y-1.5">{children}</ol>,
  li: ({ children }: any) => <li className="text-sm leading-relaxed">{children}</li>,
  code: ({ children }: any) => <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono text-pink-600">{children}</code>,
  pre: ({ children }: any) => (
    <pre className="bg-gray-50 p-3 rounded-lg mb-3 overflow-x-auto text-xs font-mono border border-gray-200">{children}</pre>
  ),
  table: ({ children }: any) => (
    <div className="overflow-x-auto mb-3 rounded-lg border border-gray-200">
      <table className="w-full text-xs border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }: any) => <thead className="bg-gray-50">{children}</thead>,
  tbody: ({ children }: any) => <tbody>{children}</tbody>,
  tr: ({ children }: any) => <tr className="border-b border-gray-100 last:border-0 hover:bg-gray-50">{children}</tr>,
  th: ({ children }: any) => <th className="px-3 py-2.5 text-left font-semibold text-gray-700 whitespace-nowrap">{children}</th>,
  td: ({ children }: any) => <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{children}</td>,
  h1: ({ children }: any) => <h1 className="text-base font-bold mb-3 text-gray-900">{children}</h1>,
  h2: ({ children }: any) => <h2 className="text-sm font-bold mb-2 text-gray-900">{children}</h2>,
  h3: ({ children }: any) => <h3 className="text-sm font-semibold mb-2 text-gray-800">{children}</h3>,
  hr: () => <hr className="my-3 border-gray-200" />,
};

function TypewriterMessage({ content }: { content: string }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const indexRef = useRef(0);

  useEffect(() => {
    indexRef.current = 0;
    setDisplayed("");
    setDone(false);

    const chars = content.split("");
    const step = 3;

    const timer = setInterval(() => {
      const next = indexRef.current + step;
      if (next >= chars.length) {
        setDisplayed(content);
        setDone(true);
        clearInterval(timer);
      } else {
        setDisplayed(chars.slice(0, next).join(""));
        indexRef.current = next;
      }
    }, 10);

    return () => clearInterval(timer);
  }, [content]);

  return (
    <>
      <ReactMarkdown components={mdComponents}>{displayed}</ReactMarkdown>
      {!done && <span className="inline-block w-[2px] h-4 bg-blue-500 ml-0.5 animate-pulse" />}
    </>
  );
}

const AIAssistantModal: React.FC<Props> = ({ open, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Halo! Saya **Satu Pintu AI**. Silakan tanya tentang data dashboard, leads, pesan, perangkat, atau analisis performa sistem." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastAiContent, setLastAiContent] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, lastAiContent, loading]);

  const handleSend = async (text?: string) => {
    const question = (text || input).trim();
    if (!question || loading) return;

    setShowSuggestions(false);
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setInput("");
    setLoading(true);
    setLastAiContent("");

    try {
      const res = await api.post("/ai/assistant", { question });
      if (res.data.success) {
        const answer = res.data.answer;
        setMessages((prev) => [...prev, { role: "assistant", content: answer }]);
        setLastAiContent(answer);
      } else {
        const errMsg = "Maaf, terjadi kesalahan. Silakan coba lagi.";
        setMessages((prev) => [...prev, { role: "assistant", content: errMsg }]);
        setLastAiContent(errMsg);
      }
    } catch {
      const errMsg = "Gagal terhubung ke AI. Pastikan koneksi stabil dan coba lagi.";
      setMessages((prev) => [...prev, { role: "assistant", content: errMsg }]);
      setLastAiContent(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-40 transition-all duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        style={{ backgroundColor: "rgba(0,0,0,0.25)", backdropFilter: open ? "blur(2px)" : "none" }}
        onClick={onClose}
      />

      <div
        className={`fixed top-0 right-0 z-50 h-full w-[420px] max-w-[95vw] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-gradient-to-br from-blue-500 to-blue-600">
              <BrainCircuit className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Asisten AI</h2>
              <p className="text-[11px] text-gray-400">Satu Pintu — AI</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5" style={{ backgroundColor: "#F9FAFB", minHeight: 0 }}>
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 ${
                msg.role === "user" ? "flex-row-reverse" : ""
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  msg.role === "assistant"
                    ? "bg-gradient-to-br from-blue-500 to-blue-600"
                    : "bg-gray-700"
                }`}
              >
                {msg.role === "assistant" ? (
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                ) : (
                  <User className="w-3.5 h-3.5 text-white" />
                )}
              </div>

              <div className={`max-w-[85%] ${msg.role === "user" ? "text-right" : "text-left"}`}>
                <div
                  className={`inline-block px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-blue-500 text-white rounded-2xl rounded-tr-md"
                      : "bg-white text-gray-800 rounded-2xl rounded-tl-md shadow-sm border border-gray-100"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    msg.content === lastAiContent ? (
                      <TypewriterMessage content={msg.content} />
                    ) : (
                      <ReactMarkdown components={mdComponents}>{msg.content}</ReactMarkdown>
                    )
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-gradient-to-br from-blue-500 to-blue-600">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-tl-md px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          {showSuggestions && messages.length === 1 && !loading && (
            <div className="pt-1 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="px-3.5 py-2 text-xs font-medium rounded-xl border border-gray-200 text-gray-500 bg-white hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div className="border-t border-gray-100 px-4 py-3 bg-white">
          <div className="flex items-end gap-2 bg-gray-50 rounded-2xl border border-gray-200 px-4 py-2.5 focus-within:border-gray-300 focus-within:shadow-sm transition-all">
            <textarea
              ref={inputRef}
              placeholder="Tanya tentang data sistem..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              rows={1}
              className="flex-1 text-sm bg-transparent outline-none resize-none placeholder-gray-400 text-gray-700 max-h-[120px]"
              style={{ scrollbarWidth: "none" }}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-gray-200 text-gray-500 hover:bg-gray-300 hover:text-gray-700"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[10px] text-gray-400 text-center mt-2">
            Tekan Enter untuk kirim · Shift+Enter untuk baris baru
          </p>
        </div>
      </div>
    </>
  );
};

export default AIAssistantModal;
