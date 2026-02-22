import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  MapPin, 
  Mail, 
  Circle,
  Edit2,
  Trash2,
  Shield,
  X,
  ChevronDown,
  Loader2
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL;

// --- 1. KOMPONEN MODAL INTERNAL (RESPONSIF) ---
const Modal = ({ isOpen, onClose, title, children }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-[#202c33] w-full max-w-md rounded-2xl shadow-2xl relative z-10 border border-[#313d45] flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-[#313d45] flex justify-between items-center shrink-0">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-[#2a3942] rounded-full text-[#8696a0] hover:text-white transition-all">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- 2. KOMPONEN UTAMA USER MANAGEMENT ---
const UserManagementView = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [userRes, roleRes] = await Promise.all([
        fetch(`${API_URL}/users`),
        fetch(`${API_URL}/roles`)
      ]);
      const userData = await userRes.json();
      const roleData = await roleRes.json();
      
      if (userData.success) setUsers(userData.data);
      if (roleData.success) setRoles(roleData.data);
    } catch (error) {
      console.error("Gagal mengambil data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getOnlineStatus = (lastLogin: string) => {
    if (!lastLogin) return false;
    const now = new Date().getTime();
    const lastActive = new Date(lastLogin).getTime();
    return (now - lastActive) / 1000 / 60 < 5;
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    const isEdit = !!editingUser;

    try {
      const response = await fetch(isEdit ? `${API_URL}/users/${editingUser.id}` : `${API_URL}/users`, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (result.success) {
        setIsModalOpen(false);
        fetchData();
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert("Terjadi kesalahan sistem");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Hapus akun admin ini?")) return;
    try {
      const response = await fetch(`${API_URL}/users/${id}`, { method: 'DELETE' });
      const result = await response.json();
      if (result.success) fetchData();
    } catch (error) {
      alert("Gagal menghapus user");
    }
  };

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.branch?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    /* PERBAIKAN: Gunakan min-h-screen dan h-full agar bisa scroll */
    <div className="w-full bg-[#0b141a] min-h-screen overflow-y-auto pb-20">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        
        {/* HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 pt-2">
          <div>
            <h2 className="text-xl md:text-2xl font-semibold flex items-center gap-3 text-white">
              <Users className="w-6 h-6 text-emerald-500" />
              Manajemen Admin
            </h2>
            <p className="text-[#8696a0] text-xs md:text-sm mt-1">Kelola akses administrator cabang.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8696a0]" />
              <input 
                type="text" 
                placeholder="Cari..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#202c33] border border-[#313d45] rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:border-emerald-500 outline-none transition-all lg:w-64"
              />
            </div>
            <button 
              onClick={() => { setEditingUser(null); setIsModalOpen(true); }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              Tambah
            </button>
          </div>
        </div>

        {/* GRID KONTEN */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
          </div>
        ) : (
          /* PERBAIKAN GRID: grid-cols-1 untuk mobile dipastikan tampil semua */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredUsers.map((user) => {
              const isOnline = getOnlineStatus(user.last_login);
              return (
                <div key={user.id} className="bg-[#111b21] border border-[#222d34] rounded-2xl p-5 hover:border-emerald-500/50 transition-all flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 bg-[#202c33] rounded-full flex items-center justify-center text-emerald-500 border border-[#313d45] shrink-0 font-bold">
                        {user.full_name?.charAt(0)}
                      </div>
                      <div className="overflow-hidden">
                        <h3 className="font-medium text-white truncate text-sm md:text-base">{user.full_name}</h3>
                        <div className="flex items-center gap-1 text-[#8696a0] text-[10px] md:text-xs">
                          <Shield className="w-3 h-3 text-amber-500" />
                          {user.role_name}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-[#202c33] px-2 py-1 rounded-full shrink-0">
                      <Circle className={`w-1.5 h-1.5 fill-current ${isOnline ? 'text-emerald-500' : 'text-[#8696a0]'}`} />
                      <span className="text-[9px] font-bold text-[#8696a0] uppercase">{isOnline ? 'On' : 'Off'}</span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-5 flex-1">
                    <div className="flex items-center gap-3 text-xs text-[#8696a0]">
                      <Mail className="w-3.5 h-3.5" />
                      <span className="truncate">@{user.username}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#8696a0]">
                      <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="truncate">{user.branch || 'Pusat'}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#222d34] flex justify-between items-center mt-auto">
                     <span className="text-[10px] text-[#8696a0]">
                       Aktif: {user.last_login ? new Date(user.last_login).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}
                     </span>
                     <div className="flex gap-1">
                        <button onClick={() => { setEditingUser(user); setIsModalOpen(true); }} className="p-2 hover:bg-[#202c33] rounded-lg text-[#8696a0] hover:text-white transition-all">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(user.id)} className="p-2 hover:bg-red-500/10 rounded-lg text-[#8696a0] hover:text-red-400 transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                     </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL FORM */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingUser ? "Edit Admin" : "Tambah Admin"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#8696a0] uppercase">Nama Lengkap</label>
              <input name="full_name" defaultValue={editingUser?.full_name || ''} required className="w-full bg-[#2a3942] border border-[#313d45] rounded-xl py-2 px-4 text-sm text-white focus:border-emerald-500 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#8696a0] uppercase">Username</label>
              <input name="username" defaultValue={editingUser?.username || ''} required className="w-full bg-[#2a3942] border border-[#313d45] rounded-xl py-2 px-4 text-sm text-white focus:border-emerald-500 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#8696a0] uppercase">Password</label>
              <input name="password" type="password" required={!editingUser} className="w-full bg-[#2a3942] border border-[#313d45] rounded-xl py-2 px-4 text-sm text-white focus:border-emerald-500 outline-none" placeholder="••••••••" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#8696a0] uppercase">Role</label>
                <select name="role_id" defaultValue={editingUser?.role_id || ''} required className="w-full bg-[#2a3942] border border-[#313d45] rounded-xl py-2 px-4 text-sm text-white appearance-none">
                  <option value="" disabled>Role</option>
                  {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#8696a0] uppercase">Cabang</label>
                <input name="branch" defaultValue={editingUser?.branch || ''} required className="w-full bg-[#2a3942] border border-[#313d45] rounded-xl py-2 px-4 text-sm text-white focus:border-emerald-500 outline-none" />
              </div>
            </div>
          </div>
          <div className="pt-4 flex flex-col gap-2">
            <button type="submit" className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm active:scale-95 transition-all">SIMPAN</button>
            <button type="button" onClick={() => setIsModalOpen(false)} className="w-full py-3 text-[#8696a0] text-sm">BATAL</button>
          </div>
        </form>
      </Modal>

      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #313d45; border-radius: 10px; }`}</style>
    </div>
  );
};

export default UserManagementView;