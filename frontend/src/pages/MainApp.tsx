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
  Menu,
  LogOut,
  ShieldCheck,
  UserPlus, // Icon Menu untuk Mobile
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


// 1. Sesuaikan Interface
interface UserData {
  id: number;
  username: string;
  role_type: 'system' | 'manager' | 'custom'; 
  branch: string;
}

// Tambahkan interface props di atas komponen


export const MainApp: React.FC<{ user: UserData; onLogout: () => void }> = ({ user, onLogout }) => {
  // DEBUG: Buka inspect element di browser dan cek console
  console.log("Data User Login:", user);
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
  | "chats"
  | "stats"
  | "devices"
  | "all-messages"
  | "groups"
  | "dashboard"
  | "role-management"
  | "user-management"
>(
  user?.role_type === 'system' || user?.role_type === 'manager' 
    ? "dashboard" 
    : "chats"
);

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



  // Cek apakah user adalah System atau Manager
const canSeeDashboard = user?.role_type === 'system' || user?.role_type === 'manager';
const canDashboad = user?.role_type === 'system' || user?.role_type === 'custom';
const isSystemAdmin = user?.role_type === 'system';
  // logout
  // Fungsi untuk Logout dari Sistem/Aplikasi
  const handleSystemLogout = async () => {
    const result = await Swal.fire({
      title: "Keluar Aplikasi?",
      text: "Anda akan diarahkan kembali ke halaman login.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#00a884",
      cancelButtonColor: "#313D45",
      confirmButtonText: "Ya, Keluar",
      cancelButtonText: "Batal",
      background: "#202C33",
      color: "#E9EDEF",
    });

    if (result.isConfirmed) {
      toast.success("Berhasil keluar");
      // Menunggu sebentar agar toast terlihat sebelum redirect
      setTimeout(() => {
        onLogout(); 
      }, 800);
    }
  };

  const handleReconnect = async (sessionId: string) => {
    try {
      // 1. Tampilkan loading toast agar user tahu proses dimulai
      const loadingToast = toast.loading("Menyiapkan koneksi WhatsApp...");

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/sessions/reconnect/${sessionId}`,
        {
          method: "POST",
        },
      );
      const data = await res.json();

      if (data.success) {
        toast.success("Silakan scan QR Code yang muncul", { id: loadingToast });

        // 2. TENTUKAN SESSION YANG AKAN DI-SCAN
        // Ini agar QRModal tahu ID mana yang harus didengarkan socket-nya
        setAddDeviceSessionId(sessionId);

        // 3. PAKSA MODAL QR TERBUKA
        setShowQRModal(true);

        // 4. Refresh list agar status di UI berubah jadi 'connecting'
        fetchSessions();
      } else {
        toast.error(data.message || "Gagal reconnect", { id: loadingToast });
      }
    } catch (error) {
      toast.error("Gagal melakukan reconnect");
    }
  };
  const handleLogout = async (sessionId: string) => {
    if (
      !confirm(
        "Apakah Anda yakin ingin logout? Koneksi di ponsel akan terputus.",
      )
    )
      return;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/sessions/logout/${sessionId}`,
        {
          method: "POST",
        },
      );
      const data = await res.json();

      if (data.success) {
        toast.success("Berhasil logout dari WhatsApp");
        fetchSessions(); // Refresh list agar status berubah jadi disconnected
      } else {
        toast.error(data.message || "Gagal logout");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan koneksi");
    }
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
      backdrop: `rgba(0,0,0,0.4)`,
    });

    // 2. Jika User Klik "Ya"
    if (result.isConfirmed) {
      const loadingToast = toast.loading("Sedang menghapus sesi...");

      try {
        await deleteSession(sessionId);

        // Berikan feedback sukses
        toast.success(`Sesi "${deviceName || sessionId}" berhasil dihapus`, {
          id: loadingToast,
        });

        // Tips: Jika Anda menggunakan state lokal atau React Query,
        // jangan lupa untuk refresh/invalidate data di sini agar UI terupdate.
      } catch (err: any) {
        // Tangani error jika API gagal
        toast.error(`Gagal menghapus: ${err.message || "Terjadi kesalahan"}`, {
          id: loadingToast,
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

<aside
  className={`
    fixed md:relative z-50 flex flex-col w-[68px] h-full bg-[#202C33] border-r border-[#313D45] py-5 items-center justify-between 
    transition-transform duration-300 ease-in-out
    ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
  `}
>
  <div className="flex flex-col gap-4 items-center w-full">
    {/* LOGO UTAMA */}
    <button
      onClick={() => window.location.reload()}
      className="w-10 h-10 bg-[#00a884] rounded-xl flex items-center justify-center shadow-lg shadow-[#00a884]/20 mb-4 hover:bg-[#00c99d] transition-all active:scale-95"
      title="Satu Pintu Home"
    >
      <MessageSquare className="w-6 h-6 text-white" />
    </button>

    <div className="flex flex-col gap-3 w-full items-center">
      
      {/* GROUP 1: ADMIN & USER MANAGEMENT */}
      {/* Manager biasanya boleh akses User Management untuk mendaftarkan CS/Admin-nya sendiri */}
      {(isSystemAdmin || user?.role_type === 'manager') && (
        <>
          <div className="flex flex-col items-center w-full gap-1">
            <span className="text-[9px] font-bold text-[#54656f] mb-1 uppercase tracking-widest text-center">
              Staff
            </span>
            {/* Role Management mungkin tetap HANYA untuk System Admin */}
            {isSystemAdmin && (
              <NavButton
                icon={<ShieldCheck className="w-5 h-5" />}
                active={activeTab === "role-management"}
                onClick={() => setActiveTab("role-management")}
                title="Manajemen Role"
              />
            )}
            <NavButton
              icon={<UserPlus className="w-5 h-5" />}
              active={activeTab === "user-management"}
              onClick={() => setActiveTab("user-management")}
              title="Kelola User/Admin"
            />
          </div>
          <div className="w-8 h-[1px] bg-[#313D45] my-1" />
        </>
      )}

      {/* GROUP 2: MONITORING - Sekarang bisa diakses Manager */}
      {canDashboad && (
        <NavButton
          icon={<BarChart2 className="w-5 h-5" />}
          active={activeTab === "dashboard"}
          onClick={() => setActiveTab("dashboard")}
          title="Dashboard Statistik"
        />
      )}

      {/* GROUP 3: CHAT & MESSAGING */}
      <div className="flex flex-col gap-2 items-center">
        <NavButton
          icon={<LayoutDashboard className="w-5 h-5" />}
          active={activeTab === "chats"}
          onClick={() => setActiveTab("chats")}
          title="Chat WhatsApp"
        />
        
        {/* Riwayat Pesan Global: Manager juga butuh ini untuk memantau chat staffnya */}
        {canSeeDashboard && (
          <NavButton
            icon={<Inbox className="w-5 h-5" />}
            active={activeTab === "all-messages"}
            onClick={() => setActiveTab("all-messages")}
            title="Riwayat Pesan Global"
          />
        )}

        <NavButton
          icon={<Users className="w-5 h-5" />}
          active={activeTab === "groups"}
          onClick={() => setActiveTab("groups")}
          title="Manajemen Grup"
        />
      </div>

      <div className="w-8 h-[1px] bg-[#313D45] my-1" />

      {/* GROUP 4: SYSTEM / DEVICES */}
      <NavButton
        icon={<PlusCircle className="w-5 h-5 text-emerald-400" />}
        active={activeTab === "devices"}
        onClick={() => setActiveTab("devices")}
        title="Tambah Perangkat"
      />
    </div>
  </div>
{/* 
  BAGIAN BAWAH: STATUS & SETTINGS */}
  <div className="flex flex-col gap-4 items-center pb-6">
    {isSystemAdmin && (
      <div className="w-10 h-10 rounded-xl hover:bg-[#313D45] flex items-center justify-center cursor-pointer transition-colors group">
        {/* <Settings className="w-5 h-5 text-[#8696A0] group-hover:text-white transition-colors" /> */}
      </div>
    )}

    <button
      onClick={handleSystemLogout}
      className="w-10 h-10 rounded-xl hover:bg-red-500/10 flex items-center justify-center cursor-pointer transition-colors group"
      title="Keluar Aplikasi"
    >
      <LogOut className="w-5 h-5 text-[#8696A0] group-hover:text-red-500 transition-colors" />
    </button>
  </div>
</aside>
      {/* MAIN CONTENT AREA */}
      <main className="flex flex-1 overflow-hidden relative">
        {/* 1. TAMPILAN FULL SCREEN (Dashboard, Groups, Role, User Management) */}
        {activeTab === "dashboard" ||
          activeTab === "groups" ||
          activeTab === "role-management" ||
          activeTab === "user-management" ? (
          <div className="flex flex-1 overflow-hidden relative">
            {/* Tombol Menu untuk Mobile */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden absolute top-4 left-4 z-40 p-2 bg-[#202C33] rounded-lg border border-[#313D45] text-[#00a884]"
            >
              <Menu size={20} />
            </button>

            {/* Konten berdasarkan Tab */}
            {activeTab === "dashboard" && <StatDashboard stats={stats} />}
            {activeTab === "groups" && (
              <GroupsPage sessionId={currentSessionId} />
            )}
            {activeTab === "role-management" && <RoleManagementView />}
            {activeTab === "user-management" && <UserManagementView />}
          </div>
        ) : (
          /* 2. TAMPILAN STANDAR (LEFT LIST + RIGHT CHAT) */
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
                    onReconnect={handleReconnect}
                    onLogout={handleLogout}
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
      ${active
        ? "bg-[#374248] text-[#00a884]"
        : "text-[#8696A0] hover:bg-[#374248] hover:text-[#E9EDEF]"
      }
    `}
  >
    {icon}
    <div
      className={`absolute left-0 w-1 h-5 bg-[#00a884] rounded-r-full transition-transform ${active ? "scale-100" : "scale-0"
        }`}
    />
  </button>
);

import { RefreshCw } from "lucide-react"; // Tambahkan RefreshCw
import RoleManagementView from "../components/RoleManagementView";
import UserManagementView from "../components/UserManagementView";

const DevicePanel = ({
  sessions = [], // Beri default array kosong agar tidak error .length
  activeId,
  onAdd,
  onSelect,
  onDelete,
  onReconnect,
  onLogout,
  user,
}: any) => {

  // KUNCI PERBAIKAN: 
  // Kita tidak perlu memfilter lagi di sini karena Backend sudah memfilter lewat SQL.
  // Cukup gunakan sessions yang diterima dari props.
  const displaySessions = sessions;

  return (
    <div className="flex-1 bg-[#111B21] flex flex-col overflow-hidden">
      {/* Header Panel */}
      <div className="p-6 border-b border-[#222d34] flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Perangkat</h2>
          <p className="text-[#8696A0] text-xs">
            {user?.role_type === 'system' 
              ? "Semua perangkat sistem aktif" 
              : `Perangkat milik ${user?.full_name || 'Staff'}`}
          </p>
        </div>
        <button
          onClick={onAdd}
          className="p-2 bg-[#00a884] text-[#0B141A] rounded-lg hover:bg-[#00c99d] transition-colors"
        >
          <PlusCircle className="w-5 h-5" />
        </button>
      </div>

      {/* List Perangkat */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {displaySessions && displaySessions.length > 0 ? (
          displaySessions.map((session: any) => (
            <div
              key={session.id}
              onClick={() => onSelect(session)}
              className={`
                p-4 rounded-xl border cursor-pointer transition-all group relative
                ${session.id === activeId
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
                      {session.name || "Perangkat Tanpa Nama"}
                    </p>
                    <p className="text-[11px] text-[#8696A0]">
                      {session.phone_number || "Belum Terhubung"}
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

                  {/* Tombol Aksi */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    {session.status !== "connected" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onReconnect(session.id);
                        }}
                        className="p-1.5 text-[#8696A0] hover:text-[#00a884] hover:bg-[#111B21] rounded-md"
                      >
                        <RefreshCw size={16} />
                      </button>
                    )}

                    {session.status === "connected" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onLogout(session.id);
                        }}
                        className="p-1.5 text-[#8696A0] hover:text-orange-500 hover:bg-[#111B21] rounded-md"
                      >
                        <LogOut size={16} />
                      </button>
                    )}

                    <button
                      onClick={(e) => onDelete(e, session.id, session.name)}
                      className="p-1.5 text-[#8696A0] hover:text-red-500 hover:bg-[#111B21] rounded-md"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10">
            <div className="bg-[#202C33] w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <Smartphone className="text-[#8696A0] w-6 h-6" />
            </div>
            <p className="text-[#8696A0] text-sm">Belum ada perangkat yang tertaut.</p>
            <p className="text-[#8696A0] text-[10px] mt-1">Gunakan tombol + untuk menambah.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DevicePanel;

const StatsPanel = ({ stats }: any) => (
  <div className="flex-1 bg-[#111B21] p-6 overflow-y-auto custom-scrollbar">
    <h2 className="text-xl font-bold mb-6">Statistik</h2>
  </div>
);
