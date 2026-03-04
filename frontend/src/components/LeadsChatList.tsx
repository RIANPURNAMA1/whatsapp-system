import React, { useState, useEffect, useCallback } from "react";
import {
  UserSearch,
  Clock,
  Search,
  Loader2,
  RefreshCcw,
  Target,
  Lock,
  Smartphone,
  ChevronRight,
} from "lucide-react";

interface LeadsChatListProps {
  isDarkMode: boolean;
  sessions: any[];
  onSelectChat?: (jid: string) => void;
}

const LeadsChatList: React.FC<LeadsChatListProps> = ({
  isDarkMode,
  sessions,
  onSelectChat,
}) => {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDevice, setSelectedDevice] = useState("all");

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const url = new URL(`${import.meta.env.VITE_API_URL}/chats/leads-only`);
      url.searchParams.append("sessionId", selectedDevice);

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setLeads(json.data || []);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedDevice]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const filteredLeads = leads.filter(
    (lead) =>
      lead.pushName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.remoteJid.includes(searchTerm) ||
      lead.lead_source?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div
      className={`flex flex-col h-full transition-all duration-300 ${isDarkMode ? "bg-[#111B21]" : "bg-white"}`}
    >
      {/* HEADER SECTION */}
      <div
        className={`p-4 border-b space-y-4 ${isDarkMode ? "border-[#222D34] bg-[#202C33]" : "border-gray-100 bg-[#F0F2F5]"}`}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-500/10 rounded-xl border border-orange-500/20 shadow-inner">
              <UserSearch className="text-orange-500" size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  className={`font-black text-sm uppercase tracking-tight ${isDarkMode ? "text-white" : "text-[#3B4A54]"}`}
                >
                  Monitoring Leads
                </h2>
                <span className="bg-[#00a884] text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {filteredLeads.length}
                </span>
              </div>
              <p
                className={`text-[10px] font-medium ${isDarkMode ? "text-[#8696A0]" : "text-[#667781]"}`}
              >
                Auto-tracking sumber pesan baru
              </p>
            </div>
          </div>
          <button
            onClick={fetchLeads}
            className={`p-2 rounded-xl hover:bg-black/5 transition-all active:scale-95 ${isDarkMode ? "text-[#8696A0]" : "text-[#667781]"}`}
          >
            <RefreshCcw
              size={16}
              className={loading ? "animate-spin text-[#00a884]" : ""}
            />
          </button>
        </div>

        {/* CONTROLS */}
        <div className="grid grid-cols-1 gap-2">
          {/* DEVICE SELECTOR */}
          <div className="relative group">
            <Smartphone
              className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${isDarkMode ? "text-[#8696A0]" : "text-gray-400"}`}
              size={14}
            />
            <select
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-[11px] font-bold outline-none appearance-none cursor-pointer transition-all border ${
                isDarkMode
                  ? "bg-[#2A3942] text-[#E9EDEF] border-[#3B4A54] focus:border-[#00a884]"
                  : "bg-white border-gray-200 text-[#3B4A54] focus:border-[#00a884] shadow-sm"
              }`}
            >
              <option value="all">Semua Device (Global)</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name || s.id}
                </option>
              ))}
            </select>
          </div>

          {/* SEARCH BAR */}
          <div className="relative">
            <Search
              className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? "text-[#8696A0]" : "text-gray-400"}`}
              size={14}
            />
            <input
              type="text"
              placeholder="Cari nama, nomor, atau sumber..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-bold outline-none transition-all border ${
                isDarkMode
                  ? "bg-[#2A3942] text-white border-transparent focus:bg-[#323739] focus:border-[#00a884]"
                  : "bg-white border-gray-200 text-[#3B4A54] focus:ring-2 focus:ring-[#00a884]/10 focus:border-[#00a884]"
              }`}
            />
          </div>
        </div>
      </div>

      {/* LIST CONTENT */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <div className="relative">
              <Loader2 className="animate-spin text-[#00a884]" size={32} />
              <div className="absolute inset-0 m-auto w-1.5 h-1.5 bg-[#00a884] rounded-full animate-ping"></div>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#8696A0]">
              Sinkronisasi Data...
            </p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 opacity-60">
            <div
              className={`p-4 rounded-full mb-3 ${isDarkMode ? "bg-[#202C33]" : "bg-gray-100"}`}
            >
              <Target size={32} className="text-[#8696A0]" />
            </div>
            <p
              className={`text-[11px] font-bold uppercase tracking-widest ${isDarkMode ? "text-white" : "text-[#3B4A54]"}`}
            >
              Belum ada lead baru
            </p>
          </div>
        ) : (
          filteredLeads.map((lead) => (
            <div
              key={lead.id}
              onClick={() => onSelectChat?.(lead.remoteJid)}
              className={`flex items-center p-4 border-b cursor-pointer relative group transition-all duration-200 ${
                isDarkMode
                  ? "border-[#222D34] hover:bg-[#2A3942]"
                  : "border-gray-50 hover:bg-[#F0F2F5]"
              }`}
            >
              {/* STATUS INDICATOR (Read Only Mode) */}
              <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-1 group-hover:translate-x-0">
                <div className="flex items-center gap-1.5 bg-[#00a884]/10 px-2 py-1 rounded-lg border border-[#00a884]/20">
                  <ChevronRight size={12} className="text-[#00a884]" />
                  <span className="text-[9px] text-[#00a884] font-black uppercase">
                    Detail
                  </span>
                </div>
              </div>

              {/* AVATAR WITH SOURCE COLOR */}
              <div className="relative flex-shrink-0">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg transform group-hover:rotate-3 transition-transform"
                  style={{
                    background: lead.source_color
                      ? `linear-gradient(135deg, ${lead.source_color}, ${lead.source_color}dd)`
                      : "linear-gradient(135deg, #8696A0, #667781)",
                  }}
                >
                  {lead.pushName ? lead.pushName[0].toUpperCase() : "?"}
                </div>
                <div
                  className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 ${isDarkMode ? "border-[#111B21] bg-[#00a884]" : "border-white bg-[#00a884]"}`}
                ></div>
              </div>

              <div className="ml-4 flex-1 overflow-hidden">
                <div className="flex justify-between items-start mb-1">
                  <div className="flex flex-col overflow-hidden">
                    <h3
                      className={`font-bold text-[14px] truncate leading-tight ${isDarkMode ? "text-[#E9EDEF]" : "text-[#111B21]"}`}
                    >
                      {lead.pushName || "Unknown Client"}
                    </h3>
                    <span
                      className={`text-[10px] font-semibold font-mono ${isDarkMode ? "text-[#8696A0]" : "text-[#667781]"}`}
                    >
                      {lead.remoteJid.split("@")[0]}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`text-[9px] font-black flex items-center gap-1 ${isDarkMode ? "text-[#8696A0]" : "text-[#667781]"}`}
                    >
                      <Clock size={10} className="text-[#00a884]" />
                      {new Date(lead.updatedAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                {/* DYNAMIC BADGES */}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {lead.lead_source ? (
                    <div
                      className="px-2 py-0.5 rounded flex items-center gap-1 border shadow-sm"
                      style={{
                        backgroundColor: `${lead.source_color}10`,
                        borderColor: `${lead.source_color}30`,
                      }}
                    >
                      <Target size={8} style={{ color: lead.source_color }} />
                      <span
                        className="text-[9px] font-black uppercase tracking-wider"
                        style={{ color: lead.source_color }}
                      >
                        {lead.lead_source}
                      </span>
                    </div>
                  ) : (
                    <div
                      className={`px-2 py-0.5 rounded border ${isDarkMode ? "bg-gray-500/10 border-gray-500/20" : "bg-gray-100 border-gray-200"}`}
                    >
                      <span className="text-gray-500 text-[9px] font-black uppercase tracking-wider">
                        Organik
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-1 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                    <span className="text-orange-600 text-[9px] font-black uppercase tracking-wider">
                      New
                    </span>
                  </div>
                </div>

                {/* MESSAGE PREVIEW */}
                <div
                  className={`mt-2 p-2 rounded-lg text-[11px] line-clamp-2 transition-colors ${
                    isDarkMode
                      ? "bg-[#2A3942]/50 text-[#8696A0] group-hover:text-[#E9EDEF]"
                      : "bg-gray-50 text-[#667781] group-hover:text-[#3B4A54]"
                  }`}
                >
                  <span className="opacity-50 font-serif mr-1">"</span>
                  {lead.content}
                  <span className="opacity-50 font-serif ml-1">"</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LeadsChatList;
