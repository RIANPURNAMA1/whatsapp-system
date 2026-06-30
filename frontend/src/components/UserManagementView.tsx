import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  MapPin, 
  Mail, 
  Edit2,
  Trash2,
  Shield,
  MoreHorizontal,
  BadgeCheck,
  Clock
} from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const API_URL = import.meta.env.VITE_API_URL;

interface User {
  id: number;
  full_name: string;
  username: string;
  password?: string;
  role_id: number;
  role_name?: string;
  branch: string;
  last_login?: string;
}

interface Role {
  id: number;
  name: string;
}

const UserManagementView = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState<Partial<User>>({});

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

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        full_name: user.full_name,
        username: user.username,
        role_id: user.role_id,
        branch: user.branch,
        password: ''
      });
    } else {
      setEditingUser(null);
      setFormData({
        full_name: '',
        username: '',
        role_id: undefined,
        branch: '',
        password: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = !!editingUser;
    const payload = { ...formData };
    if (!payload.password) delete payload.password;

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
    } catch {
      alert("Terjadi kesalahan sistem");
    }
  };

  const handleDeleteClick = (id: number) => {
    setUserToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    try {
      const response = await fetch(`${API_URL}/users/${userToDelete}`, { method: 'DELETE' });
      const result = await response.json();
      if (result.success) {
        setIsDeleteDialogOpen(false);
        fetchData();
      } else {
        alert(result.message);
      }
    } catch {
      alert("Gagal menghapus user");
    }
  };

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.branch?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleColor = (roleName: string | undefined) => {
    const lower = roleName?.toLowerCase() || '';
    if (lower.includes('admin')) return 'bg-[#E7F3FF] text-[#1877F2] border-[#1877F2]';
    if (lower.includes('super')) return 'bg-[#FFF8E7] text-[#F5A623] border-[#F5A623]';
    return 'bg-[#F0F2F5] text-[#65676B] border-[#E4E6EB]';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* HEADER */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Users className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                  Manajemen Admin
                </h1>
                <p className="text-slate-500 text-sm mt-0.5">
                  Kelola akses administrator cabang sistem
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  type="text" 
                  placeholder="Cari admin..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-72 pl-10 bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                />
              </div>
              <Button 
                onClick={() => handleOpenModal()}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Tambah Admin
              </Button>
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{users.length}</p>
                <p className="text-sm text-slate-500">Total Admin</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <BadgeCheck className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {users.filter(u => getOnlineStatus(u.last_login || '')).length}
                </p>
                <p className="text-sm text-slate-500">Sedang Aktif</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{roles.length}</p>
                <p className="text-sm text-slate-500">Role Aktif</p>
              </div>
            </div>
          </div>
        </div>

        {/* GRID KONTEN */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-slate-500 mt-4">Memuat data...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/60 p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-1">Belum ada admin</h3>
            <p className="text-slate-500 text-sm mb-4">Tambahkan admin baru untuk memulai</p>
            <Button 
              onClick={() => handleOpenModal()}
              variant="outline" 
              className="gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Tambah Admin
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredUsers.map((user) => {
              const isOnline = getOnlineStatus(user.last_login || '');
              return (
                <div 
                  key={user.id} 
                  className="bg-white rounded-2xl border border-slate-200/60 p-6 hover:shadow-lg hover:border-slate-300/80 transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md">
                          {user.full_name?.charAt(0)}
                        </div>
                        {isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-sm" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 text-base">{user.full_name}</h3>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getRoleColor(user.role_name)}`}>
                            <Shield className="w-3 h-3" />
                            {user.role_name}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button className="p-2 hover:bg-slate-100 rounded-xl opacity-0 group-hover:opacity-100 transition-all">
                      <MoreHorizontal className="w-5 h-5 text-slate-400" />
                    </button>
                  </div>

                  <div className="space-y-3 mb-5">
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                        <Mail className="w-4 h-4 text-slate-500" />
                      </div>
                      <span className="truncate">@{user.username}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-slate-500" />
                      </div>
                      <span className="truncate">{user.branch || 'Pusat'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                        <Clock className="w-4 h-4 text-slate-500" />
                      </div>
                      <span className="truncate">
                        {user.last_login 
                          ? `Terakhir: ${new Date(user.last_login).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`
                          : 'Belum pernah login'
                        }
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                    <div className={`flex items-center gap-1.5 text-xs font-medium ${isOnline ? 'text-emerald-600' : 'text-slate-400'}`}>
                      <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      {isOnline ? 'Online' : 'Offline'}
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleOpenModal(user)}
                        className="text-slate-500 hover:text-blue-600 hover:bg-blue-50 gap-1"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteClick(user.id)}
                        className="text-slate-500 hover:text-red-600 hover:bg-red-50 gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        Hapus
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL FORM */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {editingUser ? 'Edit Admin' : 'Tambah Admin Baru'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nama Lengkap</Label>
              <Input 
                id="full_name"
                name="full_name"
                value={formData.full_name || ''}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                placeholder="Masukkan nama lengkap"
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input 
                id="username"
                name="username"
                value={formData.username || ''}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                placeholder="Masukkan username"
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password"
                name="password"
                type="password"
                value={formData.password || ''}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder={editingUser ? 'Kosongkan jika tidak diubah' : 'Masukkan password'}
                required={!editingUser}
                className="h-11"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select 
                  value={formData.role_id?.toString() || ''}
                  onValueChange={(value) => setFormData({...formData, role_id: parseInt(value)})}
                  required
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Pilih role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(r => (
                      <SelectItem key={r.id} value={r.id.toString()}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="branch">Cabang</Label>
                <Input 
                  id="branch"
                  name="branch"
                  value={formData.branch || ''}
                  onChange={(e) => setFormData({...formData, branch: e.target.value})}
                  placeholder="Nama cabang"
                  required
                  className="h-11"
                />
              </div>
            </div>
            <DialogFooter className="gap-2 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsModalOpen(false)}
              >
                Batal
              </Button>
              <Button 
                type="submit"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Hapus Admin</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-slate-600">
              Apakah Anda yakin ingin menghapus admin ini? Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Batal
            </Button>
            <Button 
              type="button"
              variant="destructive"
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagementView;
