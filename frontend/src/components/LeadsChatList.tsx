import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Loader2,
  RefreshCcw,
  RotateCcw,
  MessageSquare,
  Target,
} from "lucide-react";
import useStore from "../store/useStore"; 

interface LeadsChatListProps {
  isDarkMode: boolean;
  sessions: any[];
  onSelectChat?: (chat: any) => void;
}

const LeadsChatList: React.FC<LeadsChatListProps> = ({
  isDarkMode,
  sessions,
  onSelectChat,
}) => {
  const { selectedChat } = useStore();

  const [leads, setLeads] = useState<any[]>([]);
  const [availablePlatforms, setAvailablePlatforms] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDevice, setSelectedDevice] = useState("all");
  const [socialFilter, setSocialFilter] = useState("all");

  const getDefaultDateRange = () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const toLocalISO = (date: Date) => {
      const offset = date.getTimezoneOffset() * 60000;
      return new Date(date.getTime() - offset).toISOString().slice(0, 16);
    };

    return {
      start: toLocalISO(start),
      end: toLocalISO(end),
    };
  };

  const [tempDateRange, setTempDateRange] = useState(getDefaultDateRange());
  const [appliedDateRange, setAppliedDateRange] = useState(getDefaultDateRange());
  const [showFilters, setShowFilters] = useState(false);

  const formatTime = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString([], { day: "2-digit", month: "2-digit" });
  };

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const url = new URL(`${import.meta.env.VITE_API_URL}/chats/leads-only`);

      url.searchParams.append("sessionId", selectedDevice);
      url.searchParams.append("startDate", appliedDateRange.start.replace("T", " ") + ":00");
      url.searchParams.append("endDate", appliedDateRange.end.replace("T", " ") + ":59");

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();

      if (json.success) {
        setLeads(json.data || []);
        // Menyimpan daftar platform unik dari database untuk filter dropdown
        if (json.platforms) {
            setAvailablePlatforms(json.platforms);
        }
      }
    } catch (err) {
      console.error("Error fetching leads:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedDevice, appliedDateRange]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleApplyFilter = () => setAppliedDateRange(tempDateRange);

  const handleResetFilter = () => {
    const defaultDates = getDefaultDateRange();
    setTempDateRange(defaultDates);
    setAppliedDateRange(defaultDates);
    setSelectedDevice("all");
    setSocialFilter("all");
    setSearchTerm("");
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      (lead.pushName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.remoteJid || "").includes(searchTerm) ||
      (lead.content || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSocial =
      socialFilter === "all" || lead.lead_source === socialFilter;

    return matchesSearch && matchesSocial;
  });

  return (
    <div className={`flex flex-col h-full transition-all duration-300 ${isDarkMode ? "bg-[#111B21]" : "bg-white"}`}>
      {/* HEADER SECTION */}
      <div className={`flex flex-col border-b ${isDarkMode ? "bg-[#202C33] border-[#222D34]" : "bg-[#F0F2F5] border-gray-200"}`}>
        <div className="px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h2 className={`text-base font-bold ${isDarkMode ? "text-[#E9EDEF]" : "text-[#111B21]"}`}>
              Monitoring Leads
            </h2>
            <div className="bg-[#00a884] text-[#111B21] text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              {filteredLeads.length}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchLeads}
              className={`p-2 rounded-full hover:bg-black/5 transition-all ${isDarkMode ? "text-[#8696A0]" : "text-[#54656F]"}`}
            >
              <RefreshCcw size={20} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* SEARCH & FILTER BAR */}
        <div className="px-3 pb-2 flex items-center gap-2">
          <div className={`flex-1 flex items-center px-3 py-1.5 rounded-lg ${isDarkMode ? "bg-[#111B21]" : "bg-white"}`}>
            <Search className={`${isDarkMode ? "text-[#8696A0]" : "text-[#54656F]"}`} size={16} />
            <input
              type="text"
              placeholder="Cari lead..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full ml-4 bg-transparent border-none outline-none text-[14px] placeholder:text-[#8696A0]"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-full transition-all ${showFilters ? "bg-[#00a884] text-white" : isDarkMode ? "text-[#8696A0] hover:bg-[#3b4a54]" : "text-[#54656F] hover:bg-gray-200"}`}
          >
            <Target size={20} />
          </button>
        </div>

        {/* FILTER PANEL */}
        {showFilters && (
          <div className={`px-4 py-3 space-y-3 animate-in fade-in duration-200 ${isDarkMode ? "bg-[#202C33]" : "bg-white"}`}>
            <div className="flex flex-col gap-2">
              <label className={`text-[12px] font-semibold ${isDarkMode ? "text-[#00a884]" : "text-[#008069]"}`}>
                Filter Sumber & Perangkat
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={selectedDevice}
                  onChange={(e) => setSelectedDevice(e.target.value)}
                  className={`px-3 py-2 rounded-lg text-xs outline-none border-none ${isDarkMode ? "bg-[#111B21] text-[#E9EDEF]" : "bg-[#F0F2F5] text-[#111B21]"}`}
                >
                  <option value="all">Semua Perangkat</option>
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>{s.name || s.id}</option>
                  ))}
                </select>
                <select
                  value={socialFilter}
                  onChange={(e) => setSocialFilter(e.target.value)}
                  className={`px-3 py-2 rounded-lg text-xs outline-none border-none ${isDarkMode ? "bg-[#111B21] text-[#E9EDEF]" : "bg-[#F0F2F5] text-[#111B21]"}`}
                >
                  <option value="all">Semua Sumber</option>
                  {availablePlatforms.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                  <option value="Organik">Organik</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className={`text-[12px] font-semibold ${isDarkMode ? "text-[#8696A0]" : "text-gray-500"}`}>
                Rentang Waktu
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="datetime-local"
                  value={tempDateRange.start}
                  onChange={(e) => setTempDateRange({ ...tempDateRange, start: e.target.value })}
                  className={`flex-1 p-2 rounded-lg text-[11px] outline-none ${isDarkMode ? "bg-[#111B21] text-white [color-scheme:dark]" : "bg-[#F0F2F5]"}`}
                />
                <span className="text-gray-500">-</span>
                <input
                  type="datetime-local"
                  value={tempDateRange.end}
                  onChange={(e) => setTempDateRange({ ...tempDateRange, end: e.target.value })}
                  className={`flex-1 p-2 rounded-lg text-[11px] outline-none ${isDarkMode ? "bg-[#111B21] text-white [color-scheme:dark]" : "bg-[#F0F2F5]"}`}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => { handleApplyFilter(); setShowFilters(false); }}
                className="flex-1 py-2 bg-[#00a884] text-[#111B21] rounded-full text-xs font-bold hover:shadow-md transition-all"
              >
                Terapkan Filter
              </button>
              <button
                onClick={handleResetFilter}
                className={`px-4 py-2 rounded-full border ${isDarkMode ? "border-[#3b4a54] text-[#8696A0]" : "border-gray-200 text-gray-500"}`}
              >
                <RotateCcw size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* LIST CONTENT */}
      <div className={`flex-1 overflow-y-auto custom-scrollbar relative ${isDarkMode ? "bg-[#111B21]" : "bg-white"}`}>
        {loading ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <Loader2 className="animate-spin text-[#00a884]" size={24} />
            <p className="text-[11px] font-bold text-[#8696A0] uppercase tracking-widest">Sinkronisasi Leads...</p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 opacity-60">
            <MessageSquare size={48} className="text-[#3b4a54] mb-3 stroke-[1px]" />
            <p className="text-[13px] text-[#8696A0]">Tidak ada leads yang ditemukan</p>
          </div>
        ) : (
          <div className={`divide-y ${isDarkMode ? "divide-[#1E2A30]/30" : "divide-gray-100"}`}>
            {filteredLeads.map((lead) => {
              const isSelected = selectedChat?.jid === lead.remoteJid;
              return (
                <div
                  key={lead.id}
                  onClick={() => onSelectChat && onSelectChat({
                    jid: lead.remoteJid,
                    name: lead.pushName || lead.remoteJid.split("@")[0],
                    last_message: lead.content,
                  })}
                  className={`group flex items-center px-4 py-3 cursor-pointer transition-all duration-150 relative border-b select-none ${
                    isDarkMode ? (isSelected ? "bg-[#2A3942]" : "hover:bg-[#1E2A30] border-[#222D34]") : (isSelected ? "bg-[#F0F2F5]" : "hover:bg-gray-50 border-gray-50")
                  }`}
                >
                  {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#00a884]" />}
                  
                  <div className="relative flex-shrink-0">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm transform transition-transform group-hover:scale-105"
                      style={{ background: lead.source_color ? `linear-gradient(135deg, ${lead.source_color}, ${lead.source_color}dd)` : "linear-gradient(135deg, #8696A0, #667781)" }}
                    >
                      {lead.pushName ? lead.pushName[0].toUpperCase() : "?"}
                    </div>
                  </div>

                  <div className="ml-3 flex-1 overflow-hidden">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h3 className={`text-[15px] font-normal truncate leading-tight ${isDarkMode ? "text-[#E9EDEF]" : "text-[#111B21]"}`}>
                        {lead.pushName || lead.remoteJid.split("@")[0]}
                      </h3>
                      <span className={`text-[11px] flex-shrink-0 ${isSelected ? "text-[#00a884] font-semibold" : "text-[#8696A0]"}`}>
                        {formatTime(lead.updatedAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <div
                        className="px-1.5 py-0.5 rounded flex items-center gap-1 border flex-shrink-0"
                        style={{ backgroundColor: `${lead.source_color || "#8696A0"}15`, borderColor: `${lead.source_color || "#8696A0"}30` }}
                      >
                        <span className="text-[9px] font-bold uppercase tracking-tighter" style={{ color: lead.source_color || "#8696A0" }}>
                          {lead.lead_source || "Organik"}
                        </span>
                      </div>
                      <p className={`text-xs truncate flex-1 ${isSelected ? (isDarkMode ? "text-[#E9EDEF]" : "text-[#111B21]") : "text-[#8696A0]"}`}>
                        {lead.content}
                      </p>
                      <div className="opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                        <MessageSquare size={14} className="text-[#00a884]" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadsChatList;