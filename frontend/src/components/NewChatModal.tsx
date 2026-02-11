import React, { useState, useEffect, useCallback } from 'react';
import { X, Search, MessageSquare, Loader2, Plus } from 'lucide-react';
import Avatar from './Avatar';
import { contactApi } from '../services/api';
import type { Contact } from '../types';
import toast from 'react-hot-toast';

interface NewChatModalProps {
  sessionId: string;
  onClose: () => void;
  onSelectContact: (jid: string, name: string) => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
  sessionId,
  onClose,
  onSelectContact,
}) => {
  const [search, setSearch] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [customPhone, setCustomPhone] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  // ── Fungsi Load Kontak ──────────────────────────────────────────
  const loadContacts = useCallback(async (query: string = '') => {
    if (!sessionId) return;
    
    setIsLoading(true);
    try {
      // Pastikan API memanggil endpoint yang mengembalikan daftar kontak WhatsApp
      const data = await contactApi.getAll(sessionId, query);
      setContacts(data || []);
    } catch (err) {
      console.error("Gagal memuat kontak:", err);
      // Jangan tampilkan toast error jika hanya karena pencarian kosong
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  // ── Auto Load saat modal terbuka atau search berubah ────────────
  useEffect(() => {
    // Memberikan delay sedikit (debounce) agar tidak hit API setiap ketikan
    const delayDebounce = setTimeout(() => {
      loadContacts(search);
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [search, loadContacts]);

  const handleSelectContact = (contact: Contact) => {
    const name = contact.name || contact.push_name || contact.phone_number || contact.jid;
    onSelectContact(contact.jid, name);
    onClose();
  };

  const handleCustomPhone = () => {
    if (!customPhone.trim()) return;
    
    // Pembersihan nomor: hapus karakter selain angka
    let phone = customPhone.replace(/[^0-9]/g, '');
    
    // Format otomatis ke standar WhatsApp (Contoh: Indonesia 62)
    if (phone.startsWith('0')) {
      phone = '62' + phone.substring(1);
    }
    
    // Jika nomor terlalu pendek
    if (phone.length < 9) {
      toast.error("Nomor telepon terlalu pendek");
      return;
    }

    const jid = `${phone}@s.whatsapp.net`;
    onSelectContact(jid, `+${phone}`);
    onClose();
  };

  const getContactName = (c: Contact) =>
    c.name || c.push_name || c.phone_number || c.jid.split('@')[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#202C33] rounded-2xl w-full max-w-sm mx-4 overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2A3942]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#00A884] rounded-full flex items-center justify-center shadow-lg">
              <MessageSquare className="w-5 h-5 text-[#111B21]" />
            </div>
            <div>
              <h2 className="text-[#E9EDEF] font-semibold">Chat Baru</h2>
              <p className="text-[#8696A0] text-[11px] uppercase tracking-wider">Pilih Kontak</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-[#8696A0] hover:bg-[#2A3942] rounded-full transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Input Search */}
        <div className="px-4 py-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8696A0] group-focus-within:text-[#00A884] transition-colors" />
            <input
              type="text"
              placeholder="Cari nama atau nomor..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
              className="w-full bg-[#2A3942] text-[#E9EDEF] placeholder-[#8696A0] rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none border border-transparent focus:border-[#00A884]/50 transition-all"
            />
          </div>
        </div>

        {/* Action: Manual Phone */}
        <div className="px-4 pb-3">
          <button
            onClick={() => setShowCustom(!showCustom)}
            className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-all ${
              showCustom ? 'bg-[#00A884] text-[#111B21]' : 'bg-[#2A3942] text-[#00A884] hover:bg-[#32434E]'
            }`}
          >
            <Plus className="w-4 h-4" />
            {showCustom ? 'Tutup Input Nomor' : 'Masukkan Nomor Manual'}
          </button>

          {showCustom && (
            <div className="flex gap-2 mt-3 animate-in slide-in-from-top-2 duration-200">
              <input
                type="tel"
                placeholder="628123xxx"
                value={customPhone}
                onChange={e => setCustomPhone(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCustomPhone()}
                className="flex-1 bg-[#111B21] text-[#E9EDEF] border border-[#2A3942] rounded-xl px-4 py-2 text-sm outline-none focus:border-[#00A884]"
              />
              <button
                onClick={handleCustomPhone}
                className="bg-[#00A884] text-[#111B21] px-5 py-2 rounded-xl text-sm font-bold hover:bg-[#00C49A]"
              >
                Chat
              </button>
            </div>
          )}
        </div>

        {/* List Kontak */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-8 h-8 text-[#00A884] animate-spin" />
              <span className="text-[#8696A0] text-sm italic">Menyinkronkan kontak...</span>
            </div>
          ) : contacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
              <p className="text-[#8696A0] text-sm">
                {search ? `Tidak ditemukan "${search}"` : 'Belum ada kontak di WhatsApp ini.'}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {contacts.map(contact => (
                <button
                  key={contact.jid}
                  onClick={() => handleSelectContact(contact)}
                  className="w-full flex items-center gap-4 px-3 py-3 rounded-xl hover:bg-[#2A3942] transition-all group"
                >
                  <Avatar
                    name={getContactName(contact)}
                    imageUrl={contact.profile_pic_url}
                    size="md"
                  />
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-[#E9EDEF] text-[15px] font-medium truncate group-hover:text-[#00A884]">
                      {getContactName(contact)}
                    </p>
                    <p className="text-[#8696A0] text-xs mt-0.5 truncate">
                      {contact.phone_number ? `+${contact.phone_number}` : 'No phone number'}
                    </p>
                  </div>
                  {contact.is_business === 1 && (
                    <span className="text-[10px] bg-[#00A884]/10 text-[#00A884] border border-[#00A884]/20 px-2 py-0.5 rounded-lg font-bold">
                      BISNIS
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewChatModal;