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
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-lg border border-[#E4E6EB]">
        <h3 className="text-sm font-bold text-[#1877F2] uppercase tracking-wider mb-4 flex items-center gap-2">
          <Plus size={18} /> Tambah Auto Reply Baru
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-3">
            <label className="text-[10px] text-[#65676B] uppercase font-semibold block mb-1">Keyword</label>
            <div className="relative">
              <Tag className="absolute left-3 top-3 text-[#65676B]" size={16} />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="cth: harga"
                className="w-full bg-[#F0F2F5] border border-[#CCD0D5] rounded-lg py-2.5 pl-10 pr-4 text-sm focus:border-[#1877F2] focus:ring-1 focus:ring-[#1877F2] outline-none transition-all text-[#050505] placeholder:text-[#65676B]"
              />
            </div>
          </div>

          <div className="md:col-span-4">
            <label className="text-[10px] text-[#65676B] uppercase font-semibold block mb-1">Jawaban Otomatis</label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 text-[#65676B]" size={16} />
              <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Masukkan jawaban..."
                className="w-full bg-[#F0F2F5] border border-[#CCD0D5] rounded-lg py-2.5 pl-10 pr-4 text-sm focus:border-[#1877F2] focus:ring-1 focus:ring-[#1877F2] outline-none transition-all text-[#050505] placeholder:text-[#65676B]"
              />
            </div>
          </div>

          <div className="md:col-span-3">
            <label className="text-[10px] text-[#65676B] uppercase font-semibold block mb-1">Lampiran Gambar</label>
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
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs border border-dashed transition-all ${
                  selectedFile 
                    ? "border-[#1877F2] bg-[#E7F3FF] text-[#1877F2]" 
                    : "border-[#CCD0D5] text-[#65676B] hover:bg-[#F2F3F5]"
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
                  className="p-2 text-[#65676B] hover:bg-[#FFEBEE] hover:text-red-500 rounded-lg transition-colors"
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
              className="w-full bg-[#1877F2] hover:bg-[#166FE5] disabled:opacity-50 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 text-white"
            >
              {isAdding ? <Loader2 className="animate-spin" size={18} /> : "Simpan"}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-[#E4E6EB] overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#F0F2F5] text-[#65676B] text-[10px] uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4 font-bold">Keyword</th>
              <th className="px-6 py-4 font-bold">Jawaban & Media</th>
              <th className="px-6 py-4 font-bold text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E4E6EB]">
            {isLoading ? (
              <tr><td colSpan={3} className="text-center py-10 text-[#65676B]">Memuat rules...</td></tr>
            ) : rules.length === 0 ? (
              <tr><td colSpan={3} className="text-center py-10 text-[#65676B]">Belum ada rule chatbot.</td></tr>
            ) : (
              rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-[#F2F3F5] transition-colors">
                  <td className="px-6 py-4">
                    <span className="bg-[#E7F3FF] text-[#1877F2] border border-[#1877F2] px-2 py-1 rounded-lg text-xs font-mono font-semibold">
                      {rule.keyword}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-[#050505]">{rule.answer}</span>
                      {rule.image_url && (
                        <div className="flex items-center gap-1.5 text-[10px] text-[#1877F2] bg-[#E7F3FF] w-fit px-2 py-0.5 rounded border border-[#1877F2] mt-1">
                          <ImageIcon size={12} />
                          Gambar Terlampir
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => handleDelete(rule.id!)} 
                      className="text-[#65676B] hover:text-red-500 p-2 hover:bg-[#FFEBEE] rounded-lg transition-colors"
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
