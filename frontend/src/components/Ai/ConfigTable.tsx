import React, { useState } from "react";
import { 
  Smartphone, 
  Edit3, 
  Copy, 
  Trash2, 
  RefreshCw, 
  BookOpen, 
  Zap, 
  MessageSquareText,
  CheckCircle2,
  Calendar
} from "lucide-react";
import toast from "react-hot-toast";

interface ConfigTableProps {
  configs: any[];
  getSessionName: (id: string) => string;
  onEdit: (cfg: any) => void;
  onDelete: (cfg: any) => void;
  onCopy: (id: string) => void;
  onRefresh: () => void;
}

export const ConfigTable: React.FC<ConfigTableProps> = ({ 
  configs, getSessionName, onEdit, onDelete, onCopy, onRefresh 
}) => {
  const [loadingStatus, setLoadingStatus] = useState<string | null>(null);
  const [loadingRules, setLoadingRules] = useState<string | null>(null);
  const [localStatus, setLocalStatus] = useState<Record<string, { ai?: boolean; rules?: boolean }>>({});

  const getKbContent = (cfg: any) => {
    const rawData = cfg.knowledge_base || cfg.kb_path || cfg.kb_content || "";
    if (!rawData) return "Kosong";
    if (typeof rawData === 'string' && rawData.toLowerCase().includes('.pdf')) {
      const fileName = rawData.split('/').pop();
      return `[PDF: ${fileName}]`;
    }
    return rawData;
  };

  const handleToggleAi = async (sessionId: string, currentStatus: boolean) => {
    setLocalStatus(prev => ({ ...prev, [sessionId]: { ...prev[sessionId], ai: !currentStatus } }));
    setLoadingStatus(sessionId);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/ai-settings/toggle`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}` 
        },
        body: JSON.stringify({ sessionId, is_active: currentStatus ? 0 : 1 }),
      });
      const result = await response.json();
      if (result.success) {
        toast.success(`AI ${!currentStatus ? 'Aktif' : 'Nonaktif'}`);
        onRefresh();
      } else {
        throw new Error();
      }
    } catch (err) {
      setLocalStatus(prev => ({ ...prev, [sessionId]: { ...prev[sessionId], ai: currentStatus } }));
      toast.error("Gagal mengubah status AI");
    } finally {
      setLoadingStatus(null);
    }
  };

  const handleToggleRules = async (sessionId: string, currentStatus: boolean) => {
    setLocalStatus(prev => ({ ...prev, [sessionId]: { ...prev[sessionId], rules: !currentStatus } }));
    setLoadingRules(sessionId);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/ai-settings/toggle-rules`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}` 
        },
        body: JSON.stringify({ sessionId, is_rules_active: currentStatus ? 0 : 1 }),
      });
      const result = await response.json();
      if (result.success) {
        toast.success(`Rules ${!currentStatus ? 'Aktif' : 'Nonaktif'}`);
        onRefresh();
      } else {
        throw new Error();
      }
    } catch (err) {
      setLocalStatus(prev => ({ ...prev, [sessionId]: { ...prev[sessionId], rules: currentStatus } }));
      toast.error("Gagal mengubah status Rules");
    } finally {
      setLoadingRules(null);
    }
  };

  return (
    <div className="mb-10 mt-6 overflow-hidden bg-white border border-[#E4E6EB] rounded-lg">
      <div className="p-4 border-b border-[#E4E6EB] bg-[#F0F2F5] flex justify-between items-center">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#050505]">
          <div className="w-2 h-2 bg-[#0866FF] rounded-full" />
          <span>Perangkat Terkonfigurasi</span>
        </div>
        <button onClick={onRefresh} className="text-[#65676B] hover:text-[#0866FF] transition-colors">
          <RefreshCw size={14} />
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[10px] uppercase tracking-widest text-[#65676B] bg-[#F0F2F5]">
              <th className="p-4 font-bold">ID & Perangkat</th>
              <th className="p-4 font-bold text-center">CS AI</th>
              <th className="p-4 font-bold text-center">Auto Rules</th>
              <th className="p-4 font-bold text-center">Read</th>
              <th className="p-4 font-bold text-center">Schedule</th>
              <th className="p-4 font-bold">Nama Bot</th>
              <th className="p-4 font-bold">Knowledge Base</th>
              <th className="p-4 font-bold text-center">Delay</th>
              <th className="p-4 font-bold text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-[#E4E6EB]">
            {configs.length > 0 ? configs.map((cfg: any) => {
              const sId = cfg.session_id || cfg.sessionId;
              
              const isActive = localStatus[sId]?.ai !== undefined 
                ? localStatus[sId].ai 
                : Number(cfg.is_active) === 1;

              const isRulesActive = localStatus[sId]?.rules !== undefined 
                ? localStatus[sId].rules 
                : Number(cfg.is_rules_active || cfg.isRulesActive) === 1;

              const isAutoRead = Number(cfg.auto_read) === 1;
              const isSchedule = Number(cfg.schedule_enabled) === 1;

              return (
                <tr key={sId} className="hover:bg-[#F2F3F5] transition-colors">
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="text-[#0866FF] font-semibold flex items-center gap-2">
                        <Smartphone size={14} className="text-[#65676B]" />
                        {getSessionName(sId)}
                      </span>
                      <span className="text-[10px] text-[#65676B] font-mono mt-1 uppercase">{sId}</span>
                    </div>
                  </td>

                  <td className="p-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleAi(sId, isActive as boolean)}
                      disabled={loadingStatus === sId}
                      className={`relative inline-flex h-5 w-10 items-center rounded-full transition-all ${
                        isActive ? "bg-[#0866FF]" : "bg-[#E4E6EB]"
                      }`}
                    >
                      <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${isActive ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                    <div className={`text-[9px] mt-1 font-bold uppercase ${isActive ? "text-[#0866FF]" : "text-[#65676B]"}`}>
                      {isActive ? "AI ON" : "AI OFF"}
                    </div>
                  </td>

                  <td className="p-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleRules(sId, isRulesActive as boolean)}
                      disabled={loadingRules === sId}
                      className={`relative inline-flex h-5 w-10 items-center rounded-full transition-all ${
                        isRulesActive ? "bg-[#0866FF]" : "bg-[#E4E6EB]"
                      }`}
                    >
                      <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${isRulesActive ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                    <div className={`text-[9px] mt-1 font-bold uppercase ${isRulesActive ? "text-[#0866FF]" : "text-[#65676B]"}`}>
                      {isRulesActive ? "Rules ON" : "Rules OFF"}
                    </div>
                  </td>

                  <td className="p-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <CheckCircle2 
                        size={16} 
                        className={isAutoRead ? "text-[#31A24C]" : "text-[#E4E6EB]"} 
                      />
                      <span className={`text-[9px] font-bold uppercase ${isAutoRead ? "text-[#31A24C]" : "text-[#65676B]"}`}>
                        {isAutoRead ? "ON" : "OFF"}
                      </span>
                    </div>
                  </td>

                  <td className="p-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <Calendar 
                        size={16} 
                        className={isSchedule ? "text-[#0866FF]" : "text-[#E4E6EB]"} 
                      />
                      <span className={`text-[9px] font-bold uppercase ${isSchedule ? "text-[#0866FF]" : "text-[#65676B]"}`}>
                        {isSchedule ? cfg.schedule_start_time?.substring(0,5) + "-" + cfg.schedule_end_time?.substring(0,5) : "OFF"}
                      </span>
                    </div>
                  </td>

                  <td className="p-4 font-medium text-[#050505] truncate max-w-[120px]">{cfg.bot_name || "-"}</td>

                  <td className="p-4">
                    <div className="flex items-center gap-2 max-w-[150px]">
                      <BookOpen size={12} className="text-[#0866FF] shrink-0" />
                      <p className={`truncate text-[11px] ${getKbContent(cfg).includes('[PDF') ? 'text-[#0866FF]' : 'text-[#65676B]'}`}>
                        {getKbContent(cfg)}
                      </p>
                    </div>
                  </td>

                  <td className="p-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="flex items-center gap-1 text-[#65676B] text-[10px] font-mono bg-[#F0F2F5] px-2 py-0.5 rounded border border-[#E4E6EB]">
                        <Zap size={10} /> {cfg.min_delay}-{cfg.max_delay}s
                      </span>
                      <span className="flex items-center gap-1 text-[#65676B] text-[10px] font-mono bg-[#F0F2F5] px-2 py-0.5 rounded border border-[#E4E6EB]">
                        <MessageSquareText size={10} /> {cfg.max_messages_per_day}
                      </span>
                    </div>
                  </td>

                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => onEdit(cfg)} className="p-2 bg-[#E7F3FF] hover:bg-[#D0E6FF] text-[#0866FF] rounded-lg transition-all"><Edit3 size={14} /></button>
                      <button onClick={() => onCopy(sId)} className="p-2 bg-[#E7F3FF] hover:bg-[#D0E6FF] text-[#0866FF] rounded-lg transition-all"><Copy size={14} /></button>
                      <button onClick={() => onDelete(cfg)} className="p-2 bg-[#F0F2F5] hover:bg-[#FFEBEE] text-[#65676B] hover:text-red-500 rounded-lg transition-all"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              );
            }) : (
              <tr><td colSpan={9} className="p-16 text-center text-[#65676B] italic">Belum ada perangkat terhubung.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
