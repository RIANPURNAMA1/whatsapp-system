import React, { useState, useEffect } from "react";
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
  Edit,
  Leaf,
} from "lucide-react";
import api from "../lib/api";
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
  const [organikKeywords, setOrganikKeywords] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [newKw, setNewKw] = useState({ platform: "", text: "", session_id: "" });
  const [newOrganik, setNewOrganik] = useState({ keyword: "", is_active: true });
  const [editKw, setEditKw] = useState<any>(null);
  const [editOrganik, setEditOrganik] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isOrganikFormOpen, setIsOrganikFormOpen] = useState(false);
  const [isOrganikEditOpen, setIsOrganikEditOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");

  const platforms = ["all", "tiktok", "instagram", "facebook", "twitter", "whatsapp", "telegram"];

  const platformColors: Record<string, string> = {
    tiktok: "#E74C3C",
    instagram: "#E1306C",
    facebook: "#0866FF",
    twitter: "#1DA1F2",
    whatsapp: "#25D366",
    telegram: "#0088CC",
  };

  const fetchSessions = async () => {
    try {
      const res = await api.get("/sessions");
      setSessions(res.data?.data || []);
    } catch (err) {
      console.error("Gagal mengambil sessions:", err);
    }
  };

  const fetchKeywords = async () => {
    setFetching(true);
    try {
      const res = await api.get("/keywords");
      const result = res.data?.data || res.data;
      setKeywords(Array.isArray(result) ? result : []);
    } catch (err: any) {
      setKeywords([]);
      if (err.response?.status === 401) toast.error("Sesi habis, silakan login kembali");
    } finally {
      setFetching(false);
    }
  };

  const fetchOrganikKeywords = async () => {
    try {
      const res = await api.get("/organik-keywords");
      if (res.data?.success) {
        setOrganikKeywords(res.data.data || []);
      }
    } catch (err: any) {
      console.error("Fetch organik error:", err.response?.data || err.message);
    }
  };

  useEffect(() => {
    fetchKeywords();
    fetchOrganikKeywords();
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
      await api.post("/keywords/save", {
        platform: newKw.platform.toLowerCase(),
        keyword_text: newKw.text,
        session_id: newKw.session_id,
      });

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
      confirmButtonColor: "#E74C3C",
      cancelButtonColor: "#65676B",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/keywords/${id}`);
        fetchKeywords();
        toast.success("Keyword berhasil dihapus");
      } catch (error) {
        toast.error("Gagal menghapus");
      }
    }
  };

  const handleEdit = (keyword: any) => {
    setEditKw({
      id: keyword.id,
      platform: keyword.platform,
      text: keyword.keyword_text,
      session_id: keyword.session_id,
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editKw.platform.trim() || !editKw.text.trim() || !editKw.session_id) {
      toast.error("Semua kolom wajib diisi");
      return;
    }

    setLoading(true);
    try {
      await api.put(`/keywords/update/${editKw.id}`, {
        platform: editKw.platform.toLowerCase(),
        keyword_text: editKw.text,
        session_id: editKw.session_id,
      });

      toast.success("Keyword berhasil diperbarui");
      setIsEditOpen(false);
      setEditKw(null);
      fetchKeywords();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal memperbarui");
    } finally {
      setLoading(false);
    }
  };

  const handleOrganikSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrganik.keyword.trim()) {
      toast.error("Keyword organik wajib diisi");
      return;
    }

    setLoading(true);
    try {
      await api.post("/organik-keywords", { keyword: newOrganik.keyword, is_active: newOrganik.is_active });
      toast.success("Keyword organik berhasil ditambahkan");
      setNewOrganik({ keyword: "", is_active: true });
      setIsOrganikFormOpen(false);
      fetchOrganikKeywords();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal menyimpan");
    } finally {
      setLoading(false);
    }
  };

  const handleOrganikEdit = (item: any) => {
    setEditOrganik({ id: item.id, keyword: item.keyword, is_active: Boolean(item.is_active) });
    setIsOrganikEditOpen(true);
  };

  const handleOrganikUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editOrganik.keyword.trim()) {
      toast.error("Keyword organik wajib diisi");
      return;
    }

    setLoading(true);
    try {
      await api.put(`/organik-keywords/${editOrganik.id}`, { keyword: editOrganik.keyword, is_active: editOrganik.is_active });
      toast.success("Keyword organik berhasil diperbarui");
      setIsOrganikEditOpen(false);
      setEditOrganik(null);
      fetchOrganikKeywords();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal memperbarui");
    } finally {
      setLoading(false);
    }
  };

  const handleOrganikDelete = async (id: number) => {
    const result = await Swal.fire({
      title: "Hapus Keyword Organik?",
      text: "Data yang dihapus tidak dapat dikembalikan.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#E74C3C",
      cancelButtonColor: "#65676B",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/organik-keywords/${id}`);
        fetchOrganikKeywords();
        toast.success("Keyword organik berhasil dihapus");
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

  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      <div className=" mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* HEADER */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#E7F3FF" }}>
                <KeyRound className="w-5 h-5" style={{ color: "#0866FF" }} />
              </div>
              <div>
                <h1 className="text-xl font-bold" style={{ color: "#050505" }}>Keyword Management</h1>
                <p className="text-[12px]" style={{ color: "#65676B" }}>Kelola kata kunci untuk routing pesan otomatis</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => setIsFormOpen(true)} className="h-[34px] text-[12px] font-semibold gap-1.5 border-0" style={{ backgroundColor: "#0866FF" }}>
                <Plus className="w-4 h-4" />
                Tambah Keyword
              </Button>
              <Button onClick={() => setIsOrganikFormOpen(true)} className="h-[34px] text-[12px] font-semibold gap-1.5 border-0" style={{ backgroundColor: "#0866FF" }}>
                <Leaf className="w-4 h-4" />
                Keyword Organik
              </Button>
            </div>
          </div>

          {/* ORGANIK KEYWORDS */}
          {(() => {
            const hasOrganik = organikKeywords && Array.isArray(organikKeywords) && organikKeywords.length > 0;
            if (!hasOrganik) {
              return (
                <div className="mb-4 p-3 rounded-lg flex items-center justify-between" style={{ backgroundColor: "#E7F3FF" }}>
                  <div className="flex items-center gap-2">
                    <Leaf className="w-4 h-4" style={{ color: "#0866FF" }} />
                    <span className="text-[13px]" style={{ color: "#0866FF" }}>Belum ada keyword organik. Klik tombol Keyword Organik untuk menambah.</span>
                  </div>
                </div>
              );
            }
            return (
              <div className="mb-4 p-4 rounded-lg border" style={{ backgroundColor: "#FFFFFF", borderColor: "#E4E6EB" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Leaf className="w-4 h-4" style={{ color: "#0866FF" }} />
                  <h3 className="text-[14px] font-bold" style={{ color: "#050505" }}>Keyword Organik</h3>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md" style={{ backgroundColor: "#E7F3FF", color: "#0866FF" }}>{organikKeywords.length}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {organikKeywords.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border" style={{ backgroundColor: "#FFFFFF", borderColor: "#E4E6EB" }}>
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.is_active ? "#31A24C" : "#BCC0C4" }} />
                      <span className="text-[12px] font-medium" style={{ color: "#050505" }}>"{item.keyword}"</span>
                      <button onClick={() => handleOrganikEdit(item)} className="p-0.5 rounded hover:bg-[#F2F3F5]" style={{ color: "#8C939D" }}>
                        <Edit size={12} />
                      </button>
                      <button onClick={() => handleOrganikDelete(item.id)} className="p-0.5 rounded hover:bg-[#FFEBEE]" style={{ color: "#8C939D" }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* FILTERS */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#8C939D" }} />
              <Input
                type="text"
                placeholder="Cari keyword, platform, atau perangkat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 h-[36px] bg-[#F0F2F5] border-0 text-[12px] rounded-lg focus-visible:ring-0"
                style={{ color: "#050505" }}
              />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {platforms.map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedPlatform(p)}
                  className="h-[30px] px-3 rounded-md text-[11px] font-medium transition-all border"
                  style={{
                    backgroundColor: selectedPlatform === p ? "#0866FF" : "#FFFFFF",
                    borderColor: selectedPlatform === p ? "#0866FF" : "#E4E6EB",
                    color: selectedPlatform === p ? "#FFFFFF" : "#65676B",
                  }}
                >
                  {p === "all" ? "Semua" : p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <div className="bg-white rounded-lg border p-4" style={{ borderColor: "#E4E6EB" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium" style={{ color: "#65676B" }}>Total Keyword</p>
                <p className="text-2xl font-bold" style={{ color: "#050505" }}>{keywords.length}</p>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#E7F3FF" }}>
                <Tag className="w-5 h-5" style={{ color: "#0866FF" }} />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border p-4" style={{ borderColor: "#E4E6EB" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium" style={{ color: "#65676B" }}>Perangkat Aktif</p>
                <p className="text-2xl font-bold" style={{ color: "#050505" }}>{sessions.length}</p>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#E7F3FF" }}>
                <Smartphone className="w-5 h-5" style={{ color: "#0866FF" }} />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border p-4" style={{ borderColor: "#E4E6EB" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium" style={{ color: "#65676B" }}>Hasil Filter</p>
                <p className="text-2xl font-bold" style={{ color: "#050505" }}>{filteredKeywords.length}</p>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#E7F3FF" }}>
                <Target className="w-5 h-5" style={{ color: "#0866FF" }} />
              </div>
            </div>
          </div>
        </div>

        {/* KEYWORD LIST */}
        {fetching ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-[3px] rounded-full animate-spin" style={{ borderColor: "#E4E6EB", borderTopColor: "#0866FF" }} />
            <p className="text-[13px]" style={{ color: "#65676B" }}>Memuat data...</p>
          </div>
        ) : filteredKeywords.length === 0 ? (
          <div className="bg-white rounded-lg border p-10 text-center" style={{ borderColor: "#E4E6EB" }}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "#F0F2F5" }}>
              <Sparkles className="w-7 h-7" style={{ color: "#BCC0C4" }} />
            </div>
            <h3 className="text-[16px] font-bold mb-1" style={{ color: "#050505" }}>
              {searchQuery || selectedPlatform !== "all" ? "Tidak ditemukan" : "Belum ada keyword"}
            </h3>
            <p className="text-[13px] mb-5 max-w-md mx-auto" style={{ color: "#65676B" }}>
              {searchQuery || selectedPlatform !== "all"
                ? "Coba ubah kata kunci pencarian atau filter platform"
                : "Tambahkan keyword baru untuk memulai routing pesan otomatis"
              }
            </p>
            {!searchQuery && selectedPlatform === "all" && (
              <Button onClick={() => setIsFormOpen(true)} className="h-[34px] text-[12px] font-semibold gap-1.5 border-0" style={{ backgroundColor: "#0866FF" }}>
                <Plus className="w-4 h-4" />
                Tambah Keyword Pertama
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredKeywords.map((k: any) => (
              <div key={k.id} className="bg-white rounded-lg border p-4 transition-all hover:shadow-sm" style={{ borderColor: "#E4E6EB" }}>
                <div className="flex items-center gap-3 group">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 font-bold text-white text-sm" style={{ backgroundColor: platformColors[k.platform?.toLowerCase()] || "#65676B" }}>
                    {k.platform?.charAt(0).toUpperCase() || "?"}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="text-[12px] font-bold uppercase" style={{ color: "#050505" }}>{k.platform}</span>
                      <span className="w-1 h-1 rounded-full" style={{ backgroundColor: "#BCC0C4" }} />
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-md" style={{ backgroundColor: "#F0F2F5", color: "#65676B" }}>
                        {k.session_name || "Device"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 shrink-0" style={{ color: "#0866FF" }} />
                      <p className="text-[13px] font-medium" style={{ color: "#050505" }}>"{k.keyword_text}"</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button onClick={() => handleEdit(k)} className="p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-[#F2F3F5]" style={{ color: "#8C939D" }}>
                      <Edit size={15} />
                    </button>
                    <button onClick={() => handleDelete(k.id)} className="p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-[#FFEBEE]" style={{ color: "#8C939D" }}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ADD FORM */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#E7F3FF" }}>
                <Plus className="w-4 h-4" style={{ color: "#0866FF" }} />
              </div>
              <DialogTitle className="text-[16px] font-bold" style={{ color: "#050505" }}>Tambah Keyword Baru</DialogTitle>
            </div>
            <p className="text-[12px]" style={{ color: "#65676B" }}>Keyword akan digunakan untuk routing pesan otomatis</p>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold flex items-center gap-1.5" style={{ color: "#050505" }}>
                <Smartphone className="w-3.5 h-3.5" style={{ color: "#65676B" }} />
                Perangkat WhatsApp
              </label>
              <select
                value={newKw.session_id}
                onChange={(e) => setNewKw({ ...newKw, session_id: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border text-[12px] outline-none appearance-none cursor-pointer"
                style={{ backgroundColor: "#F0F2F5", borderColor: "#CCD0D5", color: "#050505" }}
                required
              >
                <option value="">Pilih Perangkat...</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>{s.name || `Device ${s.id}`}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold flex items-center gap-1.5" style={{ color: "#050505" }}>
                <Target className="w-3.5 h-3.5" style={{ color: "#65676B" }} />
                Sumber Platform
              </label>
              <Input type="text" placeholder="Contoh: tiktok, instagram, facebook" value={newKw.platform}
                onChange={(e) => setNewKw({ ...newKw, platform: e.target.value })} required
                className="h-10 text-[12px] border-0 rounded-lg" style={{ backgroundColor: "#F0F2F5" }} />
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold flex items-center gap-1.5" style={{ color: "#050505" }}>
                <Tag className="w-3.5 h-3.5" style={{ color: "#65676B" }} />
                Kata Kunci
              </label>
              <Input type="text" placeholder="Masukkan kata kunci filter..." value={newKw.text}
                onChange={(e) => setNewKw({ ...newKw, text: e.target.value })} required
                className="h-10 text-[12px] border-0 rounded-lg" style={{ backgroundColor: "#F0F2F5" }} />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} className="flex-1 h-9 text-[12px] rounded-lg border" style={{ borderColor: "#CCD0D5", color: "#65676B" }}>
                Batal
              </Button>
              <Button type="submit" disabled={loading} className="flex-1 h-9 text-[12px] font-semibold border-0 rounded-lg" style={{ backgroundColor: "#0866FF" }}>
                {loading ? <RefreshCcw className="animate-spin mx-auto" size={16} /> : "Simpan Keyword"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT FORM */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#E7F3FF" }}>
                <Edit className="w-4 h-4" style={{ color: "#0866FF" }} />
              </div>
              <DialogTitle className="text-[16px] font-bold" style={{ color: "#050505" }}>Edit Keyword</DialogTitle>
            </div>
          </DialogHeader>

          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold" style={{ color: "#050505" }}>Perangkat WhatsApp</label>
              <select value={editKw?.session_id || ""}
                onChange={(e) => setEditKw({ ...editKw, session_id: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border text-[12px] outline-none appearance-none cursor-pointer"
                style={{ backgroundColor: "#F0F2F5", borderColor: "#CCD0D5", color: "#050505" }} required>
                <option value="">Pilih Perangkat...</option>
                {sessions.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold" style={{ color: "#050505" }}>Sumber Platform</label>
              <Input type="text" placeholder="Contoh: tiktok" value={editKw?.platform || ""}
                onChange={(e) => setEditKw({ ...editKw, platform: e.target.value })} required
                className="h-10 text-[12px] border-0 rounded-lg" style={{ backgroundColor: "#F0F2F5" }} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold" style={{ color: "#050505" }}>Kata Kunci</label>
              <Input type="text" placeholder="Masukkan kata kunci" value={editKw?.text || ""}
                onChange={(e) => setEditKw({ ...editKw, text: e.target.value })} required
                className="h-10 text-[12px] border-0 rounded-lg" style={{ backgroundColor: "#F0F2F5" }} />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => { setIsEditOpen(false); setEditKw(null); }}
                className="flex-1 h-9 text-[12px] rounded-lg border" style={{ borderColor: "#CCD0D5", color: "#65676B" }}>
                Batal
              </Button>
              <Button type="submit" disabled={loading} className="flex-1 h-9 text-[12px] font-semibold border-0 rounded-lg" style={{ backgroundColor: "#0866FF" }}>
                {loading ? <RefreshCcw className="animate-spin mx-auto" size={16} /> : "Perbarui"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ORGANIK ADD */}
      <Dialog open={isOrganikFormOpen} onOpenChange={setIsOrganikFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#E7F3FF" }}>
                <Leaf className="w-4 h-4" style={{ color: "#0866FF" }} />
              </div>
              <DialogTitle className="text-[16px] font-bold" style={{ color: "#050505" }}>Tambah Keyword Organik</DialogTitle>
            </div>
          </DialogHeader>

          <form onSubmit={handleOrganikSave} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold" style={{ color: "#050505" }}>Kata Kunci</label>
              <Input type="text" placeholder="Contoh: iya kakak, ok kak" value={newOrganik.keyword}
                onChange={(e) => setNewOrganik({ ...newOrganik, keyword: e.target.value })} required
                className="h-10 text-[12px] border-0 rounded-lg" style={{ backgroundColor: "#F0F2F5" }} />
            </div>
            <div className="flex items-center gap-2.5">
              <input type="checkbox" id="isActive" checked={newOrganik.is_active}
                onChange={(e) => setNewOrganik({ ...newOrganik, is_active: e.target.checked })}
                className="w-4 h-4 rounded" style={{ accentColor: "#0866FF" }} />
              <label htmlFor="isActive" className="text-[12px] font-medium" style={{ color: "#050505" }}>Aktif</label>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsOrganikFormOpen(false)}
                className="flex-1 h-9 text-[12px] rounded-lg border" style={{ borderColor: "#CCD0D5", color: "#65676B" }}>
                Batal
              </Button>
              <Button type="submit" disabled={loading} className="flex-1 h-9 text-[12px] font-semibold border-0 rounded-lg" style={{ backgroundColor: "#0866FF" }}>
                {loading ? <RefreshCcw className="animate-spin mx-auto" size={16} /> : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ORGANIK EDIT */}
      <Dialog open={isOrganikEditOpen} onOpenChange={setIsOrganikEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#E7F3FF" }}>
                <Edit className="w-4 h-4" style={{ color: "#0866FF" }} />
              </div>
              <DialogTitle className="text-[16px] font-bold" style={{ color: "#050505" }}>Edit Keyword Organik</DialogTitle>
            </div>
          </DialogHeader>

          <form onSubmit={handleOrganikUpdate} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold" style={{ color: "#050505" }}>Kata Kunci</label>
              <Input type="text" placeholder="Contoh: iya kakak" value={editOrganik?.keyword || ""}
                onChange={(e) => setEditOrganik({ ...editOrganik, keyword: e.target.value })} required
                className="h-10 text-[12px] border-0 rounded-lg" style={{ backgroundColor: "#F0F2F5" }} />
            </div>
            <div className="flex items-center gap-2.5">
              <input type="checkbox" id="editIsActive" checked={editOrganik?.is_active || false}
                onChange={(e) => setEditOrganik({ ...editOrganik, is_active: e.target.checked })}
                className="w-4 h-4 rounded" style={{ accentColor: "#0866FF" }} />
              <label htmlFor="editIsActive" className="text-[12px] font-medium" style={{ color: "#050505" }}>Aktif</label>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => { setIsOrganikEditOpen(false); setEditOrganik(null); }}
                className="flex-1 h-9 text-[12px] rounded-lg border" style={{ borderColor: "#CCD0D5", color: "#65676B" }}>
                Batal
              </Button>
              <Button type="submit" disabled={loading} className="flex-1 h-9 text-[12px] font-semibold border-0 rounded-lg" style={{ backgroundColor: "#0866FF" }}>
                {loading ? <RefreshCcw className="animate-spin mx-auto" size={16} /> : "Perbarui"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
