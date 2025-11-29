import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { storageService } from '@/lib/storage';
import { Obat as ObatType } from '@/types';
import { Plus, Search, Edit, Trash2, Archive, Package } from 'lucide-react';
import { formatCurrency, formatDate, isExpired, isStokLow, generateId, logAktivitas } from '@/lib/utils-pharmacy';
import { generateBarcode } from '@/lib/barcode';
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

// Helper functions for currency formatting
const formatCurrencyInput = (value: string): string => {
  // Remove all non-digit characters
  const numbers = value.replace(/\D/g, '');
  
  if (!numbers) return '';
  
  // Convert to number and format with thousand separators
  const formatted = parseInt(numbers).toLocaleString('id-ID');
  return formatted;
};

const parseCurrencyInput = (value: string): number => {
  // Remove all non-digit characters and convert to number
  const numbers = value.replace(/\D/g, '');
  return numbers ? parseInt(numbers) : 0;
};

export default function Obat() {
  const [obatList, setObatList] = useState<ObatType[]>([]);
  const [filteredObat, setFilteredObat] = useState<ObatType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingObat, setEditingObat] = useState<ObatType | null>(null);
  const [formData, setFormData] = useState<Partial<ObatType>>({
    nama: '',
    kategori: 'lainnya',
    bentuk: 'tablet',
    satuan: 'tablet',
    nomorBatch: '',
    nomorRegistrasi: '',
    tanggalKadaluarsa: '',
    barcode: '',
    stokMinimum: 10,
    stokCurrent: 0,
    hargaBeli: 0,
    hargaJual: 0,
    deskripsi: '',
  });

  // Display values for formatted inputs
  const [hargaBeliDisplay, setHargaBeliDisplay] = useState('');
  const [hargaJualDisplay, setHargaJualDisplay] = useState('');

  useEffect(() => {
    loadObat();
  }, []);

  useEffect(() => {
    filterObat();
  }, [searchTerm, obatList]);

  // Update display values when formData changes
  useEffect(() => {
    if (formData.hargaBeli) {
      setHargaBeliDisplay(formatCurrencyInput(formData.hargaBeli.toString()));
    } else {
      setHargaBeliDisplay('');
    }
    
    if (formData.hargaJual) {
      setHargaJualDisplay(formatCurrencyInput(formData.hargaJual.toString()));
    } else {
      setHargaJualDisplay('');
    }
  }, [formData.hargaBeli, formData.hargaJual]);

  const loadObat = () => {
    const data = storageService.getObat();
    setObatList(data);
  };

  const filterObat = () => {
    const filtered = obatList.filter(obat => 
      !obat.isArchived && (
        obat.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        obat.barcode.includes(searchTerm) ||
        obat.nomorBatch.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    setFilteredObat(filtered);
  };

  const handleOpenDialog = (obat?: ObatType) => {
    if (obat) {
      setEditingObat(obat);
      setFormData(obat);
      setHargaBeliDisplay(formatCurrencyInput(obat.hargaBeli.toString()));
      setHargaJualDisplay(formatCurrencyInput(obat.hargaJual.toString()));
    } else {
      setEditingObat(null);
      setFormData({
        nama: '',
        kategori: 'lainnya',
        bentuk: 'tablet',
        satuan: 'tablet',
        nomorBatch: '',
        nomorRegistrasi: '',
        tanggalKadaluarsa: '',
        barcode: generateBarcode(),
        stokMinimum: 10,
        stokCurrent: 0,
        hargaBeli: 0,
        hargaJual: 0,
        deskripsi: '',
      });
      setHargaBeliDisplay('');
      setHargaJualDisplay('');
    }
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!formData.nama || !formData.nomorBatch || !formData.tanggalKadaluarsa) {
      toast.error('Mohon lengkapi data yang diperlukan!');
      return;
    }

    const currentUser = storageService.getCurrentUser();
    const now = new Date().toISOString();

    if (editingObat) {
      const updated: ObatType = {
        ...editingObat,
        ...formData,
        updatedAt: now,
      } as ObatType;

      const allObat = storageService.getObat();
      const updatedList = allObat.map(o => o.id === editingObat.id ? updated : o);
      storageService.saveObat(updatedList);
      
      logAktivitas(currentUser.id, currentUser.nama, 'UPDATE_OBAT', `Mengupdate obat: ${updated.nama}`);
      toast.success('Obat berhasil diupdate!');
    } else {
      const newObat: ObatType = {
        ...formData,
        id: generateId('obat'),
        createdAt: now,
        updatedAt: now,
        isArchived: false,
      } as ObatType;

      const allObat = storageService.getObat();
      storageService.saveObat([...allObat, newObat]);
      
      logAktivitas(currentUser.id, currentUser.nama, 'ADD_OBAT', `Menambah obat: ${newObat.nama}`);
      toast.success('Obat berhasil ditambahkan!');
    }

    setShowDialog(false);
    loadObat();
  };

  const handleDelete = (obat: ObatType) => {
    if (!confirm(`Yakin ingin menghapus obat ${obat.nama}?`)) return;

    const currentUser = storageService.getCurrentUser();
    const allObat = storageService.getObat();
    const filtered = allObat.filter(o => o.id !== obat.id);
    storageService.saveObat(filtered);
    
    logAktivitas(currentUser.id, currentUser.nama, 'DELETE_OBAT', `Menghapus obat: ${obat.nama}`);
    toast.success('Obat berhasil dihapus!');
    loadObat();
  };

  const handleArchive = (obat: ObatType) => {
    const currentUser = storageService.getCurrentUser();
    const allObat = storageService.getObat();
    const updated = allObat.map(o => 
      o.id === obat.id ? { ...o, isArchived: !o.isArchived } : o
    );
    storageService.saveObat(updated);
    
    logAktivitas(currentUser.id, currentUser.nama, 'ARCHIVE_OBAT', `Mengarsip obat: ${obat.nama}`);
    toast.success(obat.isArchived ? 'Obat berhasil diaktifkan!' : 'Obat berhasil diarsipkan!');
    loadObat();
  };

  const handleHargaBeliChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formatted = formatCurrencyInput(value);
    const parsed = parseCurrencyInput(value);
    
    setHargaBeliDisplay(formatted);
    setFormData({ ...formData, hargaBeli: parsed });
  };

  const handleHargaJualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formatted = formatCurrencyInput(value);
    const parsed = parseCurrencyInput(value);
    
    setHargaJualDisplay(formatted);
    setFormData({ ...formData, hargaJual: parsed });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manajemen Obat</h1>
          <p className="text-gray-500 mt-1">Kelola data obat apotek</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Obat
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Cari obat (nama, barcode, batch)..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredObat.map(obat => (
          <Card key={obat.id} className={isExpired(obat.tanggalKadaluarsa) ? 'border-red-300' : ''}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg">{obat.nama}</CardTitle>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline">{obat.kategori}</Badge>
                    <Badge variant="secondary">{obat.bentuk}</Badge>
                  </div>
                </div>
                <Package className="text-gray-400" size={24} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Batch:</span>
                  <span className="font-medium">{obat.nomorBatch}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Barcode:</span>
                  <span className="font-mono text-xs">{obat.barcode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Kadaluarsa:</span>
                  <span className={isExpired(obat.tanggalKadaluarsa) ? 'text-red-600 font-medium' : ''}>
                    {formatDate(obat.tanggalKadaluarsa)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Stok:</span>
                  <span className={isStokLow(obat) ? 'text-yellow-600 font-medium' : 'font-medium'}>
                    {obat.stokCurrent} {obat.satuan}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Harga Jual:</span>
                  <span className="font-medium">{formatCurrency(obat.hargaJual)}</span>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button size="sm" variant="outline" onClick={() => handleOpenDialog(obat)} className="flex-1">
                  <Edit size={14} className="mr-1" />
                  Edit
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleArchive(obat)}>
                  <Archive size={14} />
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(obat)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredObat.length === 0 && (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada obat</h3>
          <p className="mt-1 text-sm text-gray-500">Mulai dengan menambahkan obat baru</p>
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingObat ? 'Edit Obat' : 'Tambah Obat Baru'}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Nama Obat *</Label>
              <Input
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                placeholder="Contoh: Paracetamol 500mg"
              />
            </div>

            <div>
              <Label>Kategori</Label>
              <Select value={formData.kategori} onValueChange={(value: ObatType['kategori']) => setFormData({ ...formData, kategori: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="antibiotik">Antibiotik</SelectItem>
                  <SelectItem value="analgesik">Analgesik</SelectItem>
                  <SelectItem value="vitamin">Vitamin</SelectItem>
                  <SelectItem value="antiseptik">Antiseptik</SelectItem>
                  <SelectItem value="antihistamin">Antihistamin</SelectItem>
                  <SelectItem value="antasida">Antasida</SelectItem>
                  <SelectItem value="lainnya">Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Bentuk</Label>
              <Select value={formData.bentuk} onValueChange={(value: ObatType['bentuk']) => setFormData({ ...formData, bentuk: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tablet">Tablet</SelectItem>
                  <SelectItem value="kapsul">Kapsul</SelectItem>
                  <SelectItem value="sirup">Sirup</SelectItem>
                  <SelectItem value="salep">Salep</SelectItem>
                  <SelectItem value="injeksi">Injeksi</SelectItem>
                  <SelectItem value="tetes">Tetes</SelectItem>
                  <SelectItem value="inhaler">Inhaler</SelectItem>
                  <SelectItem value="supositoria">Supositoria</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Satuan</Label>
              <Input
                value={formData.satuan}
                onChange={(e) => setFormData({ ...formData, satuan: e.target.value })}
                placeholder="tablet, botol, tube, dll"
              />
            </div>

            <div>
              <Label>Nomor Batch *</Label>
              <Input
                value={formData.nomorBatch}
                onChange={(e) => setFormData({ ...formData, nomorBatch: e.target.value })}
                placeholder="Contoh: BATCH2024001"
              />
            </div>

            <div>
              <Label>Nomor Registrasi</Label>
              <Input
                value={formData.nomorRegistrasi}
                onChange={(e) => setFormData({ ...formData, nomorRegistrasi: e.target.value })}
                placeholder="Contoh: DKL1234567890A1"
              />
            </div>

            <div>
              <Label>Tanggal Kadaluarsa *</Label>
              <Input
                type="date"
                value={formData.tanggalKadaluarsa}
                onChange={(e) => setFormData({ ...formData, tanggalKadaluarsa: e.target.value })}
              />
            </div>

            <div>
              <Label>Barcode</Label>
              <Input
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                placeholder="Auto-generated"
                disabled
              />
            </div>

            <div>
              <Label>Stok Minimum</Label>
              <Input
                type="number"
                value={formData.stokMinimum}
                onChange={(e) => setFormData({ ...formData, stokMinimum: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div>
              <Label>Stok Awal</Label>
              <Input
                type="number"
                value={formData.stokCurrent}
                onChange={(e) => setFormData({ ...formData, stokCurrent: parseInt(e.target.value) || 0 })}
                disabled={!!editingObat}
              />
            </div>

            <div>
              <Label>Harga Beli</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                  Rp
                </span>
                <Input
                  type="text"
                  value={hargaBeliDisplay}
                  onChange={handleHargaBeliChange}
                  placeholder="Contoh: 50000"
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label>Harga Jual</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                  Rp
                </span>
                <Input
                  type="text"
                  value={hargaJualDisplay}
                  onChange={handleHargaJualChange}
                  placeholder="Contoh: 75000"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="col-span-2">
              <Label>Deskripsi</Label>
              <Textarea
                value={formData.deskripsi}
                onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                placeholder="Deskripsi obat (opsional)"
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