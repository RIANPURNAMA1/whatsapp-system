// components/QRModal.tsx - Modal untuk scan QR/Barcode WhatsApp
import React, { useEffect, useState, useCallback } from 'react';
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
  const { activeSession, updateSession } = useStore();
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [qrState, setQrState] = useState<QRState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [countdown, setCountdown] = useState(0);

  const initSession = useCallback(async () => {
    setQrState('loading');
    setErrorMsg('');

    try {
      await sessionApi.create(sessionId, 'Session Utama');
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
      // QR expire dalam 60 detik
      setCountdown(60);
    };

    const handleConnected = (data: { phoneNumber: string }) => {
      setQrState('connected');
      updateSession({
        id: sessionId,
        status: 'connected',
        phone_number: data.phoneNumber,
        qr_code: null,
      });

      // Tutup modal setelah 2 detik
      setTimeout(() => onClose(), 2000);
    };

    socket.on(`qr:${sessionId}`, handleQR);
    socket.on(`session:connected:${sessionId}`, handleConnected);

    // Cek apakah sudah ada QR yang pending di database
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
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Auto-init saat modal dibuka
  useEffect(() => {
    if (activeSession?.status !== 'connected') {
      initSession();
    } else {
      setQrState('connected');
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#202C33] rounded-2xl w-full max-w-sm mx-4 overflow-hidden shadow-2xl animate-bounce-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A3942]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#25D366] rounded-full flex items-center justify-center">
              <Smartphone className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-sm">Tautkan Perangkat</h2>
              <p className="text-[#8696A0] text-xs">Scan barcode untuk masuk</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#8696A0] hover:text-white transition-colors p-1 rounded-full hover:bg-[#2A3942]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {/* State: Loading */}
          {(qrState === 'idle' || qrState === 'loading') && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="w-12 h-12 text-[#25D366] animate-spin" />
              <p className="text-[#8696A0] text-sm text-center">
                Sedang memulai sesi WhatsApp...
              </p>
            </div>
          )}

          {/* State: Waiting QR */}
          {qrState === 'waiting' && (
            <div className="flex flex-col items-center gap-4">
              {/* QR Code */}
              <div className="relative">
                <div className="bg-white p-3 rounded-xl shadow-lg">
                  {qrImage ? (
                    <img
                      src={qrImage}
                      alt="QR Code WhatsApp"
                      className="w-52 h-52 object-contain"
                    />
                  ) : (
                    <div className="w-52 h-52 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-[#25D366] animate-spin" />
                    </div>
                  )}
                </div>

                {/* Corner decorations */}
                <div className="absolute -top-1 -left-1 w-5 h-5 border-t-2 border-l-2 border-[#25D366] rounded-tl-sm" />
                <div className="absolute -top-1 -right-1 w-5 h-5 border-t-2 border-r-2 border-[#25D366] rounded-tr-sm" />
                <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-2 border-l-2 border-[#25D366] rounded-bl-sm" />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-2 border-r-2 border-[#25D366] rounded-br-sm" />
              </div>

              {/* Countdown */}
              {countdown > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#25D366] animate-pulse-dot" />
                  <span className="text-[#8696A0] text-xs">
                    QR berlaku {countdown}s
                  </span>
                  {countdown < 10 && (
                    <button
                      onClick={initSession}
                      className="text-[#25D366] text-xs hover:underline"
                    >
                      Perbarui
                    </button>
                  )}
                </div>
              )}

              {/* Instructions */}
              <div className="bg-[#2A3942] rounded-xl p-4 w-full space-y-2.5">
                <p className="text-white text-xs font-semibold mb-3 flex items-center gap-2">
                  <Smartphone className="w-3.5 h-3.5 text-[#25D366]" />
                  Cara Menautkan:
                </p>
                {[
                  'Buka WhatsApp di ponsel Anda',
                  'Ketuk ⋮ Menu → Perangkat Tertaut',
                  'Ketuk "Tautkan Perangkat"',
                  'Arahkan kamera ke QR di atas',
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="w-4 h-4 rounded-full bg-[#128C7E] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-[#8696A0] text-xs leading-relaxed">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* State: Connected */}
          {qrState === 'connected' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-20 h-20 bg-[#25D366] rounded-full flex items-center justify-center animate-bounce-in shadow-lg shadow-green-500/30">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <div className="text-center">
                <p className="text-white font-semibold text-base">Berhasil Terhubung!</p>
                <p className="text-[#8696A0] text-sm mt-1">
                  {activeSession?.phone_number && `Nomor: ${activeSession.phone_number}`}
                </p>
              </div>
              <div className="flex items-center gap-2 bg-[#2A3942] rounded-full px-4 py-2">
                <Wifi className="w-3.5 h-3.5 text-[#25D366]" />
                <span className="text-[#25D366] text-xs font-medium">Online</span>
              </div>
            </div>
          )}

          {/* State: Error */}
          {qrState === 'error' && (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                <X className="w-8 h-8 text-red-400" />
              </div>
              <div className="text-center">
                <p className="text-white font-medium">Gagal Memulai</p>
                <p className="text-[#8696A0] text-sm mt-1">{errorMsg}</p>
              </div>
              <button
                onClick={initSession}
                className="flex items-center gap-2 bg-[#25D366] hover:bg-[#20BD5C] text-white px-6 py-2.5 rounded-full text-sm font-medium transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Coba Lagi
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {qrState !== 'connected' && (
          <div className="px-6 pb-5 flex justify-center">
            <p className="text-[#8696A0] text-xs text-center">
              Perangkat baru akan ditambahkan ke akun WhatsApp Anda
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRModal;