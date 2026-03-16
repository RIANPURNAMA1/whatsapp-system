import React from "react";
import toast from "react-hot-toast";
import { Sparkles, MessageSquare, Target, UserPlus } from "lucide-react";

interface Props {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
}

export const InstructionSection: React.FC<Props> = ({ formData, setFormData }) => {
  
  const handlePresetClick = (presetText: string) => {
    setFormData((prev: any) => ({
      ...prev,
      prompt: prev.prompt ? `${prev.prompt}\n- ${presetText}` : `- ${presetText}`
    }));
    toast.success("Gaya bahasa ditambahkan");
  };

  const presets = [
    { 
      group: "Gaya Komunikasi",
      icon: <MessageSquare size={14} className="text-blue-400" />,
      items: [
        { label: "Ramah & Sopan", text: "Gunakan bahasa yang ramah, panggil 'Kak', dan gunakan emoji yang hangat." },
        { label: "Profesional & Formal", text: "Gunakan bahasa baku yang profesional, formal, dan panggil user dengan 'Bapak/Ibu'." },
        { label: "Singkat & To-point", text: "Berikan jawaban yang sangat singkat, padat, dan langsung ke intinya tanpa basa-basi." },
        { label: "Gaya Anak Muda (Gaul)", text: "Gunakan bahasa santai, asik, tapi tetap sopan. Gunakan istilah yang relevan dengan Gen Z." },
      ]
    },
    { 
      group: "Tujuan Respon",
      icon: <Target size={14} className="text-orange-400" />,
      items: [
        { label: "Hard Selling", text: "Fokus pada keunggulan produk dan dorong user untuk segera membeli sekarang juga." },
        { label: "Soft Selling (Edukasi)", text: "Berikan edukasi terlebih dahulu mengenai manfaat produk sebelum menawarkan solusi." },
        { label: "Anti-Debat", text: "Jika user memancing keributan atau kasar, tetap tenang, jangan terpancing, dan arahkan ke solusi." },
      ]
    },
    { 
      group: "Tindakan Lanjutan (CTA)",
      icon: <UserPlus size={14} className="text-emerald-400" />,
      items: [
        { label: "Arahkan Pendaftaran", text: "Di akhir chat, selalu ajak user untuk mengisi formulir pendaftaran di link yang tersedia." },
        { label: "Arahkan ke Admin Manusia", text: "Jika pertanyaan sangat kompleks, sarankan user untuk menunggu sebentar agar dibantu admin manusia." },
        { label: "Minta Testimoni", text: "Jika user terlihat puas, ajak mereka untuk memberikan ulasan atau testimoni singkat." },
      ]
    }
  ];

  return (
    <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
      {/* NAMA BOT */}
      <div className="bg-[#202C33] p-6 rounded-2xl border border-[#313D45] shadow-sm">
        <label className="text-[10px] font-bold text-[#8696A0] uppercase tracking-widest block mb-3">Identitas Perangkat</label>
        <input 
  type="text" 
  // 1. Ambil nilai dari bot_name
  value={formData.bot_name} 
  // 2. Ubah juga ke bot_name (Gunakan underscore agar sinkron)
  onChange={(e) => setFormData({...formData, bot_name: e.target.value})} 
  className="w-full bg-[#111B21] border border-[#313D45] rounded-xl p-3 text-white outline-none focus:border-emerald-500 transition-all placeholder:text-[#3b4a54]" 
  placeholder="Nama Bot (Contoh: Admin CS)" 
/>
      </div>

      {/* SIFAT AI PRESETS */}
      <div className="bg-[#202C33] p-6 rounded-2xl border border-[#313D45] shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="text-emerald-500" size={18} />
          <label className="text-xs font-bold text-white uppercase tracking-wider">
            Sifat & Konfigurasi Karakter
          </label>
        </div>

        <div className="space-y-6">
          {presets.map((group, gIdx) => (
            <div key={gIdx} className="space-y-3">
              <div className="flex items-center gap-2 border-b border-[#313D45] pb-2">
                {group.icon}
                <span className="text-[10px] font-bold text-[#8696A0] uppercase tracking-tighter">{group.group}</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {group.items.map((item, idx) => (
                  <label key={idx} className="flex items-center p-3 bg-[#111B21] rounded-xl border border-[#313D45] hover:border-[#414c55] cursor-pointer group transition-all active:scale-[0.98]">
                    <input 
                      type="checkbox" 
                      onChange={(e) => { 
                        if(e.target.checked) handlePresetClick(item.text); 
                      }}
                      className="w-4 h-4 rounded border-[#313D45] text-emerald-500 focus:ring-emerald-500 bg-[#202C33]"
                    />
                    <span className="ml-3 text-xs text-[#8696A0] group-hover:text-white transition-colors">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CUSTOM PROMPT */}
      <div className="bg-[#202C33] p-6 rounded-2xl border border-[#313D45] shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <label className="text-xs font-bold text-emerald-400 uppercase italic">Instruksi Sistem (Prompt)</label>
          <span className="text-[9px] text-[#8696A0] font-mono">{formData.prompt.length} chars</span>
        </div>
        <textarea 
          value={formData.prompt}
          onChange={(e) => setFormData({...formData, prompt: e.target.value})}
          className="w-full bg-[#111B21] border border-[#313D45] rounded-xl p-4 text-sm h-48 outline-none text-white focus:border-emerald-500 transition-all resize-none font-mono leading-relaxed"
          placeholder="Hasil pilihan sifat di atas akan muncul di sini secara otomatis..."
        />
        <p className="text-[10px] text-[#8696A0] mt-3 leading-relaxed">
          *Anda bisa mengedit teks di atas secara manual untuk instruksi yang lebih spesifik.
        </p>
      </div>
    </div>
  );
};