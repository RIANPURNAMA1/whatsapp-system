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

// --- 1. KOMPONEN MODAL INTERNAL ---
const Modal = ({ isOpen, onClose, title, children }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-[#202c33] w-full max-w-md rounded-2xl shadow-2xl relative z-10 border border-[#313d45] overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-[#313d45] flex justify-between items-center">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-[#2a3942] rounded-full text-[#8696a0] hover:text-white transition-all">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

// --- 2. KOMPONEN UTAMA USER MANAGEMENT ---
const UserManagementView = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]); // Untuk dropdown role
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // --- FETCH DATA ---
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

  // --- HANDLER SIMPAN ---
  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      
      if (result.success) {
        setIsModalOpen(false);
        fetchData(); // Refresh list
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert("Terjadi kesalahan sistem");
    }
  };

  // --- HANDLER HAPUS ---
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

  // Filter user berdasarkan search query
  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.branch?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 bg-[#0b141a] min-h-screen p-8 text-[#d1d7db]">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-3 text-white">
            <Users className="w-7 h-7 text-emerald-500" />
            Manajemen Admin Cabang
          </h2>
          <p className="text-[#8696a0] text-sm mt-1">Kelola akun administrator untuk setiap cabang operasional.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8696a0]" />
            <input 
              type="text" 
              placeholder="Cari nama atau cabang..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#202c33] border border-[#313d45] rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-emerald-500 transition-all w-64 text-white"
            />
          </div>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-900/20"
          >
            <UserPlus className="w-4 h-4" />
            Tambah Admin
          </button>
        </div>
      </div>

      {/* USER GRID */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-4" />
          <p className="text-[#8696a0]">Memuat data admin...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <div key={user.id} className="bg-[#111b21] border border-[#222d34] rounded-2xl p-6 hover:border-emerald-500/50 transition-all group relative">
              
              <div className="absolute top-6 right-6 flex items-center gap-1.5">
                <Circle className={`w-2 h-2 fill-current ${user.is_active ? 'text-emerald-500' : 'text-[#8696a0]'}`} />
                <span className="text-[10px] uppercase tracking-tighter text-[#8696a0] font-bold">
                  {user.is_active ? 'Online' : 'Offline'}
                </span>
              </div>

              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-[#202c33] rounded-full flex items-center justify-center text-emerald-500 border border-[#313d45] shadow-inner">
                  <span className="font-bold text-lg">{user.full_name?.charAt(0)}</span>
                </div>
                <div className="overflow-hidden">
                  <h3 className="font-semibold text-white truncate pr-10">{user.full_name}</h3>
                  <div className="flex items-center gap-1.5 text-[#8696a0] text-xs mt-1">
                    <Shield className="w-3 h-3 text-amber-500" />
                    {user.role_name}
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-xs text-[#8696a0]">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">@{user.username}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-[#8696a0]">
                  <MapPin className="w-4 h-4 text-emerald-500" />
                  <span className="truncate">{user.branch || 'Pusat'}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-[#222d34] flex justify-between items-center">
                 <button className="text-xs font-semibold text-emerald-500 hover:text-emerald-400 transition-colors uppercase tracking-wider">
                    Lihat Aktivitas
                 </button>
                 <div className="flex items-center gap-1">
                    <button className="p-2 hover:bg-[#202c33] rounded-lg text-[#8696a0] hover:text-white transition-all">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(user.id)}
                      className="p-2 hover:bg-red-500/10 rounded-lg text-[#8696a0] hover:text-red-400 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                 </div>
              </div>
            </div>
          ))}

          {/* DASHED CARD */}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="border-2 border-dashed border-[#222d34] rounded-2xl flex flex-col items-center justify-center p-8 hover:bg-[#111b21] hover:border-emerald-500/30 transition-all group"
          >
              <div className="w-12 h-12 bg-[#111b21] rounded-full flex items-center justify-center text-[#313d45] group-hover:text-emerald-500 transition-colors mb-4 border border-[#222d34]">
                <UserPlus className="w-6 h-6" />
              </div>
              <span className="text-[#8696a0] text-sm font-medium group-hover:text-emerald-500 transition-colors">Tambah Admin Baru</span>
          </button>
        </div>
      )}

      {/* FOOTER STATS */}
      <div className="mt-10 pt-6 border-t border-[#222d34] flex items-center justify-between text-[10px] text-[#54656f] uppercase tracking-[0.2em] font-bold">
        <div className="flex gap-8">
          <span className="flex items-center gap-2">
            Total: {users.length}
          </span>
          <span className="flex items-center gap-2 text-emerald-500">
            Active Records
          </span>
        </div>
        <span>Satu Pintu Management System</span>
      </div>

      {/* MODAL FORM TAMBAH ADMIN */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Daftarkan Admin Cabang"
      >
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-[#8696a0] mb-2 uppercase tracking-wider">Nama Lengkap</label>
              <input name="full_name" required type="text" className="w-full bg-[#2a3942] border border-[#313d45] rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all" placeholder="Budi Santoso" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#8696a0] mb-2 uppercase tracking-wider">Username</label>
              <input name="username" required type="text" className="w-full bg-[#2a3942] border border-[#313d45] rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all" placeholder="budi_admin" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#8696a0] mb-2 uppercase tracking-wider">Password</label>
            <input name="password" required type="password" className="w-full bg-[#2a3942] border border-[#313d45] rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all" placeholder="••••••••" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-[#8696a0] mb-2 uppercase tracking-wider">Pilih Role</label>
              <div className="relative">
                <select name="role_id" required className="w-full bg-[#2a3942] border border-[#313d45] rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all appearance-none cursor-pointer">
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8696a0] pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#8696a0] mb-2 uppercase tracking-wider">Cabang</label>
              <input name="branch" required type="text" className="w-full bg-[#2a3942] border border-[#313d45] rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all" placeholder="Cianjur" />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 rounded-xl text-sm font-semibold text-[#8696a0] hover:bg-[#2a3942] transition-all">Batal</button>
            <button type="submit" className="flex-1 py-3 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-lg shadow-emerald-900/20 active:scale-95">Simpan Admin</button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default UserManagementView;