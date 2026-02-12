import React, { useState } from "react";
import { X, Tag, Check, Plus } from "lucide-react";
import toast from "react-hot-toast";

interface LabelModalProps {
  sessionId: string;
  chatJid: string;
  currentLabels: any[];
  allLabels: any[];
  onClose: () => void;
  onSuccess: () => void;
}

const LabelModal: React.FC<LabelModalProps> = ({
  sessionId,
  chatJid,
  currentLabels,
  allLabels,
  onClose,
  onSuccess,
}) => {
  const [selectedLabels, setSelectedLabels] = useState<number[]>(
    currentLabels.map((l) => l.id)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleLabel = (labelId: number) => {
    setSelectedLabels((prev) =>
      prev.includes(labelId)
        ? prev.filter((id) => id !== labelId)
        : [...prev, labelId]
    );
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const currentIds = currentLabels.map((l) => l.id);
      const toAdd = selectedLabels.filter((id) => !currentIds.includes(id));
      const toRemove = currentIds.filter((id) => !selectedLabels.includes(id));

      // Add new labels
      for (const labelId of toAdd) {
        await fetch(`${import.meta.env.VITE_API_URL}/sessions/${sessionId}/chats/${encodeURIComponent(chatJid)}/labels`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ labelId }),
        });
      }

      // Remove labels
      for (const labelId of toRemove) {
        await fetch(
          `${import.meta.env.VITE_API_URL}/sessions/${sessionId}/chats/${encodeURIComponent(chatJid)}/labels/${labelId}`,
          { method: "DELETE" }
        );
      }

      toast.success("Label berhasil diperbarui");
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Gagal memperbarui label");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#202C33] rounded-2xl shadow-2xl w-full max-w-md border border-[#3b4a54] overflow-hidden animate-in fade-in zoom-in duration-200">
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
                Tambah atau hapus label untuk chat ini
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

        {/* Label List */}
        <div className="p-6 max-h-[400px] overflow-y-auto custom-scrollbar">
          {allLabels.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-[#111B21] rounded-full flex items-center justify-center mx-auto mb-4">
                <Tag className="w-8 h-8 text-[#3b4a54]" />
              </div>
              <p className="text-[#8696A0] text-sm mb-4">
                Belum ada label. Buat label baru dari menu "Kelola Label"
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {allLabels.map((label) => {
                const isSelected = selectedLabels.includes(label.id);
                return (
                  <button
                    key={label.id}
                    onClick={() => toggleLabel(label.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                      isSelected
                        ? "bg-[#00a884]/10 ring-2 ring-[#00a884]"
                        : "bg-[#111B21] hover:bg-[#2A3942]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${label.color}20` }}
                      >
                        <Tag
                          className="w-5 h-5"
                          style={{ color: label.color }}
                        />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-[#E9EDEF]">
                          {label.name}
                        </p>
                        {label.description && (
                          <p className="text-xs text-[#8696A0] mt-0.5">
                            {label.description}
                          </p>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 bg-[#00a884] rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#3b4a54]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[#8696A0] hover:text-[#E9EDEF] transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
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
                <Check className="w-4 h-4" />
                Simpan
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LabelModal;