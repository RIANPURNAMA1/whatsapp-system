import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from "socket.io-client";
import { MainApp } from './pages/MainApp';
import LoginPage from './components/LoginPage';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  const socketRef = useRef<Socket | null>(null);
  const lastSpeakTime = useRef<number>(0);

  // --- LOGIKA SUARA GLOBAL (PERBAIKAN) ---
  const speakNotification = () => {
    const now = Date.now();
    if (now - lastSpeakTime.current < 4000) return;

    // Gunakan synth konstan
    const synth = window.speechSynthesis;
    
    // Batalkan antrean suara sebelumnya
    synth.cancel();

    const msg = new SpeechSynthesisUtterance("Ada pesan masuk, cek sekarang");
    
    // Perbaikan: Ambil suara di dalam fungsi karena suara seringkali dimuat telat oleh browser
    const voices = synth.getVoices();
    const googleVoice = voices.find(v => (v.name.includes("Google") || v.name.includes("Indonesian")) && v.lang === "id-ID");
    
    if (googleVoice) msg.voice = googleVoice;
    msg.lang = 'id-ID';
    msg.rate = 1.0;
    msg.pitch = 1.0;

    synth.speak(msg);
    lastSpeakTime.current = now;
  };

  // --- REAL-TIME MONITOR (PERBAIKAN) ---
  useEffect(() => {
    if (!isLoggedIn) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    // Pastikan URL tidak memiliki trailing slash yang salah
    const apiUrl = import.meta.env.VITE_SOCKET_URL;
    
    socketRef.current = io(apiUrl, {
      transports: ['websocket', 'polling'], // Tambahkan polling sebagai fallback
      reconnection: true,
      reconnectionAttempts: 5,
    });

    socketRef.current.on("connect", () => {
      console.log("🟢 Socket Connected:", socketRef.current?.id);
    });

    socketRef.current.on("connect_error", (err) => {
      console.error("🔴 Socket Connection Error:", err.message);
    });

    // Menerima sinyal pesan baru
    socketRef.current.on("new_incoming_message", (data) => {
      console.log("📩 Signal received:", data);
      speakNotification();
    });

    // Perbaikan: Pancing list suara agar browser Chrome/Edge siap
    window.speechSynthesis.getVoices();
    const handleVoicesChanged = () => window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
    };
  }, [isLoggedIn]);

  // --- LOGIKA AUTH ---
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      setIsLoggedIn(true);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData: any) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsLoggedIn(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#111B21]">
        <div className="w-10 h-10 border-4 border-[#00a884] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      {isLoggedIn ? (
        <MainApp user={user} onLogout={handleLogout} />
      ) : (
        <LoginPage onLogin={handleLogin} />
      )}
    </>
  );
}

export default App;