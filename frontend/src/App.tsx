import React, { useState, useEffect } from 'react';
import { MainApp } from './pages/MainApp';
import LoginPage from './components/LoginPage';

function App() {
  // Simpan status login di state
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Cek apakah user sudah pernah login sebelumnya (simpan di localStorage)
    const authStatus = localStorage.getItem('isLoggedIn');
    if (authStatus === 'true') {
      setIsLoggedIn(true);
    }
    setLoading(false);
  }, []);

  const handleLogin = (data: any) => {
    // Contoh validasi sederhana (Ganti dengan API Call jika perlu)
    if (data.username === 'admin' && data.password === 'admin123') {
      localStorage.setItem('isLoggedIn', 'true');
      setIsLoggedIn(true);
    } else {
      alert('Username atau Password salah!');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    setIsLoggedIn(false);
  };

  if (loading) return null; // Atau spinner loading

  return (
    <>
    <MainApp />
      {/* {isLoggedIn ? (
        // Jika sudah login, tampilkan aplikasi utama
        // Anda bisa mempassing fungsi logout ke MainApp jika butuh tombol logout di sana
      ) : (
        // Jika belum, tampilkan halaman login
        <LoginPage onLogin={handleLogin} />
      )} */}
    </>
  );
}

export default App;