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
  ChevronDown,
  Users,
  Smartphone,
  MessageCircle,
} from "lucide-react";

// Hidden Icons (TikTok, Instagram, Facebook)
/*
const WhatsAppIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);
*/

const WhatsAppIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

/*
const TikTokIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
  </svg>
);

const InstagramIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const FacebookIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);
*/

interface SidebarProps {
  user: any;
  isSystemAdmin: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
}

interface PlatformGroup {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  activeColor: string;
  tabs: { id: string; title: string; icon: React.ReactNode }[];
  disabled?: boolean;
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
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>("whatsapp");
  const [expandedAdmin, setExpandedAdmin] = useState(false);
  const [expandedMarketing, setExpandedMarketing] = useState(false);

  const canManageMarketing = user?.role_type === "system" || user?.role_type === "manager";

  const handleNavClick = (tab: string) => {
    setActiveTab(tab);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const togglePlatform = (id: string) => {
    setExpandedPlatform(expandedPlatform === id ? null : id);
  };

  const platforms: PlatformGroup[] = [
    {
      id: "whatsapp",
      name: "WhatsApp",
      icon: <WhatsAppIcon className="w-5 h-5" />,
      color: "text-gray-400",
      activeColor: "text-green-500",
      tabs: [
        { id: "leads-only", title: "Leads Baru", icon: <UserSearch className="w-4 h-4" /> },
        { id: "chats", title: "Chat WA", icon: <MessageSquare className="w-4 h-4" /> },
        { id: "all-messages", title: "Global Inbox", icon: <BarChart2 className="w-4 h-4" /> },
        { id: "groups", title: "Grup", icon: <Users className="w-4 h-4" /> },
        { id: "devices", title: "Perangkat", icon: <Smartphone className="w-4 h-4 text-emerald-400" /> },
      ],
    },
    // {
    //   id: "tiktok",
    //   name: "TikTok",
    //   icon: <TikTokIcon className="w-5 h-5" />,
    //   color: "text-gray-400",
    //   activeColor: "text-rose-500",
    //   tabs: [{ id: "tiktok", title: "Kelola", icon: <MessageCircle className="w-4 h-4" /> }],
    //   disabled: false,
    // },
    // {
    //   id: "instagram",
    //   name: "Instagram",
    //   icon: <InstagramIcon className="w-5 h-5" />,
    //   color: "text-gray-400",
    //   activeColor: "text-purple-500",
    //   tabs: [{ id: "instagram", title: "Segera Hadir", icon: <BarChart2 className="w-4 h-4" /> }],
    //   disabled: true,
    // },
    // {
    //   id: "facebook",
    //   name: "Facebook",
    //   icon: <FacebookIcon className="w-5 h-5" />,
    //   color: "text-gray-400",
    //   activeColor: "text-blue-600",
    //   tabs: [{ id: "facebook", title: "Segera Hadir", icon: <BarChart2 className="w-4 h-4" /> }],
    //   disabled: true,
    // },
  ];

  const isActive = (tabs: string[]) => tabs.includes(activeTab);

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
          fixed md:relative z-50 flex flex-col w-[260px] h-screen md:h-full bg-gradient-to-b from-gray-50 to-white border-r border-gray-200
          transition-transform duration-300 ease-in-out shadow-xl md:shadow-none overflow-y-auto custom-scrollbar
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* LOGO HEADER */}
        <div className="px-4 pt-2 pb-6">
          <button
            onClick={() => {
              window.location.reload();
              setIsSidebarOpen(false);
            }}
            className="w-full group"
          >
            <div className="flex items-center gap-3">
              {/* Logo Icon */}
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-all group-hover:scale-105">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              
              {/* Brand Text */}
              <div className="flex flex-col">
                <span className="text-lg font-bold text-gray-900 tracking-tight">Satu Pintu</span>
                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Multi-Platform Hub</span>
              </div>
            </div>
          </button>
        </div>

