import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { storageService } from '@/lib/storage';
import { LogStok, Obat } from '@/types';
import { Plus, TrendingUp, TrendingDown, ArrowRightLeft } from 'lucide-react';
import { formatDateTime, updateStokObat, logAktivitas } from '@/lib/utils-pharmacy';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function Stok() {
  const [logStok, setLogStok] = useState<LogStok[]>([]);
  const [obatList, setObatList] = useState<Obat[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    obatId: '',
    tipe: 'masuk' as 'masuk' | 'keluar' | 'transfer',
    jumlah: 0,
    keterangan: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const logs = storageService.getLogStok();
    setLogStok(logs.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()));
    
    const obat = storageService.getObat().filter(o => !o.isArchived);
    setObatList(obat);
  };

  const handleOpenDialog = () => {
    setFormData({
      obatId: '',
      tipe: 'masuk',
      jumlah: 0,
      keterangan: '',
    });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!formData.obatId || formData.jumlah <= 0) {
      toast.error('Mohon lengkapi data yang diperlukan!');
      return;
    }

    const currentUser = storageService.getCurrentUser();
    const obat = obatList.find(o => o.id === formData.obatId);
    if (!obat) return;

    const success = updateStokObat(
      formData.obatId,
      formData.jumlah,
      formData.tipe,
      formData.keterangan,
      currentUser.id,
      currentUser.nama
    );

    if (success) {
      logAktivitas(
        currentUser.id,
        currentUser.nama,
        'UPDATE_STOK',
        `${formData.tipe.toUpperCase()} stok obat ${obat.nama}: ${formData.jumlah}`
      );
      toast.success('Stok berhasil diupdate!');
      setShowDialog(false);
      loadData();
    } else {
      toast.error('Gagal update stok! Stok tidak mencukupi.');
    }
  };

  const getTipeIcon = (tipe: string) => {
    switch (tipe) {
      case 'masuk':
        return <TrendingUp className="text-green-600" size={16} />;
      case 'keluar':
        return <TrendingDown className="text-red-600" size={16} />;
      case 'transfer':
        return <ArrowRightLeft className="text-blue-600" size={16} />;
      default:
        return null;
    }
  };

  const getTipeBadge = (tipe: string) => {
    switch (tipe) {
      case 'masuk':
        return <Badge className="bg-green-100 text-green-800">Masuk</Badge>;
      case 'keluar':
        return <Badge className="bg-red-100 text-red-800">Keluar</Badge>;
      case 'transfer':
        return <Badge className="bg-blue-100 text-blue-800">Transfer</Badge>;
      case 'retur':
        return <Badge className="bg-yellow-100 text-yellow-800">Retur</Badge>;
      default:
        return <Badge>{tipe}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manajemen Stok</h1>
          <p className="text-gray-500 mt-1">Kelola stok masuk dan keluar obat</p>
        </div>
        <Button onClick={handleOpenDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Pergerakan Stok
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Total Stok Masuk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {logStok.filter(l => l.tipe === 'masuk').reduce((sum, l) => sum + l.jumlah, 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Total item masuk</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Total Stok Keluar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {logStok.filter(l => l.tipe === 'keluar').reduce((sum, l) => sum + l.jumlah, 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Total item keluar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Total Transaksi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logStok.length}</div>
            <p className="text-xs text-gray-500 mt-1">Total pergerakan stok</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Pergerakan Stok</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Obat</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead className="text-right">Jumlah</TableHead>
                <TableHead className="text-right">Stok Sebelum</TableHead>
                <TableHead className="text-right">Stok Sesudah</TableHead>
                <TableHead>Keterangan</TableHead>
                <TableHead>User</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logStok.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-500">
                    Belum ada pergerakan stok
                  </TableCell>
                </TableRow>
              ) : (
                logStok.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm">{formatDateTime(log.tanggal)}</TableCell>
                    <TableCell className="font-medium">{log.obatNama}</TableCell>
                    <TableCell>{getTipeBadge(log.tipe)}</TableCell>
                    <TableCell className="text-right font-medium">
                      <div className="flex items-center justify-end gap-1">
                        {getTipeIcon(log.tipe)}
                        {log.jumlah}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{log.stokSebelum}</TableCell>
                    <TableCell className="text-right font-medium">{log.stokSesudah}</TableCell>
                    <TableCell className="text-sm text-gray-600">{log.keterangan}</TableCell>
                    <TableCell className="text-sm">{log.userName}</TableCell>
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
            <DialogTitle>Tambah Pergerakan Stok</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Pilih Obat *</Label>
              <Select value={formData.obatId} onValueChange={(value) => setFormData({ ...formData, obatId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih obat..." />
                </SelectTrigger>
                <SelectContent>
                  {obatList.map(obat => (
                    <SelectItem key={obat.id} value={obat.id}>
                      {obat.nama} (Stok: {obat.stokCurrent})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Tipe Pergerakan *</Label>
              <Select value={formData.tipe} onValueChange={(value: LogStok['tipe']) => setFormData({ ...formData, tipe: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="masuk">Stok Masuk</SelectItem>
                  <SelectItem value="keluar">Stok Keluar</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Jumlah *</Label>
              <Input
                type="number"
                value={formData.jumlah}
                onChange={(e) => setFormData({ ...formData, jumlah: parseInt(e.target.value) || 0 })}
                placeholder="Masukkan jumlah"
              />
            </div>

            <div>
              <Label>Keterangan</Label>
              <Textarea
                value={formData.keterangan}
                onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                placeholder="Keterangan pergerakan stok (opsional)"
                rows={3}
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