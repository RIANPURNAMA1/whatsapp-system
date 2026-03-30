import React from "react";
import {
  Clock,
  AlertCircle,
} from "lucide-react";

interface Props {
  formData: any;
  onChange: (field: string, value: any) => void;
}

export const AntiBanSection: React.FC<Props> = ({ formData, onChange }) => (
  <div className="max-w-3xl space-y-6 animate-in slide-in-from-right-4 duration-300">
    <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl flex gap-3 items-start text-orange-700">
      <AlertCircle className="text-orange-500 shrink-0" size={18} />
      <p className="text-sm">
        Konfigurasi ini membantu akun tetap aman dari deteksi spam otomatis WhatsApp.
      </p>
    </div>

    <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <Clock className="text-blue-500" size={20} />
        <label className="text-sm font-bold text-gray-900 uppercase tracking-wider">
          Human-First Mode
        </label>
      </div>
      
      <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
        <div className="flex justify-between mb-4">
          <span className="text-sm text-gray-600">Tunggu Manusia Selama:</span>
          <span className="text-blue-600 font-bold">
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
          className="w-full accent-blue-500 cursor-pointer"
        />
        <p className="text-[10px] text-gray-500 mt-2 italic">
          *AI akan menunggu X menit sebelum merespon chat baru.
        </p>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div className="bg-white p-4 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors shadow-sm">
        <label className="text-[10px] text-gray-500 uppercase font-semibold block mb-1">
          Min Delay (Detik)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={formData.min_delay}
            onChange={(e) => onChange("min_delay", Number(e.target.value))}
            className="w-full bg-transparent text-xl font-bold text-gray-900 outline-none"
          />
          <span className="text-[10px] text-gray-400">SEC</span>
        </div>
      </div>
      <div className="bg-white p-4 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors shadow-sm">
        <label className="text-[10px] text-gray-500 uppercase font-semibold block mb-1">
          Max Delay (Detik)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={formData.max_delay}
            onChange={(e) => onChange("max_delay", Number(e.target.value))}
            className="w-full bg-transparent text-xl font-bold text-gray-900 outline-none"
          />
          <span className="text-[10px] text-gray-400">SEC</span>
        </div>
      </div>
    </div>
  </div>
);
