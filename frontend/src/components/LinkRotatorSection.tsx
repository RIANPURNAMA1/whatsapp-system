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
  source: string | null;
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
  const [sourceBreakdown, setSourceBreakdown] = useState<Record<string, number>>({});
  const [rotatorSourceBreakdown, setRotatorSourceBreakdown] = useState<Record<number, Record<string, number>>>({});
  const [detailSourceBreakdown, setDetailSourceBreakdown] = useState<Record<string, number>>({});

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
        setSourceBreakdown(statsRes.data.source_breakdown || {});
        const map: Record<number, number> = {};
        const sbMap: Record<number, Record<string, number>> = {};
        (statsRes.data.links || []).forEach((l: any) => {
          map[l.id] = l.total || 0;
          sbMap[l.id] = l.source_breakdown || {};
        });
        setPeriodClicks(map);
        setRotatorSourceBreakdown(sbMap);
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
        setWaList(Array.isArray(parsed) ? parsed : [{ number: rawWa, weight: 1 }]);
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
    } catch {}
    setIsFormOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ name: "", shortCode: "", type: "direct", targetType: "single", message: "" });
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
      wa_numbers: JSON.stringify(formData.targetType === "single" ? [waList[0]] : validNumbers),
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
    setDetailSourceBreakdown(rotatorSourceBreakdown[item.id] || {});
    fetchClickLogs(item.id, 1);
  };

  const filteredData = useMemo(() =>
    rotators.filter(
      (item) =>
        (item.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.short_code || item.shortCode || "").toLowerCase().includes(searchTerm.toLowerCase()),
    ),
    [rotators, searchTerm],
  );

  const totalClicks = useMemo(() => rotators.reduce((acc, r) => acc + (r.clicks || 0), 0), [rotators]);

  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      <div className=" mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#E7F3FF" }}>
              <LinkIcon className="w-5 h-5" style={{ color: "#1877F2" }} />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: "#050505" }}>Link Rotator</h1>
              <p className="text-[12px]" style={{ color: "#65676B" }}>Kelola & rotasi link WhatsApp</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#8C939D" }} />
              <Input
                type="text" placeholder="Cari link..." value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-56 pl-9 h-[36px] bg-[#F0F2F5] border-0 text-[12px] rounded-lg focus-visible:ring-0"
                style={{ color: "#050505" }}
              />
            </div>
            <Button onClick={() => { resetForm(); setIsFormOpen(true); }}
              className="h-[34px] text-[12px] font-semibold gap-1.5 border-0" style={{ backgroundColor: "#1877F2" }}>
              <Plus className="w-4 h-4" />
              Tambah Link
            </Button>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-3">
          <div className="bg-white rounded-lg border p-4" style={{ borderColor: "#E4E6EB" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#E7F3FF" }}>
                <LinkIcon className="w-5 h-5" style={{ color: "#1877F2" }} />
              </div>
              <div>
                <p className="text-xl font-bold" style={{ color: "#050505" }}>{rotators.length}</p>
                <p className="text-[11px]" style={{ color: "#65676B" }}>Total Link</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border p-4" style={{ borderColor: "#E4E6EB" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#E7F3FF" }}>
                <MousePointerClick className="w-5 h-5" style={{ color: "#1877F2" }} />
              </div>
              <div>
                <p className="text-xl font-bold" style={{ color: "#050505" }}>{totalClicks}</p>
                <p className="text-[11px]" style={{ color: "#65676B" }}>Total Klik</p>
              </div>
            </div>
          </div>
          {[
            { label: 'Admin Live', key: 'admin_live' },
            { label: 'Admin TikTok', key: 'admin_rindu' },
          ].map(({ label, key }) => {
            const count = sourceBreakdown[key] || 0;
            return (
              <div key={key} className="bg-white rounded-lg border p-4" style={{ borderColor: "#E4E6EB" }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#E7F3FF" }}>
                    <MousePointerClick className="w-5 h-5" style={{ color: "#1877F2" }} />
                  </div>
                  <div>
                    <p className="text-xl font-bold" style={{ color: "#050505" }}>{count}</p>
                    <p className="text-[11px]" style={{ color: "#65676B" }}>{label}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* PERIOD */}
        <div className="bg-white rounded-lg border p-4 mb-6" style={{ borderColor: "#E4E6EB" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#FFF3E0" }}>
              <Calendar className="w-5 h-5" style={{ color: "#F5A623" }} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="text-xl font-bold" style={{ color: "#050505" }}>{totalPeriodClicks}</p>
                <div className="flex gap-1 rounded-lg p-0.5" style={{ backgroundColor: "#F0F2F5" }}>
                  {[
                    { value: "today", label: "Hari Ini" },
                    { value: "yesterday", label: "Kemarin" },
                    { value: "week", label: "Minggu" },
                    { value: "month", label: "Bulan" },
                  ].map((p) => (
                    <button key={p.value} onClick={() => setPeriod(p.value as any)}
                      className="px-3 py-1 rounded-md text-[11px] font-medium transition-colors"
                      style={{
                        backgroundColor: period === p.value ? "#FFFFFF" : "transparent",
                        color: period === p.value ? "#1877F2" : "#65676B",
                        boxShadow: period === p.value ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                      }}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-[11px]" style={{ color: "#65676B" }}>Klik Periode</p>
            </div>
          </div>
        </div>

        {/* LIST */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-8 h-8 border-[3px] rounded-full animate-spin" style={{ borderColor: "#E4E6EB", borderTopColor: "#1877F2" }} />
            <p className="text-[13px]" style={{ color: "#65676B" }}>Memuat data...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="bg-white rounded-lg border p-10 text-center" style={{ borderColor: "#E4E6EB" }}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: "#F0F2F5" }}>
              <LinkIcon className="w-7 h-7" style={{ color: "#BCC0C4" }} />
            </div>
            <h3 className="text-[16px] font-bold mb-1" style={{ color: "#050505" }}>Belum ada link rotator</h3>
            <p className="text-[13px] mb-4" style={{ color: "#65676B" }}>Tambahkan link rotator baru untuk memulai</p>
            <Button onClick={() => { resetForm(); setIsFormOpen(true); }}
              className="h-[34px] text-[12px] font-semibold gap-1.5 border-0" style={{ backgroundColor: "#1877F2" }}>
              <Plus className="w-4 h-4" /> Tambah Link
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredData.map((item) => {
              const currentSlug = item.short_code || item.shortCode || "";
              const displayLink = `https://links.satupintu.mendunia.id/r/${currentSlug}`;

              return (
                <div key={item.id} className="bg-white rounded-lg border p-4 transition-all hover:shadow-sm group" style={{ borderColor: "#E4E6EB" }}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "#E7F3FF" }}>
                        <MousePointerClick size={18} style={{ color: "#1877F2" }} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-[15px]" style={{ color: "#050505" }}>{item.name}</p>
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md"
                            style={{
                              backgroundColor: item.type === 'direct' ? '#E7F3FF' : '#E7F3FF',
                              color: item.type === 'direct' ? '#1877F2' : '#31A24C',
                            }}>
                            {item.type === 'direct' ? 'Direct' : 'Lander'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[12px] font-medium mt-0.5" style={{ color: "#1877F2" }}>
                          <span className="font-mono opacity-70">{displayLink}</span>
                          <button className="hover:opacity-100 active:scale-90 transition-transform" onClick={() => {
                            navigator.clipboard.writeText(displayLink);
                            setCopiedId(item.id);
                            setTimeout(() => setCopiedId(null), 2000);
                          }}>
                            {copiedId === item.id ? <Check size={14} style={{ color: "#31A24C" }} /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="font-black text-xl" style={{ color: "#050505" }}>{periodClicks[item.id] ?? item.clicks}</p>
                        <p className="text-[9px] font-semibold uppercase" style={{ color: "#65676B" }}>
                          Klik {period === "today" ? "Hari Ini" : period === "yesterday" ? "Kemarin" : period === "week" ? "Minggu Ini" : "Bulan Ini"}
                        </p>
                      </div>
                      <div className="h-8 w-px" style={{ backgroundColor: "#E4E6EB" }} />
                      <div className="flex gap-1">
                        <button onClick={() => openDetail(item)} className="p-1.5 rounded-lg hover:bg-[#F2F3F5]" style={{ color: "#8C939D" }} title="Detail">
                          <Eye size={16} />
                        </button>
                        <button onClick={() => handleEditClick(item)} className="p-1.5 rounded-lg hover:bg-[#F2F3F5]" style={{ color: "#8C939D" }}>
                          <Edit3 size={16} />
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-[#FFEBEE]" style={{ color: "#8C939D" }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {item.type === 'lander' && rotatorSourceBreakdown[item.id] && Object.keys(rotatorSourceBreakdown[item.id]).length > 0 && (
                    <div className="mt-3 pt-3 border-t grid grid-cols-2 sm:grid-cols-3 gap-2" style={{ borderColor: "#E4E6EB" }}>
                      {Object.entries(rotatorSourceBreakdown[item.id]).map(([src, count]) => {
                        const total = Object.values(rotatorSourceBreakdown[item.id]).reduce((a, b) => a + b, 0);
                        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                        const label = src === 'lander_view' ? 'Halaman' : src;
                        return (
                          <div key={src} className="flex items-center gap-2 text-[11px]">
                            <span className="truncate" style={{ color: "#65676B" }}>{label}</span>
                            <span className="font-bold" style={{ color: "#050505" }}>{count}</span>
                            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#E4E6EB" }}>
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: "#1877F2" }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FORM DIALOG */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#E7F3FF" }}>
                <LinkIcon className="w-4 h-4" style={{ color: "#1877F2" }} />
              </div>
              <DialogTitle className="text-[16px] font-bold" style={{ color: "#050505" }}>
                {editingId ? "Edit Link Rotator" : "Tambah Link Rotator"}
              </DialogTitle>
            </div>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2 md:col-span-1">
                <label className="text-[12px] font-semibold" style={{ color: "#050505" }}>Nama Product</label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Promo Kaos" required
                  className="h-10 text-[12px] border-0 rounded-lg" style={{ backgroundColor: "#F0F2F5" }} />
              </div>
              <div className="space-y-1.5 col-span-2 md:col-span-1">
                <label className="text-[12px] font-semibold" style={{ color: "#050505" }}>Short URL (/r/)</label>
                <Input value={formData.shortCode} onChange={(e) => setFormData({ ...formData, shortCode: e.target.value })}
                  placeholder="custom-slug" required
                  className="h-10 text-[12px] border-0 rounded-lg" style={{ backgroundColor: "#F0F2F5" }} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold" style={{ color: "#050505" }}>Tipe Redirect</label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger className="h-10 text-[12px] rounded-lg border-0" style={{ backgroundColor: "#F0F2F5" }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="direct">Direct (Langsung WA)</SelectItem>
                    <SelectItem value="lander">Lander (Halaman Antara)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold" style={{ color: "#050505" }}>Mode Rotasi</label>
                <Select value={formData.targetType} onValueChange={(value) => setFormData({ ...formData, targetType: value })}>
                  <SelectTrigger className="h-10 text-[12px] rounded-lg border-0" style={{ backgroundColor: "#F0F2F5" }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single (Satu Nomor)</SelectItem>
                    <SelectItem value="rotator">Rotator (Banyak Nomor)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[12px] font-semibold" style={{ color: "#050505" }}>Nomor WhatsApp</label>
              {waList.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <Input value={item.number} onChange={(e) => updateWaField(index, "number", e.target.value)}
                    placeholder="62812345678" className="flex-1 h-10 text-[12px] border-0 rounded-lg" style={{ backgroundColor: "#F0F2F5" }} />
                  {formData.targetType === "rotator" && (
                    <Input type="number" value={item.weight}
                      onChange={(e) => updateWaField(index, "weight", parseInt(e.target.value) || 1)}
                      className="w-16 h-10 text-[12px] text-center border-0 rounded-lg" style={{ backgroundColor: "#F0F2F5" }} title="Bobot" />
                  )}
                  {waList.length > 1 && (
                    <button type="button" onClick={() => removeWaField(index)} className="p-2 rounded-lg hover:bg-[#FFEBEE]" style={{ color: "#E74C3C" }}>
                      <Trash size={16} />
                    </button>
                  )}
                </div>
              ))}
              {formData.targetType === "rotator" && (
                <button type="button" onClick={addWaField} className="flex items-center gap-1.5 text-[12px] font-semibold hover:underline" style={{ color: "#1877F2" }}>
                  <Plus size={14} /> Tambah Nomor Baru
                </button>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold" style={{ color: "#050505" }}>Pesan WhatsApp</label>
              <textarea value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Halo Admin, saya tertarik dengan..."
                className="w-full p-3 rounded-lg border-0 text-[12px] outline-none resize-none"
                style={{ backgroundColor: "#F0F2F5", color: "#050505" }} rows={3} />
            </div>

            {formData.type === "lander" && (
              <div className="space-y-3 p-3 rounded-lg" style={{ backgroundColor: "#E7F3FF" }}>
                <p className="text-[13px] font-bold" style={{ color: "#1877F2" }}>Pengaturan Tombol Lander</p>
                <div className="grid grid-cols-2 gap-3">
                  {(["button1", "button2"] as const).map((btn, i) => {
                    const cfg = landerConfig[btn];
                    return (
                      <div key={btn} className="space-y-1.5 p-3 rounded-lg bg-white">
                        <p className="text-[11px] font-bold" style={{ color: "#1877F2" }}>Tombol {i + 1}</p>
                        <Input value={cfg.label} onChange={(e) => updateLanderBtn(btn, "label", e.target.value)}
                          placeholder="Label" className="h-8 text-[11px] border-0 rounded-md" style={{ backgroundColor: "#F0F2F5" }} />
                        <div className="grid grid-cols-2 gap-1.5">
                          <div>
                            <label className="text-[9px] font-semibold" style={{ color: "#65676B" }}>Source</label>
                            <Input value={cfg.source} onChange={(e) => updateLanderBtn(btn, "source", e.target.value)}
                              placeholder="admin_xxx" className="h-8 text-[11px] border-0 rounded-md" style={{ backgroundColor: "#F0F2F5" }} />
                          </div>
                          <div>
                            <label className="text-[9px] font-semibold" style={{ color: "#65676B" }}>Teks WA</label>
                            <Input value={cfg.sourceText} onChange={(e) => updateLanderBtn(btn, "sourceText", e.target.value)}
                              placeholder="sumber dari..." className="h-8 text-[11px] border-0 rounded-md" style={{ backgroundColor: "#F0F2F5" }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={resetForm}
                className="h-9 text-[12px] rounded-lg border" style={{ borderColor: "#CCD0D5", color: "#65676B" }}>
                Batal
              </Button>
              <Button type="submit" disabled={submitting}
                className="h-9 text-[12px] font-semibold border-0 rounded-lg" style={{ backgroundColor: "#1877F2" }}>
                {submitting ? "Memproses..." : editingId ? "Update" : "Buat Link"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DETAIL MODAL */}
      {viewingDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl max-h-[90vh] flex flex-col">
            <div className="p-5 border-b shrink-0" style={{ borderColor: "#E4E6EB" }}>
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-[16px] font-bold" style={{ color: "#050505" }}>{viewingDetail.name}</h2>
                  <p className="text-[12px] font-mono font-medium" style={{ color: "#1877F2" }}>/r/{viewingDetail.short_code}</p>
                </div>
                <button onClick={() => setViewingDetail(null)} className="p-1.5 rounded-lg hover:bg-[#F2F3F5]" style={{ color: "#65676B" }}>
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-lg" style={{ backgroundColor: "#F0F2F5" }}>
                  <p className="text-[9px] font-bold uppercase" style={{ color: "#65676B" }}>Total Klik</p>
                  <p className="text-2xl font-bold" style={{ color: "#1877F2" }}>{clickLogsTotal}</p>
                </div>
                <div className="p-4 rounded-lg" style={{ backgroundColor: "#F0F2F5" }}>
                  <p className="text-[9px] font-bold uppercase" style={{ color: "#65676B" }}>Periode</p>
                  <p className="text-base font-bold" style={{ color: "#050505" }}>
                    {period === "today" ? "Hari Ini" : period === "yesterday" ? "Kemarin" : period === "week" ? "Minggu Ini" : "Bulan Ini"}
                  </p>
                </div>
              </div>

              {Object.keys(detailSourceBreakdown).length > 0 && (
                <div className="p-4 rounded-lg" style={{ backgroundColor: "#F0F2F5" }}>
                  <p className="text-[9px] font-bold uppercase mb-3" style={{ color: "#65676B" }}>Klik per Sumber</p>
                  <div className="space-y-2">
                    {Object.entries(detailSourceBreakdown).map(([src, count]) => {
                      const total = Object.values(detailSourceBreakdown).reduce((a, b) => a + b, 0);
                      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                      const label = src === 'lander_view' ? 'Halaman Lander' : src;
                      return (
                        <div key={src}>
                          <div className="flex justify-between text-[12px] mb-1">
                            <span className="font-medium capitalize" style={{ color: "#050505" }}>{label}</span>
                            <span style={{ color: "#65676B" }}>{count} ({pct}%)</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#E4E6EB" }}>
                            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: "#1877F2" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="p-4 rounded-lg" style={{ backgroundColor: "#F0F2F5" }}>
                <p className="text-[9px] font-bold uppercase mb-3" style={{ color: "#65676B" }}>Daftar Nomor</p>
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-2">
                  {(() => {
                    try {
                      const waNumbers = JSON.parse(viewingDetail.wa_numbers);
                      return waNumbers.map((wa: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-[12px] py-1.5 border-b last:border-0" style={{ borderColor: "#E4E6EB" }}>
                          <span className="font-medium" style={{ color: "#050505" }}>{wa.number}</span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md" style={{ backgroundColor: "#E7F3FF", color: "#1877F2" }}>W: {wa.weight || 1}</span>
                        </div>
                      ));
                    } catch {
                      return <span className="text-[12px] italic" style={{ color: "#65676B" }}>Format nomor tidak valid</span>;
                    }
                  })()}
                </div>
              </div>

              <div className="p-4 rounded-lg" style={{ backgroundColor: "#F0F2F5" }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[9px] font-bold uppercase" style={{ color: "#65676B" }}>Log Kunjungan</p>
                  <span className="text-[11px]" style={{ color: "#65676B" }}>{clickLogs.length} dari {clickLogsTotal}</span>
                </div>

                {clickLogsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: "#E4E6EB", borderTopColor: "#1877F2" }} />
                  </div>
                ) : clickLogs.length === 0 ? (
                  <p className="text-[13px] text-center py-4" style={{ color: "#65676B" }}>Belum ada kunjungan</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {clickLogs.map((log) => (
                      <div key={log.id} className="bg-white rounded-lg p-3 border" style={{ borderColor: "#E4E6EB" }}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[11px] font-mono" style={{ color: "#65676B" }}>{log.ip_address}</span>
                              {log.source && (
                                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md" style={{ backgroundColor: "#E7F3FF", color: "#1877F2" }}>{log.source}</span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-[11px]" style={{ color: "#65676B" }}>
                              {log.device_type && (
                                <span className="flex items-center gap-1">
                                  {log.device_type === "mobile" ? <Smartphone size={11} /> : log.device_type === "tablet" ? <Tablet size={11} /> : <Monitor size={11} />}
                                  {log.device_type}
                                </span>
                              )}
                              {log.browser && <span className="flex items-center gap-1"><Globe size={11} />{log.browser}</span>}
                              {log.os && <span>{log.os}</span>}
                            </div>
                            {(log.city || log.country) && (
                              <div className="flex items-center gap-1 mt-0.5 text-[11px]" style={{ color: "#8C939D" }}>
                                <MapPin size={11} /> {[log.city, log.country].filter(Boolean).join(", ")}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-[11px] shrink-0" style={{ color: "#8C939D" }}>
                            <Clock size={11} />
                            {new Date(log.created_at).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                        <p className="text-[9px] mt-1 truncate" style={{ color: "#BCC0C4" }} title={log.user_agent}>{log.user_agent}</p>
                      </div>
                    ))}
                  </div>
                )}

                {clickLogsTotal > 20 && (
                  <div className="flex items-center justify-between mt-3 pt-3 border-t" style={{ borderColor: "#E4E6EB" }}>
                    <button onClick={() => { const np = clickLogsPage - 1; setClickLogsPage(np); fetchClickLogs(viewingDetail.id, np); }}
                      disabled={clickLogsPage === 1}
                      className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-medium rounded-lg border disabled:opacity-40"
                      style={{ borderColor: "#CCD0D5", color: "#65676B" }}>
                      <ChevronLeft size={14} /> Sebelumnya
                    </button>
                    <span className="text-[12px]" style={{ color: "#65676B" }}>Hal. {clickLogsPage} / {Math.ceil(clickLogsTotal / 20)}</span>
                    <button onClick={() => { const np = clickLogsPage + 1; setClickLogsPage(np); fetchClickLogs(viewingDetail.id, np); }}
                      disabled={clickLogsPage >= Math.ceil(clickLogsTotal / 20)}
                      className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-medium rounded-lg border disabled:opacity-40"
                      style={{ borderColor: "#CCD0D5", color: "#65676B" }}>
                      Berikutnya <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="p-5 pt-0 shrink-0">
              <button onClick={() => setViewingDetail(null)}
                className="w-full py-2.5 rounded-lg font-semibold text-[13px] transition-colors"
                style={{ backgroundColor: "#F0F2F5", color: "#65676B" }}>
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
