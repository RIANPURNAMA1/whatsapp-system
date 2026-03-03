import React, { useState } from "react";
import { 
  User, 
  Bell, 
  Lock, 
  Globe, 
  Database, 
  Smartphone, 
  Save,
  ChevronRight,
  Shield,
  Key
} from "lucide-react";
import toast from "react-hot-toast";

// 1. Tambahkan Interface Props di atas komponen
interface SettingsProps {
  onBack?: () => void;
}

// 2. Terima props tersebut di fungsi komponen
   export const Settings: React.FC<SettingsProps> = ({ onBack }) => {
  const [activeSection, setActiveSection] = useState("profile");

  // State contoh untuk form
  const [profileData, setProfileData] = useState({
    name: "Admin Satu Pintu",
    email: "admin@satupintu.com",
    phone: "+62 812-3456-7890"
  });

  const handleSave = () => {
    toast.success("Pengaturan berhasil disimpan!");
  };

  const sections = [
    { id: "profile", label: "Profil Saya", icon: <User className="w-5 h-5" /> },
    { id: "security", label: "Keamanan", icon: <Shield className="w-5 h-5" /> },
    { id: "notifications", label: "Notifikasi", icon: <Bell className="w-5 h-5" /> },
    { id: "api", label: "API & Webhook", icon: <Database className="w-5 h-5" /> },
    { id: "app", label: "Preferensi Aplikasi", icon: <Globe className="w-5 h-5" /> },
  ];

  return (
    <div className="flex-1 flex flex-col bg-[#0B141A] h-[100dvh] overflow-hidden">
      {/* Header Pengaturan */}
      <div className="flex-none bg-[#202C33] px-6 py-4 border-b border-[#111B21]">
        <h1 className="text-[#E9EDEF] text-xl font-bold">Pengaturan</h1>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar Navigasi Pengaturan */}
        <div className="w-full md:w-80 bg-[#111B21] border-r border-[#222d34] overflow-y-auto">
          <div className="py-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center justify-between px-6 py-4 transition-colors ${
                  activeSection === section.id 
                  ? "bg-[#2A3942] text-[#00a884]" 
                  : "text-[#8696A0] hover:bg-[#202C33]"
                }`}
              >
                <div className="flex items-center gap-4">
                  {section.icon}
                  <span className="text-[15px] font-medium">{section.label}</span>
                </div>
                <ChevronRight className={`w-4 h-4 ${activeSection === section.id ? "opacity-100" : "opacity-0"}`} />
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-[#0B141A] overflow-y-auto p-6 md:p-10">
          <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
            {activeSection === "profile" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-[#E9EDEF] text-lg font-semibold mb-6 flex items-center gap-2">
                    <User className="text-[#00a884]" /> Profil Saya
                  </h2>
                  <div className="space-y-6">
                    <div className="flex items-center gap-6 mb-8">
                      <div className="w-24 h-24 bg-[#202C33] rounded-full flex items-center justify-center border-2 border-[#00a884] relative group cursor-pointer">
                        <User className="w-12 h-12 text-[#8696A0]" />
                        <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <span className="text-white text-xs">Ubah</span>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-[#E9EDEF] font-medium">{profileData.name}</h3>
                        <p className="text-[#8696A0] text-sm">Administrator Sistem</p>
                      </div>
                    </div>

                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <label className="text-[#8696A0] text-xs uppercase tracking-wider font-bold">Nama Lengkap</label>
                        <input 
                          type="text" 
                          value={profileData.name}
                          onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                          className="w-full bg-[#2A3942] text-[#E9EDEF] px-4 py-3 rounded-lg outline-none border border-transparent focus:border-[#00a884] transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[#8696A0] text-xs uppercase tracking-wider font-bold">Email</label>
                        <input 
                          type="email" 
                          value={profileData.email}
                          className="w-full bg-[#2A3942] text-[#E9EDEF] px-4 py-3 rounded-lg outline-none opacity-60 cursor-not-allowed"
                          disabled
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "api" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-[#E9EDEF] text-lg font-semibold mb-6 flex items-center gap-2">
                    <Database className="text-[#00a884]" /> API & Webhook
                  </h2>
                  <div className="bg-[#111B21] border border-[#222d34] rounded-xl p-6 space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[#8696A0] text-xs uppercase font-bold">API Key</label>
                        <button className="text-[#00a884] text-xs hover:underline">Generate New</button>
                      </div>
                      <div className="flex gap-2">
                        <input 
                          type="password" 
                          value="sk-1234567890abcdefghijklmnopqrstuvwxyz"
                          className="flex-1 bg-[#2A3942] text-[#E9EDEF] px-4 py-3 rounded-lg outline-none font-mono text-sm"
                          readOnly
                        />
                        <button className="bg-[#202C33] text-[#E9EDEF] px-4 rounded-lg hover:bg-[#2A3942]">Salin</button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[#8696A0] text-xs uppercase font-bold">Webhook URL</label>
                      <input 
                        type="text" 
                        placeholder="https://domain-anda.com/webhook"
                        className="w-full bg-[#2A3942] text-[#E9EDEF] px-4 py-3 rounded-lg outline-none border border-transparent focus:border-[#00a884]"
                      />
                      <p className="text-[#8696A0] text-[11px]">Setiap ada pesan masuk, server kami akan mengirim POST request ke URL ini.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tombol Simpan (Sticky di mobile) */}
            <div className="mt-10 pt-6 border-t border-[#222d34] flex justify-end">
              <button 
                onClick={handleSave}
                className="flex items-center gap-2 bg-[#00a884] hover:bg-[#00c99d] text-[#111B21] px-8 py-3 rounded-full font-bold transition-all active:scale-95 shadow-lg shadow-[#00a884]/20"
              >
                <Save className="w-5 h-5" /> Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};