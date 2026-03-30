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

  const loadContacts = useCallback(async (query: string = '') => {
    if (!sessionId) return;
    
    setIsLoading(true);
    try {
      const data = await contactApi.getAll(sessionId, query);
      setContacts(data || []);
    } catch (err) {
      console.error("Gagal memuat kontak:", err);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
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
    
    let phone = customPhone.replace(/[^0-9]/g, '');
    
    if (phone.startsWith('0')) {
      phone = '62' + phone.substring(1);
    }
    
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-sm mx-4 overflow-hidden shadow-2xl border border-gray-200 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center shadow-lg">
              <MessageSquare className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-gray-900 font-semibold">Chat Baru</h2>
              <p className="text-gray-400 text-[11px] uppercase tracking-wider">Pilih Kontak</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Input Search */}
        <div className="px-4 py-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Cari nama atau nomor..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
              className="w-full bg-gray-50 text-gray-900 placeholder-gray-400 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none border border-transparent focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Action: Manual Phone */}
        <div className="px-4 pb-3">
          <button
            onClick={() => setShowCustom(!showCustom)}
            className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-all ${
              showCustom ? 'bg-blue-500 text-white' : 'bg-gray-100 text-blue-600 hover:bg-gray-200'
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
                className="flex-1 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-500"
              />
              <button
                onClick={handleCustomPhone}
                className="bg-blue-500 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-blue-600"
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
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <span className="text-gray-400 text-sm italic">Menyinkronkan kontak...</span>
            </div>
          ) : contacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
              <p className="text-gray-400 text-sm">
                {search ? `Tidak ditemukan "${search}"` : 'Belum ada kontak di WhatsApp ini.'}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {contacts.map(contact => (
                <button
                  key={contact.jid}
                  onClick={() => handleSelectContact(contact)}
                  className="w-full flex items-center gap-4 px-3 py-3 rounded-xl hover:bg-gray-50 transition-all group"
                >
                  <Avatar
                    name={getContactName(contact)}
                    imageUrl={contact.profile_pic_url}
                    size="md"
                  />
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-gray-900 text-[15px] font-medium truncate group-hover:text-blue-600">
                      {getContactName(contact)}
                    </p>
                    <p className="text-gray-400 text-xs mt-0.5 truncate">
                      {contact.phone_number ? `+${contact.phone_number}` : 'No phone number'}
                    </p>
                  </div>
                  {contact.is_business === 1 && (
                    <span className="text-[10px] bg-blue-100 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-lg font-bold">
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
