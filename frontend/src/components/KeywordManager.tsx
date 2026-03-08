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
  const [newKw, setNewKw] = useState({ platform: "", text: "" });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

const fetchKeywords = async () => {
  setFetching(true);
  try {
    // 1. Ambil token jika API kamu pakai middleware authenticateToken
    const token = localStorage.getItem("token"); 

    const res = await axios.get(`${import.meta.env.VITE_API_URL}/keywords`, {
      headers: {
        Authorization: `Bearer ${token}` // Sertakan token jika perlu
      }
    });

    console.log("Cek Respon API:", res.data);

    // 2. Cek apakah data ada di dalam res.data.data atau langsung di res.data
    // Ini menangani jika API mengirim { data: [...] } atau langsung [...]
    const result = res.data?.data || res.data;
    
    if (Array.isArray(result)) {
      setKeywords(result);
    } else {
      console.error("Format API salah, bukan Array:", result);
      setKeywords([]);
    }
  } catch (err: any) {
    console.error("Gagal mengambil data:", err.response?.data || err.message);
    setKeywords([]);
    
    // Jika error karena belum login (401), kasih info
    if (err.response?.status === 401) {
      toast.error("Sesi habis, silakan login kembali");
    }
  } finally {
    setFetching(false);
  }
};

  useEffect(() => {
    fetchKeywords();
  }, []);

const handleSave = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!newKw.text.trim() || !newKw.platform.trim()) {
    toast.error("Platform dan Keyword wajib diisi");
    return;
  }

  setLoading(true);
  try {
    // 1. Ambil token dari storage (sesuaikan dengan nama kunci saat kamu simpan)
    const token = localStorage.getItem("token"); 

    // 2. Kirim POST dengan Header Authorization
    await axios.post(
      `${import.meta.env.VITE_API_URL}/keywords/save`, 
      {
        platform: newKw.platform.toLowerCase(),
        keyword_text: newKw.text,
      },
      {
        headers: {
          Authorization: `Bearer ${token}` // Tambahkan baris ini
        }
      }
    );

    toast.success("Keyword berhasil disimpan");
    setNewKw({ platform: "", text: "" });
    fetchKeywords();
  } catch (err: any) {
    // Cek jika errornya memang karena token
    if (err.response?.status === 401) {
      toast.error("Sesi Anda berakhir, silakan login kembali");
    } else {
      toast.error("Gagal menyimpan keyword");
    }
    console.error("Error Detail:", err.response?.data);
  } finally {
    setLoading(false);
  }
};



