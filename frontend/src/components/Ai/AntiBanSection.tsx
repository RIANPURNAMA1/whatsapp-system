import React from "react";
import {
  Clock,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Sun,
  Moon,
} from "lucide-react";

interface Props {
  formData: any;
  onChange: (field: string, value: any) => void;
}

const DAYS = [
  { id: 0, label: "Min" },
  { id: 1, label: "Sen" },
  { id: 2, label: "Sel" },
  { id: 3, label: "Rab" },
  { id: 4, label: "Kam" },
  { id: 5, label: "Jum" },
  { id: 6, label: "Sab" },
];

export const AntiBanSection: React.FC<Props> = ({ formData, onChange }) => {
  const toggleDay = (dayId: number) => {
    const currentDays = formData.schedule_days
      ? formData.schedule_days.split(",").map((d: string) => parseInt(d.trim()))
      : [];
    const newDays = currentDays.includes(dayId)
      ? currentDays.filter((d: number) => d !== dayId)
      : [...currentDays, dayId].sort((a: number, b: number) => a - b);
    onChange("schedule_days", newDays.join(","));
  };

  return (
    <div>
      <div className="bg-[#FFF8E7] border border-[#F5A623] p-4 rounded-lg flex gap-3 items-start text-[#050505] mb-4">
        <AlertCircle className="text-[#F5A623] shrink-0" size={18} />
        <p className="text-sm text-[#65676B]">
          Konfigurasi ini membantu akun tetap aman dari deteksi spam otomatis WhatsApp.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* KIRI */}
        <div className="space-y-4">
          {/* Human-First Mode */}
          <div className="bg-white p-5 rounded-lg border border-[#E4E6EB]">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="text-[#1877F2]" size={20} />
              <label className="text-sm font-bold text-[#050505] uppercase tracking-wider">
                Human-First Mode
              </label>
            </div>
            
            <div className="bg-[#F0F2F5] p-4 rounded-lg border border-[#E4E6EB]">
              <div className="flex justify-between mb-3">
                <span className="text-xs text-[#65676B]">Tunggu Manusia Selama:</span>
                <span className="text-[#1877F2] font-bold text-sm">
                  {formData.human_wait_time || 0} Menit
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                step="1"
                value={formData.human_wait_time || 0}
                onChange={(e) => onChange("human_wait_time", parseInt(e.target.value))}
                className="w-full accent-[#1877F2] cursor-pointer"
              />
              <p className="text-[10px] text-[#65676B] mt-2 italic">
                *AI akan menunggu X menit sebelum merespon chat baru.
              </p>
            </div>
          </div>

          {/* Delay Typing */}
          <div className="bg-white p-5 rounded-lg border border-[#E4E6EB]">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="text-[#F5A623]" size={20} />
              <label className="text-sm font-bold text-[#050505] uppercase tracking-wider">
                Delay Typing
              </label>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#F0F2F5] p-3 rounded-lg border border-[#E4E6EB]">
                <label className="text-[10px] text-[#65676B] uppercase font-semibold block mb-2">
                  Min Delay
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={formData.min_delay || 5}
                    onChange={(e) => onChange("min_delay", Math.max(1, Number(e.target.value)))}
                    className="w-full bg-white border border-[#CCD0D5] rounded-lg px-3 py-2 text-center font-bold text-[#050505] focus:outline-none focus:ring-2 focus:ring-[#1877F2]"
                  />
                  <span className="text-[10px] text-[#65676B]">sec</span>
                </div>
              </div>
              <div className="bg-[#F0F2F5] p-3 rounded-lg border border-[#E4E6EB]">
                <label className="text-[10px] text-[#65676B] uppercase font-semibold block mb-2">
                  Max Delay
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={formData.max_delay || 15}
                    onChange={(e) => onChange("max_delay", Math.max(1, Number(e.target.value)))}
                    className="w-full bg-white border border-[#CCD0D5] rounded-lg px-3 py-2 text-center font-bold text-[#050505] focus:outline-none focus:ring-2 focus:ring-[#1877F2]"
                  />
                  <span className="text-[10px] text-[#65676B]">sec</span>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-[#65676B] mt-2 italic text-center">
              Simulasi waktu typing manusia (random antara min & max)
            </p>
          </div>
        </div>

        {/* KANAN */}
        <div className="space-y-4">
          {/* Auto Read */}
          <div className="bg-white p-5 rounded-lg border border-[#E4E6EB]">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle2 className="text-[#31A24C]" size={20} />
              <label className="text-sm font-bold text-[#050505] uppercase tracking-wider">
                Auto Read
              </label>
              <div className="ml-auto">
                <button
                  type="button"
                  onClick={() => onChange("auto_read", formData.auto_read ? 0 : 1)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all ${
                    formData.auto_read ? "bg-[#1877F2]" : "bg-[#E4E6EB]"
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.auto_read ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>
            </div>
            
            {formData.auto_read ? (
              <div className="space-y-4">
                <div className="bg-[#F0F2F5] p-3 rounded-lg border border-[#E4E6EB]">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-[#65676B]">Delay Sebelum Read:</label>
                    <div className="flex gap-1">
                      {[0, 3, 5, 10].map((sec) => (
                        <button
                          key={sec}
                          type="button"
                          onClick={() => onChange("auto_read_delay", sec)}
                          className={`px-2 py-1 text-[10px] rounded font-medium transition-all ${
                            formData.auto_read_delay === sec
                              ? "bg-[#1877F2] text-white"
                              : "bg-white border border-[#E4E6EB] text-[#65676B] hover:bg-[#F2F3F5]"
                          }`}
                        >
                          {sec}s
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="300"
                      value={formData.auto_read_delay || 0}
                      onChange={(e) => onChange("auto_read_delay", Math.max(0, Math.min(300, parseInt(e.target.value) || 0)))}
                      className="flex-1 bg-white border border-[#CCD0D5] rounded-lg px-3 py-2 text-center font-bold text-[#050505] focus:outline-none focus:ring-2 focus:ring-[#1877F2]"
                    />
                    <span className="text-sm text-[#65676B]">detik</span>
                  </div>
                </div>

                <div className="bg-[#E7F3FF] p-3 rounded-lg border border-[#1877F2]">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-[#65676B]">Delay Setelah Read:</label>
                    <div className="flex gap-1">
                      {[0, 3, 5, 10, 15].map((sec) => (
                        <button
                          key={sec}
                          type="button"
                          onClick={() => onChange("after_read_delay", sec)}
                          className={`px-2 py-1 text-[10px] rounded font-medium transition-all ${
                            formData.after_read_delay === sec
                              ? "bg-[#1877F2] text-white"
                              : "bg-white border border-[#E4E6EB] text-[#65676B] hover:bg-[#F2F3F5]"
                          }`}
                        >
                          {sec}s
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="60"
                      value={formData.after_read_delay || 3}
                      onChange={(e) => onChange("after_read_delay", Math.max(0, Math.min(60, parseInt(e.target.value) || 0)))}
                      className="flex-1 bg-white border border-[#CCD0D5] rounded-lg px-3 py-2 text-center font-bold text-[#050505] focus:outline-none focus:ring-2 focus:ring-[#1877F2]"
                    />
                    <span className="text-sm text-[#65676B]">detik</span>
                  </div>
                  <p className="text-[10px] text-[#1877F2] mt-2 italic">
                    Tunggu sebelum typing & balas
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#65676B] italic">
                Aktifkan untuk auto read pesan (ceklik 2 biru)
              </p>
            )}
          </div>

          {/* Jadwal Aktif */}
          <div className="bg-white p-5 rounded-lg border border-[#E4E6EB]">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="text-[#1877F2]" size={20} />
              <label className="text-sm font-bold text-[#050505] uppercase tracking-wider">
                Jadwal Aktif AI
              </label>
              <div className="ml-auto">
                <button
                  type="button"
                  onClick={() => onChange("schedule_enabled", formData.schedule_enabled ? 0 : 1)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all ${
                    formData.schedule_enabled ? "bg-[#1877F2]" : "bg-[#E4E6EB]"
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.schedule_enabled ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>
            </div>
            
            {formData.schedule_enabled ? (
              <div className="space-y-4">
                <div className="bg-[#E7F3FF] p-3 rounded-lg border border-[#1877F2]">
                  <p className="text-[10px] text-[#1877F2] mb-2 font-medium">Jam Aktif:</p>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Sun className="text-[#F5A623]" size={14} />
                      <input
                        type="time"
                        value={formData.schedule_start_time || "08:00"}
                        onChange={(e) => onChange("schedule_start_time", e.target.value)}
                        className="bg-white border border-[#CCD0D5] rounded-lg px-2 py-1.5 text-xs font-medium text-[#050505] focus:outline-none focus:ring-2 focus:ring-[#1877F2]"
                      />
                    </div>
                    <span className="text-[#65676B] text-xs">-</span>
                    <div className="flex items-center gap-2">
                      <Moon className="text-[#1877F2]" size={14} />
                      <input
                        type="time"
                        value={formData.schedule_end_time || "17:00"}
                        onChange={(e) => onChange("schedule_end_time", e.target.value)}
                        className="bg-white border border-[#CCD0D5] rounded-lg px-2 py-1.5 text-xs font-medium text-[#050505] focus:outline-none focus:ring-2 focus:ring-[#1877F2]"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] text-[#1877F2] mb-2 font-medium">Hari Aktif:</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {DAYS.map((day) => {
                      const isSelected = formData.schedule_days
                        ?.split(",")
                        .map((d: string) => parseInt(d.trim()))
                        .includes(day.id);
                      return (
                        <button
                          key={day.id}
                          type="button"
                          onClick={() => toggleDay(day.id)}
                          className={`w-8 h-8 rounded-full text-[10px] font-bold transition-all ${
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

                <div className="bg-[#F0F2F5] p-2 rounded-lg border border-[#E4E6EB]">
                  <p className="text-[10px] text-[#65676B] text-center">
                    <span className="font-medium">Preview:</span>{" "}
                    {formData.schedule_start_time || "08:00"} - {formData.schedule_end_time || "17:00"} |{" "}
                    {formData.schedule_days
                      ? formData.schedule_days.split(",").map((d: string) => DAYS.find((day) => day.id === parseInt(d.trim()))?.label).join(", ")
                      : "Semua hari"}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#65676B] italic">
                AI aktif 24 jam setiap hari
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
