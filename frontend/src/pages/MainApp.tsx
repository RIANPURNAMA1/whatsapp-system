import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSettings } from "../context/SettingsContext";
import Swal from "sweetalert2";
import toast, { Toaster } from "react-hot-toast";

// State & Hooks
import useStore from "../store/useStore";
import { useSocket } from "../hooks/useSocket";

// Components
import DevicePanel from "../components/DevicePanel";
import ChatList from "../components/ChatList";
import { ChatWindow } from "../components/ChatWindow";
import GroupChatWindow from "../components/Groupchatwindow";
import QRModal from "../components/QRModal";
import NewChatModal from "../components/NewChatModal";
import { GlobalInboxView } from "../components/GlobalInboxView";
import { NoSessionSelected } from "../components/NoSessionSelected";
import StatDashboard from "../components/StatDashboard";
import RoleManagementView from "../components/RoleManagementView";
import UserManagementView from "../components/UserManagementView";
import Sidebar from "../components/Sidebar";
import { Settings } from "../components/Settings";
import LeadsChatList from "../components/LeadsChatList";
import { Menu, Users, ArrowLeft } from "lucide-react";
import { KeywordManager } from "../components/KeywordManager";
import { LinkRotatorSection } from "../components/LinkRotatorSection";
import { LeadProductSection } from "../components/LeadProductSection";
import AISettingPage from "../components/AISettingPage";
import GroupList from "@/components/Grouplist";
import TikTokPanel from "../components/live/LivePanel";
import { TikTokLiveReportPage } from "../components/live/LiveReport";
import TikTokAnalyticsDashboard from "../components/live/LiveAnalyticsDashboard";
import { LeadsReportPage } from "./LeadsReportPage";
import LabelsPage from "./LabelsPage";
import { TrafficClosingSection } from "../components/TrafficClosingSection";
import { LeadAnalysisSection } from "../components/LeadAnalysisSection";
import KategoriLeadsPage from "./KategoriLeadsPage";
import type { GroupChat } from "../types/Group";

interface UserData {
  id: number;
  username: string;
  role_type: "system" | "manager" | "custom" | "tiktok_operator";
  branch: string;
  full_name?: string;
}

