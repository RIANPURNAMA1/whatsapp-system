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

  const [captchaCode, setCaptchaCode] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  const generateCaptcha = useCallback(() => {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(result);
    setCaptchaInput('');
  }, []);

  useEffect(() => {
    generateCaptcha();
  }, [generateCaptcha]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (captchaInput !== captchaCode) {
      setError('Kode captcha tidak sesuai!');
      generateCaptcha();
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
        generateCaptcha();
      }
    } catch (err) {
      setError('Tidak dapat terhubung ke server.');
      generateCaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans overflow-hidden relative">
      
      {/* Loading Progress Bar */}
      {isLoading && (
        <div className="absolute top-0 left-0 w-full h-1 z-[100] bg-blue-100 overflow-hidden">
          <div className="h-full bg-blue-500 animate-loading-bar shadow-[0_0_10px_#8b5cf6]"></div>
        </div>
      )}

      {/* Background Ornaments */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-blue-200/30 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-64 h-64 bg-blue-100/40 rounded-full blur-[100px]"></div>

      <div className="bg-white w-full max-w-[1100px] h-[700px] rounded-md shadow-[0_20px_80px_rgba(0,0,0,0.05)] flex overflow-hidden border border-gray-100 relative z-10">
        
        {/* SISI KIRI: FORM LOGIN */}
        <div className="w-full md:w-[45%] p-10 lg:p-14 flex flex-col justify-center relative">
          
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">S</div>
              <span className="font-bold text-gray-800 tracking-tighter text-lg uppercase">Satu Pintu</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-1">Login</h1>
            <p className="text-gray-400 text-[10px] font-medium uppercase tracking-wider">Background Management System</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-500 text-[11px] p-3 rounded-lg border border-red-100 animate-shake flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}

            <div className="relative group">
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1 tracking-widest">Username</label>
              <input
                type="text"
                required
                disabled={isLoading}
                className="w-full bg-transparent border-b border-gray-200 py-2 px-1 focus:border-blue-500 transition-all outline-none text-sm text-gray-600 placeholder:text-gray-300 disabled:opacity-50"
                placeholder="Admin"
                onChange={(e) => setFormData({...formData, username: e.target.value})}
              />
            </div>

            <div className="relative group">
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1 tracking-widest">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  disabled={isLoading}
                  className="w-full bg-transparent border-b border-gray-200 py-2 px-1 focus:border-blue-500 transition-all outline-none text-sm text-gray-600 placeholder:text-gray-300 disabled:opacity-50"
                  placeholder="••••••••"
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-blue-500 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* CAPTCHA */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-3 ml-1 tracking-widest">Verifikasi Keamanan</label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                   <div className="relative flex items-center justify-center h-10 bg-white border border-gray-200 rounded-lg overflow-hidden select-none">
                     <div className="absolute inset-0 opacity-10 pointer-events-none italic text-[8px] flex flex-wrap gap-1 leading-none break-all overflow-hidden">
                       {(captchaCode + "SYSTEM").repeat(10)}
                     </div>
                     <span className="relative z-10 font-mono text-lg font-bold tracking-[0.4em] italic text-blue-600 line-through decoration-gray-300">
                       {captchaCode}
                     </span>
                   </div>
                </div>
                <button 
                  type="button" 
                  onClick={generateCaptcha}
                  className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
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
                className="w-full mt-3 bg-white border border-gray-200 rounded-lg py-2 px-3 focus:border-blue-500 transition-all outline-none text-xs text-gray-600"
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full md:w-auto min-w-[160px] font-bold py-3.5 px-10 rounded-lg transition-all active:scale-[0.98] text-xs tracking-[0.2em] flex items-center justify-center gap-2 relative overflow-hidden
                  ${isLoading 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-100 hover:shadow-blue-200'
                  }`}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping"></span>
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
        <div className="hidden md:flex w-[55%] bg-blue-50 relative items-center justify-center p-10 overflow-hidden">
          <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-white rounded-full opacity-50"></div>
          
          <div className="relative w-full max-w-[500px]">
             <div className="bg-white rounded-[2rem] shadow-[0_40px_100px_rgba(0,0,0,0.04)] border border-gray-100 p-8 transform rotate-[-2deg] hover:rotate-0 transition-transform duration-700 ease-out">
                <div className="flex gap-4 mb-8">
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                    <div className="w-5 h-5 bg-blue-500 rounded-md animate-pulse"></div>
                  </div>
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="w-1/3 h-3 bg-gray-100 rounded-full"></div>
                    <div className="w-1/2 h-2 bg-gray-50 rounded-full"></div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-32 bg-gray-50 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center gap-2">
                     <div className="w-8 h-8 bg-white rounded-full shadow-sm"></div>
                     <div className="w-12 h-2 bg-gray-200 rounded-full"></div>
                  </div>
                  <div className="h-32 bg-blue-500 rounded-2xl p-4 flex flex-col justify-between">
                     <div className="w-6 h-6 bg-white/20 rounded-lg"></div>
                     <div className="w-full h-2 bg-white/30 rounded-full"></div>
                  </div>
                </div>

                <div className="mt-6 w-full h-24 bg-gray-100 rounded-2xl p-4 shadow-xl">
                   <div className="flex gap-2 items-center opacity-50">
                     <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                     <div className="w-20 h-1.5 bg-gray-600 rounded-full"></div>
                   </div>
                   <div className="mt-3 space-y-2">
                     <div className="w-full h-1 bg-gray-700 rounded-full"></div>
                     <div className="w-[80%] h-1 bg-gray-700 rounded-full"></div>
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
