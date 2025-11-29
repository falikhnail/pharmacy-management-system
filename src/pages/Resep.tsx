import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { storageService } from '@/lib/storage';
import { Resep as ResepType, Pasien, Obat, ResepItem, Transaksi, StokItem } from '@/types';
import { Plus, FileText, CheckCircle, XCircle, Printer } from 'lucide-react';
import { formatDate, generateId, logAktivitas, updateStokObat, formatCurrency } from '@/lib/utils-pharmacy';
import { generateNomorResep, generateNomorTransaksi } from '@/lib/barcode';
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

export default function Resep() {
  const [resepList, setResepList] = useState<ResepType[]>([]);
  const [pasienList, setPasienList] = useState<Pasien[]>([]);
  const [obatList, setObatList] = useState<Obat[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    pasienId: '',
    dokter: '',
    items: [] as ResepItem[],
    catatan: '',
  });
  const [currentItem, setCurrentItem] = useState({
    obatId: '',
    jumlah: 1,
    dosis: '',
    aturanPakai: '',
  });

  const currentUser = storageService.getCurrentUser();
  const settings = storageService.getSettings();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const resep = storageService.getResep();
    setResepList(resep.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()));
    
    const pasien = storageService.getPasien();
    setPasienList(pasien);
    
    const obat = storageService.getObat();
    setObatList(obat);
  };

  const handleOpenDialog = () => {
    setFormData({
      pasienId: '',
      dokter: '',
      items: [],
      catatan: '',
    });
    setCurrentItem({
      obatId: '',
      jumlah: 1,
      dosis: '',
      aturanPakai: '',
    });
    setShowDialog(true);
  };

  const handleAddItem = () => {
    if (!currentItem.obatId || currentItem.jumlah <= 0) {
      toast.error('Mohon lengkapi data obat!');
      return;
    }

    const obat = obatList.find(o => o.id === currentItem.obatId);
    if (!obat) return;

    const newItem: ResepItem = {
      obatId: obat.id,
      obatNama: obat.nama,
      jumlah: currentItem.jumlah,
      dosis: currentItem.dosis,
      aturanPakai: currentItem.aturanPakai,
      hargaSatuan: obat.hargaJual,
      subtotal: obat.hargaJual * currentItem.jumlah,
    };

    setFormData({
      ...formData,
      items: [...formData.items, newItem],
    });

    setCurrentItem({
      obatId: '',
      jumlah: 1,
      dosis: '',
      aturanPakai: '',
    });
  };

  const handleRemoveItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleSave = () => {
    if (!formData.pasienId || !formData.dokter || formData.items.length === 0) {
      toast.error('Mohon lengkapi data resep!');
      return;
    }

    const pasien = pasienList.find(p => p.id === formData.pasienId);
    if (!pasien) return;

    // Calculate total
    const total = formData.items.reduce((sum, item) => sum + item.subtotal, 0);

    const newResep: ResepType = {
      id: generateId('resep'),
      nomorResep: generateNomorResep(),
      pasienId: pasien.id,
      pasienNama: pasien.nama,
      dokter: formData.dokter,
      tanggal: new Date().toISOString(),
      items: formData.items,
      total: total,
      status: 'Pending',
      catatan: formData.catatan,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const allResep = storageService.getResep();
    storageService.saveResep([...allResep, newResep]);
    
    logAktivitas(currentUser.id, currentUser.nama, 'ADD_RESEP', `Menambah resep: ${newResep.nomorResep}`);
    toast.success('Resep berhasil ditambahkan!');
    
    setShowDialog(false);
    loadData();
  };

  const handleKonfirmasi = (resep: ResepType) => {
    if (!confirm('Konfirmasi resep ini? Stok obat akan dikurangi dan transaksi akan dicatat.')) return;

    // Kurangi stok untuk setiap item
    let success = true;
    for (const item of resep.items) {
      const result = updateStokObat(
        item.obatId,
        item.jumlah,
        'keluar',
        `Resep ${resep.nomorResep}`,
        currentUser.id,
        currentUser.nama,
        resep.id
      );
      if (!result) {
        success = false;
        toast.error(`Stok ${item.obatNama} tidak mencukupi!`);
        break;
      }
    }

    if (success) {
      // Update resep status to 'Selesai'
      const allResep = storageService.getResep();
      const updated = allResep.map(r =>
        r.id === resep.id
          ? {
              ...r,
              status: 'Selesai' as const,
              apotekerId: currentUser.id,
              apotekerNama: currentUser.nama,
              updatedAt: new Date().toISOString(),
            }
          : r
      );
      storageService.saveResep(updated);

      // Create transaction record from prescription
      const transaksiItems: StokItem[] = resep.items.map(item => ({
        obatId: item.obatId,
        obatNama: item.obatNama,
        jumlah: item.jumlah,
        hargaSatuan: item.hargaSatuan,
        subtotal: item.subtotal,
      }));

      const subtotal = resep.total;
      const diskon = 0;
      const diskonPersen = 0;
      const pajak = (subtotal * (settings?.taxRate || 0)) / 100;
      const total = subtotal + pajak;

      const transaksi: Transaksi = {
        id: generateId('transaksi'),
        nomorTransaksi: generateNomorTransaksi(),
        tanggal: new Date().toISOString(),
        kasirId: currentUser.id,
        kasirNama: currentUser.nama,
        items: transaksiItems,
        subtotal: subtotal,
        diskon: diskon,
        diskonPersen: diskonPersen,
        pajak: pajak,
        pajakPersen: settings?.taxRate || 0,
        total: total,
        metodePembayaran: 'Tunai',
        jumlahBayar: total,
        kembalian: 0,
        catatan: `Transaksi dari Resep ${resep.nomorResep}`,
        createdAt: new Date().toISOString(),
      };

      // Save transaction
      const allTransaksi = storageService.getTransaksi();
      storageService.saveTransaksi([...allTransaksi, transaksi]);
      
      logAktivitas(currentUser.id, currentUser.nama, 'KONFIRMASI_RESEP', `Mengkonfirmasi resep: ${resep.nomorResep} - Transaksi: ${transaksi.nomorTransaksi}`);
      toast.success('Resep berhasil dikonfirmasi dan transaksi tercatat!');
      loadData();
    }
  };

  const handleBatal = (resep: ResepType) => {
    if (!confirm('Batalkan resep ini?')) return;

    const allResep = storageService.getResep();
    const updated = allResep.map(r =>
      r.id === resep.id
        ? { ...r, status: 'Dibatalkan' as const, updatedAt: new Date().toISOString() }
        : r
    );
    storageService.saveResep(updated);
    
    logAktivitas(currentUser.id, currentUser.nama, 'BATAL_RESEP', `Membatalkan resep: ${resep.nomorResep}`);
    toast.success('Resep dibatalkan!');
    loadData();
  };

  const handlePrintLabel = (resep: ResepType) => {
    const printWindow = window.open('', '', 'width=400,height=600');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Label Resep - ${resep.nomorResep}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; }
          .section { margin: 15px 0; }
          .label { font-weight: bold; }
          .item { margin: 10px 0; padding: 10px; border: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>LABEL RESEP OBAT</h2>
          <p>${resep.nomorResep}</p>
        </div>
        
        <div class="section">
          <p><span class="label">Pasien:</span> ${resep.pasienNama}</p>
          <p><span class="label">Dokter:</span> ${resep.dokter}</p>
          <p><span class="label">Tanggal:</span> ${formatDate(resep.tanggal)}</p>
        </div>
        
        <div class="section">
          <h3>Obat yang Diberikan:</h3>
          ${resep.items.map((item, idx) => `
            <div class="item">
              <p><strong>${idx + 1}. ${item.obatNama}</strong></p>
              <p>Jumlah: ${item.jumlah}</p>
              <p>Dosis: ${item.dosis}</p>
              <p>Aturan Pakai: ${item.aturanPakai}</p>
            </div>
          `).join('')}
        </div>
        
        ${resep.catatan ? `
          <div class="section">
            <p><span class="label">Catatan:</span> ${resep.catatan}</p>
          </div>
        ` : ''}
        
        <div class="section" style="margin-top: 30px;">
          <p><span class="label">Apoteker:</span> ${resep.apotekerNama || '-'}</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'Diproses':
        return <Badge className="bg-blue-100 text-blue-800">Diproses</Badge>;
      case 'Selesai':
        return <Badge className="bg-green-100 text-green-800">Selesai</Badge>;
      case 'Dibatalkan':
        return <Badge variant="destructive">Dibatalkan</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Filter to show only pending prescriptions
  const pendingResepList = resepList.filter(r => r.status === 'Pending');
  const completedResepList = resepList.filter(r => r.status !== 'Pending');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manajemen Resep Dokter</h1>
          <p className="text-gray-500 mt-1">Kelola resep dokter dan konfirmasi apoteker</p>
        </div>
        <Button onClick={handleOpenDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Resep
        </Button>
      </div>

      {/* Pending Prescriptions */}
      <Card>
        <CardHeader>
          <CardTitle>Resep Masuk (Pending) - {pendingResepList.length}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Resep</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Pasien</TableHead>
                <TableHead>Dokter</TableHead>
                <TableHead>Jumlah Item</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingResepList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-500">
                    Tidak ada resep pending
                  </TableCell>
                </TableRow>
              ) : (
                pendingResepList.map((resep) => (
                  <TableRow key={resep.id}>
                    <TableCell className="font-mono text-sm">{resep.nomorResep}</TableCell>
                    <TableCell>{formatDate(resep.tanggal)}</TableCell>
                    <TableCell>{resep.pasienNama}</TableCell>
                    <TableCell>{resep.dokter}</TableCell>
                    <TableCell className="text-center">{resep.items.length}</TableCell>
                    <TableCell>{formatCurrency(resep.total)}</TableCell>
                    <TableCell>{getStatusBadge(resep.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleKonfirmasi(resep)}>
                          <CheckCircle size={14} className="mr-1" />
                          Konfirmasi
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleBatal(resep)}>
                          <XCircle size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Completed Prescriptions */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Resep (Selesai/Dibatalkan) - {completedResepList.length}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Resep</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Pasien</TableHead>
                <TableHead>Dokter</TableHead>
                <TableHead>Jumlah Item</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Apoteker</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {completedResepList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-gray-500">
                    Belum ada riwayat resep
                  </TableCell>
                </TableRow>
              ) : (
                completedResepList.map((resep) => (
                  <TableRow key={resep.id}>
                    <TableCell className="font-mono text-sm">{resep.nomorResep}</TableCell>
                    <TableCell>{formatDate(resep.tanggal)}</TableCell>
                    <TableCell>{resep.pasienNama}</TableCell>
                    <TableCell>{resep.dokter}</TableCell>
                    <TableCell className="text-center">{resep.items.length}</TableCell>
                    <TableCell>{formatCurrency(resep.total)}</TableCell>
                    <TableCell>{getStatusBadge(resep.status)}</TableCell>
                    <TableCell>{resep.apotekerNama || '-'}</TableCell>
                    <TableCell>
                      {resep.status === 'Selesai' && (
                        <Button size="sm" variant="outline" onClick={() => handlePrintLabel(resep)}>
                          <Printer size={14} className="mr-1" />
                          Label
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tambah Resep Baru</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Pilih Pasien *</Label>
                <Select value={formData.pasienId} onValueChange={(value) => setFormData({ ...formData, pasienId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih pasien..." />
                  </SelectTrigger>
                  <SelectContent>
                    {pasienList.map(pasien => (
                      <SelectItem key={pasien.id} value={pasien.id}>
                        {pasien.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Nama Dokter *</Label>
                <Input
                  value={formData.dokter}
                  onChange={(e) => setFormData({ ...formData, dokter: e.target.value })}
                  placeholder="Nama dokter"
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Tambah Obat</h3>
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <Label>Pilih Obat</Label>
                  <Select value={currentItem.obatId} onValueChange={(value) => setCurrentItem({ ...currentItem, obatId: value })}>
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
                  <Label>Jumlah</Label>
                  <Input
                    type="number"
                    value={currentItem.jumlah}
                    onChange={(e) => setCurrentItem({ ...currentItem, jumlah: parseInt(e.target.value) || 1 })}
                  />
                </div>

                <div>
                  <Label>Dosis</Label>
                  <Input
                    value={currentItem.dosis}
                    onChange={(e) => setCurrentItem({ ...currentItem, dosis: e.target.value })}
                    placeholder="Contoh: 500mg"
                  />
                </div>

                <div>
                  <Label>Aturan Pakai</Label>
                  <Input
                    value={currentItem.aturanPakai}
                    onChange={(e) => setCurrentItem({ ...currentItem, aturanPakai: e.target.value })}
                    placeholder="Contoh: 3x sehari sesudah makan"
                  />
                </div>
              </div>
              <Button type="button" variant="outline" onClick={handleAddItem} className="w-full">
                <Plus size={14} className="mr-1" />
                Tambah Obat ke Resep
              </Button>
            </div>

            {formData.items.length > 0 && (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Daftar Obat ({formData.items.length})</h3>
                <div className="space-y-2">
                  {formData.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-start p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">{item.obatNama}</p>
                        <p className="text-sm text-gray-600">
                          Jumlah: {item.jumlah} | Dosis: {item.dosis} | {item.aturanPakai}
                        </p>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => handleRemoveItem(index)}>
                        <XCircle size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label>Catatan</Label>
              <Textarea
                value={formData.catatan}
                onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                placeholder="Catatan tambahan (opsional)"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleSave}>
              Simpan Resep
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}