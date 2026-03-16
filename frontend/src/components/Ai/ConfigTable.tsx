import React, { useState } from "react";
import { Smartphone, Calendar, Edit3, Copy, Trash2, RefreshCw, BookOpen, Power } from "lucide-react";
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

  // Helper untuk mendapatkan isi Knowledge Base
  const getKbContent = (cfg: any) => {
    const rawData = cfg.knowledge_base || cfg.kb_path || cfg.kb_content || cfg.knowledgeBase || "";
    if (!rawData) return "Kosong";
    if (typeof rawData === 'string' && rawData.toLowerCase().includes('.pdf')) {
      const fileName = rawData.split('/').pop();
      return `[SUMBER PDF: ${fileName}]`;
    }
    return rawData;
  };

  // Fungsi untuk handle Toggle AI Status
  const handleToggleAi = async (sessionId: string, currentStatus: boolean) => {
    setLoadingStatus(sessionId);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/ai-settings/toggle`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}` 
        },
        body: JSON.stringify({ sessionId, is_active: !currentStatus }),
      });
      
      const result = await response.json();
      if (result.success) {
        toast.success(`AI ${!currentStatus ? 'Aktif' : 'Nonaktif'} untuk ${getSessionName(sessionId)}`);
        onRefresh(); // Refresh data tabel
      }
    } catch (err) {
      toast.error("Gagal mengubah status AI");
    } finally {
      setLoadingStatus(null);
    }
  };

  return (
    <div className="mb-10 mt-6 overflow-hidden bg-[#111B21] border border-[#313D45] rounded-2xl shadow-2xl">
      {/* Header Tabel */}
      <div className="p-4 border-b border-[#313D45] bg-[#202C33]/50 flex justify-between items-center">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span>Perangkat Terkonfigurasi</span>
        </div>
        <button onClick={onRefresh} className="text-[#8696A0] hover:text-white transition-colors">
          <RefreshCw size={14} />
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[10px] uppercase tracking-widest text-[#8696A0] bg-[#0B141A]">
              <th className="p-4 font-bold border-b border-[#313D45]">ID & Perangkat</th>
              <th className="p-4 font-bold border-b border-[#313D45] text-center">CS AI</th>
              <th className="p-4 font-bold border-b border-[#313D45]">Nama Bot</th>
              <th className="p-4 font-bold border-b border-[#313D45]">Knowledge Base</th>
              <th className="p-4 font-bold border-b border-[#313D45] text-center">Delay</th>
              <th className="p-4 font-bold border-b border-[#313D45] text-center">Limit</th>
              <th className="p-4 font-bold border-b border-[#313D45] text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {configs.length > 0 ? configs.map((cfg: any) => {
              const sId = cfg.session_id || cfg.sessionId;
              const isActive = cfg.is_active === 1 || cfg.is_active === true;

              return (
                <tr key={sId} className="border-b border-[#202C33] hover:bg-[#202C33]/40 transition-all group">
                  {/* Perangkat */}
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="text-emerald-400 font-bold flex items-center gap-2">
                        <Smartphone size={14} className="text-[#8696A0]" />
                        {getSessionName(sId)}
                      </span>
                      <span className="text-[10px] text-[#8696A0] font-mono mt-1 opacity-60 uppercase">{sId}</span>
                    </div>
                  </td>

                  {/* Toggle Switch CS AI */}
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleToggleAi(sId, isActive)}
                      disabled={loadingStatus === sId}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                        isActive ? "bg-emerald-500" : "bg-[#313D45]"
                      } ${loadingStatus === sId ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          isActive ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                    <div className={`text-[9px] mt-1 font-bold uppercase tracking-tighter ${isActive ? "text-emerald-500" : "text-[#8696A0]"}`}>
                      {isActive ? "Online" : "Offline"}
                    </div>
                  </td>

                  {/* Nama Bot */}
                  <td className="p-4 font-medium text-white">{cfg.bot_name || cfg.botName || "-"}</td>

                  {/* Knowledge Base */}
                  <td className="p-4">
                    <div className="flex items-center gap-2 max-w-[180px]">
                      <BookOpen size={12} className="text-blue-400 shrink-0" />
                      <p className={`truncate text-xs ${getKbContent(cfg).includes('[SUMBER PDF') ? 'text-blue-400 font-medium' : 'text-[#8696A0]'}`}>
                        {getKbContent(cfg)}
                      </p>
                    </div>
                  </td>

                  {/* Delay */}
                  <td className="p-4 text-center">
                    <span className="bg-[#202C33] text-orange-400 text-[10px] px-2 py-1 rounded-md border border-orange-400/20 whitespace-nowrap">
                      {cfg.min_delay || cfg.minDelay}-{cfg.max_delay || cfg.maxDelay}s
                    </span>
                  </td>

                  {/* Limit */}
                  <td className="p-4 text-center text-white font-mono">
                    {cfg.max_messages_per_day || cfg.maxMessagesPerDay || 0}
                  </td>

                  {/* Aksi */}
                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => onEdit(cfg)} className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-lg transition-all" title="Edit"><Edit3 size={15} /></button>
                      <button onClick={() => onCopy(sId)} className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-lg transition-all" title="Copy ID"><Copy size={15} /></button>
                      <button className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-all" title="Hapus"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={7} className="p-16 text-center text-[#8696A0] italic">Data tidak ditemukan.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};