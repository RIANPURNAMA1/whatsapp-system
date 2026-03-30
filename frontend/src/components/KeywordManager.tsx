import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Plus,
  Trash2,
  KeyRound,
  RefreshCcw,
  Search,
  MessageSquare,
  Smartphone,
  Target,
  Tag,
  Sparkles,
  X,
  Check,
} from "lucide-react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const KeywordManager: React.FC<{ isDarkMode?: boolean }> = () => {
  const [keywords, setKeywords] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [newKw, setNewKw] = useState({ platform: "", text: "", session_id: "" });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");

  const platforms = ["all", "tiktok", "instagram", "facebook", "twitter", "whatsapp", "telegram"];

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

      toast.success("Keyword berhasil ditambahkan");
      setNewKw({ platform: "", text: "", session_id: "" });
      setIsFormOpen(false);
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
      text: "Data yang dihapus tidak dapat dikembalikan.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
      background: "#ffffff",
      color: "#111B21",
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(`${import.meta.env.VITE_API_URL}/keywords/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchKeywords();
        toast.success("Keyword berhasil dihapus");
      } catch (error) {
        toast.error("Gagal menghapus");
      }
    }
  };

  const filteredKeywords = keywords.filter((k: any) => {
    const matchesSearch = 
      k.platform?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.keyword_text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.session_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPlatform = selectedPlatform === "all" || k.platform?.toLowerCase() === selectedPlatform;
    
    return matchesSearch && matchesPlatform;
  });

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      tiktok: "from-rose-500 to-pink-500",
      instagram: "from-purple-500 to-pink-500",
      facebook: "from-blue-600 to-blue-700",
      twitter: "from-sky-500 to-blue-500",
      whatsapp: "from-green-500 to-emerald-500",
      telegram: "from-blue-400 to-sky-500",
    };
    return colors[platform?.toLowerCase()] || "from-gray-500 to-gray-600";
  };

  const getPlatformIcon = (platform: string) => {
    return <span className="text-lg">{platform?.charAt(0).toUpperCase()}</span>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* HEADER */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-purple-500/20">
                <KeyRound className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
                  Keyword Management
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                  Kelola kata kunci untuk routing pesan otomatis
                </p>
              </div>
            </div>

            <Button 
              onClick={() => setIsFormOpen(true)}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/25 gap-2 px-6 h-12 text-base"
            >
              <Plus className="w-5 h-5" />
              Tambah Keyword
            </Button>
          </div>

          {/* FILTERS */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input 
                type="text" 
                placeholder="Cari keyword, platform, atau perangkat..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 bg-white/80 backdrop-blur-sm border-gray-200/80 h-12 text-base focus:border-violet-500 focus:ring-violet-500/20 rounded-xl"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {platforms.map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedPlatform(p)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    selectedPlatform === p
                      ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25"
                      : "bg-white/80 backdrop-blur-sm border border-gray-200/80 text-gray-600 hover:border-violet-300 hover:text-violet-600"
                  }`}
                >
                  {p === "all" ? "Semua" : p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Keyword</p>
                <p className="text-4xl font-bold text-gray-900">{keywords.length}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-violet-100 to-purple-100 rounded-2xl flex items-center justify-center">
                <Tag className="w-7 h-7 text-violet-600" />
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Perangkat Aktif</p>
                <p className="text-4xl font-bold text-gray-900">{sessions.length}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-green-100 rounded-2xl flex items-center justify-center">
                <Smartphone className="w-7 h-7 text-emerald-600" />
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Hasil Filter</p>
                <p className="text-4xl font-bold text-gray-900">{filteredKeywords.length}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center">
                <Target className="w-7 h-7 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* KEYWORD LIST */}
        {fetching ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-16 h-16 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
            <p className="text-gray-500 mt-6 text-lg">Memuat data...</p>
          </div>
        ) : filteredKeywords.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 p-16 text-center shadow-sm">
            <div className="w-24 h-24 bg-gradient-to-br from-violet-100 to-indigo-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-12 h-12 text-violet-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              {searchQuery || selectedPlatform !== "all" ? "Tidak ditemukan" : "Belum ada keyword"}
            </h3>
            <p className="text-gray-500 text-base mb-8 max-w-md mx-auto">
              {searchQuery || selectedPlatform !== "all" 
                ? "Coba ubah kata kunci pencarian atau filter platform"
                : "Tambahkan keyword baru untuk memulai routing pesan otomatis berdasarkan kata kunci"
              }
            </p>
            {!searchQuery && selectedPlatform === "all" && (
              <Button 
                onClick={() => setIsFormOpen(true)}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 gap-2 px-8 h-12 text-base shadow-lg shadow-purple-500/25"
              >
                <Plus className="w-5 h-5" />
                Tambah Keyword Pertama
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredKeywords.map((k: any, index: number) => (
              <div
                key={k.id}
                className="group bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 p-5 hover:border-violet-200 hover:shadow-lg hover:shadow-violet-500/5 transition-all duration-300"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-5">
                  <div className={`w-12 h-12 bg-gradient-to-br ${getPlatformColor(k.platform)} rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0`}>
                    {getPlatformIcon(k.platform)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <span className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                        {k.platform}
                      </span>
                      <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                      <span className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">
                        {k.session_name || "Device"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-violet-500 shrink-0" />
                      <p className="text-gray-700 font-medium">
                        "{k.keyword_text}"
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(k.id)}
                    className="p-3 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                    title="Hapus keyword"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ADD FORM DIALOG */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <DialogTitle className="text-xl">Tambah Keyword Baru</DialogTitle>
            </div>
            <p className="text-gray-500 text-sm">Keyword akan digunakan untuk routing pesan otomatis</p>
          </DialogHeader>
          
          <form onSubmit={handleSave} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                Perangkat WhatsApp
              </label>
              <select
                value={newKw.session_id}
                onChange={(e) => setNewKw({ ...newKw, session_id: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 appearance-none cursor-pointer"
                required
              >
                <option value="">Pilih Perangkat...</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name || `Device ${s.id}`} {s.phone_number ? `(${s.phone_number})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Sumber Platform
              </label>
              <Input 
                type="text"
                placeholder="Contoh: tiktok, instagram, facebook"
                value={newKw.platform}
                onChange={(e) => setNewKw({ ...newKw, platform: e.target.value })}
                required
                className="h-12 text-base"
              />
              <p className="text-xs text-gray-400">Masukkan nama platform sumber pesan</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Kata Kunci
              </label>
              <Input 
                type="text"
                placeholder="Masukkan kata kunci filter..."
                value={newKw.text}
                onChange={(e) => setNewKw({ ...newKw, text: e.target.value })}
                required
                className="h-12 text-base"
              />
              <p className="text-xs text-gray-400">Pesan yang mengandung kata ini akan di-route ke perangkat terkait</p>
            </div>

            <DialogFooter className="gap-3 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsFormOpen(false)}
                className="flex-1 h-11"
              >
                Batal
              </Button>
              <Button 
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 h-11"
              >
                {loading ? (
                  <RefreshCcw className="animate-spin mx-auto" size={18} />
                ) : (
                  <span className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Simpan Keyword
                  </span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
