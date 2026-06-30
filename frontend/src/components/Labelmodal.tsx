import React, { useState, useEffect } from "react";
import { X, Tag, Check, Loader2 } from "lucide-react";
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
  const [selectedLabels, setSelectedLabels] = useState<string[]>(
    currentLabels.map((l) => String(l.wa_label_id))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ KUNCI: Setiap kali modal dibuka untuk chat berbeda, reset state
  // Ini yang menyebabkan label lama tidak terbawa ke chat baru
  useEffect(() => {
    setSelectedLabels(currentLabels.map((l) => String(l.wa_label_id)));
  }, [chatJid, currentLabels]);

  const toggleLabel = (waLabelId: string) => {
    setSelectedLabels((prev) =>
      prev.includes(waLabelId)
        ? prev.filter((id) => id !== waLabelId)
        : [...prev, waLabelId]
    );
  };

  // Label yang dipilih — untuk tampil sebagai badge
  const selectedLabelData = allLabels.filter((l) =>
    selectedLabels.includes(String(l.wa_label_id))
  );

  const handleSave = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const baseApi = import.meta.env.VITE_API_URL.replace(/\/$/, "");
      const cleanJid = encodeURIComponent(chatJid);

      const response = await fetch(
        `${baseApi}/sessions/${sessionId}/chats/${cleanJid}/labels`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ labelIds: selectedLabels }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || "Gagal sinkron ke WhatsApp");
      }

      toast.success("WhatsApp Berhasil Diperbarui!");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E4E6EB]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#E7F3FF] rounded-lg">
              <Tag className="w-5 h-5 text-[#0866FF]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#050505]">Label Chat</h2>
              <p className="text-[10px] text-[#65676B] font-mono mt-0.5">{chatJid}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#F2F3F5] rounded-full transition-colors">
            <X className="w-5 h-5 text-[#65676B]" />
          </button>
        </div>

        {/* ✅ Badge label yang sudah dipilih */}
        {selectedLabelData.length > 0 && (
          <div className="px-4 py-3 bg-[#F7F8FA] border-b border-[#E4E6EB]">
            <p className="text-[10px] text-[#65676B] uppercase tracking-wider mb-2">
              Label Dipilih ({selectedLabelData.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedLabelData.map((label) => (
                <span
                  key={label.wa_label_id}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-[#050505]"
                  style={{
                    backgroundColor: (label.color || "#8C939D") + "1A",
                    border: `1px solid ${label.color || "#8C939D"}`,
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: label.color || "#8C939D" }}
                  />
                  {label.name}
                  <button
                    onClick={() => toggleLabel(String(label.wa_label_id))}
                    className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ✅ Daftar semua label — yang sudah dipilih otomatis terceklis */}
        <div className="p-4 max-h-[350px] overflow-y-auto custom-scrollbar bg-white">
          {allLabels.length === 0 ? (
            <div className="text-center py-12">
              <Tag className="w-12 h-12 text-[#E4E6EB] mx-auto mb-3" />
              <p className="text-[#65676B] text-sm">Belum ada label dibuat</p>
            </div>
          ) : (
            <div className="grid gap-2">
              {allLabels.map((label) => {
                const isSelected = selectedLabels.includes(String(label.wa_label_id));
                return (
                  <button
                    key={label.wa_label_id}
                    onClick={() => toggleLabel(String(label.wa_label_id))}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all border ${
                      isSelected
                        ? "bg-[#E7F3FF] border-[#0866FF]/40"
                        : "bg-white border-[#E4E6EB] hover:border-[#0866FF]/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3.5 h-3.5 rounded-full shadow-inner"
                        style={{ backgroundColor: label.color || "#8C939D" }}
                      />
                      <span className="text-sm font-medium text-[#050505]">{label.name}</span>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                        isSelected
                          ? "bg-[#0866FF] border-[#0866FF] scale-110"
                          : "border-[#8C939D] bg-transparent"
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[4]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-[#E4E6EB] bg-[#F7F8FA]">
          <span className="text-xs text-[#65676B]">
            {selectedLabels.length > 0
              ? `${selectedLabels.length} label dipilih`
              : "Belum ada label dipilih"}
          </span>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="text-sm font-medium text-[#65676B] hover:text-[#050505] px-4 py-2 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className="px-8 py-2.5 bg-[#0866FF] hover:bg-[#1a74ff] text-white rounded-lg text-sm font-bold disabled:opacity-50 flex items-center gap-2 shadow-lg transition-all active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabelModal;