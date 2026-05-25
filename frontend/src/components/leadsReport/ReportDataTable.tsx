import React from "react";
import { Table, BarChart3, RefreshCw } from "lucide-react";

interface ReportDataTableProps {
  reportData: any;
  isLoadingReport: boolean;
  activeSessions: any[];
  selectedSessionId: string;
  onSessionChange: (id: string) => void;
  onFetchReport: () => void;
}

export const ReportDataTable: React.FC<ReportDataTableProps> = ({
  reportData,
  isLoadingReport,
  activeSessions,
  selectedSessionId,
  onSessionChange,
  onFetchReport,
}) => {
  return (
    <div className="mt-8">
      <div className="bg-white rounded-lg border border-[#E4E6EB] p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Table className="text-[#1877F2]" size={20} />
            <h2 className="text-sm font-bold text-[#050505] uppercase tracking-wider">
              Rekap Laporan Leads
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedSessionId}
              onChange={(e) => onSessionChange(e.target.value)}
              className="bg-[#F0F2F5] border border-[#CCD0D5] rounded-lg px-4 py-2.5 text-sm text-[#050505] focus:outline-none focus:ring-2 focus:ring-[#1877F2]"
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
              onClick={onFetchReport}
              disabled={isLoadingReport}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                isLoadingReport
                  ? "bg-[#E4E6EB] text-[#65676B] cursor-not-allowed"
                  : "bg-[#1877F2] text-white hover:bg-[#166FE5]"
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
                        session.sessionStatus === "connected" ? "bg-[#E7F3FF] text-[#1877F2]" : "bg-[#FFEBEE] text-red-500"
                      }`}>
                        {session.sessionStatus === "connected" ? "Terhubung" : "Putus"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-[#1877F2]">{session.totalLeads || 0}</td>
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
                            <span key={key} className="px-2 py-1 bg-[#E7F3FF] text-[#1877F2] rounded text-xs">
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
                    <td className="px-4 py-3 text-[#1877F2]">{reportData.stats.grandTotalLeads || 0}</td>
                    <td className="px-4 py-3">{reportData.stats.grandTotalOrganik || 0}</td>
                    <td className="px-4 py-3 text-[#31A24C]">{reportData.stats.grandTotalClosing || 0}</td>
                    <td className="px-4 py-3">{reportData.stats.convRate || 0}%</td>
                    <td className="px-4 py-3">-</td>
                  </tr>
                )}
              </tbody>
            </table>

            {reportData.stats?.tiktokLeads && reportData.stats.tiktokLeads[0] && reportData.stats.tiktokLeads[0].total > 0 && (
              <div className="mt-6 p-4 bg-[#E7F3FF] rounded-lg border border-[#1877F2]">
                <h3 className="text-sm font-bold text-[#1877F2] mb-3">TikTok Leads</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-white p-3 rounded-lg text-center">
                    <p className="text-xs text-[#65676B]">Total</p>
                    <p className="text-lg font-bold text-[#1877F2]">{reportData.stats.tiktokLeads[0].total}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg text-center">
                    <p className="text-xs text-[#65676B]">Baru</p>
                    <p className="text-lg font-bold text-[#1877F2]">{reportData.stats.tiktokLeads[0].new_count || 0}</p>
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
