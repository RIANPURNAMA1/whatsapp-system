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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#202C33] rounded-2xl shadow-2xl w-full max-w-md border border-[#3b4a54] overflow-hidden animate-in fade-in zoom-in duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#3b4a54] bg-[#2a3942]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#00a884]/10 rounded-lg">
              <Tag className="w-5 h-5 text-[#00a884]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#E9EDEF]">Label Chat</h2>
              <p className="text-[10px] text-[#8696A0] font-mono mt-0.5">{chatJid}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#374248] rounded-full transition-colors">
            <X className="w-5 h-5 text-[#8696A0]" />
          </button>
        </div>

        {/* ✅ Badge label yang sudah dipilih */}
        {selectedLabelData.length > 0 && (
          <div className="px-4 py-3 bg-[#1a2530] border-b border-[#3b4a54]">
            <p className="text-[10px] text-[#8696A0] uppercase tracking-wider mb-2">
              Label Dipilih ({selectedLabelData.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedLabelData.map((label) => (
                <span
                  key={label.wa_label_id}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-[#E9EDEF]"
                  style={{
                    backgroundColor: (label.color || "#8696A0") + "33",
                    border: `1px solid ${label.color || "#8696A0"}`,
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: label.color || "#8696A0" }}
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
        <div className="p-4 max-h-[350px] overflow-y-auto custom-scrollbar bg-[#111B21]">
          {allLabels.length === 0 ? (
            <div className="text-center py-12">
              <Tag className="w-12 h-12 text-[#3b4a54] mx-auto mb-3 opacity-20" />
              <p className="text-[#8696A0] text-sm">Belum ada label dibuat</p>
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
                        ? "bg-[#00a884]/10 border-[#00a884]/40"
                        : "bg-[#202C33] border-transparent hover:border-[#3b4a54]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3.5 h-3.5 rounded-full shadow-inner"
                        style={{ backgroundColor: label.color || "#8696A0" }}
                      />
                      <span className="text-sm font-medium text-[#E9EDEF]">{label.name}</span>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                        isSelected
                          ? "bg-[#00a884] border-[#00a884] scale-110"
                          : "border-[#8696A0] bg-transparent"
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#111B21] stroke-[4]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-[#3b4a54] bg-[#2a3942]">
          <span className="text-xs text-[#8696A0]">
            {selectedLabels.length > 0
              ? `${selectedLabels.length} label dipilih`
              : "Belum ada label dipilih"}
          </span>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="text-sm font-medium text-[#8696A0] hover:text-[#E9EDEF] px-4 py-2 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className="px-8 py-2.5 bg-[#00a884] hover:bg-[#06cf9c] text-[#111B21] rounded-lg text-sm font-bold disabled:opacity-50 flex items-center gap-2 shadow-lg transition-all active:scale-95"
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