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
    <div className="bg-white rounded-lg border border-[#E4E6EB] flex flex-col overflow-hidden min-h-[650px]">
      
      <div className="p-4 border-b border-[#E4E6EB] bg-[#F0F2F5] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex bg-white p-1 rounded-lg border border-[#E4E6EB] overflow-x-auto">
          <button 
            onClick={() => setMode('text')} 
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap ${
              mode === 'text' 
                ? 'bg-[#0866FF] text-white' 
                : 'text-[#65676B] hover:text-[#050505] hover:bg-[#F2F3F5]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> TEXT MANUAL
          </button>
          <button 
            onClick={() => setMode('pdf')} 
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap ${
              mode === 'pdf' 
                ? 'bg-[#0866FF] text-white' 
                : 'text-[#65676B] hover:text-[#050505] hover:bg-[#F2F3F5]'
            }`}
          >
            <FileUp className="w-3.5 h-3.5" /> DOKUMEN PDF
          </button>
          <button 
            onClick={() => setMode('media')} 
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap ${
              mode === 'media' 
                ? 'bg-[#0866FF] text-white' 
                : 'text-[#65676B] hover:text-[#050505] hover:bg-[#F2F3F5]'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" /> ASET GAMBAR
          </button>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#E7F3FF] border border-[#0866FF] rounded-lg">
          <Sparkles className="w-3.5 h-3.5 text-[#0866FF]" />
          <span className="text-[10px] font-bold text-[#0866FF] tracking-wider uppercase">RAG Engine Active</span>
        </div>
      </div>

      <div className="p-6 flex-grow flex flex-col">
        
        <div className="mb-6 p-4 bg-[#F0F2F5] border-l-4 border-[#0866FF] rounded-r-lg">
          <div className="flex gap-3">
            <Info className="w-5 h-5 shrink-0 text-[#0866FF]" />
            <div>
              <h4 className="text-xs font-bold text-[#050505] uppercase tracking-tight">
                {mode === 'text' && 'Mode Instruksi Teks'}
                {mode === 'pdf' && 'Mode Knowledge Retrieval (PDF)'}
                {mode === 'media' && 'Mode Library Aset Media'}
              </h4>
              <p className="text-[11px] text-[#65676B] mt-1 leading-relaxed">
                {mode === 'text' && 'Gunakan area ini untuk memberikan konteks dasar atau FAQ singkat.'}
                {mode === 'pdf' && 'Unggah PDF agar AI bisa menjawab pertanyaan berdasarkan isi dokumen.'}
                {mode === 'media' && 'Unggah gambar dan beri nama tag. AI akan mengirim gambar saat tag [[nama_tag]] dipanggil dalam teks jawaban.'}
              </p>
            </div>
          </div>
        </div>

        {mode === 'text' && (
          <div className="flex-grow flex flex-col">
            <textarea 
              value={textValue}
              onChange={(e) => onTextChange(e.target.value)}
              className="w-full flex-grow bg-[#F0F2F5] border border-[#CCD0D5] rounded-lg px-6 py-6 focus:outline-none focus:border-[#0866FF] focus:ring-1 focus:ring-[#0866FF] font-mono text-sm leading-relaxed text-[#050505] resize-none"
              placeholder="# Tulis pengetahuan produk di sini..."
            />
          </div>
        )}

        {mode === 'pdf' && (
          <div className="flex-grow flex flex-col">
            <div 
              onClick={() => fileInputRef.current?.click()} 
              className="group border-2 border-dashed border-[#E4E6EB] rounded-lg p-10 flex flex-col items-center justify-center hover:border-[#0866FF] hover:bg-[#E7F3FF] transition-all cursor-pointer"
            >
              <input type="file" ref={fileInputRef} onChange={onUpload} accept=".pdf" className="hidden" />
              <div className="w-14 h-14 bg-[#F0F2F5] rounded-lg flex items-center justify-center mb-4">
                <FileUp className="w-7 h-7 text-[#0866FF]" />
              </div>
              <h4 className="text-[#050505] font-bold text-sm">Klik untuk Unggah PDF</h4>
            </div>

            <div className="mt-8">
              <div className="flex items-center gap-2 mb-4">
                <Database className="w-4 h-4 text-[#65676B]" />
                <span className="text-[11px] font-bold text-[#65676B] uppercase tracking-wider">File Terindeks ({pdfList.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto max-h-[200px] pr-2">
                {pdfList.map((pdf, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-[#F0F2F5] rounded-lg border border-[#E4E6EB]">
                    <span className="text-xs text-[#050505] truncate max-w-[150px]">{pdf.name}</span>
                    <button onClick={() => onRemovePdf(idx)} className="text-[#65676B] hover:text-red-500"><Trash2 size={14}/></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {mode === 'media' && (
          <div className="flex-grow flex flex-col">
            <div className="bg-[#F0F2F5] p-4 rounded-lg border border-[#E4E6EB] mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-[10px] text-[#65676B] uppercase font-bold mb-2 block">Nama Tag (Alias)</label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-2.5 w-4 h-4 text-[#65676B]" />
                    <input 
                      type="text" 
                      value={assetName}
                      onChange={(e) => setAssetName(e.target.value.replace(/\s/g, '_').toLowerCase())}
                      placeholder="contoh: syarat_daftar"
                      className="w-full bg-white border border-[#CCD0D5] rounded-lg py-2 pl-10 pr-4 text-xs text-[#050505] focus:border-[#0866FF] focus:ring-1 focus:ring-[#0866FF] outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-[#65676B] uppercase font-bold mb-2 block">Pilih File Gambar</label>
                  <input 
                    type="file" 
                    ref={mediaInputRef}
                    accept="image/*"
                    className="w-full text-xs text-[#65676B] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-[#0866FF] file:text-white hover:file:bg-[#166FE5]"
                  />
                </div>
              </div>
              <button 
                onClick={handleMediaSubmit}
                disabled={!assetName}
                className="w-full bg-[#0866FF] hover:bg-[#166FE5] disabled:opacity-50 text-white py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all"
              >
                <Plus size={16} /> SIMPAN ASET MEDIA
              </button>
            </div>

            <div className="flex-grow overflow-hidden flex flex-col">
               <div className="flex items-center gap-2 mb-4">
                <ImageIcon className="w-4 h-4 text-[#65676B]" />
                <span className="text-[11px] font-bold text-[#65676B] uppercase tracking-wider">Aset Library ({mediaAssets.length})</span>
              </div>
              
              <div className="grid grid-cols-1 gap-3 overflow-y-auto max-h-[350px] pr-2">
                {mediaAssets.map((item) => (
                  <div key={item.id} className="bg-[#F0F2F5] border border-[#E4E6EB] rounded-lg p-3 flex flex-col md:flex-row gap-4 group hover:border-[#0866FF] transition-colors">
                    <div className="w-full md:w-32 h-20 bg-[#E4E6EB] rounded-lg overflow-hidden shrink-0">
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
                          <span className="text-[10px] bg-[#E7F3FF] text-[#0866FF] px-1.5 py-0.5 rounded font-bold">ID: {item.id}</span>
                          <h5 className="text-xs font-bold text-[#050505] truncate">Tag: [[{item.asset_name}]]</h5>
                        </div>
                        <div className="flex items-center gap-2">
                           <button 
                            onClick={() => copyToClipboard(item.asset_name)}
                            className="p-1.5 hover:bg-[#E4E6EB] rounded-lg text-[#65676B] hover:text-[#050505] transition-colors"
                            title="Salin Tag"
                           >
                            <Copy size={14} />
                           </button>
                           <button 
                            onClick={() => onRemoveMedia(item.id)}
                            className="p-1.5 hover:bg-[#FFEBEE] rounded-lg text-[#65676B] hover:text-red-500 transition-colors"
                            title="Hapus"
                           >
                            <Trash2 size={14} />
                           </button>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[10px] text-[#65676B]">
                           <Database size={10} />
                           <span className="truncate">Path: {item.file_path}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-[#0866FF]">
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

      <div className="p-4 bg-[#F0F2F5] border-t border-[#E4E6EB] flex flex-wrap gap-6">
        <div className="flex items-center gap-2">
           <Zap className="w-3.5 h-3.5 text-[#F5A623]" />
           <span className="text-[10px] text-[#65676B] font-medium">Auto-sync Active</span>
        </div>
        <div className="flex items-center gap-2">
           <ShieldCheck className="w-3.5 h-3.5 text-[#0866FF]" />
           <span className="text-[10px] text-[#65676B] font-medium">End-to-end Encrypted</span>
        </div>
      </div>
    </div>
  );
};
