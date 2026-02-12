import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface LoginPageProps {
  onLogin: (data: any) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  // 1. TAMBAHKAN STATE showPassword AGAR TIDAK MERAH
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '' });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onLogin(formData);
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
              <img src="/logo.svg" alt="Logo Satu Pintu" className="w-8 h-8 object-contain" />
              <span className="font-bold text-slate-800 tracking-tighter text-lg uppercase">Satu Pintu</span>
            </div>
            <h1 className="text-4xl font-bold text-slate-800 mb-2">Login</h1>
            <p className="text-slate-400 text-xs">Welcome to log in to your background management system.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="relative group">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Username</label>
              <input
                type="text"
                required
                className="w-full bg-transparent border-b border-slate-200 py-2 px-1 focus:border-emerald-500 transition-all outline-none text-sm text-slate-600 placeholder:text-slate-200"
                placeholder="admin@satupintu.com"
                onChange={(e) => setFormData({...formData, username: e.target.value})}
              />
            </div>

            <div className="relative group">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full bg-transparent border-b border-slate-200 py-2 px-1 focus:border-emerald-500 transition-all outline-none text-sm text-slate-600 placeholder:text-slate-200"
                  placeholder="Please enter your password"
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
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-10 rounded-lg shadow-lg shadow-emerald-200 transition-all active:scale-[0.95] text-xs tracking-widest"
              >
                LOGIN
              </button>
            </div>
          </form>
        </div>

        {/* SISI KANAN: ILUSTRASI */}
        <div className="hidden md:flex w-[60%] bg-[#F9FBFF] relative items-center justify-center p-10">
          <div className="absolute top-10 right-20 w-16 h-16 bg-emerald-200/50 rounded-full animate-bounce duration-[3000ms]"></div>
          
          <div className="relative w-full max-w-[500px] h-[400px]">
            {/* Dashboard Mockup */}
            <div className="absolute inset-0 m-auto w-full h-[280px] bg-white rounded-3xl shadow-[0_15px_50px_rgba(0,0,0,0.03)] border border-slate-50 overflow-hidden p-6 flex gap-4 transition-transform hover:scale-105 duration-500">
               <div className="w-10 h-full bg-slate-50 rounded-xl flex flex-col gap-3 p-2">
                  <div className="w-full aspect-square bg-emerald-100 rounded-lg flex items-center justify-center p-1">
                     <img src="/logo.svg" alt="icon" className="w-full opacity-50" />
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
                     <div className="flex-[2] bg-emerald-50/50 rounded-2xl flex items-center justify-center relative overflow-hidden">
                        <div className="w-32 h-32 border-[16px] border-emerald-500/20 rounded-full relative">
                           <div className="absolute inset-0 border-[16px] border-emerald-500 rounded-full border-t-transparent border-l-transparent -rotate-45"></div>
                        </div>
                     </div>
                     <div className="flex-1 flex flex-col gap-2">
                        <div className="w-full h-1/2 bg-slate-50 rounded-xl"></div>
                        <div className="w-full h-1/2 bg-slate-50 rounded-xl"></div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Float Card */}
            <div className="absolute -left-4 bottom-10 w-32 h-44 bg-emerald-500/10 rounded-2xl backdrop-blur-sm border border-white p-4 shadow-xl animate-float">
               <div className="w-full h-2 bg-emerald-500/20 rounded-full mb-2"></div>
               <div className="w-2/3 h-2 bg-emerald-500/20 rounded-full mb-6"></div>
               <div className="flex items-end gap-1 h-16">
                  <div className="flex-1 bg-emerald-400 rounded-t-sm" style={{height: '60%'}}></div>
                  <div className="flex-1 bg-emerald-500 rounded-t-sm" style={{height: '90%'}}></div>
                  <div className="flex-1 bg-emerald-300 rounded-t-sm" style={{height: '40%'}}></div>
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
        .animate-float { animation: float 4s ease-in-out infinite; }
      `}} />
    </div>
  );
};

export default LoginPage;