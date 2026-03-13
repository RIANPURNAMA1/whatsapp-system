import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import toast, { Toaster } from "react-hot-toast";

// State & Hooks
import useStore from "../store/useStore";
import { useSocket } from "../hooks/useSocket";

// Components
import DevicePanel from "../components/DevicePanel";
import ChatList from "../components/ChatList";
import { ChatWindow } from "../components/ChatWindow";
import QRModal from "../components/QRModal";
import NewChatModal from "../components/NewChatModal";
import { GlobalInboxView } from "../components/GlobalInboxView";
import { NoSessionSelected } from "../components/NoSessionSelected";
import GroupsPage from "./GroupsPage";
import StatDashboard from "../components/StatDashboard";
import RoleManagementView from "../components/RoleManagementView";
import UserManagementView from "../components/UserManagementView";
import Sidebar from "../components/Sidebar";
import { Settings } from "../components/Settings";
import LeadsChatList from "../components/LeadsChatList"; // <--- Komponen Baru
import { Menu } from "lucide-react";
import { KeywordManager } from "../components/KeywordManager";
import { LinkRotatorSection } from "../components/LinkRotatorSection";
import AISettingPage from "../components/AISettingPage";

interface UserData {
  id: number;
  username: string;
  role_type: "system" | "manager" | "custom";
  branch: string;
  full_name?: string;
}

export const MainApp: React.FC<{ user: UserData; onLogout: () => void }> = ({
  user,
  onLogout,
}) => {
  // 1. Store State (Zustand)
  const {
    activeSession,
    sessions,
    showQRModal,
    showNewChatModal,
    selectedChat,
    stats,
    fetchSessions,
    fetchStats,
    setShowQRModal,
    setShowNewChatModal,
    selectChat,
    setActiveSession,
    deleteSession,
  } = useStore();

  // 2. Local State
  const [activeTab, setActiveTab] = useState<string>(
    user?.role_type === "system" || user?.role_type === "manager"
      ? "dashboard"
      : "chats",
  );
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [addDeviceSessionId, setAddDeviceSessionId] = useState<string | null>(
    null,
  );

  // 3. Side Effects
  useSocket(activeSession?.id || null);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    if (activeSession?.id) {
      fetchStats(activeSession.id);
      const interval = setInterval(() => fetchStats(activeSession.id), 30000);
      return () => clearInterval(interval);
    }
  }, [activeSession?.id, fetchStats]);

  // Jika ada chat terpilih, otomatis pindah ke view chat (Mobile)
  useEffect(() => {
    if (selectedChat) setMobileView("chat");
  }, [selectedChat?.jid]);

  // 4. Handlers
  const handleSystemLogout = async () => {
    const result = await Swal.fire({
      title: "Keluar Aplikasi?",
      text: "Anda akan diarahkan kembali ke halaman login.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#00a884",
      cancelButtonColor: "#313D45",
      confirmButtonText: "Ya, Keluar",
      background: "#202C33",
      color: "#E9EDEF",
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
    e: React.MouseEvent,
    sessionId: string,
    name: string,
  ) => {
    e.stopPropagation();
    const result = await Swal.fire({
      title: "Hapus Perangkat?",
      text: `Data sesi "${name || sessionId}" akan dihapus permanen.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#EF4444",
      background: "#202C33",
      color: "#E9EDEF",
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
    <div className="h-screen bg-[#0B141A] text-[#E9EDEF] flex overflow-hidden font-sans relative">
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

      <main className="flex flex-1 overflow-hidden relative">
        {/* --- KATEGORI 1: FULL SCREEN VIEW (Tanpa List di Kiri) --- */}
        {[
          "dashboard",
          "groups",
          "role-management",
          "user-management",
          "settings",
          "link-rotator",
          "ai-setting",
        ].includes(activeTab) ? (
          <div className="flex flex-1 flex-col overflow-hidden relative">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden absolute top-4 left-4 z-40 p-2 bg-[#202C33] rounded-lg border border-[#313D45] text-[#00a884]"
            >
              <Menu size={20} />
            </button>

            {activeTab === "dashboard" && <StatDashboard />}
            {activeTab === "groups" && (
              <GroupsPage sessionId={currentSessionId} />
            )}
            {activeTab === "role-management" && <RoleManagementView />}
            {activeTab === "user-management" && <UserManagementView />}

            {/* --- RENDER LINK ROTATOR DI SINI --- */}
            {activeTab === "link-rotator" && (
              <div className="flex-1 overflow-y-auto bg-[#0B141A]">
                <LinkRotatorSection isDarkMode={true} />
              </div>
            )}

            {/* --- RENDER AI SETTING DI SINI --- */}
            {activeTab === "ai-setting" && (
              <div className="flex-1 overflow-y-auto bg-[#0B141A]">
                <AISettingPage />
              </div>
            )}

            {activeTab === "settings" && (
              <Settings onBack={() => setActiveTab("chats")} />
            )}
          </div>
        ) : (
          /* --- KATEGORI 2: SPLIT SCREEN VIEW (List + Chat Window) --- */
          <>
            {/* PANEL KIRI: Daftar Chat / Pesan */}
            <section
              className={`${mobileView === "chat" ? "hidden" : "flex"} md:flex flex-col w-full md:w-[380px] lg:w-[420px] bg-[#111B21] border-r border-[#222d34] z-20`}
            >
              {/* Mobile Header Custom */}
              <div className="md:hidden flex items-center p-4 border-b border-[#222d34] bg-[#202C33] gap-4">
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-1 text-[#00a884]"
                >
                  <Menu size={24} />
                </button>
                <h1 className="font-bold text-lg capitalize">
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

                {activeTab === "keyword-management" && (
                  <KeywordManager isDarkMode={true} />
                )}

                {/* View LEADS ONLY */}
                {activeTab === "leads-only" && (
                  <LeadsChatList
                    isDarkMode={true}
                    sessions={sessions || []}
                    onSelectChat={(chatData) => {
                      console.log("Membuka chat untuk lead:", chatData.jid);
                      selectChat(chatData);
                    }}
                  />
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
              </div>
            </section>

            {/* PANEL KANAN: Jendela Percakapan */}
            <section
              className={`${mobileView === "list" ? "hidden" : "flex"} md:flex flex-1 flex-col bg-[#0B141A] z-10`}
            >
              <ChatWindow
                sessionId={currentSessionId}
                onBack={() => setMobileView("list")}
              />
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
