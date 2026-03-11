import React, { useState, useEffect, useCallback } from 'react';
import { Eye, EyeOff, RefreshCw } from 'lucide-react';

interface LoginPageProps {
  onLogin: (userData: any) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- State Tambahan untuk Captcha ---
  const [captchaCode, setCaptchaCode] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  // Fungsi untuk generate captcha acak
  const generateCaptcha = useCallback(() => {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(result);
    setCaptchaInput(''); // Reset input saat captcha berubah
  }, []);

  // Generate captcha saat komponen pertama kali dimuat
  useEffect(() => {
    generateCaptcha();
  }, [generateCaptcha]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Verifikasi Captcha sebelum memanggil API
    if (captchaInput !== captchaCode) {
      setError('Kode captcha tidak sesuai!');
      generateCaptcha(); // Reset captcha jika salah
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        onLogin(result.user);
      } else {
        setError(result.message || 'Login gagal. Silakan coba lagi.');
        generateCaptcha(); // Reset captcha jika login gagal
      }
    } catch (err) {
      setError('Tidak dapat terhubung ke server.');
      generateCaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FF] flex items-center justify-center p-4 font-sans overflow-hidden relative">
      
      {/* Loading Progress Bar */}
      {isLoading && (
        <div className="absolute top-0 left-0 w-full h-1 z-[100] bg-emerald-100 overflow-hidden">
          <div className="h-full bg-emerald-500 animate-loading-bar shadow-[0_0_10px_#10b981]"></div>
        </div>
      )}

      {/* Ornamen Latar Belakang */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-emerald-200/30 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-64 h-64 bg-emerald-100/40 rounded-full blur-[100px]"></div>

      <div className="bg-white w-full max-w-[1100px] h-[700px] rounded-md shadow-[0_20px_80px_rgba(0,0,0,0.05)] flex overflow-hidden border border-white relative z-10">
        
        {/* SISI KIRI: FORM LOGIN */}
        <div className="w-full md:w-[45%] p-10 lg:p-14 flex flex-col justify-center relative">
          
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">S</div>
              <span className="font-bold text-slate-800 tracking-tighter text-lg uppercase">Satu Pintu</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-800 mb-1">Login</h1>
            <p className="text-slate-400 text-[10px] font-medium uppercase tracking-wider">Background Management System</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-500 text-[11px] p-3 rounded-lg border border-red-100 animate-shake flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}

            <div className="relative group">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1 tracking-widest">Username</label>
              <input
                type="text"
                required
                disabled={isLoading}
                className="w-full bg-transparent border-b border-slate-200 py-2 px-1 focus:border-emerald-500 transition-all outline-none text-sm text-slate-600 placeholder:text-slate-300 disabled:opacity-50"
                placeholder="Admin"
                onChange={(e) => setFormData({...formData, username: e.target.value})}
              />
            </div>

            <div className="relative group">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1 tracking-widest">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  disabled={isLoading}
                  className="w-full bg-transparent border-b border-slate-200 py-2 px-1 focus:border-emerald-500 transition-all outline-none text-sm text-slate-600 placeholder:text-slate-300 disabled:opacity-50"
                  placeholder="••••••••"
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

            {/* --- SECTION CAPTCHA BARU --- */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-3 ml-1 tracking-widest">Verifikasi Keamanan</label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                   <div className="relative flex items-center justify-center h-10 bg-white border border-slate-200 rounded-lg overflow-hidden select-none">
                      {/* Background noise effect sederhana */}
                      <div className="absolute inset-0 opacity-10 pointer-events-none italic text-[8px] flex flex-wrap gap-1 leading-none break-all overflow-hidden">
                        {(captchaCode + "SYSTEM").repeat(10)}
                      </div>
                      <span className="relative z-10 font-mono text-lg font-bold tracking-[0.4em] italic text-emerald-600 line-through decoration-slate-300">
                        {captchaCode}
                      </span>
                   </div>
                </div>
                <button 
                  type="button" 
                  onClick={generateCaptcha}
                  className="p-2 text-slate-400 hover:text-emerald-500 transition-colors"
                  title="Refresh Captcha"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
              <input
                type="text"
                required
                placeholder="Masukkan kode di atas"
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value)}
                className="w-full mt-3 bg-white border border-slate-200 rounded-lg py-2 px-3 focus:border-emerald-500 transition-all outline-none text-xs text-slate-600"
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full md:w-auto min-w-[160px] font-bold py-3.5 px-10 rounded-lg transition-all active:scale-[0.98] text-xs tracking-[0.2em] flex items-center justify-center gap-2 relative overflow-hidden
                  ${isLoading 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-100 hover:shadow-emerald-200'
                  }`}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                    MEMPROSES...
                  </span>
                ) : (
                  'MASUK SEKARANG'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* SISI KANAN: ILUSTRASI */}
        <div className="hidden md:flex w-[55%] bg-[#F9FBFF] relative items-center justify-center p-10 overflow-hidden">
          <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-white rounded-full opacity-50"></div>
          
          <div className="relative w-full max-w-[500px]">
             <div className="bg-white rounded-[2rem] shadow-[0_40px_100px_rgba(0,0,0,0.04)] border border-slate-100 p-8 transform rotate-[-2deg] hover:rotate-0 transition-transform duration-700 ease-out">
                <div className="flex gap-4 mb-8">
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
                    <div className="w-5 h-5 bg-emerald-500 rounded-md animate-pulse"></div>
                  </div>
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="w-1/3 h-3 bg-slate-100 rounded-full"></div>
                    <div className="w-1/2 h-2 bg-slate-50 rounded-full"></div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-32 bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center gap-2">
                     <div className="w-8 h-8 bg-white rounded-full shadow-sm"></div>
                     <div className="w-12 h-2 bg-slate-200 rounded-full"></div>
                  </div>
                  <div className="h-32 bg-emerald-500 rounded-2xl p-4 flex flex-col justify-between">
                     <div className="w-6 h-6 bg-white/20 rounded-lg"></div>
                     <div className="w-full h-2 bg-white/30 rounded-full"></div>
                  </div>
                </div>

                <div className="mt-6 w-full h-24 bg-[#111B21] rounded-2xl p-4 shadow-xl">
                   <div className="flex gap-2 items-center opacity-50">
                     <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                     <div className="w-20 h-1.5 bg-slate-700 rounded-full"></div>
                   </div>
                   <div className="mt-3 space-y-2">
                     <div className="w-full h-1 bg-slate-800 rounded-full"></div>
                     <div className="w-[80%] h-1 bg-slate-800 rounded-full"></div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0); }
          100% { transform: translateX(100%); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-loading-bar { 
          animation: loading-bar 1.5s infinite linear; 
          width: 50%;
        }
        .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
      `}} />
    </div>
  );
};

export default LoginPage;