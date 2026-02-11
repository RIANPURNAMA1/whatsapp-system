import React, { useEffect, useState } from 'react';
import { 
  QrCode, Wifi, WifiOff, MessageSquare, BarChart2, 
  Settings, LayoutDashboard, PlusCircle, 
  Smartphone, Trash2 
} from 'lucide-react';
import useStore from '../store/useStore';
import ChatList from '../components/ChatList';
import { ChatWindow } from '../components/ChatWindow';
import QRModal from '../components/QRModal';
import NewChatModal from '../components/NewChatModal';
import { useSocket } from '../hooks/useSocket';
import type { Chat } from '../types';

export const MainApp: React.FC = () => {
  // Ambil state dan action dari Zustand Store
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
    chats,
    setActiveSession,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'chats' | 'stats' | 'devices'>('chats');
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  
  // State untuk menampung ID unik saat klik "Tambah Device"
  const [addDeviceSessionId, setAddDeviceSessionId] = useState<string | null>(null);

  // Inisialisasi Socket.IO berdasarkan session yang aktif
  useSocket(activeSession?.id || null);

  // Load daftar sesi saat pertama kali aplikasi dibuka
  useEffect(() => {
    fetchSessions();
  }, []);

  // Auto-refresh statistik setiap 30 detik jika ada sesi yang aktif
  useEffect(() => {
    if (activeSession?.id) {
      fetchStats(activeSession.id);
      const interval = setInterval(() => fetchStats(activeSession.id), 30000);
      return () => clearInterval(interval);
    }
  }, [activeSession?.id, fetchStats]);

  // Handle tampilan mobile saat chat dipilih
  useEffect(() => {
    if (selectedChat) setMobileView('chat');
  }, [selectedChat?.jid]);

  /**
   * FUNGSI UTAMA: Menambah Device Baru
   * Membuat ID unik agar backend membuat folder session baru (bukan nimpa yang lama)
   */
  const handleAddNewDevice = () => {
    const newUniqueId = `device_${Date.now()}`; // Contoh: device_174000123
    setAddDeviceSessionId(newUniqueId);
    setShowQRModal(true);
  };

  /**
   * FUNGSI: Berpindah antar device (multi-account)
   */
  const handleSwitchDevice = (session: any) => {
    setActiveSession(session);
    setActiveTab('chats'); // Otomatis pindah ke tab chat setelah pilih device
  };

  const isConnected = activeSession?.status === 'connected';
  const currentSessionId = activeSession?.id || 'default';

  return (
    <div className="h-screen bg-[#0B141A] text-[#E9EDEF] flex overflow-hidden">
      
      {/* --- SIDEBAR NAVIGASI (RAIL) --- */}
      <aside className="hidden md:flex flex-col w-[68px] bg-[#202C33] border-r border-[#313D45] py-5 items-center justify-between z-30">
        <div className="flex flex-col gap-6 items-center w-full">
          <div className="w-10 h-10 bg-[#00a884] rounded-xl flex items-center justify-center shadow-lg shadow-[#00a884]/20 mb-2">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          
          <div className="flex flex-col gap-3 w-full items-center">
            <NavButton 
              icon={<LayoutDashboard className="w-5 h-5" />} 
              active={activeTab === 'chats'} 
              onClick={() => setActiveTab('chats')}
              label="Chat"
            />
            <NavButton 
              icon={<BarChart2 className="w-5 h-5" />} 
              active={activeTab === 'stats'} 
              onClick={() => setActiveTab('stats')}
              label="Statistik"
            />
            <div className="w-8 h-[1px] bg-[#313D45] my-2" /> 
            <NavButton 
              icon={<PlusCircle className="w-5 h-5" />} 
              active={activeTab === 'devices'} 
              onClick={() => setActiveTab('devices')}
              label="Manajemen Perangkat"
            />
          </div>
        </div>

        <div className="flex flex-col gap-5 items-center">
          {!isConnected && (
            <button 
              onClick={() => setShowQRModal(true)}
              className="p-3 text-orange-400 hover:bg-orange-400/10 rounded-xl transition-all animate-pulse"
              title="Koneksi Terputus"
            >
              <QrCode className="w-6 h-6" />
            </button>
          )}
          <button className="p-3 text-[#8696A0] hover:text-white transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* --- KONTEN UTAMA --- */}
      <main className="flex flex-1 overflow-hidden relative">
        
        {/* KOLOM KIRI: Daftar Chat / List Device / Stats */}
        <section className={`
          ${mobileView === 'chat' ? 'hidden' : 'flex'} 
          md:flex flex-col w-full md:w-[380px] lg:w-[420px] bg-[#111B21] border-r border-[#222d34] z-20
        `}>
          <div className="flex-1 overflow-hidden">
            {activeTab === 'chats' && (
              isConnected ? (
                <ChatList sessionId={currentSessionId} />
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-10 text-center">
                   <WifiOff className="w-16 h-16 text-[#3b4a54] mb-4" />
                   <h3 className="text-lg font-medium">Belum Terhubung</h3>
                   <p className="text-[#8696A0] text-sm mt-2">Pilih perangkat yang aktif atau hubungkan perangkat baru.</p>
                   <button 
                    onClick={() => setActiveTab('devices')}
                    className="mt-6 px-4 py-2 bg-[#00a884] text-[#0B141A] rounded-lg font-bold"
                   >
                     Kelola Perangkat
                   </button>
                </div>
              )
            )}

            {activeTab === 'stats' && <StatsPanel stats={stats} isConnected={isConnected} />}

            {activeTab === 'devices' && (
              <DevicePanel 
                sessions={sessions} 
                activeId={currentSessionId}
                onAdd={handleAddNewDevice}
                onSelect={handleSwitchDevice}
              />
            )}
          </div>
        </section>

        {/* KOLOM KANAN: Jendela Chat */}
        <section className={`
          ${mobileView === 'list' ? 'hidden' : 'flex'} 
          md:flex flex-1 flex-col bg-[#0B141A] z-10
        `}>
          <ChatWindow sessionId={currentSessionId} onBack={() => setMobileView('list')} />
        </section>
      </main>

      {/* --- MODALS --- */}
      {showQRModal && (
        <QRModal 
          // Gunakan ID unik jika sedang tambah baru, 
          // atau ID yang ada jika hanya ingin reconnect
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
             // Logic create placeholder chat jika belum ada
             selectChat({ jid, display_name: name, session_id: currentSessionId } as any);
             setShowNewChatModal(false);
          }} 
        />
      )}
    </div>
  );
};

