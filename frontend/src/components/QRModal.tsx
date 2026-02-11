import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  X, RefreshCw, Smartphone, Wifi, 
  CheckCircle, Loader2, PlusCircle, ArrowRight 
} from 'lucide-react';
import { sessionApi } from '../services/api';
import useStore from '../store/useStore';
import { getSocket } from '../services/socket';

interface QRModalProps {
  sessionId: string;
  onClose: () => void;
}

type QRState = 'idle' | 'loading' | 'waiting' | 'scanned' | 'connected' | 'error';

export const QRModal: React.FC<QRModalProps> = ({ sessionId, onClose }) => {
  const { updateSession } = useStore();
  
  // State untuk alur input nama
  const [deviceName, setDeviceName] = useState('');
  const [isNameConfirmed, setIsNameConfirmed] = useState(false);
  
  // State untuk QR & Connection
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [qrState, setQrState] = useState<QRState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [connectedNumber, setConnectedNumber] = useState<string | null>(null);
  
  const hasInitialized = useRef(false);

  /**
   * Fungsi untuk memulai sesi di backend
   * Dipanggil setelah user memasukkan nama device
   */
  const initSession = useCallback(async () => {
    if (!deviceName.trim()) return;

    setQrState('loading');
    setErrorMsg('');
    setIsNameConfirmed(true);

    try {
      // Mengirim sessionId dan nama device ke backend
      await sessionApi.create(sessionId, deviceName.trim());
      setQrState('waiting');
    } catch (err: any) {
      setQrState('error');
      setErrorMsg(err.message || 'Gagal memulai sesi');
    }
  }, [sessionId, deviceName]);

  /**
   * Socket Logic
   */
  useEffect(() => {
    if (!isNameConfirmed) return; // Tunggu nama diisi baru listen socket

    const socket = getSocket();

    const handleQR = (data: { qr: string }) => {
      setQrImage(data.qr);
      setQrState('waiting');
      setCountdown(60); 
    };

    const handleConnected = (data: { phoneNumber: string }) => {
      setQrState('connected');
      setConnectedNumber(data.phoneNumber);
      
      updateSession({
        id: sessionId,
        status: 'connected',
        phone_number: data.phoneNumber,
        qr_code: null,
      });

      setTimeout(() => onClose(), 2500);
    };

    socket.on(`qr:${sessionId}`, handleQR);
    socket.on(`session:connected:${sessionId}`, handleConnected);

    return () => {
      socket.off(`qr:${sessionId}`, handleQR);
      socket.off(`session:connected:${sessionId}`, handleConnected);
    };
  }, [sessionId, updateSession, onClose, isNameConfirmed]);

  // Timer QR
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-[#202C33] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-[#313D45] animate-bounce-in">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A3942]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#00a884] rounded-full flex items-center justify-center shadow-lg">
              <PlusCircle className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-sm">Tambah Perangkat</h2>
              <p className="text-[#8696A0] text-[10px] uppercase font-mono">{sessionId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#8696A0] hover:text-white transition-colors p-1 rounded-full hover:bg-[#2A3942]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="px-6 py-8">
          
          {/* STEP 1: INPUT NAMA (Jika belum konfirmasi) */}
          {!isNameConfirmed ? (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-[#2A3942] rounded-full flex items-center justify-center mx-auto mb-4 text-[#00a884]">
                  <Smartphone size={32} />
                </div>
                <h3 className="text-white font-medium mb-1">Beri Nama Perangkat</h3>
                <p className="text-[#8696A0] text-xs">Identitas ini membantu Anda membedakan pesan masuk antar device.</p>
              </div>

              <div className="space-y-3">
                <input
                  autoFocus
                  type="text"
                  placeholder="Contoh: CS Toko, Marketing..."
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && initSession()}
                  className="w-full bg-[#2A3942] text-[#E9EDEF] border border-[#3b4a54] rounded-xl px-4 py-3 outline-none focus:border-[#00a884] transition-all placeholder:text-[#8696A0]/50"
                />
                <button
                  onClick={initSession}
                  disabled={!deviceName.trim()}
                  className="w-full bg-[#00a884] hover:bg-[#00c99d] disabled:opacity-50 disabled:cursor-not-allowed text-[#111B21] font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  Lanjut ke Scan QR <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ) : (
            /* STEP 2: PROSES QR (Setelah nama diisi) */
            <div className="flex flex-col items-center">
              
              {/* State: Loading */}
              {qrState === 'loading' && (
                <div className="py-10 flex flex-col items-center gap-4 text-center">
                  <Loader2 className="w-12 h-12 text-[#00a884] animate-spin" />
                  <p className="text-[#8696A0] text-sm animate-pulse">Menghubungkan server untuk {deviceName}...</p>
                </div>
              )}

              {/* State: Waiting QR */}
              {qrState === 'waiting' && (
                <div className="flex flex-col items-center gap-6 w-full">
                  <div className="relative p-3 bg-white rounded-xl shadow-xl">
                    {qrImage ? (
                      <img src={qrImage} alt="QR" className="w-48 h-48" />
                    ) : (
                      <div className="w-48 h-48 flex flex-col items-center justify-center bg-gray-50 text-gray-400 gap-2">
                        <Loader2 className="animate-spin" size={24} />
                        <span className="text-[10px]">Menunggu QR...</span>
                      </div>
                    )}
                  </div>

                  {countdown > 0 && (
                    <div className="text-[#00a884] text-[11px] font-bold bg-[#00a884]/10 px-3 py-1 rounded-full border border-[#00a884]/20">
                      QR Kedaluwarsa: {countdown}s
                    </div>
                  )}

                  <div className="w-full bg-[#2A3942]/50 border border-[#313D45] rounded-xl p-4 text-xs space-y-2">
                    <p className="text-[#E9EDEF] font-bold mb-1">Instruksi:</p>
                    <p className="text-[#8696A0]">1. Buka WhatsApp di HP Anda</p>
                    <p className="text-[#8696A0]">2. Tap Menu atau Pengaturan &gt; Perangkat Tertaut</p>
                    <p className="text-[#8696A0]">3. Tap Tautkan Perangkat &amp; Scan QR di atas</p>
                  </div>
                </div>
              )}

              {/* State: Connected */}
              {qrState === 'connected' && (
                <div className="py-6 flex flex-col items-center text-center gap-4">
                  <div className="w-20 h-20 bg-[#00a884] rounded-full flex items-center justify-center shadow-lg shadow-[#00a884]/20 animate-bounce">
                    <CheckCircle size={40} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">Tersambung!</h3>
                    <p className="text-[#00a884] font-mono text-sm">{connectedNumber}</p>
                    <p className="text-[#8696A0] text-xs mt-2 italic">Menyiapkan kotak masuk {deviceName}...</p>
                  </div>
                </div>
              )}

              {/* State: Error */}
              {qrState === 'error' && (
                <div className="py-6 flex flex-col items-center text-center gap-4">
                  <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500">
                    <X size={32} />
                  </div>
                  <p className="text-red-400 text-sm px-4">{errorMsg}</p>
                  <button
                    onClick={() => { setIsNameConfirmed(false); setQrState('idle'); }}
                    className="text-[#00a884] text-xs font-bold hover:underline"
                  >
                    Coba Ganti Nama / Ulangi
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="px-6 py-4 bg-[#2A3942]/30 border-t border-[#2A3942]">
          <p className="text-[#8696A0] text-[10px] text-center">
            Pesan Anda terenkripsi secara end-to-end.
          </p>
        </div>
      </div>
    </div>
  );
};

export default QRModal;