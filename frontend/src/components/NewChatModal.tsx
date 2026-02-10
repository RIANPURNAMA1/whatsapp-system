// components/NewChatModal.tsx - Modal Chat Baru
import React, { useState, useEffect } from 'react';
import { X, Search, MessageSquare, Loader2, Plus } from 'lucide-react';
import useStore from '../store/useStore';
import Avatar from './Avatar';
import { contactApi } from '../services/api';
import type { Contact } from '../types';

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

  useEffect(() => {
    loadContacts();
  }, [search]);

  const loadContacts = async () => {
    setIsLoading(true);
    try {
      const data = await contactApi.getAll(sessionId, search);
      setContacts(data);
    } catch {}
    finally { setIsLoading(false); }
  };

  const handleSelectContact = (contact: Contact) => {
    const name = contact.name || contact.push_name || contact.phone_number || contact.jid;
    onSelectContact(contact.jid, name);
    onClose();
  };

  const handleCustomPhone = () => {
    if (!customPhone.trim()) return;
    let phone = customPhone.replace(/[^0-9]/g, '');
    if (phone.startsWith('0')) phone = '62' + phone.substring(1);
    if (!phone.startsWith('62')) phone = '62' + phone;
    const jid = `${phone}@s.whatsapp.net`;
    onSelectContact(jid, '+' + phone);
    onClose();
  };

  const getContactName = (c: Contact) =>
    c.name || c.push_name || c.phone_number || c.jid.split('@')[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#202C33] rounded-2xl w-full max-w-sm mx-4 overflow-hidden shadow-2xl animate-bounce-in max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2A3942] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#25D366] rounded-full flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-white font-semibold">Pilih Kontak</h2>
          </div>
          <button onClick={onClose} className="p-1 text-[#8696A0] hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8696A0]" />
            <input
              type="text"
              placeholder="Cari kontak..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
              className="w-full bg-[#2A3942] text-[#E9EDEF] placeholder-[#8696A0] rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[#25D366]"
            />
          </div>
        </div>

        {/* Custom Phone Input */}
        <div className="px-4 pb-2 flex-shrink-0">
          <button
            onClick={() => setShowCustom(v => !v)}
            className="flex items-center gap-2 text-[#25D366] text-sm hover:text-[#20BD5C] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Masukkan nomor telepon
          </button>

          {showCustom && (
            <div className="flex gap-2 mt-2">
              <input
                type="tel"
                placeholder="Contoh: 081234567890"
                value={customPhone}
                onChange={e => setCustomPhone(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCustomPhone()}
                className="flex-1 bg-[#2A3942] text-[#E9EDEF] placeholder-[#8696A0] rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[#25D366]"
              />
              <button
                onClick={handleCustomPhone}
                className="bg-[#25D366] hover:bg-[#20BD5C] text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Chat
              </button>
            </div>
          )}
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-24 gap-2">
              <Loader2 className="w-5 h-5 text-[#25D366] animate-spin" />
              <span className="text-[#8696A0] text-sm">Memuat kontak...</span>
            </div>
          ) : contacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-24 gap-2">
              <p className="text-[#8696A0] text-sm">
                {search ? 'Kontak tidak ditemukan' : 'Belum ada kontak tersimpan'}
              </p>
            </div>
          ) : (
            contacts.map(contact => (
              <button
                key={contact.jid}
                onClick={() => handleSelectContact(contact)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#2A3942] transition-colors text-left"
              >
                <Avatar
                  name={getContactName(contact)}
                  imageUrl={contact.profile_pic_url}
                  size="md"
                />
                <div className="min-w-0">
                  <p className="text-[#E9EDEF] text-sm font-medium truncate">
                    {getContactName(contact)}
                  </p>
                  <p className="text-[#8696A0] text-xs truncate">
                    {contact.phone_number ? `+${contact.phone_number}` : contact.jid.split('@')[0]}
                  </p>
                </div>
                {contact.is_business === 1 && (
                  <span className="ml-auto text-[10px] bg-[#25D366]/20 text-[#25D366] px-2 py-0.5 rounded-full flex-shrink-0">
                    Bisnis
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NewChatModal;