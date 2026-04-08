import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  Plus,
  Edit3,
  Trash2,
  Copy,
  Link as LinkIcon,
  Check,
  MousePointerClick,
  Trash,
  Eye,
  Search,
  ExternalLink,
  Globe,
  Link2,
  BarChart3,
  RefreshCw,
  X,
  TrendingUp,
  Calendar,
} from "lucide-react";
import toast from "react-hot-toast";
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

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

interface WANumber {
  number: string;
  weight: number;
}

interface Rotator {
  id: number;
  name: string;
  short_code: string;
  shortCode?: string;
  clicks: number;
  clicks_today?: number;
  clicks_week?: number;
  clicks_month?: number;
  type: string;
  target_type: string;
  targetType?: string;
  wa_numbers: string;
  waNumbers?: string;
  message: string;
  original_url?: string;
  created_at?: string;
}

interface TrackedLink {
  id?: number;
  original_url: string;
  short_code: string;
  name: string;
  clicks: number;
  clicks_today: number;
  clicks_week: number;
  clicks_month: number;
  created_at?: string;
}

export const LinkRotatorSection: React.FC = () => {
  const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';
  const [rotators, setRotators] = useState<Rotator[]>([]);
  const [trackedLinks, setTrackedLinks] = useState<TrackedLink[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [viewingDetail, setViewingDetail] = useState<Rotator | null>(null);
  const [isAddUrlOpen, setIsAddUrlOpen] = useState(false);
  const [newLinkData, setNewLinkData] = useState({
    name: "",
    original_url: "",
  });
  const [addUrlSubmitting, setAddUrlSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"rotator" | "tracked">("rotator");

  const [formData, setFormData] = useState({
    name: "",
    shortCode: "",
    type: "direct",
    targetType: "single",
    message: "",
  });

  const [waList, setWaList] = useState<WANumber[]>([{ number: "", weight: 1 }]);

  const fetchRotators = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/rotators");
      const result = Array.isArray(data?.data) ? data.data : data || [];
      setRotators(result);
    } catch (error) {
      toast.error("Gagal sinkronisasi data");
    } finally {
      setLoading(false);
    }
  };

  const fetchTrackedLinks = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/tracked-links");
      const result = Array.isArray(data?.data) ? data.data : data || [];
      setTrackedLinks(result);
    } catch (error) {
      setTrackedLinks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRotators();
    fetchTrackedLinks();
  }, []);

  const addWaField = () => setWaList([...waList, { number: "", weight: 1 }]);

  const removeWaField = (index: number) => {
    if (waList.length > 1) setWaList(waList.filter((_, i) => i !== index));
  };

  const updateWaField = (index: number, field: keyof WANumber, value: any) => {
    const newList = [...waList];
    newList[index] = { ...newList[index], [field]: value };
    setWaList(newList);
  };

  const handleEditClick = (item: Rotator) => {
    setEditingId(item.id);
    setFormData({
      name: item.name || "",
      shortCode: item.short_code || item.shortCode || "",
      type: item.type || "direct",
      targetType: item.target_type || item.targetType || "single",
      message: item.message || "",
    });

    const rawWa = item.wa_numbers || item.waNumbers || "";
    try {
      if (typeof rawWa === "string" && rawWa.trim().startsWith("[")) {
        const parsed = JSON.parse(rawWa);
        setWaList(
          Array.isArray(parsed) ? parsed : [{ number: rawWa, weight: 1 }],
        );
      } else {
        setWaList([{ number: String(rawWa), weight: 1 }]);
      }
    } catch {
      setWaList([{ number: String(rawWa), weight: 1 }]);
    }
    setIsFormOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: "",
      shortCode: "",
      type: "direct",
      targetType: "single",
      message: "",
    });
    setWaList([{ number: "", weight: 1 }]);
    setIsFormOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validNumbers = waList.filter((n) => n.number.trim() !== "");
    if (!formData.name || !formData.shortCode || validNumbers.length === 0)
      return toast.error("Lengkapi data!");

    setSubmitting(true);

    const payload = {
      name: formData.name,
      short_code: formData.shortCode,
      type: formData.type,
      target_type: formData.targetType,
      message: formData.message,
      wa_numbers: JSON.stringify(
        formData.targetType === "single" ? [waList[0]] : validNumbers,
      ),
    };

    try {
      if (editingId) {
        await api.put(`/rotators/${editingId}`, payload);
      } else {
        await api.post("/rotators", payload);
      }
      toast.success("Berhasil disimpan");
      resetForm();
      fetchRotators();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal menyimpan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus link ini?")) return;
    try {
      await api.delete(`/rotators/${id}`);
      setRotators((prev) => prev.filter((item) => item.id !== id));
      toast.success("Terhapus");
    } catch {
      toast.error("Gagal");
    }
  };

  const handleAddTrackedLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLinkData.name || !newLinkData.original_url) {
      toast.error("Lengkapi semua data!");
      return;
    }

    // Validate URL
    try {
      new URL(newLinkData.original_url);
    } catch {
      toast.error("URL tidak valid!");
      return;
    }

    setAddUrlSubmitting(true);
    try {
      const { data } = await api.post("/tracked-links", {
        name: newLinkData.name,
        original_url: newLinkData.original_url,
      });
      
      if (data.success) {
        toast.success("Link berhasil ditambahkan!");
        setTrackedLinks((prev) => [data.data, ...prev]);
        setNewLinkData({ name: "", original_url: "" });
        setIsAddUrlOpen(false);
      } else {
        toast.error(data.message || "Gagal menyimpan link");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal menyimpan link");
    } finally {
      setAddUrlSubmitting(false);
    }
  };

  const handleDeleteTrackedLink = async (id: number) => {
    if (!confirm("Hapus link ini?")) return;
    try {
      await api.delete(`/tracked-links/${id}`);
      setTrackedLinks((prev) => prev.filter((item) => item.id !== id));
      toast.success("Link terhapus");
    } catch {
      toast.error("Gagal menghapus link");
    }
  };

  const filteredData = useMemo(
    () =>
      rotators.filter(
        (item) =>
          (item.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.short_code || item.shortCode || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()),
      ),
    [rotators, searchTerm],
  );

  const filteredTrackedLinks = useMemo(
    () =>
      trackedLinks.filter((item) =>
        (item.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.original_url || "").toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [trackedLinks, searchTerm],
  );

  const totalClicks = useMemo(() => 
    rotators.reduce((acc, r) => acc + (r.clicks || 0), 0), 
  [rotators]);

  const totalTrackedClicks = useMemo(() =>
    trackedLinks.reduce((acc, l) => acc + (l.clicks || 0), 0),
  [trackedLinks]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <LinkIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Link Manager
              </h1>
              <p className="text-gray-600 text-sm mt-0.5 font-medium">
                Kelola tautan & lacak klik
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                type="text" 
                placeholder="Cari link..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 pl-10 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
              />
            </div>
            <Button 
              onClick={() => { resetForm(); setIsFormOpen(true); }}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 gap-2"
            >
              <Plus className="w-4 h-4" />
              Tambah Link
            </Button>
          </div>
        </div>

        {/* TABS */}
        <div className="flex items-center gap-2 mb-6 bg-white p-1.5 rounded-xl border border-gray-200 w-fit">
          <button
            onClick={() => setActiveTab("rotator")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all ${
              activeTab === "rotator"
                ? "bg-blue-500 text-white shadow-md"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <LinkIcon size={16} />
            Link Rotator
          </button>
          <button
            onClick={() => setActiveTab("tracked")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all ${
              activeTab === "tracked"
                ? "bg-blue-500 text-white shadow-md"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Globe size={16} />
            Link URL
          </button>
        </div>

        {/* ROTATOR TAB */}
        {activeTab === "rotator" && (
          <>
            {/* STATS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <LinkIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{rotators.length}</p>
                    <p className="text-sm text-gray-500">Total Link</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <MousePointerClick className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{totalClicks}</p>
                    <p className="text-sm text-gray-500">Total Klik</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <ExternalLink className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{filteredData.length}</p>
                    <p className="text-sm text-gray-500">Tampilkan</p>
                  </div>
                </div>
              </div>
            </div>

            {/* LIST */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                <p className="text-gray-500 mt-4">Memuat data...</p>
              </div>
            ) : filteredData.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200/60 p-12 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <LinkIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-1">Belum ada link rotator</h3>
                <p className="text-gray-500 text-sm mb-4">Tambahkan link rotator baru untuk memulai</p>
                <Button 
                  onClick={() => { resetForm(); setIsFormOpen(true); }}
                  variant="outline" 
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Link
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredData.map((item) => {
                  const currentSlug = item.short_code || item.shortCode || "";
                  const displayLink = `https://links.satupintu.mendunia.id/r/${currentSlug}`;

                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-2xl border border-slate-200/60 p-5 hover:shadow-md transition-all group"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shrink-0">
                            <MousePointerClick size={22} />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-lg">
                              {item.name}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-blue-600 font-medium mt-1">
                              <span className="opacity-70 font-mono">{displayLink}</span>
                              <button
                                className="hover:text-blue-700 active:scale-90 transition-transform"
                                onClick={() => {
                                  navigator.clipboard.writeText(displayLink);
                                  setCopiedId(item.id);
                                  setTimeout(() => setCopiedId(null), 2000);
                                }}
                              >
                                {copiedId === item.id ? (
                                  <Check size={16} className="text-emerald-500" />
                                ) : (
                                  <Copy size={16} />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <p className="font-black text-2xl text-gray-900">
                              {item.clicks}
                            </p>
                            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                              Total Klik
                            </p>
                          </div>
                          <div className="h-10 w-[1px] bg-gray-200" />
                          <div className="flex gap-2">
                            <button
                              onClick={() => setViewingDetail(item)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Lihat Detail"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => handleEditClick(item)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit3 size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* TRACKED LINKS TAB */}
        {activeTab === "tracked" && (
          <>
            {/* Add URL Button */}
            <div className="mb-6">
              <Button 
                onClick={() => setIsAddUrlOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 gap-2"
              >
                <Plus className="w-4 h-4" />
                Tambah URL untuk Dilacak
              </Button>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Link2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-gray-900">{trackedLinks.length}</p>
                    <p className="text-xs text-gray-500">Total Link</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <MousePointerClick className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-gray-900">{totalTrackedClicks}</p>
                    <p className="text-xs text-gray-500">Total Klik</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-gray-900">
                      {trackedLinks.reduce((acc, l) => acc + (l.clicks_today || 0), 0)}
                    </p>
                    <p className="text-xs text-gray-500">Klik Hari Ini</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-gray-900">
                      {trackedLinks.reduce((acc, l) => acc + (l.clicks_month || 0), 0)}
                    </p>
                    <p className="text-xs text-gray-500">Klik Bulan Ini</p>
                  </div>
                </div>
              </div>
            </div>

            {/* TRACKED LINKS LIST */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
                <p className="text-gray-500 mt-4">Memuat data...</p>
              </div>
            ) : filteredTrackedLinks.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200/60 p-12 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Globe className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-1">Belum ada link URL</h3>
                <p className="text-gray-500 text-sm mb-4">Tambahkan URL yang ingin Anda lacak kliknya</p>
                <Button 
                  onClick={() => setIsAddUrlOpen(true)}
                  variant="outline" 
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Tambah URL
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTrackedLinks.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-slate-200/60 p-5 hover:shadow-md transition-all group"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shrink-0">
                          <Globe size={22} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 text-lg">
                            {item.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <a
                              href={item.short_code ? `${baseUrl}/t/${item.short_code}` : item.original_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 font-mono bg-blue-50 px-2 py-0.5 rounded break-all hover:underline"
                            >
                              {item.original_url}
                            </a>
                            <button
                              className="hover:text-blue-600 active:scale-90 transition-transform shrink-0"
                              onClick={() => {
                                navigator.clipboard.writeText(item.original_url);
                                toast.success("Link berhasil disalin!");
                              }}
                            >
                              <Copy size={14} className="text-gray-400 hover:text-blue-600" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        {/* Click Stats */}
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="font-black text-xl text-gray-900">
                              {item.clicks}
                            </p>
                            <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wide">
                              Total
                            </p>
                          </div>
                          <div className="h-8 w-[1px] bg-gray-200" />
                          <div className="text-center">
                            <p className="font-bold text-lg text-blue-600">
                              {item.clicks_today}
                            </p>
                            <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wide">
                              Hari Ini
                            </p>
                          </div>
                          <div className="h-8 w-[1px] bg-gray-200" />
                          <div className="text-center">
                            <p className="font-bold text-lg text-indigo-600">
                              {item.clicks_week}
                            </p>
                            <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wide">
                              Minggu
                            </p>
                          </div>
                          <div className="h-8 w-[1px] bg-gray-200" />
                          <div className="text-center">
                            <p className="font-bold text-lg text-purple-600">
                              {item.clicks_month}
                            </p>
                            <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wide">
                              Bulan
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              if (item.short_code) {
                                const trackingUrl = `${baseUrl}/t/${item.short_code}`;
                                navigator.clipboard.writeText(trackingUrl);
                                toast.success("Link tracking disalin! Bagikan link ini untuk melacak klik.");
                              }
                            }}
                            className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Salin Link Tracking"
                          >
                            <ExternalLink size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteTrackedLink(item.id!)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ADD TRACKED URL DIALOG */}
      <Dialog open={isAddUrlOpen} onOpenChange={setIsAddUrlOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Link2 size={20} className="text-blue-600" />
              Tambah URL untuk Dilacak
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddTrackedLink} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Nama Link</label>
              <Input 
                value={newLinkData.name}
                onChange={(e) => setNewLinkData({ ...newLinkData, name: e.target.value })}
                placeholder="Contoh: Landing Page Promo"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">URL Asli</label>
              <Input 
                type="url"
                value={newLinkData.original_url}
                onChange={(e) => setNewLinkData({ ...newLinkData, original_url: e.target.value })}
                placeholder="https://example.com/landing-page"
                required
              />
              <p className="text-[11px] text-gray-400">
                Masukkan URL yang ingin Anda lacak jumlah kliknya
              </p>
            </div>

            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 size={16} className="text-blue-600" />
                <span className="text-sm font-semibold text-blue-700">Yang akan dilacak:</span>
              </div>
              <ul className="text-xs text-blue-600 space-y-1 ml-6">
                <li className="flex items-center gap-1"><Check size={12} /> Total klik</li>
                <li className="flex items-center gap-1"><Check size={12} /> Klik hari ini</li>
                <li className="flex items-center gap-1"><Check size={12} /> Klik minggu ini</li>
                <li className="flex items-center gap-1"><Check size={12} /> Klik bulan ini</li>
              </ul>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsAddUrlOpen(false);
                  setNewLinkData({ name: "", original_url: "" });
                }}
              >
                Batal
              </Button>
              <Button 
                type="submit"
                disabled={addUrlSubmitting}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {addUrlSubmitting ? "Menyimpan..." : "Simpan Link"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ROTATOR FORM DIALOG */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {editingId ? 'Edit Link Rotator' : 'Tambah Link Rotator Baru'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2 md:col-span-1">
                <label className="text-sm font-semibold text-gray-700">Nama Product</label>
                <Input 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Promo Kaos"
                  required
                />
              </div>
              <div className="space-y-2 col-span-2 md:col-span-1">
                <label className="text-sm font-semibold text-gray-700">Short URL (/r/)</label>
                <Input 
                  value={formData.shortCode}
                  onChange={(e) => setFormData({ ...formData, shortCode: e.target.value })}
                  placeholder="custom-slug"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Tipe Redirect</label>
                <Select 
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="direct">Direct (Langsung WA)</SelectItem>
                    <SelectItem value="lander">Lander (Halaman Antara)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Mode Rotasi</label>
                <Select 
                  value={formData.targetType}
                  onValueChange={(value) => setFormData({ ...formData, targetType: value })}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single (Satu Nomor)</SelectItem>
                    <SelectItem value="rotator">Rotator (Banyak Nomor)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700">Daftar Nomor WhatsApp</label>
              {waList.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <Input 
                    value={item.number}
                    onChange={(e) => updateWaField(index, "number", e.target.value)}
                    placeholder="62812345678"
                    className="flex-1"
                  />
                  {formData.targetType === "rotator" && (
                    <Input 
                      type="number"
                      value={item.weight}
                      onChange={(e) => updateWaField(index, "weight", parseInt(e.target.value) || 1)}
                      className="w-20 text-center"
                      title="Bobot (Weight)"
                    />
                  )}
                  {waList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeWaField(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash size={18} />
                    </button>
                  )}
                </div>
              ))}
              {formData.targetType === "rotator" && (
                <button
                  type="button"
                  onClick={addWaField}
                  className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  <Plus size={16} /> Tambah Nomor Baru
                </button>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Pesan WhatsApp</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Halo Admin, saya tertarik dengan..."
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 resize-none"
                rows={3}
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={resetForm}
              >
                Batal
              </Button>
              <Button 
                type="submit"
                disabled={submitting}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {submitting ? "Memproses..." : (editingId ? "Update Link" : "Buat Link")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DETAIL MODAL */}
      {viewingDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl">
            <div className="p-6 border-b border-gray-100">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {viewingDetail.name}
                  </h2>
                  <p className="text-sm text-blue-600 font-mono font-medium">
                    /r/{viewingDetail.short_code}
                  </p>
                </div>
                <button
                  onClick={() => setViewingDetail(null)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <Plus className="rotate-45" size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-[10px] uppercase font-bold text-gray-500 mb-2">
                  Statistik
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Klik</span>
                  <span className="text-2xl font-black text-blue-600">
                    {viewingDetail.clicks}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-[10px] uppercase font-bold text-gray-500 mb-3">
                  Daftar Nomor & Bobot
                </p>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                  {(() => {
                    try {
                      const waNumbers = JSON.parse(viewingDetail.wa_numbers);
                      return waNumbers.map((wa: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-sm border-b border-gray-200 pb-2">
                          <span className="text-gray-700 font-medium">{wa.number}</span>
                          <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded text-xs font-bold">
                            W: {wa.weight || 1}
                          </span>
                        </div>
                      ));
                    } catch {
                      return <span className="text-sm italic text-gray-500">Format nomor tidak valid</span>;
                    }
                  })()}
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">
                  Pesan Custom
                </p>
                <p className="text-sm italic text-gray-600">
                  "{viewingDetail.message || "Tidak ada pesan"}"
                </p>
              </div>
            </div>

            <div className="p-6 pt-0">
              <button
                onClick={() => setViewingDetail(null)}
                className="w-full py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
