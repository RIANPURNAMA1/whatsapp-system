import React from 'react';
import { ImageIcon, Plus, Trash2, Link as LinkIcon, Tag } from 'lucide-react';

interface MediaReplyProps {
  list: any[];
  onAdd: () => void;
  onChange: (newList: any[]) => void;
}

export const MediaReplySection: React.FC<MediaReplyProps> = ({ list, onAdd, onChange }) => {
  const updateItem = (id: string, field: string, val: string) => {
    onChange(list.map(m => m.id === id ? { ...m, [field]: val } : m));
  };

  const removeItem = (id: string) => {
    onChange(list.filter(m => m.id !== id));
  };

  return (
    <div className="bg-[#202C33] rounded-md p-5 border border-blue-500/20 shadow-xl">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-500/10 rounded-md">
            <ImageIcon className="w-5 h-5 text-blue-400" />
          </div>
          <h3 className="font-bold text-sm text-white tracking-wide uppercase">Media Reply</h3>
        </div>
        <button 
          onClick={onAdd} 
          className="p-1.5 bg-blue-500/10 text-blue-400 rounded-md hover:bg-blue-500 hover:text-[#111B21] transition-all duration-200 shadow-lg active:scale-95"
          title="Tambah Media"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* LIST ITEMS */}
      <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#313D45]">
        {list.length === 0 ? (
          <div className="py-8 text-center border-2 border-dashed border-[#313D45] rounded-md">
            <p className="text-[11px] text-[#8696A0]">Belum ada media reply ditambahkan.</p>
          </div>
        ) : (
          list.map((media) => (
            <div 
              key={media.id} 
              className="p-3 bg-[#2A3942]/50 rounded-md border border-[#313D45] hover:border-blue-500/30 transition-colors group relative"
            >
              <div className="space-y-2.5">
                {/* INPUT KEYWORD */}
                <div className="relative">
                  <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-blue-400/50" />
                  <input 
                    placeholder="Kata kunci (contoh: brosur)"
                    value={media.keyword}
                    onChange={(e) => updateItem(media.id, 'keyword', e.target.value)}
                    className="w-full bg-[#111B21] border border-[#313D45] rounded-md pl-8 pr-3 py-2 text-[11px] outline-none focus:border-blue-500/50 text-white placeholder:text-[#54656f] transition-all"
                  />
                </div>

                {/* INPUT URL */}
                <div className="relative">
                  <LinkIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#8696A0]" />
                  <input 
                    placeholder="URL Gambar (https://...)"
                    value={media.imageUrl}
                    onChange={(e) => updateItem(media.id, 'imageUrl', e.target.value)}
                    className="w-full bg-[#111B21] border border-[#313D45] rounded-md pl-8 pr-3 py-2 text-[10px] font-mono outline-none focus:border-blue-500/50 text-[#8696A0] focus:text-white placeholder:text-[#54656f] transition-all"
                  />
                </div>
              </div>

              {/* DELETE BUTTON - Muncul saat hover */}
              <button 
                onClick={() => removeItem(media.id)}
                className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* FOOTER HINT */}
      <div className="mt-4 pt-4 border-t border-[#313D45]">
        <p className="text-[9px] text-[#8696A0] leading-relaxed italic">
          * Saat user mengirimkan kata kunci di atas, AI akan melampirkan gambar tersebut.
        </p>
      </div>
    </div>
  );
};