import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Edit3, 
  Lock, 
  CheckCircle2, 
  X,
  Loader2
} from 'lucide-react';

const API_URL = "http://localhost:3001/api";

const Modal = ({ isOpen, onClose, title, children }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-[#202c33] w-full max-w-md rounded-2xl shadow-2xl relative z-10 border border-[#313d45] overflow-hidden">
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

const RoleManagementView = ({ activeTab = "role-management" }: { activeTab?: string }) => {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- FETCH DATA ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === "role-management" ? "/roles" : "/users";
      const response = await fetch(`${API_URL}${endpoint}`);
      const result = await response.json();
      if (result.success) setRoles(result.data);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // --- HANDLE DELETE ---
  const handleDelete = async (id: number) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus data ini?")) return;
    
    try {
      const endpoint = activeTab === "role-management" ? `/roles/${id}` : `/users/${id}`;
      const response = await fetch(`${API_URL}${endpoint}`, { method: 'DELETE' });
      const result = await response.json();
      
      if (result.success) {
        fetchData(); // Refresh data
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert("Gagal menghapus data");
    }
  };

  // --- HANDLE SUBMIT ---
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const endpoint = activeTab === "role-management" ? "/roles" : "/users";
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      if (result.success) {
        setIsModalOpen(false);
        fetchData();
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert("Gagal menyimpan data");
    }
  };

  return (
    <div className="flex-1 bg-[#0b141a] min-h-screen p-8 text-[#d1d7db]">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-3">
            <ShieldCheck className="w-7 h-7 text-emerald-500" />
            {activeTab === "role-management" ? "Manajemen Role" : "Manajemen User"}
          </h2>
          <p className="text-[#8696a0] text-sm mt-1">
            {activeTab === "role-management" 
              ? "Atur hak akses dan tingkatan administrator secara dinamis."
              : "Kelola akun administrator untuk setiap cabang."}
          </p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-900/20"
        >
          <Plus className="w-4 h-4" />
          {activeTab === "role-management" ? "Tambah Role Baru" : "Tambah Admin Baru"}
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-[#111b21] rounded-md border border-[#222d34] overflow-hidden">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center text-[#8696a0]">
            <Loader2 className="w-10 h-10 animate-spin mb-4 text-emerald-500" />
            <p>Mengambil data dari server...</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#202c33]/50 text-[#8696a0] uppercase text-[11px] tracking-widest">
                <th className="px-6 py-4 font-bold">{activeTab === "role-management" ? "Nama Role" : "Nama User"}</th>
                <th className="px-6 py-4 font-bold">{activeTab === "role-management" ? "Deskripsi Akses" : "Cabang / Role"}</th>
                <th className="px-6 py-4 font-bold text-center">{activeTab === "role-management" ? "Jumlah User" : "Last Login"}</th>
                <th className="px-6 py-4 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222d34]">
              {roles.map((item) => (
                <tr key={item.id} className="hover:bg-[#202c33]/30 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${item.type === 'system' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                        {item.type === 'system' ? <Lock className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="font-medium text-white">{item.name || item.full_name}</div>
                        {activeTab === "user-management" && <div className="text-[10px] text-[#8696a0]">@{item.username}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-sm text-[#8696a0]">
                      {activeTab === "role-management" ? item.description : `${item.branch} - ${item.role_name}`}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="bg-[#202c33] text-[#d1d7db] px-3 py-1 rounded-full text-xs border border-[#313d45]">
                      {activeTab === "role-management" ? `${item.users} User` : (item.last_login || 'Belum Login')}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 hover:bg-[#3b4a54] rounded-lg text-[#8696a0] hover:text-white transition-all">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      {item.type !== 'system' && (
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-2 hover:bg-red-500/10 rounded-lg text-[#8696a0] hover:text-red-400 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={activeTab === "role-management" ? "Tambah Role Baru" : "Tambah Admin Baru"}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          {activeTab === "role-management" ? (
            <>
              <div>
                <label className="block text-[11px] font-bold text-[#8696a0] mb-2 uppercase tracking-wider">Nama Role</label>
                <input name="name" required type="text" className="w-full bg-[#2a3942] border border-[#313d45] rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all" placeholder="Misal: Supervisor" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#8696a0] mb-2 uppercase tracking-wider">Deskripsi Izin</label>
                <textarea name="description" rows={3} className="w-full bg-[#2a3942] border border-[#313d45] rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all resize-none" placeholder="Apa saja hak akses role ini?" />
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#8696a0] mb-2 uppercase tracking-wider">Nama Lengkap</label>
                  <input name="full_name" required type="text" className="w-full bg-[#2a3942] border border-[#313d45] rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all" placeholder="Andi Wijaya" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#8696a0] mb-2 uppercase tracking-wider">Username</label>
                  <input name="username" required type="text" className="w-full bg-[#2a3942] border border-[#313d45] rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all" placeholder="andi_88" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#8696a0] mb-2 uppercase tracking-wider">Password</label>
                <input name="password" required type="password" className="w-full bg-[#2a3942] border border-[#313d45] rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all" placeholder="••••••••" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#8696a0] mb-2 uppercase tracking-wider">Role</label>
                  <select name="role_id" className="w-full bg-[#2a3942] border border-[#313d45] rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all">
                    {/* Hardcoded ID sesuai seed database sebelumnya */}
                    <option value="1">Super Admin</option>
                    <option value="2">Admin Pusat</option>
                    <option value="3">Admin Cabang</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#8696a0] mb-2 uppercase tracking-wider">Cabang</label>
                  <input name="branch" type="text" className="w-full bg-[#2a3942] border border-[#313d45] rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all" placeholder="Jakarta" />
                </div>
              </div>
            </>
          )}

          <div className="pt-6 flex gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 rounded-xl text-sm font-semibold text-[#8696a0] hover:bg-[#2a3942] transition-all">Batal</button>
            <button type="submit" className="flex-1 py-3 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-lg shadow-emerald-900/20">Simpan Data</button>
          </div>
        </form>
      </Modal>

      <div className="mt-6 flex items-center gap-2 text-[#54656f] text-xs">
        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        <span>Data tersinkronisasi langsung dengan database pusat.</span>
      </div>
    </div>
  );
};

export default RoleManagementView;