import React from "react";
import {
  MessageSquare,
  ShieldCheck,
  UserPlus,
  BarChart2,
  LayoutDashboard,
  Inbox,
  Users,
  PlusCircle,
  LogOut,
  Settings,
  UserSearch, // Icon tambahan untuk Leads
} from "lucide-react";
import NavButton from "./NavButton";

interface SidebarProps {
  user: any;
  isSystemAdmin: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  user,
  isSystemAdmin,
  activeTab,
  setActiveTab,
  onLogout,
  isSidebarOpen,
  setIsSidebarOpen,
}) => {
  const canSeeGlobalInbox =
    user?.role_type === "system" || user?.role_type === "manager";
  const canSeeDashboard =
    user?.role_type === "system" || user?.role_type === "custom";

  const handleNavClick = (tab: string) => {
    setActiveTab(tab);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed md:relative z-50 flex flex-col w-[68px] h-full bg-[#202C33] border-r border-[#313D45] py-5 items-center justify-between 
          transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <div className="flex flex-col gap-4 items-center w-full">
          {/* LOGO UTAMA */}
          <button
            onClick={() => {
              window.location.reload();
              setIsSidebarOpen(false);
            }}
            className="w-10 h-10 bg-[#00a884] rounded-xl flex items-center justify-center shadow-lg shadow-[#00a884]/20 mb-4 hover:bg-[#00c99d] transition-all active:scale-95"
            title="Satu Pintu Home"
          >
            <MessageSquare className="w-6 h-6 text-white" />
          </button>

          <div className="flex flex-col gap-3 w-full items-center">
            {/* GROUP 1: STAFF MANAGEMENT */}
            {(isSystemAdmin || user?.role_type === "manager") && (
              <>
                <div className="flex flex-col items-center w-full gap-1">
                  <span className="text-[9px] font-bold text-[#54656f] mb-1 uppercase tracking-widest text-center">
                    Staff
                  </span>
                  {isSystemAdmin && (
                    <NavButton
                      icon={<ShieldCheck className="w-5 h-5" />}
                      active={activeTab === "role-management"}
                      onClick={() => handleNavClick("role-management")}
                      title="Manajemen Role"
                    />
                  )}
                  <NavButton
                    icon={<UserPlus className="w-5 h-5" />}
                    active={activeTab === "user-management"}
                    onClick={() => handleNavClick("user-management")}
                    title="Kelola User/Admin"
                  />
                </div>
                <div className="w-8 h-[1px] bg-[#313D45] my-1" />
              </>
            )}

            {/* GROUP 2: MONITORING */}
            {canSeeDashboard && (
              <NavButton
                icon={<BarChart2 className="w-5 h-5" />}
                active={activeTab === "dashboard"}
                onClick={() => handleNavClick("dashboard")}
                title="Dashboard Statistik"
              />
            )}

            {/* GROUP 3: CHAT & MESSAGING */}
            <div className="flex flex-col gap-2 items-center">
              <NavButton
                icon={<LayoutDashboard className="w-5 h-5" />}
                active={activeTab === "chats"}
                onClick={() => handleNavClick("chats")}
                title="Chat WhatsApp"
              />

              {/* MENU BARU: LEADS ONLY */}
              <NavButton
                icon={<UserSearch className="w-5 h-5 text-orange-400" />}
                active={activeTab === "leads-only"}
                onClick={() => handleNavClick("leads-only")}
                title="Pesan Leads Baru (Non-Kontak)"
              />

              {canSeeGlobalInbox && (
                <NavButton
                  icon={<Inbox className="w-5 h-5" />}
                  active={activeTab === "all-messages"}
                  onClick={() => handleNavClick("all-messages")}
                  title="Riwayat Pesan Global"
                />
              )}

              <NavButton
                icon={<Users className="w-5 h-5" />}
                active={activeTab === "groups"}
                onClick={() => handleNavClick("groups")}
                title="Manajemen Grup"
              />
            </div>

            <div className="w-8 h-[1px] bg-[#313D45] my-1" />

            {/* GROUP 4: DEVICES */}
            <NavButton
              icon={<PlusCircle className="w-5 h-5 text-emerald-400" />}
              active={activeTab === "devices"}
              onClick={() => handleNavClick("devices")}
              title="Tambah Perangkat"
            />
          </div>
        </div>

        {/* BAGIAN BAWAH */}
        <div className="flex flex-col gap-4 items-center pb-6">
          {isSystemAdmin && (
            <div
              onClick={() => handleNavClick("settings")}
              className={`w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-colors group ${
                activeTab === "settings"
                  ? "bg-[#00a884]/20"
                  : "hover:bg-[#313D45]"
              }`}
            >
              <Settings
                className={`w-5 h-5 transition-colors ${
                  activeTab === "settings"
                    ? "text-[#00a884]"
                    : "text-[#8696A0] group-hover:text-white"
                }`}
              />
            </div>
          )}

          <button
            onClick={() => {
              onLogout();
              setIsSidebarOpen(false);
            }}
            className="w-10 h-10 rounded-xl hover:bg-red-500/10 flex items-center justify-center cursor-pointer transition-colors group"
            title="Keluar Aplikasi"
          >
            <LogOut className="w-5 h-5 text-[#8696A0] group-hover:text-red-500 transition-colors" />
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
