import React, { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  AlertCircle,
  RefreshCcw,
  Search,
  Leaf,
  MessageSquare,
  Globe,
  Filter,
  RotateCcw,
  Database,
  Sun,
  Sunrise,
  CalendarDays,
  CalendarRange,
  Calendar,
} from "lucide-react";
import axios from "axios";

interface Lead {
  id: number;
  remoteJid: string;
  content: string;
  updatedAt: string;
  session_id: string;
  pushName: string;
  lead_source: string;
  source_color: string;
  phone_number?: string;
  status?: string;
  status_color?: string;
  status_icon?: string;
}

const DataLeadsPage: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDevice, setSelectedDevice] = useState("all");
  const [socialFilter, setSocialFilter] = useState("all");
  const [availablePlatforms, setAvailablePlatforms] = useState<string[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const toLocalISO = (date: Date) => {
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  };

  const getDefaultDateRange = () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return { start: toLocalISO(start), end: toLocalISO(end) };
  };

  const [tempDateRange, setTempDateRange] = useState(getDefaultDateRange());
  const [appliedDateRange, setAppliedDateRange] = useState(getDefaultDateRange());
  const [datePreset, setDatePreset] = useState("today");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");

      const params: Record<string, string> = {};
      params.startDate = appliedDateRange.start.replace("T", " ") + ":00";
      params.endDate = appliedDateRange.end.replace("T", " ") + ":59";

      const [leadsRes, sessionsRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/chats/leads-only`, {
          params: { ...params, sessionId: selectedDevice },
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${import.meta.env.VITE_API_URL}/sessions`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (leadsRes.data.success) {
        setLeads(leadsRes.data.data || []);
        if (leadsRes.data.platforms) {
          setAvailablePlatforms(leadsRes.data.platforms);
        }
      }

      if (sessionsRes.data.success) {
        setSessions(sessionsRes.data.data || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal memuat data leads");
    } finally {
      setLoading(false);
    }
  }, [selectedDevice, appliedDateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const applyDatePreset = (preset: string) => {
    if (preset === "custom") {
      setDatePreset("custom");
      return;
    }
    setDatePreset(preset);
    const now = new Date();
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    let start = new Date(now);

    switch (preset) {
      case "today":
        start.setHours(0, 0, 0, 0);
        break;
      case "yesterday":
        start.setDate(start.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        end.setDate(end.getDate() - 1);
        end.setHours(23, 59, 59, 999);
        break;
      case "week":
        start.setDate(start.getDate() - start.getDay());
        start.setHours(0, 0, 0, 0);
        break;
      case "month":
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        break;
    }
    const range = { start: toLocalISO(start), end: toLocalISO(end) };
    setTempDateRange(range);
    setAppliedDateRange(range);
  };

  const handleApplyFilter = () => {
    setDatePreset("custom");
    setAppliedDateRange(tempDateRange);
  };

  const handleResetFilter = () => {
    const defaultDates = getDefaultDateRange();
    setTempDateRange(defaultDates);
    setAppliedDateRange(defaultDates);
    setDatePreset("today");
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
      socialFilter === "all" || lead.lead_source?.toLowerCase() === socialFilter.toLowerCase();
    return matchesSearch && matchesSocial;
  });

  const formatPhone = (lead: Lead) => {
    if (lead.phone_number) return `+${lead.phone_number}`;
    const num = (lead.remoteJid || "").split("@")[0];
    if (!num) return "-";
    return `+${num}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getSourceStyle = (source: string) => {
    const map: Record<string, { bg: string; text: string }> = {
      tiktok: { bg: "#FEF2F2", text: "#DC2626" },
      instagram: { bg: "#FDF2F8", text: "#BE185D" },
      facebook: { bg: "#E7F3FF", text: "#1877F2" },
      whatsapp: { bg: "#ECFDF3", text: "#067647" },
      organik: { bg: "#F0F2F5", text: "#65676B" },
    };
    return map[source?.toLowerCase()] || { bg: "#F0F2F5", text: "#65676B" };
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1877F2] to-[#0C5DC7] flex items-center justify-center shrink-0 shadow-sm">
          <Database size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-[#050505]">Data Leads</h1>
          <p className="text-[11px] text-[#65676B]">Data leads dari social media dan organik</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`h-9 px-4 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
            showFilters
              ? "bg-[#1877F2] text-white shadow-sm"
              : "bg-[#F0F2F5] text-[#65676B] hover:bg-[#E4E6EB]"
          }`}
        >
          <Filter size={14} />
          Filter
        </button>
        <button
          onClick={fetchData}
          disabled={loading}
          className="h-9 px-4 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 bg-[#F0F2F5] text-[#65676B] hover:bg-[#E4E6EB] disabled:opacity-50"
        >
          <RefreshCcw size={14} className={loading ? "animate-spin" : ""} />
          Refresh & Sync Kontak
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-[#E4E6EB] p-4 sm:p-5 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            <div>
              <label className="text-[11px] font-semibold text-[#050505] mb-1.5 block">
                Perangkat
              </label>
              <select
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                className="w-full h-9 px-3 border border-[#CCD0D5] rounded-lg text-xs font-medium outline-none bg-white text-[#050505] focus:ring-2 focus:ring-[#1877F2]/20 focus:border-[#1877F2] transition-all"
              >
                <option value="all">Semua Perangkat</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>{s.name || s.id}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[#050505] mb-1.5 block">
                Sumber Social Media
              </label>
              <select
                value={socialFilter}
                onChange={(e) => setSocialFilter(e.target.value)}
                className="w-full h-9 px-3 border border-[#CCD0D5] rounded-lg text-xs font-medium outline-none bg-white text-[#050505] focus:ring-2 focus:ring-[#1877F2]/20 focus:border-[#1877F2] transition-all"
              >
                <option value="all">Semua Sumber</option>
                {availablePlatforms.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
                <option value="Organik">Organik</option>
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="text-[11px] font-semibold text-[#050505] mb-1.5 block">
                Rentang Waktu
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { key: "today", label: "Hari Ini", icon: Sun },
                  { key: "yesterday", label: "Kemarin", icon: Sunrise },
                  { key: "week", label: "Minggu Ini", icon: CalendarDays },
                  { key: "month", label: "Bulan Ini", icon: CalendarRange },
                  { key: "custom", label: "Custom", icon: Calendar },
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => applyDatePreset(key)}
                    className={`h-7 px-2.5 rounded-md text-[11px] font-medium transition-all flex items-center gap-1 ${
                      datePreset === key
                        ? "bg-[#1877F2] text-white shadow-sm"
                        : "bg-[#F0F2F5] text-[#65676B] hover:bg-[#E4E6EB]"
                    }`}
                  >
                    <Icon size={12} />
                    {label}
                  </button>
                ))}
              </div>
              {datePreset === "custom" && (
                <div className="flex items-center gap-2 mt-2.5">
                  <input
                    type="datetime-local"
                    value={tempDateRange.start}
                    onChange={(e) =>
                      setTempDateRange({ ...tempDateRange, start: e.target.value })
                    }
                    className="flex-1 h-9 px-3 border border-[#CCD0D5] rounded-lg text-xs outline-none bg-white text-[#050505] focus:ring-2 focus:ring-[#1877F2]/20 focus:border-[#1877F2] transition-all"
                  />
                  <span className="text-[#BCC0C4] text-xs shrink-0">—</span>
                  <input
                    type="datetime-local"
                    value={tempDateRange.end}
                    onChange={(e) =>
                      setTempDateRange({ ...tempDateRange, end: e.target.value })
                    }
                    className="flex-1 h-9 px-3 border border-[#CCD0D5] rounded-lg text-xs outline-none bg-white text-[#050505] focus:ring-2 focus:ring-[#1877F2]/20 focus:border-[#1877F2] transition-all"
                  />
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#E4E6EB]">
            <button
              onClick={() => { handleApplyFilter(); setShowFilters(false); }}
              className="h-9 px-5 bg-[#1877F2] text-white rounded-lg text-xs font-semibold hover:bg-[#166FE5] transition-all shadow-sm"
            >
              Terapkan Filter
            </button>
            <button
              onClick={handleResetFilter}
              className="h-9 px-3 border border-[#CCD0D5] rounded-lg text-xs text-[#65676B] hover:bg-[#F2F3F5] transition-all flex items-center gap-1.5"
            >
              <RotateCcw size={13} />
              Reset
            </button>
          </div>
        </div>
      )}



      {/* Search & Table Section */}
      <div className="bg-white rounded-xl border border-[#E4E6EB] overflow-hidden shadow-sm">
        <div className="px-4 sm:px-5 py-3.5 border-b border-[#E4E6EB]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#F0F2F5] flex items-center justify-center">
                <MessageSquare size={13} className="text-[#65676B]" />
              </div>
              <h3 className="text-[13px] font-semibold text-[#050505]">Daftar Leads</h3>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#E7F3FF] text-[#1877F2]">
                {filteredLeads.length}
              </span>
            </div>
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C939D]" />
              <input
                type="text"
                placeholder="Cari nama, nomor, atau pesan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-lg text-xs border border-[#CCD0D5] bg-[#F0F2F5] outline-none text-[#050505] placeholder:text-[#8C939D] focus:ring-2 focus:ring-[#1877F2]/20 focus:border-[#1877F2] focus:bg-white transition-all"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="animate-spin" size={28} style={{ color: "#1877F2" }} />
              <p className="text-sm font-medium text-[#65676B]">Memuat data leads...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center py-12">
            <div className="w-12 h-12 rounded-full bg-[#FEF2F2] flex items-center justify-center mb-3">
              <AlertCircle size={24} className="text-[#DC2626]" />
            </div>
            <p className="text-sm font-medium text-[#050505]">{error}</p>
            <button
              onClick={fetchData}
              className="mt-3 px-4 py-1.5 text-xs font-semibold rounded-lg bg-[#F0F2F5] text-[#1877F2] hover:bg-[#E4E6EB] transition-all"
            >
              Coba Lagi
            </button>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <div className="w-12 h-12 rounded-full bg-[#F0F2F5] flex items-center justify-center mb-3">
              <MessageSquare size={24} className="text-[#BCC0C4]" />
            </div>
            <p className="text-sm font-medium text-[#65676B]">Tidak ada leads ditemukan</p>
            <p className="text-xs text-[#8C939D] mt-1">Coba ubah filter atau rentang waktu</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#F8F9FA]">
                  <th className="text-left px-4 sm:px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#65676B] border-b border-[#E4E6EB]">Nama</th>
                  <th className="text-left px-4 sm:px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#65676B] border-b border-[#E4E6EB]">No. WhatsApp</th>
                  <th className="text-left px-4 sm:px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#65676B] border-b border-[#E4E6EB]">Status</th>
                  <th className="text-left px-4 sm:px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#65676B] border-b border-[#E4E6EB]">Sumber</th>
                  <th className="text-left px-4 sm:px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#65676B] border-b border-[#E4E6EB] hidden md:table-cell">Pesan Terakhir</th>
                  <th className="text-left px-4 sm:px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#65676B] border-b border-[#E4E6EB] hidden md:table-cell">Waktu</th>
                  <th className="text-left px-4 sm:px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#65676B] border-b border-[#E4E6EB] hidden lg:table-cell">Perangkat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E6EB]">
                {filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-[#F8F9FA] transition-colors"
                  >
                    <td className="px-4 sm:px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm"
                          style={{ backgroundColor: lead.source_color || "#65676B" }}
                        >
                          {lead.pushName ? lead.pushName[0].toUpperCase() : "?"}
                        </div>
                        <span className="text-[13px] font-semibold text-[#050505] truncate max-w-[160px] sm:max-w-[180px]">
                          {lead.pushName || formatPhone(lead)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 sm:px-5 py-3.5">
                      <span className="text-xs text-[#65676B] font-mono">
                        {formatPhone(lead)}
                      </span>
                    </td>
                    <td className="px-4 sm:px-5 py-3.5">
                      {lead.status ? (
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap"
                          style={{
                            backgroundColor: (lead.status_color || '#E4E6EB') + '20',
                            color: lead.status_color || '#65676B',
                          }}
                        >
                          {lead.status_icon && <span>{lead.status_icon}</span>}
                          {lead.status}
                        </span>
                      ) : (
                        <span className="text-xs text-[#BCC0C4]">-</span>
                      )}
                    </td>
                    <td className="px-4 sm:px-5 py-3.5">
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap"
                        style={{
                          backgroundColor: getSourceStyle(lead.lead_source).bg,
                          color: getSourceStyle(lead.lead_source).text,
                        }}
                      >
                        {lead.lead_source === "Organik" ? (
                          <Leaf size={11} />
                        ) : (
                          <Globe size={11} />
                        )}
                        {lead.lead_source || "Organik"}
                      </span>
                    </td>
                    <td className="px-4 sm:px-5 py-3.5 hidden md:table-cell">
                      <p className="text-xs text-[#65676B] truncate max-w-[200px] lg:max-w-[260px]">
                        {lead.content || "-"}
                      </p>
                    </td>
                    <td className="px-4 sm:px-5 py-3.5 hidden md:table-cell">
                      <span className="text-xs text-[#65676B] whitespace-nowrap">
                        {formatDate(lead.updatedAt)}
                      </span>
                    </td>
                    <td className="px-4 sm:px-5 py-3.5 hidden lg:table-cell">
                      <span className="text-xs text-[#65676B]">
                        {sessions.find(s => s.id === lead.session_id)?.name || lead.session_id}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataLeadsPage;
