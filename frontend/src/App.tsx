import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from "socket.io-client";
import { MainApp } from './pages/MainApp';
import LoginPage from './components/LoginPage';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  const socketRef = useRef<Socket | null>(null);
  const lastSpeakTime = useRef<number>(0);

  // --- LOGIKA AUTH & LOGOUT ---
  const handleLogin = (userData: any) => {
    // Simpan token jika tersedia agar sesi tidak hilang saat refresh
    if (userData.token) {
      localStorage.setItem('token', userData.token);
    }
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setIsLoggedIn(true);
    console.log("Login sukses! Monitoring aktivitas dimulai...");
  };

  const handleLogout = useCallback(() => {
    console.warn("Logout otomatis dipicu karena tidak ada aktivitas.");
    
    // 1. Bersihkan Storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // 2. Putus Koneksi Socket
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    // 3. Reset State (Otomatis menampilkan LoginPage)
    setUser(null);
    setIsLoggedIn(false);
  }, []);

  // --- LOGIKA SESSION TIMEOUT (SET 5 DETIK) ---
  useEffect(() => {
    if (!isLoggedIn) return;

    let timer: ReturnType<typeof setTimeout>;
    
    // --- DIUBAH MENJADI 5 DETIK ---
    const TIMEOUT_DURATION = 50000; 

    const resetTimer = () => {
      // console.log("Aktivitas terdeteksi, timer direset."); 
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        handleLogout();
      }, TIMEOUT_DURATION);
    };

    // Daftar aktivitas yang dipantau (gerakan mouse, klik, ketik, scroll)
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    // Pasang event listener ke window
    activityEvents.forEach(event => {
      window.addEventListener(event, resetTimer, true);
    });

    // Inisialisasi timer pertama kali saat login
    resetTimer();

    return () => {
      if (timer) clearTimeout(timer);
      activityEvents.forEach(event => {
        window.removeEventListener(event, resetTimer, true);
      });
    };
  }, [isLoggedIn, handleLogout]);

  // --- LOGIKA SUARA GLOBAL ---
  const speakNotification = () => {
    const now = Date.now();
    if (now - lastSpeakTime.current < 4000) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const msg = new SpeechSynthesisUtterance("Ada pesan masuk, cek sekarang");
    const voices = synth.getVoices();
    const googleVoice = voices.find(v => (v.name.includes("Google") || v.name.includes("Indonesian")) && v.lang === "id-ID");
    if (googleVoice) msg.voice = googleVoice;
    msg.lang = 'id-ID';
    synth.speak(msg);
    lastSpeakTime.current = now;
  };

  // --- SOCKET CONNECTION ---
  useEffect(() => {
    if (!isLoggedIn) return;

    const apiUrl = import.meta.env.VITE_SOCKET_URL;
    socketRef.current = io(apiUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
    });

    socketRef.current.on("new_incoming_message", () => {
      speakNotification();
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [isLoggedIn]);

  // --- INITIAL SESSION CHECK ---
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      try {
        setIsLoggedIn(true);
        setUser(JSON.parse(savedUser));
      } catch (e) {
        handleLogout();
      }
    }
    setLoading(false);
  }, [handleLogout]);

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