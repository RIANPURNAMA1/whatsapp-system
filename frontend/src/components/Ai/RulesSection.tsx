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
  
  const [keyword, setKeyword] = useState("");
  const [answer, setAnswer] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
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
    
    const formData = new FormData();
    formData.append("sessionId", sessionId);
    formData.append("keyword", keyword);
    formData.append("answer", answer);
    if (selectedFile) {
      formData.append("image", selectedFile);
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/ai-rules/save`, {
        method: "POST",
        headers: { 
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
      <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
        <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Plus size={18} /> Tambah Auto Reply Baru
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-3">
            <label className="text-[10px] text-gray-500 uppercase font-semibold block mb-1">Keyword</label>
            <div className="relative">
              <Tag className="absolute left-3 top-3 text-gray-400" size={16} />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="cth: harga"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="md:col-span-4">
            <label className="text-[10px] text-gray-500 uppercase font-semibold block mb-1">Jawaban Otomatis</label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 text-gray-400" size={16} />
              <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Masukkan jawaban..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="md:col-span-3">
            <label className="text-[10px] text-gray-500 uppercase font-semibold block mb-1">Lampiran Gambar</label>
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
                    ? "border-blue-500 bg-blue-50 text-blue-600" 
                    : "border-gray-300 text-gray-500 hover:bg-gray-50"
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
                  className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
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
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
            >
              {isAdding ? <Loader2 className="animate-spin" size={18} /> : "Simpan"}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 text-[10px] uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4 font-bold">Keyword</th>
              <th className="px-6 py-4 font-bold">Jawaban & Media</th>
              <th className="px-6 py-4 font-bold text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan={3} className="text-center py-10 text-gray-400">Memuat rules...</td></tr>
            ) : rules.length === 0 ? (
              <tr><td colSpan={3} className="text-center py-10 text-gray-400">Belum ada rule chatbot.</td></tr>
            ) : (
              rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="bg-blue-100 text-blue-600 border border-blue-200 px-2 py-1 rounded-lg text-xs font-mono font-semibold">
                      {rule.keyword}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-gray-700">{rule.answer}</span>
                      {rule.image_url && (
                        <div className="flex items-center gap-1.5 text-[10px] text-blue-600 bg-blue-50 w-fit px-2 py-0.5 rounded border border-blue-100 mt-1">
                          <ImageIcon size={12} />
                          Gambar Terlampir
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => handleDelete(rule.id!)} 
                      className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors"
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
