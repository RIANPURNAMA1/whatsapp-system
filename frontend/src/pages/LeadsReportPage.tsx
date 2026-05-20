import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Clock,
  Calendar,
  Send,
  Bell,
  Save,
  RefreshCw,
  BarChart3,
  Users,
  MessageSquare,
  AlertCircle,
  Table,
} from "lucide-react";

const DAYS = [
  { id: 1, label: "Sen" },
  { id: 2, label: "Sel" },
  { id: 3, label: "Rab" },
  { id: 4, label: "Kam" },
  { id: 5, label: "Jum" },
  { id: 6, label: "Sab" },
  { id: 0, label: "Min" },
];

export const LeadsReportPage: React.FC = () => {
  const [settings, setSettings] = useState({
    isEnabled: false,
    reportTime: "17:00",
    reportDays: "1,2,3,4,5",
    targetGroups: [] as string[],
    queueDelay: 3000,
  });

  const [groups, setGroups] = useState<any[]>([]);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  const fetchSettings = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/leads-report/settings`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      if (res.data.success) {
        const data = res.data.data;
        setSettings({
          isEnabled: data.is_enabled === 1,
          reportTime: data.report_time ? data.report_time.substring(0, 5) : "17:00",
          reportDays: data.report_days || "1,2,3,4,5",
          targetGroups: data.target_groups || [],
          queueDelay: data.queue_delay || 3000,
        });
      }
    } catch (err) {
      console.error("Failed to fetch report settings:", err);
    }
  };

  const fetchActiveSessions = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/sessions`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      if (res.data.success) {
        setActiveSessions(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
    }
  };

  const fetchGroups = async () => {
    setIsFetching(true);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/leads-report/groups`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      if (res.data.success) {
        setGroups(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch groups:", err);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchGroups();
    fetchActiveSessions();
  }, []);

  const toggleDay = (dayId: number) => {
    const currentDays = settings.reportDays
      ? settings.reportDays.split(",").map((d) => parseInt(d.trim()))
      : [];
    const newDays = currentDays.includes(dayId)
      ? currentDays.filter((d: number) => d !== dayId)
      : [...currentDays, dayId].sort((a, b) => a - b);
    setSettings({ ...settings, reportDays: newDays.join(",") });
  };

  const toggleGroup = (groupJid: string) => {
    const newGroups = settings.targetGroups.includes(groupJid)
      ? settings.targetGroups.filter((g: string) => g !== groupJid)
      : [...settings.targetGroups, groupJid];
    setSettings({ ...settings, targetGroups: newGroups });
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/leads-report/settings`,
        {
          isEnabled: settings.isEnabled,
          reportTime: settings.reportTime + ":00",
          reportDays: settings.reportDays,
          targetGroups: settings.targetGroups,
          queueDelay: settings.queueDelay,
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      if (res.data.success) {
        toast.success("Pengaturan laporan berhasil disimpan!");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal menyimpan pengaturan");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendNow = async () => {
    if (settings.targetGroups.length === 0) {
      toast.error("Pilih minimal 1 grup tujuan");
      return;
    }
    setIsSending(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/leads-report/send-now`,
        {
          groupJids: settings.targetGroups,
          sessionId: selectedSessionId === "all" ? undefined : selectedSessionId,
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      if (res.data.success) {
        toast.success(res.data.message);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal mengirim laporan");
    } finally {
      setIsSending(false);
    }
  };

  const fetchReportData = async () => {
    setIsLoadingReport(true);
    try {
      const params = selectedSessionId !== "all" ? { sessionId: selectedSessionId } : {};
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/leads-report/data`,
        {
          params,
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        }
      );
      if (res.data.success) {
        setReportData(res.data.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal mengambil data laporan");
    } finally {
      setIsLoadingReport(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      <div className=" mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#050505] flex items-center gap-3">
                <div className="w-10 h-10 bg-[#1877F2] rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                Laporan Leads
              </h1>
              <p className="text-[#65676B] text-sm mt-1">
                Otomatis kirim laporan leads harian ke grup WhatsApp
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <select
                  value={selectedSessionId}
                  onChange={(e) => setSelectedSessionId(e.target.value)}
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
                  onClick={handleSendNow}
                  disabled={isSending || settings.targetGroups.length === 0}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    isSending || settings.targetGroups.length === 0
                      ? "bg-[#E4E6EB] text-[#65676B] cursor-not-allowed"
                      : "bg-[#1877F2] text-white hover:bg-[#166FE5]"
                  }`}
                >
                  {isSending ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {isSending ? "Mengirim..." : "Kirim Sekarang"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT: Settings */}
          <div className="space-y-6">
            {/* Auto-Send Toggle */}
            <div className="bg-white p-5 rounded-lg border border-[#E4E6EB]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Bell className="text-[#1877F2]" size={20} />
                  <h2 className="text-sm font-bold text-[#050505] uppercase tracking-wider">
                    Kirim Otomatis
                  </h2>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, isEnabled: !settings.isEnabled })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all ${
                    settings.isEnabled ? "bg-[#1877F2]" : "bg-[#E4E6EB]"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.isEnabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              {settings.isEnabled ? (
                <p className="text-xs text-[#31A24C] bg-[#F0F2F5] p-3 rounded-lg border border-[#E4E6EB]">
                  Laporan akan dikirim otomatis setiap hari sesuai jadwal
                </p>
              ) : (
                <p className="text-xs text-[#65676B] italic">
                  Aktifkan untuk mengirim laporan otomatis ke grup
                </p>
              )}
            </div>

            {/* Schedule Time */}
            <div className="bg-white p-5 rounded-lg border border-[#E4E6EB]">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="text-[#1877F2]" size={20} />
                <h2 className="text-sm font-bold text-[#050505] uppercase tracking-wider">
                  Jam Kirim Laporan
                </h2>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="time"
                  value={settings.reportTime}
                  onChange={(e) => setSettings({ ...settings, reportTime: e.target.value })}
                  className="bg-[#F0F2F5] border border-[#CCD0D5] rounded-lg px-4 py-3 text-lg font-bold text-[#050505] focus:outline-none focus:ring-2 focus:ring-[#1877F2]"
                />
                <p className="text-xs text-[#65676B]">
                  Laporan akan dikirim pada jam ini setiap hari aktif
                </p>
              </div>
            </div>

            {/* Active Days */}
            <div className="bg-white p-5 rounded-lg border border-[#E4E6EB]">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="text-[#1877F2]" size={20} />
                <h2 className="text-sm font-bold text-[#050505] uppercase tracking-wider">
                  Hari Aktif
                </h2>
              </div>
              <div className="flex gap-2 flex-wrap">
                {DAYS.map((day) => {
                  const isSelected = settings.reportDays
                    ?.split(",")
                    .map((d) => parseInt(d.trim()))
                    .includes(day.id);
                  return (
                    <button
                      key={day.id}
                      onClick={() => toggleDay(day.id)}
                      className={`w-12 h-12 rounded-lg text-xs font-bold transition-all ${
                        isSelected
                          ? "bg-[#1877F2] text-white"
                          : "bg-[#F0F2F5] text-[#65676B] hover:bg-[#E4E6EB]"
                      }`}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Queue Delay Setting */}
            <div className="bg-white p-5 rounded-lg border border-[#E4E6EB]">
              <div className="flex items-center gap-3 mb-4">
                <RefreshCw className="text-[#1877F2]" size={20} />
                <h2 className="text-sm font-bold text-[#050505] uppercase tracking-wider">
                  Delay Antar Device
                </h2>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  min="1000"
                  max="30000"
                  step="500"
                  value={settings.queueDelay}
                  onChange={(e) => setSettings({ ...settings, queueDelay: parseInt(e.target.value) || 3000 })}
                  className="bg-[#F0F2F5] border border-[#CCD0D5] rounded-lg px-4 py-3 text-lg font-bold text-[#050505] focus:outline-none focus:ring-2 focus:ring-[#1877F2] w-32"
                />
                <div>
                  <p className="text-xs text-[#65676B]">Jeda antar device (milidetik)</p>
                  <p className="text-xs text-[#65676B] mt-1">1000ms = 1 detik. Default: 3000ms (3 detik)</p>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={isLoading}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${
                isLoading
                  ? "bg-[#E4E6EB] text-[#65676B] cursor-not-allowed"
                  : "bg-[#1877F2] text-white hover:bg-[#166FE5]"
              }`}
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isLoading ? "Menyimpan..." : "Simpan Pengaturan"}
            </button>
          </div>

          {/* RIGHT: Group Selection */}
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-lg border border-[#E4E6EB]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Users className="text-[#1877F2]" size={20} />
                  <h2 className="text-sm font-bold text-[#050505] uppercase tracking-wider">
                    Pilih Grup Tujuan
                  </h2>
                </div>
                <span className="text-xs font-semibold bg-[#E7F3FF] text-[#1877F2] px-3 py-1 rounded-full">
                  {settings.targetGroups.length} dipilih
                </span>
              </div>

              {isFetching ? (
                <div className="flex items-center justify-center py-10">
                  <RefreshCw className="w-6 h-6 animate-spin text-[#65676B]" />
                </div>
              ) : groups.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <AlertCircle className="w-10 h-10 text-[#E4E6EB] mb-3" />
                  <p className="text-sm text-[#65676B]">Belum ada grup yang tersinkron</p>
                  <p className="text-xs text-[#65676B] mt-1">
                    Pastikan device sudah terhubung dan memiliki grup
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                  {groups.map((group) => {
                    const isSelected = settings.targetGroups.includes(group.jid);
                    return (
                      <label
                        key={group.jid}
                        className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? "bg-[#E7F3FF] border-[#1877F2]"
                            : "bg-[#F0F2F5] border-[#E4E6EB] hover:border-[#CCD0D5]"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleGroup(group.jid)}
                          className="w-5 h-5 rounded border-[#CCD0D5] text-[#1877F2] focus:ring-[#1877F2]"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#050505] truncate">
                            {group.subject || "No Name"}
                          </p>
                          <p className="text-xs text-[#65676B]">
                            {group.session_name} • {group.participant_count || 0} peserta
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Preview */}
            {settings.targetGroups.length > 0 && (
              <div className="bg-[#FFF8E7] border border-[#F5A623] p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <MessageSquare className="text-[#F5A623] shrink-0 mt-0.5" size={18} />
                  <div>
                    <p className="text-sm font-semibold text-[#050505]">Preview Grup Tujuan:</p>
                    <div className="mt-2 space-y-1">
                      {settings.targetGroups.map((jid) => {
                        const group = groups.find((g) => g.jid === jid);
                        return (
                          <p key={jid} className="text-xs text-[#65676B]">
                            • {group?.subject || jid}
                          </p>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Report Table Section */}
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
                  onChange={(e) => setSelectedSessionId(e.target.value)}
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
                  onClick={fetchReportData}
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
                    {/* Total Row */}
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

                {/* TikTok Leads Section */}
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
      </div>
    </div>
  );
};
