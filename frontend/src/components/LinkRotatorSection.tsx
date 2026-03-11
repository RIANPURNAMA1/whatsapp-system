import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  Plus,
  Edit3,
  Trash2,
  Copy,
  Link as LinkIcon,
  RefreshCcw,
  Hash,
  Check,
  MousePointerClick,
  Trash,
  Eye,
} from "lucide-react";
import toast from "react-hot-toast";

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
  short_code: string; // Database standard
  shortCode?: string; // Fallback
  clicks: number;
  type: string;
  target_type: string; // Database standard
  targetType?: string; // Fallback
  wa_numbers: string; // Database standard
  waNumbers?: string; // Fallback
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
  const [viewingDetail, setViewingDetail] = useState<Rotator | null>(null);

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
        setWaList(
          Array.isArray(parsed) ? parsed : [{ number: rawWa, weight: 1 }],
        );
      } else {
        setWaList([{ number: String(rawWa), weight: 1 }]);
      }
    } catch {
      setWaList([{ number: String(rawWa), weight: 1 }]);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validNumbers = waList.filter((n) => n.number.trim() !== "");
    if (!formData.name || !formData.shortCode || validNumbers.length === 0)
      return toast.error("Lengkapi data!");

    setSubmitting(true);

    // PASTIKAN PAYLOAD SELALU MENGGUNAKAN SNAKE_CASE
    // Agar sesuai dengan req.body di backend POST & PUT
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
        // Gunakan payload yang sama untuk PUT
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

  const theme = {
    card: isDarkMode
      ? "bg-[#111B21] border-[#222D34]"
      : "bg-white border-gray-100 shadow-sm",
    input: isDarkMode
      ? "bg-[#202C33] text-white ring-emerald-500 border-none"
      : "bg-gray-50 border focus:bg-white",
    textMain: isDarkMode ? "text-[#E9EDEF]" : "text-gray-800",
    textSub: "text-[#8696A0]",
  };

  return (
    <div className="flex flex-col h-full font-sans">
      <header
        className={`px-6 py-4 flex items-center justify-between border-b ${isDarkMode ? "bg-[#202C33] border-[#313D45]" : "bg-[#F0F2F5] border-gray-200"}`}
      >
        <div className="flex items-center gap-3">
          <LinkIcon className="text-emerald-500" size={20} />
          <h1 className={`text-lg font-bold ${theme.textMain}`}>
            Link Rotator
          </h1>
        </div>
        <button
          onClick={fetchRotators}
          className="p-2 text-emerald-500 hover:bg-black/10 rounded-full"
        >
          <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
        </button>
      </header>

      <div className="max-w-4xl mx-auto w-full p-6 space-y-8">
        {viewingDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div
              className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl ${isDarkMode ? "bg-[#111B21] border-[#222D34]" : "bg-white border-gray-100"}`}
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2
                    className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-800"}`}
                  >
                    {viewingDetail.name}
                  </h2>
                  <p className="text-sm text-emerald-500 font-mono">
                    /r/{viewingDetail.short_code}
                  </p>
                </div>
                <button
                  onClick={() => setViewingDetail(null)}
                  className="p-2 hover:bg-black/10 rounded-full"
                >
                  <Plus className="rotate-45" size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div
                  className={`p-4 rounded-xl ${isDarkMode ? "bg-[#202C33]" : "bg-gray-50"}`}
                >
                  <p className="text-[10px] uppercase font-black text-gray-400 mb-2">
                    Statistik
                  </p>
                  <div className="flex justify-between items-center">
                    <span
                      className={isDarkMode ? "text-gray-300" : "text-gray-600"}
                    >
                      Total Klik
                    </span>
                    <span className="text-xl font-black text-emerald-500">
                      {viewingDetail.clicks}
                    </span>
                  </div>
                </div>

                <div
                  className={`p-4 rounded-xl ${isDarkMode ? "bg-[#202C33]" : "bg-gray-50"}`}
                >
                  <p className="text-[10px] uppercase font-black text-gray-400 mb-3">
                    Daftar Nomor & Bobot
                  </p>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                    {(() => {
                      try {
                        const waNumbers = JSON.parse(viewingDetail.wa_numbers);
                        return waNumbers.map((wa: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex justify-between items-center text-sm border-b border-white/5 pb-2"
                          >
                            <span
                              className={
                                isDarkMode ? "text-gray-200" : "text-gray-700"
                              }
                            >
                              {wa.number}
                            </span>
                            <span className="bg-emerald-500/20 text-emerald-500 px-2 py-0.5 rounded text-[10px] font-bold">
                              W: {wa.weight || 1}
                            </span>
                          </div>
                        ));
                      } catch (e) {
                        return (
                          <span className="text-sm italic">
                            Format nomor tidak valid
                          </span>
                        );
                      }
                    })()}
                  </div>
                </div>

                <div
                  className={`p-4 rounded-xl ${isDarkMode ? "bg-[#202C33]" : "bg-gray-50"}`}
                >
                  <p className="text-[10px] uppercase font-black text-gray-400 mb-1">
                    Pesan Custom
                  </p>
                  <p
                    className={`text-sm italic ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                  >
                    "{viewingDetail.message || "Tidak ada pesan"}"
                  </p>
                </div>
              </div>

              <button
                onClick={() => setViewingDetail(null)}
                className="w-full mt-6 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        )}
        {/* Form Section */}
        <section className={`p-6 rounded-xl border ${theme.card}`}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputGroup label="Nama Product" icon={<Hash size={14} />}>
                <input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Contoh: Promo Kaos"
                  className={`w-full pl-9 py-2.5 rounded-lg outline-none transition-all ${theme.input}`}
                />
              </InputGroup>
              <InputGroup
                label="Short URL (/r/)"
                icon={<span className="text-[10px] font-bold">/r/</span>}
              >
                <input
                  value={formData.shortCode}
                  onChange={(e) =>
                    setFormData({ ...formData, shortCode: e.target.value })
                  }
                  placeholder="custom-slug"
                  className={`w-full pl-9 py-2.5 rounded-lg outline-none transition-all ${theme.input}`}
                />
              </InputGroup>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputGroup label="Tipe Redirect">
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className={`w-full px-3 py-2.5 rounded-lg outline-none cursor-pointer ${theme.input}`}
                >
                  <option value="direct">Direct (Langsung WA)</option>
                  <option value="lander">Lander (Halaman Antara)</option>
                </select>
              </InputGroup>
              <InputGroup label="Mode Rotasi">
                <select
                  value={formData.targetType}
                  onChange={(e) =>
                    setFormData({ ...formData, targetType: e.target.value })
                  }
                  className={`w-full px-3 py-2.5 rounded-lg outline-none cursor-pointer ${theme.input}`}
                >
                  <option value="single">Single (Satu Nomor)</option>
                  <option value="rotator">Rotator (Banyak Nomor)</option>
                </select>
              </InputGroup>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] uppercase font-black text-[#8696A0] tracking-widest">
                Daftar Nomor WhatsApp
              </label>
              {waList.map((item, index) => (
                <div
                  key={index}
                  className="flex gap-2 animate-in fade-in slide-in-from-top-1"
                >
                  <input
                    value={item.number}
                    onChange={(e) =>
                      updateWaField(index, "number", e.target.value)
                    }
                    placeholder="62812345678"
                    className={`flex-1 px-4 py-2.5 rounded-lg outline-none ${theme.input}`}
                  />
                  {formData.targetType === "rotator" && (
                    <input
                      type="number"
                      value={item.weight}
                      onChange={(e) =>
                        updateWaField(
                          index,
                          "weight",
                          parseInt(e.target.value) || 1,
                        )
                      }
                      className={`w-20 px-2 py-2.5 rounded-lg text-center outline-none ${theme.input}`}
                      title="Bobot (Weight)"
                    />
                  )}
                  {waList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeWaField(index)}
                      className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"
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
                  className="flex items-center gap-2 text-xs font-bold text-emerald-500 hover:underline"
                >
                  <Plus size={14} /> Tambah Nomor Baru
                </button>
              )}
            </div>

            <InputGroup label="Pesan WhatsApp (Custom Message)">
              <textarea
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                placeholder="Halo Admin, saya tertarik dengan..."
                className={`w-full p-3 rounded-lg outline-none resize-none ${theme.input}`}
                rows={3}
              />
            </InputGroup>

            <div className="flex gap-3">
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-3 border border-gray-300 rounded-lg font-bold hover:bg-gray-100 transition-colors"
                >
                  Batal
                </button>
              )}
              <button
                disabled={submitting}
                className="flex-[2] py-3 bg-emerald-500 text-white font-bold rounded-lg hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
              >
                {submitting
                  ? "Memproses..."
                  : editingId
                    ? "Update Link Rotator"
                    : "Buat Link Rotator"}
              </button>
            </div>
          </form>
        </section>

        {/* Search & List Section */}
        <div className="space-y-4">
          <div className="relative">
            <input
              placeholder="Cari link atau produk..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 rounded-xl border outline-none ${theme.card}`}
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <Plus className="rotate-45" size={18} />
            </div>
          </div>

          {filteredData.map((item) => {
            const currentSlug = item.short_code || item.shortCode || "";
            const displayLink = `https://links.satupintu.mendunia.id/r/${currentSlug}`;

            return (
              <div
                key={item.id}
                className={`p-5 rounded-xl border flex items-center justify-between transition-all hover:scale-[1.01] ${theme.card}`}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/10 rounded-full text-emerald-500">
                    <MousePointerClick size={22} />
                  </div>
                  <div>
                    <p className={`font-bold text-lg ${theme.textMain}`}>
                      {item.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-emerald-500 font-medium mt-1">
                      <span className="opacity-70">{displayLink}</span>
                      <button
                        className="hover:text-emerald-600 active:scale-90 transition-transform"
                        onClick={() => {
                          navigator.clipboard.writeText(displayLink);
                          setCopiedId(item.id);
                          setTimeout(() => setCopiedId(null), 2000);
                        }}
                      >
                        {copiedId === item.id ? (
                          <Check size={14} />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className={`font-black text-xl ${theme.textMain}`}>
                      {item.clicks}
                    </p>
                    <p className="text-[9px] font-bold tracking-tighter opacity-50 uppercase">
                      Klik Total
                    </p>
                  </div>
                  <div className="h-10 w-[1px] bg-gray-200 dark:bg-gray-800" />
                  <div className="flex gap-2">
                    {/* Tombol Detail Baru */}
                    <button
                      onClick={() => setViewingDetail(item)}
                      className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors"
                      title="Lihat Detail"
                    >
                      <Eye size={18} />
                    </button>

                    <button
                      onClick={() => handleEditClick(item)}
                      className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                    >
                      <Edit3 size={18} />
                    </button>

                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
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
    <label className="text-[10px] uppercase font-black text-[#8696A0] mb-1.5 block tracking-widest px-1">
      {label}
    </label>
    <div className="relative group">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8696A0] group-focus-within:text-emerald-500 transition-colors">
          {icon}
        </div>
      )}
      {children}
    </div>
  </div>
);
