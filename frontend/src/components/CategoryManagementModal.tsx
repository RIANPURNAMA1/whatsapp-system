import React, { useState, useEffect, createElement } from "react";
import axios from "axios";
import type { LucideIcon } from "lucide-react";
import {
  Activity, BarChart3, User, DollarSign, MapPin, Phone, Mail, Home,
  Users, Briefcase, GraduationCap, Heart, Clock, Calendar, Flame, Gem,
  Tag, CheckCircle, AlertTriangle, Ban, RefreshCw, FileText, Target,
  MessageSquare, ClipboardList, ShoppingCart, Star, PartyPopper, HelpCircle, ThumbsUp,
  X, Plus, Pencil, Trash2, Save,
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

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const COLORS = [
  "#1877F2", "#F5A623", "#E74C3C", "#8B5CF6", "#EC4899",
  "#0EA5E9", "#F59E0B", "#10B981", "#6366F1", "#EF4444",
];

const ICON_LIST: { name: string; icon: LucideIcon }[] = [
  { name: "Activity", icon: Activity },
  { name: "BarChart3", icon: BarChart3 },
  { name: "User", icon: User },
  { name: "Users", icon: Users },
  { name: "DollarSign", icon: DollarSign },
  { name: "MapPin", icon: MapPin },
  { name: "Phone", icon: Phone },
  { name: "Mail", icon: Mail },
  { name: "Home", icon: Home },
  { name: "Briefcase", icon: Briefcase },
  { name: "GraduationCap", icon: GraduationCap },
  { name: "Heart", icon: Heart },
  { name: "Clock", icon: Clock },
  { name: "Calendar", icon: Calendar },
  { name: "Flame", icon: Flame },
  { name: "Gem", icon: Gem },
  { name: "Tag", icon: Tag },
  { name: "CheckCircle", icon: CheckCircle },
  { name: "AlertTriangle", icon: AlertTriangle },
  { name: "Ban", icon: Ban },
  { name: "RefreshCw", icon: RefreshCw },
  { name: "FileText", icon: FileText },
  { name: "Target", icon: Target },
  { name: "MessageSquare", icon: MessageSquare },
  { name: "ClipboardList", icon: ClipboardList },
  { name: "ShoppingCart", icon: ShoppingCart },
  { name: "Star", icon: Star },
  { name: "PartyPopper", icon: PartyPopper },
  { name: "HelpCircle", icon: HelpCircle },
  { name: "ThumbsUp", icon: ThumbsUp },
];

const CategoryManagementModal: React.FC<Props> = ({ open, onClose, onSaved }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", label: "", color: "#1877F2", icon: "BarChart3", keywords: "" });

  const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get("/lead-categories");
      if (res.data.success) setCategories(res.data.data);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchCategories();
  }, [open]);

  const resetForm = () => {
    setForm({ name: "", label: "", color: "#1877F2", icon: "BarChart3", keywords: "" });
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
      onSaved();
    } catch (err) {
      console.error("Failed to save category:", err);
    }
  };

  const handleEdit = (cat: Category) => {
    setEditingId(cat.id);
    const kw = typeof cat.keywords === "string" ? cat.keywords : (cat.keywords || []).join(", ");
    setForm({
      name: cat.name,
      label: cat.label,
      color: cat.color,
      icon: cat.icon,
      keywords: kw,
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus kategori ini?")) return;
    try {
      await api.delete(`/lead-categories/${id}`);
      fetchCategories();
      onSaved();
    } catch (err) {
      console.error("Failed to delete category:", err);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E4E6EB]">
          <h2 className="text-lg font-semibold text-[#050505]">Kelola Kategori Leads</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F2F3F5] text-[#65676B]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Form */}
          <div className="bg-[#F0F2F5] rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-semibold text-[#050505]">
              {editingId ? "Edit Kategori" : "Tambah Kategori Baru"}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <input
                placeholder="Nama (contoh: usia)"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value.toLowerCase().replace(/\s+/g, "_") })}
                className="px-3 py-2 text-sm border rounded-lg bg-white"
                style={{ borderColor: "#E4E6EB" }}
              />
              <input
                placeholder="Label (contoh: Usia)"
                value={form.label}
                onChange={e => setForm({ ...form, label: e.target.value })}
                className="px-3 py-2 text-sm border rounded-lg bg-white"
                style={{ borderColor: "#E4E6EB" }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#65676B]">Warna:</span>
                <div className="flex gap-1 flex-wrap">
                  {COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setForm({ ...form, color: c })}
                      className="w-6 h-6 rounded-full border-2 transition-all"
                      style={{ backgroundColor: c, borderColor: form.color === c ? "#050505" : "transparent" }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <span className="text-sm text-[#65676B]">Icon:</span>
                <div className="flex gap-1 flex-wrap mt-1 max-w-[260px]">
                  {ICON_LIST.map(({ name, icon: Icon }) => (
                    <button
                      key={name}
                      onClick={() => setForm({ ...form, icon: name })}
                      className="w-7 h-7 flex items-center justify-center rounded-md border-2 transition-all hover:bg-[#F0F2F5]"
                      style={{ borderColor: form.icon === name ? "#1877F2" : "transparent" }}
                      title={name}
                    >
                      <Icon size={14} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-[#65676B] mb-1 block">Keywords (pisahkan dengan koma)</label>
              <textarea
                placeholder="usia, umur, terlalu muda, terlalu tua"
                value={form.keywords}
                onChange={e => setForm({ ...form, keywords: e.target.value })}
                className="w-full px-3 py-2 text-sm border rounded-lg bg-white resize-none"
                style={{ borderColor: "#E4E6EB" }}
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-lg hover:brightness-110 transition-all"
                style={{ backgroundColor: "#1877F2" }}
              >
                <Save className="w-4 h-4" />
                {editingId ? "Simpan" : "Tambah"}
              </button>
              {editingId && (
                <button onClick={resetForm} className="px-4 py-2 text-sm font-semibold rounded-lg border hover:bg-[#F2F3F5]" style={{ borderColor: "#E4E6EB", color: "#65676B" }}>
                  Batal
                </button>
              )}
            </div>
          </div>

          {/* List */}
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
                  <button onClick={() => handleEdit(cat)} className="p-1.5 rounded-lg hover:bg-[#F2F3F5] text-[#65676B]" title="Edit">
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
  );
};

export default CategoryManagementModal;
