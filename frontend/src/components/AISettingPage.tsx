import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import axios from "axios";

import { AiHeader } from "./Ai/AiHeader";
import { ConfigTable } from "./Ai/ConfigTable";
import { SessionSelector } from "./Ai/SessionSelector";
import { InstructionSection } from "./Ai/InstructionSection";
import { KnowledgeBaseSection } from "./Ai/KnowledgeBaseSection";
import { AntiBanSection } from "./Ai/AntiBanSection";
import { RulesSection } from "./Ai/RulesSection";

const AISettingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"materi" | "rules" | "antiban">("materi");
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [savedConfigs, setSavedConfigs] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetchSessions, setIsFetchSessions] = useState(false);

  const [kbMode, setKbMode] = useState<'text' | 'pdf' | 'media'>('text');
  const [pdfList, setPdfList] = useState<{ name: string; size: number }[]>([]);
  const [actualFiles, setActualFiles] = useState<File[]>([]);

  const [mediaAssets, setMediaAssets] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    bot_name: "",
    prompt: "",
    knowledge_base: "",
    min_delay: 5,
    max_delay: 15,
    max_messages_per_day: 200,
    human_wait_time: 0,
  });

  const fetchConfigs = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/ai-settings`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (response.data.success) setSavedConfigs(response.data.data || []);
    } catch (err) {
      console.error("Gagal mengambil list config");
    }
  };

  const fetchAvailableSessions = async () => {
    setIsFetchSessions(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/sessions`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (response.data.success) setActiveSessions(response.data.data || []);
    } catch (err) {
      console.error("Gagal mengambil session");
    } finally {
      setIsFetchSessions(false);
    }
  };

  const fetchMediaAssets = async (sid: string) => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/ai-settings/assets/${sid}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (response.data.success) setMediaAssets(response.data.data);
    } catch (err) {
      console.error("Gagal fetch media assets");
    }
  };

  useEffect(() => {
    fetchAvailableSessions();
    fetchConfigs();
  }, []);

  useEffect(() => {
    if (selectedSessionId) {
      fetchMediaAssets(selectedSessionId);
    }
  }, [selectedSessionId]);

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
      human_wait_time: cfg.human_wait_time || 0,
    });
    setKbMode("text");
    toast.success(`Editing: ${getSessionName(cfg.session_id)}`);
  };

  const handleSave = async () => {
    if (!selectedSessionId) return toast.error("Pilih device dulu");
    setIsSaving(true);
    const loadToast = toast.loading("Menyimpan konfigurasi...");

    try {
      const data = new FormData();
      data.append("sessionId", selectedSessionId); 
      data.append("botName", formData.bot_name);
      data.append("prompt", formData.prompt);
      data.append("knowledgeBase", formData.knowledge_base);
      data.append("minDelay", formData.min_delay.toString());
      data.append("maxDelay", formData.max_delay.toString());
      data.append("maxMessagesPerDay", formData.max_messages_per_day.toString());
      data.append("humanWaitTime", formData.human_wait_time.toString());
      
      actualFiles.forEach((file) => data.append("files", file));

      const response = await axios.post(`${import.meta.env.VITE_API_URL}/ai-settings/save`, data, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });

      if (response.data.success) {
        toast.success("Konfigurasi Berhasil Disimpan!", { id: loadToast });
        setActualFiles([]);
        setPdfList([]); 
        fetchConfigs(); 
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal menyimpan", { id: loadToast });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadMedia = async (file: File, assetName: string) => {
    const loadToast = toast.loading("Mengunggah gambar...");
    try {
      const data = new FormData();
      data.append("file", file);
      data.append("assetName", assetName);
      data.append("sessionId", selectedSessionId);

      const response = await axios.post(`${import.meta.env.VITE_API_URL}/ai-settings/upload-asset`, data, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });

      if (response.data.success) {
        toast.success("Aset media berhasil ditambahkan", { id: loadToast });
        fetchMediaAssets(selectedSessionId);
      }
    } catch (err) {
      toast.error("Gagal mengunggah aset", { id: loadToast });
    }
  };

  const handleRemoveMedia = async (id: number) => {
    if (!confirm("Hapus aset ini?")) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/ai-assets/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      toast.success("Aset dihapus");
      fetchMediaAssets(selectedSessionId);
    } catch (err) {
      toast.error("Gagal menghapus aset");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AiHeader onSave={handleSave} isSaving={isSaving} canSave={!!selectedSessionId} />
        
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
          <div className="space-y-6 mt-10">
            <div className="flex gap-6 border-b border-gray-200 bg-white rounded-t-xl px-6 pt-4">
              {[
                { id: "materi", label: "Materi & Sifat AI", color: "bg-blue-500" },
                { id: "rules", label: "Auto Reply (Rules)", color: "bg-blue-500" },
                { id: "antiban", label: "Fitur Keamanan", color: "bg-orange-500" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`pb-4 text-sm font-semibold transition-all relative ${
                    activeTab === tab.id ? "text-gray-900" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className={`absolute bottom-0 w-full h-1 ${tab.color} rounded-t-full`} />
                  )}
                </button>
              ))}
            </div>

            {activeTab === "materi" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-5">
                  <InstructionSection formData={formData} setFormData={setFormData} />
                </div>
                <div className="lg:col-span-7">
                  <KnowledgeBaseSection
                    mode={kbMode}
                    setMode={setKbMode}
                    textValue={formData.knowledge_base}
                    onTextChange={(v) => setFormData({ ...formData, knowledge_base: v })}
                    pdfList={pdfList}
                    onUpload={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setPdfList(prev => [...prev, { name: file.name, size: file.size }]);
                        setActualFiles(prev => [...prev, file]);
                      }
                    }}
                    onRemovePdf={(idx) => {
                      setPdfList(prev => prev.filter((_, i) => i !== idx));
                      setActualFiles(prev => prev.filter((_, i) => i !== idx));
                    }}
                    mediaAssets={mediaAssets}
                    onUploadMedia={handleUploadMedia}
                    onRemoveMedia={handleRemoveMedia}
                  />
                </div>
              </div>
            )}

            {activeTab === "rules" && <RulesSection sessionId={selectedSessionId} />}

            {activeTab === "antiban" && (
              <AntiBanSection
                formData={formData}
                onChange={(field, value) => setFormData({ ...formData, [field]: value })}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AISettingPage;