export const MainApp: React.FC<{ user: UserData; onLogout: () => void }> = ({
  user,
  onLogout,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  // 1. Store State (Zustand)
  const {
    activeSession,
    sessions,
    showQRModal,
    showNewChatModal,
    selectedChat,
    fetchSessions,
    fetchStats,
    setShowQRModal,
    setShowNewChatModal,
    selectChat,
    setActiveSession,
    deleteSession,
  } = useStore();

  const { settings } = useSettings();

  // 2. Local State
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  useEffect(() => {
    const path = location.pathname;
    if (path === "/analisis-leads") setActiveTab("lead-analysis");
    else if (path === "/kategori-leads") setActiveTab("kategori-leads");
    else if (path === "/traffic-closing") setActiveTab("traffic-closing");
    else if (path === "/leads-baru") setActiveTab("leads-only");
    else if (path === "/chat-wa") setActiveTab("chats");
    else if (path === "/global-inbox") setActiveTab("all-messages");
    else if (path === "/grup") setActiveTab("groups");
    else if (path === "/labels") setActiveTab("labels");
    else if (path === "/perangkat") setActiveTab("devices");
    else if (path === "/kata-kunci-pengikat") setActiveTab("keyword-management");
    else if (path === "/rotator-tautan") setActiveTab("link-rotator");
    else if (path === "/leads-product") setActiveTab("lead-products");
    else if (path === "/asisten-ai") setActiveTab("ai-setting");
    else if (path === "/laporan-performa") setActiveTab("leads-report");
    else if (path === "/laporan-live") setActiveTab("tiktok-live-report");
    else if (path === "/live-analytics") setActiveTab("live-analytics");
    else if (path === "/hak-akses") setActiveTab("role-management");
    else if (path === "/manajemen-anggota") setActiveTab("user-management");
    else if (path === "/konfigurasi-sistem") setActiveTab("settings");
    else if (user?.role_type === "tiktok_operator") setActiveTab("tiktok-live-report");
    else setActiveTab("dashboard");
  }, [location.pathname]);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem("sidebarOpen");
    return saved !== null ? JSON.parse(saved) : window.innerWidth >= 768;
  });

  useEffect(() => {
    localStorage.setItem("sidebarOpen", JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);
  const [addDeviceSessionId, setAddDeviceSessionId] = useState<string | null>(
    null,
  );
  const [selectedGroup, setSelectedGroup] = useState<GroupChat | null>(null);

  // 3. Side Effects
  useSocket(activeSession?.id || null);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    if (activeSession?.id) {
      fetchStats(activeSession.id);
      const intervalMs = settings.autoRefresh ? parseInt(settings.refreshInterval, 10) * 1000 : 0;
      if (intervalMs <= 0) return;
      const interval = setInterval(() => fetchStats(activeSession.id), intervalMs);
      return () => clearInterval(interval);
    }
  }, [activeSession?.id, fetchStats, settings.autoRefresh, settings.refreshInterval]);

  // Jika ada chat terpilih, otomatis pindah ke view chat (Mobile)
  useEffect(() => {
    if (selectedChat) setMobileView("chat");
  }, [selectedChat?.jid]);

  // 4. Handlers
  const handleSystemLogout = async () => {
    const result = await Swal.fire({
      title: "",
      html: `
        <div style="text-align:center;padding:8px 0">
          <div style="width:56px;height:56px;border-radius:16px;background:#FEF2F2;display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#EE1D52" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </div>
          <div style="font-size:17px;font-weight:700;color:#0F172A;margin-bottom:6px">Keluar Aplikasi?</div>
          <div style="font-size:13px;color:#64748B;line-height:1.5;padding:0 0 8px">
            Anda akan diarahkan kembali ke halaman login.
          </div>
          <div style="display:flex;gap:10px;justify-content:center;margin-top:8px">
            <button type="button" id="swal-cancel-btn" style="flex:1;padding:10px 0;border-radius:10px;border:none;font-size:14px;font-weight:600;font-family:'Plus Jakarta Sans',sans-serif;background:#F1F5F9;color:#475569;cursor:pointer;transition:all 0.15s ease">Batal</button>
            <button type="button" id="swal-confirm-btn" style="flex:1;padding:10px 0;border-radius:10px;border:none;font-size:14px;font-weight:600;font-family:'Plus Jakarta Sans',sans-serif;background:#EE1D52;color:#fff;cursor:pointer;transition:all 0.15s ease">Ya, Keluar</button>
          </div>
        </div>
      `,
      showConfirmButton: false,
      showCancelButton: false,
      background: "#FFFFFF",
      color: "#0F172A",
      didOpen: () => {
        const confirmBtn = document.getElementById("swal-confirm-btn");
        const cancelBtn = document.getElementById("swal-cancel-btn");
        confirmBtn?.addEventListener("click", () => Swal.clickConfirm());
        cancelBtn?.addEventListener("click", () => Swal.clickCancel());
        confirmBtn?.addEventListener("mouseenter", () => { confirmBtn.style.background = "#C81946"; confirmBtn.style.transform = "scale(0.97)"; });
        confirmBtn?.addEventListener("mouseleave", () => { confirmBtn.style.background = "#EE1D52"; confirmBtn.style.transform = "scale(1)"; });
        cancelBtn?.addEventListener("mouseenter", () => { cancelBtn.style.background = "#E2E8F0"; cancelBtn.style.transform = "scale(0.97)"; });
        cancelBtn?.addEventListener("mouseleave", () => { cancelBtn.style.background = "#F1F5F9"; cancelBtn.style.transform = "scale(1)"; });
      },
    });

    if (result.isConfirmed) {
      toast.success("Berhasil keluar");
      setTimeout(() => onLogout(), 800);
    }
  };

  const handleAddNewDevice = () => {
    const newUniqueId = `device_${Date.now()}`;
    setAddDeviceSessionId(newUniqueId);
    setShowQRModal(true);
  };

  const handleReconnect = async (sessionId: string) => {
    const loadingToast = toast.loading("Menyiapkan koneksi WhatsApp...");
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/sessions/reconnect/${sessionId}`,
        {
          method: "POST",
        },
      );
      const data = await res.json();
      if (data.success) {
        toast.success("Silakan scan QR Code", { id: loadingToast });
        setAddDeviceSessionId(sessionId);
        setShowQRModal(true);
        fetchSessions();
      } else {
        toast.error(data.message || "Gagal reconnect", { id: loadingToast });
      }
    } catch (error) {
      toast.error("Gagal melakukan reconnect", { id: loadingToast });
    }
  };

  const handleLogoutWA = async (sessionId: string) => {
    if (!confirm("Putuskan koneksi WhatsApp di perangkat ini?")) return;
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/sessions/logout/${sessionId}`,
        {
          method: "POST",
        },
      );
      const data = await res.json();
      if (data.success) {
        toast.success("Berhasil logout WA");
        fetchSessions();
      }
    } catch (error) {
      toast.error("Gagal logout");
    }
  };

  const handleDeleteDevice = async (
    sessionId: string,
    name: string,
  ) => {
    const result = await Swal.fire({
      title: "Hapus Perangkat?",
      text: `Data sesi "${name || sessionId}" akan dihapus permanen.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#EF4444",
      background: "#ffffff",
      color: "#1f2937",
    });

    if (result.isConfirmed) {
      const load = toast.loading("Menghapus...");
      try {
        await deleteSession(sessionId);
        toast.success("Sesi dihapus", { id: load });
      } catch (err: any) {
        toast.error("Gagal menghapus", { id: load });
      }
    }
  };

  // 5. Helpers
  const isConnected = activeSession?.status === "connected";
  const currentSessionId =
    selectedChat?.session_id || activeSession?.id || "default";

  return (
    <div className="h-screen bg-gray-100 text-gray-900 flex overflow-hidden font-sans relative">
      <Toaster position="bottom-right" />

      {/* Sidebar Navigasi */}
      <Sidebar
        user={user}
        isSystemAdmin={user?.role_type === "system"}
        activeTab={activeTab}
        setActiveTab={(tab: string) => {
          setActiveTab(tab);
          setIsSidebarOpen(false);
          setMobileView("list");
          // Bersihkan seleksi chat jika pindah ke menu non-komunikasi
          if (!["chats", "leads-only", "all-messages"].includes(tab)) {
            selectChat(null as any);
          }
        }}
        onLogout={handleSystemLogout}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      <main className="flex flex-1 overflow-hidden relative h-full">
        {/* --- KATEGORI 1: FULL SCREEN VIEW (Tanpa List di Kiri) --- */}
        {[
          "dashboard",
          "role-management",
          "user-management",
          "settings",
          "devices",
          "keyword-management",
          "link-rotator",
          "lead-products",
          "ai-setting",
          "tiktok",
          "tiktok-live-report",
          "live-analytics",
          "leads-report",
          "labels",
          "traffic-closing",
          "lead-analysis",
        ].includes(activeTab) ? (
          <div className="flex flex-1 flex-col overflow-hidden relative">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden absolute top-4 left-4 z-40 p-2 bg-white rounded-lg border border-gray-200 text-blue-500 shadow-md"
            >
              <Menu size={20} />
            </button>

            {activeTab === "dashboard" && (
              <div className="flex-1 overflow-y-auto h-full">
                <StatDashboard onNavigate={(tab) => {
                  setActiveTab(tab);
                  setMobileView("chat");
                }} />
              </div>
            )}
            {activeTab === "role-management" && (
              <div className="flex-1 overflow-y-auto h-full">
                <RoleManagementView />
              </div>
            )}
            {activeTab === "user-management" && (
              <div className="flex-1 overflow-y-auto h-full">
                <UserManagementView />
              </div>
            )}

            {/* --- RENDER LINK ROTATOR DI SINI --- */}
            {activeTab === "link-rotator" && (
              <div className="flex-1 overflow-y-auto h-full">
                <LinkRotatorSection />
              </div>
            )}

            {/* --- RENDER LEADS PRODUCT DI SINI --- */}
            {activeTab === "lead-products" && (
              <div className="flex-1 overflow-y-auto h-full">
                <LeadProductSection />
              </div>
            )}

            {/* --- RENDER AI SETTING DI SINI --- */}
            {activeTab === "ai-setting" && (
              <div className="flex-1 overflow-y-auto h-full">
                <AISettingPage />
              </div>
            )}

              {activeTab === "keyword-management" && (
                  <div className="flex-1 overflow-y-auto h-full">
                    <KeywordManager />
                  </div>
                )}


                  {/* View Manajemen Perangkat */}
                {activeTab === "devices" && (
                  <DevicePanel
                    sessions={sessions}
                    activeId={activeSession?.id}
                    user={user}
                    onAdd={handleAddNewDevice}
                    onSelect={(s: any) => {
                      setActiveSession(s);
                      setActiveTab("chats");
                    }}
                    onDelete={handleDeleteDevice}
                    onReconnect={handleReconnect}
                    onLogout={handleLogoutWA}
                  />
                )}

            {activeTab === "settings" && (
              <div className="flex-1 overflow-y-auto h-full">
                <Settings onBack={() => setActiveTab("chats")} />
              </div>
            )}

            {activeTab === "tiktok" && (
              <div className="flex-1 overflow-y-auto h-full">
                <TikTokPanel onBack={() => setActiveTab("chats")} />
              </div>
            )}

            {activeTab === "tiktok-live-report" && (
              <div className="flex-1 overflow-y-auto h-full">
                <TikTokLiveReportPage />
              </div>
            )}

            {activeTab === "live-analytics" && (
              <div className="flex-1 overflow-y-auto h-full">
                <TikTokAnalyticsDashboard onBack={() => navigate("/")} />
              </div>
            )}

            {activeTab === "leads-report" && (
              <div className="flex-1 overflow-y-auto h-full">
                <LeadsReportPage />
              </div>
            )}
            {activeTab === "labels" && (
              <div className="flex-1 overflow-y-auto h-full">
                <LabelsPage />
              </div>
            )}
            {activeTab === "traffic-closing" && (
              <div className="flex-1 overflow-y-auto h-full">
                <TrafficClosingSection onBack={() => navigate("/")} />
              </div>
            )}
            {activeTab === "lead-analysis" && (
              <div className="flex-1 overflow-y-auto h-full">
                <LeadAnalysisSection />
              </div>
            )}
            {activeTab === "kategori-leads" && (
              <div className="flex-1 overflow-y-auto h-full">
                <KategoriLeadsPage />
              </div>
            )}
          </div>
        ) : (
          /* --- KATEGORI 2: SPLIT SCREEN VIEW (List + Chat Window) --- */
          <>
            {/* PANEL KIRI: Daftar Chat / Pesan */}
            <section
              className={`${mobileView === "chat" ? "hidden" : "flex"} md:flex flex-col w-full md:w-[340px] lg:w-[360px] ${activeTab === "groups" ? "bg-white border-gray-200" : "bg-white border-gray-200"} z-20`}
            >
              {/* Mobile Header Custom */}
              <div className="md:hidden flex items-center p-4 border-b border-gray-100 bg-white gap-4">
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-1 text-blue-500"
                >
                  <Menu size={24} />
                </button>
                <h1 className="font-bold text-lg capitalize text-gray-900">
                  {activeTab === "leads-only" ? "Leads Baru" : activeTab}
                </h1>
              </div>

              <div className="flex-1 overflow-hidden flex flex-col">
                {/* View Pesan Global */}
                {activeTab === "all-messages" && <GlobalInboxView />}

                {/* View Chat WhatsApp Normal */}
                {activeTab === "chats" &&
                  (isConnected ? (
                    <ChatList sessionId={activeSession?.id || ""} />
                  ) : (
                    <NoSessionSelected
                      onManageDevices={() => setActiveTab("devices")}
                    />
                  ))}

                {/* View LEADS ONLY */}
                {activeTab === "leads-only" && (
                  <LeadsChatList
                    sessions={sessions || []}
                    onSelectChat={(chatData) => {
                      console.log("Membuka chat untuk lead:", chatData.jid);
                      selectChat(chatData);
                    }}
                  />
                )}

                {activeTab === "groups" && (
                  <GroupList
                    sessionId={currentSessionId}
                    selectedGroupJid={selectedGroup?.jid ?? null}
                    onSelectGroup={(group) => {
                      setSelectedGroup(group);
                      setMobileView("chat");
                    }}
                  />
                )}
              </div>
            </section>

            {/* PANEL KANAN: Jendela Percakapan */}
            <section
              className={`${mobileView === "list" ? "hidden" : "flex"} md:flex flex-1 flex-col bg-gray-50 z-10`}
            >
              {activeTab === "groups" ? (
                selectedGroup ? (
                  <>
                    <div className="md:hidden absolute top-[18px] left-4 z-50">
                      <button 
                        onClick={() => {
                          setSelectedGroup(null);
                          setMobileView("list");
                        }}
                        className="p-1 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <ArrowLeft className="w-6 h-6" />
                      </button>
                    </div>
                    <GroupChatWindow
                      key={selectedGroup.jid}
                      sessionId={currentSessionId}
                      group={selectedGroup}
                    />
                  </>
                ) : (
                  <div className="hidden md:flex flex-col items-center justify-center h-full w-full bg-white border-l border-gray-200">
                    <div className="flex flex-col items-center max-w-md px-10">
                      <div className="w-28 h-28 bg-blue-100 rounded-3xl flex items-center justify-center mb-8 shadow-xl">
                        <Users className="w-14 h-14 text-blue-400" />
                      </div>
                      <h1 className="text-gray-900 text-3xl font-bold mb-4">
                        Grup WhatsApp
                      </h1>
                      <p className="text-gray-500 text-sm leading-relaxed text-center">
                        Pilih grup untuk memulai percakapan. Hubungkan ke Satu Pintu untuk mengelola interaksi grup Anda dalam satu kendali terpusat.
                      </p>
                    </div>
                  </div>
                )
              ) : (
                <ChatWindow
                  key={`${selectedChat?.session_id}-${selectedChat?.jid}`}
                  sessionId={currentSessionId}
                  onBack={() => setMobileView("list")}
                />
              )}
            </section>
          </>
        )}
      </main>

      {/* MODALS AREA */}
      {showQRModal && (
        <QRModal
          sessionId={addDeviceSessionId || currentSessionId}
          onClose={() => {
            setShowQRModal(false);
            setAddDeviceSessionId(null);
            fetchSessions();
          }}
        />
      )}
      {showNewChatModal && (
        <NewChatModal
          sessionId={currentSessionId}
          onClose={() => setShowNewChatModal(false)}
          onSelectContact={(jid, name) => {
            selectChat({
              jid,
              display_name: name,
              session_id: currentSessionId,
            } as any);
            setShowNewChatModal(false);
          }}
        />
      )}
    </div>
  );
};
export default MainApp;
