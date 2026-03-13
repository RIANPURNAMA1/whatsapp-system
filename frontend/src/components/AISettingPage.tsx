import React, { useState, useEffect } from "react";
import { 
  Bot, Save, ShieldCheck, Timer, 
  Database, BookOpen, Zap, AlertCircle, Loader2, RefreshCw
} from "lucide-react";
import toast from "react-hot-toast";

// --- INTERFACES ---
interface Session {
  id: string;
  name?: string;
  status: string;
}

const AISettingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"materi" | "antiban">("materi");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchSessions, setIsFetchSessions] = useState(false);
  
  const [activeSessions, setActiveSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");

  const [formData, setFormData] = useState({
    botName: "",
    prompt: "", 
    knowledgeBase: "", 
    minDelay: 5,
    maxDelay: 15,
    maxMessagesPerDay: 200,
  });

  // --- 1. FETCH DAFTAR SESSIONS DARI BACKEND ---
  const fetchAvailableSessions = async () => {
    setIsFetchSessions(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/sessions`, {
        headers: { 
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });
      const result = await response.json();
      
      if (result.success) {
        setActiveSessions(result.data || []);
      } else {
        toast.error("Gagal mengambil daftar device");
      }
    } catch (error) {
      console.error("Fetch Sessions Error:", error);
      toast.error("Koneksi ke server terputus");
    } finally {
      setIsFetchSessions(false);
    }
  };

  useEffect(() => {
    fetchAvailableSessions();
  }, []);

  // --- 2. LOAD DETAIL SETTINGS SAAT SESSION DIPILIH ---
  useEffect(() => {
    if (selectedSessionId) {
      loadSettings(selectedSessionId);
    }
  }, [selectedSessionId]);

  const loadSettings = async (sessionId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/ai-settings/${sessionId}`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      const result = await response.json();
      
      if (result.success && result.data) {
        setFormData({
          botName: result.data.bot_name || "",
          prompt: result.data.prompt || "",
          knowledgeBase: result.data.knowledge_base || "",
          minDelay: result.data.min_delay || 5,
          maxDelay: result.data.max_delay || 15,
          maxMessagesPerDay: result.data.max_messages_per_day || 200,
        });
      } else {
        // Reset jika data belum ada di DB untuk session ini
        setFormData({
          botName: "", prompt: "", knowledgeBase: "",
          minDelay: 5, maxDelay: 15, maxMessagesPerDay: 200
        });
      }
    } catch (error) {
      toast.error("Gagal mengambil konfigurasi AI");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // --- 3. HANDLE SAVE ---
  const handleSave = async () => {
    if (!selectedSessionId) return toast.error("Pilih nomor WA dulu");
    setIsSaving(true);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/ai-settings/save`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ sessionId: selectedSessionId, ...formData }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success("Konfigurasi AI Berhasil Disimpan!");
      } else {
        toast.error(result.message || "Gagal menyimpan");
      }
    } catch (e) {
      toast.error("Gagal koneksi ke server");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 bg-[#0B141A] min-h-screen text-[#E9EDEF] font-sans">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2 text-white">
            <Bot className="text-emerald-400" /> Konfigurasi Auto-Reply AI
          </h1>
          <p className="text-[#8696A0] text-xs">Atur kecerdasan buatan untuk nomor WhatsApp Anda.</p>
        </div>

        <button
          onClick={handleSave}
          disabled={!selectedSessionId || isSaving || isLoading}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-md font-bold transition-all disabled:opacity-30"
        >
          {isSaving ? <><Loader2 className="animate-spin" size={18} /> Menyimpan...</> : <><Save size={18} /> Simpan Perubahan</>}
        </button>
      </div>

      {/* PILIH NOMOR */}
      <div className="bg-[#111B21] p-4 rounded-lg border border-[#313D45] mb-6">
        <div className="flex justify-between items-center mb-3">
            <label className="text-[10px] uppercase tracking-widest text-[#8696A0] font-bold">Pilih Perangkat Aktif</label>
            <button onClick={fetchAvailableSessions} className="text-[#8696A0] hover:text-white transition-colors">
                <RefreshCw size={14} className={isFetchSessions ? "animate-spin" : ""} />
            </button>
        </div>
        
        <div className="flex gap-3 flex-wrap">
          {activeSessions.length > 0 ? (
            activeSessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSessionId(s.id)}
                  className={`px-4 py-2 rounded border text-sm transition-all flex items-center gap-2 ${
                    selectedSessionId === s.id 
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-400" 
                    : "border-[#313D45] bg-[#202C33] text-[#8696A0] hover:border-[#414c55]"
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${s.status === 'connected' ? 'bg-emerald-500' : 'bg-orange-500'}`}></div>
                  {s.name || s.id}
                </button>
              ))
          ) : (
            <p className="text-xs text-[#8696A0] italic">Tidak ada device ditemukan...</p>
          )}
        </div>
      </div>

      {selectedSessionId ? (
        <div className={`space-y-6 transition-all duration-300 ${isLoading ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
          {/* TABS */}
          <div className="flex gap-4 border-b border-[#313D45]">
            <button 
              onClick={() => setActiveTab("materi")}
              className={`pb-3 text-sm font-bold flex items-center gap-2 relative transition-colors ${activeTab === "materi" ? "text-white" : "text-[#8696A0] hover:text-[#D1D7DB]"}`}
            >
              <BookOpen size={16} /> Materi Jawaban
              {activeTab === "materi" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500"></div>}
            </button>
            <button 
              onClick={() => setActiveTab("antiban")}
              className={`pb-3 text-sm font-bold flex items-center gap-2 relative transition-colors ${activeTab === "antiban" ? "text-white" : "text-[#8696A0] hover:text-[#D1D7DB]"}`}
            >
              <ShieldCheck size={16} /> Keamanan Anti-Ban
              {activeTab === "antiban" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-500"></div>}
            </button>
          </div>

          {/* TAB CONTENT: MATERI */}
          {activeTab === "materi" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
              <div className="lg:col-span-1 space-y-4">
                <div className="bg-[#202C33] p-5 rounded-lg border border-[#313D45]">
                  <label className="text-xs font-bold text-emerald-400 block mb-2 uppercase italic">Identitas Bot</label>
                  <input 
                    type="text"
                    value={formData.botName}
                    onChange={(e) => handleInputChange("botName", e.target.value)}
                    className="w-full bg-[#111B21] border border-[#313D45] rounded p-3 text-sm outline-none text-white focus:border-emerald-500 transition-colors"
                    placeholder="Contoh: Admin SatuPintu"
                  />
                </div>
                <div className="bg-[#202C33] p-5 rounded-lg border border-[#313D45]">
                  <label className="text-xs font-bold text-emerald-400 block mb-2 uppercase italic">Prompt Instruksi</label>
                  <textarea 
                    value={formData.prompt}
                    onChange={(e) => handleInputChange("prompt", e.target.value)}
                    className="w-full bg-[#111B21] border border-[#313D45] rounded p-3 text-sm h-48 outline-none text-white focus:border-emerald-500 transition-colors resize-none"
                    placeholder="Contoh: Jawab dengan ramah dan gunakan bahasa Indonesia yang baku..."
                  />
                </div>
              </div>
              <div className="lg:col-span-2 bg-[#202C33] p-5 rounded-lg border border-[#313D45]">
                <label className="text-xs font-bold text-emerald-400 block mb-2 uppercase italic">Knowledge Base (Materi Produk)</label>
                <textarea 
                  value={formData.knowledgeBase}
                  onChange={(e) => handleInputChange("knowledgeBase", e.target.value)}
                  className="w-full bg-[#111B21] border border-[#313D45] rounded p-4 text-sm h-[340px] font-mono text-emerald-50/80 outline-none focus:border-emerald-500 transition-colors leading-relaxed"
                  placeholder="Paste semua FAQ, daftar harga, dan detail layanan Anda di sini agar AI bisa menjawab dengan akurat..."
                />
              </div>
            </div>
          )}

          {/* TAB CONTENT: ANTI-BAN */}
          {activeTab === "antiban" && (
            <div className="max-w-2xl space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-lg flex gap-3 items-start text-orange-200">
                <AlertCircle className="text-orange-500 shrink-0" size={18} />
                <p className="text-xs leading-relaxed">
                  <strong>Rekomendasi:</strong> Gunakan jeda minimal 5-15 detik. Pengaturan ini membuat AI mengirim pesan dengan interval waktu acak untuk menghindari deteksi spam WhatsApp.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#202C33] p-4 rounded border border-[#313D45] group focus-within:border-orange-500 transition-colors">
                    <label className="text-[10px] text-[#8696A0] uppercase block mb-1 font-bold">Min Delay (Detik)</label>
                    <input 
                      type="number" 
                      value={formData.minDelay} 
                      onChange={(e) => handleInputChange("minDelay", Number(e.target.value))} 
                      className="w-full bg-transparent text-xl font-bold outline-none text-white" 
                    />
                </div>
                <div className="bg-[#202C33] p-4 rounded border border-[#313D45] group focus-within:border-orange-500 transition-colors">
                    <label className="text-[10px] text-[#8696A0] uppercase block mb-1 font-bold">Max Delay (Detik)</label>
                    <input 
                      type="number" 
                      value={formData.maxDelay} 
                      onChange={(e) => handleInputChange("maxDelay", Number(e.target.value))} 
                      className="w-full bg-transparent text-xl font-bold outline-none text-white" 
                    />
                </div>
              </div>
              <div className="bg-[#202C33] p-4 rounded border border-[#313D45] group focus-within:border-orange-500 transition-colors">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] text-[#8696A0] uppercase font-bold flex items-center gap-2">
                    <Zap size={12} className="text-orange-500" /> Limit Pesan Harian
                  </label>
                </div>
                <input 
                  type="number" 
                  value={formData.maxMessagesPerDay} 
                  onChange={(e) => handleInputChange("maxMessagesPerDay", Number(e.target.value))} 
                  className="w-full bg-transparent text-xl font-bold outline-none text-white" 
                />
                <p className="text-[10px] text-[#8696A0] mt-2 italic">AI akan berhenti membalas otomatis jika limit harian tercapai.</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-44 opacity-20">
          <div className="relative">
            <Database size={80} className="text-white" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full animate-ping"></div>
          </div>
          <p className="mt-6 font-bold uppercase tracking-[0.3em] text-sm text-white">Pilih Device WhatsApp</p>
          <p className="text-xs text-[#8696A0] mt-2">Pilih salah satu nomor di atas untuk mulai konfigurasi.</p>
        </div>
      )}
    </div>
  );
};

export default AISettingPage;