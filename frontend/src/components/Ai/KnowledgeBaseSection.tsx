import React, { useRef } from 'react';
import { 
  FileText, FileUp, Trash2, Info, 
  Sparkles, ShieldCheck, Database, Zap 
} from 'lucide-react';

interface KBProps {
  mode: 'text' | 'pdf';
  setMode: (mode: 'text' | 'pdf') => void;
  textValue: string;
  onTextChange: (val: string) => void;
  pdfList: any[];
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemovePdf: (idx: number) => void;
}

export const KnowledgeBaseSection: React.FC<KBProps> = ({ 
  mode, setMode, textValue, onTextChange, pdfList, onUpload, onRemovePdf 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="bg-[#202C33] rounded-md border border-[#313D45] flex flex-col shadow-2xl overflow-hidden min-h-[650px]">
      
      {/* TAB HEADER */}
      <div className="p-4 border-b border-[#313D45] bg-[#2A3942]/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex bg-[#111B21] p-1 rounded-md border border-[#313D45]">
          <button 
            onClick={() => setMode('text')} 
            className={`flex items-center gap-2 px-5 py-2 rounded-md text-xs font-bold transition-all ${mode === 'text' ? 'bg-[#00a884] text-[#111b21]' : 'text-[#8696A0] hover:text-white'}`}
          >
            <FileText className="w-4 h-4" /> TEXT MANUAL
          </button>
          <button 
            onClick={() => setMode('pdf')} 
            className={`flex items-center gap-2 px-5 py-2 rounded-md text-xs font-bold transition-all ${mode === 'pdf' ? 'bg-[#00a884] text-[#111b21]' : 'text-[#8696A0] hover:text-white'}`}
          >
            <FileUp className="w-4 h-4" /> DOKUMEN PDF
          </button>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/5 border border-emerald-500/20 rounded-md">
          <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-[10px] font-bold text-emerald-500 tracking-wider uppercase">RAG Engine Active</span>
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="p-6 flex-grow flex flex-col bg-gradient-to-b from-transparent to-[#111B21]/20">
        
        {/* KETERANGAN DINAMIS */}
        <div className="mb-6 p-4 bg-[#2A3942]/30 border-l-4 border-[#00a884] rounded-md">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-[#00a884] shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-tight">
                {mode === 'text' ? 'Mode Instruksi Teks' : 'Mode Knowledge Retrieval (PDF)'}
              </h4>
              <p className="text-[11px] text-[#8696A0] mt-1 leading-relaxed">
                {mode === 'text' 
                  ? 'Gunakan area ini untuk memberikan konteks dasar, aturan perilaku bot, atau FAQ singkat. Mendukung format teks sederhana.' 
                  : 'Unggah brosur, SOP, atau katalog produk. AI akan memindai isi PDF untuk menjawab pertanyaan user secara akurat.'}
              </p>
            </div>
          </div>
        </div>

        {mode === 'text' ? (
          <div className="flex-grow flex flex-col animate-in fade-in duration-300">
            <textarea 
              value={textValue}
              onChange={(e) => onTextChange(e.target.value)}
              className="w-full flex-grow bg-[#111B21]/50 border border-[#313D45] rounded-md px-6 py-6 focus:outline-none focus:border-[#00a884]/50 font-mono text-sm leading-relaxed text-white shadow-inner resize-none"
              placeholder="# Tulis pengetahuan produk di sini..."
            />
          </div>
        ) : (
          <div className="flex-grow flex flex-col animate-in fade-in duration-300">
            {/* UPLOAD BOX */}
            <div 
              onClick={() => fileInputRef.current?.click()} 
              className="group border-2 border-dashed border-[#313D45] rounded-md p-10 flex flex-col items-center justify-center hover:border-[#00a884] hover:bg-[#00a884]/5 transition-all cursor-pointer"
            >
              <input type="file" ref={fileInputRef} onChange={onUpload} accept=".pdf" className="hidden" />
              <div className="w-14 h-14 bg-[#2A3942] rounded-md flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FileUp className="w-7 h-7 text-[#00a884]" />
              </div>
              <h4 className="text-white font-bold text-sm">Klik untuk Unggah PDF</h4>
              <p className="text-[#8696A0] text-[10px] mt-2 uppercase tracking-widest">Maksimal 10MB per file</p>
            </div>

            {/* PDF LIST */}
            <div className="mt-8">
              <div className="flex items-center gap-2 mb-4">
                <Database className="w-4 h-4 text-[#8696A0]" />
                <span className="text-[11px] font-bold text-[#8696A0] uppercase tracking-wider">
                  File Terindeks ({pdfList.length})
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto max-h-[250px] pr-2 scrollbar-thin">
                {pdfList.map((pdf, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-[#111B21]/50 rounded-md border border-[#313D45] hover:border-emerald-500/30 transition-all">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="p-2 bg-red-500/10 rounded-md">
                        <FileText className="w-4 h-4 text-red-400" />
                      </div>
                      <span className="text-xs text-white truncate font-medium">{pdf.name}</span>
                    </div>
                    <button 
                      onClick={() => onRemovePdf(idx)} 
                      className="p-1.5 text-[#8696A0] hover:text-red-500 hover:bg-red-500/10 rounded-md transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER INFO */}
      <div className="p-4 bg-[#2A3942]/40 border-t border-[#313D45] flex flex-wrap gap-6">
        <div className="flex items-center gap-2">
           <Zap className="w-3.5 h-3.5 text-amber-500" />
           <span className="text-[10px] text-[#8696A0] font-medium">Auto-sync Active</span>
        </div>
        <div className="flex items-center gap-2">
           <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
           <span className="text-[10px] text-[#8696A0] font-medium">End-to-end Encrypted</span>
        </div>
      </div>
    </div>
  );
};