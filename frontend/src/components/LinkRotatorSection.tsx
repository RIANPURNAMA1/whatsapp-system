import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Copy,
  Link as LinkIcon,
  RefreshCcw,
  Smartphone,
  Type,
  Hash,
  Save,
  Check,
  Loader2,
  ExternalLink,
  MousePointerClick,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

// --- API Configuration ---
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

interface Rotator {
  id: number;
  name: string;
  shortCode: string;
  url: string;
  clicks: number;
  type: string;
  targetType: string;
  waNumbers: string;
  message: string;
}

export const LinkRotatorSection: React.FC<{ isDarkMode: boolean }> = ({
  isDarkMode,
}) => {
  const [rotators, setRotators] = useState<Rotator[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    shortCode: "",
    type: "direct",
    targetType: "single",
    waNumbers: "",
    message: "",
  });

  // --- Handlers ---
  const fetchRotators = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/rotators");
      const result = Array.isArray(data?.data) ? data.data : data || [];
      setRotators(result);
    } catch (error: any) {
      toast.error("Gagal sinkronisasi data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRotators();
  }, []);

  const handleEditClick = (item: Rotator) => {
    setEditingId(item.id);
    setFormData({
      name: item.name || "",
      shortCode: item.shortCode || "",
      type: item.type || "direct",
      targetType: item.targetType || "single",
      waNumbers: item.waNumbers || "",
      message: item.message || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: "",
      shortCode: "",
      type: "direct",
      targetType: "single",
      waNumbers: "",
      message: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.shortCode || !formData.waNumbers)
      return toast.error("Lengkapi data utama!");

    setSubmitting(true);
    try {
      if (editingId) {
        await api.put(`/rotators/${editingId}`, formData);
        toast.success("Link berhasil diperbarui");
      } else {
        await api.post("/rotators", formData);
        toast.success("Link berhasil dibuat");
      }
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
      toast.error("Gagal menghapus");
    }
  };

  const filteredData = useMemo(
    () =>
      rotators.filter(
        (item) =>
          (item.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.shortCode || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()),
      ),
    [rotators, searchTerm],
  );

  const theme = {
    card: isDarkMode
      ? "bg-[#111B21] border-[#222D34]"
      : "bg-white border-gray-100 shadow-sm",
    input: isDarkMode
      ? "bg-[#202C33] text-white focus:ring-1 ring-emerald-500"
      : "bg-gray-50 border focus:bg-white",
    textMain: isDarkMode ? "text-[#E9EDEF]" : "text-gray-800",
    textSub: "text-[#8696A0]",
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300 font-sans">
      {/* HEADER */}
      <header
        className={`px-6 py-4 flex items-center justify-between border-b sticky top-0 z-10 ${isDarkMode ? "bg-[#202C33] border-[#313D45]" : "bg-[#F0F2F5] border-gray-200"}`}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-md">
            <LinkIcon className="text-emerald-500" size={20} />
          </div>
          <div>
            <h1 className={`text-lg font-bold ${theme.textMain}`}>
              Link Rotator
            </h1>
            <p
              className={`text-[11px] font-medium uppercase tracking-tight ${theme.textSub}`}
            >
              {loading ? "Sync..." : `${filteredData.length} Link Aktif`}
            </p>
          </div>
        </div>
        <button
          onClick={fetchRotators}
          className="p-2 hover:bg-black/5 rounded-full transition-all"
        >
          <RefreshCcw
            size={18}
            className={`${loading ? "animate-spin" : ""} ${theme.textSub}`}
          />
        </button>
      </header>

      <div className="max-w-4xl mx-auto w-full p-4 md:p-6 space-y-8 overflow-y-auto">
        {/* FORM SECTION */}
        <section
          className={`p-5 rounded-md border transition-all ${editingId ? "ring-2 ring-emerald-500/50" : ""} ${theme.card}`}
        >
          <div className="flex items-center justify-between mb-5 border-b border-inherit pb-3">
            <div className="flex items-center gap-2">
              {editingId ? (
                <Edit3 className="text-blue-500" size={16} />
              ) : (
                <Plus className="text-emerald-500" size={16} />
              )}
              <h2 className={`text-sm font-bold uppercase ${theme.textMain}`}>
                {editingId
                  ? `Edit Link: ${formData.shortCode}`
                  : "Create New Link"}
              </h2>
            </div>
            {editingId && (
              <button
                onClick={resetForm}
                className="text-[10px] flex items-center gap-1 font-bold text-red-500 hover:underline"
              >
                <X size={12} /> BATAL EDIT
              </button>
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div className="space-y-4">
              <InputGroup label="Campaign Name" icon={<Hash size={14} />}>
                <input
                  value={formData.name || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g. Promo Sepatu"
                  className={`w-full pl-9 pr-3 py-2 rounded-md text-sm outline-none ${theme.input}`}
                />
              </InputGroup>

              <InputGroup
                label="Custom Slug"
                icon={
                  <span className="text-[10px] font-bold opacity-50">/r/</span>
                }
              >
                <input
                  value={formData.shortCode || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, shortCode: e.target.value })
                  }
                  placeholder="promo-1"
                  className={`w-full pl-9 pr-3 py-2 rounded-md text-sm outline-none ${theme.input}`}
                />
              </InputGroup>
            </div>

            <div className="space-y-4">
              <InputGroup
                label="WhatsApp Numbers"
                icon={<Smartphone size={14} />}
              >
                <input
                  value={formData.waNumbers || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, waNumbers: e.target.value })
                  }
                  placeholder="62812..., 6287..."
                  className={`w-full pl-9 pr-3 py-2 rounded-md text-sm outline-none ${theme.input}`}
                />
              </InputGroup>

              <div className="grid grid-cols-2 gap-2">
                <InputGroup label="Type">
                  <select
                    value={formData.type || "direct"}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    className={`w-full px-3 py-2 rounded-md text-sm outline-none ${theme.input}`}
                  >
                    <option value="direct">Direct WA</option>
                    <option value="lander">Lander</option>
                  </select>
                </InputGroup>
                <InputGroup label="Method">
                  <select
                    value={formData.targetType || "single"}
                    onChange={(e) =>
                      setFormData({ ...formData, targetType: e.target.value })
                    }
                    className={`w-full px-3 py-2 rounded-md text-sm outline-none ${theme.input}`}
                  >
                    <option value="single">Single</option>
                    <option value="rotator">Random</option>
                  </select>
                </InputGroup>
              </div>
            </div>

            <div className="md:col-span-2 space-y-4">
              <InputGroup label="Auto Message" icon={<Type size={14} />}>
                <textarea
                  value={formData.message || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  rows={2}
                  placeholder="Halo Admin..."
                  className={`w-full pl-9 pr-3 py-2 rounded-md text-sm outline-none resize-none ${theme.input}`}
                />
              </InputGroup>

              <button
                disabled={submitting}
                className={`w-full py-2.5 rounded-md text-sm font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${editingId ? "bg-blue-600 hover:bg-blue-700" : "bg-emerald-500 hover:bg-emerald-600"}`}
              >
                {submitting ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <Save size={16} />
                )}
                {editingId ? "Update Data Rotator" : "Generate Link Rotator"}
              </button>
            </div>
          </form>
        </section>

        {/* LIST SECTION */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 px-1">
            <h3
              className={`text-[10px] font-black uppercase tracking-widest ${theme.textSub}`}
            >
              Existing Links
            </h3>
            <div className="relative w-48">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30"
                size={12}
              />
              <input
                value={searchTerm || ""}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className={`w-full pl-8 pr-3 py-1.5 rounded-md text-[11px] outline-none ${theme.input}`}
              />
            </div>
          </div>

          <div className="space-y-2 pb-10">
            {loading ? (
              <div className="py-20 flex flex-col items-center opacity-20">
                <Loader2 className="animate-spin" />
              </div>
            ) : filteredData.length > 0 ? (
              filteredData.map((item) => (
                <div
                  key={item.id}
                  className={`group flex flex-col md:flex-row md:items-center justify-between p-4 rounded-md border transition-all hover:border-emerald-500/50 ${editingId === item.id ? "border-emerald-500 bg-emerald-500/5" : theme.card}`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-9 h-9 rounded-md flex items-center justify-center bg-emerald-500/5 text-emerald-500`}
                    >
                      <MousePointerClick size={16} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-bold truncate ${theme.textMain}`}
                        >
                          {item.name}
                        </span>
                        <span className="text-[8px] px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 font-bold uppercase">
                          {item.targetType}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 opacity-60">
                        <p className="text-[10px] font-mono truncate max-w-[150px] md:max-w-xs">
                          {`${window.location.origin}/${item.shortCode}`}
                        </p>
                        <button
                          onClick={() => {
                            // Generate link secara dinamis menggunakan domain saat ini
                            const dynamicLink = `${window.location.origin}/${item.shortCode}`;
                            navigator.clipboard.writeText(dynamicLink);
                            setCopiedId(item.id);
                            setTimeout(() => setCopiedId(null), 2000);
                          }}
                          className="text-emerald-500 transition-transform active:scale-125"
                        >
                          {copiedId === item.id ? (
                            <Check size={12} />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className={
                            isDarkMode
                              ? "text-white/40 hover:text-emerald-500"
                              : "text-black/40 hover:text-emerald-500"
                          }
                        >
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6 mt-4 md:mt-0 pt-3 md:pt-0 border-t md:border-t-0">
                    <div className="text-right">
                      <p className={`text-sm font-black ${theme.textMain}`}>
                        {item.clicks}
                      </p>
                      <p className="text-[8px] uppercase font-bold opacity-40">
                        Clicks
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditClick(item)}
                        className="p-2 text-blue-500 hover:bg-blue-50/10 rounded-md transition-colors"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-red-500 hover:bg-red-50/10 rounded-md transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 border-2 border-dashed rounded-md opacity-20 text-xs font-bold uppercase">
                No links found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const InputGroup: React.FC<{
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}> = ({ label, icon, children }) => (
  <div className="w-full">
    <label className="text-[10px] uppercase font-black text-[#8696A0] ml-1 mb-1.5 block tracking-widest">
      {label}
    </label>
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8696A0]">
          {icon}
        </div>
      )}
      {children}
    </div>
  </div>
);
