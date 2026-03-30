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
      icon: <MessageSquare size={14} className="text-blue-500" />,
      items: [
        { label: "Ramah & Sopan", text: "Gunakan bahasa yang ramah, panggil 'Kak', dan gunakan emoji yang hangat." },
        { label: "Profesional & Formal", text: "Gunakan bahasa baku yang profesional, formal, dan panggil user dengan 'Bapak/Ibu'." },
        { label: "Singkat & To-point", text: "Berikan jawaban yang sangat singkat, padat, dan langsung ke intinya tanpa basa-basi." },
        { label: "Gaya Anak Muda (Gaul)", text: "Gunakan bahasa santai, asik, tapi tetap sopan. Gunakan istilah yang relevan dengan Gen Z." },
      ]
    },
    { 
      group: "Tujuan Respon",
      icon: <Target size={14} className="text-orange-500" />,
      items: [
        { label: "Hard Selling", text: "Fokus pada keunggulan produk dan dorong user untuk segera membeli sekarang juga." },
        { label: "Soft Selling (Edukasi)", text: "Berikan edukasi terlebih dahulu mengenai manfaat produk sebelum menawarkan solusi." },
        { label: "Anti-Debat", text: "Jika user memancing keributan atau kasar, tetap tenang, jangan terpancing, dan arahkan ke solusi." },
      ]
    },
    { 
      group: "Tindakan Lanjutan (CTA)",
      icon: <UserPlus size={14} className="text-blue-500" />,
      items: [
        { label: "Arahkan Pendaftaran", text: "Di akhir chat, selalu ajak user untuk mengisi formulir pendaftaran di link yang tersedia." },
        { label: "Arahkan ke Admin Manusia", text: "Jika pertanyaan sangat kompleks, sarankan user untuk menunggu sebentar agar dibantu admin manusia." },
        { label: "Minta Testimoni", text: "Jika user terlihat puas, ajak mereka untuk memberikan ulasan atau testimoni singkat." },
      ]
    }
  ];

  return (
    <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-3">Identitas Perangkat</label>
        <input 
          type="text" 
          value={formData.bot_name} 
          onChange={(e) => setFormData({...formData, bot_name: e.target.value})} 
          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 outline-none focus:border-blue-500 transition-all placeholder:text-gray-400" 
          placeholder="Nama Bot (Contoh: Admin CS)" 
        />
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="text-blue-500" size={18} />
          <label className="text-sm font-bold text-gray-900 uppercase tracking-wider">
            Sifat & Konfigurasi Karakter
          </label>
        </div>

        <div className="space-y-6">
          {presets.map((group, gIdx) => (
            <div key={gIdx} className="space-y-3">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                {group.icon}
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">{group.group}</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {group.items.map((item, idx) => (
                  <label key={idx} className="flex items-center p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 cursor-pointer group transition-all active:scale-[0.98]">
                    <input 
                      type="checkbox" 
                      onChange={(e) => { 
                        if(e.target.checked) handlePresetClick(item.text); 
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500 bg-white"
                    />
                    <span className="ml-3 text-xs text-gray-600 group-hover:text-gray-900 transition-colors">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <label className="text-xs font-bold text-blue-600 uppercase italic">Instruksi Sistem (Prompt)</label>
          <span className="text-[9px] text-gray-400 font-mono">{formData.prompt.length} chars</span>
        </div>
        <textarea 
          value={formData.prompt}
          onChange={(e) => setFormData({...formData, prompt: e.target.value})}
          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm h-48 outline-none text-gray-900 focus:border-blue-500 transition-all resize-none font-mono leading-relaxed"
          placeholder="Hasil pilihan sifat di atas akan muncul di sini secara otomatis..."
        />
        <p className="text-[10px] text-gray-500 mt-3 leading-relaxed">
          *Anda bisa mengedit teks di atas secara manual untuk instruksi yang lebih spesifik.
        </p>
      </div>
    </div>
  );
};
