// utils/helpers.ts - Utility Functions
import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

// Format waktu pesan (seperti WhatsApp)
export function formatMessageTime(timestamp: string | null): string {
  if (!timestamp) return '';
  try {
    const date = parseISO(timestamp);
    return format(date, 'HH:mm');
  } catch {
    return '';
  }
}

// Format waktu untuk daftar chat
export function formatChatTime(timestamp: string | null): string {
  if (!timestamp) return '';
  try {
    const date = parseISO(timestamp);
    if (isToday(date)) return format(date, 'HH:mm');
    if (isYesterday(date)) return 'Kemarin';
    return format(date, 'dd/MM/yy');
  } catch {
    return '';
  }
}

// Format tanggal separator di chat
export function formatDateSeparator(timestamp: string): string {
  try {
    const date = parseISO(timestamp);
    if (isToday(date)) return 'Hari Ini';
    if (isYesterday(date)) return 'Kemarin';
    return format(date, 'dd MMMM yyyy', { locale: id });
  } catch {
    return '';
  }
}

// Apakah dua pesan berbeda hari?
export function isDifferentDay(a: string, b: string): boolean {
  try {
    const dateA = parseISO(a);
    const dateB = parseISO(b);
    return format(dateA, 'yyyy-MM-dd') !== format(dateB, 'yyyy-MM-dd');
  } catch {
    return false;
  }
}

// Format nomor telepon dari JID
export function formatPhoneFromJid(jid: string): string {
  const num = jid.split('@')[0]?.split(':')[0];
  if (!num) return jid;
  // Format dengan pemisah
  if (num.startsWith('62')) {
    const local = '0' + num.substring(2);
    if (local.length === 12) return `${local.substring(0, 4)}-${local.substring(4, 8)}-${local.substring(8)}`;
    if (local.length === 11) return `${local.substring(0, 4)}-${local.substring(4, 7)}-${local.substring(7)}`;
  }
  return `+${num}`;
}

// Mendapatkan nama tampilan dari chat/kontak
export function getDisplayName(chat: {
  display_name?: string | null;
  name?: string | null;
  jid: string;
}): string {
  return chat.display_name || chat.name || formatPhoneFromJid(chat.jid);
}

// Mendapatkan inisial untuk avatar
export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

// Generate warna konsisten berdasarkan string
export function getAvatarColor(str: string): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    '#82E0AA', '#F1948A', '#F0B27A', '#A9CCE3', '#ABEBC6',
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// Truncate teks panjang
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

// Parse emoji dari teks
export function hasEmoji(text: string): boolean {
  const emojiRegex = /\p{Emoji}/u;
  return emojiRegex.test(text);
}

// Format ukuran file
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Cek apakah JID adalah grup
export function isGroupJid(jid: string): boolean {
  return jid.includes('@g.us');
}

// Status check mark icons
export function getStatusIcon(status: string, isFromMe: boolean): string {
  if (!isFromMe) return '';
  switch (status) {
    case 'pending': return '🕐';
    case 'sent': return '✓';
    case 'delivered': return '✓✓';
    case 'read': return '✓✓'; // akan di-style dengan warna biru
    case 'failed': return '⚠';
    default: return '✓';
  }
}

// Format tipe pesan untuk preview
export function formatMessagePreview(type: string, content: string | null): string {
  if (content) return content;
  switch (type) {
    case 'image': return '📷 Foto';
    case 'video': return '🎥 Video';
    case 'audio': return '🎵 Pesan Suara';
    case 'document': return '📄 Dokumen';
    case 'sticker': return '😄 Stiker';
    case 'location': return '📍 Lokasi';
    case 'contact': return '👤 Kontak';
    default: return 'Pesan';
  }
}

export function formatLastSeen(timestamp: number | null): string {
  if (!timestamp) return '';
  const now = Date.now();
  const diff = now - timestamp * 1000;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'baru saja';
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;
  return format(new Date(timestamp * 1000), 'dd/MM/yy');
}