import React from "react";
import { Bot, Save, Loader2 } from "lucide-react";

interface AiHeaderProps {
  onSave: () => void;
  isSaving: boolean;
  canSave: boolean;
}

export const AiHeader: React.FC<AiHeaderProps> = ({ onSave, isSaving, canSave }) => {
  return (
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Bot className="text-emerald-400" /> AI Auto-Reply Config
        </h1>
        <p className="text-xs text-[#8696A0] mt-1">
          Kelola respon otomatis dan kecerdasan buatan per perangkat
        </p>
      </div>
      <button 
        onClick={onSave} 
        disabled={isSaving || !canSave} 
        className="bg-emerald-600 hover:bg-emerald-700 px-6 py-2 rounded-xl font-bold flex gap-2 transition-all disabled:opacity-30 shadow-lg shadow-emerald-900/20"
      >
        {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} 
        Simpan Perubahan
      </button>
    </div>
  );
};