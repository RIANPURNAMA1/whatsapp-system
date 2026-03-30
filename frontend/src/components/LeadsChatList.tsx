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
    <div className="flex flex-col h-full bg-white">
      {/* HEADER SECTION */}
      <div className="border-b border-gray-100 bg-white">
        <div className="px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
              <MessageSquare size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Monitoring Leads
              </h2>
              <p className="text-[11px] text-gray-500">{filteredLeads.length} leads</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchLeads}
            className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
          >
            <RefreshCcw size={20} className={loading ? "animate-spin" : ""} />
          </Button>
        </div>

        {/* SEARCH & FILTER BAR */}
        <div className="px-4 pb-3 flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Cari lead..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-100 border-transparent focus:bg-white focus:border-blue-300 rounded-xl"
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg transition-all ${showFilters ? "bg-blue-500 text-white hover:bg-blue-600" : "text-gray-500 hover:bg-gray-100"}`}
          >
            <Target size={20} />
          </Button>
        </div>

        {/* FILTER PANEL */}
        {showFilters && (
          <div className="px-4 py-4 space-y-4 bg-gray-50 border-t border-gray-100 animate-in fade-in duration-200">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray-700">
                Filter Sumber & Perangkat
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={selectedDevice}
                  onChange={(e) => setSelectedDevice(e.target.value)}
                  className="px-3 py-2 rounded-xl text-xs outline-none bg-white border border-gray-200 text-gray-700 focus:border-blue-300"
                >
                  <option value="all">Semua Perangkat</option>
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>{s.name || s.id}</option>
                  ))}
                </select>
                <select
                  value={socialFilter}
                  onChange={(e) => setSocialFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl text-xs outline-none bg-white border border-gray-200 text-gray-700 focus:border-blue-300"
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
              <label className="text-xs font-semibold text-gray-600">
                Rentang Waktu
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="datetime-local"
                  value={tempDateRange.start}
                  onChange={(e) => setTempDateRange({ ...tempDateRange, start: e.target.value })}
                  className="flex-1 p-2 rounded-xl text-[11px] outline-none bg-white border border-gray-200 focus:border-blue-300"
                />
                <span className="text-gray-400">-</span>
                <input
                  type="datetime-local"
                  value={tempDateRange.end}
                  onChange={(e) => setTempDateRange({ ...tempDateRange, end: e.target.value })}
                  className="flex-1 p-2 rounded-xl text-[11px] outline-none bg-white border border-gray-200 focus:border-blue-300"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                onClick={() => { handleApplyFilter(); setShowFilters(false); }}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-xs font-bold"
              >
                Terapkan Filter
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilter}
                className="px-3 rounded-full border-gray-200 text-gray-500 hover:bg-gray-100"
              >
                <RotateCcw size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* LIST CONTENT */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <Loader2 className="animate-spin text-blue-500" size={24} />
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Sinkronisasi Leads...</p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
              <MessageSquare size={32} className="text-gray-400" />
            </div>
            <p className="text-[13px] text-gray-500">Tidak ada leads yang ditemukan</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
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
                  className={`group flex items-center px-4 py-3 cursor-pointer transition-all duration-150 relative border-b border-gray-50 ${
                    isSelected ? "bg-blue-50" : "hover:bg-gray-50"
                  }`}
                >
                  {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />}
                  
                  <div className="relative flex-shrink-0">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm transform transition-transform group-hover:scale-105"
                      style={{ background: lead.source_color ? `linear-gradient(135deg, ${lead.source_color}, ${lead.source_color}dd)` : "linear-gradient(135deg, #8696A0, #667781)" }}
                    >
                      {lead.pushName ? lead.pushName[0].toUpperCase() : "?"}
                    </div>
                  </div>

                  <div className="ml-3 flex-1 overflow-hidden">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h3 className="text-[15px] font-medium text-gray-900 truncate leading-tight">
                        {lead.pushName || lead.remoteJid.split("@")[0]}
                      </h3>
                      <span className={`text-[11px] flex-shrink-0 ml-2 ${isSelected ? "text-blue-500 font-semibold" : "text-gray-400"}`}>
                        {formatTime(lead.updatedAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <div
                        className="px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0"
                        style={{ backgroundColor: `${lead.source_color || "#8696A0"}15`, border: `1px solid ${lead.source_color || "#8696A0"}30` }}
                      >
                        <span className="text-[9px] font-bold uppercase" style={{ color: lead.source_color || "#8696A0" }}>
                          {lead.lead_source || "Organik"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate flex-1">
                        {lead.content}
                      </p>
                      <div className="opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                        <MessageSquare size={14} className="text-blue-500" />
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
