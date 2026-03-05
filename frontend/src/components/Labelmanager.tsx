import React, { useEffect, useState, useCallback, useRef } from "react";
import { Tag, Plus, X, Check, Edit2, Trash2, Loader2 } from "lucide-react";

// ─────────────────────────────────────────────────────────
// TYPES - Tanpa Icon & Deskripsi sesuai DB
// ─────────────────────────────────────────────────────────
interface Label {
  id?: number;
  wa_label_id: string; // ID dari WhatsApp
  session_id: string;
  name: string;
  color: string;
  chat_count?: number;
}

const PRESET_COLORS = [
  "#25D366",
  "#00a884",
  "#FFB800",
  "#53bdeb",
  "#FF6B6B",
  "#A78BFA",
  "#F472B6",
  "#34D399",
  "#FB923C",
  "#94A3B8",
];

// ─────────────────────────────────────────────────────────
// LABEL CHIP (Hanya menggunakan Tag Icon standar)
// ─────────────────────────────────────────────────────────
export const LabelChip: React.FC<{
  label: Label;
  onRemove?: () => void;
  small?: boolean;
}> = ({ label, onRemove, small = false }) => (
  <span
    className="inline-flex items-center gap-1 rounded-full font-semibold select-none"
    style={{
      background: (label.color || "#00a884") + "22",
      color: label.color || "#00a884",
      border: `1px solid ${label.color}44`,
      fontSize: small ? "9px" : "10px",
      padding: small ? "1px 6px" : "2px 8px",
    }}
  >
    <Tag size={small ? 8 : 10} />
    {label.name}
    {onRemove && (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity"
      >
        <X size={10} />
      </button>
    )}
  </span>
);

// ─────────────────────────────────────────────────────────
// LABEL ASSIGN DROPDOWN
// ─────────────────────────────────────────────────────────
export const LabelAssignDropdown: React.FC<{
  sessionId: string;
  chatJid: string;
  assignedLabels: Label[];
  allLabels: Label[];
  onToggle: (label: Label, assigned: boolean) => void;
  onClose: () => void;
}> = ({ assignedLabels, allLabels, onToggle, onClose }) => {
  const ref = useRef<HTMLDivElement>(null);
  const assignedIds = new Set(assignedLabels.map((l) => String(l.wa_label_id)));

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-8 z-50 w-56 rounded-xl shadow-2xl border border-[#2A3942] overflow-hidden bg-[#182229]"
    >
      <div className="px-3 py-2 border-b border-[#2A3942]">
        <p className="text-[11px] text-[#8696A0] uppercase tracking-widest">
          Tambah Label
        </p>
      </div>
      <div className="max-h-52 overflow-y-auto custom-scrollbar">
        {allLabels.length === 0 && (
          <p className="text-center text-[#8696A0] text-xs py-4">
            Belum ada label
          </p>
        )}
        {allLabels.map((label) => {
          const isAssigned = assignedIds.has(String(label.wa_label_id));
          return (
            <button
              key={label.wa_label_id}
              onClick={() => onToggle(label, isAssigned)}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#202C33] transition-colors text-left"
            >
              <Tag size={14} style={{ color: label.color }} />
              <span className="flex-1 text-[#E9EDEF] text-sm">
                {label.name}
              </span>
              <div
                className="w-4 h-4 rounded border flex items-center justify-center"
                style={{
                  background: isAssigned ? label.color : "transparent",
                  borderColor: isAssigned ? label.color : "#3b4a54",
                }}
              >
                {isAssigned && (
                  <Check size={10} color="#111B21" strokeWidth={3} />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// LABEL MANAGER PANEL
// ─────────────────────────────────────────────────────────
export const LabelManagerPanel: React.FC<{
  sessionId: string;
  onClose?: () => void;
}> = ({ sessionId, onClose }) => {
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(true);
  const API = import.meta.env.VITE_API_URL;

  const fetchLabels = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/sessions/${sessionId}/labels`);
      const json = await res.json();
      if (json.success) setLabels(json.data);
    } catch (err) {
      console.error("Error fetching labels", err);
    } finally {
      setLoading(false);
    }
  }, [sessionId, API]);

  useEffect(() => {
    fetchLabels();
  }, [fetchLabels]);

  return (
    <div className="flex flex-col h-full bg-[#111B21]">
      <div className="bg-[#202C33] px-4 py-3 flex items-center justify-between border-b border-[#2A3942]">
        <div className="flex items-center gap-3">
          <Tag size={18} className="text-[#00a884]" />
          <h2 className="text-[#E9EDEF] text-[15px] font-medium">
            Label WhatsApp
          </h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 text-[#8696A0] hover:text-[#E9EDEF]"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="flex justify-center pt-10">
            <Loader2 className="animate-spin text-[#00a884]" />
          </div>
        ) : (
          <div className="space-y-1">
            {labels.map((label) => (
              <div
                key={label.wa_label_id}
                className="flex items-center justify-between p-3 rounded-lg bg-[#1c272d] border border-transparent hover:border-[#3b4a54]"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-1.5 h-6 rounded-full"
                    style={{ background: label.color }}
                  />
                  <div>
                    <p className="text-[#E9EDEF] text-sm font-medium">
                      {label.name}
                    </p>
                    <p className="text-[9px] text-[#8696A0]">
                      ID: {label.wa_label_id}
                    </p>
                  </div>
                </div>
                <div className="text-[#8696A0] text-[10px] bg-[#2a3942] px-2 py-0.5 rounded">
                  {label.chat_count || 0} chat
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// HOOK: useChatLabels
// ─────────────────────────────────────────────────────────
export function useChatLabels(sessionId: string, chatJid: string) {
  const [chatLabels, setChatLabels] = useState<Label[]>([]);
  const [allLabels, setAllLabels] = useState<Label[]>([]);
  const API = import.meta.env.VITE_API_URL;

  const fetchAll = useCallback(async () => {
    if (!sessionId || !chatJid) return;
    try {
      const [chatRes, allRes] = await Promise.all([
        fetch(
          `${API}/sessions/${sessionId}/chats/${encodeURIComponent(chatJid)}/labels`,
        ),
        fetch(`${API}/sessions/${sessionId}/labels`),
      ]);
      const chatJson = await chatRes.json();
      const allJson = await allRes.json();
      if (chatJson.success) setChatLabels(chatJson.data || []);
      if (allJson.success) setAllLabels(allJson.data || []);
    } catch (err) {
      console.error(err);
    }
  }, [sessionId, chatJid, API]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const toggleLabel = async (label: Label, isAssigned: boolean) => {
    // Optimistic Update
    setChatLabels((prev) =>
      isAssigned
        ? prev.filter((l) => l.wa_label_id !== label.wa_label_id)
        : [...prev, label],
    );

    try {
      await fetch(
        `${API}/sessions/${sessionId}/chats/${encodeURIComponent(chatJid)}/labels${isAssigned ? "/" + label.wa_label_id : ""}`,
        {
          method: isAssigned ? "DELETE" : "POST",
          headers: { "Content-Type": "application/json" },
          body: !isAssigned
            ? JSON.stringify({ waLabelId: label.wa_label_id })
            : undefined,
        },
      );
    } catch (err) {
      fetchAll(); // Revert jika gagal
    }
  };

  return { chatLabels, allLabels, toggleLabel, refresh: fetchAll };
}

export default LabelManagerPanel;
