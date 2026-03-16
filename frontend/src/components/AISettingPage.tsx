import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";

// Import Modular Components
import { AiHeader } from "./Ai/AiHeader";
import { ConfigTable } from "./Ai/ConfigTable";
import { SessionSelector } from "./Ai/SessionSelector";
import { InstructionSection } from "./Ai/InstructionSection";
import { KnowledgeBaseSection } from "./Ai/KnowledgeBaseSection";
import { AntiBanSection } from "./Ai/AntiBanSection";

const AISettingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"materi" | "antiban">("materi");
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [savedConfigs, setSavedConfigs] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetchSessions, setIsFetchSessions] = useState(false);

  const [kbMode, setKbMode] = useState<"text" | "pdf">("text");
  const [pdfList, setPdfList] = useState<{ name: string; size: number }[]>([]);
  const [actualFiles, setActualFiles] = useState<File[]>([]);

  const [formData, setFormData] = useState({
    bot_name: "",
    prompt: "",
    knowledge_base: "",
    min_delay: 5,
    max_delay: 15,
    max_messages_per_day: 200,
    human_wait_time: 0, // Default 0
  });

  const fetchConfigs = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/ai-settings`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      const result = await response.json();
      if (result.success) {
        setSavedConfigs(result.data || []);
      }
    } catch (err) {
      console.error("Gagal mengambil list config");
    }
  };

  const fetchAvailableSessions = async () => {
    setIsFetchSessions(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/sessions`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const result = await response.json();
      if (result.success) {
        setActiveSessions(result.data || []);
      }
    } catch (err) {
      console.error("Gagal mengambil session");
    } finally {
      setIsFetchSessions(false);
    }
  };

  useEffect(() => {
    fetchAvailableSessions();
    fetchConfigs();
  }, []);

  const getSessionName = (sessionId: string) => {
    const session = activeSessions.find((s: any) => s.id === sessionId);
    return session ? session.name : "Unknown Device";
  };

  const handleEdit = (cfg: any) => {
    setSelectedSessionId(cfg.session_id);
    setFormData({
      bot_name: cfg.bot_name || "",
      prompt: cfg.prompt || "",
      knowledge_base: cfg.knowledge_base || "",
      min_delay: cfg.min_delay || 5,
      max_delay: cfg.max_delay || 15,
      max_messages_per_day: cfg.max_messages_per_day || 200,
      human_wait_time: cfg.human_wait_time || 0, // Pastikan terisi dari DB
    });
    setKbMode(cfg.kb_mode || "text");
    toast.success(`Editing: ${getSessionName(cfg.session_id)}`);
    window.scrollTo({ top: 800, behavior: "smooth" });
  };

  const handleSave = async () => {
    if (!selectedSessionId) return toast.error("Pilih device dulu");
    setIsSaving(true);

    try {
      const data = new FormData();
      
      // Mengirimkan data dengan key yang sesuai dengan destructuring Backend
      data.append("sessionId", selectedSessionId); 
      data.append("botName", formData.bot_name);
      data.append("prompt", formData.prompt);
      data.append("knowledgeBase", formData.knowledge_base);
      data.append("minDelay", formData.min_delay.toString());
      data.append("maxDelay", formData.max_delay.toString());
      data.append("maxMessagesPerDay", formData.max_messages_per_day.toString());
      
      // CRITICAL FIX: Pastikan dikirim sebagai angka mentah 
      // Jika bot kamu pakai hitungan menit, kirim formData.human_wait_time
      // Jika bot kamu pakai hitungan detik, kalikan 60 di sini
      data.append("humanWaitTime", formData.human_wait_time.toString());
      
      actualFiles.forEach((file) => {
        data.append("files", file);
      });

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/ai-settings/save`,
        {
          method: "POST",
          headers: { 
            Authorization: `Bearer ${localStorage.getItem("token")}` 
          },
          body: data,
        }
      );

      const result = await response.json();

      if (result.success) {
        toast.success("Konfigurasi Berhasil Disimpan!");
        setActualFiles([]);
        setPdfList([]); 
        fetchConfigs(); 
      } else {
        toast.error(result.message || "Gagal menyimpan");
      }
    } catch (err) {
      console.error("Save Error:", err);
      toast.error("Terjadi kesalahan koneksi ke server");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 bg-[#0B141A] min-h-screen text-[#E9EDEF]">
      <AiHeader
        onSave={handleSave}
        isSaving={isSaving}
        canSave={!!selectedSessionId}
      />
      
      <SessionSelector
        sessions={activeSessions}
        selectedId={selectedSessionId}
        onSelect={setSelectedSessionId}
        onRefresh={fetchAvailableSessions}
        isFetching={isFetchSessions}
      />

      <ConfigTable
        configs={savedConfigs}
        getSessionName={getSessionName}
        onEdit={handleEdit}
        onCopy={(id) => {
          navigator.clipboard.writeText(id);
          toast.success("ID Disalin");
        }}
        onRefresh={fetchConfigs}
      />

      {selectedSessionId && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-700">
          <div className="flex gap-6 border-b border-[#313D45]">
            <button
              onClick={() => setActiveTab("materi")}
              className={`pb-4 text-sm font-bold transition-all relative ${activeTab === "materi" ? "text-white" : "text-[#8696A0]"}`}
            >
              Materi & Sifat AI
              {activeTab === "materi" && (
                <div className="absolute bottom-0 w-full h-1 bg-emerald-500 rounded-t-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("antiban")}
              className={`pb-4 text-sm font-bold transition-all relative ${activeTab === "antiban" ? "text-white" : "text-[#8696A0]"}`}
            >
              Fitur Keamanan
              {activeTab === "antiban" && (
                <div className="absolute bottom-0 w-full h-1 bg-orange-500 rounded-t-full" />
              )}
            </button>
          </div>

          {activeTab === "materi" ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5">
                <InstructionSection
                  formData={formData}
                  setFormData={setFormData}
                />
              </div>
              <div className="lg:col-span-7">
                <KnowledgeBaseSection
                  mode={kbMode}
                  setMode={setKbMode}
                  textValue={formData.knowledge_base}
                  onTextChange={(v) =>
                    setFormData({ ...formData, knowledge_base: v })
                  }
                  pdfList={pdfList}
                  onUpload={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setPdfList((prev) => [
                        ...prev,
                        { name: file.name, size: file.size },
                      ]);
                      setActualFiles((prev) => [...prev, file]);
                    }
                  }}
                  onRemovePdf={(idx) => {
                    setPdfList((prev) => prev.filter((_, i) => i !== idx));
                    setActualFiles((prev) => prev.filter((_, i) => i !== idx));
                  }}
                />
              </div>
            </div>
          ) : (
            <AntiBanSection
              formData={formData}
              onChange={(field, value) =>
                setFormData({ ...formData, [field]: value })
              }
            />
          )}
        </div>
      )}
    </div>
  );
};

export default AISettingPage;