import React, { useRef, useState } from 'react';
import { 
  FileText, FileUp, Trash2, Info, 
  Sparkles, ShieldCheck, Database, Zap,
  Image as ImageIcon, Plus, Tag, Copy, ExternalLink
} from 'lucide-react';

interface KBProps {
  mode: 'text' | 'pdf' | 'media';
  setMode: (mode: 'text' | 'pdf' | 'media') => void;
  textValue: string;
  onTextChange: (val: string) => void;
  pdfList: any[];
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemovePdf: (idx: number) => void;
  mediaAssets: any[];
  onUploadMedia: (file: File, assetName: string) => void;
  onRemoveMedia: (id: number) => void;
}

export const KnowledgeBaseSection: React.FC<KBProps> = ({ 
  mode, setMode, textValue, onTextChange, pdfList, onUpload, onRemovePdf,
  mediaAssets, onUploadMedia, onRemoveMedia
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const [assetName, setAssetName] = useState('');

  const handleMediaSubmit = () => {
    const file = mediaInputRef.current?.files?.[0];
    if (file && assetName) {
      onUploadMedia(file, assetName);
      setAssetName(''); 
      if (mediaInputRef.current) mediaInputRef.current.value = "";
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(`[[${text}]]`);
    alert(`Tag [[${text}]] disalin!`);
  };

  return (
    <div className="bg-[#202C33] rounded-md border border-[#313D45] flex flex-col shadow-2xl overflow-hidden min-h-[650px]">
      
      {/* TAB HEADER */}
      <div className="p-4 border-b border-[#313D45] bg-[#2A3942]/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex bg-[#111B21] p-1 rounded-md border border-[#313D45] overflow-x-auto">
          <button 
            onClick={() => setMode('text')} 
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-[10px] font-bold transition-all whitespace-nowrap ${mode === 'text' ? 'bg-[#00a884] text-[#111b21]' : 'text-[#8696A0] hover:text-white'}`}
          >
            <FileText className="w-3.5 h-3.5" /> TEXT MANUAL
          </button>
          <button 
            onClick={() => setMode('pdf')} 
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-[10px] font-bold transition-all whitespace-nowrap ${mode === 'pdf' ? 'bg-[#00a884] text-[#111b21]' : 'text-[#8696A0] hover:text-white'}`}
          >
            <FileUp className="w-3.5 h-3.5" /> DOKUMEN PDF
          </button>
          <button 
            onClick={() => setMode('media')} 
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-[10px] font-bold transition-all whitespace-nowrap ${mode === 'media' ? 'bg-blue-600 text-white' : 'text-[#8696A0] hover:text-white'}`}
          >
            <ImageIcon className="w-3.5 h-3.5" /> ASET GAMBAR
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
        <div className={`mb-6 p-4 bg-[#2A3942]/30 border-l-4 rounded-md ${mode === 'media' ? 'border-blue-500' : 'border-[#00a884]'}`}>
          <div className="flex gap-3">
            <Info className={`w-5 h-5 shrink-0 ${mode === 'media' ? 'text-blue-500' : 'text-[#00a884]'}`} />
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-tight">
                {mode === 'text' && 'Mode Instruksi Teks'}
                {mode === 'pdf' && 'Mode Knowledge Retrieval (PDF)'}
                {mode === 'media' && 'Mode Library Aset Media'}
              </h4>
              <p className="text-[11px] text-[#8696A0] mt-1 leading-relaxed">
                {mode === 'text' && 'Gunakan area ini untuk memberikan konteks dasar atau FAQ singkat.'}
                {mode === 'pdf' && 'Unggah PDF agar AI bisa menjawab pertanyaan berdasarkan isi dokumen.'}
                {mode === 'media' && 'Unggah gambar dan beri nama tag. AI akan mengirim gambar saat tag [[nama_tag]] dipanggil dalam teks jawaban.'}
              </p>
            </div>
          </div>
        </div>

        {mode === 'text' && (
          <div className="flex-grow flex flex-col animate-in fade-in duration-300">
            <textarea 
              value={textValue}
              onChange={(e) => onTextChange(e.target.value)}
              className="w-full flex-grow bg-[#111B21]/50 border border-[#313D45] rounded-md px-6 py-6 focus:outline-none focus:border-[#00a884]/50 font-mono text-sm leading-relaxed text-white shadow-inner resize-none"
              placeholder="# Tulis pengetahuan produk di sini..."
            />
          </div>
        )}

        {mode === 'pdf' && (
          <div className="flex-grow flex flex-col animate-in fade-in duration-300">
            <div 
              onClick={() => fileInputRef.current?.click()} 
              className="group border-2 border-dashed border-[#313D45] rounded-md p-10 flex flex-col items-center justify-center hover:border-[#00a884] hover:bg-[#00a884]/5 transition-all cursor-pointer"
            >
              <input type="file" ref={fileInputRef} onChange={onUpload} accept=".pdf" className="hidden" />
              <div className="w-14 h-14 bg-[#2A3942] rounded-md flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FileUp className="w-7 h-7 text-[#00a884]" />
              </div>
              <h4 className="text-white font-bold text-sm">Klik untuk Unggah PDF</h4>
            </div>

            <div className="mt-8">
              <div className="flex items-center gap-2 mb-4">
                <Database className="w-4 h-4 text-[#8696A0]" />
                <span className="text-[11px] font-bold text-[#8696A0] uppercase tracking-wider">File Terindeks ({pdfList.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto max-h-[200px] pr-2 scrollbar-thin">
                {pdfList.map((pdf, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-[#111B21]/50 rounded-md border border-[#313D45]">
                    <span className="text-xs text-white truncate max-w-[150px]">{pdf.name}</span>
                    <button onClick={() => onRemovePdf(idx)} className="text-[#8696A0] hover:text-red-500"><Trash2 size={14}/></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {mode === 'media' && (
          <div className="flex-grow flex flex-col animate-in fade-in duration-300">
            {/* INPUT MEDIA ASSET */}
            <div className="bg-[#111B21] p-4 rounded-md border border-[#313D45] mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-[10px] text-[#8696A0] uppercase font-bold mb-2 block">Nama Tag (Alias)</label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-2.5 w-4 h-4 text-[#8696A0]" />
                    <input 
                      type="text" 
                      value={assetName}
                      onChange={(e) => setAssetName(e.target.value.replace(/\s/g, '_').toLowerCase())}
                      placeholder="contoh: syarat_daftar"
                      className="w-full bg-[#202C33] border border-[#313D45] rounded-md py-2 pl-10 pr-4 text-xs text-white focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-[#8696A0] uppercase font-bold mb-2 block">Pilih File Gambar</label>
                  <input 
                    type="file" 
                    ref={mediaInputRef}
                    accept="image/*"
                    className="w-full text-xs text-[#8696A0] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-[#313D45] file:text-white hover:file:bg-[#3b82f6]"
                  />
                </div>
              </div>
              <button 
                onClick={handleMediaSubmit}
                disabled={!assetName}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-2 rounded-md text-xs font-bold flex items-center justify-center gap-2 transition-all"
              >
                <Plus size={16} /> SIMPAN ASET MEDIA
              </button>
            </div>

            {/* LIST ASSETS DENGAN PREVIEW DATA LENGKAP */}
            <div className="flex-grow overflow-hidden flex flex-col">
               <div className="flex items-center gap-2 mb-4">
                <ImageIcon className="w-4 h-4 text-[#8696A0]" />
                <span className="text-[11px] font-bold text-[#8696A0] uppercase tracking-wider">Aset Library ({mediaAssets.length})</span>
              </div>
              
              <div className="grid grid-cols-1 gap-3 overflow-y-auto max-h-[350px] pr-2 scrollbar-thin">
                {mediaAssets.map((item) => (
                  <div key={item.id} className="bg-[#111B21]/50 border border-[#313D45] rounded-lg p-3 flex flex-col md:flex-row gap-4 group hover:border-blue-500/50 transition-colors">
                    {/* Preview Gambar */}
                    <div className="w-full md:w-32 h-20 bg-[#202C33] rounded overflow-hidden shrink-0">
                      {/* LANGSUNG MENGGUNAKAN item.file_path KARENA SUDAH BERUPA URL LENGKAP */}
                      <img 
                        src={item.file_path} 
                        alt={item.asset_name} 
                        className="w-full h-full object-cover" 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://placehold.co/400x200?text=Error+Loading';
                        }}
                      />
                    </div>

                    {/* Info Data */}
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-bold">ID: {item.id}</span>
                          <h5 className="text-xs font-bold text-white truncate">Tag: [[{item.asset_name}]]</h5>
                        </div>
                        <div className="flex items-center gap-2">
                           <button 
                            onClick={() => copyToClipboard(item.asset_name)}
                            className="p-1.5 hover:bg-[#313D45] rounded-md text-[#8696A0] hover:text-white transition-colors"
                            title="Salin Tag"
                           >
                            <Copy size={14} />
                           </button>
                           <button 
                            onClick={() => onRemoveMedia(item.id)}
                            className="p-1.5 hover:bg-red-500/10 rounded-md text-[#8696A0] hover:text-red-500 transition-colors"
                            title="Hapus"
                           >
                            <Trash2 size={14} />
                           </button>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[10px] text-[#8696A0]">
                           <Database size={10} />
                           <span className="truncate">Path: {item.file_path}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-emerald-500">
                           <Zap size={10} />
                           <span>Status: Terhubung ke AI</span>
                        </div>
                      </div>
                    </div>
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