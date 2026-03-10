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
  MousePointerClick,
  X,
  Trash,
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
  short_code?: string;
  shortCode?: string;
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
      targetType: item.targetType || "single",
      message: item.message || "",
    });

    try {
      const parsed = JSON.parse(item.waNumbers);
      setWaList(
        Array.isArray(parsed)
          ? parsed
          : [{ number: item.waNumbers, weight: 1 }],
      );
    } catch {
      setWaList([{ number: item.waNumbers, weight: 1 }]);
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
    const payload = {
      ...formData,
      waNumbers: JSON.stringify(
        formData.targetType === "single" ? [waList[0]] : validNumbers,
      ),
    };

    try {
      editingId
        ? await api.put(`/rotators/${editingId}`, payload)
        : await api.post("/rotators", payload);
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
      ? "bg-[#202C33] text-white ring-emerald-500"
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
        <button onClick={fetchRotators} className="p-2">
          <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
        </button>
      </header>

      <div className="max-w-4xl mx-auto w-full p-6 space-y-8">
        {/* Form Section */}
        <section className={`p-5 rounded-md border ${theme.card}`}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <InputGroup label="Nama Product" icon={<Hash size={14} />}>
                <input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className={`w-full pl-9 py-2 rounded-md ${theme.input}`}
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
                  className={`w-full pl-9 py-2 rounded-md ${theme.input}`}
                />
              </InputGroup>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <InputGroup label="Tipe">
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className={`w-full py-2 rounded-md ${theme.input}`}
                >
                  <option value="direct">Direct</option>
                  <option value="lander">Lander</option>
                </select>
              </InputGroup>
              <InputGroup label="Target">
                <select
                  value={formData.targetType}
                  onChange={(e) =>
                    setFormData({ ...formData, targetType: e.target.value })
                  }
                  className={`w-full py-2 rounded-md ${theme.input}`}
                >
                  <option value="single">Single</option>
                  <option value="rotator">Rotator</option>
                </select>
              </InputGroup>
            </div>

            {/* WA List Logic */}
            {waList.map((item, index) => (
              <div key={index} className="flex gap-2">
                <input
                  value={item.number}
                  onChange={(e) =>
                    updateWaField(index, "number", e.target.value)
                  }
                  placeholder="628..."
                  className={`flex-1 p-2 rounded-md ${theme.input}`}
                />
                {formData.targetType === "rotator" && (
                  <input
                    type="number"
                    value={item.weight}
                    onChange={(e) =>
                      updateWaField(index, "weight", e.target.value)
                    }
                    className={`w-20 p-2 rounded-md text-center ${theme.input}`}
                  />
                )}
                {waList.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeWaField(index)}
                    className="text-red-500"
                  >
                    <Trash size={16} />
                  </button>
                )}
              </div>
            ))}
            {formData.targetType === "rotator" && (
              <button
                type="button"
                onClick={addWaField}
                className="text-xs text-emerald-500"
              >
                + Tambah Nomor
              </button>
            )}

            <InputGroup label="Message">
              <textarea
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                className={`w-full p-2 rounded-md ${theme.input}`}
                rows={3}
              />
            </InputGroup>

            <button
              disabled={submitting}
              className="w-full py-3 bg-emerald-500 text-white font-bold rounded-md hover:bg-emerald-600"
            >
              {submitting ? "Menyimpan..." : "Simpan Link Rotator"}
            </button>
          </form>
        </section>

        {/* List Section */}
        <div className="space-y-4">
          {filteredData.map((item) => {
            const currentSlug = item.short_code || item.shortCode || "";
            // PERBAIKAN: Gunakan domain links.satupintu.mendunia.id
            const displayLink = `https://links.satupintu.mendunia.id/r/${currentSlug}`;

            return (
              <div
                key={item.id}
                className={`p-4 rounded-md border flex items-center justify-between ${theme.card}`}
              >
                <div className="flex items-center gap-4">
                  <MousePointerClick size={20} className="text-emerald-500" />
                  <div>
                    <p className={`font-bold ${theme.textMain}`}>{item.name}</p>
                    <div className="flex items-center gap-2 opacity-60 text-xs">
                      <p>{displayLink}</p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(displayLink);
                          setCopiedId(item.id);
                          setTimeout(() => setCopiedId(null), 2000);
                        }}
                      >
                        {copiedId === item.id ? (
                          <Check size={12} />
                        ) : (
                          <Copy size={12} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-black text-sm">{item.clicks}</p>
                    <p className="text-[10px] opacity-40">CLICKS</p>
                  </div>
                  <button
                    onClick={() => handleEditClick(item)}
                    className="text-blue-500"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
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
    <label className="text-[10px] uppercase font-black text-[#8696A0] mb-1 block tracking-widest">
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
