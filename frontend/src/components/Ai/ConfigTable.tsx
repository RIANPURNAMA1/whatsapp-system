import React, { useState } from "react";
import { 
  Smartphone, 
  Edit3, 
  Copy, 
  Trash2, 
  RefreshCw, 
  BookOpen, 
  Zap, 
  MessageSquareText
} from "lucide-react";
import toast from "react-hot-toast";

interface ConfigTableProps {
  configs: any[];
  getSessionName: (id: string) => string;
  onEdit: (cfg: any) => void;
  onCopy: (id: string) => void;
  onRefresh: () => void;
}

export const ConfigTable: React.FC<ConfigTableProps> = ({ 
  configs, getSessionName, onEdit, onCopy, onRefresh 
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
    <div className="mb-10 mt-6 overflow-hidden bg-white border border-slate-200/60 rounded-2xl shadow-sm">
      <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-700">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          <span>Perangkat Terkonfigurasi</span>
        </div>
        <button onClick={onRefresh} className="text-gray-400 hover:text-blue-600 transition-all hover:rotate-180 duration-500">
          <RefreshCw size={14} />
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[10px] uppercase tracking-widest text-gray-500 bg-gray-50">
              <th className="p-4 font-bold">ID & Perangkat</th>
              <th className="p-4 font-bold text-center">CS AI</th>
              <th className="p-4 font-bold text-center">Auto Rules</th>
              <th className="p-4 font-bold">Nama Bot</th>
              <th className="p-4 font-bold">Knowledge Base</th>
              <th className="p-4 font-bold text-center">Delay</th>
              <th className="p-4 font-bold text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-gray-100">
            {configs.length > 0 ? configs.map((cfg: any) => {
              const sId = cfg.session_id || cfg.sessionId;
              
              const isActive = localStatus[sId]?.ai !== undefined 
                ? localStatus[sId].ai 
                : Number(cfg.is_active) === 1;

              const isRulesActive = localStatus[sId]?.rules !== undefined 
                ? localStatus[sId].rules 
                : Number(cfg.is_rules_active || cfg.isRulesActive) === 1;

              return (
                <tr key={sId} className="border-b border-gray-100 hover:bg-gray-50/50 transition-all">
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="text-blue-600 font-semibold flex items-center gap-2">
                        <Smartphone size={14} className="text-gray-400" />
                        {getSessionName(sId)}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono mt-1 opacity-60 uppercase">{sId}</span>
                    </div>
                  </td>

                  <td className="p-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleAi(sId, isActive as boolean)}
                      disabled={loadingStatus === sId}
                      className={`relative inline-flex h-5 w-10 items-center rounded-full transition-all duration-300 ${
                        isActive ? "bg-blue-500" : "bg-gray-200"
                      }`}
                    >
                      <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-300 ${isActive ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                    <div className={`text-[9px] mt-1 font-bold uppercase ${isActive ? "text-blue-600" : "text-gray-400"}`}>
                      {isActive ? "AI ON" : "AI OFF"}
                    </div>
                  </td>

                  <td className="p-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleRules(sId, isRulesActive as boolean)}
                      disabled={loadingRules === sId}
                      className={`relative inline-flex h-5 w-10 items-center rounded-full transition-all duration-300 ${
                        isRulesActive ? "bg-blue-500" : "bg-gray-200"
                      }`}
                    >
                      <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-300 ${isRulesActive ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                    <div className={`text-[9px] mt-1 font-bold uppercase ${isRulesActive ? "text-blue-600" : "text-gray-400"}`}>
                      {isRulesActive ? "Rules ON" : "Rules OFF"}
                    </div>
                  </td>

                  <td className="p-4 font-medium text-gray-900 truncate max-w-[120px]">{cfg.bot_name || "-"}</td>

                  <td className="p-4">
                    <div className="flex items-center gap-2 max-w-[150px]">
                      <BookOpen size={12} className="text-blue-500 shrink-0" />
                      <p className={`truncate text-[11px] ${getKbContent(cfg).includes('[PDF') ? 'text-blue-500' : 'text-gray-500'}`}>
                        {getKbContent(cfg)}
                      </p>
                    </div>
                  </td>

                  <td className="p-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="flex items-center gap-1 text-orange-500 text-[10px] font-mono bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                        <Zap size={10} /> {cfg.min_delay}-{cfg.max_delay}s
                      </span>
                      <span className="flex items-center gap-1 text-blue-500 text-[10px] font-mono bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        <MessageSquareText size={10} /> {cfg.max_messages_per_day}
                      </span>
                    </div>
                  </td>

                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => onEdit(cfg)} className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-all"><Edit3 size={14} /></button>
                      <button onClick={() => onCopy(sId)} className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-all"><Copy size={14} /></button>
                      <button className="p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-all"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              );
            }) : (
              <tr><td colSpan={7} className="p-16 text-center text-gray-400 italic">Belum ada perangkat terhubung.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
