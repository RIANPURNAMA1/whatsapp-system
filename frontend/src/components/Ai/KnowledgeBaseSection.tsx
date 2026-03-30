import React, { useRef, useState } from 'react';
import { 
  FileText, FileUp, Trash2, Info, 
  Sparkles, ShieldCheck, Database, Zap,
  Image as ImageIcon, Plus, Tag, Copy
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
    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm flex flex-col overflow-hidden min-h-[650px]">
      
      <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex bg-white p-1 rounded-xl border border-gray-200 overflow-x-auto shadow-sm">
          <button 
            onClick={() => setMode('text')} 
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap ${
              mode === 'text' 
                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> TEXT MANUAL
          </button>
          <button 
            onClick={() => setMode('pdf')} 
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap ${
              mode === 'pdf' 
                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FileUp className="w-3.5 h-3.5" /> DOKUMEN PDF
          </button>
          <button 
            onClick={() => setMode('media')} 
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap ${
              mode === 'media' 
                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" /> ASET GAMBAR
          </button>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          <span className="text-[10px] font-bold text-blue-600 tracking-wider uppercase">RAG Engine Active</span>
        </div>
      </div>

      <div className="p-6 flex-grow flex flex-col">
        
        <div className={`mb-6 p-4 bg-gray-50 border-l-4 rounded-r-lg ${mode === 'media' ? 'border-blue-500' : 'border-blue-500'}`}>
          <div className="flex gap-3">
            <Info className={`w-5 h-5 shrink-0 ${mode === 'media' ? 'text-blue-500' : 'text-blue-500'}`} />
            <div>
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-tight">
                {mode === 'text' && 'Mode Instruksi Teks'}
                {mode === 'pdf' && 'Mode Knowledge Retrieval (PDF)'}
                {mode === 'media' && 'Mode Library Aset Media'}
              </h4>
              <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
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
              className="w-full flex-grow bg-gray-50 border border-gray-200 rounded-xl px-6 py-6 focus:outline-none focus:border-blue-500 font-mono text-sm leading-relaxed text-gray-900 shadow-inner resize-none"
              placeholder="# Tulis pengetahuan produk di sini..."
            />
          </div>
        )}

        {mode === 'pdf' && (
          <div className="flex-grow flex flex-col animate-in fade-in duration-300">
            <div 
              onClick={() => fileInputRef.current?.click()} 
              className="group border-2 border-dashed border-gray-200 rounded-xl p-10 flex flex-col items-center justify-center hover:border-blue-300 hover:bg-blue-50/50 transition-all cursor-pointer"
            >
              <input type="file" ref={fileInputRef} onChange={onUpload} accept=".pdf" className="hidden" />
              <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FileUp className="w-7 h-7 text-blue-500" />
              </div>
              <h4 className="text-gray-900 font-bold text-sm">Klik untuk Unggah PDF</h4>
            </div>

            <div className="mt-8">
              <div className="flex items-center gap-2 mb-4">
                <Database className="w-4 h-4 text-gray-400" />
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">File Terindeks ({pdfList.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto max-h-[200px] pr-2">
                {pdfList.map((pdf, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-xs text-gray-900 truncate max-w-[150px]">{pdf.name}</span>
                    <button onClick={() => onRemovePdf(idx)} className="text-gray-400 hover:text-red-500"><Trash2 size={14}/></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {mode === 'media' && (
          <div className="flex-grow flex flex-col animate-in fade-in duration-300">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-[10px] text-gray-500 uppercase font-bold mb-2 block">Nama Tag (Alias)</label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input 
                      type="text" 
                      value={assetName}
                      onChange={(e) => setAssetName(e.target.value.replace(/\s/g, '_').toLowerCase())}
                      placeholder="contoh: syarat_daftar"
                      className="w-full bg-white border border-gray-200 rounded-lg py-2 pl-10 pr-4 text-xs text-gray-900 focus:border-blue-400 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase font-bold mb-2 block">Pilih File Gambar</label>
                  <input 
                    type="file" 
                    ref={mediaInputRef}
                    accept="image/*"
                    className="w-full text-xs text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-blue-500 file:text-white hover:file:bg-blue-600"
                  />
                </div>
              </div>
              <button 
                onClick={handleMediaSubmit}
                disabled={!assetName}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 disabled:opacity-50 text-white py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/25"
              >
                <Plus size={16} /> SIMPAN ASET MEDIA
              </button>
            </div>

            <div className="flex-grow overflow-hidden flex flex-col">
               <div className="flex items-center gap-2 mb-4">
                <ImageIcon className="w-4 h-4 text-gray-400" />
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Aset Library ({mediaAssets.length})</span>
              </div>
              
              <div className="grid grid-cols-1 gap-3 overflow-y-auto max-h-[350px] pr-2">
                {mediaAssets.map((item) => (
                  <div key={item.id} className="bg-gray-50 border border-gray-100 rounded-xl p-3 flex flex-col md:flex-row gap-4 group hover:border-blue-300 transition-colors">
                    <div className="w-full md:w-32 h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                      <img 
                        src={item.file_path} 
                        alt={item.asset_name} 
                        className="w-full h-full object-cover" 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://placehold.co/400x200?text=Error+Loading';
                        }}
                      />
                    </div>

                    <div className="flex-grow min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-bold">ID: {item.id}</span>
                          <h5 className="text-xs font-bold text-gray-900 truncate">Tag: [[{item.asset_name}]]</h5>
                        </div>
                        <div className="flex items-center gap-2">
                           <button 
                            onClick={() => copyToClipboard(item.asset_name)}
                            className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-400 hover:text-gray-900 transition-colors"
                            title="Salin Tag"
                           >
                            <Copy size={14} />
                           </button>
                           <button 
                            onClick={() => onRemoveMedia(item.id)}
                            className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                            title="Hapus"
                           >
                            <Trash2 size={14} />
                           </button>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[10px] text-gray-500">
                           <Database size={10} />
                           <span className="truncate">Path: {item.file_path}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-blue-500">
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

      <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-6">
        <div className="flex items-center gap-2">
           <Zap className="w-3.5 h-3.5 text-amber-500" />
           <span className="text-[10px] text-gray-500 font-medium">Auto-sync Active</span>
        </div>
        <div className="flex items-center gap-2">
           <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
           <span className="text-[10px] text-gray-500 font-medium">End-to-end Encrypted</span>
        </div>
      </div>
    </div>
  );
};
