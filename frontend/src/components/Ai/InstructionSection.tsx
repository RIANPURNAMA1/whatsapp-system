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
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-lg border border-[#E4E6EB]">
        <label className="text-xs font-bold text-[#050505] uppercase tracking-wider block mb-3">Identitas Perangkat</label>
        <input 
          type="text" 
          value={formData.bot_name} 
          onChange={(e) => setFormData({...formData, bot_name: e.target.value})} 
          className="w-full bg-[#F0F2F5] border border-[#CCD0D5] rounded-lg p-3 text-[#050505] outline-none focus:border-[#0866FF] focus:ring-1 focus:ring-[#0866FF] transition-all placeholder:text-[#65676B] text-sm" 
          placeholder="Nama Bot (Contoh: Admin CS)" 
        />
      </div>

      <div className="bg-white p-5 rounded-lg border border-[#E4E6EB]">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="text-[#0866FF]" size={18} />
          <label className="text-sm font-bold text-[#050505] uppercase tracking-wider">
            Sifat & Konfigurasi Karakter
          </label>
        </div>

        <div className="space-y-6">
          {presets.map((group, gIdx) => (
            <div key={gIdx} className="space-y-3">
              <div className="flex items-center gap-2 border-b border-[#E4E6EB] pb-2">
                {group.icon}
                <span className="text-[10px] font-bold text-[#65676B] uppercase tracking-tight">{group.group}</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {group.items.map((item, idx) => (
                  <label key={idx} className="flex items-center p-3 bg-[#F0F2F5] rounded-lg border border-[#E4E6EB] hover:border-[#0866FF] cursor-pointer group transition-all">
                    <input 
                      type="checkbox" 
                      onChange={(e) => { 
                        if(e.target.checked) handlePresetClick(item.text); 
                      }}
                      className="w-4 h-4 rounded border-[#CCD0D5] text-[#0866FF] focus:ring-[#0866FF] bg-white"
                    />
                    <span className="ml-3 text-xs text-[#65676B] group-hover:text-[#050505] transition-colors">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-5 rounded-lg border border-[#E4E6EB]">
        <div className="flex justify-between items-center mb-3">
          <label className="text-xs font-bold text-[#0866FF] uppercase italic">Instruksi Sistem (Prompt)</label>
          <span className="text-[9px] text-[#65676B] font-mono">{formData.prompt.length} chars</span>
        </div>
        <textarea 
          value={formData.prompt}
          onChange={(e) => setFormData({...formData, prompt: e.target.value})}
          className="w-full bg-[#F0F2F5] border border-[#CCD0D5] rounded-lg p-4 text-sm h-48 outline-none text-[#050505] focus:border-[#0866FF] focus:ring-1 focus:ring-[#0866FF] transition-all resize-none font-mono leading-relaxed"
          placeholder="Hasil pilihan sifat di atas akan muncul di sini secara otomatis..."
        />
        <p className="text-[10px] text-[#65676B] mt-3 leading-relaxed">
          *Anda bisa mengedit teks di atas secara manual untuk instruksi yang lebih spesifik.
        </p>
      </div>
    </div>
  );
};
