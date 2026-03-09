import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Save,
  Plus,
  Trash2,
  KeyRound,
  Hash,
  Type,
  AlertCircle,
  RefreshCcw,
  Smartphone,
} from "lucide-react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";

export const KeywordManager: React.FC<{ isDarkMode: boolean }> = ({
  isDarkMode,
}) => {
  const [keywords, setKeywords] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]); // State untuk daftar session
  const [newKw, setNewKw] = useState({
    platform: "",
    text: "",
    session_id: "",
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  // 1. Ambil Data Sessions (Untuk Dropdown)
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

  // 2. Ambil Data Keywords
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
      console.error("Gagal mengambil keywords:", err);
      setKeywords([]);
      if (err.response?.status === 401)
        toast.error("Sesi habis, silakan login kembali");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchKeywords();
    fetchSessions();
  }, []);

  // 3. Simpan Keyword
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKw.text.trim() || !newKw.platform.trim() || !newKw.session_id) {
      toast.error("Platform, Keyword, dan Perangkat wajib diisi");
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
          session_id: newKw.session_id, // Kirim session_id ke backend
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      toast.success("Keyword berhasil disimpan");
      setNewKw({ platform: "", text: "", session_id: "" });
      fetchKeywords();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal menyimpan keyword");
    } finally {
      setLoading(false);
    }
  };

  // 4. Hapus Keyword
  const handleDelete = async (id: number, platform?: string) => {
    const result = await Swal.fire({
      title: "Apakah Anda yakin?",
      text: `Keyword akan dihapus secara permanen.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#00a884",
      cancelButtonColor: "#ef4444",
      confirmButtonText: "Ya, Hapus!",
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
        toast.success("Terhapus!");
      } catch (error: any) {
        toast.error("Gagal menghapus");
      }
    }
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500 bg-transparent overflow-hidden">
      {/* HEADER */}
      <div
        className={`px-4 md:px-6 py-4 flex items-center justify-between border-b sticky top-0 z-10 ${isDarkMode ? "bg-[#202C33] border-[#313D45]" : "bg-[#F0F2F5] border-gray-200"}`}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-500/10 rounded-lg shrink-0">
            <KeyRound className="text-yellow-500" size={20} />
          </div>
          <div className="min-w-0">
            <h1
              className={`text-base md:text-lg font-bold truncate ${isDarkMode ? "text-[#E9EDEF]" : "text-[#111B21]"}`}
            >
              Manajemen Keyword Leads
            </h1>
            <p className="text-[10px] md:text-xs text-[#8696A0] truncate">
              Filter pesan otomatis per perangkat
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            fetchKeywords();
            fetchSessions();
          }}
          className={`p-2 rounded-full hover:bg-black/10 transition-colors ${fetching ? "animate-spin" : ""}`}
        >
          <RefreshCcw
            size={20}
            className={isDarkMode ? "text-[#8696A0]" : "text-[#54656F]"}
          />
        </button>
      </div>

      <div className="p-4 md:p-6 overflow-y-auto flex-1 space-y-6">
        {/* FORM INPUT */}
        <section
          className={`p-4 md:p-5 rounded-2xl border transition-all ${isDarkMode ? "bg-[#111B21] border-[#222D34]" : "bg-white border-gray-100 shadow-sm"}`}
        >
          <div className="flex items-center gap-2 mb-4">
            <Plus className="text-[#00a884]" size={18} />
            <h2
              className={`text-sm font-semibold ${isDarkMode ? "text-[#E9EDEF]" : "text-gray-700"}`}
            >
              Tambah Konfigurasi Baru
            </h2>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            {/* INPUT PERANGKAT / SESSION */}
            <div className="w-full">
              <label className="text-[10px] uppercase font-bold text-[#8696A0] ml-1 mb-1 block tracking-wider">
                Hubungkan ke Perangkat
              </label>
              <div className="relative">
                <Smartphone
                  className="absolute left-3 top-3 text-[#8696A0]"
                  size={16}
                />
                <select
                  value={newKw.session_id}
                  onChange={(e) =>
                    setNewKw({ ...newKw, session_id: e.target.value })
                  }
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all appearance-none ${isDarkMode ? "bg-[#202C33] text-white focus:ring-1 ring-[#00a884]" : "bg-[#F0F2F5] border focus:bg-white"}`}
                  required
                >
                  <option value="">Pilih Perangkat WhatsApp...</option>
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name || s.id}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* INPUT PLATFORM */}
              <div className="w-full">
                <label className="text-[10px] uppercase font-bold text-[#8696A0] ml-1 mb-1 block tracking-wider">
                  Platform / Sumber
                </label>
                <div className="relative">
                  <Hash
                    className="absolute left-3 top-3 text-[#8696A0]"
                    size={16}
                  />
                  <input
                    type="text"
                    placeholder="Contoh: TikTok, FB Ads"
                    value={newKw.platform}
                    onChange={(e) =>
                      setNewKw({ ...newKw, platform: e.target.value })
                    }
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all ${isDarkMode ? "bg-[#202C33] text-white focus:ring-1 ring-[#00a884]" : "bg-[#F0F2F5] border"}`}
                    required
                  />
                </div>
              </div>

              {/* INPUT KEYWORD */}
              <div className="w-full">
                <label className="text-[10px] uppercase font-bold text-[#8696A0] ml-1 mb-1 block tracking-wider">
                  Isi Keyword Pesan
                </label>
                <div className="relative">
                  <Type
                    className="absolute left-3 top-3 text-[#8696A0]"
                    size={16}
                  />
                  <input
                    type="text"
                    placeholder="Kalimat deteksi..."
                    value={newKw.text}
                    onChange={(e) =>
                      setNewKw({ ...newKw, text: e.target.value })
                    }
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all ${isDarkMode ? "bg-[#202C33] text-white focus:ring-1 ring-[#00a884]" : "bg-[#F0F2F5] border"}`}
                    required
                  />
                </div>
              </div>
            </div>

            <button
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 bg-[#00a884] hover:bg-[#008f6f] text-[#111B21] transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <RefreshCcw className="animate-spin" size={18} />
              ) : (
                <>
                  <Save size={18} /> Simpan Konfigurasi
                </>
              )}
            </button>
          </form>
        </section>

        {/* LIST KEYWORD */}
        <div className="space-y-3">
          <h3
            className={`text-[11px] uppercase font-black tracking-widest px-1 ${isDarkMode ? "text-[#54656f]" : "text-gray-400"}`}
          >
            Daftar Filter Aktif
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {keywords.map((k: any) => (
              <div
                key={k.id}
                className={`group flex items-center justify-between p-4 rounded-2xl border transition-all ${isDarkMode ? "bg-[#202C33] border-[#2A3942]" : "bg-white border-gray-100 shadow-sm"}`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-[#00a884] shrink-0 ${isDarkMode ? "bg-[#111B21]" : "bg-[#F0F2F5]"}`}
                  >
                    {k.platform?.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-bold capitalize ${isDarkMode ? "text-[#E9EDEF]" : "text-[#111B21]"}`}
                      >
                        {k.platform}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#00a884]/10 text-[#00a884] font-medium uppercase">
                        {k.session_name || "Semua Sesi"}
                      </span>
                    </div>
                    <p
                      className={`text-xs mt-0.5 italic truncate ${isDarkMode ? "text-[#8696A0]" : "text-gray-500"}`}
                    >
                      "{k.keyword_text}"
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(k.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg md:opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
