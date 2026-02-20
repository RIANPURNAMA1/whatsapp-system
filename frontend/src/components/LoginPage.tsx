import React, { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

interface LoginPageProps {
  // onLogin akan dipanggil setelah fetch berhasil
  onLogin: (userData: any) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ambil URL API dari ENV Vite
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        // 1. Simpan Token ke LocalStorage agar tidak hilang saat refresh
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));

        // 2. Kirim data ke App.tsx (Parent)
        onLogin(result.user);
      } else {
        // Jika backend mengirim success: false (pass salah / user tidak ada)
        setError(result.message || 'Login gagal. Silakan coba lagi.');
      }
    } catch (err) {
      setError('Tidak dapat terhubung ke server. Pastikan backend menyala.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FF] flex items-center justify-center p-4 font-sans overflow-hidden relative">
      
      {/* Ornamen Latar Belakang */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-emerald-200/30 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-64 h-64 bg-emerald-100/40 rounded-full blur-[100px]"></div>

      {/* Main Container */}
      <div className="bg-white w-full max-w-[1100px] h-[650px] rounded-md shadow-[0_20px_80px_rgba(0,0,0,0.05)] flex overflow-hidden border border-white relative z-10">
        
        {/* SISI KIRI: FORM LOGIN */}
        <div className="w-full md:w-[40%] p-12 lg:p-16 flex flex-col justify-center">
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-8">
              <img src="/logo.svg" alt="Logo" className="w-8 h-8 object-contain" />
              <span className="font-bold text-slate-800 tracking-tighter text-lg uppercase">Satu Pintu</span>
            </div>
            <h1 className="text-4xl font-bold text-slate-800 mb-2">Login</h1>
            <p className="text-slate-400 text-xs">Welcome to log in to your background management system.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ALERT ERROR */}
            {error && (
              <div className="bg-red-50 text-red-500 text-[11px] p-3 rounded-lg border border-red-100 animate-shake">
                ⚠️ {error}
              </div>
            )}

            <div className="relative group">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Username</label>
              <input
                type="text"
                required
                disabled={isLoading}
                className="w-full bg-transparent border-b border-slate-200 py-2 px-1 focus:border-emerald-500 transition-all outline-none text-sm text-slate-600 placeholder:text-slate-200 disabled:opacity-50"
                placeholder="Masukkan username"
                onChange={(e) => setFormData({...formData, username: e.target.value})}
              />
            </div>

            <div className="relative group">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  disabled={isLoading}
                  className="w-full bg-transparent border-b border-slate-200 py-2 px-1 focus:border-emerald-500 transition-all outline-none text-sm text-slate-600 placeholder:text-slate-200 disabled:opacity-50"
                  placeholder="Masukkan password"
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-emerald-500 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full md:w-auto bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-10 rounded-lg shadow-lg shadow-emerald-200 transition-all active:scale-[0.95] text-xs tracking-widest flex items-center justify-center gap-2 disabled:bg-slate-300 disabled:shadow-none"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    MEMPROSES...
                  </>
                ) : (
                  'LOGIN'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* SISI KANAN: ILUSTRASI (SAMA SEPERTI SEBELUMNYA) */}
        <div className="hidden md:flex w-[60%] bg-[#F9FBFF] relative items-center justify-center p-10">
          <div className="absolute top-10 right-20 w-16 h-16 bg-emerald-200/50 rounded-full animate-bounce duration-[3000ms]"></div>
          <div className="relative w-full max-w-[500px] h-[400px]">
             {/* Mockup visual tetap sama */}
             <div className="absolute inset-0 m-auto w-full h-[280px] bg-white rounded-3xl shadow-[0_15px_50px_rgba(0,0,0,0.03)] border border-slate-50 overflow-hidden p-6 flex gap-4 transition-transform hover:scale-105 duration-500">
                <div className="w-10 h-full bg-slate-50 rounded-xl flex flex-col gap-3 p-2">
                   <div className="w-full aspect-square bg-emerald-100 rounded-lg flex items-center justify-center p-1">
                      <div className="w-4 h-4 bg-emerald-500 rounded-sm"></div>
                   </div>
                   <div className="w-full h-2 bg-slate-100 rounded-full"></div>
                   <div className="w-full h-2 bg-slate-100 rounded-full"></div>
                </div>
                <div className="flex-1 flex flex-col gap-4">
                   <div className="w-full h-8 flex justify-between">
                      <div className="w-1/3 h-full bg-slate-50 rounded-lg"></div>
                      <div className="w-1/4 h-full bg-slate-50 rounded-lg"></div>
                   </div>
                   <div className="flex-1 flex gap-4">
                      <div className="flex-[2] bg-emerald-50/50 rounded-2xl flex items-center justify-center">
                         <div className="w-24 h-24 border-8 border-emerald-500/20 rounded-full border-t-emerald-500 animate-spin"></div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-float { animation: float 4s ease-in-out infinite; }
        .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
      `}} />
    </div>
  );
};

export default LoginPage;