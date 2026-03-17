import React, { useState, useEffect, useRef } from "react";
import { Plus, Trash2, MessageSquare, Tag, Loader2, Image as ImageIcon, X } from "lucide-react";
import toast from "react-hot-toast";

interface Rule {
  id?: number;
  keyword: string;
  answer: string;
  image_url?: string;
}

interface Props {
  sessionId: string;
}

export const RulesSection: React.FC<Props> = ({ sessionId }) => {
  const [rules, setRules] = useState<Rule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  
  // State Form individual untuk memudahkan penggunaan FormData
  const [keyword, setKeyword] = useState("");
  const [answer, setAnswer] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Ref untuk mengontrol input file secara programatik
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchRules = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/ai-rules/${sessionId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const result = await response.json();
      if (result.success) setRules(result.data);
    } catch (err) {
      toast.error("Gagal mengambil daftar rules");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (sessionId) fetchRules();
  }, [sessionId]);

  const handleAddRule = async () => {
    if (!keyword || !answer) return toast.error("Isi keyword dan jawaban");
    
    setIsAdding(true);
    
    // Gunakan FormData karena kita mengirim file fisik
    const formData = new FormData();
    formData.append("sessionId", sessionId);
    formData.append("keyword", keyword);
    formData.append("answer", answer);
    if (selectedFile) {
      formData.append("image", selectedFile); // Key 'image' harus sama dengan upload.single('image') di backend
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/ai-rules/save`, {
        method: "POST",
        headers: { 
          // JANGAN set 'Content-Type': 'application/json' jika pakai FormData
          Authorization: `Bearer ${localStorage.getItem("token")}` 
        },
        body: formData,
      });
      
      const result = await response.json();
      if (result.success) {
        toast.success("Rule berhasil disimpan");
        setKeyword("");
        setAnswer("");
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        fetchRules();
      }
    } catch (err) {
      toast.error("Gagal menyimpan rule");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus rule ini?")) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/ai-rules/delete`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}` 
        },
        body: JSON.stringify({ id, sessionId }),
      });
      const result = await response.json();
      if (result.success) {
        toast.success("Rule dihapus");
        fetchRules();
      }
    } catch (err) {
      toast.error("Gagal menghapus");
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      {/* Form Input */}
      <div className="bg-[#202C33] p-6 rounded-2xl border border-[#313D45] shadow-xl">
        <h3 className="text-sm font-bold text-emerald-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Plus size={18} /> Tambah Auto Reply Baru
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Input Keyword */}
          <div className="md:col-span-3">
            <label className="text-[10px] text-[#8696A0] uppercase block mb-1">Keyword</label>
            <div className="relative">
              <Tag className="absolute left-3 top-3 text-[#8696A0]" size={16} />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="cth: harga"
                className="w-full bg-[#111B21] border border-[#313D45] rounded-xl py-2.5 pl-10 pr-4 text-sm focus:border-emerald-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Input Jawaban */}
          <div className="md:col-span-4">
            <label className="text-[10px] text-[#8696A0] uppercase block mb-1">Jawaban Otomatis</label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 text-[#8696A0]" size={16} />
              <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Masukkan jawaban..."
                className="w-full bg-[#111B21] border border-[#313D45] rounded-xl py-2.5 pl-10 pr-4 text-sm focus:border-emerald-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Input File (Ganti dari URL ke File) */}
          <div className="md:col-span-3">
            <label className="text-[10px] text-[#8696A0] uppercase block mb-1">Lampiran Gambar</label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="hidden"
                accept="image/*"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs border border-dashed transition-all ${
                  selectedFile 
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-400" 
                    : "border-[#41525D] text-[#8696A0] hover:bg-[#111B21]"
                }`}
              >
                {selectedFile ? (
                  <><ImageIcon size={14} /> {selectedFile.name.substring(0, 10)}...</>
                ) : (
                  <><ImageIcon size={14} /> Pilih File</>
                )}
              </button>
              {selectedFile && (
                <button 
                  onClick={() => setSelectedFile(null)}
                  className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

          <div className="md:col-span-2 flex items-end">
            <button
              onClick={handleAddRule}
              disabled={isAdding}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
            >
              {isAdding ? <Loader2 className="animate-spin" size={18} /> : "Simpan"}
            </button>
          </div>
        </div>
      </div>

      {/* List Table */}
      <div className="bg-[#202C33] rounded-2xl border border-[#313D45] overflow-hidden shadow-lg">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#111B21] text-[#8696A0] text-[10px] uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4">Keyword</th>
              <th className="px-6 py-4">Jawaban & Media</th>
              <th className="px-6 py-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#313D45]">
            {isLoading ? (
              <tr><td colSpan={3} className="text-center py-10 text-[#8696A0]">Memuat rules...</td></tr>
            ) : rules.length === 0 ? (
              <tr><td colSpan={3} className="text-center py-10 text-[#8696A0]">Belum ada rule chatbot.</td></tr>
            ) : (
              rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-[#2A3942] transition-colors group">
                  <td className="px-6 py-4">
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded text-xs font-mono">
                      {rule.keyword}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-[#D1D7DB]">{rule.answer}</span>
                      {rule.image_url && (
                        <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-500/5 w-fit px-2 py-0.5 rounded border border-emerald-500/10 mt-1">
                          <ImageIcon size={12} />
                          Gambar Terlampir
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => handleDelete(rule.id!)} 
                      className="text-[#8696A0] hover:text-red-400 p-2 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};