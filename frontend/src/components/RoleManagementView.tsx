import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Plus, Trash2, Edit3, Lock, 
  CheckCircle2, X, Loader2, ChevronRight 
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL;

const Modal = ({ isOpen, onClose, title, children }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-[#202c33] w-full max-w-md rounded-t-2xl md:rounded-2xl shadow-2xl relative z-10 border-t md:border border-[#313d45] overflow-hidden animate-in slide-in-from-bottom md:zoom-in duration-300">
        <div className="px-6 py-4 border-b border-[#313d45] flex justify-between items-center">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-[#2a3942] rounded-full text-[#8696a0] transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

const RoleManagementView = ({ activeTab = "role-management" }: { activeTab?: string }) => {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // --- NEW STATE FOR EDITING ---
  const [editingItem, setEditingItem] = useState<any>(null);

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

  // --- OPEN MODAL FOR EDIT ---
  const handleEdit = (item: any) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  // --- RESET STATE ON CLOSE ---
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Hapus data ini?")) return;
    try {
      const endpoint = activeTab === "role-management" ? `/roles/${id}` : `/users/${id}`;
      const response = await fetch(`${API_URL}${endpoint}`, { method: 'DELETE' });
      const result = await response.json();
      if (result.success) fetchData();
    } catch (error) {
      alert("Gagal menghapus");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const isEdit = !!editingItem;
      const endpoint = activeTab === "role-management" 
        ? (isEdit ? `/roles/${editingItem.id}` : "/roles") 
        : (isEdit ? `/users/${editingItem.id}` : "/users");
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: isEdit ? 'PUT' : 'POST', // Gunakan PUT untuk edit
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      if (result.success) {
        handleCloseModal();
        fetchData();
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert("Gagal menyimpan data");
    }
  };

  return (
    <div className="flex-1 bg-[#0b141a] min-h-screen p-4 md:p-8 text-[#d1d7db]">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 md:w-7 md:h-7 text-emerald-500" />
            {activeTab === "role-management" ? "Manajemen Role" : "Manajemen User"}
          </h2>
          <p className="text-[#8696a0] text-xs md:text-sm mt-1">
            {activeTab === "role-management" ? "Atur hak akses admin." : "Kelola akun admin cabang."}
          </p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-3 md:py-2 rounded-xl md:rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-900/20"
        >
          <Plus className="w-5 h-5 md:w-4 md:h-4" />
          <span>{activeTab === "role-management" ? "Tambah Role" : "Tambah Admin"}</span>
        </button>
      </div>

      <div className="bg-[#111b21] rounded-2xl md:rounded-md border border-[#222d34] overflow-hidden">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center text-[#8696a0]">
            <Loader2 className="w-10 h-10 animate-spin mb-4 text-emerald-500" />
            <p className="text-sm">Mengambil data...</p>
          </div>
        ) : (
          <>
            {/* DESKTOP VIEW */}
            <div className="hidden md:block">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#202c33]/50 text-[#8696a0] uppercase text-[11px] tracking-widest">
                    <th className="px-6 py-4 font-bold">{activeTab === "role-management" ? "Nama Role" : "Nama User"}</th>
                    <th className="px-6 py-4 font-bold">{activeTab === "role-management" ? "Deskripsi Akses" : "Cabang / Role"}</th>
                    <th className="px-6 py-4 font-bold text-center">Status/Info</th>
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
                          <button 
                            onClick={() => handleEdit(item)}
                            className="p-2 hover:bg-[#3b4a54] rounded-lg text-[#8696a0] hover:text-white transition-all"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {item.type !== 'system' && (
                            <button onClick={() => handleDelete(item.id)} className="p-2 hover:bg-red-500/10 rounded-lg text-red-400 transition-all">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE VIEW */}
            <div className="md:hidden divide-y divide-[#222d34]">
              {roles.map((item) => (
                <div key={item.id} className="p-5 active:bg-[#202c33]/40 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-4">
                      <div className={`p-3 rounded-xl h-fit ${item.type === 'system' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                        {item.type === 'system' ? <Lock size={20} /> : <ShieldCheck size={20} />}
                      </div>
                      <div className="pr-4">
                        <h4 className="font-bold text-white text-lg leading-tight">{item.name || item.full_name}</h4>
                        <p className="text-sm text-[#8696a0] mt-1 line-clamp-2">
                          {activeTab === "role-management" ? item.description : `${item.branch} • ${item.role_name}`}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#222d34]/50">
                    <span className="text-xs font-medium px-3 py-1 bg-[#202c33] rounded-md text-[#8696a0]">
                      {activeTab === "role-management" ? `${item.users} Pengguna` : (item.last_login || 'Offline')}
                    </span>
                    <div className="flex gap-3">
                      <button onClick={() => handleEdit(item)} className="p-2 text-[#8696a0] active:text-white"><Edit3 size={18} /></button>
                      {item.type !== 'system' && (
                        <button onClick={() => handleDelete(item.id)} className="p-2 text-red-400/80 active:text-red-400"><Trash2 size={18} /></button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* FORM MODAL WITH INITIAL VALUES */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        title={editingItem 
          ? (activeTab === "role-management" ? "Edit Role" : "Edit Admin") 
          : (activeTab === "role-management" ? "Tambah Role" : "Tambah Admin")
        }
      >
        <form className="space-y-5 pb-6 md:pb-0" onSubmit={handleSubmit}>
          {activeTab === "role-management" ? (
            <>
              <div>
                <label className="block text-[11px] font-bold text-[#8696a0] mb-2 uppercase tracking-wider">Nama Role</label>
                <input 
                  name="name" 
                  defaultValue={editingItem?.name || ''} 
                  required type="text" 
                  className="w-full bg-[#2a3942] border border-[#313d45] rounded-xl py-3.5 px-4 text-white focus:outline-none focus:border-emerald-500" 
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#8696a0] mb-2 uppercase tracking-wider">Deskripsi Izin</label>
                <textarea 
                  name="description" 
                  defaultValue={editingItem?.description || ''} 
                  rows={3} 
                  className="w-full bg-[#2a3942] border border-[#313d45] rounded-xl py-3.5 px-4 text-white focus:outline-none focus:border-emerald-500 resize-none" 
                />
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#8696a0] mb-2 uppercase tracking-wider">Nama Lengkap</label>
                  <input 
                    name="full_name" 
                    defaultValue={editingItem?.full_name || ''} 
                    required type="text" 
                    className="w-full bg-[#2a3942] border border-[#313d45] rounded-xl py-3.5 px-4 text-white focus:outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#8696a0] mb-2 uppercase tracking-wider">Username</label>
                  <input 
                    name="username" 
                    defaultValue={editingItem?.username || ''} 
                    required type="text" 
                    className="w-full bg-[#2a3942] border border-[#313d45] rounded-xl py-3.5 px-4 text-white focus:outline-none" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#8696a0] mb-2 uppercase tracking-wider">Password {editingItem && <span className="text-[9px] lowercase italic">(Kosongkan jika tidak ganti)</span>}</label>
                <input 
                  name="password" 
                  type="password" 
                  required={!editingItem} 
                  className="w-full bg-[#2a3942] border border-[#313d45] rounded-xl py-3.5 px-4 text-white focus:outline-none" 
                  placeholder={editingItem ? "••••••••" : "Masukkan password"} 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#8696a0] mb-2 uppercase tracking-wider">Role</label>
                  <select 
                    name="role_id" 
                    defaultValue={editingItem?.role_id || '3'} 
                    className="w-full bg-[#2a3942] border border-[#313d45] rounded-xl py-3.5 px-4 text-white focus:outline-none appearance-none"
                  >
                    <option value="1">Super Admin</option>
                    <option value="2">Admin Pusat</option>
                    <option value="3">Admin Cabang</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#8696a0] mb-2 uppercase tracking-wider">Cabang</label>
                  <input 
                    name="branch" 
                    defaultValue={editingItem?.branch || ''} 
                    type="text" 
                    className="w-full bg-[#2a3942] border border-[#313d45] rounded-xl py-3.5 px-4 text-white focus:outline-none" 
                  />
                </div>
              </div>
            </>
          )}
      

          <div className="pt-4 flex flex-col md:flex-row gap-3">
            <button type="button" onClick={handleCloseModal} className="order-2 md:order-1 flex-1 py-4 md:py-3 rounded-xl text-sm font-semibold text-[#8696a0] hover:bg-[#2a3942]">Batal</button>
            <button type="submit" className="order-1 md:order-2 flex-1 py-4 md:py-3 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg">
              {editingItem ? "Update Data" : "Simpan Data"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default RoleManagementView;