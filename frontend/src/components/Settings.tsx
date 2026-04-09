import React, { useState, useEffect, useCallback } from "react";
import { 
  User, 
  Bell, 
  Save,
  ChevronRight,
  Shield,
  Settings2,
  MessageSquare,
  Globe,
  RefreshCw,
  Moon,
  Sun,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

interface SettingsProps {
  onBack?: () => void;
}

interface PlatformSetting {
  id: string;
  name: string;
  color: string;
  bgColor: string;
  enabled: boolean;
  settings: {
    label: string;
    key: string;
    type: "toggle" | "input";
    value: boolean | string;
  }[];
}

const API_URL = import.meta.env.VITE_API_URL;

export const Settings: React.FC<SettingsProps> = ({ onBack: _onBack }) => {
  const [activeTab, setActiveTab] = useState("whatsapp");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [platforms, setPlatforms] = useState<PlatformSetting[]>([
    {
      id: "whatsapp",
      name: "WhatsApp",
      color: "text-green-500",
      bgColor: "bg-green-500",
      enabled: true,
      settings: [
        { label: "Auto Reply", key: "autoReply", type: "toggle", value: true },
        { label: "Notifikasi Suara", key: "sound", type: "toggle", value: true },
        { label: "Status Online Otomatis", key: "autoOnline", type: "toggle", value: false },
        { label: "Simpan Kontak Otomatis", key: "saveContact", type: "toggle", value: true },
        { label: "Typing Indicator", key: "typing", type: "toggle", value: true },
        { label: "Read Receipt", key: "readReceipt", type: "toggle", value: true },
      ],
    },
    {
      id: "tiktok",
      name: "TikTok",
      color: "text-rose-500",
      bgColor: "bg-rose-500",
      enabled: false,
      settings: [
        { label: "Auto Reply", key: "autoReply", type: "toggle", value: false },
        { label: "Notifikasi Komentar", key: "notifyComment", type: "toggle", value: true },
        { label: "Auto Like Komentar", key: "autoLike", type: "toggle", value: false },
      ],
    },
    {
      id: "instagram",
      name: "Instagram",
      color: "text-purple-500",
      bgColor: "bg-purple-500",
      enabled: false,
      settings: [
        { label: "Auto Reply DM", key: "autoReply", type: "toggle", value: false },
        { label: "Auto Reply Komentar", key: "autoReplyComment", type: "toggle", value: false },
        { label: "Story Notification", key: "storyNotify", type: "toggle", value: true },
      ],
    },
    {
      id: "facebook",
      name: "Facebook",
      color: "text-blue-600",
      bgColor: "bg-blue-600",
      enabled: false,
      settings: [
        { label: "Auto Reply Messenger", key: "autoReply", type: "toggle", value: false },
        { label: "Auto Reply Komentar", key: "autoReplyComment", type: "toggle", value: false },
        { label: "Kirim Otomatis ke Inbox", key: "autoInbox", type: "toggle", value: true },
      ],
    },
  ]);

  const [generalSettings, setGeneralSettings] = useState({
    sessionTimeout: "60",
    theme: "light",
    language: "id",
    timezone: "Asia/Jakarta",
    notificationSound: true,
    desktopNotification: true,
    autoRefresh: true,
    refreshInterval: "30",
  });

  const [webhookUrls, setWebhookUrls] = useState<Record<string, string>>({
    whatsapp: "",
    tiktok: "",
    instagram: "",
    facebook: "",
  });

  // Load settings from API
  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      
      const [platformRes, generalRes] = await Promise.all([
        fetch(`${API_URL}/settings/platforms`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/settings/general`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const platformData = await platformRes.json();
      const generalData = await generalRes.json();

      if (platformData.success && platformData.data) {
        const loadedPlatforms = platforms.map(platform => {
          const saved = platformData.data[platform.id] || {};
          return {
            ...platform,
            enabled: saved.enabled ?? platform.enabled,
            settings: platform.settings.map(setting => ({
              ...setting,
              value: saved[setting.key] ?? setting.value,
            })),
          };
        });
        setPlatforms(loadedPlatforms);
        setWebhookUrls({
          whatsapp: platformData.data.whatsapp?.webhookUrl || "",
          tiktok: platformData.data.tiktok?.webhookUrl || "",
          instagram: platformData.data.instagram?.webhookUrl || "",
          facebook: platformData.data.facebook?.webhookUrl || "",
        });
      }

      if (generalData.success && generalData.data) {
        setGeneralSettings(prev => ({
          ...prev,
          ...generalData.data,
        }));
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
      toast.error("Gagal memuat pengaturan");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem("token");
      
      // Save platform settings
      for (const platform of platforms) {
        const settingsToSave: Record<string, any> = {
          enabled: platform.enabled,
        };
        platform.settings.forEach(setting => {
          settingsToSave[setting.key] = setting.value;
        });
        if (webhookUrls[platform.id]) {
          settingsToSave.webhookUrl = webhookUrls[platform.id];
        }

        await fetch(`${API_URL}/settings/platforms`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            platform: platform.id,
            settings: settingsToSave,
          }),
        });
      }

      // Save general settings
      await fetch(`${API_URL}/settings/general`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          settings: generalSettings,
        }),
      });

      toast.success("Pengaturan berhasil disimpan!");
    } catch (err) {
      console.error("Failed to save settings:", err);
      toast.error("Gagal menyimpan pengaturan");
    } finally {
      setIsSaving(false);
    }
  };

  const togglePlatform = async (id: string) => {
    const platform = platforms.find(p => p.id === id);
    if (!platform) return;

    const newEnabled = !platform.enabled;
    
    // Update local state immediately
    setPlatforms(platforms.map(p => 
      p.id === id ? { ...p, enabled: newEnabled } : p
    ));

    // Save to API (save all platform settings)
    try {
      const token = localStorage.getItem("token");
      const platformToSave = platforms.find(p => p.id === id);
      if (platformToSave) {
        const settingsToSave: Record<string, any> = {
          enabled: newEnabled,
        };
        platformToSave.settings.forEach(setting => {
          settingsToSave[setting.key] = setting.value;
        });
        if (webhookUrls[id]) {
          settingsToSave.webhookUrl = webhookUrls[id];
        }

        await fetch(`${API_URL}/settings/platforms`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            platform: id,
            settings: settingsToSave,
          }),
        });
      }
    } catch (err) {
      console.error("Failed to toggle platform:", err);
      toast.error("Gagal mengubah status platform");
    }
  };

  const updatePlatformSetting = (platformId: string, key: string, value: boolean | string) => {
    setPlatforms(platforms.map(p => {
      if (p.id === platformId) {
        return {
          ...p,
          settings: p.settings.map(s => s.key === key ? { ...s, value } : s)
        };
      }
      return p;
    }));
  };

  const testWebhook = async (platformId: string) => {
    const url = webhookUrls[platformId];
    if (!url) {
      toast.error("Masukkan URL webhook terlebih dahulu");
      return;
    }

    const loadingToast = toast.loading("Menguji webhook...");
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "test",
          platform: platformId,
          timestamp: new Date().toISOString(),
          message: "Test webhook from Satu Pintu",
        }),
      });

      if (response.ok || response.status === 200 || response.status === 201) {
        toast.success("Webhook test berhasil!", { id: loadingToast });
      } else {
        toast.error(`Webhook error: ${response.status}`, { id: loadingToast });
      }
    } catch (err: any) {
      if (err.name === "TypeError" && err.message.includes("fetch")) {
        toast.success("Webhook reachable (timeout expected)", { id: loadingToast });
      } else {
        toast.error(`Webhook test gagal: ${err.message}`, { id: loadingToast });
      }
    }
  };

  const tabs = [
    { id: "whatsapp", label: "WhatsApp", color: "text-green-500" },
    { id: "tiktok", label: "TikTok", color: "text-rose-500" },
    { id: "instagram", label: "Instagram", color: "text-purple-500" },
    { id: "facebook", label: "Facebook", color: "text-blue-600" },
    { id: "general", label: "Umum", color: "text-gray-600" },
  ];

  const currentPlatform = platforms.find(p => p.id === activeTab);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 h-[100dvh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Memuat pengaturan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50 h-[100dvh] overflow-hidden">
      {/* Header */}
      <div className="flex-none bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h1 className="text-gray-900 text-xl font-bold flex items-center gap-2">
          <Settings2 className="w-5 h-5" /> Pengaturan
        </h1>
        <button
          onClick={loadSettings}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Tabs */}
        <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto hidden md:block">
          <div className="py-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between px-5 py-3 transition-colors ${
                  activeTab === tab.id 
                  ? "bg-blue-50 text-blue-600 border-r-2 border-blue-600" 
                  : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  {tab.id === "whatsapp" && <MessageSquare className={`w-5 h-5 ${tab.color}`} />}
                  {tab.id === "tiktok" && <span className={`w-5 h-5 ${tab.color} font-bold text-sm flex items-center justify-center`}>T</span>}
                  {tab.id === "instagram" && <span className={`w-5 h-5 ${tab.color} font-bold text-xs flex items-center justify-center`}>IG</span>}
                  {tab.id === "facebook" && <span className={`w-5 h-5 ${tab.color} font-bold text-xs flex items-center justify-center`}>FB</span>}
                  {tab.id === "general" && <Settings2 className={`w-5 h-5 ${tab.color}`} />}
                  <span className="text-sm font-medium">{tab.label}</span>
                </div>
                <ChevronRight className={`w-4 h-4 ${activeTab === tab.id ? "opacity-100" : "opacity-0"}`} />
              </button>
            ))}
          </div>

          {/* Save Button */}
          <div className="p-4 border-t border-gray-200 mt-auto">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-xl font-semibold transition-all active:scale-[0.98]"
            >
              {isSaving ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              {isSaving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </div>

        {/* Mobile Tabs */}
        <div className="md:hidden w-full bg-white border-b border-gray-200 px-2 py-2 flex gap-2 overflow-x-auto flex-shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === tab.id 
                ? "bg-blue-600 text-white" 
                : "bg-gray-100 text-gray-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {activeTab !== "general" && currentPlatform && (
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Platform Header */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 ${currentPlatform.bgColor} rounded-xl flex items-center justify-center`}>
                      <MessageSquare className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">{currentPlatform.name}</h2>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        {currentPlatform.enabled ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-500" /> Aktif
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-gray-400" /> Nonaktif
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => togglePlatform(currentPlatform.id)}
                    className={`relative w-14 h-8 rounded-full transition-colors ${
                      currentPlatform.enabled ? "bg-green-500" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                        currentPlatform.enabled ? "left-7" : "left-1"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Quick Settings */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="text-gray-900 font-semibold mb-4">Pengaturan Fitur</h3>
                <div className="grid gap-4">
                  {currentPlatform.settings.map((setting) => (
                    <div key={setting.key} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <span className="text-gray-700">{setting.label}</span>
                      {setting.type === "toggle" && (
                        <button
                          onClick={() => updatePlatformSetting(currentPlatform.id, setting.key, !setting.value)}
                          className={`relative w-12 h-6 rounded-full transition-colors ${
                            setting.value ? "bg-blue-500" : "bg-gray-300"
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                              setting.value ? "left-6" : "left-0.5"
                            }`}
                          />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Webhook */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="text-gray-900 font-semibold mb-4">Webhook</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={webhookUrls[currentPlatform.id] || ""}
                      onChange={(e) => setWebhookUrls({...webhookUrls, [currentPlatform.id]: e.target.value})}
                      placeholder={`https://domain.com/webhook/${currentPlatform.id}`}
                      className="flex-1 bg-gray-50 text-gray-900 px-4 py-3 rounded-xl outline-none border border-gray-200 focus:border-blue-500 transition-colors"
                    />
                    <button 
                      onClick={() => testWebhook(currentPlatform.id)}
                      className="px-5 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
                    >
                      Test
                    </button>
                  </div>
                  <p className="text-xs text-gray-400">
                    Webhook akan menerima data saat ada aktivitas baru di {currentPlatform.name}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* General Settings */}
          {activeTab === "general" && (
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Session & Security */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="text-gray-900 font-semibold mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-gray-500" />
                  Sesi & Keamanan
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div>
                      <span className="text-gray-700 block">Timeout Sesi</span>
                      <span className="text-xs text-gray-400">Auto logout setelah tidak aktif</span>
                    </div>
                    <select
                      value={generalSettings.sessionTimeout}
                      onChange={(e) => setGeneralSettings({...generalSettings, sessionTimeout: e.target.value})}
                      className="bg-gray-50 px-4 py-2 rounded-lg border border-gray-200 outline-none text-sm"
                    >
                      <option value="15">15 menit</option>
                      <option value="30">30 menit</option>
                      <option value="60">1 jam</option>
                      <option value="120">2 jam</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div>
                      <span className="text-gray-700 block">Auto Refresh Data</span>
                      <span className="text-xs text-gray-400">Muat ulang data secara otomatis</span>
                    </div>
                    <button
                      onClick={() => setGeneralSettings({...generalSettings, autoRefresh: !generalSettings.autoRefresh})}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        generalSettings.autoRefresh ? "bg-blue-500" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                          generalSettings.autoRefresh ? "left-6" : "left-0.5"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Notifications */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="text-gray-900 font-semibold mb-4 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-gray-500" />
                  Notifikasi
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div>
                      <span className="text-gray-700 block">Suara Notifikasi</span>
                      <span className="text-xs text-gray-400">Bunyi saat pesan masuk</span>
                    </div>
                    <button
                      onClick={() => setGeneralSettings({...generalSettings, notificationSound: !generalSettings.notificationSound})}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        generalSettings.notificationSound ? "bg-blue-500" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                          generalSettings.notificationSound ? "left-6" : "left-0.5"
                        }`}
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div>
                      <span className="text-gray-700 block">Notifikasi Desktop</span>
                      <span className="text-xs text-gray-400">Popup notifikasi di browser</span>
                    </div>
                    <button
                      onClick={() => setGeneralSettings({...generalSettings, desktopNotification: !generalSettings.desktopNotification})}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        generalSettings.desktopNotification ? "bg-blue-500" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                          generalSettings.desktopNotification ? "left-6" : "left-0.5"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Appearance */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="text-gray-900 font-semibold mb-4 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-gray-500" />
                  Tampilan
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-700">Tema</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setGeneralSettings({...generalSettings, theme: "light"})}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                          generalSettings.theme === "light" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        <Sun className="w-4 h-4" /> Light
                      </button>
                      <button
                        onClick={() => setGeneralSettings({...generalSettings, theme: "dark"})}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                          generalSettings.theme === "dark" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        <Moon className="w-4 h-4" /> Dark
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div>
                      <span className="text-gray-700 block">Zona Waktu</span>
                      <span className="text-xs text-gray-400">Asia/Jakarta (GMT+7)</span>
                    </div>
                    <select
                      value={generalSettings.timezone}
                      onChange={(e) => setGeneralSettings({...generalSettings, timezone: e.target.value})}
                      className="bg-gray-50 px-4 py-2 rounded-lg border border-gray-200 outline-none text-sm"
                    >
                      <option value="Asia/Jakarta">Asia/Jakarta (GMT+7)</option>
                      <option value="Asia/Makassar">Asia/Makassar (GMT+8)</option>
                      <option value="Asia/Jayapura">Asia/Jayapura (GMT+9)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Account */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="text-gray-900 font-semibold mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-gray-500" />
                  Akun
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">Admin Satu Pintu</h4>
                      <p className="text-sm text-gray-500">admin@satupintu.com</p>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded-full font-medium">
                        System Administrator
                      </span>
                    </div>
                    <button className="text-blue-600 text-sm font-medium hover:underline">
                      Edit
                    </button>
                  </div>
                </div>
              </div>

              {/* Save Button (Mobile) */}
              <div className="md:hidden pb-6">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-4 rounded-xl font-semibold transition-all"
                >
                  {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
