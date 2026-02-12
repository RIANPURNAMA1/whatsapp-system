import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Tag, Plus, X, Check, Edit2, Trash2, ChevronRight,
  ShoppingBag, Clock, UserPlus, CheckCircle, CheckCheck,
  Star, AlertCircle, Loader2, MoreVertical
} from 'lucide-react';

// ─────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────
interface Label {
  id: number;
  session_id: string;
  name: string;
  color: string;
  icon: string;
  sort_order: number;
  chat_count?: number;
}

interface ChatLabel {
  chat_jid: string;
  session_id: string;
  labels: Label[];
}

// ─────────────────────────────────────────────────────────
// ICON MAP
// ─────────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ReactNode> = {
  'tag':          <Tag size={14} />,
  'user-plus':    <UserPlus size={14} />,
  'shopping-bag': <ShoppingBag size={14} />,
  'clock':        <Clock size={14} />,
  'check-circle': <CheckCircle size={14} />,
  'check-check':  <CheckCheck size={14} />,
  'star':         <Star size={14} />,
  'alert':        <AlertCircle size={14} />,
};

const ICON_OPTIONS = Object.keys(ICON_MAP);

const PRESET_COLORS = [
  '#25D366', '#00a884', '#FFB800', '#53bdeb',
  '#FF6B6B', '#A78BFA', '#F472B6', '#34D399',
  '#FB923C', '#94A3B8',
];

// ─────────────────────────────────────────────────────────
// LABEL CHIP  (ditempel di GlobalInboxItem)
// ─────────────────────────────────────────────────────────
export const LabelChip: React.FC<{ label: Label; onRemove?: () => void; small?: boolean }> = ({
  label, onRemove, small = false
}) => (
  <span
    className="inline-flex items-center gap-1 rounded-full font-semibold select-none"
    style={{
      background: label.color + '22',
      color: label.color,
      border: `1px solid ${label.color}44`,
      fontSize: small ? '9px' : '10px',
      padding: small ? '1px 6px' : '2px 8px',
    }}
  >
    <span style={{ color: label.color }}>{ICON_MAP[label.icon] ?? <Tag size={10} />}</span>
    {label.name}
    {onRemove && (
      <button onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity"
      >
        <X size={10} />
      </button>
    )}
  </span>
);

