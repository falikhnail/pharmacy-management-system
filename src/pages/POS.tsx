import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AutocompleteSearch } from '@/components/autocomplete-search';
import { KeyboardShortcutsHelp } from '@/components/keyboard-shortcuts-help';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { storageService } from '@/lib/storage';
import { Obat, Pasien, TransaksiItem, Transaksi } from '@/types';
import { Search, Plus, Minus, Trash2, ShoppingCart, Printer, AlertTriangle, Package, Keyboard, Save } from 'lucide-react';
import { formatCurrency, generateId, logAktivitas, updateStokObat, printReceipt, isStokLow } from '@/lib/utils-pharmacy';
import { generateNomorTransaksi } from '@/lib/barcode';
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

export default function POS() {
  const [obatList, setObatList] = useState<Obat[]>([]);
  const [pasienList, setPasienList] = useState<Pasien[]>([]);
  const [cart, setCart] = useState<TransaksiItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPasien, setSelectedPasien] = useState<string>('none');
  const [diskonPersen, setDiskonPersen] = useState(0);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [paymentData, setPaymentData] = useState({
    metodePembayaran: 'cash' as 'cash' | 'transfer' | 'qris' | 'e-wallet',
    jumlahBayar: 0,
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock'>('name');
  const [lastTransaction, setLastTransaction] = useState<Transaksi | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const currentUser = storageService.getCurrentUser();
  const settings = storageService.getSettings();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const obat = storageService.getObat().filter(o => !o.isArchived && o.stokCurrent > 0);
    setObatList(obat);
    
    const pasien = storageService.getPasien();
    setPasienList(pasien);
  };

  const handleAddToCart = (obat: Obat) => {
    const existingItem = cart.find(item => item.obatId === obat.id);
    
    if (existingItem) {
      if (existingItem.jumlah >= obat.stokCurrent) {
        toast.error('Stok tidak mencukupi!');
        return;
      }
      setCart(cart.map(item =>
        item.obatId === obat.id
          ? { ...item, jumlah: item.jumlah + 1, subtotal: (item.jumlah + 1) * item.hargaSatuan }
          : item
      ));
    } else {
      const newItem: TransaksiItem = {
        obatId: obat.id,
        obatNama: obat.nama,
        jumlah: 1,
        hargaSatuan: obat.hargaJual,
        subtotal: obat.hargaJual,
        barcode: obat.barcode,
      };
      setCart([...cart, newItem]);
    }
    toast.success(`${obat.nama} ditambahkan ke keranjang`);
  };

  const handleUpdateQuantity = (obatId: string, delta: number) => {
    const obat = obatList.find(o => o.id === obatId);
    if (!obat) return;

    setCart(cart.map(item => {
      if (item.obatId === obatId) {
        const newJumlah = item.jumlah + delta;
        if (newJumlah <= 0) return item;
        if (newJumlah > obat.stokCurrent) {
          toast.error('Stok tidak mencukupi!');
          return item;
        }
        return {
          ...item,
          jumlah: newJumlah,
          subtotal: newJumlah * item.hargaSatuan,
        };
      }
      return item;
    }));
  };

  const handleRemoveFromCart = (obatId: string) => {
    setCart(cart.filter(item => item.obatId !== obatId));
  };

  const handleClearCart = () => {
    if (cart.length === 0) return;
    setCart([]);
    setSelectedPasien('none');
    setDiskonPersen(0);
    toast.info('Keranjang dikosongkan');
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const diskon = (subtotal * diskonPersen) / 100;
    const afterDiskon = subtotal - diskon;
    const pajak = (afterDiskon * (settings?.pajakDefault || 0)) / 100;
    const total = afterDiskon + pajak;

    return { subtotal, diskon, pajak, total };
  };

  const handleOpenPayment = () => {
    if (cart.length === 0) {
      toast.error('Keranjang masih kosong!');
      return;
    }

    const { total } = calculateTotals();
    setPaymentData({
      metodePembayaran: 'cash',
      jumlahBayar: total,
    });
    setShowPaymentDialog(true);
  };

  const createTransaction = (): Transaksi | null => {
    const { subtotal, diskon, pajak, total } = calculateTotals();

    if (paymentData.jumlahBayar < total) {
      toast.error('Jumlah pembayaran kurang!');
      return null;
    }

    // Kurangi stok untuk setiap item
    let success = true;
    for (const item of cart) {
      const result = updateStokObat(
        item.obatId,
        item.jumlah,
        'keluar',
        'Penjualan POS',
        currentUser.id,
        currentUser.nama
      );
      if (!result) {
        success = false;
        toast.error(`Stok ${item.obatNama} tidak mencukupi!`);
        break;
      }
    }

    if (!success) return null;

    const pasien = selectedPasien !== 'none' ? pasienList.find(p => p.id === selectedPasien) : null;

    const transaksi: Transaksi = {
      id: generateId('transaksi'),
      nomorTransaksi: generateNomorTransaksi(),
      tanggal: new Date().toISOString(),
      items: cart,
      subtotal,
      diskon,
      diskonPersen,
      pajak,
      pajakPersen: settings?.pajakDefault || 0,
      total,
      metodePembayaran: paymentData.metodePembayaran,
      jumlahBayar: paymentData.jumlahBayar,
      kembalian: paymentData.jumlahBayar - total,
      kasirId: currentUser.id,
      kasirNama: currentUser.nama,
      pasienId: pasien?.id,
      pasienNama: pasien?.nama,
      createdAt: new Date().toISOString(),
    };

    return transaksi;
  };

  const handleSaveOnly = () => {
    const transaksi = createTransaction();
    if (!transaksi) return;

    const allTransaksi = storageService.getTransaksi();
    storageService.saveTransaksi([...allTransaksi, transaksi]);

    logAktivitas(currentUser.id, currentUser.nama, 'TRANSAKSI_POS', `Transaksi: ${transaksi.nomorTransaksi} - ${formatCurrency(transaksi.total)}`);
    
    toast.success('Transaksi berhasil disimpan!');
    
    setLastTransaction(transaksi);
    
    // Reset
    setCart([]);
    setSelectedPasien('none');
    setDiskonPersen(0);
    setShowPaymentDialog(false);
    loadData();
  };

  const handlePrintOnly = () => {
    if (!lastTransaction) {
      toast.error('Tidak ada transaksi untuk dicetak. Simpan transaksi terlebih dahulu.');
      return;
    }

    printReceipt(lastTransaction, settings);
    toast.success('Struk sedang dicetak');
  };

  const handleSaveAndPrint = () => {
    const transaksi = createTransaction();
    if (!transaksi) return;

    const allTransaksi = storageService.getTransaksi();
    storageService.saveTransaksi([...allTransaksi, transaksi]);

    logAktivitas(currentUser.id, currentUser.nama, 'TRANSAKSI_POS', `Transaksi: ${transaksi.nomorTransaksi} - ${formatCurrency(transaksi.total)}`);
    
    toast.success('Transaksi berhasil disimpan!');
    
    // Print receipt
    printReceipt(transaksi, settings);

    // Reset
    setCart([]);
    setSelectedPasien('none');
    setDiskonPersen(0);
    setShowPaymentDialog(false);
    setLastTransaction(null);
    loadData();
  };

  // Keyboard shortcuts
  const shortcuts = [
    {
      key: 'F1',
      description: 'Buka panduan keyboard shortcuts',
      action: () => setShowShortcutsHelp(true),
    },
    {
      key: '?',
      shift: true,
      description: 'Buka panduan keyboard shortcuts',
      action: () => setShowShortcutsHelp(true),
    },
    {
      key: 'f',
      ctrl: true,
      description: 'Focus ke search bar',
      action: () => searchInputRef.current?.focus(),
    },
    {
      key: 'p',
      ctrl: true,
      description: 'Proses pembayaran',
      action: () => handleOpenPayment(),
    },
    {
      key: 'Escape',
      description: 'Clear search / Close dialog',
      action: () => {
        if (showPaymentDialog) {
          setShowPaymentDialog(false);
        } else if (showShortcutsHelp) {
          setShowShortcutsHelp(false);
        } else {
          setSearchTerm('');
        }
      },
    },
    {
      key: 'd',
      ctrl: true,
      description: 'Kosongkan keranjang',
      action: () => handleClearCart(),
    },
  ];

  useKeyboardShortcuts(shortcuts, !showPaymentDialog);

  const shortcutItems = [
    { keys: ['F1', '?'], description: 'Buka panduan keyboard shortcuts', category: 'Umum' },
    { keys: ['Ctrl', 'F'], description: 'Focus ke search bar', category: 'Umum' },
    { keys: ['Esc'], description: 'Clear search / Close dialog', category: 'Umum' },
    { keys: ['↑', '↓'], description: 'Navigasi autocomplete', category: 'Search' },
    { keys: ['Enter'], description: 'Pilih item dari autocomplete', category: 'Search' },
    { keys: ['Ctrl', 'P'], description: 'Proses pembayaran', category: 'Transaksi' },
    { keys: ['Ctrl', 'D'], description: 'Kosongkan keranjang', category: 'Transaksi' },
  ];

  // Enhanced filtering with category and search
  const filteredObat = obatList
    .filter(obat => {
      const matchesSearch = 
        obat.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        obat.barcode.includes(searchTerm) ||
        obat.kategori.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || obat.kategori === selectedCategory;
      
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.nama.localeCompare(b.nama);
        case 'price':
          return a.hargaJual - b.hargaJual;
        case 'stock':
          return a.stokCurrent - b.stokCurrent;
        default:
          return 0;
      }
    });

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(obatList.map(o => o.kategori)))];

  // Count low stock items
  const lowStockCount = obatList.filter(o => isStokLow(o)).length;

  const { subtotal, diskon, pajak, total } = calculateTotals();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Point of Sales (POS)</h1>
          <p className="text-muted-foreground mt-1">Sistem kasir apotek</p>
        </div>
        <div className="flex items-center gap-3">
          {lowStockCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
              <AlertTriangle className="text-amber-600 dark:text-amber-400" size={20} />
              <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                {lowStockCount} obat stok menipis
              </span>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowShortcutsHelp(true)}
          >
            <Keyboard className="mr-2 h-4 w-4" />
            Shortcuts
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Enhanced Search Bar with Autocomplete */}
          <div className="space-y-3">
            <AutocompleteSearch
              obatList={obatList}
              value={searchTerm}
              onChange={setSearchTerm}
              onSelect={handleAddToCart}
              placeholder="Cari obat (nama, barcode, atau kategori)... [Ctrl+F]"
            />

            {/* Filter and Sort Controls */}
            <div className="flex gap-3 flex-wrap">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Semua Kategori" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat === 'all' ? 'Semua Kategori' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Urutkan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Nama (A-Z)</SelectItem>
                  <SelectItem value="price">Harga (Rendah-Tinggi)</SelectItem>
                  <SelectItem value="stock">Stok (Sedikit-Banyak)</SelectItem>
                </SelectContent>
              </Select>

              {(searchTerm || selectedCategory !== 'all') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                  }}
                >
                  Reset Filter
                </Button>
              )}
            </div>

            {/* Results count */}
            <div className="text-sm text-muted-foreground">
              Menampilkan {filteredObat.length} dari {obatList.length} obat
            </div>
          </div>

          {/* Product Grid with Low Stock Indicators */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto">
            {filteredObat.map(obat => {
              const isLowStock = isStokLow(obat);
              const stockPercentage = (obat.stokCurrent / obat.stokMinimum) * 100;
              
              return (
                <Card
                  key={obat.id}
                  className={`cursor-pointer hover:shadow-md transition-all relative ${
                    isLowStock ? 'border-amber-300 dark:border-amber-700 bg-amber-50/30 dark:bg-amber-950/30' : ''
                  }`}
                  onClick={() => handleAddToCart(obat)}
                >
                  {isLowStock && (
                    <div className="absolute top-2 right-2 z-10">
                      <Badge variant="destructive" className="flex items-center gap-1 text-xs">
                        <AlertTriangle size={12} />
                        Stok Rendah
                      </Badge>
                    </div>
                  )}
                  
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-sm mb-2 pr-20">{obat.nama}</h3>
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Package size={14} className={isLowStock ? 'text-amber-600 dark:text-amber-400' : ''} />
                        <span className={isLowStock ? 'text-amber-700 dark:text-amber-300 font-medium' : ''}>
                          Stok: {obat.stokCurrent} {obat.satuan}
                        </span>
                      </div>
                      
                      {/* Stock level indicator */}
                      {isLowStock && (
                        <div className="w-full bg-muted rounded-full h-1.5">
                          <div 
                            className={`h-1.5 rounded-full ${
                              stockPercentage <= 50 ? 'bg-red-500' : 
                              stockPercentage <= 100 ? 'bg-amber-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                          />
                        </div>
                      )}
                      
                      <p className="font-bold text-lg text-primary">{formatCurrency(obat.hargaJual)}</p>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">{obat.bentuk}</Badge>
                      <Badge variant="secondary" className="text-xs">{obat.kategori}</Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            {filteredObat.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                <Package size={48} className="mx-auto mb-3 opacity-50" />
                <p>Tidak ada obat yang ditemukan</p>
                <p className="text-sm mt-1">Coba ubah filter atau kata kunci pencarian</p>
              </div>
            )}
          </div>
        </div>

        {/* Cart */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart size={20} />
                  Keranjang ({cart.length})
                </div>
                {cart.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearCart}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 size={16} />
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Pasien (Opsional)</Label>
                <Select value={selectedPasien} onValueChange={setSelectedPasien}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih pasien..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Tanpa Pasien</SelectItem>
                    {pasienList.map(pasien => (
                      <SelectItem key={pasien.id} value={pasien.id}>
                        {pasien.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="max-h-[300px] overflow-y-auto space-y-2">
                {cart.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Keranjang kosong</p>
                ) : (
                  cart.map(item => (
                    <div key={item.obatId} className="p-3 bg-muted/50 rounded space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.obatNama}</p>
                          <p className="text-xs text-muted-foreground">{formatCurrency(item.hargaSatuan)}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveFromCart(item.obatId)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateQuantity(item.obatId, -1)}
                          >
                            <Minus size={14} />
                          </Button>
                          <span className="w-8 text-center font-medium">{item.jumlah}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateQuantity(item.obatId, 1)}
                          >
                            <Plus size={14} />
                          </Button>
                        </div>
                        <span className="font-bold">{formatCurrency(item.subtotal)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-2 pt-4 border-t">
                <div>
                  <Label>Diskon (%)</Label>
                  <Input
                    type="number"
                    value={diskonPersen}
                    onChange={(e) => setDiskonPersen(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-medium">{formatCurrency(subtotal)}</span>
                  </div>
                  {diskon > 0 && (
                    <div className="flex justify-between text-red-600 dark:text-red-400">
                      <span>Diskon ({diskonPersen}%):</span>
                      <span>-{formatCurrency(diskon)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Pajak ({settings?.pajakDefault || 0}%):</span>
                    <span className="font-medium">{formatCurrency(pajak)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>TOTAL:</span>
                    <span className="text-primary">{formatCurrency(total)}</span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleOpenPayment}
                  disabled={cart.length === 0}
                >
                  Proses Pembayaran [Ctrl+P]
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Print Last Transaction Button */}
          {lastTransaction && (
            <Card className="border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-950/30">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground mb-2">Transaksi terakhir tersimpan</p>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={handlePrintOnly}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Cetak Struk Terakhir
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pembayaran</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-muted rounded">
              <div className="flex justify-between text-lg font-bold">
                <span>Total Pembayaran:</span>
                <span className="text-primary">{formatCurrency(total)}</span>
              </div>
            </div>

            <div>
              <Label>Metode Pembayaran</Label>
              <Select
                value={paymentData.metodePembayaran}
                onValueChange={(value: Transaksi["metodePembayaran"]) => setPaymentData({ ...paymentData, metodePembayaran: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="transfer">Transfer Bank</SelectItem>
                  <SelectItem value="qris">QRIS</SelectItem>
                  <SelectItem value="e-wallet">E-Wallet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Jumlah Bayar</Label>
              <Input
                type="number"
                value={paymentData.jumlahBayar}
                onChange={(e) => setPaymentData({ ...paymentData, jumlahBayar: parseInt(e.target.value) || 0 })}
              />
            </div>

            {paymentData.jumlahBayar >= total && (
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded">
                <div className="flex justify-between">
                  <span className="font-medium">Kembalian:</span>
                  <span className="font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(paymentData.jumlahBayar - total)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)} className="w-full sm:w-auto">
              Batal
            </Button>
            <Button onClick={handleSaveOnly} variant="secondary" className="w-full sm:w-auto">
              <Save className="mr-2 h-4 w-4" />
              Simpan Saja
            </Button>
            <Button onClick={handleSaveAndPrint} className="w-full sm:w-auto">
              <Printer className="mr-2 h-4 w-4" />
              Simpan & Cetak
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <KeyboardShortcutsHelp
        open={showShortcutsHelp}
        onOpenChange={setShowShortcutsHelp}
        shortcuts={shortcutItems}
      />
    </div>
  );
}