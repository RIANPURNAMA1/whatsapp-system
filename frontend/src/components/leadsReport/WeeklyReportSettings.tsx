import React from "react";
import { Bell, Clock, RefreshCw } from "lucide-react";

const WEEKLY_DAYS = [
  { id: 0, label: "Minggu" },
  { id: 1, label: "Senin" },
  { id: 2, label: "Selasa" },
  { id: 3, label: "Rabu" },
  { id: 4, label: "Kamis" },
  { id: 5, label: "Jumat" },
  { id: 6, label: "Sabtu" },
];

interface WeeklyReportSettingsProps {
  settings: {
    isEnabled: boolean;
    reportTime: string;
    weeklyReportDay: number;
    queueDelay: number;
  };
  onUpdate: (settings: any) => void;
  onSave: () => void;
  isLoading: boolean;
}

export const WeeklyReportSettings: React.FC<WeeklyReportSettingsProps> = ({
  settings,
  onUpdate,
  onSave,
  isLoading,
}) => {
  return (
    <div className="space-y-6">
      {/* Auto-Send Toggle */}
      <div className="bg-white p-5 rounded-lg border border-[#E4E6EB]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Bell className="text-[#0866FF]" size={20} />
            <h2 className="text-sm font-bold text-[#050505] uppercase tracking-wider">
              Kirim Otomatis Mingguan
            </h2>
          </div>
          <button
            onClick={() => onUpdate({ ...settings, isEnabled: !settings.isEnabled })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all ${
              settings.isEnabled ? "bg-[#0866FF]" : "bg-[#E4E6EB]"
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
            Laporan mingguan akan dikirim otomatis setiap hari yang dipilih
          </p>
        ) : (
          <p className="text-xs text-[#65676B] italic">
            Aktifkan untuk mengirim laporan mingguan otomatis ke grup
          </p>
        )}
      </div>

      {/* Schedule Time */}
      <div className="bg-white p-5 rounded-lg border border-[#E4E6EB]">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="text-[#0866FF]" size={20} />
          <h2 className="text-sm font-bold text-[#050505] uppercase tracking-wider">
            Jam Kirim Laporan
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="time"
            value={settings.reportTime}
            onChange={(e) => onUpdate({ ...settings, reportTime: e.target.value })}
            className="bg-[#F0F2F5] border border-[#CCD0D5] rounded-lg px-4 py-3 text-lg font-bold text-[#050505] focus:outline-none focus:ring-2 focus:ring-[#0866FF]"
          />
          <p className="text-xs text-[#65676B]">
            Laporan mingguan akan dikirim pada jam ini
          </p>
        </div>
      </div>

      {/* Weekly Day */}
      <div className="bg-white p-5 rounded-lg border border-[#E4E6EB]">
        <div className="flex items-center gap-3 mb-4">
          <svg className="text-[#0866FF]" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <h2 className="text-sm font-bold text-[#050505] uppercase tracking-wider">
            Hari Laporan Mingguan
          </h2>
        </div>
        <div className="flex gap-2 flex-wrap">
          {WEEKLY_DAYS.map((day) => {
            const isSelected = settings.weeklyReportDay === day.id;
            return (
              <button
                key={day.id}
                onClick={() => onUpdate({ ...settings, weeklyReportDay: day.id })}
                className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  isSelected
                    ? "bg-[#0866FF] text-white"
                    : "bg-[#F0F2F5] text-[#65676B] hover:bg-[#E4E6EB]"
                }`}
              >
                {day.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Queue Delay */}
      <div className="bg-white p-5 rounded-lg border border-[#E4E6EB]">
        <div className="flex items-center gap-3 mb-4">
          <RefreshCw className="text-[#0866FF]" size={20} />
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
            onChange={(e) => onUpdate({ ...settings, queueDelay: parseInt(e.target.value) || 3000 })}
            className="bg-[#F0F2F5] border border-[#CCD0D5] rounded-lg px-4 py-3 text-lg font-bold text-[#050505] focus:outline-none focus:ring-2 focus:ring-[#0866FF] w-32"
          />
          <div>
            <p className="text-xs text-[#65676B]">Jeda antar device (milidetik)</p>
            <p className="text-xs text-[#65676B] mt-1">1000ms = 1 detik</p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={onSave}
        disabled={isLoading}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${
          isLoading
            ? "bg-[#E4E6EB] text-[#65676B] cursor-not-allowed"
            : "bg-[#0866FF] text-white hover:bg-[#166FE5]"
        }`}
      >
        {isLoading ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
        )}
        {isLoading ? "Menyimpan..." : "Simpan Pengaturan Mingguan"}
      </button>
    </div>
  );
};
