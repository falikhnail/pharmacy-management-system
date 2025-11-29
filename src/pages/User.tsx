import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { storageService } from '@/lib/storage';
import { User as UserType, LogAktivitas, UserPermissions } from '@/types';
import { Plus, Edit, Trash2, UserCog, Shield, Key } from 'lucide-react';
import { formatDateTime, generateId, logAktivitas } from '@/lib/utils-pharmacy';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getDefaultPermissions, permissionLabels, permissionDescriptions } from '@/lib/permissions';

export default function User() {
  const [userList, setUserList] = useState<UserType[]>([]);
  const [logAktivitasList, setLogAktivitasList] = useState<LogAktivitas[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [permissionUser, setPermissionUser] = useState<UserType | null>(null);
  const [formData, setFormData] = useState<Partial<UserType>>({
    username: '',
    password: '',
    nama: '',
    role: 'kasir',
    email: '',
    telepon: '',
    isActive: true,
  });
  const [customPermissions, setCustomPermissions] = useState<UserPermissions>(
    getDefaultPermissions('kasir')
  );

  const currentUser = storageService.getCurrentUser();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const users = storageService.getUser();
    setUserList(users);
    
    const logs = storageService.getLogAktivitas();
    setLogAktivitasList(logs.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()));
  };

  const handleOpenDialog = (user?: UserType) => {
    if (user) {
      setEditingUser(user);
      setFormData({ ...user, password: '' });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        password: '',
        nama: '',
        role: 'kasir',
        email: '',
        telepon: '',
        isActive: true,
      });
    }
    setShowDialog(true);
  };

  const handleOpenPermissionDialog = (user: UserType) => {
    setPermissionUser(user);
    setCustomPermissions(user.permissions || getDefaultPermissions(user.role));
    setShowPermissionDialog(true);
  };

  const handleSave = () => {
    if (!formData.username || !formData.nama || (!editingUser && !formData.password)) {
      toast.error('Mohon lengkapi data yang diperlukan!');
      return;
    }

    const now = new Date().toISOString();

    if (editingUser) {
      const updated: UserType = {
        ...editingUser,
        username: formData.username!,
        nama: formData.nama!,
        role: formData.role!,
        email: formData.email || '',
        telepon: formData.telepon || '',
        isActive: formData.isActive!,
        updatedAt: now,
      };

      if (formData.password) {
        updated.password = formData.password;
      }

      // Update permissions based on role if not customized
      if (!updated.permissions) {
        updated.permissions = getDefaultPermissions(updated.role);
      }

      const allUsers = storageService.getUser();
      const updatedList = allUsers.map(u => u.id === editingUser.id ? updated : u);
      storageService.saveUser(updatedList);
      
      logAktivitas(currentUser.id, currentUser.nama, 'UPDATE_USER', `Mengupdate user: ${updated.nama}`);
      toast.success('User berhasil diupdate!');
    } else {
      const newUser: UserType = {
        ...formData,
        id: generateId('user'),
        permissions: getDefaultPermissions(formData.role!),
        createdAt: now,
        updatedAt: now,
      } as UserType;

      const allUsers = storageService.getUser();
      storageService.saveUser([...allUsers, newUser]);
      
      logAktivitas(currentUser.id, currentUser.nama, 'ADD_USER', `Menambah user: ${newUser.nama}`);
      toast.success('User berhasil ditambahkan!');
    }

    setShowDialog(false);
    loadData();
  };

  const handleSavePermissions = () => {
    if (!permissionUser) return;

    const allUsers = storageService.getUser();
    const updatedList = allUsers.map(u => 
      u.id === permissionUser.id 
        ? { ...u, permissions: customPermissions, updatedAt: new Date().toISOString() }
        : u
    );
    storageService.saveUser(updatedList);
    
    logAktivitas(
      currentUser.id, 
      currentUser.nama, 
      'UPDATE_PERMISSIONS', 
      `Mengupdate hak akses user: ${permissionUser.nama}`
    );
    toast.success('Hak akses berhasil diupdate!');
    setShowPermissionDialog(false);
    loadData();
  };

  const handleResetPermissions = () => {
    if (!permissionUser) return;
    setCustomPermissions(getDefaultPermissions(permissionUser.role));
    toast.info('Hak akses direset ke default role');
  };

  const handleDelete = (user: UserType) => {
    if (user.id === currentUser.id) {
      toast.error('Tidak dapat menghapus user yang sedang login!');
      return;
    }

    if (!confirm(`Yakin ingin menghapus user ${user.nama}?`)) return;

    const allUsers = storageService.getUser();
    const filtered = allUsers.filter(u => u.id !== user.id);
    storageService.saveUser(filtered);
    
    logAktivitas(currentUser.id, currentUser.nama, 'DELETE_USER', `Menghapus user: ${user.nama}`);
    toast.success('User berhasil dihapus!');
    loadData();
  };

  const handleToggleActive = (user: UserType) => {
    if (user.id === currentUser.id) {
      toast.error('Tidak dapat menonaktifkan user yang sedang login!');
      return;
    }

    const allUsers = storageService.getUser();
    const updated = allUsers.map(u =>
      u.id === user.id ? { ...u, isActive: !u.isActive, updatedAt: new Date().toISOString() } : u
    );
    storageService.saveUser(updated);
    
    logAktivitas(currentUser.id, currentUser.nama, 'TOGGLE_USER', `${user.isActive ? 'Menonaktifkan' : 'Mengaktifkan'} user: ${user.nama}`);
    toast.success(`User ${user.isActive ? 'dinonaktifkan' : 'diaktifkan'}!`);
    loadData();
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-purple-100 text-purple-800">Admin</Badge>;
      case 'apoteker':
        return <Badge className="bg-blue-100 text-blue-800">Apoteker</Badge>;
      case 'kasir':
        return <Badge className="bg-green-100 text-green-800">Kasir</Badge>;
      default:
        return <Badge>{role}</Badge>;
    }
  };

  const getPermissionCount = (user: UserType): number => {
    const permissions = user.permissions || getDefaultPermissions(user.role);
    return Object.values(permissions).filter(p => p === true).length;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 mt-1">Kelola user dan hak akses sistem</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah User
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Total User</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userList.length}</div>
            <p className="text-xs text-gray-500 mt-1">User terdaftar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">User Aktif</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {userList.filter(u => u.isActive).length}
            </div>
            <p className="text-xs text-gray-500 mt-1">User yang aktif</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Admin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {userList.filter(u => u.role === 'admin').length}
            </div>
            <p className="text-xs text-gray-500 mt-1">User dengan role admin</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Apoteker</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {userList.filter(u => u.role === 'apoteker').length}
            </div>
            <p className="text-xs text-gray-500 mt-1">User dengan role apoteker</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog size={20} />
            Daftar User
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telepon</TableHead>
                  <TableHead>Hak Akses</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userList.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.nama}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell className="text-sm">{user.email || '-'}</TableCell>
                    <TableCell>{user.telepon || '-'}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenPermissionDialog(user)}
                        className="text-xs"
                      >
                        <Key size={12} className="mr-1" />
                        {getPermissionCount(user)}/9
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={user.isActive}
                        onCheckedChange={() => handleToggleActive(user)}
                        disabled={user.id === currentUser.id}
                      />
                    </TableCell>
                    <TableCell className="text-sm">
                      {user.lastLogin ? formatDateTime(user.lastLogin) : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleOpenDialog(user)}>
                          <Edit size={14} />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(user)}
                          disabled={user.id === currentUser.id}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield size={20} />
            Log Aktivitas Terbaru
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Aksi</TableHead>
                  <TableHead>Detail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logAktivitasList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-500">
                      Belum ada log aktivitas
                    </TableCell>
                  </TableRow>
                ) : (
                  logAktivitasList.slice(0, 20).map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">{formatDateTime(log.tanggal)}</TableCell>
                      <TableCell className="font-medium">{log.userName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.aksi}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{log.detail}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* User Form Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit User' : 'Tambah User Baru'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Nama Lengkap *</Label>
              <Input
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                placeholder="Nama lengkap"
              />
            </div>

            <div>
              <Label>Username *</Label>
              <Input
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Username untuk login"
              />
            </div>

            <div>
              <Label>Password {editingUser ? '(Kosongkan jika tidak diubah)' : '*'}</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Password"
              />
            </div>

            <div>
              <Label>Role</Label>
              <Select value={formData.role} onValueChange={(value: UserType["role"]) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="apoteker">Apoteker</SelectItem>
                  <SelectItem value="kasir">Kasir</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>

            <div>
              <Label>Telepon</Label>
              <Input
                value={formData.telepon}
                onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
                placeholder="Nomor telepon"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Status Aktif</Label>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleSave}>
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permission Management Dialog */}
      <Dialog open={showPermissionDialog} onOpenChange={setShowPermissionDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key size={20} />
              Kelola Hak Akses - {permissionUser?.nama}
            </DialogTitle>
            <p className="text-sm text-gray-500">
              Role: {permissionUser?.role && getRoleBadge(permissionUser.role)}
            </p>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-blue-900">Default Permissions</p>
                <p className="text-xs text-blue-700">Reset ke hak akses default berdasarkan role</p>
              </div>
              <Button size="sm" variant="outline" onClick={handleResetPermissions}>
                Reset
              </Button>
            </div>

            <div className="space-y-3">
              {Object.entries(permissionLabels).map(([key, label]) => (
                <div key={key} className="flex items-start justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Label className="font-medium">{label}</Label>
                      {customPermissions[key as keyof UserPermissions] && (
                        <Badge variant="outline" className="text-xs">Aktif</Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {permissionDescriptions[key as keyof UserPermissions]}
                    </p>
                  </div>
                  <Switch
                    checked={customPermissions[key as keyof UserPermissions]}
                    onCheckedChange={(checked) => 
                      setCustomPermissions({ ...customPermissions, [key]: checked })
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPermissionDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleSavePermissions}>
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}