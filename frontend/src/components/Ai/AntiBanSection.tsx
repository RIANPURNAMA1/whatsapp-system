import React from "react";
import {
  ShieldCheck,
  UserCheck,
  Clock,
  Zap,
  AlertCircle,
  MessageSquare,
} from "lucide-react";

interface Props {
  formData: any;
  onChange: (field: string, value: any) => void;
}

export const AntiBanSection: React.FC<Props> = ({ formData, onChange }) => (
  <div className="max-w-3xl space-y-6 animate-in slide-in-from-right-4 duration-300">
    {/* Warning Banner */}
    <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-lg flex gap-3 items-start text-orange-200">
      <AlertCircle className="text-orange-500 shrink-0" size={18} />
      <p className="text-xs">
        Konfigurasi ini membantu akun tetap aman dari deteksi spam otomatis
        WhatsApp.
      </p>
    </div>

    {/* Human-First Mode & Daily Limit */}
{/* Human-First Mode */}
<div className="bg-[#202C33] p-6 rounded-2xl border border-[#313D45] shadow-xl">
  <div className="flex items-center gap-3 mb-6">
    <Clock className="text-emerald-500" size={20} />
    <label className="text-sm font-bold text-white uppercase tracking-wider">
      Human-First Mode
    </label>
  </div>
  
  <div className="bg-[#111B21] p-5 rounded-xl border border-[#313D45]">
    <div className="flex justify-between mb-4">
      <span className="text-xs text-[#8696A0]">Tunggu Manusia Selama:</span>
      <span className="text-emerald-400 font-bold">
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
      className="w-full accent-emerald-500 cursor-pointer"
    />
    <p className="text-[10px] text-[#8696A0] mt-2 italic">
      *AI akan menunggu X menit sebelum merespon chat baru.
    </p>
  </div>
</div>

    {/* Delay Inputs (min_delay & max_delay) */}
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-[#202C33] p-4 rounded-xl border border-[#313D45] hover:border-emerald-500/30 transition-colors">
        <label className="text-[10px] text-[#8696A0] uppercase block mb-1">
          Min Delay (Detik)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={formData.min_delay}
            onChange={(e) => onChange("min_delay", Number(e.target.value))}
            className="w-full bg-transparent text-xl font-bold text-white outline-none"
          />
          <span className="text-[10px] text-[#8696A0]">SEC</span>
        </div>
      </div>
      <div className="bg-[#202C33] p-4 rounded-xl border border-[#313D45] hover:border-emerald-500/30 transition-colors">
        <label className="text-[10px] text-[#8696A0] uppercase block mb-1">
          Max Delay (Detik)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={formData.max_delay}
            onChange={(e) => onChange("max_delay", Number(e.target.value))}
            className="w-full bg-transparent text-xl font-bold text-white outline-none"
          />
          <span className="text-[10px] text-[#8696A0]">SEC</span>
        </div>
      </div>
    </div>
  </div>
);
