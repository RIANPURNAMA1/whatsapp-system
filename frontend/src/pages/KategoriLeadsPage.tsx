import React, { useState, useEffect, createElement } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import type { LucideIcon } from "lucide-react";
import {
  Activity, BarChart3, User, DollarSign, MapPin, Phone, Mail, Home,
  Users, Briefcase, GraduationCap, Heart, Clock, Calendar, Flame, Gem,
  Tag, CheckCircle, AlertTriangle, Ban, RefreshCw, FileText, Target,
  MessageSquare, ClipboardList, ShoppingCart, Star, PartyPopper, HelpCircle, ThumbsUp,
  X, Plus, Pencil, Trash2, Save, ArrowLeft,
} from "lucide-react";

interface Category {
  id: number;
  name: string;
  label: string;
  color: string;
  icon: string;
  keywords: string | string[];
  is_active: number;
}

const COLORS = [
  "#0866FF", "#F5A623", "#E74C3C", "#8B5CF6", "#EC4899",
  "#0EA5E9", "#F59E0B", "#10B981", "#6366F1", "#EF4444",
];

const ICON_LIST: { name: string; icon: LucideIcon }[] = [
  { name: "Activity", icon: Activity }, { name: "BarChart3", icon: BarChart3 },
  { name: "User", icon: User }, { name: "Users", icon: Users },
  { name: "DollarSign", icon: DollarSign }, { name: "MapPin", icon: MapPin },
  { name: "Phone", icon: Phone }, { name: "Mail", icon: Mail },
  { name: "Home", icon: Home }, { name: "Briefcase", icon: Briefcase },
  { name: "GraduationCap", icon: GraduationCap }, { name: "Heart", icon: Heart },
  { name: "Clock", icon: Clock }, { name: "Calendar", icon: Calendar },
  { name: "Flame", icon: Flame }, { name: "Gem", icon: Gem },
  { name: "Tag", icon: Tag }, { name: "CheckCircle", icon: CheckCircle },
  { name: "AlertTriangle", icon: AlertTriangle }, { name: "Ban", icon: Ban },
  { name: "RefreshCw", icon: RefreshCw }, { name: "FileText", icon: FileText },
  { name: "Target", icon: Target }, { name: "MessageSquare", icon: MessageSquare },
  { name: "ClipboardList", icon: ClipboardList }, { name: "ShoppingCart", icon: ShoppingCart },
  { name: "Star", icon: Star }, { name: "PartyPopper", icon: PartyPopper },
  { name: "HelpCircle", icon: HelpCircle }, { name: "ThumbsUp", icon: ThumbsUp },
];

