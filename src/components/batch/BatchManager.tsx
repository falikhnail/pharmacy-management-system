import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ObatBatch, Obat } from '@/types';
import { storageService } from '@/lib/storage';
import {
  getBatchStatus,
  calculateDaysUntilExpiry,
  getBatchColorClass,
  generateBatchNumber,
  sortBatchesByFEFO,
} from '@/lib/batch-utils';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, AlertTriangle, Package } from 'lucide-react';

interface BatchManagerProps {
  obat: Obat;
  onUpdate: () => void;
}

export default function BatchManager({ obat, onUpdate }: BatchManagerProps) {
  const [batches, setBatches] = useState<ObatBatch[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<ObatBatch | null>(null);
  const [formData, setFormData] = useState({
    nomorBatch: '',
    tanggalKadaluarsa: '',
    jumlahStok: 0,
    hargaBeli: 0,
    tanggalMasuk: new Date().toISOString().split('T')[0],
    supplierId: '',
    supplierNama: '',
  });

  useEffect(() => {
    loadBatches();
  }, [obat.id]);

  const loadBatches = () => {
    const allBatches = storageService.getBatchesByObatId(obat.id);
    const sortedBatches = sortBatchesByFEFO(allBatches);
    setBatches(sortedBatches);
  };

  const handleOpenDialog = (batch?: ObatBatch) => {
    if (batch) {
      setEditingBatch(batch);
      setFormData({
        nomorBatch: batch.nomorBatch,
        tanggalKadaluarsa: batch.tanggalKadaluarsa.split('T')[0],
        jumlahStok: batch.jumlahStok,
        hargaBeli: batch.hargaBeli,
        tanggalMasuk: batch.tanggalMasuk.split('T')[0],
        supplierId: batch.supplierId,
        supplierNama: batch.supplierNama,
      });
    } else {
      setEditingBatch(null);
      setFormData({
        nomorBatch: generateBatchNumber(),
        tanggalKadaluarsa: '',
        jumlahStok: 0,
        hargaBeli: obat.hargaBeli,
        tanggalMasuk: new Date().toISOString().split('T')[0],
        supplierId: '',
        supplierNama: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.nomorBatch || !formData.tanggalKadaluarsa || formData.jumlahStok <= 0) {
      toast.error('Mohon lengkapi semua field yang diperlukan');
      return;
    }

    const settings = storageService.getSettings();
    const status = getBatchStatus(formData.tanggalKadaluarsa, settings.expiryWarningDays);

    if (editingBatch) {
      // Update existing batch
      storageService.updateObatBatch(editingBatch.id, {
        ...formData,
        status,
        updatedAt: new Date().toISOString(),
      });
      toast.success('Batch berhasil diupdate');
    } else {
      // Add new batch
      const newBatch: ObatBatch = {
        id: `batch-${Date.now()}`,
        obatId: obat.id,
        ...formData,
        status,
        createdAt: new Date().toISOString(),
      };
      storageService.addObatBatch(newBatch);
      toast.success('Batch berhasil ditambahkan');
    }

    setIsDialogOpen(false);
    loadBatches();
    onUpdate();
  };

  const handleDelete = (batchId: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus batch ini?')) {
      storageService.deleteObatBatch(batchId);
      toast.success('Batch berhasil dihapus');
      loadBatches();
      onUpdate();
    }
  };

  const totalStock = batches.reduce((sum, b) => sum + b.jumlahStok, 0);
  const expiredBatches = batches.filter(b => b.status === 'Expired');
  const nearExpiryBatches = batches.filter(b => b.status === 'Near Expiry');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Batch Management - {obat.nama}
            </CardTitle>
            <CardDescription>
              Kelola nomor batch dan tanggal kadaluarsa obat
            </CardDescription>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Batch
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Stok</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStock} {obat.satuan}</div>
              <p className="text-xs text-muted-foreground">{batches.length} batch</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-orange-600">Near Expiry</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{nearExpiryBatches.length}</div>
              <p className="text-xs text-muted-foreground">batch mendekati kadaluarsa</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-red-600">Expired</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{expiredBatches.length}</div>
              <p className="text-xs text-muted-foreground">batch kadaluarsa</p>
            </CardContent>
          </Card>
        </div>

        {batches.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Belum ada batch untuk obat ini</p>
            <p className="text-sm">Klik "Tambah Batch" untuk menambahkan batch baru</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nomor Batch</TableHead>
                <TableHead>Tanggal Masuk</TableHead>
                <TableHead>Tanggal Kadaluarsa</TableHead>
                <TableHead>Stok</TableHead>
                <TableHead>Harga Beli</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.map((batch) => {
                const daysUntil = calculateDaysUntilExpiry(batch.tanggalKadaluarsa);
                return (
                  <TableRow key={batch.id}>
                    <TableCell className="font-medium">{batch.nomorBatch}</TableCell>
                    <TableCell>{new Date(batch.tanggalMasuk).toLocaleDateString('id-ID')}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {new Date(batch.tanggalKadaluarsa).toLocaleDateString('id-ID')}
                        {daysUntil <= 30 && daysUntil > 0 && (
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                        )}
                        {daysUntil < 0 && (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {daysUntil < 0 ? `Expired ${Math.abs(daysUntil)} hari lalu` : `${daysUntil} hari lagi`}
                      </div>
                    </TableCell>
                    <TableCell>{batch.jumlahStok} {obat.satuan}</TableCell>
                    <TableCell>Rp {batch.hargaBeli.toLocaleString('id-ID')}</TableCell>
                    <TableCell>
                      <Badge className={getBatchColorClass(batch)}>
                        {batch.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{batch.supplierNama || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(batch)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(batch.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingBatch ? 'Edit Batch' : 'Tambah Batch Baru'}</DialogTitle>
            <DialogDescription>
              Masukkan informasi batch obat
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="nomorBatch">Nomor Batch *</Label>
              <Input
                id="nomorBatch"
                value={formData.nomorBatch}
                onChange={(e) => setFormData({ ...formData, nomorBatch: e.target.value })}
                placeholder="BATCH-20240101-001"
              />
            </div>
            <div>
              <Label htmlFor="tanggalMasuk">Tanggal Masuk *</Label>
              <Input
                id="tanggalMasuk"
                type="date"
                value={formData.tanggalMasuk}
                onChange={(e) => setFormData({ ...formData, tanggalMasuk: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="tanggalKadaluarsa">Tanggal Kadaluarsa *</Label>
              <Input
                id="tanggalKadaluarsa"
                type="date"
                value={formData.tanggalKadaluarsa}
                onChange={(e) => setFormData({ ...formData, tanggalKadaluarsa: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="jumlahStok">Jumlah Stok *</Label>
              <Input
                id="jumlahStok"
                type="number"
                value={formData.jumlahStok}
                onChange={(e) => setFormData({ ...formData, jumlahStok: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="hargaBeli">Harga Beli *</Label>
              <Input
                id="hargaBeli"
                type="number"
                value={formData.hargaBeli}
                onChange={(e) => setFormData({ ...formData, hargaBeli: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="supplierNama">Nama Supplier</Label>
              <Input
                id="supplierNama"
                value={formData.supplierNama}
                onChange={(e) => setFormData({ ...formData, supplierNama: e.target.value })}
                placeholder="Nama supplier"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSave}>
              {editingBatch ? 'Update' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}