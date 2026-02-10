// pages/MainApp.tsx - Halaman Utama Aplikasi
import React, { useEffect, useState } from 'react';
import { QrCode, Wifi, WifiOff, MessageSquare, Users, BarChart2, Settings, X } from 'lucide-react';
import useStore from '../store/useStore';
import ChatList from '../components/ChatList';
import ChatWindow from '../components/ChatWindow';
import QRModal from '../components/QRModal';
import NewChatModal from '../components/NewChatModal';
import { useSocket } from '../hooks/useSocket';
import { chatApi } from '../services/api';
import type { Chat } from '../types';

export const MainApp: React.FC = () => {
  const {
    sessions,
    activeSession,
    showQRModal,
    showNewChatModal,
    selectedChat,
    stats,
    fetchSessions,
    fetchChats,
    fetchStats,
    setShowQRModal,
    setShowNewChatModal,
    selectChat,
    setActiveSession,
    chats,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'chats' | 'contacts' | 'stats'>('chats');
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

  // Setup real-time socket
  useSocket(activeSession?.id || null);

  // Load sessions saat startup
  useEffect(() => {
    fetchSessions();
  }, []);

  // Load stats periodik
  useEffect(() => {
    if (activeSession?.id) {
      fetchStats(activeSession.id);
      const interval = setInterval(() => fetchStats(activeSession.id), 30000);
      return () => clearInterval(interval);
    }
  }, [activeSession?.id]);

  // Mobile: switch ke chat view saat chat dipilih
  useEffect(() => {
    if (selectedChat) setMobileView('chat');
  }, [selectedChat?.jid]);

  const handleSelectContact = async (jid: string, name: string) => {
    if (!activeSession) return;

    // Cari existing chat atau buat placeholder
    const existing = chats.find(c => c.jid === jid);
    if (existing) {
      selectChat(existing);
    } else {
      // Buat placeholder chat object
      const placeholderChat: Chat = {
        id: -1,
        session_id: activeSession.id,
        jid,
        name,
        display_name: name,
        is_group: 0,
        unread_count: 0,
        last_message: null,
        last_message_time: null,
        last_message_from: null,
        pinned: 0,
        archived: 0,
        muted: 0,
        profile_pic_url: null,
        created_at: new Date().toISOString(),
      };
      selectChat(placeholderChat);
    }
  };

  const isConnected = activeSession?.status === 'connected';
  const sessionId = activeSession?.id || 'default';

  return (
    <div className="h-screen bg-[#111B21] flex flex-col overflow-hidden">
      {/* Top status bar (mobile) */}
      <div className="md:hidden flex items-center justify-between px-4 py-2 bg-[#075E54]">
        <span className="text-white font-bold text-lg">WhatsApp</span>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${
            isConnected ? 'bg-white/20 text-white' : 'bg-yellow-400/20 text-yellow-400'
          }`}>
            {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {isConnected ? 'Online' : 'Offline'}
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ================================================
            DESKTOP LAYOUT
            ================================================ */}
        <div className="hidden md:flex flex-1">
          {/* Sidebar kiri */}
          <div className="w-[380px] lg:w-[420px] flex-shrink-0 flex flex-col border-r border-[#1E2A30]">
            {activeTab === 'chats' && (
              <ChatList sessionId={sessionId} />
            )}
            {activeTab === 'stats' && (
              <StatsPanel stats={stats} isConnected={isConnected} />
            )}
          </div>

          {/* Panel navigasi kiri */}
          <div className="absolute left-0 top-0 h-full w-14 bg-[#0A1014] flex flex-col items-center py-4 gap-3 z-10 hidden xl:flex">
            <NavButton
              icon={<MessageSquare className="w-5 h-5" />}
              label="Chat"
              active={activeTab === 'chats'}
              onClick={() => setActiveTab('chats')}
            />
            <NavButton
              icon={<BarChart2 className="w-5 h-5" />}
              label="Statistik"
              active={activeTab === 'stats'}
              onClick={() => setActiveTab('stats')}
            />
            <div className="mt-auto">
              {!isConnected && (
                <NavButton
                  icon={<QrCode className="w-5 h-5" />}
                  label="Scan QR"
                  active={false}
                  onClick={() => setShowQRModal(true)}
                  highlight
                />
              )}
            </div>
          </div>

          {/* Chat Window */}
          <div className="flex-1 flex flex-col">
            <ChatWindow sessionId={sessionId} />
          </div>
        </div>

        {/* ================================================
            MOBILE LAYOUT
            ================================================ */}
        <div className="md:hidden flex-1 flex flex-col overflow-hidden">
          {mobileView === 'list' ? (
            <ChatList sessionId={sessionId} />
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Back button mobile */}
              <div className="bg-[#075E54] px-2 py-1 flex-shrink-0">
                <button
                  onClick={() => { setMobileView('list'); selectChat(null); }}
                  className="flex items-center gap-2 text-white p-1"
                >
                  <X className="w-5 h-5" />
                  <span className="text-sm">Kembali</span>
                </button>
              </div>
              <ChatWindow sessionId={sessionId} />
            </div>
          )}
        </div>
      </div>

      {/* ================================================
          MODALS
          ================================================ */}
      {showQRModal && (
        <QRModal
          sessionId={sessionId}
          onClose={() => setShowQRModal(false)}
        />
      )}

      {showNewChatModal && (
        <NewChatModal
          sessionId={sessionId}
          onClose={() => setShowNewChatModal(false)}
          onSelectContact={handleSelectContact}
        />
      )}

      {/* QR Prompt jika belum terhubung */}
      {!isConnected && !showQRModal && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setShowQRModal(true)}
            className="flex items-center gap-2 bg-[#25D366] hover:bg-[#20BD5C] text-white px-4 py-3 rounded-full shadow-xl shadow-green-900/40 transition-all hover:scale-105 active:scale-95"
          >
            <QrCode className="w-5 h-5" />
            <span className="text-sm font-semibold">Scan QR / Login</span>
          </button>
        </div>
      )}
    </div>
  );
};

// ============================================================
// Nav Button Component
// ============================================================
interface NavButtonProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  highlight?: boolean;
}

const NavButton: React.FC<NavButtonProps> = ({ icon, label, active, onClick, highlight }) => (
  <button
    onClick={onClick}
    title={label}
    className={`
      flex flex-col items-center justify-center w-10 h-10 rounded-xl transition-all
      ${active ? 'bg-[#25D366] text-white' :
        highlight ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 animate-pulse' :
        'text-[#8696A0] hover:text-white hover:bg-[#202C33]'}
    `}
  >
    {icon}
  </button>
);

// ============================================================
// Stats Panel Component
// ============================================================
interface StatsPanelProps {
  stats: any;
  isConnected: boolean;
}

const StatsPanel: React.FC<StatsPanelProps> = ({ stats, isConnected }) => (
  <div className="flex-1 bg-[#111B21] p-6 overflow-y-auto">
    <h2 className="text-[#E9EDEF] font-semibold text-lg mb-6">Statistik</h2>
    <div className="grid grid-cols-2 gap-4">
      {[
        { label: 'Total Chat', value: stats?.totalChats ?? '-', icon: '💬', color: 'bg-blue-500/10 border-blue-500/30' },
        { label: 'Total Pesan', value: stats?.totalMessages ?? '-', icon: '📨', color: 'bg-green-500/10 border-green-500/30' },
        { label: 'Belum Dibaca', value: stats?.unreadChats ?? '-', icon: '🔔', color: 'bg-yellow-500/10 border-yellow-500/30' },
        { label: 'Pesan Hari Ini', value: stats?.todayMessages ?? '-', icon: '📅', color: 'bg-purple-500/10 border-purple-500/30' },
      ].map(item => (
        <div key={item.label} className={`rounded-xl p-4 border ${item.color}`}>
          <div className="text-2xl mb-2">{item.icon}</div>
          <div className="text-[#E9EDEF] text-xl font-bold">{item.value}</div>
          <div className="text-[#8696A0] text-xs mt-1">{item.label}</div>
        </div>
      ))}
    </div>

    <div className={`mt-6 flex items-center gap-3 rounded-xl p-4 ${
      isConnected ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'
    }`}>
      <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-[#25D366]' : 'bg-red-400'} ${isConnected ? 'animate-pulse' : ''}`} />
      <div>
        <p className={`text-sm font-medium ${isConnected ? 'text-[#25D366]' : 'text-red-400'}`}>
          {isConnected ? 'Terhubung ke WhatsApp' : 'Tidak Terhubung'}
        </p>
        <p className="text-[#8696A0] text-xs">
          {isConnected ? 'Pesan masuk dan keluar aktif' : 'Scan QR untuk terhubung'}
        </p>
      </div>
    </div>
  </div>
);

export default MainApp;