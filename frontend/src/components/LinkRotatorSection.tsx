import React, { useState, useEffect, useMemo } from "react";
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
  Calendar,
  ChevronLeft,
  ChevronRight,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  MapPin,
  Clock,
  X,
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
import api from "../lib/api";

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
  type: string;
  target_type: string;
  targetType?: string;
  wa_numbers: string;
  waNumbers?: string;
  message: string;
}

interface ClickLog {
  id: number;
  ip_address: string;
  user_agent: string;
  referer: string;
  country: string | null;
  city: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  created_at: string;
}

export const LinkRotatorSection: React.FC = () => {
  const [rotators, setRotators] = useState<Rotator[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [viewingDetail, setViewingDetail] = useState<Rotator | null>(null);
  const [clickLogs, setClickLogs] = useState<ClickLog[]>([]);
  const [clickLogsPage, setClickLogsPage] = useState(1);
  const [clickLogsTotal, setClickLogsTotal] = useState(0);
  const [clickLogsLoading, setClickLogsLoading] = useState(false);
  const [period, setPeriod] = useState<"today" | "yesterday" | "week" | "month">("today");
  const [periodClicks, setPeriodClicks] = useState<Record<number, number>>({});
  const [totalPeriodClicks, setTotalPeriodClicks] = useState(0);

  const [formData, setFormData] = useState({
    name: "",
    shortCode: "",
    type: "direct",
    targetType: "single",
    message: "",
  });

  const [waList, setWaList] = useState<WANumber[]>([{ number: "", weight: 1 }]);

  const [landerConfig, setLanderConfig] = useState({
    button1: { label: "LIVE TIKTOK", source: "admin_live", sourceText: "sumber dari admin live" },
    button2: { label: "KONTEN TIKTOK", source: "admin_rindu", sourceText: "sumber dari admin rindu" },
  });

  const updateLanderBtn = (btn: 'button1' | 'button2', field: string, value: string) => {
    setLanderConfig(prev => ({
      ...prev,
      [btn]: { ...prev[btn], [field]: value },
    }));
  };

  const fetchRotators = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/rotators");
      const result = Array.isArray(data?.data) ? data.data : data || [];
      setRotators(result);

      const { data: statsRes } = await api.get("/rotators/stats", {
        params: { period },
      });
      if (statsRes.success) {
        setTotalPeriodClicks(statsRes.data.total_clicks || 0);
        const map: Record<number, number> = {};
        (statsRes.data.links || []).forEach((l: any) => {
          map[l.id] = l.total || 0;
        });
        setPeriodClicks(map);
      }
    } catch (error) {
      toast.error("Gagal sinkronisasi data");
    } finally {
      setLoading(false);
    }
  };

  const fetchClickLogs = async (rotatorId: number, page: number = 1) => {
    setClickLogsLoading(true);
    try {
      const { data } = await api.get(`/rotators/${rotatorId}/clicks`, {
        params: { page, limit: 20 },
      });
      if (data.success) {
        setClickLogs(data.data.clicks || []);
        setClickLogsTotal(data.data.total || 0);
        setClickLogsPage(data.data.page || 1);
      }
    } catch (error) {
      toast.error("Gagal memuat log klik");
    } finally {
      setClickLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchRotators();
  }, [period]);

  useEffect(() => {
    fetchRotators();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    try {
      const raw = (item as any).lander_config;
      if (raw) {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (parsed.button1) setLanderConfig(prev => ({ ...prev, button1: { ...prev.button1, ...parsed.button1 } }));
        if (parsed.button2) setLanderConfig(prev => ({ ...prev, button2: { ...prev.button2, ...parsed.button2 } }));
      } else {
        setLanderConfig({
          button1: { label: "LIVE TIKTOK", source: "admin_live", sourceText: "sumber dari admin live" },
          button2: { label: "KONTEN TIKTOK", source: "admin_rindu", sourceText: "sumber dari admin rindu" },
        });
      }
    } catch {
      // default
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
    setLanderConfig({
      button1: { label: "LIVE TIKTOK", source: "admin_live", sourceText: "sumber dari admin live" },
      button2: { label: "KONTEN TIKTOK", source: "admin_rindu", sourceText: "sumber dari admin rindu" },
    });
    setIsFormOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validNumbers = waList.filter((n) => n.number.trim() !== "");
    if (!formData.name || !formData.shortCode || validNumbers.length === 0)
      return toast.error("Lengkapi data!");

    setSubmitting(true);

    const payload: Record<string, any> = {
      name: formData.name,
      short_code: formData.shortCode,
      type: formData.type,
      target_type: formData.targetType,
      message: formData.message,
      wa_numbers: JSON.stringify(
        formData.targetType === "single" ? [waList[0]] : validNumbers,
      ),
    };

    if (formData.type === "lander") {
      payload.lander_config = JSON.stringify(landerConfig);
    }

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

  const openDetail = (item: Rotator) => {
    setViewingDetail(item);
    setClickLogsPage(1);
    fetchClickLogs(item.id, 1);
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

  const totalClicks = useMemo(
    () => rotators.reduce((acc, r) => acc + (r.clicks || 0), 0),
    [rotators],
  );

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
                Link Rotator
              </h1>
              <p className="text-gray-600 text-sm mt-0.5 font-medium">
                Kelola & rotasi link WhatsApp
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

        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
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
          <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm col-span-2">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold text-gray-900">{totalPeriodClicks}</p>
                  <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                    {[
                      { value: "today", label: "Hari Ini" },
                      { value: "yesterday", label: "Kemarin" },
                      { value: "week", label: "Minggu" },
                      { value: "month", label: "Bulan" },
                    ].map((p) => (
                      <button
                        key={p.value}
                        onClick={() => setPeriod(p.value as any)}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                          period === p.value
                            ? "bg-white text-blue-600 shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-500">Klik Periode</p>
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
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900 text-lg">
                            {item.name}
                          </p>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            item.type === 'direct'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {item.type === 'direct' ? 'Direct' : 'Lander'}
                          </span>
                        </div>
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
                          {periodClicks[item.id] ?? item.clicks}
                        </p>
                        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                          Klik {period === "today" ? "Hari Ini" : period === "yesterday" ? "Kemarin" : period === "week" ? "Minggu Ini" : "Bulan Ini"}
                        </p>
                      </div>
                      <div className="h-10 w-[1px] bg-gray-200" />
                      <div className="flex gap-2">
                        <button
                          onClick={() => openDetail(item)}
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
      </div>

      {/* ROTATOR FORM DIALOG */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {editingId ? "Edit Link Rotator" : "Tambah Link Rotator Baru"}
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

            {formData.type === "lander" && (
              <div className="space-y-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <p className="text-sm font-bold text-blue-800">Pengaturan Tombol Lander</p>
                <div className="grid grid-cols-2 gap-3">
                  {(["button1", "button2"] as const).map((btn, i) => {
                    const cfg = landerConfig[btn];
                    return (
                      <div key={btn} className="space-y-2 p-3 bg-white rounded-lg border border-blue-100">
                        <p className="text-xs font-bold text-blue-700">Tombol {i + 1}</p>
                        <Input
                          value={cfg.label}
                          onChange={(e) => updateLanderBtn(btn, "label", e.target.value)}
                          placeholder="Label tombol"
                          className="h-9 text-sm bg-blue-50 border-blue-200"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-semibold text-gray-500">Source</label>
                            <Input
                              value={cfg.source}
                              onChange={(e) => updateLanderBtn(btn, "source", e.target.value)}
                              placeholder="admin_xxx"
                              className="h-9 text-sm bg-blue-50 border-blue-200"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold text-gray-500">Teks WA</label>
                            <Input
                              value={cfg.sourceText}
                              onChange={(e) => updateLanderBtn(btn, "sourceText", e.target.value)}
                              placeholder="sumber dari..."
                              className="h-9 text-sm bg-blue-50 border-blue-200"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={resetForm}>
                Batal
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {submitting ? "Memproses..." : editingId ? "Update Link" : "Buat Link"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DETAIL MODAL */}
      {viewingDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex-none">
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

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Info Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-[10px] uppercase font-bold text-gray-500 mb-2">
                    Total Klik
                  </p>
                  <p className="text-2xl font-black text-blue-600">
                    {clickLogsTotal}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-[10px] uppercase font-bold text-gray-500 mb-2">
                    Periode
                  </p>
                  <p className="text-lg font-bold text-gray-900">
                    {period === "today" ? "Hari Ini" : period === "yesterday" ? "Kemarin" : period === "week" ? "Minggu Ini" : "Bulan Ini"}
                  </p>
                </div>
              </div>

              {/* WA Numbers */}
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-[10px] uppercase font-bold text-gray-500 mb-3">
                  Daftar Nomor & Bobot
                </p>
                <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                  {(() => {
                    try {
                      const waNumbers = JSON.parse(viewingDetail.wa_numbers);
                      return waNumbers.map((wa: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-sm border-b border-gray-200 pb-2 last:border-0">
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

              {/* Click Logs */}
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] uppercase font-bold text-gray-500">
                    Log Kunjungan
                  </p>
                  <span className="text-xs text-gray-400">
                    {clickLogs.length} dari {clickLogsTotal}
                  </span>
                </div>

                {clickLogsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                  </div>
                ) : clickLogs.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">Belum ada kunjungan</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {clickLogs.map((log) => (
                      <div key={log.id} className="bg-white rounded-xl p-3 border border-gray-100">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-mono text-gray-500 truncate">
                                {log.ip_address}
                              </span>
                              {log.referer && log.referer !== "Direct" && (
                                <span className="text-[10px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded font-medium truncate">
                                  {log.referer}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                              {log.device_type && (
                                <span className="flex items-center gap-1">
                                  {log.device_type === "mobile" ? <Smartphone size={12} /> : log.device_type === "tablet" ? <Tablet size={12} /> : <Monitor size={12} />}
                                  {log.device_type}
                                </span>
                              )}
                              {log.browser && (
                                <span className="flex items-center gap-1">
                                  <Globe size={12} />
                                  {log.browser}
                                </span>
                              )}
                              {log.os && (
                                <span>{log.os}</span>
                              )}
                            </div>
                            {(log.city || log.country) && (
                              <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                                <MapPin size={12} />
                                {[log.city, log.country].filter(Boolean).join(", ")}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-400 flex-none">
                            <Clock size={12} />
                            {new Date(log.created_at).toLocaleString("id-ID", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1 truncate" title={log.user_agent}>
                          {log.user_agent}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {clickLogsTotal > 20 && (
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                    <button
                      onClick={() => {
                        const newPage = clickLogsPage - 1;
                        setClickLogsPage(newPage);
                        fetchClickLogs(viewingDetail.id, newPage);
                      }}
                      disabled={clickLogsPage === 1}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <ChevronLeft size={14} />
                      Sebelumnya
                    </button>
                    <span className="text-sm text-gray-500">
                      Hal. {clickLogsPage} / {Math.ceil(clickLogsTotal / 20)}
                    </span>
                    <button
                      onClick={() => {
                        const newPage = clickLogsPage + 1;
                        setClickLogsPage(newPage);
                        fetchClickLogs(viewingDetail.id, newPage);
                      }}
                      disabled={clickLogsPage >= Math.ceil(clickLogsTotal / 20)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Berikutnya
                      <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 pt-0 flex-none">
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