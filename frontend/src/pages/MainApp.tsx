import React, { useEffect, useState } from "react";
import {
  QrCode,
  MessageSquare,
  BarChart2,
  Settings,
  LayoutDashboard,
  PlusCircle,
  Smartphone,
  Trash2,
  Inbox,
  Users,
  Menu, // Icon Menu untuk Mobile
} from "lucide-react";
import useStore from "../store/useStore";
import ChatList from "../components/ChatList";
import { ChatWindow } from "../components/ChatWindow";
import QRModal from "../components/QRModal";
import NewChatModal from "../components/NewChatModal";
import { useSocket } from "../hooks/useSocket";
import Swal from "sweetalert2";
import toast, { Toaster } from "react-hot-toast";
import { GlobalInboxView } from "../components/GlobalInboxView";
import { NoSessionSelected } from "../components/NoSessionSelected";
import GroupsPage from "./GroupsPage";
import StatDashboard from "../components/StatDashboard";

export const MainApp: React.FC = () => {
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

  const [activeTab, setActiveTab] = useState<
    "chats" | "stats" | "devices" | "all-messages" | "groups" | "dashboard"
  >("chats");

  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State baru untuk sidebar mobile
  const [addDeviceSessionId, setAddDeviceSessionId] = useState<string | null>(
    null,
  );

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

  useEffect(() => {
    if (selectedChat) setMobileView("chat");
  }, [selectedChat?.jid]);

  const handleAddNewDevice = () => {
    const newUniqueId = `device_${Date.now()}`;
    setAddDeviceSessionId(newUniqueId);
    setShowQRModal(true);
  };

  const handleSwitchDevice = (session: any) => {
    setActiveSession(session);
    setActiveTab("chats");
    setIsSidebarOpen(false); // Tutup sidebar setelah pilih device
  };

const handleDeleteDevice = async (
  e: React.MouseEvent,
  sessionId: string,
  deviceName: string,
) => {
  e.stopPropagation();

  // 1. Tampilkan Konfirmasi
  const result = await Swal.fire({
    title: "Hapus Perangkat?",
    text: `Seluruh data chat dan koneksi untuk "${deviceName || sessionId}" akan dihapus permanen.`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#EF4444", // Warna merah Tailwind (destructive)
    cancelButtonColor: "#374151", // Warna abu-abu gelap
    confirmButtonText: "Ya, Hapus!",
    cancelButtonText: "Batal",
    background: "#202C33",
    color: "#E9EDEF",
    // Menambahkan backdrop filter agar lebih cantik (opsional)
    backdrop: `rgba(0,0,0,0.4)`
  });

  // 2. Jika User Klik "Ya"
  if (result.isConfirmed) {
    const loadingToast = toast.loading("Sedang menghapus sesi...");
    
    try {
      await deleteSession(sessionId);
      
      // Berikan feedback sukses
      toast.success(`Sesi "${deviceName || sessionId}" berhasil dihapus`, { 
        id: loadingToast 
      });

      // Tips: Jika Anda menggunakan state lokal atau React Query, 
      // jangan lupa untuk refresh/invalidate data di sini agar UI terupdate.
      
    } catch (err: any) {
      // Tangani error jika API gagal
      toast.error(`Gagal menghapus: ${err.message || 'Terjadi kesalahan'}`, { 
        id: loadingToast 
      });
    }
  }
};

  const isConnected = activeSession?.status === "connected";
  const currentSessionId =
    selectedChat?.session_id || activeSession?.id || "default";
  const isGroupTab = activeTab === "groups";

  return (
    <div className="h-screen bg-[#0B141A] text-[#E9EDEF] flex overflow-hidden font-sans relative">
      <Toaster position="bottom-right" />

      {/* OVERLAY MOBILE */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR RAIL */}
      <aside
        className={`
        fixed md:relative z-50 flex flex-col w-[68px] h-full bg-[#202C33] border-r border-[#313D45] py-5 items-center justify-between 
        transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}
      >
        <div className="flex flex-col gap-6 items-center w-full">
          <div className="w-10 h-10 bg-[#00a884] rounded-xl flex items-center justify-center shadow-lg shadow-[#00a884]/20 mb-2">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>

          <div className="flex flex-col gap-3 w-full items-center">
            <NavButton
              icon={<BarChart2 className="w-5 h-5" />}
              active={activeTab === "dashboard"}
              onClick={() => {
                setActiveTab("dashboard");
                setIsSidebarOpen(false);
              }}
              title="Dashboard"
            />
            <NavButton
              icon={<LayoutDashboard className="w-5 h-5" />}
              active={activeTab === "chats"}
              onClick={() => {
                setActiveTab("chats");
                setIsSidebarOpen(false);
              }}
              title="Chat"
            />
            <NavButton
              icon={<Inbox className="w-5 h-5" />}
              active={activeTab === "all-messages"}
              onClick={() => {
                setActiveTab("all-messages");
                setIsSidebarOpen(false);
              }}
              title="Global Inbox"
            />
            <NavButton
              icon={<Users className="w-5 h-5" />}
              active={activeTab === "groups"}
              onClick={() => {
                setActiveTab("groups");
                setIsSidebarOpen(false);
              }}
              title="Grup"
            />
            <div className="w-8 h-[1px] bg-[#313D45] my-2" />
            <NavButton
              icon={<PlusCircle className="w-5 h-5" />}
              active={activeTab === "devices"}
              onClick={() => {
                setActiveTab("devices");
                setIsSidebarOpen(false);
              }}
              title="Perangkat"
            />
          </div>
        </div>

        <div className="flex flex-col gap-5 items-center">
          {!isConnected && activeSession && (
            <button
              onClick={() => setShowQRModal(true)}
              className="p-3 text-orange-400 animate-pulse"
            >
              <QrCode className="w-6 h-6" />
            </button>
          )}
          <button className="p-3 text-[#8696A0] hover:text-white transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex flex-1 overflow-hidden relative">
        {activeTab === "dashboard" ? (
          /* 1. TAMPILAN DASHBOARD (FULL SCREEN) */
          <div className="flex flex-1 overflow-hidden relative">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden absolute top-4 left-4 z-40 p-2 bg-[#202C33] rounded-lg border border-[#313D45] text-[#00a884]"
            >
              <Menu size={20} />
            </button>
            <StatDashboard stats={stats} />
          </div>
        ) : activeTab === "groups" ? (
          /* 2. TAMPILAN GRUP (FULL SCREEN) */
          <div className="flex flex-1 overflow-hidden relative">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden absolute top-4 left-4 z-40 p-2 bg-[#202C33] rounded-lg border border-[#313D45] text-[#00a884]"
            >
              <Menu size={20} />
            </button>
            <GroupsPage sessionId={currentSessionId} />
          </div>
        ) : (
          /* 3. TAMPILAN STANDAR (LEFT LIST + RIGHT CHAT) */
          <>
            {/* LEFT COLUMN: List Chat, Inbox, Devices, Stats Panel */}
            <section
              className={`
          ${mobileView === "chat" ? "hidden" : "flex"}
          md:flex flex-col w-full md:w-[380px] lg:w-[420px]
          bg-[#111B21] border-r border-[#222d34] z-20
        `}
            >
              {/* HEADER MOBILE UNTUK LIST */}
              <div className="md:hidden flex items-center p-4 border-b border-[#222d34] bg-[#202C33] gap-4">
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-1 text-[#00a884]"
                >
                  <Menu size={24} />
                </button>
                <h1 className="font-bold text-lg capitalize">{activeTab}</h1>
              </div>

              <div className="flex-1 overflow-hidden flex flex-col">
                {activeTab === "all-messages" && <GlobalInboxView />}

                {activeTab === "chats" &&
                  (isConnected ? (
                    <ChatList sessionId={activeSession?.id || ""} />
                  ) : (
                    <NoSessionSelected
                      onManageDevices={() => setActiveTab("devices")}
                    />
                  ))}

                {activeTab === "stats" && <StatsPanel stats={stats} />}

                {activeTab === "devices" && (
                  <DevicePanel
                    sessions={sessions}
                    activeId={activeSession?.id}
                    onAdd={handleAddNewDevice}
                    onSelect={handleSwitchDevice}
                    onDelete={handleDeleteDevice}
                  />
                )}
              </div>
            </section>

            {/* RIGHT COLUMN: Jendela Chat Aktif */}
            <section
              className={`
          ${mobileView === "list" ? "hidden" : "flex"}
          md:flex flex-1 flex-col bg-[#0B141A] z-10
        `}
            >
              <ChatWindow
                sessionId={currentSessionId}
                onBack={() => setMobileView("list")}
              />
            </section>
          </>
        )}
      </main>

      {/* MODALS */}
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

// --- Sub-Components ---

const NavButton = ({ icon, active, onClick, title }: any) => (
  <button
    onClick={onClick}
    title={title}
    className={`
      group relative flex items-center justify-center w-12 h-12 rounded-xl transition-all
      ${
        active
          ? "bg-[#374248] text-[#00a884]"
          : "text-[#8696A0] hover:bg-[#374248] hover:text-[#E9EDEF]"
      }
    `}
  >
    {icon}
    <div
      className={`absolute left-0 w-1 h-5 bg-[#00a884] rounded-r-full transition-transform ${
        active ? "scale-100" : "scale-0"
      }`}
    />
  </button>
);

const DevicePanel = ({
  sessions,
  activeId,
  onAdd,
  onSelect,
  onDelete,
}: any) => (
  <div className="flex-1 bg-[#111B21] flex flex-col overflow-hidden">
    <div className="p-6 border-b border-[#222d34] flex items-center justify-between">
      <div>
        <h2 className="text-xl font-bold">Perangkat</h2>
        <p className="text-[#8696A0] text-xs">Kelola akun WhatsApp Anda</p>
      </div>
      <button
        onClick={onAdd}
        className="p-2 bg-[#00a884] text-[#0B141A] rounded-lg hover:bg-[#00c99d] transition-colors"
      >
        <PlusCircle className="w-5 h-5" />
      </button>
    </div>

    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
      {sessions?.map((session: any) => (
        <div
          key={session.id}
          onClick={() => onSelect(session)}
          className={`
            p-4 rounded-xl border cursor-pointer transition-all group relative
            ${
              session.id === activeId
                ? "bg-[#2A3942] border-[#00a884]"
                : "bg-[#202C33] border-[#313D45] hover:border-[#41525d]"
            }
          `}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-lg ${
                  session.status === "connected"
                    ? "bg-[#00a884]/10 text-[#00a884]"
                    : "bg-red-500/10 text-red-500"
                }`}
              >
                <Smartphone size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold truncate max-w-[150px]">
                  {session.name || "Unnamed Device"}
                </p>
                <p className="text-[11px] text-[#8696A0]">
                  {session.phone_number || "Disconnected"}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <span
                className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  session.status === "connected"
                    ? "bg-[#00a884]/20 text-[#00a884]"
                    : "bg-orange-500/10 text-orange-500"
                }`}
              >
                {session.status}
              </span>
              <button
                onClick={(e) => onDelete(e, session.id, session.name)}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-[#8696A0] hover:text-red-500 rounded-md transition-all"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const StatsPanel = ({ stats }: any) => (
  <div className="flex-1 bg-[#111B21] p-6 overflow-y-auto custom-scrollbar">
    <h2 className="text-xl font-bold mb-6">Statistik</h2>
  </div>
);
