import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  BarChart3,
  Send,
  RefreshCw,
} from "lucide-react";
import { DailyReportSettings } from "../components/leadsReport/DailyReportSettings";
import { WeeklyReportSettings } from "../components/leadsReport/WeeklyReportSettings";
import { MonthlyReportSettings } from "../components/leadsReport/MonthlyReportSettings";
import { ReportGroupSelector } from "../components/leadsReport/ReportGroupSelector";
import { ReportDataTable } from "../components/leadsReport/ReportDataTable";

const PERIOD_TABS = [
  { id: "daily", label: "Harian", icon: "📅" },
  { id: "weekly", label: "Mingguan", icon: "📆" },
  { id: "monthly", label: "Bulanan", icon: "📊" },
];

export const LeadsReportPage: React.FC = () => {
  const [activePeriod, setActivePeriod] = useState("daily");

  const [dailySettings, setDailySettings] = useState({
    isEnabled: false,
    reportTime: "17:00",
    reportDays: "1,2,3,4,5",
    targetGroups: [] as string[],
    queueDelay: 3000,
  });

  const [weeklySettings, setWeeklySettings] = useState({
    isEnabled: false,
    reportTime: "08:00",
    weeklyReportDay: 1,
    queueDelay: 3000,
  });

  const [monthlySettings, setMonthlySettings] = useState({
    isEnabled: false,
    reportTime: "08:00",
    monthlyReportDate: 1,
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

  const getTargetGroups = () => dailySettings.targetGroups;

  const fetchSettings = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/leads-report/settings`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      if (res.data.success) {
        const data = res.data.data;
        setDailySettings({
          isEnabled: data.is_enabled === 1 && (data.report_frequency === 'daily' || !data.report_frequency),
          reportTime: data.report_time ? data.report_time.substring(0, 5) : "17:00",
          reportDays: data.report_days || "1,2,3,4,5",
          targetGroups: data.target_groups || [],
          queueDelay: data.queue_delay || 3000,
        });
        setWeeklySettings({
          isEnabled: data.is_enabled === 1 && data.report_frequency === 'weekly',
          reportTime: data.report_time ? data.report_time.substring(0, 5) : "08:00",
          weeklyReportDay: data.weekly_report_day !== null ? data.weekly_report_day : 1,
          queueDelay: data.queue_delay || 3000,
        });
        setMonthlySettings({
          isEnabled: data.is_enabled === 1 && data.report_frequency === 'monthly',
          reportTime: data.report_time ? data.report_time.substring(0, 5) : "08:00",
          monthlyReportDate: data.monthly_report_date !== null ? data.monthly_report_date : 1,
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

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const settings =
        activePeriod === "daily"
          ? dailySettings
          : activePeriod === "weekly"
          ? weeklySettings
          : monthlySettings;

      const body: any = {
        isEnabled: settings.isEnabled,
        reportTime: settings.reportTime + ":00",
        queueDelay: settings.queueDelay,
        reportFrequency: activePeriod,
        targetGroups: dailySettings.targetGroups,
        reportDays: dailySettings.reportDays,
        weeklyReportDay: activePeriod === "weekly" ? (settings as any).weeklyReportDay : weeklySettings.weeklyReportDay,
        monthlyReportDate: activePeriod === "monthly" ? (settings as any).monthlyReportDate : monthlySettings.monthlyReportDate,
      };

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/leads-report/settings`,
        body,
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
    if (dailySettings.targetGroups.length === 0) {
      toast.error("Pilih minimal 1 grup tujuan");
      return;
    }
    setIsSending(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/leads-report/send-now`,
        {
          groupJids: dailySettings.targetGroups,
          sessionId: selectedSessionId === "all" ? undefined : selectedSessionId,
          period: activePeriod,
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

  const fetchReportData = useCallback(async () => {
    setIsLoadingReport(true);
    try {
      const params: any = { period: activePeriod };
      if (selectedSessionId !== "all") params.sessionId = selectedSessionId;
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
  }, [selectedSessionId, activePeriod]);

  const toggleGroup = (groupJid: string) => {
    const tg = dailySettings.targetGroups;
    const newGroups = tg.includes(groupJid)
      ? tg.filter((g: string) => g !== groupJid)
      : [...tg, groupJid];
    setDailySettings({ ...dailySettings, targetGroups: newGroups });
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                Kelola laporan leads harian, mingguan, dan bulanan
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
                  disabled={isSending || dailySettings.targetGroups.length === 0}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    isSending || dailySettings.targetGroups.length === 0
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

        {/* Period Tabs */}
        <div className="flex gap-1 bg-white rounded-lg border border-[#E4E6EB] p-1 mb-6">
          {PERIOD_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActivePeriod(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-semibold transition-all ${
                activePeriod === tab.id
                  ? "bg-[#1877F2] text-white shadow-sm"
                  : "text-[#65676B] hover:bg-[#F0F2F5]"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT: Settings */}
          <div className="space-y-6">
            {activePeriod === "daily" && (
              <DailyReportSettings
                settings={dailySettings}
                onUpdate={(s) => setDailySettings(s)}
                onSave={handleSave}
                isLoading={isLoading}
              />
            )}
            {activePeriod === "weekly" && (
              <WeeklyReportSettings
                settings={weeklySettings}
                onUpdate={(s) => setWeeklySettings(s)}
                onSave={handleSave}
                isLoading={isLoading}
              />
            )}
            {activePeriod === "monthly" && (
              <MonthlyReportSettings
                settings={monthlySettings}
                onUpdate={(s) => setMonthlySettings(s)}
                onSave={handleSave}
                isLoading={isLoading}
              />
            )}
          </div>

          {/* RIGHT: Group Selection */}
          <div className="space-y-6">
            <ReportGroupSelector
              groups={groups}
              targetGroups={dailySettings.targetGroups}
              onToggleGroup={toggleGroup}
              isFetching={isFetching}
            />
          </div>
        </div>

        {/* Report Table */}
        <ReportDataTable
          reportData={reportData}
          isLoadingReport={isLoadingReport}
          activeSessions={activeSessions}
          selectedSessionId={selectedSessionId}
          onSessionChange={setSelectedSessionId}
          onFetchReport={fetchReportData}
        />
      </div>
    </div>
  );
};
