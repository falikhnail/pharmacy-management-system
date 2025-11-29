import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { storageService } from '@/lib/storage';
import { Pasien as PasienType, Transaksi, Resep } from '@/types';
import { Plus, Search, Edit, Trash2, Users } from 'lucide-react';
import { formatDate, generateId, logAktivitas } from '@/lib/utils-pharmacy';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function Pasien() {
  const [pasienList, setPasienList] = useState<PasienType[]>([]);
  const [filteredPasien, setFilteredPasien] = useState<PasienType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingPasien, setEditingPasien] = useState<PasienType | null>(null);
  const [formData, setFormData] = useState<Partial<PasienType>>({
    nama: '',
    alamat: '',
    telepon: '',
    tanggalLahir: '',
    jenisKelamin: 'L',
    email: '',
  });

  useEffect(() => {
    loadPasien();
  }, []);

  useEffect(() => {
    filterPasien();
  }, [searchTerm, pasienList]);

  const loadPasien = () => {
    const data = storageService.getPasien();
    setPasienList(data);
  };

  const filterPasien = () => {
    const filtered = pasienList.filter(pasien =>
      pasien.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pasien.telepon.includes(searchTerm)
    );
    setFilteredPasien(filtered);
  };

  const handleOpenDialog = (pasien?: PasienType) => {
    if (pasien) {
      setEditingPasien(pasien);
      setFormData(pasien);
    } else {
      setEditingPasien(null);
      setFormData({
        nama: '',
        alamat: '',
        telepon: '',
        tanggalLahir: '',
        jenisKelamin: 'L',
        email: '',
      });
    }
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!formData.nama || !formData.telepon) {
      toast.error('Mohon lengkapi data yang diperlukan!');
      return;
    }

    const currentUser = storageService.getCurrentUser();
    const now = new Date().toISOString();

    if (editingPasien) {
      const updated: PasienType = {
        ...editingPasien,
        ...formData,
      } as PasienType;

      const allPasien = storageService.getPasien();
      const updatedList = allPasien.map(p => p.id === editingPasien.id ? updated : p);
      storageService.savePasien(updatedList);
      
      logAktivitas(currentUser.id, currentUser.nama, 'UPDATE_PASIEN', `Mengupdate pasien: ${updated.nama}`);
      toast.success('Data pasien berhasil diupdate!');
    } else {
      const newPasien: PasienType = {
        ...formData,
        id: generateId('pasien'),
        createdAt: now,
      } as PasienType;

      const allPasien = storageService.getPasien();
      storageService.savePasien([...allPasien, newPasien]);
      
      logAktivitas(currentUser.id, currentUser.nama, 'ADD_PASIEN', `Menambah pasien: ${newPasien.nama}`);
      toast.success('Pasien berhasil ditambahkan!');
    }

    setShowDialog(false);
    loadPasien();
  };

  const handleDelete = (pasien: PasienType) => {
    if (!confirm(`Yakin ingin menghapus data pasien ${pasien.nama}?`)) return;

    const currentUser = storageService.getCurrentUser();
    const allPasien = storageService.getPasien();
    const filtered = allPasien.filter(p => p.id !== pasien.id);
    storageService.savePasien(filtered);
    
    logAktivitas(currentUser.id, currentUser.nama, 'DELETE_PASIEN', `Menghapus pasien: ${pasien.nama}`);
    toast.success('Data pasien berhasil dihapus!');
    loadPasien();
  };

  const getRiwayatPasien = (pasienId: string) => {
    const transaksi = storageService.getTransaksi().filter(t => t.pasienId === pasienId);
    const resep = storageService.getResep().filter(r => r.pasienId === pasienId);
    return { transaksi, resep };
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manajemen Pasien</h1>
          <p className="text-gray-500 mt-1">Kelola data pasien dan riwayat medis</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Pasien
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Cari pasien (nama, telepon)..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPasien.map(pasien => {
          const { transaksi, resep } = getRiwayatPasien(pasien.id);
          const age = pasien.tanggalLahir ? calculateAge(pasien.tanggalLahir) : null;

          return (
            <Card key={pasien.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{pasien.nama}</CardTitle>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline">
                        {pasien.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                      </Badge>
                      {age && <Badge variant="secondary">{age} tahun</Badge>}
                    </div>
                  </div>
                  <Users className="text-gray-400" size={24} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">Alamat:</span>
                    <p className="font-medium">{pasien.alamat}</p>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Telepon:</span>
                    <span className="font-medium">{pasien.telepon}</span>
                  </div>
                  {pasien.email && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium text-xs">{pasien.email}</span>
                    </div>
                  )}
                  {pasien.tanggalLahir && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tanggal Lahir:</span>
                      <span className="font-medium">{formatDate(pasien.tanggalLahir)}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Riwayat Transaksi:</span>
                      <span className="font-medium">{transaksi.length} kali</span>
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-gray-600">Riwayat Resep:</span>
                      <span className="font-medium">{resep.length} resep</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline" onClick={() => handleOpenDialog(pasien)} className="flex-1">
                    <Edit size={14} className="mr-1" />
                    Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(pasien)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredPasien.length === 0 && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada pasien</h3>
          <p className="mt-1 text-sm text-gray-500">Mulai dengan menambahkan pasien baru</p>
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPasien ? 'Edit Pasien' : 'Tambah Pasien Baru'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Nama Lengkap *</Label>
              <Input
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                placeholder="Nama lengkap pasien"
              />
            </div>

            <div>
              <Label>Jenis Kelamin</Label>
              <Select value={formData.jenisKelamin} onValueChange={(value: PasienType['jenisKelamin']) => setFormData({ ...formData, jenisKelamin: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="L">Laki-laki</SelectItem>
                  <SelectItem value="P">Perempuan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Tanggal Lahir</Label>
              <Input
                type="date"
                value={formData.tanggalLahir}
                onChange={(e) => setFormData({ ...formData, tanggalLahir: e.target.value })}
              />
            </div>

            <div>
              <Label>Alamat</Label>
              <Input
                value={formData.alamat}
                onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                placeholder="Alamat lengkap"
              />
            </div>

            <div>
              <Label>Telepon *</Label>
              <Input
                value={formData.telepon}
                onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
                placeholder="Nomor telepon"
              />
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
    </div>
  );
}