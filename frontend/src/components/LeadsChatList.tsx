import React, { useState, useEffect, useCallback } from "react";
import {
  UserSearch,
  Clock,
  Search,
  Loader2,
  RefreshCcw,
  Target,
  Smartphone,
  Calendar,
  CheckCircle2,
  RotateCcw,
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

  // Fungsi untuk mendapatkan default waktu (Hari ini 00:00 s/d 23:59)
  const getDefaultDateRange = () => ({
    start: new Date(new Date().setHours(0, 0, 0, 0)).toISOString().slice(0, 16),
    end: new Date(new Date().setHours(23, 59, 59, 999))
      .toISOString()
      .slice(0, 16),
  });

  const [tempDateRange, setTempDateRange] = useState(getDefaultDateRange());
  const [appliedDateRange, setAppliedDateRange] = useState(
    getDefaultDateRange(),
  );

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const url = new URL(`${import.meta.env.VITE_API_URL}/chats/leads-only`);

      url.searchParams.append("sessionId", selectedDevice);
      url.searchParams.append(
        "startDate",
        appliedDateRange.start.replace("T", " ") + ":00",
      );
      url.searchParams.append(
        "endDate",
        appliedDateRange.end.replace("T", " ") + ":59",
      );

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
  }, [selectedDevice, appliedDateRange]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Handler Terapkan
  const handleApplyFilter = () => {
    setAppliedDateRange(tempDateRange);
  };

  // Handler Reset
  const handleResetFilter = () => {
    const defaultDates = getDefaultDateRange();
    setTempDateRange(defaultDates);
    setAppliedDateRange(defaultDates);
    setSelectedDevice("all");
    setSearchTerm("");
  };

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
        className={`p-4 border-b space-y-3 ${isDarkMode ? "border-[#222D34] bg-[#202C33]" : "border-gray-100 bg-[#F0F2F5]"}`}
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
            </div>
          </div>
          <button
            onClick={fetchLeads}
            className={`p-2 rounded-xl hover:bg-black/5 transition-all ${isDarkMode ? "text-[#8696A0]" : "text-[#667781]"}`}
          >
            <RefreshCcw
              size={16}
              className={loading ? "animate-spin text-[#00a884]" : ""}
            />
          </button>
        </div>

        {/* CONTROLS AREA */}
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <Smartphone
                className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? "text-[#8696A0]" : "text-gray-400"}`}
                size={12}
              />
              <select
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                className={`w-full pl-8 pr-2 py-2 rounded-xl text-[10px] font-bold outline-none border appearance-none ${isDarkMode ? "bg-[#2A3942] text-[#E9EDEF] border-[#3B4A54]" : "bg-white border-gray-200"}`}
              >
                <option value="all">Semua Device</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name || s.id}
                  </option>
                ))}
              </select>
            </div>
            <div className="relative">
              <Search
                className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? "text-[#8696A0]" : "text-gray-400"}`}
                size={12}
              />
              <input
                type="text"
                placeholder="Cari..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-8 pr-4 py-2 rounded-xl text-[10px] font-bold outline-none border ${isDarkMode ? "bg-[#2A3942] text-white border-transparent" : "bg-white border-gray-200"}`}
              />
            </div>
          </div>

          {/* DATE PICKER */}
          <div
            className={`flex items-center gap-2 p-2 rounded-xl border ${isDarkMode ? "bg-[#111B21] border-[#3B4A54]" : "bg-white border-gray-200"}`}
          >
            <Calendar size={14} className="text-[#00a884]" />
            <div className="flex items-center gap-1 flex-1">
              <input
                type="datetime-local"
                value={tempDateRange.start}
                onChange={(e) =>
                  setTempDateRange({ ...tempDateRange, start: e.target.value })
                }
                className={`text-[9px] font-bold bg-transparent outline-none w-full ${isDarkMode ? "text-white [color-scheme:dark]" : "text-gray-600"}`}
              />
              <span className="text-[10px] opacity-30">→</span>
              <input
                type="datetime-local"
                value={tempDateRange.end}
                onChange={(e) =>
                  setTempDateRange({ ...tempDateRange, end: e.target.value })
                }
                className={`text-[9px] font-bold bg-transparent outline-none w-full ${isDarkMode ? "text-white [color-scheme:dark]" : "text-gray-600"}`}
              />
            </div>
          </div>

          {/* ACTION BUTTONS (Terapkan & Reset) */}
          <div className="grid grid-cols-5 gap-2">
            <button
              onClick={handleApplyFilter}
              disabled={loading}
              className="col-span-4 py-2 bg-[#00a884] hover:bg-[#008f6f] disabled:opacity-50 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-[#00a884]/20"
            >
              <CheckCircle2 size={14} />
              Terapkan Filter
            </button>
            <button
              onClick={handleResetFilter}
              disabled={loading}
              title="Reset Filter"
              className={`col-span-1 py-2 flex items-center justify-center rounded-xl border transition-all active:scale-95 ${
                isDarkMode
                  ? "bg-[#2A3942] border-[#3B4A54] text-[#8696A0] hover:text-white"
                  : "bg-white border-gray-200 text-gray-400 hover:text-gray-600 shadow-sm"
              }`}
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* LIST CONTENT */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <Loader2 className="animate-spin text-[#00a884]" size={32} />
            <p className="text-[10px] font-black uppercase tracking-widest text-[#8696A0]">
              Memuat Data...
            </p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 opacity-60">
            <Target size={32} className="text-[#8696A0] mb-2" />
            <p
              className={`text-[11px] font-bold uppercase ${isDarkMode ? "text-white" : "text-[#3B4A54]"}`}
            >
              Kosong
            </p>
          </div>
        ) : (
          filteredLeads.map((lead) => (
            <div
              key={lead.id}
              onClick={() => onSelectChat?.(lead.remoteJid)}
              className={`flex items-center p-4 border-b cursor-pointer transition-all ${isDarkMode ? "border-[#222D34] hover:bg-[#2A3942]" : "border-gray-50 hover:bg-[#F0F2F5]"}`}
            >
              {/* Avatar & Content tetap sama seperti sebelumnya */}
              <div className="relative flex-shrink-0">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-md"
                  style={{
                    background: lead.source_color
                      ? `linear-gradient(135deg, ${lead.source_color}, ${lead.source_color}dd)`
                      : "linear-gradient(135deg, #8696A0, #667781)",
                  }}
                >
                  {lead.pushName ? lead.pushName[0].toUpperCase() : "?"}
                </div>
              </div>

              <div className="ml-4 flex-1 overflow-hidden">
                <div className="flex justify-between items-start mb-1">
                  <div className="flex flex-col overflow-hidden text-left">
                    <h3
                      className={`font-bold text-[13px] truncate ${isDarkMode ? "text-[#E9EDEF]" : "text-[#111B21]"}`}
                    >
                      {lead.pushName || "Potential Lead"}
                    </h3>
                    <span
                      className={`text-[10px] font-mono ${isDarkMode ? "text-[#8696A0]" : "text-[#667781]"}`}
                    >
                      {lead.remoteJid.split("@")[0]}
                    </span>
                  </div>
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

                <div className="flex items-center gap-2 mt-1.5 text-left">
                  <div
                    className="px-2 py-0.5 rounded-md flex items-center gap-1 border"
                    style={{
                      backgroundColor: `${lead.source_color || "#8696A0"}15`,
                      borderColor: `${lead.source_color || "#8696A0"}40`,
                    }}
                  >
                    <Target
                      size={8}
                      style={{ color: lead.source_color || "#8696A0" }}
                    />
                    <span
                      className="text-[8px] font-black uppercase"
                      style={{ color: lead.source_color || "#8696A0" }}
                    >
                      {lead.lead_source || "Organik"}
                    </span>
                  </div>
                </div>

                <div
                  className={`mt-2 p-2 rounded-lg text-[11px] line-clamp-1 italic text-left ${isDarkMode ? "bg-[#111B21] text-[#8696A0]" : "bg-gray-50 text-[#667781]"}`}
                >
                  "{lead.content}"
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
