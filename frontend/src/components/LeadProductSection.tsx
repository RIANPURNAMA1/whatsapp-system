import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit3,
  Trash2,
  Package,
  Search,
  MessageSquare,
  User,
  Smartphone,
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

interface LeadProduct {
  id: number;
  name: string;
  template_text: string;
  session_id: string | null;
  session_name: string | null;
  created_at: string;
  updated_at: string;
}

interface Assignment {
  id: number;
  session_id: string;
  chat_jid: string;
  product_id: number;
  assigned_at: string;
  product_name: string;
  template_text: string;
  contact_name: string | null;
  session_name: string | null;
}

interface ProductStat {
  id: number;
  name: string;
  template_text: string;
  session_id: string | null;
  session_name: string | null;
  total_leads: number;
}

interface SessionOption {
  id: string;
  name: string;
  phone_number: string | null;
}

export const LeadProductSection: React.FC = () => {
  const [products, setProducts] = useState<LeadProduct[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [stats, setStats] = useState<ProductStat[]>([]);
  const [sessions, setSessions] = useState<SessionOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"products" | "assignments">("products");
  const [formData, setFormData] = useState({
    name: "",
    template_text: "",
    session_id: null as string | null,
  });
  const [dateFilter, setDateFilter] = useState("");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (dateFilter) params.date_filter = dateFilter;
      if (dateFilter === "custom" && customStart && customEnd) {
        params.start_date = customStart;
        params.end_date = customEnd;
      }
      const [productsRes, assignmentsRes, statsRes, sessionsRes] = await Promise.all([
        api.get("/lead-products"),
        api.get("/lead-products/assignments", { params }),
        api.get("/lead-products/stats", { params }),
        api.get("/lead-products/sessions"),
      ]);
      setProducts(productsRes.data?.data || []);
      setAssignments(assignmentsRes.data?.data || []);
      setStats(statsRes.data?.data || []);
      setSessions(sessionsRes.data?.data || []);
    } catch (error) {
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateFilter, customStart, customEnd]);

  const resetForm = () => {
    setEditingId(null);
    setFormData({ name: "", template_text: "", session_id: null });
    setIsFormOpen(false);
  };

  const handleEditClick = (item: LeadProduct) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      template_text: item.template_text,
      session_id: item.session_id || null,
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.template_text) {
      return toast.error("Lengkapi semua data!");
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        template_text: formData.template_text,
        session_id: formData.session_id,
      };
      if (editingId) {
        await api.put(`/lead-products/${editingId}`, payload);
      } else {
        await api.post("/lead-products", payload);
      }
      toast.success("Berhasil disimpan");
      resetForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal menyimpan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus produk ini?")) return;
    try {
      await api.delete(`/lead-products/${id}`);
      setProducts((prev) => prev.filter((item) => item.id !== id));
      toast.success("Produk berhasil dihapus");
      fetchData();
    } catch {
      toast.error("Gagal menghapus");
    }
  };

  const handleRemoveAssignment = async (id: number) => {
    if (!confirm("Hapus assignment ini?")) return;
    try {
      await api.delete(`/lead-products/assignments/${id}`);
      toast.success("Assignment dihapus");
      fetchData();
    } catch {
      toast.error("Gagal");
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.template_text.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const filteredAssignments = assignments.filter(
    (a) =>
      (a.product_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.contact_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.chat_jid.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const statsMap = stats.reduce((acc, s) => {
    acc[s.id] = s.total_leads;
    return acc;
  }, {} as Record<number, number>);

  const totalProducts = products.length;
  const totalLeads = stats.reduce((sum, s) => sum + s.total_leads, 0);
  const totalDeviceProducts = products.filter(p => p.session_id).length;
  const totalAllDeviceProducts = products.filter(p => !p.session_id).length;

  const selectValue = formData.session_id || "all";
  const selectedSessionName = formData.session_id
    ? sessions.find(s => s.id === formData.session_id)?.name
    : null;

  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#E7F3FF" }}>
              <Package className="w-5 h-5" style={{ color: "#0866FF" }} />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: "#050505" }}>Leads Product</h1>
              <p className="text-[12px]" style={{ color: "#65676B" }}>Kelola produk & deteksi otomatis dari template chat</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#8C939D" }} />
              <Input
                type="text" placeholder="Cari..." value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-56 pl-9 h-[36px] bg-[#F0F2F5] border-0 text-[12px] rounded-lg focus-visible:ring-0"
                style={{ color: "#050505" }}
              />
            </div>
            <Button onClick={() => { resetForm(); setIsFormOpen(true); }}
              className="h-[34px] text-[12px] font-semibold gap-1.5 border-0" style={{ backgroundColor: "#0866FF" }}>
              <Plus className="w-4 h-4" />
              Tambah Produk
            </Button>
          </div>
        </div>

        {/* DASHBOARD CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <div className="bg-white rounded-lg border p-4" style={{ borderColor: "#E4E6EB" }}>
            <div className="flex items-center gap-2 mb-1">
              <Package size={16} style={{ color: "#0866FF" }} />
              <span className="text-[11px] font-semibold" style={{ color: "#65676B" }}>Total Produk</span>
            </div>
            <p className="text-[24px] font-bold" style={{ color: "#050505" }}>{totalProducts}</p>
          </div>
          <div className="bg-white rounded-lg border p-4" style={{ borderColor: "#E4E6EB" }}>
            <div className="flex items-center gap-2 mb-1">
              <User size={16} style={{ color: "#E74C3C" }} />
              <span className="text-[11px] font-semibold" style={{ color: "#65676B" }}>Total Leads</span>
            </div>
            <p className="text-[24px] font-bold" style={{ color: "#050505" }}>{totalLeads}</p>
          </div>
          <div className="bg-white rounded-lg border p-4" style={{ borderColor: "#E4E6EB" }}>
            <div className="flex items-center gap-2 mb-1">
              <Smartphone size={16} style={{ color: "#E65100" }} />
              <span className="text-[11px] font-semibold" style={{ color: "#65676B" }}>Per Device</span>
            </div>
            <p className="text-[24px] font-bold" style={{ color: "#050505" }}>{totalDeviceProducts}</p>
          </div>
          <div className="bg-white rounded-lg border p-4" style={{ borderColor: "#E4E6EB" }}>
            <div className="flex items-center gap-2 mb-1">
              <Package size={16} style={{ color: "#2E7D32" }} />
              <span className="text-[11px] font-semibold" style={{ color: "#65676B" }}>Semua Device</span>
            </div>
            <p className="text-[24px] font-bold" style={{ color: "#050505" }}>{totalAllDeviceProducts}</p>
          </div>
        </div>

        {/* TABS + DATE FILTER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex gap-1 p-0.5 rounded-lg" style={{ backgroundColor: "#E4E6EB", width: "fit-content" }}>
            <button
              onClick={() => setActiveTab("products")}
              className="px-4 py-1.5 rounded-md text-[12px] font-semibold transition-colors"
              style={{
                backgroundColor: activeTab === "products" ? "#FFFFFF" : "transparent",
                color: activeTab === "products" ? "#0866FF" : "#65676B",
                boxShadow: activeTab === "products" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
            >
              Daftar Produk
            </button>
            <button
              onClick={() => setActiveTab("assignments")}
              className="px-4 py-1.5 rounded-md text-[12px] font-semibold transition-colors"
              style={{
                backgroundColor: activeTab === "assignments" ? "#FFFFFF" : "transparent",
                color: activeTab === "assignments" ? "#0866FF" : "#65676B",
                boxShadow: activeTab === "assignments" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
            >
              Hasil Deteksi
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {["hari_ini", "kemarin", "minggu_ini", "bulan_ini"].map((key) => (
              <button
                key={key}
                onClick={() => {
                  setDateFilter(dateFilter === key ? "" : key);
                  setCustomStart("");
                  setCustomEnd("");
                }}
                className="px-3 py-1.5 rounded-md text-[11px] font-semibold transition-colors border"
                style={{
                  backgroundColor: dateFilter === key ? "#0866FF" : "#FFFFFF",
                  color: dateFilter === key ? "#FFFFFF" : "#65676B",
                  borderColor: dateFilter === key ? "#0866FF" : "#CCD0D5",
                }}
              >
                {key === "hari_ini" ? "Hari Ini" : key === "kemarin" ? "Kemarin" : key === "minggu_ini" ? "Minggu Ini" : "Bulan Ini"}
              </button>
            ))}
            <button
              onClick={() => {
                setDateFilter(dateFilter === "custom" ? "" : "custom");
                if (dateFilter !== "custom") {
                  setCustomStart("");
                  setCustomEnd("");
                }
              }}
              className="px-3 py-1.5 rounded-md text-[11px] font-semibold transition-colors border"
              style={{
                backgroundColor: dateFilter === "custom" ? "#0866FF" : "#FFFFFF",
                color: dateFilter === "custom" ? "#FFFFFF" : "#65676B",
                borderColor: dateFilter === "custom" ? "#0866FF" : "#CCD0D5",
              }}
            >
              Custom
            </button>
            {dateFilter === "custom" && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="h-[30px] px-2 rounded-md border text-[11px] outline-none"
                  style={{ borderColor: "#CCD0D5", backgroundColor: "#FFFFFF", color: "#050505" }}
                />
                <span className="text-[11px]" style={{ color: "#65676B" }}>-</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="h-[30px] px-2 rounded-md border text-[11px] outline-none"
                  style={{ borderColor: "#CCD0D5", backgroundColor: "#FFFFFF", color: "#050505" }}
                />
              </div>
            )}
          </div>
        </div>

        {activeTab === "products" ? (
          loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-8 h-8 border-[3px] rounded-full animate-spin" style={{ borderColor: "#E4E6EB", borderTopColor: "#0866FF" }} />
              <p className="text-[13px]" style={{ color: "#65676B" }}>Memuat data...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white rounded-lg border p-10 text-center" style={{ borderColor: "#E4E6EB" }}>
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: "#F0F2F5" }}>
                <Package className="w-7 h-7" style={{ color: "#BCC0C4" }} />
              </div>
              <h3 className="text-[16px] font-bold mb-1" style={{ color: "#050505" }}>Belum ada produk</h3>
              <p className="text-[13px] mb-4" style={{ color: "#65676B" }}>
                Tambahkan produk dengan template teks untuk deteksi otomatis
              </p>
              <Button onClick={() => { resetForm(); setIsFormOpen(true); }}
                className="h-[34px] text-[12px] font-semibold gap-1.5 border-0" style={{ backgroundColor: "#0866FF" }}>
                <Plus className="w-4 h-4" /> Tambah Produk
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredProducts.map((item) => (
                <div key={item.id} className="bg-white rounded-lg border p-4 transition-all hover:shadow-sm" style={{ borderColor: "#E4E6EB" }}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "#E7F3FF" }}>
                        <Package size={18} style={{ color: "#0866FF" }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-[15px]" style={{ color: "#050505" }}>{item.name}</p>
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md" style={{ backgroundColor: "#E7F3FF", color: "#0866FF" }}>
                            {statsMap[item.id] || 0} leads
                          </span>
                          {item.session_name && (
                            <span className="text-[11px] flex items-center gap-1 px-2 py-0.5 rounded-md" style={{ backgroundColor: "#FFF3E0", color: "#E65100" }}>
                              <Smartphone size={11} />
                              {item.session_name}
                            </span>
                          )}
                          {!item.session_name && (
                            <span className="text-[11px] px-2 py-0.5 rounded-md" style={{ backgroundColor: "#E8F5E9", color: "#2E7D32" }}>
                              Semua Device
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[12px] mt-1" style={{ color: "#65676B" }}>
                          <MessageSquare size={12} />
                          <span className="italic">"{item.template_text}"</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => handleEditClick(item)} className="p-1.5 rounded-lg hover:bg-[#F2F3F5]" style={{ color: "#8C939D" }}>
                        <Edit3 size={16} />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-[#FFEBEE]" style={{ color: "#8C939D" }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-8 h-8 border-[3px] rounded-full animate-spin" style={{ borderColor: "#E4E6EB", borderTopColor: "#0866FF" }} />
              <p className="text-[13px]" style={{ color: "#65676B" }}>Memuat data...</p>
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="bg-white rounded-lg border p-10 text-center" style={{ borderColor: "#E4E6EB" }}>
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: "#F0F2F5" }}>
                <User className="w-7 h-7" style={{ color: "#BCC0C4" }} />
              </div>
              <h3 className="text-[16px] font-bold mb-1" style={{ color: "#050505" }}>Belum ada deteksi</h3>
              <p className="text-[13px] mb-4" style={{ color: "#65676B" }}>
                Leads akan terdeteksi otomatis saat admin mengirim template produk ke chat
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border overflow-hidden" style={{ borderColor: "#E4E6EB" }}>
              <div className="overflow-x-auto">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr style={{ backgroundColor: "#F7F8FA" }}>
                      <th className="text-left font-semibold px-4 py-3" style={{ color: "#65676B" }}>Kontak</th>
                      <th className="text-left font-semibold px-4 py-3" style={{ color: "#65676B" }}>Produk</th>
                      <th className="text-left font-semibold px-4 py-3" style={{ color: "#65676B" }}>Template</th>
                      <th className="text-left font-semibold px-4 py-3" style={{ color: "#65676B" }}>Device</th>
                      <th className="text-left font-semibold px-4 py-3" style={{ color: "#65676B" }}>Waktu</th>
                      <th className="text-center font-semibold px-4 py-3" style={{ color: "#65676B" }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAssignments.map((item) => (
                      <tr key={item.id} className="border-t transition-colors hover:bg-[#F7F8FA]" style={{ borderColor: "#E4E6EB" }}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <User size={14} style={{ color: "#8C939D" }} />
                            <span className="font-medium" style={{ color: "#050505" }}>{item.contact_name || item.chat_jid}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold px-2 py-0.5 rounded-md text-[11px]" style={{ backgroundColor: "#E7F3FF", color: "#0866FF" }}>
                            {item.product_name}
                          </span>
                        </td>
                        <td className="px-4 py-3 italic" style={{ color: "#65676B" }}>"{item.template_text}"</td>
                        <td className="px-4 py-3">
                          {item.session_name ? (
                            <span className="flex items-center gap-1" style={{ color: "#65676B" }}>
                              <Smartphone size={12} />
                              {item.session_name}
                            </span>
                          ) : (
                            <span style={{ color: "#BCC0C4" }}>-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap" style={{ color: "#8C939D" }}>
                          {new Date(item.assigned_at).toLocaleString("id-ID")}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleRemoveAssignment(item.id)}
                            className="p-1.5 rounded-lg hover:bg-[#FFEBEE] text-[#E74C3C]"
                            title="Hapus"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}
      </div>

      {/* FORM DIALOG */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#E7F3FF" }}>
                <Package className="w-4 h-4" style={{ color: "#0866FF" }} />
              </div>
              <DialogTitle className="text-[16px] font-bold" style={{ color: "#050505" }}>
                {editingId ? "Edit Produk" : "Tambah Produk"}
              </DialogTitle>
            </div>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold" style={{ color: "#050505" }}>Nama Produk</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Contoh: Product A"
                required
                className="h-10 text-[12px] border-0 rounded-lg" style={{ backgroundColor: "#F0F2F5" }}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold" style={{ color: "#050505" }}>
                Template Teks Deteksi
              </label>
              <textarea
                value={formData.template_text}
                onChange={(e) => setFormData({ ...formData, template_text: e.target.value })}
                placeholder="Contoh: Dari product A ya kak"
                required
                className="w-full p-3 rounded-lg border-0 text-[12px] outline-none resize-none"
                style={{ backgroundColor: "#F0F2F5", color: "#050505" }}
                rows={3}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold" style={{ color: "#050505" }}>
                Device (Opsional)
              </label>
              <Select
                value={selectValue}
                onValueChange={(value) => setFormData({ ...formData, session_id: value === "all" ? null : value })}
              >
                <SelectTrigger className="h-10 text-[12px] border-0 rounded-lg" style={{ backgroundColor: "#F0F2F5" }}>
                  <SelectValue placeholder="Semua Device" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-[12px]">Semua Device</SelectItem>
                  {sessions.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-[12px]">
                      {s.name} {s.phone_number ? `(${s.phone_number})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px]" style={{ color: "#8C939D" }}>
                {formData.session_id
                  ? `Produk hanya akan terdeteksi saat mengirim dari device "${selectedSessionName}"`
                  : "Produk akan terdeteksi dari semua device"}
              </p>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={resetForm}
                className="h-9 text-[12px] rounded-lg border" style={{ borderColor: "#CCD0D5", color: "#65676B" }}>
                Batal
              </Button>
              <Button type="submit" disabled={submitting}
                className="h-9 text-[12px] font-semibold border-0 rounded-lg" style={{ backgroundColor: "#0866FF" }}>
                {submitting ? "Memproses..." : editingId ? "Update" : "Simpan Produk"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
