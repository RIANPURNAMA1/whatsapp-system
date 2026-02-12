import React, { useState } from "react";
import {
  X,
  Tag,
  Plus,
  Trash2,
  Edit2,
  Save,
  Flame,
  Clock,
  UserCheck,
  Target,
  Crown,
  Star,
  Heart,
  Zap,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import toast from "react-hot-toast";

interface ManageLabelsModalProps {
  sessionId: string;
  labels: any[];
  onClose: () => void;
  onSuccess: () => void;
}

const LABEL_COLORS = [
  "#ef4444", // red
  "#f59e0b", // amber
  "#10b981", // emerald
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
  "#f97316", // orange
  "#6366f1", // indigo
];

const LABEL_ICONS = [
  { icon: Tag, name: "tag" },
  { icon: Flame, name: "flame" },
  { icon: Clock, name: "clock" },
  { icon: UserCheck, name: "user-check" },
  { icon: Target, name: "target" },
  { icon: Crown, name: "crown" },
  { icon: Star, name: "star" },
  { icon: Heart, name: "heart" },
  { icon: Zap, name: "zap" },
  { icon: AlertCircle, name: "alert-circle" },
  { icon: CheckCircle, name: "check-circle" },
];

const ManageLabelsModal: React.FC<ManageLabelsModalProps> = ({
  sessionId,
  labels,
  onClose,
  onSuccess,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    color: "#00a884",
    icon: "tag",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = () => {
    setIsCreating(true);
    setEditingId(null);
    setFormData({
      name: "",
      color: "#00a884",
      icon: "tag",
      description: "",
    });
  };

  const handleEdit = (label: any) => {
    setIsCreating(false);
    setEditingId(label.id);
    setFormData({
      name: label.name,
      color: label.color,
      icon: label.icon,
      description: label.description || "",
    });
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
    setFormData({
      name: "",
      color: "#00a884",
      icon: "tag",
      description: "",
    });
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Nama label wajib diisi");
      return;
    }

    setIsSubmitting(true);
    try {
      let response;
      
      if (isCreating) {
        // Create new label
        response = await fetch(`${import.meta.env.VITE_API_URL}/sessions/${sessionId}/labels`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      } else if (editingId) {
        // Update existing label
        response = await fetch(
          `${import.meta.env.VITE_API_URL}/sessions/${sessionId}/labels/${editingId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
          }
        );
      }

      if (!response) {
        throw new Error("No response from server");
      }

      if (!response.ok) {
        const text = await response.text();
        let errorMsg = "Terjadi kesalahan";
        try {
          const data = JSON.parse(text);
          errorMsg = data.message || errorMsg;
        } catch (e) {
          console.error("Failed to parse error response:", text);
          errorMsg = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMsg);
      }

      const text = await response.text();
      if (!text) {
        throw new Error("Empty response from server");
      }

      const data = JSON.parse(text);
      
      if (!data.success) {
        throw new Error(data.message || "Operation failed");
      }

      toast.success(
        isCreating ? "Label berhasil dibuat" : "Label berhasil diperbarui"
      );
      handleCancel();
      onSuccess();
    } catch (err: any) {
      console.error("Error saving label:", err);
      toast.error(err.message || "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (labelId: number) => {
    if (!confirm("Yakin ingin menghapus label ini?")) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/sessions/${sessionId}/labels/${labelId}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const text = await response.text();
        let errorMsg = "Gagal menghapus label";
        try {
          const data = JSON.parse(text);
          errorMsg = data.message || errorMsg;
        } catch (e) {
          console.error("Failed to parse error response:", text);
          errorMsg = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMsg);
      }

      const text = await response.text();
      if (!text) {
        throw new Error("Empty response from server");
      }

      const data = JSON.parse(text);
      
      if (!data.success) {
        throw new Error(data.message || "Failed to delete label");
      }

      toast.success("Label berhasil dihapus");
      onSuccess();
    } catch (err: any) {
      console.error("Error deleting label:", err);
      toast.error(err.message || "Gagal menghapus label");
    }
  };

  const SelectedIcon =
    LABEL_ICONS.find((i) => i.name === formData.icon)?.icon || Tag;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#202C33] rounded-2xl shadow-2xl w-full max-w-2xl border border-[#3b4a54] overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#3b4a54]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#00a884]/10 rounded-lg">
              <Tag className="w-5 h-5 text-[#00a884]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#E9EDEF]">
                Kelola Label
              </h2>
              <p className="text-xs text-[#8696A0] mt-0.5">
                Buat, edit, atau hapus label untuk mengorganisir chat
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#374248] rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-[#8696A0]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[500px] overflow-y-auto custom-scrollbar">
          {/* Create/Edit Form */}
          {(isCreating || editingId) && (
            <div className="mb-6 p-4 bg-[#111B21] rounded-xl border border-[#3b4a54]">
              <h3 className="text-sm font-semibold text-[#E9EDEF] mb-4">
                {isCreating ? "Buat Label Baru" : "Edit Label"}
              </h3>

              <div className="space-y-4">
                {/* Name Input */}
                <div>
                  <label className="block text-xs font-medium text-[#8696A0] mb-2">
                    Nama Label
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Contoh: Hot Lead, Follow Up, VIP"
                    className="w-full px-3 py-2 bg-[#202C33] text-[#E9EDEF] text-sm rounded-lg border border-[#3b4a54] focus:border-[#00a884] focus:outline-none transition-colors"
                  />
                </div>

                {/* Description Input */}
                <div>
                  <label className="block text-xs font-medium text-[#8696A0] mb-2">
                    Deskripsi (opsional)
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Deskripsi singkat untuk label ini"
                    className="w-full px-3 py-2 bg-[#202C33] text-[#E9EDEF] text-sm rounded-lg border border-[#3b4a54] focus:border-[#00a884] focus:outline-none transition-colors"
                  />
                </div>

                {/* Color Picker */}
                <div>
                  <label className="block text-xs font-medium text-[#8696A0] mb-2">
                    Warna
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {LABEL_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setFormData({ ...formData, color })}
                        className={`w-10 h-10 rounded-lg transition-all ${
                          formData.color === color
                            ? "ring-2 ring-white ring-offset-2 ring-offset-[#111B21] scale-110"
                            : "hover:scale-105"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Icon Picker */}
                <div>
                  <label className="block text-xs font-medium text-[#8696A0] mb-2">
                    Ikon
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {LABEL_ICONS.map(({ icon: Icon, name }) => (
                      <button
                        key={name}
                        onClick={() => setFormData({ ...formData, icon: name })}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                          formData.icon === name
                            ? "bg-[#00a884] text-white"
                            : "bg-[#202C33] text-[#8696A0] hover:bg-[#2A3942]"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <div>
                  <label className="block text-xs font-medium text-[#8696A0] mb-2">
                    Preview
                  </label>
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
                      style={{ backgroundColor: formData.color }}
                    >
                      <SelectedIcon className="w-4 h-4" />
                      {formData.name || "Nama Label"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-[#3b4a54]">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm font-medium text-[#8696A0] hover:text-[#E9EDEF] transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-[#00a884] text-white rounded-lg text-sm font-medium hover:bg-[#00a884]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Simpan
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Create Button */}
          {!isCreating && !editingId && (
            <button
              onClick={handleCreate}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#00a884] text-white rounded-xl font-medium hover:bg-[#00a884]/90 transition-colors mb-6"
            >
              <Plus className="w-5 h-5" />
              Buat Label Baru
            </button>
          )}

          {/* Existing Labels */}
          <div className="space-y-2">
            {labels.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-[#111B21] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Tag className="w-8 h-8 text-[#3b4a54]" />
                </div>
                <p className="text-[#8696A0] text-sm">
                  Belum ada label. Klik tombol di atas untuk membuat label baru.
                </p>
              </div>
            ) : (
              labels.map((label) => {
                const IconComponent =
                  LABEL_ICONS.find((i) => i.name === label.icon)?.icon || Tag;
                return (
                  <div
                    key={label.id}
                    className="flex items-center justify-between p-4 bg-[#111B21] rounded-xl border border-[#3b4a54] hover:border-[#00a884]/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${label.color}20` }}
                      >
                        <IconComponent
                          className="w-6 h-6"
                          style={{ color: label.color }}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#E9EDEF]">
                          {label.name}
                        </p>
                        {label.description && (
                          <p className="text-xs text-[#8696A0] mt-0.5">
                            {label.description}
                          </p>
                        )}
                        <p className="text-xs text-[#8696A0] mt-1">
                          {label.chat_count || 0} chat
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(label)}
                        className="p-2 hover:bg-[#374248] rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4 text-[#8696A0]" />
                      </button>
                      <button
                        onClick={() => handleDelete(label.id)}
                        className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-[#3b4a54]">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#111B21] text-[#E9EDEF] rounded-lg text-sm font-medium hover:bg-[#2A3942] transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManageLabelsModal;