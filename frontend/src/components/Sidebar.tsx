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
  UserSearch,
  KeyRound,
  Link2,
  Bot, // Ikon baru untuk AI
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
    user?.role_type === "system" || user?.role_type === "manager" || user?.role_type === "custom";
  
  // Admin/Manager bisa kelola Marketing & AI
  const canManageMarketing = 
    user?.role_type === "system" || user?.role_type === "manager";

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
          fixed md:relative z-50 flex flex-col w-[68px] h-screen md:h-full bg-white border-r border-gray-200 py-5
          transition-transform duration-300 ease-in-out shadow-lg md:shadow-none
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* SCROLLABLE TOP SECTION */}
        <div className="flex-1 flex flex-col gap-4 items-center overflow-y-auto custom-scrollbar">
          {/* LOGO UTAMA */}
          <button
            onClick={() => {
              window.location.reload();
              setIsSidebarOpen(false);
            }}
            className="w- h-10  rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4 hover:shadow-blue-500/30 transition-all active:scale-95"
            title="Satu Pintu Home"
          >
            <MessageSquare className="w-6 h-6 p-2 text-blue" />
          </button>

          <div className="flex flex-col gap-3 w-full items-center">
            {/* GROUP 1: STAFF MANAGEMENT */}
            {(isSystemAdmin || user?.role_type === "manager") && (
              <>
                <div className="flex flex-col items-center w-full gap-1">
                  <span className="text-[9px] font-bold text-gray-400 mb-1 uppercase tracking-widest text-center">
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
                <div className="w-8 h-[1px] bg-gray-200 my-1" />
              </>
            )}

            {/* GROUP 2: MONITORING, MARKETING & AI */}
            {canSeeDashboard && (
              <div className="flex flex-col gap-2 items-center">
                <NavButton
                  icon={<BarChart2 className="w-5 h-5" />}
                  active={activeTab === "dashboard"}
                  onClick={() => handleNavClick("dashboard")}
                  title="Dashboard Statistik"
                />
                
                {canManageMarketing && (
                  <>
                    <NavButton
                      icon={<KeyRound className="w-5 h-5 text-yellow-500" />}
                      active={activeTab === "keyword-management"}
                      onClick={() => handleNavClick("keyword-management")}
                      title="Keyword Leads"
                    />
                    
                    <NavButton
                      icon={<Link2 className="w-5 h-5 text-emerald-400" />}
                      active={activeTab === "link-rotator"}
                      onClick={() => handleNavClick("link-rotator")}
                      title="Link Rotator"
                    />

                    {/* MENU BARU: AI AUTO REPLY */}
                    <NavButton
                      icon={<Bot className="w-5 h-5 text-purple-400" />}
                      active={activeTab === "ai-setting"}
                      onClick={() => handleNavClick("ai-setting")}
                      title="AI Knowledge & Auto Reply"
                    />
                  </>
                )}
              </div>
            )}

            <div className="w-8 h-[1px] bg-gray-200 my-1" />

            {/* GROUP 3: CHAT & MESSAGING */}
            <div className="flex flex-col gap-2 items-center">
              <NavButton
                icon={<LayoutDashboard className="w-5 h-5" />}
                active={activeTab === "chats"}
                onClick={() => handleNavClick("chats")}
                title="Chat WhatsApp"
              />

              <NavButton
                icon={<UserSearch className="w-5 h-5 text-orange-400" />}
                active={activeTab === "leads-only"}
                onClick={() => handleNavClick("leads-only")}
                title="Pesan Leads Baru"
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

            <div className="w-8 h-[1px] bg-gray-200 my-1" />

            {/* GROUP 4: DEVICES */}
            <NavButton
              icon={<PlusCircle className="w-5 h-5 text-emerald-400" />}
              active={activeTab === "devices"}
              onClick={() => handleNavClick("devices")}
              title="Tambah Perangkat"
            />
          </div>
        </div>

        {/* FIXED BOTTOM SECTION */}
        <div className="flex flex-col gap-4 items-center pt-4 pb-6 mt-auto">
          {isSystemAdmin && (
            <div
              onClick={() => handleNavClick("settings")}
              className={`w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-colors group ${
                activeTab === "settings" ? "bg-blue-100" : "hover:bg-gray-100"
              }`}
            >
              <Settings
                className={`w-5 h-5 transition-colors ${
                  activeTab === "settings" ? "text-blue-600" : "text-gray-400 group-hover:text-gray-700"
                }`}
              />
            </div>
          )}

          <button
            onClick={() => {
              onLogout();
              setIsSidebarOpen(false);
            }}
            className="w-10 h-10 rounded-xl hover:bg-red-50 flex items-center justify-center cursor-pointer transition-colors group"
            title="Keluar Aplikasi"
          >
            <LogOut className="w-5 h-5 text-gray-400 group-hover:text-red-500 transition-colors" />
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;