// ─────────────────────────────────────────────────────────
// LABEL ASSIGN DROPDOWN  (muncul saat klik icon "+" di chat)
// ─────────────────────────────────────────────────────────
export const LabelAssignDropdown: React.FC<{
  sessionId: string;
  chatJid: string;
  assignedLabels: Label[];
  allLabels: Label[];
  onToggle: (label: Label, assigned: boolean) => void;
  onClose: () => void;
}> = ({ sessionId, chatJid, assignedLabels, allLabels, onToggle, onClose }) => {
  const ref = useRef<HTMLDivElement>(null);
  const assignedIds = new Set(assignedLabels.map(l => l.id));

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-8 z-50 w-56 rounded-xl shadow-2xl border border-[#2A3942] overflow-hidden"
      style={{ background: '#182229' }}
    >
      <div className="px-3 py-2 border-b border-[#2A3942]">
        <p className="text-[11px] text-[#8696A0] uppercase tracking-widest">Tambah Label</p>
      </div>
      <div className="max-h-52 overflow-y-auto">
        {allLabels.length === 0 && (
          <p className="text-center text-[#8696A0] text-xs py-4">Belum ada label</p>
        )}
        {allLabels.map(label => {
          const isAssigned = assignedIds.has(label.id);
          return (
            <button
              key={label.id}
              onClick={() => onToggle(label, isAssigned)}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#202C33] transition-colors text-left"
            >
              <span style={{ color: label.color }}>{ICON_MAP[label.icon] ?? <Tag size={14} />}</span>
              <span className="flex-1 text-[#E9EDEF] text-sm">{label.name}</span>
              <div
                className="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all"
                style={{
                  background: isAssigned ? label.color : 'transparent',
                  borderColor: isAssigned ? label.color : '#3b4a54',
                }}
              >
                {isAssigned && <Check size={10} color="#111B21" strokeWidth={3} />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// LABEL FILTER SIDEBAR  (panel kiri di bawah daftar sesi)
// ─────────────────────────────────────────────────────────
export const LabelFilterSidebar: React.FC<{
  labels: Label[];
  activeLabel: number | null;
  onSelect: (id: number | null) => void;
}> = ({ labels, activeLabel, onSelect }) => {
  if (labels.length === 0) return null;
  return (
    <div className="px-2 pt-1 pb-2">
      <p className="text-[10px] text-[#8696A0] uppercase tracking-widest px-2 mb-1.5">Label</p>
      <div className="flex flex-wrap gap-1.5 px-1">
        {/* Semua */}
        <button
          onClick={() => onSelect(null)}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all border
            ${activeLabel === null
              ? 'bg-[#00a884] text-[#111B21] border-[#00a884]'
              : 'bg-[#202C33] text-[#8696A0] border-[#2A3942] hover:border-[#00a884] hover:text-[#00a884]'
            }`}
        >
          <Tag size={11} /> Semua
        </button>
        {labels.map(label => (
          <button
            key={label.id}
            onClick={() => onSelect(label.id)}
            className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all border"
            style={
              activeLabel === label.id
                ? { background: label.color, color: '#111B21', borderColor: label.color }
                : { background: label.color + '18', color: label.color, borderColor: label.color + '44' }
            }
          >
            {ICON_MAP[label.icon] ?? <Tag size={11} />}
            {label.name}
            {(label.chat_count ?? 0) > 0 && (
              <span
                className="rounded-full text-[9px] font-bold px-1.5 py-0.5 ml-0.5"
                style={{
                  background: activeLabel === label.id ? '#111B21' : label.color + '33',
                  color: activeLabel === label.id ? label.color : label.color,
                }}
              >
                {label.chat_count}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// LABEL MANAGER PANEL  (pengaturan / kelola label)
// ─────────────────────────────────────────────────────────
interface LabelManagerProps {
  sessionId: string;
  onClose?: () => void;
}

export const LabelManagerPanel: React.FC<LabelManagerProps> = ({ sessionId, onClose }) => {
  const [labels, setLabels]         = useState<Label[]>([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [editingId, setEditingId]   = useState<number | 'new' | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  // Form state
  const [form, setForm] = useState({ name: '', color: PRESET_COLORS[0], icon: 'tag' });

  const API = import.meta.env.VITE_API_URL;

  const fetchLabels = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/labels?session_id=${sessionId}`);
      const json = await res.json();
      if (json.success) setLabels(json.data);
    } finally {
      setLoading(false);
    }
  }, [sessionId, API]);

  useEffect(() => { fetchLabels(); }, [fetchLabels]);

  const openCreate = () => {
    setForm({ name: '', color: PRESET_COLORS[0], icon: 'tag' });
    setEditingId('new');
  };

  const openEdit = (label: Label) => {
    setForm({ name: label.name, color: label.color, icon: label.icon });
    setEditingId(label.id);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editingId === 'new') {
        await fetch(`${API}/labels`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId, ...form }),
        });
      } else {
        await fetch(`${API}/labels/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
      }
      setEditingId(null);
      fetchLabels();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    await fetch(`${API}/labels/${id}`, { method: 'DELETE' });
    setConfirmDelete(null);
    fetchLabels();
  };

  return (
    <div className="flex flex-col h-full bg-[#111B21]">
      {/* Header */}
      <div className="bg-[#202C33] px-4 py-3 flex items-center justify-between border-b border-[#2A3942]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#00a884]/10 flex items-center justify-center">
            <Tag size={18} className="text-[#00a884]" />
          </div>
          <div>
            <h2 className="text-[#E9EDEF] text-[15px] font-medium">Kelola Label</h2>
            <p className="text-[11px] text-[#8696A0]">Organisir chat dengan label</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 bg-[#00a884] hover:bg-[#00a884]/90 text-[#111B21] text-xs font-bold px-3 py-1.5 rounded-full transition-all"
          >
            <Plus size={13} /> Buat Label
          </button>
          {onClose && (
            <button onClick={onClose} className="p-1.5 text-[#8696A0] hover:text-[#E9EDEF] rounded-full hover:bg-[#374248] transition-all">
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Form Edit / Create */}
      {editingId !== null && (
        <div className="bg-[#182229] border-b border-[#2A3942] px-4 py-4 animate-in slide-in-from-top-2 duration-200">
          <p className="text-[#00a884] text-xs font-bold uppercase tracking-widest mb-3">
            {editingId === 'new' ? 'Label Baru' : 'Edit Label'}
          </p>

          {/* Nama */}
          <input
            type="text"
            placeholder="Nama label..."
            maxLength={30}
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full bg-[#2A3942] text-[#E9EDEF] rounded-lg px-3 py-2 text-sm outline-none border border-transparent focus:border-[#00a884] transition-all placeholder:text-[#8696A0] mb-3"
          />

          {/* Warna */}
          <div className="mb-3">
            <p className="text-[11px] text-[#8696A0] mb-1.5">Warna</p>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setForm(f => ({ ...f, color: c }))}
                  className="w-7 h-7 rounded-full transition-transform hover:scale-110 flex items-center justify-center"
                  style={{ background: c, border: form.color === c ? '2.5px solid white' : '2.5px solid transparent' }}
                >
                  {form.color === c && <Check size={12} color="white" strokeWidth={3} />}
                </button>
              ))}
            </div>
          </div>

          {/* Icon */}
          <div className="mb-4">
            <p className="text-[11px] text-[#8696A0] mb-1.5">Ikon</p>
            <div className="flex gap-2 flex-wrap">
              {ICON_OPTIONS.map(ico => (
                <button
                  key={ico}
                  onClick={() => setForm(f => ({ ...f, icon: ico }))}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                  style={{
                    background:   form.icon === ico ? form.color + '33' : '#2A3942',
                    color:        form.icon === ico ? form.color       : '#8696A0',
                    border:       form.icon === ico ? `1.5px solid ${form.color}` : '1.5px solid transparent',
                  }}
                >
                  {ICON_MAP[ico]}
                </button>
              ))}
            </div>
          </div>

          {/* Preview + Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#8696A0]">Preview:</span>
              <LabelChip label={{ ...form, id: 0, session_id: sessionId, sort_order: 0 }} />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditingId(null)}
                className="text-[#8696A0] hover:text-[#E9EDEF] text-sm px-3 py-1.5 rounded-lg hover:bg-[#2A3942] transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name.trim()}
                className="flex items-center gap-1.5 bg-[#00a884] disabled:opacity-50 hover:bg-[#00a884]/90 text-[#111B21] text-sm font-bold px-4 py-1.5 rounded-lg transition-all"
              >
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List Labels */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center pt-16 gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-[#00a884]" />
            <p className="text-[#8696A0] text-xs uppercase tracking-widest">Memuat...</p>
          </div>
        ) : labels.length === 0 ? (
          <div className="flex flex-col items-center pt-20 px-8 text-center">
            <div className="w-16 h-16 bg-[#202C33] rounded-full flex items-center justify-center mb-4">
              <Tag className="w-7 h-7 text-[#3b4a54]" />
            </div>
            <p className="text-[#8696A0] text-sm mb-1">Belum ada label</p>
            <p className="text-[#3b4a54] text-xs">Buat label untuk mengorganisir chat seperti WhatsApp Business</p>
          </div>
        ) : (
          <div className="divide-y divide-[#1a2632]">
            {labels.map(label => (
              <div key={label.id} className="group flex items-center gap-3 px-4 py-3 hover:bg-[#1a2632] transition-colors">
                {/* Icon dalam circle berwarna */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: label.color + '22', color: label.color }}
                >
                  {ICON_MAP[label.icon] ?? <Tag size={16} />}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[#E9EDEF] text-[14px] font-medium truncate">{label.name}</p>
                  <p className="text-[11px] text-[#8696A0]">
                    {label.chat_count ?? 0} chat
                  </p>
                </div>

                {/* Color dot */}
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ background: label.color }}
                />

                {/* Actions — visible on hover */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(label)}
                    className="p-1.5 text-[#8696A0] hover:text-[#E9EDEF] rounded-full hover:bg-[#2A3942] transition-all"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(label.id)}
                    className="p-1.5 text-[#8696A0] hover:text-red-400 rounded-full hover:bg-[#2A3942] transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Confirm delete inline */}
                {confirmDelete === label.id && (
                  <div
                    className="absolute right-4 z-40 bg-[#182229] border border-[#2A3942] rounded-xl shadow-xl px-4 py-3 flex flex-col gap-2 min-w-[200px]"
                    style={{ transform: 'translateY(0)' }}
                  >
                    <p className="text-[#E9EDEF] text-sm font-medium">Hapus "{label.name}"?</p>
                    <p className="text-[#8696A0] text-xs">Label akan dihapus dari semua chat.</p>
                    <div className="flex gap-2 mt-1">
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="flex-1 text-[#8696A0] text-xs py-1.5 rounded-lg bg-[#2A3942] hover:bg-[#374248] transition-all"
                      >
                        Batal
                      </button>
                      <button
                        onClick={() => handleDelete(label.id)}
                        className="flex-1 text-white text-xs py-1.5 rounded-lg bg-red-600 hover:bg-red-500 transition-all"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// HOOK: useChatLabels — load + toggle label untuk satu chat
// ─────────────────────────────────────────────────────────
export function useChatLabels(sessionId: string, chatJid: string) {
  const [chatLabels, setChatLabels] = useState<Label[]>([]);
  const [allLabels,  setAllLabels]  = useState<Label[]>([]);
  const [loading,    setLoading]    = useState(false);

  const API = import.meta.env.VITE_API_URL;

  const fetchAll = useCallback(async () => {
    if (!sessionId || !chatJid) return;
    setLoading(true);
    try {
      const [chatRes, allRes] = await Promise.all([
        fetch(`${API}/labels/chat/${sessionId}/${encodeURIComponent(chatJid)}`),
        fetch(`${API}/labels?session_id=${sessionId}`),
      ]);
      const [chatJson, allJson] = await Promise.all([chatRes.json(), allRes.json()]);
      if (chatJson.success) setChatLabels(chatJson.data);
      if (allJson.success) setAllLabels(allJson.data);
    } finally {
      setLoading(false);
    }
  }, [sessionId, chatJid, API]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const toggleLabel = useCallback(async (label: Label, isAssigned: boolean) => {
    // Optimistic update
    setChatLabels(prev =>
      isAssigned ? prev.filter(l => l.id !== label.id) : [...prev, label]
    );

    const method = isAssigned ? 'DELETE' : 'POST';
    await fetch(`${API}/labels/assign`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label_id: label.id, session_id: sessionId, chat_jid: chatJid }),
    });
  }, [sessionId, chatJid, API]);

  return { chatLabels, allLabels, loading, toggleLabel, refresh: fetchAll };
}

export default LabelManagerPanel;