import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Edit2, 
  Lock, 
  Search, 
  Shield,
  Users,
  BadgeCheck,
  MoreHorizontal,
  CheckCircle2
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

const API_URL = import.meta.env.VITE_API_URL;

interface Role {
  id: number;
  name: string;
  description: string;
  type: string;
  users: number;
}

const RoleManagementView = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState<Partial<Role>>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/roles`);
      const result = await response.json();
      if (result.success) setRoles(result.data);
    } catch (error) {
      console.error("Gagal mengambil data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (role?: Role) => {
    if (role) {
      setEditingRole(role);
      setFormData({
        name: role.name,
        description: role.description
      });
    } else {
      setEditingRole(null);
      setFormData({
        name: '',
        description: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRole(null);
    setFormData({});
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = !!editingRole;
    
    try {
      const response = await fetch(isEdit ? `${API_URL}/roles/${editingRole.id}` : `${API_URL}/roles`, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const result = await response.json();
      if (result.success) {
        handleCloseModal();
        fetchData();
      } else {
        alert(result.message);
      }
    } catch {
      alert("Terjadi kesalahan sistem");
    }
  };

  const handleDeleteClick = (id: number) => {
    setRoleToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!roleToDelete) return;
    try {
      const response = await fetch(`${API_URL}/roles/${roleToDelete}`, { method: 'DELETE' });
      const result = await response.json();
      if (result.success) {
        setIsDeleteDialogOpen(false);
        fetchData();
      } else {
        alert(result.message);
      }
    } catch {
      alert("Gagal menghapus role");
    }
  };

  const filteredRoles = roles.filter(role => 
    role.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    role.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleTypeBadge = (type: string) => {
    if (type === 'system') {
      return 'bg-amber-100 text-amber-700 border-amber-200';
    }
    return 'bg-blue-100 text-blue-700 border-blue-200';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* HEADER */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                <ShieldCheck className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                  Manajemen Role
                </h1>
                <p className="text-slate-500 text-sm mt-0.5">
                  Atur hak akses dan peran administrator sistem
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  type="text" 
                  placeholder="Cari role..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-72 pl-10 bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                />
              </div>
              <Button 
                onClick={() => handleOpenModal()}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 gap-2"
              >
                <Plus className="w-4 h-4" />
                Tambah Role
              </Button>
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{roles.length}</p>
                <p className="text-sm text-slate-500">Total Role</p>
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
                  {roles.filter(r => r.type === 'custom').length}
                </p>
                <p className="text-sm text-slate-500">Role Custom</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {roles.reduce((acc, r) => acc + (r.users || 0), 0)}
                </p>
                <p className="text-sm text-slate-500">Total User</p>
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
        ) : filteredRoles.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/60 p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-1">Belum ada role</h3>
            <p className="text-slate-500 text-sm mb-4">Tambahkan role baru untuk memulai</p>
            <Button 
              onClick={() => handleOpenModal()}
              variant="outline" 
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Tambah Role
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredRoles.map((role) => (
              <div 
                key={role.id} 
                className="bg-white rounded-2xl border border-slate-200/60 p-6 hover:shadow-lg hover:border-slate-300/80 transition-all duration-200 group"
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${role.type === 'system' ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/25' : 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25'}`}>
                      {role.type === 'system' ? (
                        <Lock className="w-6 h-6 text-white" />
                      ) : (
                        <ShieldCheck className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 text-base">{role.name}</h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getRoleTypeBadge(role.type)}`}>
                          <Shield className="w-3 h-3" />
                          {role.type === 'system' ? 'System' : 'Custom'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-slate-100 rounded-xl opacity-0 group-hover:opacity-100 transition-all">
                    <MoreHorizontal className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                <div className="space-y-3 mb-5">
                  <div className="text-sm text-slate-600 line-clamp-2">
                    {role.description || 'Tidak ada deskripsi'}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                      <Users className="w-4 h-4 text-slate-500" />
                    </div>
                    <span>{role.users || 0} pengguna menggunakan role ini</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                  <div className={`flex items-center gap-1.5 text-xs font-medium ${role.type !== 'system' ? 'text-blue-600' : 'text-amber-600'}`}>
                    {role.type !== 'system' ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Dapat diedit
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        Sistem
                      </>
                    )}
                  </div>
                  {role.type !== 'system' && (
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleOpenModal(role)}
                        className="text-slate-500 hover:text-blue-600 hover:bg-blue-50 gap-1"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteClick(role.id)}
                        className="text-slate-500 hover:text-red-600 hover:bg-red-50 gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        Hapus
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL FORM */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {editingRole ? 'Edit Role' : 'Tambah Role Baru'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Role</Label>
              <Input 
                id="name"
                name="name"
                value={formData.name || ''}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Masukkan nama role"
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Input 
                id="description"
                name="description"
                value={formData.description || ''}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Masukkan deskripsi role"
                className="h-11"
              />
            </div>
            <DialogFooter className="gap-2 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCloseModal}
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
            <DialogTitle className="text-xl">Hapus Role</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-slate-600">
              Apakah Anda yakin ingin menghapus role ini? Tindakan ini tidak dapat dibatalkan.
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

export default RoleManagementView;
