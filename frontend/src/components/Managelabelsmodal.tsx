import React, { useState } from "react";
import { X, Plus, Edit2, Save, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface ManageLabelsModalProps {
  sessionId: string;
  labels: any[];
  onClose: () => void;
  onSuccess: () => void;
}

const LABEL_COLORS = [
  "#25D366", "#ef4444", "#f59e0b", "#3b82f6", "#8b5cf6", 
  "#ec4899", "#06b6d4", "#f97316", "#94A3B8", "#53bdeb"
];

const ManageLabelsModal: React.FC<ManageLabelsModalProps> = ({
  sessionId,
  labels,
  onClose,
  onSuccess,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    color: "#25D366",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pastikan API_URL tidak berakhiran slash
  const API_URL = import.meta.env.VITE_API_URL.replace(/\/$/, "");

  const handleEdit = (label: any) => {
    setIsCreating(false);
    setEditingId(label.wa_label_id);
    setFormData({
      name: label.name,
      color: label.color || "#25D366",
    });
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) return toast.error("Nama label wajib diisi");

    setIsSubmitting(true);
    try {
      // Jika Backend kamu menggunakan struktur router.post("/sessions/:sessionId/labels")
      // untuk tambah DAN router.put untuk update, pastikan endpointnya cocok.
      const url = isCreating 
        ? `${API_URL}/sessions/${sessionId}/labels`
        : `${API_URL}/sessions/${sessionId}/labels/${editingId}`;
      
      const response = await fetch(url, {
        method: isCreating ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          color: formData.color
        }),
      });

      // Jika response 500, kita tangkap detailnya di sini
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Server Error (500)" }));
        throw new Error(errorData.message || `Error ${response.status}`);
      }

      const data = await response.json();
      
      toast.success(isCreating ? "Instruksi buat label terkirim" : "Label diperbarui");
      
      // Reset State
      setIsCreating(false);
      setEditingId(null);
      setFormData({ name: "", color: "#25D366" });
      
      // Beri waktu delay sedikit agar DB backend sempat terupdate oleh listener labels.edit
      setTimeout(() => {
        onSuccess();
      }, 1000);

    } catch (err: any) {
      console.error("Submit Error:", err);
      toast.error(err.message || "Gagal memproses label");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#202C33] rounded-2xl shadow-2xl w-full max-w-md border border-[#3b4a54] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#3b4a54] bg-[#2a3942]">
          <h2 className="text-lg font-medium text-[#E9EDEF]">Kelola Label WhatsApp</h2>
          <button onClick={onClose} className="p-1 hover:bg-[#374248] rounded-full transition-colors">
            <X className="w-6 h-6 text-[#8696A0]" />
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar space-y-4">
          {/* Form Input (Tambah/Edit) */}
          {(isCreating || editingId) && (
            <div className="bg-[#111B21] p-4 rounded-xl border border-[#00a884]/30 space-y-4 animate-in fade-in duration-200">
              <div className="space-y-2">
                <label className="text-xs text-[#8696A0] uppercase tracking-wider">Nama Label</label>
                <input
                  type="text"
                  placeholder="Contoh: Pelanggan Baru"
                  className="w-full bg-[#2a3942] border border-[#3b4a54] focus:border-[#00a884] rounded-lg p-2.5 text-[#E9EDEF] outline-none transition-all"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-[#8696A0] uppercase tracking-wider">Warna Label</label>
                <div className="flex flex-wrap gap-2">
                  {LABEL_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFormData({...formData, color: c})}
                      className={`w-8 h-8 rounded-full border-2 transition-transform active:scale-90 ${formData.color === c ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-70 hover:opacity-100'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  onClick={handleSubmit} 
                  disabled={isSubmitting} 
                  className="flex-1 bg-[#00a884] hover:bg-[#06cf9c] disabled:opacity-50 text-[#111B21] py-2.5 rounded-lg font-bold flex justify-center items-center gap-2 transition-colors"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 
                  {editingId ? "Simpan Perubahan" : "Buat Label"}
                </button>
                <button 
                  onClick={() => {setIsCreating(false); setEditingId(null);}} 
                  className="flex-1 bg-[#374248] hover:bg-[#4a555c] text-white py-2.5 rounded-lg transition-colors"
                >
                  Batal
                </button>
              </div>
            </div>
          )}

          {/* Tombol Tambah Utama */}
          {!isCreating && !editingId && (
            <button 
              onClick={() => {
                setIsCreating(true); 
                setFormData({name:"", color:"#00a884"});
              }} 
              className="w-full py-3 border-2 border-dashed border-[#3b4a54] hover:border-[#00a884] rounded-xl text-[#8696A0] hover:text-[#00a884] flex items-center justify-center gap-2 transition-all group"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" /> Tambah Label Baru
            </button>
          )}

          {/* List Label yang Ada */}
          <div className="space-y-2">
            <h3 className="text-xs text-[#8696A0] uppercase tracking-wider px-1">Daftar Label Aktif</h3>
            {labels.length === 0 ? (
              <div className="text-center py-8 text-[#8696A0] text-sm italic">Belum ada label di WhatsApp ini</div>
            ) : (
              labels.map((label) => (
                <div key={label.wa_label_id} className="flex items-center justify-between p-3 rounded-xl bg-[#111B21] border border-[#2a3942] hover:border-[#3b4a54] transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: label.color || "#8696A0" }} />
                    <span className="text-[#E9EDEF] text-sm font-medium">{label.name}</span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleEdit(label)} 
                      className="p-2 text-[#8696A0] hover:text-[#00a884] hover:bg-[#2a3942] rounded-lg transition-all"
                      title="Edit Nama"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageLabelsModal;