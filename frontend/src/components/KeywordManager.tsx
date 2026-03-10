import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Save,
  Plus,
  Trash2,
  KeyRound,
  Hash,
  Type,
  RefreshCcw,
  Smartphone,
  X,
  Filter
} from "lucide-react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";

export const KeywordManager: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
  // --- STATE ---
  const [keywords, setKeywords] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [newKw, setNewKw] = useState({ platform: "", text: "", session_id: "" });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // --- API CALLS ---
  const fetchSessions = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSessions(res.data?.data || []);
    } catch (err) {
      console.error("Gagal mengambil sessions:", err);
    }
  };

  const fetchKeywords = async () => {
    setFetching(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/keywords`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = res.data?.data || res.data;
      setKeywords(Array.isArray(result) ? result : []);
    } catch (err: any) {
      setKeywords([]);
      if (err.response?.status === 401) toast.error("Sesi habis, silakan login kembali");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchKeywords();
    fetchSessions();
  }, []);

  // --- HANDLERS ---
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKw.text.trim() || !newKw.platform.trim() || !newKw.session_id) {
      toast.error("Semua kolom wajib diisi");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${import.meta.env.VITE_API_URL}/keywords/save`,
        {
          platform: newKw.platform.toLowerCase(),
          keyword_text: newKw.text,
          session_id: newKw.session_id,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Berhasil disimpan");
      setNewKw({ platform: "", text: "", session_id: "" });
      setIsFormOpen(false); // Tutup form setelah simpan
      fetchKeywords();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal menyimpan");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: "Hapus Keyword?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Ya, Hapus",
      background: isDarkMode ? "#202C33" : "#fff",
      color: isDarkMode ? "#fff" : "#111B21",
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(`${import.meta.env.VITE_API_URL}/keywords/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchKeywords();
        toast.success("Terhapus");
      } catch (error) {
        toast.error("Gagal menghapus");
      }
    }
  };

  // --- RENDER ---
  return (
    <div className={`flex flex-col min-h-screen ${isDarkMode ? "bg-[#0B141A]" : "bg-[#F0F2F5]"}`}>
      
      {/* HEADER */}
      <header className={`px-4 py-3 flex items-center justify-between border-b sticky top-0 z-30 ${isDarkMode ? "bg-[#202C33] border-[#313D45]" : "bg-white border-gray-100 shadow-sm"}`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-yellow-500/10 rounded-xl flex items-center justify-center">
            <KeyRound className="text-yellow-500" size={20} />
          </div>
          <div>
            <h1 className={`text-sm font-bold ${isDarkMode ? "text-[#E9EDEF]" : "text-[#111B21]"}`}>Keywords</h1>
            <p className="text-[10px] text-[#8696A0]">Sistem Filter SatuPintu</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button onClick={() => fetchKeywords()} className={`p-2 rounded-full ${fetching ? "animate-spin" : ""}`}>
            <RefreshCcw size={18} className={isDarkMode ? "text-[#8696A0]" : "text-[#54656F]"} />
          </button>
          <button 
            onClick={() => setIsFormOpen(!isFormOpen)}
            className={`p-2 rounded-full transition-all ${isFormOpen ? "bg-red-500 text-white rotate-90" : "bg-[#00a884] text-white"}`}
          >
            {isFormOpen ? <X size={20} /> : <Plus size={20} />}
          </button>
        </div>
      </header>

      <main className="p-4 space-y-6 pb-24 max-w-2xl mx-auto w-full">
        
        {/* FORM (Hanya muncul jika isFormOpen true) */}
        {isFormOpen && (
          <section className={`p-5 rounded-2xl border animate-in slide-in-from-top-4 duration-300 ${isDarkMode ? "bg-[#111B21] border-[#222D34]" : "bg-white border-gray-200 shadow-xl"}`}>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-3">
                <div className="relative">
                  <Smartphone className="absolute left-3 top-3 text-[#8696A0]" size={16} />
                  <select
                    value={newKw.session_id}
                    onChange={(e) => setNewKw({ ...newKw, session_id: e.target.value })}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm appearance-none outline-none border ${isDarkMode ? "bg-[#202C33] border-[#2A3942] text-white" : "bg-gray-50 border-gray-200"}`}
                    required
                  >
                    <option value="">Pilih Perangkat...</option>
                    {sessions.map((s) => (
                      <option key={s.id} value={s.id}>{s.name || `Device ${s.id}`}</option>
                    ))}
                  </select>
                </div>

                <div className="relative">
                  <Filter className="absolute left-3 top-3 text-[#8696A0]" size={16} />
                  <input
                    type="text"
                    placeholder="Sumber (Contoh: TikTok)"
                    value={newKw.platform}
                    onChange={(e) => setNewKw({ ...newKw, platform: e.target.value })}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none border ${isDarkMode ? "bg-[#202C33] border-[#2A3942] text-white" : "bg-gray-50 border-gray-200"}`}
                    required
                  />
                </div>

                <div className="relative">
                  <Type className="absolute left-3 top-3 text-[#8696A0]" size={16} />
                  <input
                    type="text"
                    placeholder="Isi Keyword Pesan..."
                    value={newKw.text}
                    onChange={(e) => setNewKw({ ...newKw, text: e.target.value })}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none border ${isDarkMode ? "bg-[#202C33] border-[#2A3942] text-white" : "bg-gray-50 border-gray-200"}`}
                    required
                  />
                </div>
              </div>

              <button
                disabled={loading}
                className="w-full py-3.5 rounded-xl text-sm font-bold bg-[#00a884] text-white shadow-lg active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? <RefreshCcw className="animate-spin mx-auto" size={18} /> : "Simpan Filter Baru"}
              </button>
            </form>
          </section>
        )}

        {/* LIST */}
        <div className="space-y-3">
          <h3 className={`text-[10px] font-black tracking-widest uppercase px-1 ${isDarkMode ? "text-[#54656f]" : "text-gray-400"}`}>
            Filter Aktif ({keywords.length})
          </h3>

          <div className="grid grid-cols-1 gap-3">
            {keywords.map((k: any) => (
              <div
                key={k.id}
                className={`flex items-center p-3.5 rounded-2xl border ${isDarkMode ? "bg-[#111B21] border-[#222D34]" : "bg-white border-gray-100 shadow-sm"}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${isDarkMode ? "bg-[#202C33] text-[#00a884]" : "bg-[#F0F2F5] text-[#00a884]"}`}>
                  {k.platform?.charAt(0).toUpperCase()}
                </div>

                <div className="ml-4 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold truncate ${isDarkMode ? "text-[#E9EDEF]" : "text-[#111B21]"}`}>
                      {k.platform}
                    </span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#00a884]/10 text-[#00a884] font-bold border border-[#00a884]/10 uppercase">
                      {k.session_name || "Device"}
                    </span>
                  </div>
                  <p className={`text-[11px] mt-0.5 truncate italic ${isDarkMode ? "text-[#8696A0]" : "text-gray-500"}`}>
                    "{k.keyword_text}"
                  </p>
                </div>

                <button
                  onClick={() => handleDelete(k.id)}
                  className={`p-2 ml-2 rounded-lg ${isDarkMode ? "text-red-400" : "text-red-500"}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          {keywords.length === 0 && !fetching && (
            <div className="py-12 text-center opacity-30">
              <Hash size={40} className="mx-auto mb-2" />
              <p className="text-xs">Belum ada data</p>
            </div>
          )}
        </div>
      </main>

      {/* FAB - Floating Button (Hanya muncul saat form tertutup) */}
      {!isFormOpen && (
        <button 
          onClick={() => setIsFormOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-[#00a884] text-white rounded-full shadow-2xl flex items-center justify-center z-40 active:scale-90 transition-transform"
        >
          <Plus size={28} />
        </button>
      )}
    </div>
  );
};