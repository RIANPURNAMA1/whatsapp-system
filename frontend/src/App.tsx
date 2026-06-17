import React, { useState, useEffect, useRef, useCallback } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import { MainApp } from "./pages/MainApp";
import LoginPage from "./components/LoginPage";
import { SettingsProvider, useSettings } from "./context/SettingsContext";

function AppContent() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const { settings } = useSettings();

  const socketRef = useRef<Socket | null>(null);
  const lastSpeakTime = useRef<number>(0);
  const settingsRef = useRef(settings);
  useEffect(() => { settingsRef.current = settings; }, [settings]);

  // --- LOGIKA AUTH & LOGOUT ---
  const handleLogin = (userData: any) => {
    if (userData.token) {
      localStorage.setItem("token", userData.token);
    }
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    setIsLoggedIn(true);
    navigate("/");
    console.log("Login sukses! Sesi dimulai.");
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

  // --- LOGIKA AUTO-LOGOUT DINAMIS (dari settings) ---
  useEffect(() => {
    if (!isLoggedIn) return;

    const SESSION_DURATION = parseInt(settings.sessionTimeout, 10) * 60 * 1000;

    const timer = setTimeout(() => {
      handleLogout();
    }, SESSION_DURATION);

    // Cleanup jika komponen unmount atau user logout manual
    return () => clearTimeout(timer);
  }, [isLoggedIn, handleLogout, settings.sessionTimeout]);

  // --- LOGIKA SUARA GLOBAL (respect settings) ---
  const speakNotification = () => {
    if (!settingsRef.current.notificationSound) return;

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
      const s = settingsRef.current;
      speakNotification();
      if (s.desktopNotification && "Notification" in window && Notification.permission === "granted") {
        new Notification("Satu Pintu", {
          body: "Ada pesan masuk baru",
          icon: "/logo.svg",
        });
      }
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
        // Decode token untuk cek expiration
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp && Date.now() >= payload.exp * 1000) {
          handleLogout();
        } else {
          setUser(JSON.parse(savedUser));
          setIsLoggedIn(true);
        }
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
        <Routes>
          <Route path="/*" element={<MainApp user={user} onLogout={handleLogout} />} />
        </Routes>
      ) : (
        <Routes>
          <Route path="*" element={<LoginPage onLogin={handleLogin} />} />
        </Routes>
      )}
    </>
  );
}

function App() {
  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  );
}

export default App;