// --- Sub-Component: NavButton ---
const NavButton: React.FC<{ icon: any, label: string, active: boolean, onClick: () => void }> = ({ icon, active, onClick, label }) => (
  <button
    onClick={onClick}
    className={`
      group relative flex items-center justify-center w-12 h-12 rounded-xl transition-all
      ${active ? 'bg-[#374248] text-[#00a884]' : 'text-[#8696A0] hover:bg-[#374248] hover:text-[#E9EDEF]'}
    `}
  >
    {icon}
    <div className={`absolute left-0 w-1 h-5 bg-[#00a884] rounded-r-full transition-transform ${active ? 'scale-100' : 'scale-0'}`} />
  </button>
);

// --- Sub-Component: DevicePanel ---
const DevicePanel: React.FC<{ sessions: any[], activeId: string, onAdd: () => void, onSelect: (s: any) => void }> = ({ sessions, activeId, onAdd, onSelect }) => (
  <div className="flex-1 bg-[#111B21] p-6 overflow-y-auto">
    <div className="flex items-center justify-between mb-8">
      <div>
        <h2 className="text-xl font-bold text-[#E9EDEF]">Perangkat</h2>
        <p className="text-[#8696A0] text-xs mt-1">Multi-account Management</p>
      </div>
      <button 
        onClick={onAdd}
        className="flex items-center gap-2 px-3 py-2 bg-[#00a884] text-[#0B141A] rounded-lg font-bold text-sm hover:bg-[#008f6f]"
      >
        <PlusCircle className="w-4 h-4" />
        Tambah
      </button>
    </div>

    <div className="space-y-3">
      {sessions.map((session) => (
        <div 
          key={session.id} 
          onClick={() => onSelect(session)}
          className={`
            p-4 rounded-xl border cursor-pointer transition-all
            ${session.id === activeId ? 'bg-[#2A3942] border-[#00a884]' : 'bg-[#202C33] border-[#313D45] hover:bg-[#26353d]'}
          `}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${session.status === 'connected' ? 'bg-[#00a884]/10 text-[#00a884]' : 'bg-[#8696A0]/10 text-[#8696A0]'}`}>
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#E9EDEF]">{session.name || session.id}</p>
                <p className="text-[11px] text-[#8696A0]">{session.phone_number || 'Belum discan'}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${session.status === 'connected' ? 'bg-[#00a884]/20 text-[#00a884]' : 'bg-orange-500/20 text-orange-500'}`}>
                {session.status}
              </span>
              <button className="text-[#8696A0] hover:text-red-400 p-1">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// --- Sub-Component: StatsPanel ---
const StatsPanel: React.FC<{ stats: any, isConnected: boolean }> = ({ stats, isConnected }) => (
  <div className="flex-1 bg-[#111B21] p-8 overflow-y-auto text-center">
    <h2 className="text-2xl font-bold text-[#E9EDEF] mb-8 text-left">Ringkasan Sesi</h2>
    <div className="grid grid-cols-1 gap-6">
      <StatCard label="Total Pesan" value={stats?.totalMessages ?? 0} color="text-[#00a884]" />
      <StatCard label="Pesan Hari Ini" value={stats?.todayMessages ?? 0} color="text-blue-400" />
      <StatCard label="Chat Belum Dibaca" value={stats?.unreadChats ?? 0} color="text-orange-400" />
    </div>
  </div>
);

const StatCard = ({ label, value, color }: any) => (
  <div className="p-6 rounded-2xl border border-[#313D45] bg-[#202C33] flex flex-col items-center shadow-inner">
    <p className="text-[#8696A0] text-xs font-bold uppercase tracking-widest">{label}</p>
    <p className={`text-5xl font-black mt-3 ${color}`}>{value}</p>
  </div>
);