import React, { useState, useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { MainApp } from "./pages/MainApp";
import LoginPage from "./components/LoginPage";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const socketRef = useRef<Socket | null>(null);
  const lastSpeakTime = useRef<number>(0);

  // --- LOGIKA AUTH & LOGOUT ---
  const handleLogin = (userData: any) => {
    if (userData.token) {
      localStorage.setItem("token", userData.token);
    }
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    setIsLoggedIn(true);
    console.log("Login sukses! Sesi 1 jam dimulai.");
  };

  const handleLogout = useCallback(() => {
    console.warn("Sesi berakhir. Logout otomatis.");

    // 1. Bersihkan Storage
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // 2. Putus Koneksi Socket
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    // 3. Reset State
    setUser(null);
    setIsLoggedIn(false);
  }, []);

  // --- LOGIKA AUTO-LOGOUT STATIS (1 JAM) ---
  useEffect(() => {
    if (!isLoggedIn) return;

    // 1 jam = 3.600.000 ms
    const SESSION_DURATION = 3600000;

    const timer = setTimeout(() => {
      handleLogout();
    }, SESSION_DURATION);

    // Cleanup jika komponen unmount atau user logout manual
    return () => clearTimeout(timer);
  }, [isLoggedIn, handleLogout]);

  // --- LOGIKA SUARA GLOBAL ---
  const speakNotification = () => {
    const now = Date.now();
    if (now - lastSpeakTime.current < 4000) return;

    const synth = window.speechSynthesis;
    synth.cancel();

    const msg = new SpeechSynthesisUtterance("Ada pesan masuk, cek sekarang");
    const voices = synth.getVoices();
    
    const googleVoice = voices.find(
      (v) =>
        (v.name.includes("Google") || v.name.includes("Indonesian")) &&
        v.lang === "id-ID",
    );

    if (googleVoice) msg.voice = googleVoice;
    msg.lang = "id-ID";
    synth.speak(msg);
    lastSpeakTime.current = now;
  };

  // --- SOCKET CONNECTION ---
  useEffect(() => {
    if (!isLoggedIn) return;

    const apiUrl = import.meta.env.VITE_SOCKET_URL;
    socketRef.current = io(apiUrl, {
      transports: ["websocket", "polling"],
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
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        setIsLoggedIn(true);
      } catch (e) {
        handleLogout();
      }
    }
    setLoading(false);
  }, [handleLogout]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
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