const KategoriLeadsPage: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", label: "", color: "#0866FF", icon: "BarChart3", keywords: "" });

  const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get("/lead-categories");
      if (res.data.success) setCategories(res.data.data);
    } catch {
      console.error("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const resetForm = () => {
    setForm({ name: "", label: "", color: "#0866FF", icon: "BarChart3", keywords: "" });
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!form.name || !form.label) return;
    const payload = {
      ...form,
      keywords: form.keywords.split(",").map(k => k.trim()).filter(Boolean),
    };
    try {
      if (editingId) {
        await api.put(`/lead-categories/${editingId}`, payload);
      } else {
        await api.post("/lead-categories", payload);
      }
      resetForm();
      fetchCategories();
    } catch {
      console.error("Failed to save category");
    }
  };

  const handleEdit = (cat: Category) => {
    setEditingId(cat.id);
    const kw = typeof cat.keywords === "string" ? cat.keywords : (cat.keywords || []).join(", ");
    setForm({ name: cat.name, label: cat.label, color: cat.color, icon: cat.icon, keywords: kw });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus kategori ini?")) return;
    try {
      await api.delete(`/lead-categories/${id}`);
      fetchCategories();
    } catch {
      console.error("Failed to delete category");
    }
  };

  return (
    <div className="min-h-full" style={{ backgroundColor: "#F0F2F5" }}>
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/analisis-leads")}
              className="w-9 h-9 rounded-lg flex items-center justify-center border hover:bg-[#F2F3F5]"
              style={{ borderColor: "#E4E6EB", color: "#65676B" }}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "#8B5CF6" }}>
              <Tag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#050505]">Kategori Leads</h1>
              <p className="text-sm" style={{ color: "#65676B" }}>Analisis kendala kategori leads</p>
            </div>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs mb-4" style={{ color: "#65676B" }}>
          <button onClick={() => navigate("/")} className="hover:underline font-medium" style={{ color: "#0866FF" }}>Dashboard</button>
          <span>/</span>
          <button onClick={() => navigate("/analisis-leads")} className="hover:underline font-medium" style={{ color: "#0866FF" }}>Analisis Leads</button>
          <span>/</span>
          <span className="font-semibold" style={{ color: "#050505" }}>Kategori Leads</span>
        </div>

        <div className="bg-white rounded-xl border max-w-3xl" style={{ borderColor: "#E4E6EB" }}>
          {/* Form */}
          <div className="p-5 border-b" style={{ borderColor: "#E4E6EB" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#050505]">
                {editingId ? "Edit Kategori" : "Tambah Kategori Baru"}
              </h3>
              {editingId && (
                <button onClick={resetForm} className="text-xs font-medium hover:underline" style={{ color: "#65676B" }}>
                  Batal
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input
                placeholder="Nama (contoh: usia)"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value.toLowerCase().replace(/\s+/g, "_") })}
                className="px-3 py-2 text-sm border rounded-lg bg-white outline-none"
                style={{ borderColor: "#E4E6EB" }}
              />
              <input
                placeholder="Label (contoh: Usia)"
                value={form.label}
                onChange={e => setForm({ ...form, label: e.target.value })}
                className="px-3 py-2 text-sm border rounded-lg bg-white outline-none"
                style={{ borderColor: "#E4E6EB" }}
              />
            </div>
            <div className="flex items-center gap-4 mb-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium" style={{ color: "#65676B" }}>Warna:</span>
                <div className="flex gap-1">
                  {COLORS.map(c => (
                    <button key={c} onClick={() => setForm({ ...form, color: c })}
                      className="w-6 h-6 rounded-full border-2 transition-all"
                      style={{ backgroundColor: c, borderColor: form.color === c ? "#050505" : "transparent" }} />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium" style={{ color: "#65676B" }}>Icon:</span>
                <div className="flex gap-1 flex-wrap max-w-xs">
                  {ICON_LIST.map(({ name, icon: Icon }) => (
                    <button key={name} onClick={() => setForm({ ...form, icon: name })}
                      className="w-7 h-7 flex items-center justify-center rounded-md border-2 transition-all hover:bg-[#F0F2F5]"
                      style={{ borderColor: form.icon === name ? "#0866FF" : "transparent" }}
                      title={name}>
                      <Icon size={14} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mb-3">
              <label className="text-xs font-medium block mb-1" style={{ color: "#65676B" }}>Keywords (pisahkan dengan koma)</label>
              <textarea
                placeholder="usia, umur, terlalu muda, terlalu tua"
                value={form.keywords}
                onChange={e => setForm({ ...form, keywords: e.target.value })}
                className="w-full px-3 py-2 text-sm border rounded-lg bg-white outline-none resize-none"
                style={{ borderColor: "#E4E6EB" }}
                rows={2}
              />
            </div>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-lg hover:brightness-110 transition-all"
              style={{ backgroundColor: "#0866FF" }}
            >
              <Save className="w-4 h-4" />
              {editingId ? "Simpan" : "Tambah"}
            </button>
          </div>

          {/* List */}
          <div className="p-5">
            <h3 className="text-sm font-semibold text-[#050505] mb-3">Daftar Kategori ({categories.length})</h3>
            {loading ? (
              <div className="text-center py-8 text-sm" style={{ color: "#65676B" }}>Memuat...</div>
            ) : categories.length === 0 ? (
              <div className="text-center py-8 text-sm" style={{ color: "#65676B" }}>Belum ada kategori</div>
            ) : (
              <div className="space-y-2">
                {categories.map(cat => (
                  <div key={cat.id} className="flex items-center gap-3 px-4 py-3 rounded-lg border" style={{ borderColor: "#E4E6EB" }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: cat.color + "20", color: cat.color }}>
                      {(() => {
                        const found = ICON_LIST.find(i => i.name === cat.icon);
                        if (found) return createElement(found.icon, { size: 16 });
                        return <span className="text-sm">{cat.icon || "📊"}</span>;
                      })()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#050505]">{cat.label}</p>
                      <p className="text-xs" style={{ color: "#65676B" }}>
                        {cat.name}
                        {cat.keywords && Array.isArray(cat.keywords) && cat.keywords.length > 0 && (
                          <> &middot; Keywords: {cat.keywords.join(", ")}</>
                        )}
                      </p>
                    </div>
                    <button onClick={() => handleEdit(cat)} className="p-1.5 rounded-lg hover:bg-[#F2F3F5]" style={{ color: "#65676B" }} title="Edit">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(cat.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500" title="Hapus">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KategoriLeadsPage;
