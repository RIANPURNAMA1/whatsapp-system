import React, { useState, useEffect, useCallback } from 'react';
import { Eye, EyeOff, RefreshCw, Loader2, BarChart3 } from 'lucide-react';
import { AsteriskIcon } from './AsteriskIcon';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

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
    } catch {
      setError('Tidak dapat terhubung ke server.');
      generateCaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex font-sans">
      {/* Left Panel */}
      <div className="hidden lg:flex w-[480px] bg-[#1877F2] p-12 flex-col justify-between shrink-0">
        <div className="flex flex-col gap-6">
          <div className="w-12 h-12 flex items-center justify-center text-white">
            <AsteriskIcon className="w-10 h-10" />
          </div>
          <div>
            <p className="text-white/80 text-sm font-medium tracking-wide">Satu Pintu</p>
            <h2 className="text-white text-3xl font-bold leading-tight mt-3">
              WhatsApp Business Suite
            </h2>
            <p className="text-white/70 text-sm mt-4 leading-relaxed max-w-xs">
              Kelola leads, closing, dan analisis bisnis Anda dalam satu platform terintegrasi.
            </p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-white/70 text-xs">
            <BarChart3 className="w-4 h-4" />
            <span>Multi-device WhatsApp management</span>
          </div>
          <div className="flex items-center gap-3 text-white/70 text-xs">
            <BarChart3 className="w-4 h-4" />
            <span>Live analytics &amp; lead tracking</span>
          </div>
          <div className="flex items-center gap-3 text-white/70 text-xs">
            <BarChart3 className="w-4 h-4" />
            <span>AI-powered sales assistant</span>
          </div>
          <p className="text-white/40 text-xs pt-4">© 2024 Satu Pintu. All rights reserved.</p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[440px]">
          <div className="bg-white rounded-xl border border-[#E4E6EB] p-8 shadow-sm">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center gap-3 mb-8">
              <div className="w-10 h-10 flex items-center justify-center text-[#1877F2]">
                <AsteriskIcon className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#050505]">Satu Pintu</p>
                <p className="text-[11px] text-[#65676B]">WhatsApp Business Suite</p>
              </div>
            </div>

            <div className="hidden lg:block mb-8">
              <h1 className="text-xl font-bold text-[#050505]">Masuk</h1>
              <p className="text-sm text-[#65676B] mt-1">Masukkan kredensial Anda untuk melanjutkan</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-[#FFEBEE] text-[#EF4444] text-sm p-3 rounded-lg border border-[#FFCDD2] flex items-center gap-2">
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-[13px] font-semibold text-[#050505]">Username atau Email</label>
                <input
                  type="text"
                  required
                  disabled={isLoading}
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Masukkan username atau email"
                  className="w-full bg-white border border-[#E4E6EB] rounded-lg py-2.5 px-3.5 text-sm text-[#050505] placeholder:text-[#8C939D] outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20 transition-all disabled:opacity-50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[13px] font-semibold text-[#050505]">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    disabled={isLoading}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Masukkan password"
                    className="w-full bg-white border border-[#E4E6EB] rounded-lg py-2.5 px-3.5 text-sm text-[#050505] placeholder:text-[#8C939D] outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20 transition-all disabled:opacity-50 pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#65676B] hover:text-[#1877F2] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* CAPTCHA */}
              <div className="bg-[#F0F2F5] rounded-lg border border-[#E4E6EB] p-4 space-y-3">
                <label className="block text-[13px] font-semibold text-[#050505]">Verifikasi Keamanan</label>
                <div className="flex items-center gap-3">
                  <div className="flex-1 flex items-center justify-center h-10 bg-white border border-[#E4E6EB] rounded-lg select-none">
                    <span className="font-mono text-base font-bold tracking-[0.3em] text-[#1877F2]">
                      {captchaCode}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={generateCaptcha}
                    className="p-2.5 text-[#65676B] hover:text-[#1877F2] transition-colors bg-white rounded-lg border border-[#E4E6EB]"
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
                  className="w-full bg-white border border-[#E4E6EB] rounded-lg py-2 px-3.5 text-sm text-[#050505] placeholder:text-[#8C939D] outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#1877F2] hover:bg-[#166FE5] text-white font-semibold py-2.5 px-4 rounded-lg transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  'Masuk'
                )}
              </button>
            </form>
          </div>

          <p className="mt-4 text-center text-xs text-[#65676B]">
            Belum punya akun?{' '}
            <a href="#" className="font-semibold text-[#1877F2] hover:underline">
              Hubungi admin
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
