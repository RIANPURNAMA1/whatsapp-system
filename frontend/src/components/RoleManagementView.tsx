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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
        description: role.description,
        type: role.type
      });
    } else {
      setEditingRole(null);
      setFormData({
        name: '',
        description: '',
        type: 'custom'
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
      return 'bg-[#FFF8E7] text-[#F5A623] border-[#F5A623]';
    }
    if (type === 'manager') {
      return 'bg-[#E7F3FF] text-[#0866FF] border-[#0866FF]';
    }
    if (type === 'tiktok_operator') {
      return 'bg-[#F0E6FF] text-[#8B5CF6] border-[#8B5CF6]';
    }
    return 'bg-[#E7F3FF] text-[#0866FF] border-[#0866FF]';
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      <div className=" mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* HEADER */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#0866FF] rounded-lg flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-[#050505]">
                  Manajemen Role
                </h1>
                <p className="text-[#65676B] text-sm mt-0.5">
                  Atur hak akses dan peran administrator sistem
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#65676B]" />
                <Input 
                  type="text" 
                  placeholder="Cari role..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-72 pl-10"
                />
              </div>
              <Button 
                onClick={() => handleOpenModal()}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Tambah Role
              </Button>
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg p-5 border border-[#E4E6EB]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#E7F3FF] rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-[#0866FF]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#050505]">{roles.length}</p>
                <p className="text-sm text-[#65676B]">Total Role</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-5 border border-[#E4E6EB]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#E7F3FF] rounded-lg flex items-center justify-center">
                <BadgeCheck className="w-6 h-6 text-[#0866FF]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#050505]">
                  {roles.filter(r => r.type === 'custom').length}
                </p>
                <p className="text-sm text-[#65676B]">Role Custom</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-5 border border-[#E4E6EB]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#E7F3FF] rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-[#0866FF]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#050505]">
                  {roles.reduce((acc, r) => acc + (r.users || 0), 0)}
                </p>
                <p className="text-sm text-[#65676B]">Total User</p>
              </div>
            </div>
          </div>
        </div>

        {/* GRID KONTEN */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-[#E4E6EB] border-t-[#0866FF] rounded-full animate-spin" />
            <p className="text-[#65676B] mt-4">Memuat data...</p>
          </div>
        ) : filteredRoles.length === 0 ? (
          <div className="bg-white rounded-lg border border-[#E4E6EB] p-12 text-center">
            <div className="w-16 h-16 bg-[#F0F2F5] rounded-lg flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-8 h-8 text-[#65676B]" />
            </div>
            <h3 className="text-lg font-semibold text-[#050505] mb-1">Belum ada role</h3>
            <p className="text-[#65676B] text-sm mb-4">Tambahkan role baru untuk memulai</p>
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
                className="bg-white rounded-lg border border-[#E4E6EB] p-5 hover:border-[#CCD0D5] transition-colors group"
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${role.type === 'system' ? 'bg-[#F5A623]' : 'bg-[#0866FF]'}`}>
                      {role.type === 'system' ? (
                        <Lock className="w-6 h-6 text-white" />
                      ) : (
                        <ShieldCheck className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#050505] text-base">{role.name}</h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getRoleTypeBadge(role.type)}`}>
                          <Shield className="w-3 h-3" />
                          {role.type === 'system' ? 'System' : role.type === 'manager' ? 'Manager' : role.type === 'tiktok_operator' ? 'Operator TikTok' : 'Custom'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-[#F2F3F5] rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                    <MoreHorizontal className="w-5 h-5 text-[#65676B]" />
                  </button>
                </div>

                <div className="space-y-3 mb-5">
                  <div className="text-sm text-[#65676B] line-clamp-2">
                    {role.description || 'Tidak ada deskripsi'}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-[#65676B]">
                    <div className="w-8 h-8 bg-[#F0F2F5] rounded-lg flex items-center justify-center">
                      <Users className="w-4 h-4 text-[#65676B]" />
                    </div>
                    <span>{role.users || 0} pengguna menggunakan role ini</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E4E6EB] flex justify-between items-center">
                  <div className={`flex items-center gap-1.5 text-xs font-medium ${role.type !== 'system' ? 'text-[#31A24C]' : 'text-[#F5A623]'}`}>
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
                        className="gap-1"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteClick(role.id)}
                        className="gap-1 text-[#65676B] hover:text-red-500"
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
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Tipe Role</Label>
              <Select
                value={formData.type || 'custom'}
                onValueChange={(value) => setFormData({...formData, type: value})}
                disabled={editingRole?.type === 'system'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tipe role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                  <SelectItem value="tiktok_operator">Operator Live TikTok</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={handleCloseModal}>
                Batal
              </Button>
              <Button type="submit">
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
            <p className="text-[#65676B]">
              Apakah Anda yakin ingin menghapus role ini? Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Batal
            </Button>
            <Button type="button" variant="destructive" onClick={handleDeleteConfirm}>
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoleManagementView;
