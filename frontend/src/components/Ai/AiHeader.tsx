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
        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
          <Bot className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            AI Auto-Reply Config
          </h1>
          <p className="text-gray-600 text-sm mt-0.5 font-medium">
            Kelola respon otomatis dan kecerdasan buatan per perangkat
          </p>
        </div>
      </div>
      <button 
        onClick={onSave} 
        disabled={isSaving || !canSave} 
        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-6 py-3 rounded-xl font-bold flex gap-2 text-white items-center justify-center transition-all disabled:opacity-50 shadow-lg shadow-blue-500/25"
      >
        {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} 
        Simpan Perubahan
      </button>
    </div>
  );
};
