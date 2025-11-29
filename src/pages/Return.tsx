import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { storageService } from '@/lib/storage';
import { Return as ReturnType, Transaksi, ReturnItem } from '@/types';
import { Plus, RotateCcw } from 'lucide-react';
import { formatCurrency, formatDate, generateId, logAktivitas, updateStokObat } from '@/lib/utils-pharmacy';
import { generateNomorReturn } from '@/lib/barcode';
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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function Return() {
  const [returnList, setReturnList] = useState<ReturnType[]>([]);
  const [transaksiList, setTransaksiList] = useState<Transaksi[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedTransaksi, setSelectedTransaksi] = useState<Transaksi | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [alasan, setAlasan] = useState('');

  const currentUser = storageService.getCurrentUser();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const returns = storageService.getReturn();
    setReturnList(returns.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()));
    
    const transaksi = storageService.getTransaksi();
    setTransaksiList(transaksi.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()));
  };

  const handleOpenDialog = () => {
    setSelectedTransaksi(null);
    setSelectedItems(new Set());
    setAlasan('');
    setShowDialog(true);
  };

  const handleSelectTransaksi = (transaksiId: string) => {
    const transaksi = transaksiList.find(t => t.id === transaksiId);
    setSelectedTransaksi(transaksi || null);
    setSelectedItems(new Set());
  };

  const handleToggleItem = (index: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedItems(newSelected);
  };

  const handleSave = () => {
    if (!selectedTransaksi || selectedItems.size === 0 || !alasan) {
      toast.error('Mohon lengkapi data return!');
      return;
    }

    const returnItems: ReturnItem[] = Array.from(selectedItems).map(index => {
      const item = selectedTransaksi.items[index];
      return {
        obatId: item.obatId,
        obatNama: item.obatNama,
        jumlah: item.jumlah,
        hargaSatuan: item.hargaSatuan,
        subtotal: item.subtotal,
      };
    });

    const totalRefund = returnItems.reduce((sum, item) => sum + item.subtotal, 0);

    // Kembalikan stok
    for (const item of returnItems) {
      updateStokObat(
        item.obatId,
        item.jumlah,
        'retur',
        `Return transaksi ${selectedTransaksi.nomorTransaksi}`,
        currentUser.id,
        currentUser.nama
      );
    }

    const newReturn: ReturnType = {
      id: generateId('return'),
      nomorReturn: generateNomorReturn(),
      transaksiId: selectedTransaksi.id,
      nomorTransaksi: selectedTransaksi.nomorTransaksi,
      tanggal: new Date().toISOString(),
      items: returnItems,
      totalRefund,
      alasan,
      disetujuiOleh: currentUser.nama,
      createdAt: new Date().toISOString(),
    };

    const allReturns = storageService.getReturn();
    storageService.saveReturn([...allReturns, newReturn]);

    logAktivitas(currentUser.id, currentUser.nama, 'RETURN', `Return: ${newReturn.nomorReturn} - ${formatCurrency(totalRefund)}`);
    toast.success('Return berhasil diproses!');

    setShowDialog(false);
    loadData();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Return & Refund</h1>
          <p className="text-gray-500 mt-1">Kelola return obat dan refund transaksi</p>
        </div>
        <Button onClick={handleOpenDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Proses Return
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Total Return</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{returnList.length}</div>
            <p className="text-xs text-gray-500 mt-1">Total transaksi return</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Total Refund</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(returnList.reduce((sum, r) => sum + r.totalRefund, 0))}
            </div>
            <p className="text-xs text-gray-500 mt-1">Total nilai refund</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Return Hari Ini</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {returnList.filter(r => {
                const today = new Date().toISOString().split('T')[0];
                return r.tanggal.startsWith(today);
              }).length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Transaksi return hari ini</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RotateCcw size={20} />
            Riwayat Return
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Return</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>No. Transaksi</TableHead>
                <TableHead>Jumlah Item</TableHead>
                <TableHead className="text-right">Total Refund</TableHead>
                <TableHead>Alasan</TableHead>
                <TableHead>Disetujui Oleh</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {returnList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500">
                    Belum ada return
                  </TableCell>
                </TableRow>
              ) : (
                returnList.map((ret) => (
                  <TableRow key={ret.id}>
                    <TableCell className="font-mono text-sm">{ret.nomorReturn}</TableCell>
                    <TableCell>{formatDate(ret.tanggal)}</TableCell>
                    <TableCell className="font-mono text-sm">{ret.nomorTransaksi}</TableCell>
                    <TableCell className="text-center">{ret.items.length}</TableCell>
                    <TableCell className="text-right font-medium text-red-600">
                      {formatCurrency(ret.totalRefund)}
                    </TableCell>
                    <TableCell className="text-sm">{ret.alasan}</TableCell>
                    <TableCell>{ret.disetujuiOleh}</TableCell>
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
            <DialogTitle>Proses Return</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Pilih Transaksi</Label>
              <Select onValueChange={handleSelectTransaksi}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih transaksi..." />
                </SelectTrigger>
                <SelectContent>
                  {transaksiList.slice(0, 50).map(transaksi => (
                    <SelectItem key={transaksi.id} value={transaksi.id}>
                      {transaksi.nomorTransaksi} - {formatDate(transaksi.tanggal)} - {formatCurrency(transaksi.total)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTransaksi && (
              <>
                <div className="p-4 bg-gray-50 rounded">
                  <h3 className="font-semibold mb-2">Detail Transaksi</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Nomor:</span>
                      <span className="font-mono">{selectedTransaksi.nomorTransaksi}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tanggal:</span>
                      <span>{formatDate(selectedTransaksi.tanggal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Kasir:</span>
                      <span>{selectedTransaksi.kasirNama}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total:</span>
                      <span className="font-bold">{formatCurrency(selectedTransaksi.total)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Pilih Item untuk Return</Label>
                  <div className="space-y-2 mt-2">
                    {selectedTransaksi.items.map((item, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 border rounded">
                        <Checkbox
                          checked={selectedItems.has(index)}
                          onCheckedChange={() => handleToggleItem(index)}
                        />
                        <div className="flex-1">
                          <p className="font-medium">{item.obatNama}</p>
                          <p className="text-sm text-gray-600">
                            {item.jumlah} x {formatCurrency(item.hargaSatuan)} = {formatCurrency(item.subtotal)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedItems.size > 0 && (
                  <div className="p-4 bg-blue-50 rounded">
                    <div className="flex justify-between font-bold">
                      <span>Total Refund:</span>
                      <span className="text-blue-600">
                        {formatCurrency(
                          Array.from(selectedItems).reduce((sum, index) => {
                            return sum + selectedTransaksi.items[index].subtotal;
                          }, 0)
                        )}
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <Label>Alasan Return *</Label>
                  <Textarea
                    value={alasan}
                    onChange={(e) => setAlasan(e.target.value)}
                    placeholder="Jelaskan alasan return..."
                    rows={3}
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={!selectedTransaksi || selectedItems.size === 0}>
              Proses Return
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}