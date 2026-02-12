import React, { useEffect, useState, useCallback } from 'react';
import { 
  X, Smartphone, CheckCircle, Loader2, PlusCircle, ArrowRight 
} from 'lucide-react';
import { sessionApi } from '../services/api';
import useStore from '../store/useStore';
import { getSocket } from '../services/socket';

interface QRModalProps {
  sessionId: string;
  onClose: () => void;
}

type QRState = 'idle' | 'loading' | 'waiting' | 'connected' | 'error';

export const QRModal: React.FC<QRModalProps> = ({ sessionId, onClose }) => {
  const { updateSession, sessions } = useStore();
  
  // Ambil data sesi yang sudah ada di store jika ini proses reconnect
  const existingSession = sessions.find(s => s.id === sessionId);

  // State Management
  const [deviceName, setDeviceName] = useState(existingSession?.name || '');
  const [isNameConfirmed, setIsNameConfirmed] = useState(!!existingSession?.name);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [qrState, setQrState] = useState<QRState>(existingSession?.name ? 'waiting' : 'idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [connectedNumber, setConnectedNumber] = useState<string | null>(null);

  /**
   * Fungsi untuk Inisialisasi Sesi Baru (Hanya untuk Tambah Device Baru)
   */
  const initSession = useCallback(async () => {
    if (!deviceName.trim()) return;

    setQrState('loading');
    setErrorMsg('');
    setIsNameConfirmed(true);

    try {
      await sessionApi.create(sessionId, deviceName.trim());
      // Setelah create, backend otomatis akan memancarkan event qr:${sessionId}
      setQrState('waiting');
    } catch (err: any) {
      setQrState('error');
      setErrorMsg(err.message || 'Gagal memulai sesi');
    }
  }, [sessionId, deviceName]);

  /**
   * Socket Logic: Mendengarkan QR dan Status Koneksi
   */
  useEffect(() => {
    // Jangan aktifkan socket jika user belum mengisi nama (kecuali reconnect)
    if (!isNameConfirmed) return;

    const socket = getSocket();

    const handleQR = (data: { qr: string }) => {
      console.log(`[SOCKET] QR Received for ${sessionId}`);
      setQrImage(data.qr);
      setQrState('waiting');
      setCountdown(60); // Reset timer setiap dapat QR baru
    };

    const handleConnected = (data: { phoneNumber: string }) => {
      console.log(`[SOCKET] ${sessionId} Connected!`);
      setQrState('connected');
      setConnectedNumber(data.phoneNumber);
      
      updateSession({
        id: sessionId,
        status: 'connected',
        phone_number: data.phoneNumber,
        qr_code: null,
      });

      // Tutup modal otomatis setelah berhasil
      setTimeout(() => onClose(), 3000);
    };

    // Listeners
    socket.on(`qr:${sessionId}`, handleQR);
    socket.on(`session:connected:${sessionId}`, handleConnected);

    return () => {
      socket.off(`qr:${sessionId}`, handleQR);
      socket.off(`session:connected:${sessionId}`, handleConnected);
    };
  }, [sessionId, isNameConfirmed, updateSession, onClose]);

  // Timer QR logic
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#202C33] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-[#313D45]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A3942]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#00a884] rounded-full flex items-center justify-center">
              <PlusCircle className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-sm">
                {existingSession?.name ? 'Hubungkan Kembali' : 'Tambah Perangkat'}
              </h2>
              <p className="text-[#8696A0] text-[10px] uppercase font-mono">{sessionId}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#8696A0] hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="px-6 py-8">
          
          {/* STEP 1: INPUT NAMA (Hanya untuk sesi baru) */}
          {!isNameConfirmed ? (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-[#2A3942] rounded-full flex items-center justify-center mx-auto mb-4 text-[#00a884]">
                  <Smartphone size={32} />
                </div>
                <h3 className="text-white font-medium mb-1">Beri Nama Perangkat</h3>
                <p className="text-[#8696A0] text-xs">Contoh: CS Admin, WhatsApp Marketing</p>
              </div>

              <div className="space-y-3">
                <input
                  autoFocus
                  type="text"
                  placeholder="Nama Perangkat..."
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && initSession()}
                  className="w-full bg-[#2A3942] text-[#E9EDEF] border border-[#3b4a54] rounded-xl px-4 py-3 outline-none focus:border-[#00a884]"
                />
                <button
                  onClick={initSession}
                  disabled={!deviceName.trim()}
                  className="w-full bg-[#00a884] hover:bg-[#00c99d] disabled:opacity-50 text-[#111B21] font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  Tampilkan QR <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ) : (
            /* STEP 2: DISPLAY QR / STATUS */
            <div className="flex flex-col items-center">
              
              {/* LOADING STATE */}
              {qrState === 'loading' && (
                <div className="py-10 flex flex-col items-center gap-4">
                  <Loader2 className="w-12 h-12 text-[#00a884] animate-spin" />
                  <p className="text-[#8696A0] text-sm italic">Menghubungkan ke WhatsApp...</p>
                </div>
              )}

              {/* WAITING QR STATE */}
              {qrState === 'waiting' && (
                <div className="flex flex-col items-center gap-6 w-full">
                  <div className="relative p-3 bg-white rounded-xl">
                    {qrImage ? (
                      <img src={qrImage} alt="WhatsApp QR" className="w-48 h-48" />
                    ) : (
                      <div className="w-48 h-48 flex flex-col items-center justify-center bg-gray-100 text-gray-400">
                        <Loader2 className="animate-spin mb-2" />
                        <span className="text-[10px]">Menunggu Barcode...</span>
                      </div>
                    )}
                  </div>

                  {countdown > 0 && (
                    <div className="text-[#00a884] text-[11px] font-bold bg-[#00a884]/10 px-3 py-1 rounded-full border border-[#00a884]/20">
                      QR Kedaluwarsa: {countdown}s
                    </div>
                  )}

                  <div className="w-full bg-[#2A3942]/50 border border-[#313D45] rounded-xl p-4 text-[11px] space-y-1 text-[#8696A0]">
                    <p className="text-[#E9EDEF] font-bold mb-1">Cara Menghubungkan:</p>
                    <p>1. Buka WhatsApp di ponsel Anda</p>
                    <p>2. Tap Menu atau Pengaturan &gt; Perangkat Tertaut</p>
                    <p>3. Tap Tautkan Perangkat dan arahkan ke layar ini</p>
                  </div>
                </div>
              )}

              {/* CONNECTED STATE */}
              {qrState === 'connected' && (
                <div className="py-6 flex flex-col items-center text-center gap-4">
                  <div className="w-20 h-20 bg-[#00a884] rounded-full flex items-center justify-center animate-bounce shadow-lg shadow-[#00a884]/20">
                    <CheckCircle size={40} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">Berhasil Terhubung!</h3>
                    <p className="text-[#00a884] font-mono text-sm">{connectedNumber}</p>
                    <p className="text-[#8696A0] text-xs mt-2 italic">Menutup jendela dalam 3 detik...</p>
                  </div>
                </div>
              )}

              {/* ERROR STATE */}
              {qrState === 'error' && (
                <div className="py-6 flex flex-col items-center text-center gap-4">
                  <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500">
                    <X size={32} />
                  </div>
                  <p className="text-red-400 text-sm">{errorMsg}</p>
                  <button
                    onClick={() => { setIsNameConfirmed(false); setQrState('idle'); }}
                    className="text-[#00a884] text-xs font-bold hover:underline"
                  >
                    Ulangi Proses
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#2A3942]/30 border-t border-[#2A3942] text-center">
          <p className="text-[#8696A0] text-[10px]">
            Pastikan ponsel Anda memiliki koneksi internet aktif.
          </p>
        </div>
      </div>
    </div>
  );
};

export default QRModal;