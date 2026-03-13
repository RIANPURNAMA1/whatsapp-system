import React from 'react';
import { Cpu, Sparkles, Zap, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface AIEngineSectionProps {
  aiModel: string;
  onChange: (field: string, value: string) => void;
}

export const AIEngineSection: React.FC<AIEngineSectionProps> = ({ 
  aiModel, 
  onChange 
}) => {
  return (
    <div className="bg-[#202C33] rounded-md border border-[#313D45] shadow-xl overflow-hidden group">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-emerald-600/10 to-transparent p-4 border-b border-[#313D45] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#111B21] rounded-md flex items-center justify-center border border-emerald-500/30">
            <Cpu className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h3 className="font-bold text-[11px] text-white tracking-widest uppercase">AI Intelligence Engine</h3>
            <p className="text-[9px] text-[#8696A0]">Pilih otak kecerdasan buatan untuk bot Anda</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* MODEL SELECTOR */}
        <div className="grid grid-cols-1 gap-3">
          
          {/* Gemini Option */}
          <button
            type="button"
            onClick={() => onChange("aiModel", "gemini")}
            className={`flex items-center justify-between p-4 rounded-md border transition-all ${
              aiModel === "gemini"
                ? "bg-emerald-500/10 border-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.05)]"
                : "bg-[#111B21] border-[#313D45] text-[#8696A0] hover:border-[#414e58]"
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-lg ${aiModel === "gemini" ? "bg-emerald-500/20" : "bg-[#202C33]"}`}>
                <Sparkles className={`w-5 h-5 ${aiModel === "gemini" ? "text-emerald-400" : "text-[#8696A0]"}`} />
              </div>
              <div className="text-left">
                <p className="text-[11px] font-black tracking-widest uppercase">Google Gemini</p>
                <p className="text-[10px] text-[#8696A0]">Optimal untuk percakapan natural & cepat.</p>
              </div>
            </div>
            {aiModel === "gemini" && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
          </button>

          {/* Claude Option */}
          <button
            type="button"
            onClick={() => onChange("aiModel", "claude")}
            className={`flex items-center justify-between p-4 rounded-md border transition-all ${
              aiModel === "claude"
                ? "bg-orange-500/10 border-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.05)]"
                : "bg-[#111B21] border-[#313D45] text-[#8696A0] hover:border-[#414e58]"
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-lg ${aiModel === "claude" ? "bg-orange-500/20" : "bg-[#202C33]"}`}>
                <Zap className={`w-5 h-5 ${aiModel === "claude" ? "text-orange-400" : "text-[#8696A0]"}`} />
              </div>
              <div className="text-left">
                <p className="text-[11px] font-black tracking-widest uppercase">Anthropic Claude</p>
                <p className="text-[10px] text-[#8696A0]">Sangat baik dalam pemahaman instruksi kompleks.</p>
              </div>
            </div>
            {aiModel === "claude" && <CheckCircle2 className="w-5 h-5 text-orange-500" />}
          </button>

        </div>

        {/* INFO BOX */}
        <div className="bg-[#111B21] rounded-md border border-[#313D45] p-3 flex gap-3 items-start">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <p className="text-[10px] text-[#8696A0] leading-relaxed">
            API Key dikelola secara aman oleh sistem di sisi server. Anda hanya perlu memilih engine yang ingin digunakan untuk sesi ini.
          </p>
        </div>
      </div>
    </div>
  );
};