const handleDelete = async (id: number, platform?: string) => {
  // 1. Tampilkan Konfirmasi SweetAlert
  const result = await Swal.fire({
    title: "Apakah Anda yakin?",
    text: platform 
      ? `Keyword untuk platform ${platform} akan dihapus secara permanen.` 
      : "Keyword ini akan dihapus secara permanen.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#00a884", // Warna hijau WhatsApp
    cancelButtonColor: "#ef4444", // Warna merah
    confirmButtonText: "Ya, Hapus!",
    cancelButtonText: "Batal",
    background: isDarkMode ? "#202C33" : "#fff",
    color: isDarkMode ? "#fff" : "#111B21",
  });

  // 2. Jika user menekan "Ya, Hapus!"
  if (result.isConfirmed) {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${import.meta.env.VITE_API_URL}/keywords/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        // Refresh list setelah berhasil
        fetchKeywords(); 
        
        // Notifikasi Sukses SweetAlert
        Swal.fire({
          title: "Terhapus!",
          text: "Keyword berhasil dihapus.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
          background: isDarkMode ? "#202C33" : "#fff",
          color: isDarkMode ? "#fff" : "#111B21",
        });
      } else {
        throw new Error(data.message || "Gagal menghapus keyword");
      }
    } catch (error: any) {
      console.error("Delete error:", error);
      
      // Notifikasi Gagal SweetAlert
      Swal.fire({
        title: "Error!",
        text: error.message || "Terjadi kesalahan koneksi.",
        icon: "error",
        background: isDarkMode ? "#202C33" : "#fff",
        color: isDarkMode ? "#fff" : "#111B21",
      });
    }
  }
};

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500 bg-transparent overflow-hidden">
      {/* HEADER */}
      <div
        className={`px-4 md:px-6 py-4 flex items-center justify-between border-b sticky top-0 z-10 ${
          isDarkMode
            ? "bg-[#202C33] border-[#313D45]"
            : "bg-[#F0F2F5] border-gray-200"
        }`}
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
              Filter pesan otomatis sumber iklan
            </p>
          </div>
        </div>
        <button
          onClick={fetchKeywords}
          className={`p-2 rounded-full hover:bg-black/10 transition-colors shrink-0 ${fetching ? "animate-spin" : ""}`}
        >
          <RefreshCcw
            size={20}
            className={isDarkMode ? "text-[#8696A0]" : "text-[#54656F]"}
          />
        </button>
      </div>

      <div className="p-4 md:p-6 overflow-y-auto flex-1 space-y-6">
        {/* FORM INPUT RESPONSIVE */}
        <section
          className={`p-4 md:p-5 rounded-2xl border transition-all ${
            isDarkMode
              ? "bg-[#111B21] border-[#222D34]"
              : "bg-white border-gray-100 shadow-sm"
          }`}
        >
          <div className="flex items-center gap-2 mb-4">
            <Plus className="text-[#00a884]" size={18} />
            <h2
              className={`text-sm font-semibold ${isDarkMode ? "text-[#E9EDEF]" : "text-gray-700"}`}
            >
              Tambah Keyword Baru
            </h2>
          </div>

          <form onSubmit={handleSave} className="flex flex-col gap-4">
            {/* Input Platform (Teks Bebas) - Full Width */}
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
                  placeholder="Contoh: TikTok, FB Ads, dll"
                  value={newKw.platform}
                  onChange={(e) =>
                    setNewKw({ ...newKw, platform: e.target.value })
                  }
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all ${
                    isDarkMode
                      ? "bg-[#202C33] text-white focus:ring-1 ring-[#00a884]"
                      : "bg-[#F0F2F5] border focus:bg-white"
                  }`}
                  required
                />
              </div>
            </div>

            {/* Input Keyword - Full Width */}
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
                  placeholder="Kalimat pembuka pesan yang dideteksi..."
                  value={newKw.text}
                  onChange={(e) => setNewKw({ ...newKw, text: e.target.value })}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all ${
                    isDarkMode
                      ? "bg-[#202C33] text-white focus:ring-1 ring-[#00a884]"
                      : "bg-[#F0F2F5] border focus:bg-white"
                  }`}
                  required
                />
              </div>
            </div>

            {/* Tombol Simpan - Full Width */}
            <div className="w-full pt-2">
              <button
                disabled={loading}
                className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 bg-[#00a884] hover:bg-[#008f6f] text-[#111B21] transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-[#00a884]/10"
              >
                {loading ? (
                  <RefreshCcw className="animate-spin" size={18} />
                ) : (
                  <>
                    <Save size={18} /> Simpan Konfigurasi
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-4 p-3 bg-blue-500/5 rounded-xl flex items-start gap-2 border border-blue-500/10">
            <AlertCircle className="text-blue-500 shrink-0 mt-0.5" size={14} />
            <p className="text-[10px] md:text-xs text-[#8696A0] leading-relaxed">
              <strong>Tips:</strong> Platform digunakan untuk pelabelan
              otomatis, sedangkan Keyword digunakan untuk mendeteksi pesan masuk
              dari customer.
            </p>
          </div>
        </section>

        {/* LIST KEYWORD */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3
              className={`text-[11px] uppercase font-black tracking-widest ${isDarkMode ? "text-[#54656f]" : "text-gray-400"}`}
            >
              Daftar Aktif ({keywords?.length || 0})
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {keywords?.length === 0 && !fetching && (
              <div className="text-center py-12 border-2 border-dashed border-[#222D34] rounded-2xl opacity-50">
                <Smartphone className="mx-auto mb-2 opacity-20" size={32} />
                <p className="text-sm">Belum ada keyword yang diatur.</p>
              </div>
            )}

            {keywords?.map((k: any) => (
              <div
                key={k.id}
                className={`group flex items-center justify-between p-4 rounded-2xl border transition-all ${
                  isDarkMode
                    ? "bg-[#202C33] border-[#2A3942] hover:bg-[#2A3942]"
                    : "bg-white border-gray-100 hover:shadow-sm"
                }`}
              >
                <div className="flex items-center gap-3 md:gap-4 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      isDarkMode
                        ? "bg-[#111B21] text-[#00a884]"
                        : "bg-[#F0F2F5] text-[#00a884]"
                    }`}
                  >
                    {k.platform?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-bold capitalize truncate ${isDarkMode ? "text-[#E9EDEF]" : "text-[#111B21]"}`}
                      >
                        {k.platform}
                      </span>
                      <span className="hidden md:inline-block text-[10px] text-[#8696A0]">
                        • {new Date(k.updated_at).toLocaleDateString("id-ID")}
                      </span>
                    </div>
                    <p
                      className={`text-xs md:text-sm mt-0.5 truncate italic ${isDarkMode ? "text-[#8696A0]" : "text-gray-500"}`}
                    >
                      "{k.keyword_text}"
                    </p>
                  </div>
                </div>

                <button
          onClick={() => handleDelete(k.id)} // Cukup kirim ID saja
                  className={`p-2 rounded-lg transition-all shrink-0 ${
                    isDarkMode
                      ? "text-red-400 hover:bg-red-400/10 md:opacity-0 group-hover:opacity-100"
                      : "text-red-500 hover:bg-red-50 md:opacity-0 group-hover:opacity-100"
                  }`}
                  title="Hapus"
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
