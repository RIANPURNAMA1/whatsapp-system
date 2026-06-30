import React, { useState } from "react";
import { Table, BarChart3, RefreshCw, Calendar, Sun, Sunrise, CalendarDays, CalendarRange } from "lucide-react";

interface ReportDataTableProps {
  reportData: any;
  isLoadingReport: boolean;
  activeSessions: any[];
  selectedSessionId: string;
  onSessionChange: (id: string) => void;
  onFetchReport: (startDate?: string, endDate?: string) => void;
}

export const ReportDataTable: React.FC<ReportDataTableProps> = ({
  reportData,
  isLoadingReport,
  activeSessions,
  selectedSessionId,
  onSessionChange,
  onFetchReport,
}) => {
  const toLocalISO = (date: Date) => {
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  };

  const getDefaultRange = () => {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(); end.setHours(23, 59, 59, 999);
    return { start: toLocalISO(start), end: toLocalISO(end) };
  };

  const [datePreset, setDatePreset] = useState("today");
  const [range, setRange] = useState(getDefaultRange);
  const [showCustom, setShowCustom] = useState(false);

  const applyPreset = (preset: string) => {
    if (preset === "custom") { setDatePreset("custom"); setShowCustom(true); return; }
    setDatePreset(preset);
    setShowCustom(false);
    const now = new Date();
    const end = new Date(now); end.setHours(23, 59, 59, 999);
    const start = new Date(now);
    switch (preset) {
      case "today": start.setHours(0, 0, 0, 0); break;
      case "yesterday": start.setDate(start.getDate() - 1); start.setHours(0, 0, 0, 0); end.setDate(end.getDate() - 1); break;
      case "week": start.setDate(start.getDate() - start.getDay()); start.setHours(0, 0, 0, 0); break;
      case "month": start.setDate(1); start.setHours(0, 0, 0, 0); break;
    }
    setRange({ start: toLocalISO(start), end: toLocalISO(end) });
  };

  const handleFetch = () => {
    onFetchReport(range.start.replace("T", " ") + ":00", range.end.replace("T", " ") + ":59");
  };

  const presets = [
    { key: "today", label: "Hari Ini", icon: Sun },
    { key: "yesterday", label: "Kemarin", icon: Sunrise },
    { key: "week", label: "Minggu Ini", icon: CalendarDays },
    { key: "month", label: "Bulan Ini", icon: CalendarRange },
  ];

  return (
    <div className="mt-8">
      <div className="bg-white rounded-lg border border-[#E4E6EB] p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Table className="text-[#0866FF]" size={20} />
            <h2 className="text-sm font-bold text-[#050505] uppercase tracking-wider">
              Rekap Laporan Leads
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedSessionId}
              onChange={(e) => onSessionChange(e.target.value)}
              className="bg-[#F0F2F5] border border-[#CCD0D5] rounded-lg px-4 py-2.5 text-sm text-[#050505] focus:outline-none focus:ring-2 focus:ring-[#0866FF]"
            >
              <option value="all">Semua Device</option>
              {activeSessions
                .filter((s) => s.status === "connected")
                .map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.name}
                  </option>
                ))}
            </select>
            <button
              onClick={handleFetch}
              disabled={isLoadingReport}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                isLoadingReport
                  ? "bg-[#E4E6EB] text-[#65676B] cursor-not-allowed"
                  : "bg-[#0866FF] text-white hover:bg-[#166FE5]"
              }`}
            >
              {isLoadingReport ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <BarChart3 className="w-4 h-4" />
              )}
              {isLoadingReport ? "Memuat..." : "Tampilkan Laporan"}
            </button>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="flex flex-wrap items-center gap-2 mb-6 pb-4 border-b border-[#E4E6EB]">
          {presets.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => applyPreset(key)}
              className={`h-8 px-3 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                datePreset === key
                  ? "bg-[#0866FF] text-white shadow-sm"
                  : "bg-[#F0F2F5] text-[#65676B] hover:bg-[#E4E6EB]"
              }`}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
          <button
            onClick={() => applyPreset("custom")}
            className={`h-8 px-3 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              datePreset === "custom"
                ? "bg-[#0866FF] text-white shadow-sm"
                : "bg-[#F0F2F5] text-[#65676B] hover:bg-[#E4E6EB]"
            }`}
          >
            <Calendar size={13} />
            Custom
          </button>
          {showCustom && (
            <div className="flex items-center gap-2 ml-1">
              <input
                type="datetime-local"
                value={range.start}
                onChange={(e) => { setRange(r => ({ ...r, start: e.target.value })); setDatePreset("custom"); }}
                className="h-8 px-2 border border-[#CCD0D5] rounded-lg text-xs outline-none"
              />
              <span className="text-[#BCC0C4] text-xs">—</span>
              <input
                type="datetime-local"
                value={range.end}
                onChange={(e) => { setRange(r => ({ ...r, end: e.target.value })); setDatePreset("custom"); }}
                className="h-8 px-2 border border-[#CCD0D5] rounded-lg text-xs outline-none"
              />
            </div>
          )}
        </div>

        {isLoadingReport ? (
          <div className="flex items-center justify-center py-10">
            <RefreshCw className="w-6 h-6 animate-spin text-[#65676B]" />
          </div>
        ) : reportData ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-[#050505]">
              <thead className="text-xs uppercase bg-[#F0F2F5] text-[#65676B]">
                <tr>
                  <th className="px-4 py-3">Device</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Total Leads</th>
                  <th className="px-4 py-3">Leads Organik</th>
                  <th className="px-4 py-3">Total Closing</th>
                  <th className="px-4 py-3">Conv Rate</th>
                  <th className="px-4 py-3">Platform Details</th>
                </tr>
              </thead>
              <tbody>
                {reportData.stats?.sessionStats?.map((session: any, idx: number) => (
                  <tr key={idx} className="border-b border-[#E4E6EB] hover:bg-[#F2F3F5]">
                    <td className="px-4 py-3 font-semibold">{session.sessionName}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                        session.sessionStatus === "connected" ? "bg-[#E7F3FF] text-[#0866FF]" : "bg-[#FFEBEE] text-red-500"
                      }`}>
                        {session.sessionStatus === "connected" ? "Terhubung" : "Putus"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-[#0866FF]">{session.totalLeads || 0}</td>
                    <td className="px-4 py-3">{session.totalOrganik || 0}</td>
                    <td className="px-4 py-3 font-bold text-[#31A24C]">{session.totalClosing || 0}</td>
                    <td className="px-4 py-3">
                      <span className={`font-bold ${session.totalLeads > 0 && session.totalClosing / session.totalLeads >= 0.5 ? 'text-[#31A24C]' : 'text-[#F5A623]'}`}>
                        {session.totalLeads > 0 ? Math.round((session.totalClosing / session.totalLeads) * 100) : 0}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(session)
                          .filter(([key]) => key.startsWith("leads_") && session[key] > 0)
                          .map(([key, count]: [string, any]) => (
                            <span key={key} className="px-2 py-1 bg-[#E7F3FF] text-[#0866FF] rounded text-xs">
                              {key.replace("leads_", "").charAt(0).toUpperCase() + key.replace("leads_", "").slice(1)}: {count}
                            </span>
                          ))}
                      </div>
                    </td>
                  </tr>
                ))}
                {reportData.stats?.sessionStats && reportData.stats.sessionStats.length > 1 && (
                  <tr className="bg-[#F0F2F5] font-bold">
                    <td className="px-4 py-3">TOTAL</td>
                    <td className="px-4 py-3">-</td>
                    <td className="px-4 py-3 text-[#0866FF]">{reportData.stats.grandTotalLeads || 0}</td>
                    <td className="px-4 py-3">{reportData.stats.grandTotalOrganik || 0}</td>
                    <td className="px-4 py-3 text-[#31A24C]">{reportData.stats.grandTotalClosing || 0}</td>
                    <td className="px-4 py-3">{reportData.stats.convRate || 0}%</td>
                    <td className="px-4 py-3">-</td>
                  </tr>
                )}
              </tbody>
            </table>

            {reportData.stats?.tiktokLeads && reportData.stats.tiktokLeads[0] && reportData.stats.tiktokLeads[0].total > 0 && (
              <div className="mt-6 p-4 bg-[#E7F3FF] rounded-lg border border-[#0866FF]">
                <h3 className="text-sm font-bold text-[#0866FF] mb-3">TikTok Leads</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-white p-3 rounded-lg text-center">
                    <p className="text-xs text-[#65676B]">Total</p>
                    <p className="text-lg font-bold text-[#0866FF]">{reportData.stats.tiktokLeads[0].total}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg text-center">
                    <p className="text-xs text-[#65676B]">Baru</p>
                    <p className="text-lg font-bold text-[#0866FF]">{reportData.stats.tiktokLeads[0].new_count || 0}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg text-center">
                    <p className="text-xs text-[#65676B]">Dihubungi</p>
                    <p className="text-lg font-bold text-[#F5A623]">{reportData.stats.tiktokLeads[0].contacted_count || 0}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg text-center">
                    <p className="text-xs text-[#65676B]">Converted</p>
                    <p className="text-lg font-bold text-[#31A24C]">{reportData.stats.tiktokLeads[0].converted_count || 0}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center py-10 text-center">
            <Table className="w-10 h-10 text-[#E4E6EB] mb-3" />
            <p className="text-sm text-[#65676B]">Klik "Tampilkan Laporan" untuk melihat data</p>
          </div>
        )}
      </div>
    </div>
  );
};
