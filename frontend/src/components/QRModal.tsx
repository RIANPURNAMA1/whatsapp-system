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
  
  const existingSession = sessions.find(s => s.id === sessionId);

  const [deviceName, setDeviceName] = useState(existingSession?.name || '');
  const [isNameConfirmed, setIsNameConfirmed] = useState(!!existingSession?.name);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [qrState, setQrState] = useState<QRState>(existingSession?.name ? 'waiting' : 'idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [connectedNumber, setConnectedNumber] = useState<string | null>(null);

  const initSession = useCallback(async () => {
    if (!deviceName.trim()) return;

    setQrState('loading');
    setErrorMsg('');
    setIsNameConfirmed(true);

    try {
      await sessionApi.create(sessionId, deviceName.trim());
      setQrState('waiting');
    } catch (err: any) {
      setQrState('error');
      setErrorMsg(err.message || 'Gagal memulai sesi');
    }
  }, [sessionId, deviceName]);

  useEffect(() => {
    if (!isNameConfirmed) return;

    const socket = getSocket();

    const handleQR = (data: { qr: string }) => {
      console.log(`[SOCKET] QR Received for ${sessionId}`);
      setQrImage(data.qr);
      setQrState('waiting');
      setCountdown(60);
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

      setTimeout(() => onClose(), 3000);
    };

    socket.on(`qr:${sessionId}`, handleQR);
    socket.on(`session:connected:${sessionId}`, handleConnected);

    return () => {
      socket.off(`qr:${sessionId}`, handleQR);
      socket.off(`session:connected:${sessionId}`, handleConnected);
    };
  }, [sessionId, isNameConfirmed, updateSession, onClose]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-gray-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <PlusCircle className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-gray-900 font-semibold text-sm">
                {existingSession?.name ? 'Hubungkan Kembali' : 'Tambah Perangkat'}
              </h2>
              <p className="text-gray-400 text-[10px] uppercase font-mono">{sessionId}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="px-6 py-8">
          
          {/* STEP 1: INPUT NAMA */}
          {!isNameConfirmed ? (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500">
                  <Smartphone size={32} />
                </div>
                <h3 className="text-gray-900 font-medium mb-1">Beri Nama Perangkat</h3>
                <p className="text-gray-500 text-xs">Contoh: CS Admin, WhatsApp Marketing</p>
              </div>

              <div className="space-y-3">
                <input
                  autoFocus
                  type="text"
                  placeholder="Nama Perangkat..."
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && initSession()}
                  className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:bg-white"
                />
                <button
                  onClick={initSession}
                  disabled={!deviceName.trim()}
                  className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/25"
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
                  <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                  <p className="text-gray-500 text-sm italic">Menghubungkan ke WhatsApp...</p>
                </div>
              )}

              {/* WAITING QR STATE */}
              {qrState === 'waiting' && (
                <div className="flex flex-col items-center gap-6 w-full">
                  <div className="relative p-3 bg-white rounded-xl border border-gray-200 shadow-sm">
                    {qrImage ? (
                      <img src={qrImage} alt="WhatsApp QR" className="w-48 h-48" />
                    ) : (
                      <div className="w-48 h-48 flex flex-col items-center justify-center bg-gray-50 text-gray-400">
                        <Loader2 className="animate-spin mb-2" />
                        <span className="text-[10px]">Menunggu Barcode...</span>
                      </div>
                    )}
                  </div>

                  {countdown > 0 && (
                    <div className="text-blue-600 text-[11px] font-bold bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                      QR Kedaluwarsa: {countdown}s
                    </div>
                  )}

                  <div className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-[11px] space-y-1 text-gray-500">
                    <p className="text-gray-700 font-bold mb-1">Cara Menghubungkan:</p>
                    <p>1. Buka WhatsApp di ponsel Anda</p>
                    <p>2. Tap Menu atau Pengaturan &gt; Perangkat Tertaut</p>
                    <p>3. Tap Tautkan Perangkat dan arahkan ke layar ini</p>
                  </div>
                </div>
              )}

              {/* CONNECTED STATE */}
              {qrState === 'connected' && (
                <div className="py-6 flex flex-col items-center text-center gap-4">
                  <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center animate-bounce shadow-lg shadow-emerald-500/20">
                    <CheckCircle size={40} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-gray-900 font-bold text-lg">Berhasil Terhubung!</h3>
                    <p className="text-emerald-600 font-mono text-sm">{connectedNumber}</p>
                    <p className="text-gray-400 text-xs mt-2 italic">Menutup jendela dalam 3 detik...</p>
                  </div>
                </div>
              )}

              {/* ERROR STATE */}
              {qrState === 'error' && (
                <div className="py-6 flex flex-col items-center text-center gap-4">
                  <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500">
                    <X size={32} />
                  </div>
                  <p className="text-red-500 text-sm">{errorMsg}</p>
                  <button
                    onClick={() => { setIsNameConfirmed(false); setQrState('idle'); }}
                    className="text-blue-600 text-xs font-bold hover:underline"
                  >
                    Ulangi Proses
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 text-center">
          <p className="text-gray-400 text-[10px]">
            Pastikan ponsel Anda memiliki koneksi internet aktif.
          </p>
        </div>
      </div>
    </div>
  );
};

export default QRModal;
