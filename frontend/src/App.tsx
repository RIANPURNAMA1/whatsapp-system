import React, { useState, useEffect } from 'react';
import { MainApp } from './pages/MainApp';
import LoginPage from './components/LoginPage';

function App() {
  // 1. Tambahkan state untuk menyimpan data User (id, nama, role, branch)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // 2. Cek apakah ada token dan data user di localStorage saat pertama kali buka web
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      setIsLoggedIn(true);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  // 3. Fungsi ini akan dipanggil oleh LoginPage setelah Fetch ke API berhasil
  const handleLogin = (userData: any) => {
    // Karena Fetch sudah dilakukan di LoginPage, 
    // di sini kita tinggal set status login ke true
    setUser(userData);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    // 4. Hapus semua jejak login
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsLoggedIn(false);
  };

  // Tampilkan loading sebentar saat mengecek localStorage
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      {isLoggedIn ? (
        // Jika sudah login, tampilkan MainApp
        // Kita passing data user dan fungsi logout agar bisa digunakan di dashboard
        <MainApp user={user} onLogout={handleLogout} />
      ) : (
        // Jika belum login, tampilkan halaman login
        <LoginPage onLogin={handleLogin} />
      )}
    </>
  );
}

export default App;