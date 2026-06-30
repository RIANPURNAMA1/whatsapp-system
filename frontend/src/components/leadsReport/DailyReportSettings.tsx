import React from "react";
import { Bell, Clock, Calendar, RefreshCw } from "lucide-react";

const DAYS = [
  { id: 1, label: "Sen" },
  { id: 2, label: "Sel" },
  { id: 3, label: "Rab" },
  { id: 4, label: "Kam" },
  { id: 5, label: "Jum" },
  { id: 6, label: "Sab" },
  { id: 0, label: "Min" },
];

interface DailyReportSettingsProps {
  settings: {
    isEnabled: boolean;
    reportTime: string;
    reportDays: string;
    queueDelay: number;
  };
  onUpdate: (settings: any) => void;
  onSave: () => void;
  isLoading: boolean;
}

export const DailyReportSettings: React.FC<DailyReportSettingsProps> = ({
  settings,
  onUpdate,
  onSave,
  isLoading,
}) => {
  const toggleDay = (dayId: number) => {
    const currentDays = settings.reportDays
      ? settings.reportDays.split(",").map((d) => parseInt(d.trim()))
      : [];
    const newDays = currentDays.includes(dayId)
      ? currentDays.filter((d: number) => d !== dayId)
      : [...currentDays, dayId].sort((a, b) => a - b);
    onUpdate({ ...settings, reportDays: newDays.join(",") });
  };

  return (
    <div className="space-y-6">
      {/* Auto-Send Toggle */}
      <div className="bg-white p-5 rounded-lg border border-[#E4E6EB]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Bell className="text-[#0866FF]" size={20} />
            <h2 className="text-sm font-bold text-[#050505] uppercase tracking-wider">
              Kirim Otomatis
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
            Laporan akan dikirim pada jam ini setiap hari aktif
          </p>
        </div>
      </div>

      {/* Active Days */}
      <div className="bg-white p-5 rounded-lg border border-[#E4E6EB]">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="text-[#0866FF]" size={20} />
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

      {/* Queue Delay Setting */}
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
            <p className="text-xs text-[#65676B] mt-1">1000ms = 1 detik. Default: 3000ms (3 detik)</p>
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
        {isLoading ? "Menyimpan..." : "Simpan Pengaturan Harian"}
      </button>
    </div>
  );
};
