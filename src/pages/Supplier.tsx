import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { storageService } from '@/lib/storage';
import { Supplier as SupplierType, Pembelian } from '@/types';
import { Plus, Search, Edit, Trash2, Truck, ShoppingBag } from 'lucide-react';
import { formatCurrency, formatDate, generateId, logAktivitas } from '@/lib/utils-pharmacy';
import { generateNomorInvoice } from '@/lib/barcode';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function Supplier() {
  const [supplierList, setSupplierList] = useState<SupplierType[]>([]);
  const [pembelianList, setPembelianList] = useState<Pembelian[]>([]);
  const [filteredSupplier, setFilteredSupplier] = useState<SupplierType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<SupplierType | null>(null);
  const [formData, setFormData] = useState<Partial<SupplierType>>({
    nama: '',
    alamat: '',
    telepon: '',
    email: '',
    kontakPerson: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterSupplier();
  }, [searchTerm, supplierList]);

  const loadData = () => {
    const suppliers = storageService.getSupplier();
    setSupplierList(suppliers);
    
    const pembelian = storageService.getPembelian();
    setPembelianList(pembelian);
  };

  const filterSupplier = () => {
    const filtered = supplierList.filter(supplier =>
      supplier.isActive && (
        supplier.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.telepon.includes(searchTerm) ||
        supplier.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    setFilteredSupplier(filtered);
  };

  const handleOpenDialog = (supplier?: SupplierType) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData(supplier);
    } else {
      setEditingSupplier(null);
      setFormData({
        nama: '',
        alamat: '',
        telepon: '',
        email: '',
        kontakPerson: '',
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

    if (editingSupplier) {
      const updated: SupplierType = {
        ...editingSupplier,
        ...formData,
      } as SupplierType;

      const allSupplier = storageService.getSupplier();
      const updatedList = allSupplier.map(s => s.id === editingSupplier.id ? updated : s);
      storageService.saveSupplier(updatedList);
      
      logAktivitas(currentUser.id, currentUser.nama, 'UPDATE_SUPPLIER', `Mengupdate supplier: ${updated.nama}`);
      toast.success('Supplier berhasil diupdate!');
    } else {
      const newSupplier: SupplierType = {
        ...formData,
        id: generateId('supplier'),
        createdAt: now,
        isActive: true,
      } as SupplierType;

      const allSupplier = storageService.getSupplier();
      storageService.saveSupplier([...allSupplier, newSupplier]);
      
      logAktivitas(currentUser.id, currentUser.nama, 'ADD_SUPPLIER', `Menambah supplier: ${newSupplier.nama}`);
      toast.success('Supplier berhasil ditambahkan!');
    }

    setShowDialog(false);
    loadData();
  };

  const handleDelete = (supplier: SupplierType) => {
    if (!confirm(`Yakin ingin menghapus supplier ${supplier.nama}?`)) return;

    const currentUser = storageService.getCurrentUser();
    const allSupplier = storageService.getSupplier();
    const updated = allSupplier.map(s =>
      s.id === supplier.id ? { ...s, isActive: false } : s
    );
    storageService.saveSupplier(updated);
    
    logAktivitas(currentUser.id, currentUser.nama, 'DELETE_SUPPLIER', `Menghapus supplier: ${supplier.nama}`);
    toast.success('Supplier berhasil dihapus!');
    loadData();
  };

  const getSupplierPembelian = (supplierId: string) => {
    return pembelianList.filter(p => p.supplierId === supplierId);
  };

  const getTotalPembelian = (supplierId: string) => {
    return getSupplierPembelian(supplierId).reduce((sum, p) => sum + p.total, 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manajemen Supplier</h1>
          <p className="text-gray-500 mt-1">Kelola data supplier dan pembelian</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Supplier
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Cari supplier (nama, telepon, email)..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSupplier.map(supplier => {
          const pembelian = getSupplierPembelian(supplier.id);
          const totalPembelian = getTotalPembelian(supplier.id);

          return (
            <Card key={supplier.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{supplier.nama}</CardTitle>
                    <Badge variant="outline" className="mt-2">
                      <Truck size={12} className="mr-1" />
                      Supplier
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">Alamat:</span>
                    <p className="font-medium">{supplier.alamat}</p>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Telepon:</span>
                    <span className="font-medium">{supplier.telepon}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium text-xs">{supplier.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Kontak:</span>
                    <span className="font-medium">{supplier.kontakPerson}</span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Pembelian:</span>
                      <div className="text-right">
                        <p className="font-bold text-green-600">{formatCurrency(totalPembelian)}</p>
                        <p className="text-xs text-gray-500">{pembelian.length} transaksi</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline" onClick={() => handleOpenDialog(supplier)} className="flex-1">
                    <Edit size={14} className="mr-1" />
                    Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(supplier)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredSupplier.length === 0 && (
        <div className="text-center py-12">
          <Truck className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada supplier</h3>
          <p className="mt-1 text-sm text-gray-500">Mulai dengan menambahkan supplier baru</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag size={20} />
            Riwayat Pembelian Terbaru
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>No. Invoice</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pembelianList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500">
                    Belum ada pembelian
                  </TableCell>
                </TableRow>
              ) : (
                pembelianList.slice(-10).reverse().map((pembelian) => (
                  <TableRow key={pembelian.id}>
                    <TableCell>{formatDate(pembelian.tanggal)}</TableCell>
                    <TableCell className="font-mono text-sm">{pembelian.nomorInvoice}</TableCell>
                    <TableCell>{pembelian.supplierNama}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(pembelian.total)}</TableCell>
                    <TableCell>
                      <Badge variant={pembelian.status === 'selesai' ? 'default' : 'secondary'}>
                        {pembelian.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSupplier ? 'Edit Supplier' : 'Tambah Supplier Baru'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Nama Supplier *</Label>
              <Input
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                placeholder="Contoh: PT Kimia Farma"
              />
            </div>

            <div>
              <Label>Alamat</Label>
              <Input
                value={formData.alamat}
                onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                placeholder="Alamat lengkap supplier"
              />
            </div>

            <div>
              <Label>Telepon *</Label>
              <Input
                value={formData.telepon}
                onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
                placeholder="Contoh: 021-12345678"
              />
            </div>

            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@supplier.com"
              />
            </div>

            <div>
              <Label>Kontak Person</Label>
              <Input
                value={formData.kontakPerson}
                onChange={(e) => setFormData({ ...formData, kontakPerson: e.target.value })}
                placeholder="Nama kontak person"
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