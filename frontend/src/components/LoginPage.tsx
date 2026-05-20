import React, { useState, useEffect, useCallback } from 'react';
import { Eye, EyeOff, RefreshCw, Loader2 } from 'lucide-react';

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
    <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center p-4">
      <div className="w-full max-w-[420px] bg-white rounded-lg border border-[#E4E6EB] shadow-lg p-8">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-[#1877F2] rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <h1 className="text-2xl font-bold text-[#050505]">Satu Pintu</h1>
          <p className="text-sm text-[#65676B] mt-1">WhatsApp Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-[#FFEBEE] text-[#EF4444] text-sm p-3 rounded-lg border border-[#FFCDD2] flex items-center gap-2">
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[#050505]">Username</label>
            <input
              type="text"
              required
              disabled={isLoading}
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              placeholder="Masukkan username"
              className="w-full bg-[#F0F2F5] border border-[#CCD0D5] rounded-lg py-2.5 px-3 text-sm text-[#050505] placeholder:text-[#65676B] focus:outline-none focus:ring-2 focus:ring-[#1877F2] focus:border-transparent disabled:opacity-50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[#050505]">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                disabled={isLoading}
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="Masukkan password"
                className="w-full bg-[#F0F2F5] border border-[#CCD0D5] rounded-lg py-2.5 px-3 text-sm text-[#050505] placeholder:text-[#65676B] focus:outline-none focus:ring-2 focus:ring-[#1877F2] focus:border-transparent disabled:opacity-50 pr-10"
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
            <label className="block text-sm font-medium text-[#050505]">Verifikasi Keamanan</label>
            <div className="flex items-center gap-3">
              <div className="flex-1 flex items-center justify-center h-10 bg-white border border-[#CCD0D5] rounded-lg select-none">
                <span className="font-mono text-lg font-bold tracking-[0.3em] text-[#1877F2]">
                  {captchaCode}
                </span>
              </div>
              <button
                type="button"
                onClick={generateCaptcha}
                className="p-2 text-[#65676B] hover:text-[#1877F2] transition-colors"
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
              className="w-full bg-white border border-[#CCD0D5] rounded-lg py-2 px-3 text-sm text-[#050505] placeholder:text-[#65676B] focus:outline-none focus:ring-2 focus:ring-[#1877F2] focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#1877F2] hover:bg-[#166FE5] text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
    </div>
  );
};

export default LoginPage;
