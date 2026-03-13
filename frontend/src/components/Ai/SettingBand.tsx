import React, { useState } from "react";
import { ShieldCheck, Clock, ZapOff, Save, AlertTriangle, ShieldAlert, Timer } from "lucide-react";
import toast from "react-hot-toast";

export default function SettingBand() {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    minDelay: 10,
    maxDelay: 30,
    maxMessagesPerDay: 500,
    sleepMode: true,
    sleepStart: "22:00",
    sleepEnd: "07:00",
    isAntiBanActive: true
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Logic hit API Laravel/NodeJS simpan ke settings table
      console.log("Saving Anti-Ban settings:", formData);
      await new Promise((r) => setTimeout(r, 1000));
      toast.success("Pengaturan Anti-Ban berhasil diperbarui");
    } catch (e) {
      toast.error("Gagal menyimpan pengaturan");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 bg-[#0B141A] min-h-screen text-[#E9EDEF]">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-md">
              <ShieldCheck className="text-emerald-400 w-8 h-8" />
            </div>
            Anti-Ban Protection
          </h1>
          <p className="text-[#8696A0] text-sm mt-1">
            Lindungi nomor WhatsApp Anda dari risiko blokir dengan perilaku pengiriman yang manusiawi.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center justify-center gap-2 bg-[#00a884] hover:bg-[#00c99d] text-[#111b21] px-8 py-3 rounded-md font-bold transition-all disabled:opacity-40 shadow-lg"
          disabled={isSaving}
        >
          {isSaving ? (
             <div className="w-5 h-5 border-2 border-t-transparent animate-spin rounded-full" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          Simpan Proteksi
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: MAIN CONFIG */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* DELAY SETTINGS */}
          <div className="bg-[#202C33] rounded-md border border-[#313D45] p-6">
            <h3 className="text-white font-bold mb-6 flex items-center gap-2 uppercase text-xs tracking-widest">
              <Timer className="w-4 h-4 text-emerald-400" /> Jeda Pengiriman (Delay)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#8696A0] uppercase tracking-widest">Jeda Minimum (Detik)</label>
                <input
                  type="number"
                  value={formData.minDelay}
                  onChange={(e) => setFormData({...formData, minDelay: parseInt(e.target.value)})}
                  className="w-full bg-[#111B21] border border-[#313D45] rounded-md px-4 py-3 text-sm text-white focus:border-emerald-500/50 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#8696A0] uppercase tracking-widest">Jeda Maksimum (Detik)</label>
                <input
                  type="number"
                  value={formData.maxDelay}
                  onChange={(e) => setFormData({...formData, maxDelay: parseInt(e.target.value)})}
                  className="w-full bg-[#111B21] border border-[#313D45] rounded-md px-4 py-3 text-sm text-white focus:border-emerald-500/50 outline-none"
                />
              </div>
            </div>
            <p className="mt-4 text-[10px] text-[#8696A0] italic">
              * Bot akan mengambil angka acak antara {formData.minDelay} - {formData.maxDelay} detik sebelum mengirim pesan berikutnya.
            </p>
          </div>

          {/* SLEEP MODE */}
          <div className="bg-[#202C33] rounded-md border border-[#313D45] p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white font-bold flex items-center gap-2 uppercase text-xs tracking-widest">
                <ZapOff className="w-4 h-4 text-orange-400" /> Jam Operasional (Sleep Mode)
              </h3>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formData.sleepMode} 
                  onChange={(e) => setFormData({...formData, sleepMode: e.target.checked})}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-[#111B21] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            <div className={`grid grid-cols-2 gap-6 transition-opacity ${formData.sleepMode ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#8696A0] uppercase tracking-widest">Bot Berhenti Jam</label>
                <input
                  type="time"
                  value={formData.sleepStart}
                  onChange={(e) => setFormData({...formData, sleepStart: e.target.value})}
                  className="w-full bg-[#111B21] border border-[#313D45] rounded-md px-4 py-3 text-sm text-white focus:border-emerald-500/50 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#8696A0] uppercase tracking-widest">Bot Aktif Kembali Jam</label>
                <input
                  type="time"
                  value={formData.sleepEnd}
                  onChange={(e) => setFormData({...formData, sleepEnd: e.target.value})}
                  className="w-full bg-[#111B21] border border-[#313D45] rounded-md px-4 py-3 text-sm text-white focus:border-emerald-500/50 outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: STATUS & ADVISORY */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-gradient-to-br from-[#202C33] to-[#111B21] rounded-md border border-emerald-500/30 p-6">
            <h4 className="text-emerald-400 font-bold text-sm flex items-center gap-2 mb-4">
               <ShieldAlert className="w-5 h-5" /> Protection Status
            </h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-[#111B21] p-3 rounded border border-[#313D45]">
                <span className="text-xs text-[#8696A0]">Security Level</span>
                <span className="text-xs font-bold text-emerald-500">OPTIMIZED</span>
              </div>
              <div className="flex justify-between items-center bg-[#111B21] p-3 rounded border border-[#313D45]">
                <span className="text-xs text-[#8696A0]">Daily Limit</span>
                <span className="text-xs font-bold text-white">{formData.maxMessagesPerDay} Pesan</span>
              </div>
            </div>
          </div>

          <div className="bg-orange-500/10 border border-orange-500/30 rounded-md p-6">
            <h4 className="text-orange-400 font-bold text-sm flex items-center gap-2 mb-3">
               <AlertTriangle className="w-4 h-4" /> Penting!
            </h4>
            <ul className="text-[11px] text-[#8696A0] space-y-3 leading-relaxed">
              <li className="flex gap-2">
                <span className="text-orange-500">•</span>
                Gunakan delay minimal 10-20 detik untuk akun baru.
              </li>
              <li className="flex gap-2">
                <span className="text-orange-500">•</span>
                Jangan mengirimkan link yang sama secara massal dalam waktu singkat.
              </li>
              <li className="flex gap-2">
                <span className="text-orange-500">•</span>
                Aktifkan Sleep Mode agar bot tidak terlihat aktif 24 jam non-stop (ciri bot).
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}