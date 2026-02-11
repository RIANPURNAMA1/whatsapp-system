import React, { useEffect, useState, useCallback, useRef } from 'react';
import { X, RefreshCw, Smartphone, Wifi, CheckCircle, Loader2 } from 'lucide-react';
import { sessionApi } from '../services/api';
import useStore from '../store/useStore';
import { getSocket } from '../services/socket';

interface QRModalProps {
  sessionId: string;
  onClose: () => void;
}

type QRState = 'idle' | 'loading' | 'waiting' | 'scanned' | 'connected' | 'error';

export const QRModal: React.FC<QRModalProps> = ({ sessionId, onClose }) => {
  const { updateSession } = useStore(); // Kita hanya butuh updateSession
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [qrState, setQrState] = useState<QRState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [countdown, setCountdown] = useState(0);
  
  // State lokal untuk menyimpan nomor telepon yang baru berhasil terhubung
  const [connectedNumber, setConnectedNumber] = useState<string | null>(null);
  
  // Ref untuk mencegah double inisialisasi di React StrictMode
  const hasInitialized = useRef(false);

  const initSession = useCallback(async () => {
    setQrState('loading');
    setErrorMsg('');
    setQrImage(null); // Reset gambar lama

    try {
      // Menggunakan name dinamis agar tidak semua bernama "Session Utama"
      await sessionApi.create(sessionId, `Device ${sessionId.split('_')[1] || ''}`);
      setQrState('waiting');
    } catch (err: any) {
      setQrState('error');
      setErrorMsg(err.message || 'Gagal memulai sesi');
    }
  }, [sessionId]);

  // Listen socket events untuk QR
  useEffect(() => {
    const socket = getSocket();

    const handleQR = (data: { qr: string }) => {
      setQrImage(data.qr);
      setQrState('waiting');
      setCountdown(60); // QR expire dalam 60 detik
    };

    const handleConnected = (data: { phoneNumber: string }) => {
      setQrState('connected');
      setConnectedNumber(data.phoneNumber); // Simpan nomor telepon lokal
      
      updateSession({
        id: sessionId,
        status: 'connected',
        phone_number: data.phoneNumber,
        qr_code: null,
      });

      // Tutup modal setelah 2.5 detik agar user bisa melihat status sukses
      setTimeout(() => onClose(), 2500);
    };

    // Listen event spesifik untuk sessionId ini
    socket.on(`qr:${sessionId}`, handleQR);
    socket.on(`session:connected:${sessionId}`, handleConnected);

    // Cek status awal di database
    sessionApi.getQR(sessionId).then(({ qr, status }) => {
      if (status === 'connected') {
        setQrState('connected');
      } else if (qr) {
        setQrImage(qr);
        setQrState('waiting');
        setCountdown(60);
      }
    }).catch(() => {});

    return () => {
      socket.off(`qr:${sessionId}`, handleQR);
      socket.off(`session:connected:${sessionId}`, handleConnected);
    };
  }, [sessionId, updateSession, onClose]);

  // Countdown timer untuk QR
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // AUTO-INIT hanya untuk sessionId yang dikirim (TANPA CEK activeSession global)
  useEffect(() => {
    if (!hasInitialized.current) {
      initSession();
      hasInitialized.current = true;
    }
  }, [initSession]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#202C33] rounded-2xl w-full max-w-sm mx-4 overflow-hidden shadow-2xl border border-[#313D45] animate-bounce-in">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A3942]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg shadow-green-500/20">
              <Smartphone className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-sm">Tautkan Perangkat</h2>
              <p className="text-[#8696A0] text-[10px] uppercase tracking-wider font-bold">ID: {sessionId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#8696A0] hover:text-white transition-colors p-1.5 rounded-full hover:bg-[#2A3942]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-8">
          
          {/* STATE: LOADING / IDLE */}
          {(qrState === 'idle' || qrState === 'loading') && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="relative">
                <Loader2 className="w-14 h-14 text-[#25D366] animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Wifi className="w-5 h-5 text-[#25D366]/50" />
                </div>
              </div>
              <p className="text-[#8696A0] text-sm text-center animate-pulse">
                Menyiapkan sesi WhatsApp baru...
              </p>
            </div>
          )}

          {/* STATE: WAITING QR */}
          {qrState === 'waiting' && (
            <div className="flex flex-col items-center gap-6">
              <div className="relative group">
                <div className="bg-white p-3 rounded-xl shadow-[0_0_20px_rgba(37,211,102,0.2)]">
                  {qrImage ? (
                    <img
                      src={qrImage}
                      alt="QR Code WhatsApp"
                      className="w-52 h-52 object-contain"
                    />
                  ) : (
                    <div className="w-52 h-52 flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-8 h-8 text-[#25D366] animate-spin" />
                      <span className="text-[10px] text-gray-400 font-medium">Generating QR...</span>
                    </div>
                  )}
                </div>

                {/* Decoration corners */}
                <div className="absolute -top-2 -left-2 w-6 h-6 border-t-4 border-l-4 border-[#25D366] rounded-tl-lg" />
                <div className="absolute -top-2 -right-2 w-6 h-6 border-t-4 border-r-4 border-[#25D366] rounded-tr-lg" />
                <div className="absolute -bottom-2 -left-2 w-6 h-6 border-b-4 border-l-4 border-[#25D366] rounded-bl-lg" />
                <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-4 border-r-4 border-[#25D366] rounded-br-lg" />
              </div>

              {countdown > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#2A3942] rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#25D366] animate-pulse" />
                  <span className="text-[#E9EDEF] text-[11px] font-medium">
                    QR berakhir dalam <span className="text-[#25D366]">{countdown}s</span>
                  </span>
                </div>
              )}

              {/* Steps Instructions */}
              <div className="bg-[#2A3942]/50 border border-[#313D45] rounded-xl p-4 w-full space-y-3">
                <p className="text-white text-[11px] font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
                  Langkah Penautan:
                </p>
                <div className="space-y-2">
                  {['Buka WhatsApp', 'Menu > Perangkat Tertaut', 'Scan QR di atas'].map((step, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-5 h-5 rounded-full bg-[#25D366]/10 text-[#25D366] text-[10px] font-bold flex items-center justify-center border border-[#25D366]/20">
                        {i + 1}
                      </span>
                      <span className="text-[#8696A0] text-xs">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STATE: CONNECTED */}
          {qrState === 'connected' && (
            <div className="flex flex-col items-center gap-5 py-6">
              <div className="relative">
                <div className="w-24 h-24 bg-[#25D366]/10 rounded-full flex items-center justify-center animate-ping absolute" />
                <div className="w-24 h-24 bg-[#25D366] rounded-full flex items-center justify-center relative shadow-lg shadow-green-500/40">
                  <CheckCircle className="w-12 h-12 text-white" />
                </div>
              </div>
              <div className="text-center space-y-1">
                <h3 className="text-white font-bold text-lg">Berhasil Terhubung!</h3>
                <p className="text-[#25D366] font-mono text-sm">
                  {connectedNumber || 'Nomor Terdeteksi'}
                </p>
                <p className="text-[#8696A0] text-xs pt-2">
                  Menyiapkan dashboard Anda...
                </p>
              </div>
            </div>
          )}

          {/* STATE: ERROR */}
          {qrState === 'error' && (
            <div className="flex flex-col items-center gap-5 py-6">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
                <X className="w-8 h-8 text-red-500" />
              </div>
              <div className="text-center">
                <p className="text-white font-semibold">Gagal Sinkronisasi</p>
                <p className="text-red-400/80 text-xs mt-1 px-4">{errorMsg}</p>
              </div>
              <button
                onClick={initSession}
                className="flex items-center gap-2 bg-[#25D366] hover:bg-[#20BD5C] text-[#0B141A] px-6 py-2.5 rounded-full text-xs font-bold transition-all transform active:scale-95 shadow-lg shadow-green-500/20"
              >
                <RefreshCw className="w-4 h-4" />
                COBA LAGI
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#2A3942]/30 border-t border-[#2A3942] flex justify-center">
           <p className="text-[#8696A0] text-[10px] text-center italic">
             Pastikan koneksi internet ponsel Anda stabil.
           </p>
        </div>
      </div>
    </div>
  );
};

export default QRModal;