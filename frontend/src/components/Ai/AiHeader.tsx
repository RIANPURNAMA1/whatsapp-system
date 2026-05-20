import React from "react";
import { Bot, Save, Loader2 } from "lucide-react";

interface AiHeaderProps {
  onSave: () => void;
  isSaving: boolean;
  canSave: boolean;
}

export const AiHeader: React.FC<AiHeaderProps> = ({ onSave, isSaving, canSave }) => {
  return (
    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 mb-8">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-[#1877F2] rounded-lg flex items-center justify-center">
          <Bot className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#050505]">
            AI Auto-Reply Config
          </h1>
          <p className="text-[#65676B] text-sm mt-0.5 font-medium">
            Kelola respon otomatis dan kecerdasan buatan per perangkat
          </p>
        </div>
      </div>
      <button 
        onClick={onSave} 
        disabled={isSaving || !canSave} 
        className="bg-[#1877F2] hover:bg-[#166FE5] disabled:opacity-50 px-6 py-2.5 rounded-lg font-bold flex gap-2 text-white items-center justify-center transition-all text-sm"
      >
        {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} 
        Simpan Perubahan
      </button>
    </div>
  );
};
