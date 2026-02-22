import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface LoginPageProps {
  onLogin: (userData: any) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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
      }
    } catch (err) {
      setError('Tidak dapat terhubung ke server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FF] flex items-center justify-center p-4 font-sans overflow-hidden relative">
      
      {/* Loading Progress Bar (Top of Screen) */}
      {isLoading && (
        <div className="absolute top-0 left-0 w-full h-1 z-[100] bg-emerald-100 overflow-hidden">
          <div className="h-full bg-emerald-500 animate-loading-bar shadow-[0_0_10px_#10b981]"></div>
        </div>
      )}

      {/* Ornamen Latar Belakang */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-emerald-200/30 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-64 h-64 bg-emerald-100/40 rounded-full blur-[100px]"></div>

      <div className="bg-white w-full max-w-[1100px] h-[650px] rounded-md shadow-[0_20px_80px_rgba(0,0,0,0.05)] flex overflow-hidden border border-white relative z-10">
        
        {/* SISI KIRI: FORM LOGIN */}
        <div className="w-full md:w-[40%] p-12 lg:p-16 flex flex-col justify-center relative">
          
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">S</div>
              <span className="font-bold text-slate-800 tracking-tighter text-lg uppercase">Satu Pintu</span>
            </div>
            <h1 className="text-4xl font-bold text-slate-800 mb-2">Login</h1>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Background Management System</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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

            <div className="pt-6">
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
        <div className="hidden md:flex w-[60%] bg-[#F9FBFF] relative items-center justify-center p-10 overflow-hidden">
          {/* Decorative Circles */}
          <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-white rounded-full opacity-50"></div>
          
          <div className="relative w-full max-w-[500px]">
             {/* Mockup Dashboard */}
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