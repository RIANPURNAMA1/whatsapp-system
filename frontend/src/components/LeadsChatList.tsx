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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface LeadsChatListProps {
  sessions: any[];
  onSelectChat?: (chat: any) => void;
}

const LeadsChatList: React.FC<LeadsChatListProps> = ({
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
    <div className="flex flex-col h-full bg-white border-r" style={{ borderColor: "#E4E6EB" }}>
      {/* HEADER SECTION */}
      <div className="border-b" style={{ borderColor: "#E4E6EB" }}>
        <div className="px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#E7F3FF" }}>
              <MessageSquare size={18} style={{ color: "#1877F2" }} />
            </div>
            <div>
              <h2 className="text-[15px] font-bold" style={{ color: "#050505" }}>
                Monitoring Leads
              </h2>
              <p className="text-[11px]" style={{ color: "#65676B" }}>{filteredLeads.length} leads</p>
            </div>
          </div>
          <button
            onClick={fetchLeads}
            className="p-2 rounded-lg transition-all"
            style={{ color: "#65676B" }}
          >
            <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* SEARCH & FILTER BAR */}
        <div className="px-4 pb-3 flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#65676B" }} />
            <Input
              type="text"
              placeholder="Cari lead..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rounded-lg border-0 text-xs"
              style={{ backgroundColor: "#F0F2F5" }}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 rounded-lg transition-all"
            style={{
              backgroundColor: showFilters ? "#1877F2" : "#F0F2F5",
              color: showFilters ? "#FFFFFF" : "#65676B",
            }}
          >
            <Target size={18} />
          </button>
        </div>

        {/* FILTER PANEL */}
        {showFilters && (
          <div className="px-4 py-4 space-y-4 border-t" style={{ backgroundColor: "#F8F9FA", borderColor: "#E4E6EB" }}>
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-semibold" style={{ color: "#050505" }}>
                Filter Sumber & Perangkat
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={selectedDevice}
                  onChange={(e) => setSelectedDevice(e.target.value)}
                  className="px-3 py-2 rounded-lg text-xs outline-none"
                  style={{ backgroundColor: "#FFFFFF", border: "1px solid #CCD0D5", color: "#050505" }}
                >
                  <option value="all">Semua Perangkat</option>
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>{s.name || s.id}</option>
                  ))}
                </select>
                <select
                  value={socialFilter}
                  onChange={(e) => setSocialFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg text-xs outline-none"
                  style={{ backgroundColor: "#FFFFFF", border: "1px solid #CCD0D5", color: "#050505" }}
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
              <label className="text-[11px] font-semibold" style={{ color: "#050505" }}>
                Rentang Waktu
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="datetime-local"
                  value={tempDateRange.start}
                  onChange={(e) => setTempDateRange({ ...tempDateRange, start: e.target.value })}
                  className="flex-1 p-2 rounded-lg text-[11px] outline-none"
                  style={{ backgroundColor: "#FFFFFF", border: "1px solid #CCD0D5", color: "#050505" }}
                />
                <span style={{ color: "#BCC0C4" }}>-</span>
                <input
                  type="datetime-local"
                  value={tempDateRange.end}
                  onChange={(e) => setTempDateRange({ ...tempDateRange, end: e.target.value })}
                  className="flex-1 p-2 rounded-lg text-[11px] outline-none"
                  style={{ backgroundColor: "#FFFFFF", border: "1px solid #CCD0D5", color: "#050505" }}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                onClick={() => { handleApplyFilter(); setShowFilters(false); }}
                className="flex-1 text-white rounded-lg text-xs font-semibold border-0"
                style={{ backgroundColor: "#1877F2" }}
              >
                Terapkan Filter
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilter}
                className="px-3 rounded-lg text-xs"
                style={{ borderColor: "#CCD0D5", color: "#65676B" }}
              >
                <RotateCcw size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* LIST CONTENT */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <Loader2 className="animate-spin" size={22} style={{ color: "#1877F2" }} />
            <p className="text-[11px] font-semibold uppercase" style={{ color: "#65676B" }}>Sinkronisasi Leads...</p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: "#F0F2F5" }}>
              <MessageSquare size={28} style={{ color: "#BCC0C4" }} />
            </div>
            <p className="text-[13px]" style={{ color: "#65676B" }}>Tidak ada leads yang ditemukan</p>
          </div>
        ) : (
          <div>
            {filteredLeads.map((lead) => {
              const isSelected = selectedChat?.jid === lead.remoteJid;
              return (
                <div
                  key={lead.id}
                  onClick={() => onSelectChat && onSelectChat({
                    jid: lead.remoteJid,
                    name: lead.pushName || lead.remoteJid.split("@")[0],
                    last_message: lead.content,
                    session_id: lead.session_id,
                  })}
                  className="group flex items-center px-4 py-3 cursor-pointer transition-all duration-150"
                  style={{
                    backgroundColor: isSelected ? "#E7F3FF" : "transparent",
                  }}
                >
                  <div className="relative flex-shrink-0">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: lead.source_color || "#65676B" }}
                    >
                      {lead.pushName ? lead.pushName[0].toUpperCase() : "?"}
                    </div>
                  </div>

                  <div className="ml-3 flex-1 overflow-hidden">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h3 className="text-[14px] font-semibold truncate leading-tight" style={{ color: "#050505" }}>
                        {lead.pushName || lead.remoteJid.split("@")[0]}
                      </h3>
                      <span className="text-[11px] flex-shrink-0 ml-2" style={{ color: isSelected ? "#1877F2" : "#65676B" }}>
                        {formatTime(lead.updatedAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <div
                        className="px-2 py-0.5 rounded-md flex items-center gap-1 flex-shrink-0 text-[9px] font-semibold uppercase"
                        style={{
                          backgroundColor: `${lead.source_color || "#65676B"}15`,
                          color: lead.source_color || "#65676B",
                        }}
                      >
                        {lead.lead_source || "Organik"}
                      </div>
                      <p className="text-xs truncate flex-1" style={{ color: "#65676B" }}>
                        {lead.content}
                      </p>
                      <div className="opacity-0 group-hover:opacity-100 transition-all">
                        <MessageSquare size={13} style={{ color: "#1877F2" }} />
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
