import React, { useState } from "react";
import {
  MessageSquare,
  ShieldCheck,
  UserPlus,
  BarChart2,
  LogOut,
  Settings,
  UserSearch,
  KeyRound,
  Link2,
  Bot,
  FileText,
  ChevronLeft,
  ChevronRight,
  Users,
  Smartphone,
  Video,
} from "lucide-react";

interface SidebarProps {
  user: any;
  isSystemAdmin: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
}

interface MenuItem {
  id: string;
  title: string;
  icon: React.ReactNode;
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
  const [collapsed, setCollapsed] = useState(false);

  const canManageMarketing = user?.role_type === "system" || user?.role_type === "manager";
  const isTikTokOperator = user?.role_type === "tiktok_operator";

  const handleNavClick = (tab: string) => {
    setActiveTab(tab);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const isActive = (id: string) => activeTab === id;

  const groups: { id: string; label: string; items: MenuItem[] }[] = isTikTokOperator
    ? [{
        id: "tiktok",
        label: "Laporan Live",
        items: [
          { id: "tiktok-live-report", title: "Laporan Live", icon: <Video className="w-[18px] h-[18px]" /> },
        ],
      }]
    : [
      {
        id: "whatsapp",
        label: "Pengelolaan WhatsApp",
        items: [
          ...(!canManageMarketing && !isSystemAdmin ? [{ id: "dashboard", title: "Dashboard", icon: <BarChart2 className="w-[18px] h-[18px]" /> }] : []),
          { id: "leads-only", title: "Leads Baru", icon: <UserSearch className="w-[18px] h-[18px]" /> },
          { id: "chats", title: "Chat WA", icon: <MessageSquare className="w-[18px] h-[18px]" /> },
          { id: "all-messages", title: "Global Inbox", icon: <BarChart2 className="w-[18px] h-[18px]" /> },
          { id: "groups", title: "Grup", icon: <Users className="w-[18px] h-[18px]" /> },
          { id: "devices", title: "Perangkat", icon: <Smartphone className="w-[18px] h-[18px]" /> },
        ],
      },
      ...(canManageMarketing
        ? [{
            id: "marketing",
            label: "Marketing & Analitik",
            items: [
              { id: "dashboard", title: "Dashboard", icon: <BarChart2 className="w-[18px] h-[18px]" /> },
              { id: "keyword-management", title: "Kata Kunci Pengikat", icon: <KeyRound className="w-[18px] h-[18px]" /> },
              { id: "link-rotator", title: "Rotator Tautan", icon: <Link2 className="w-[18px] h-[18px]" /> },
              { id: "ai-setting", title: "Asisten AI", icon: <Bot className="w-[18px] h-[18px]" /> },
              { id: "leads-report", title: "Laporan Performa", icon: <FileText className="w-[18px] h-[18px]" /> },
              { id: "tiktok-live-report", title: "Laporan Live", icon: <Video className="w-[18px] h-[18px]" /> },
            ],
          }]
        : []),
      ...((isSystemAdmin || user?.role_type === "manager")
        ? [{
            id: "admin",
            label: "Pengaturan & Manajemen",
            items: [
              ...(isSystemAdmin ? [{ id: "role-management", title: "Hak Akses & Role", icon: <ShieldCheck className="w-[18px] h-[18px]" /> }] : []),
              { id: "user-management", title: "Manajemen Anggota", icon: <UserPlus className="w-[18px] h-[18px]" /> },
              ...(isSystemAdmin ? [{ id: "settings", title: "Konfigurasi Sistem", icon: <Settings className="w-[18px] h-[18px]" /> }] : []),
            ],
          }]
        : []),
    ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 md:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed md:relative z-50 flex flex-col h-screen bg-[#FFFFFF] border-r border-[#E4E6EB]
          transition-all duration-200 ease-in-out select-none
          ${collapsed ? "w-[60px]" : "w-[240px]"}
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Meta Style Collapse Trigger Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex absolute -right-[12px] top-6 z-50 w-6 h-6 bg-white border border-[#E4E6EB] rounded-full items-center justify-center text-[#65676B] hover:text-[#050505] hover:bg-[#F2F3F5] shadow-xs hover:shadow-md transition-all duration-150"
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>

        {/* Brand / Header Section */}
        <div className={`flex items-center h-[56px] border-b border-[#F0F2F5] ${collapsed ? "justify-center" : "px-4"}`}>
          <button
            onClick={() => { window.location.reload(); setIsSidebarOpen(false); }}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="w-8 h-8 bg-[#0866FF] rounded-lg flex items-center justify-center shrink-0 shadow-xs transition-transform group-hover:scale-[1.02]">
              <MessageSquare className="w-4 h-4 text-white fill-current" />
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-[#050505] tracking-tight truncate leading-tight">
                  Satu Pintu
                </span>
                <span className="text-[10px] text-[#65676B] font-normal truncate leading-none mt-0.5">
                  Business Suite
                </span>
              </div>
            )}
          </button>
        </div>

        {/* Menu Navigation Items */}
        <div className="flex-1 px-2 py-2 space-y-4 overflow-y-auto overflow-x-hidden scrollbar-none">
          {groups.map((group) => (
            <div key={group.id} className="space-y-0.5">
              {/* Section Header Label */}
              {!collapsed && (
                <div className="px-3 pt-2 pb-1 text-[11px] font-medium text-[#65676B] tracking-wide truncate">
                  {group.label}
                </div>
              )}

              {/* Group Items */}
              <div className="space-y-[2px]">
                {group.items.map((item) => {
                  const active = isActive(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      title={collapsed ? item.title : undefined}
                      className={`
                        w-full flex items-center gap-3 rounded-lg relative transition-all duration-150 group
                        ${collapsed ? "justify-center h-10 w-10 mx-auto" : "px-3 h-9"}
                        ${active
                          ? "bg-[#E7F3FF] text-[#0866FF] font-medium"
                          : "text-[#050505] hover:bg-[#F2F3F5]"
                        }
                      `}
                    >
                      {/* Active Left Indicator Bar (Meta Style Accent) */}
                      {active && !collapsed && (
                        <div className="absolute left-0 top-2 bottom-2 w-1 bg-[#0866FF] rounded-r-md" />
                      )}

                      {/* Icon Container */}
                      <span className={`shrink-0 transition-colors ${active ? "text-[#0866FF]" : "text-[#65676B] group-hover:text-[#050505]"}`}>
                        {item.icon}
                      </span>

                      {/* Item Title Text */}
                      {!collapsed && (
                        <span className="text-[13px] tracking-normal truncate transition-transform duration-150">
                          {item.title}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Section / Action Area */}
        <div className="p-2 border-t border-[#F0F2F5] bg-[#FFFFFF]">
          <button
            onClick={() => { onLogout(); setIsSidebarOpen(false); }}
            title={collapsed ? "Keluar Aplikasi" : undefined}
            className={`
              flex items-center gap-3 rounded-lg transition-all duration-150 text-[#1E3A5F] hover:text-[#0D2137] hover:bg-[#E8EEF5]
              ${collapsed ? "justify-center h-10 w-10 mx-auto" : "w-full px-3 h-10"}
            `}
          >
            <span className="shrink-0 text-[#1E3A5F]">
              <LogOut className="w-[18px] h-[18px]" />
            </span>
            {!collapsed && (
              <div className="flex flex-col items-start text-left min-w-0 leading-tight">
                <span className="text-[13px] font-medium text-[#1E3A5F] truncate">
                  Keluar Aplikasi?
                </span>
                
              </div>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;