        <div className="flex-1 px-3 space-y-2">
          {/* PLATFORM DROPDOWNS */}
          {platforms.map((platform) => (
            <div key={platform.id} className="space-y-1">
              <button
                onClick={() => togglePlatform(platform.id)}
                className={`
                  w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all
                  ${isActive(platform.tabs.map(t => t.id)) 
                    ? "bg-blue-50 text-blue-700" 
                    : platform.disabled 
                      ? "opacity-50 cursor-not-allowed" 
                      : "hover:bg-gray-100 text-gray-700"
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive(platform.tabs.map(t => t.id)) ? platform.activeColor : platform.color}>
                    {platform.icon}
                  </span>
                  <span className="font-medium text-sm">{platform.name}</span>
                </div>
                {!platform.disabled && (
                  <ChevronDown 
                    className={`w-4 h-4 transition-transform ${expandedPlatform === platform.id ? "rotate-180" : ""}`} 
                  />
                )}
              </button>

              {expandedPlatform === platform.id && (
                <div className="ml-4 pl-4 border-l-2 border-gray-100 space-y-1">
                  {platform.tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => handleNavClick(tab.id)}
                      disabled={platform.disabled}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all
                        ${activeTab === tab.id 
                          ? "bg-blue-100 text-blue-700 font-medium" 
                          : platform.disabled 
                            ? "text-gray-400 cursor-not-allowed" 
                            : "text-gray-600 hover:bg-gray-50"
                        }
                      `}
                    >
                      <span className={activeTab === tab.id ? "text-blue-600" : "text-gray-400"}>
                        {tab.icon}
                      </span>
                      {tab.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* MARKETING DROPDOWN */}
          {canManageMarketing && (
            <div className="pt-2 border-t border-gray-200 space-y-1">
              <button
                onClick={() => setExpandedMarketing(!expandedMarketing)}
                className={`
                  w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all
                  ${isActive(["dashboard", "keyword-management", "link-rotator", "ai-setting", "leads-report"]) 
                    ? "bg-blue-50 text-blue-700" 
                    : "hover:bg-gray-100 text-gray-700"
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <BarChart2 className={`w-5 h-5 ${isActive(["dashboard", "keyword-management", "link-rotator", "ai-setting", "leads-report"]) ? "text-blue-600" : "text-gray-400"}`} />
                  <span className="font-medium text-sm">Marketing</span>
                </div>
                <ChevronDown 
                  className={`w-4 h-4 transition-transform ${expandedMarketing ? "rotate-180" : ""}`} 
                />
              </button>

              {expandedMarketing && (
                <div className="ml-4 pl-4 border-l-2 border-gray-100 space-y-1">
                  {[
                    { id: "dashboard", title: "Dashboard", icon: <BarChart2 className="w-4 h-4" /> },
                    { id: "keyword-management", title: "Keyword Leads", icon: <KeyRound className="w-4 h-4 text-yellow-500" /> },
                    { id: "link-rotator", title: "Link Rotator", icon: <Link2 className="w-4 h-4 text-emerald-400" /> },
                    { id: "ai-setting", title: "AI Bot", icon: <Bot className="w-4 h-4 text-purple-400" /> },
                    { id: "leads-report", title: "Laporan Leads", icon: <FileText className="w-4 h-4 text-orange-500" /> },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => handleNavClick(tab.id)}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all
                        ${activeTab === tab.id 
                          ? "bg-blue-100 text-blue-700 font-medium" 
                          : "text-gray-600 hover:bg-gray-50"
                        }
                      `}
                    >
                      <span className={activeTab === tab.id ? "text-blue-600" : "text-gray-400"}>
                        {tab.icon}
                      </span>
                      {tab.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ADMIN DROPDOWN */}
          {(isSystemAdmin || user?.role_type === "manager") && (
            <div className="pt-2 border-t border-gray-200 space-y-1">
              <button
                onClick={() => setExpandedAdmin(!expandedAdmin)}
                className={`
                  w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all
                  ${isActive(["role-management", "user-management", "settings"]) 
                    ? "bg-blue-50 text-blue-700" 
                    : "hover:bg-gray-100 text-gray-700"
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck className={`w-5 h-5 ${isActive(["role-management", "user-management", "settings"]) ? "text-blue-600" : "text-gray-400"}`} />
                  <span className="font-medium text-sm">Admin</span>
                </div>
                <ChevronDown 
                  className={`w-4 h-4 transition-transform ${expandedAdmin ? "rotate-180" : ""}`} 
                />
              </button>

              {expandedAdmin && (
                <div className="ml-4 pl-4 border-l-2 border-gray-100 space-y-1">
                  {isSystemAdmin && (
                    <button
                      onClick={() => handleNavClick("role-management")}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all
                        ${activeTab === "role-management" 
                          ? "bg-blue-100 text-blue-700 font-medium" 
                          : "text-gray-600 hover:bg-gray-50"
                        }
                      `}
                    >
                      <span className={activeTab === "role-management" ? "text-blue-600" : "text-gray-400"}>
                        <ShieldCheck className="w-4 h-4" />
                      </span>
                      Role
                    </button>
                  )}
                  <button
                    onClick={() => handleNavClick("user-management")}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all
                      ${activeTab === "user-management" 
                        ? "bg-blue-100 text-blue-700 font-medium" 
                        : "text-gray-600 hover:bg-gray-50"
                      }
                    `}
                  >
                    <span className={activeTab === "user-management" ? "text-blue-600" : "text-gray-400"}>
                      <UserPlus className="w-4 h-4" />
                    </span>
                    User/Admin
                  </button>
                  {isSystemAdmin && (
                    <button
                      onClick={() => handleNavClick("settings")}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all
                        ${activeTab === "settings" 
                          ? "bg-blue-100 text-blue-700 font-medium" 
                          : "text-gray-600 hover:bg-gray-50"
                        }
                      `}
                    >
                      <span className={activeTab === "settings" ? "text-blue-600" : "text-gray-400"}>
                        <Settings className="w-4 h-4" />
                      </span>
                      Settings
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* LOGOUT BUTTON */}
        <div className="px-3 py-4 mt-auto">
          <div className="bg-gradient-to-r from-gray-100 to-gray-50 rounded-2xl p-1">
            <button
              onClick={() => {
                onLogout();
                setIsSidebarOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-600 hover:shadow-sm transition-all group"
            >
              <div className="w-9 h-9 bg-red-100 group-hover:bg-red-200 rounded-xl flex items-center justify-center transition-colors">
                <LogOut className="w-4 h-4 text-red-500 group-hover:text-red-600" />
              </div>
              <div className="flex flex-col items-start">
                <span className="font-semibold text-sm">Keluar</span>
                <span className="text-[10px] text-gray-400">Log out dari aplikasi</span>
              </div>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
