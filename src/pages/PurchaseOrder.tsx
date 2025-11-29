import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { storageService } from '@/lib/storage';
import { PurchaseOrder, POItem, Supplier, Obat } from '@/types';
import { Plus, Search, Eye, Check, X, Package, AlertCircle, TrendingDown } from 'lucide-react';
import { formatCurrency, formatDate, generateId, logAktivitas } from '@/lib/utils-pharmacy';
import { generatePONumber, getLowStockMedications, getFrequentlyPurchasedFromSupplier, updateStockFromPO } from '@/lib/po-utils';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

export default function PurchaseOrder() {
  const [poList, setPOList] = useState<PurchaseOrder[]>([]);
  const [filteredPO, setFilteredPO] = useState<PurchaseOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [obatList, setObatList] = useState<Obat[]>([]);
  const [lowStockMeds, setLowStockMeds] = useState<Obat[]>([]);
  const [suggestedMeds, setSuggestedMeds] = useState<{ obatId: string; obatNama: string; frequency: number; lastPrice: number }[]>([]);
  
  const [formData, setFormData] = useState<{
    supplierId: string;
    tanggalKirimDiharapkan: string;
    items: POItem[];
    catatan: string;
  }>({
    supplierId: '',
    tanggalKirimDiharapkan: '',
    items: [],
    catatan: ''
  });

  const [newItem, setNewItem] = useState<{
    obatId: string;
    jumlah: number;
  }>({
    obatId: '',
    jumlah: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterPO();
  }, [searchTerm, poList]);

  useEffect(() => {
    if (formData.supplierId) {
      const suggested = getFrequentlyPurchasedFromSupplier(formData.supplierId, 10);
      setSuggestedMeds(suggested);
    } else {
      setSuggestedMeds([]);
    }
  }, [formData.supplierId]);

  const loadData = () => {
    const pos = storageService.getPurchaseOrders();
    setPOList(pos);
    
    const supplierData = storageService.getSupplier().filter(s => s.isActive);
    setSuppliers(supplierData);
    
    const medications = storageService.getObat().filter(o => !o.isArchived);
    setObatList(medications);
    
    const lowStock = getLowStockMedications();
    setLowStockMeds(lowStock);
  };

  const filterPO = () => {
    const filtered = poList.filter(po =>
      po.nomorPO.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.supplierNama.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPO(filtered);
  };

  const handleOpenDialog = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 7);
    
    setFormData({
      supplierId: '',
      tanggalKirimDiharapkan: tomorrow.toISOString().split('T')[0],
      items: [],
      catatan: ''
    });
    setNewItem({ obatId: '', jumlah: 0 });
    setShowDialog(true);
  };

  const handleAddItem = () => {
    if (!newItem.obatId || newItem.jumlah <= 0) {
      toast.error('Pilih obat dan masukkan jumlah yang valid!');
      return;
    }

    const selectedObat = obatList.find(o => o.id === newItem.obatId);
    if (!selectedObat) return;

    const existingIndex = formData.items.findIndex(item => item.obatId === newItem.obatId);
    
    if (existingIndex >= 0) {
      const updatedItems = [...formData.items];
      updatedItems[existingIndex] = {
        ...updatedItems[existingIndex],
        jumlahDipesan: updatedItems[existingIndex].jumlahDipesan + newItem.jumlah,
        subtotal: (updatedItems[existingIndex].jumlahDipesan + newItem.jumlah) * updatedItems[existingIndex].hargaBeli
      };
      setFormData({ ...formData, items: updatedItems });
    } else {
      const newPOItem: POItem = {
        obatId: selectedObat.id,
        obatNama: selectedObat.nama,
        jumlahDipesan: newItem.jumlah,
        jumlahDiterima: 0,
        hargaBeli: selectedObat.hargaBeli,
        subtotal: newItem.jumlah * selectedObat.hargaBeli
      };
      setFormData({ ...formData, items: [...formData.items, newPOItem] });
    }

    setNewItem({ obatId: '', jumlah: 0 });
    toast.success('Item ditambahkan!');
  };

  const handleQuickAddLowStock = (medication: Obat) => {
    const suggestedQty = Math.max(medication.stokMinimum * 2, medication.stokMinimum - medication.stokCurrent + medication.stokMinimum);
    setNewItem({ obatId: medication.id, jumlah: suggestedQty });
  };

  const handleQuickAddSuggested = (med: { obatId: string; obatNama: string; lastPrice: number }) => {
    const foundObat = obatList.find(o => o.id === med.obatId);
    if (foundObat) {
      setNewItem({ obatId: foundObat.id, jumlah: foundObat.stokMinimum * 2 });
    }
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: updatedItems });
  };

  const calculateTotal = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.subtotal, 0);
    const pajak = subtotal * 0.1;
    const total = subtotal + pajak;
    return { subtotal, pajak, total };
  };

  const handleSave = () => {
    if (!formData.supplierId || formData.items.length === 0) {
      toast.error('Pilih supplier dan tambahkan minimal 1 item!');
      return;
    }

    const currentUser = storageService.getCurrentUser();
    const supplier = suppliers.find(s => s.id === formData.supplierId);
    if (!supplier) return;

    const totals = calculateTotal();

    const newPO: PurchaseOrder = {
      id: generateId('po'),
      nomorPO: generatePONumber(),
      supplierId: formData.supplierId,
      supplierNama: supplier.nama,
      tanggalPO: new Date().toISOString(),
      tanggalKirimDiharapkan: formData.tanggalKirimDiharapkan,
      items: formData.items,
      subtotal: totals.subtotal,
      pajak: totals.pajak,
      total: totals.total,
      status: 'pending',
      catatan: formData.catatan,
      createdBy: currentUser.nama,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const allPO = storageService.getPurchaseOrders();
    storageService.savePurchaseOrders([...allPO, newPO]);

    logAktivitas(currentUser.id, currentUser.nama, 'CREATE_PO', `Membuat PO: ${newPO.nomorPO} untuk ${supplier.nama}`);
    toast.success('Purchase Order berhasil dibuat!');
    
    setShowDialog(false);
    loadData();
  };

  const handleApprove = (po: PurchaseOrder) => {
    const currentUser = storageService.getCurrentUser();
    const allPO = storageService.getPurchaseOrders();
    const updatedPOs = allPO.map(p =>
      p.id === po.id
        ? { ...p, status: 'approved' as const, approvedBy: currentUser.nama, updatedAt: new Date().toISOString() }
        : p
    );
    storageService.savePurchaseOrders(updatedPOs);
    
    logAktivitas(currentUser.id, currentUser.nama, 'APPROVE_PO', `Menyetujui PO: ${po.nomorPO}`);
    toast.success('Purchase Order disetujui!');
    loadData();
  };

  const handleReceive = (po: PurchaseOrder) => {
    const currentUser = storageService.getCurrentUser();
    const allPO = storageService.getPurchaseOrders();
    
    const updatedItems = po.items.map(item => ({
      ...item,
      jumlahDiterima: item.jumlahDipesan
    }));
    
    const updatedPOs = allPO.map(p =>
      p.id === po.id
        ? {
            ...p,
            status: 'received' as const,
            items: updatedItems,
            tanggalKirimAktual: new Date().toISOString(),
            receivedBy: currentUser.nama,
            updatedAt: new Date().toISOString()
          }
        : p
    );
    storageService.savePurchaseOrders(updatedPOs);
    
    const updatedPO = updatedPOs.find(p => p.id === po.id);
    if (updatedPO) {
      updateStockFromPO(updatedPO);
    }
    
    logAktivitas(currentUser.id, currentUser.nama, 'RECEIVE_PO', `Menerima barang PO: ${po.nomorPO}`);
    toast.success('Barang diterima dan stok diperbarui!');
    loadData();
  };

  const handleCancel = (po: PurchaseOrder) => {
    if (!confirm(`Yakin ingin membatalkan PO ${po.nomorPO}?`)) return;
    
    const currentUser = storageService.getCurrentUser();
    const allPO = storageService.getPurchaseOrders();
    const updatedPOs = allPO.map(p =>
      p.id === po.id
        ? { ...p, status: 'cancelled' as const, updatedAt: new Date().toISOString() }
        : p
    );
    storageService.savePurchaseOrders(updatedPOs);
    
    logAktivitas(currentUser.id, currentUser.nama, 'CANCEL_PO', `Membatalkan PO: ${po.nomorPO}`);
    toast.success('Purchase Order dibatalkan!');
    loadData();
  };

  const handleViewDetail = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setShowDetailDialog(true);
  };

  const getStatusBadge = (status: PurchaseOrder['status']) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      received: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return (
      <Badge className={colors[status]}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const renderPOTable = (pos: PurchaseOrder[], showStatus = true) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>No. PO</TableHead>
          <TableHead>Tanggal</TableHead>
          <TableHead>Supplier</TableHead>
          <TableHead>Items</TableHead>
          <TableHead className="text-right">Total</TableHead>
          {showStatus && <TableHead>Status</TableHead>}
          <TableHead>Aksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pos.length === 0 ? (
          <TableRow>
            <TableCell colSpan={showStatus ? 7 : 6} className="text-center text-gray-500">
              Belum ada purchase order
            </TableCell>
          </TableRow>
        ) : (
          pos.map((po) => (
            <TableRow key={po.id}>
              <TableCell className="font-mono text-sm">{po.nomorPO}</TableCell>
              <TableCell>{formatDate(po.tanggalPO)}</TableCell>
              <TableCell>{po.supplierNama}</TableCell>
              <TableCell>{po.items.length} items</TableCell>
              <TableCell className="text-right font-medium">{formatCurrency(po.total)}</TableCell>
              {showStatus && <TableCell>{getStatusBadge(po.status)}</TableCell>}
              <TableCell>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleViewDetail(po)}>
                    <Eye size={14} />
                  </Button>
                  {po.status === 'pending' && (
                    <>
                      <Button size="sm" variant="default" onClick={() => handleApprove(po)}>
                        <Check size={14} />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleCancel(po)}>
                        <X size={14} />
                      </Button>
                    </>
                  )}
                  {po.status === 'approved' && (
                    <Button size="sm" variant="default" onClick={() => handleReceive(po)}>
                      <Package size={14} className="mr-1" />
                      Terima
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Purchase Order Management</h1>
          <p className="text-gray-500 mt-1">Kelola purchase order dan pembelian dari supplier</p>
        </div>
        <Button onClick={handleOpenDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Buat Purchase Order
        </Button>
      </div>

      {lowStockMeds.length > 0 && (
        <Card className="border-yellow-300 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertCircle size={20} />
              Peringatan Stok Rendah
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-yellow-700 mb-2">
              Terdapat {lowStockMeds.length} obat dengan stok di bawah minimum. Segera buat purchase order!
            </p>
            <div className="flex flex-wrap gap-2">
              {lowStockMeds.slice(0, 5).map(medication => (
                <Badge key={medication.id} variant="outline" className="text-yellow-800 border-yellow-400">
                  {medication.nama} ({medication.stokCurrent}/{medication.stokMinimum})
                </Badge>
              ))}
              {lowStockMeds.length > 5 && (
                <Badge variant="outline" className="text-yellow-800 border-yellow-400">
                  +{lowStockMeds.length - 5} lainnya
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Cari PO (nomor, supplier)..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">Semua ({poList.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({poList.filter(p => p.status === 'pending').length})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({poList.filter(p => p.status === 'approved').length})</TabsTrigger>
          <TabsTrigger value="received">Received ({poList.filter(p => p.status === 'received').length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              {renderPOTable(filteredPO, true)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              {renderPOTable(filteredPO.filter(p => p.status === 'pending'), false)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              {renderPOTable(filteredPO.filter(p => p.status === 'approved'), false)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="received" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              {renderPOTable(filteredPO.filter(p => p.status === 'received'), false)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create PO Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Buat Purchase Order Baru</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Supplier *</Label>
                <Select value={formData.supplierId} onValueChange={(value) => setFormData({ ...formData, supplierId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map(supplier => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Tanggal Kirim Diharapkan *</Label>
                <Input
                  type="date"
                  value={formData.tanggalKirimDiharapkan}
                  onChange={(e) => setFormData({ ...formData, tanggalKirimDiharapkan: e.target.value })}
                />
              </div>
            </div>

            {formData.supplierId && (
              <div className="grid grid-cols-2 gap-4">
                {lowStockMeds.length > 0 && (
                  <Card className="border-yellow-300">
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <TrendingDown size={16} className="text-yellow-600" />
                        Stok Rendah
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {lowStockMeds.slice(0, 5).map(medication => (
                          <div key={medication.id} className="flex justify-between items-center text-xs">
                            <span className="flex-1">{medication.nama}</span>
                            <Badge variant="outline" className="text-yellow-700 mr-2">
                              {medication.stokCurrent}/{medication.stokMinimum}
                            </Badge>
                            <Button size="sm" variant="ghost" onClick={() => handleQuickAddLowStock(medication)}>
                              <Plus size={12} />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {suggestedMeds.length > 0 && (
                  <Card className="border-blue-300">
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Package size={16} className="text-blue-600" />
                        Sering Dibeli
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {suggestedMeds.slice(0, 5).map(med => (
                          <div key={med.obatId} className="flex justify-between items-center text-xs">
                            <span className="flex-1">{med.obatNama}</span>
                            <Badge variant="outline" className="text-blue-700 mr-2">
                              {med.frequency}x
                            </Badge>
                            <Button size="sm" variant="ghost" onClick={() => handleQuickAddSuggested(med)}>
                              <Plus size={12} />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="font-semibold">Tambah Item</h3>
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-7">
                  <Select value={newItem.obatId} onValueChange={(value) => setNewItem({ ...newItem, obatId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih obat" />
                    </SelectTrigger>
                    <SelectContent>
                      {obatList.map(medication => (
                        <SelectItem key={medication.id} value={medication.id}>
                          {medication.nama} - {formatCurrency(medication.hargaBeli)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-3">
                  <Input
                    type="number"
                    placeholder="Jumlah"
                    value={newItem.jumlah || ''}
                    onChange={(e) => setNewItem({ ...newItem, jumlah: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="col-span-2">
                  <Button onClick={handleAddItem} className="w-full">
                    <Plus size={16} />
                  </Button>
                </div>
              </div>
            </div>

            {formData.items.length > 0 && (
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-4">Items ({formData.items.length})</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Obat</TableHead>
                      <TableHead className="text-right">Jumlah</TableHead>
                      <TableHead className="text-right">Harga</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formData.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.obatNama}</TableCell>
                        <TableCell className="text-right">{item.jumlahDipesan}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.hargaBeli)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.subtotal)}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost" onClick={() => handleRemoveItem(index)}>
                            <X size={14} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-4 space-y-2 text-right">
                  <div className="flex justify-end gap-4">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">{formatCurrency(calculateTotal().subtotal)}</span>
                  </div>
                  <div className="flex justify-end gap-4">
                    <span className="text-gray-600">Pajak (10%):</span>
                    <span className="font-medium">{formatCurrency(calculateTotal().pajak)}</span>
                  </div>
                  <div className="flex justify-end gap-4 text-lg font-bold">
                    <span>Total:</span>
                    <span>{formatCurrency(calculateTotal().total)}</span>
                  </div>
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
              Buat Purchase Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detail Purchase Order</DialogTitle>
          </DialogHeader>

          {selectedPO && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">No. PO</Label>
                  <p className="font-mono font-medium">{selectedPO.nomorPO}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedPO.status)}</div>
                </div>
                <div>
                  <Label className="text-gray-600">Supplier</Label>
                  <p className="font-medium">{selectedPO.supplierNama}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Tanggal PO</Label>
                  <p className="font-medium">{formatDate(selectedPO.tanggalPO)}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Expected Delivery</Label>
                  <p className="font-medium">{formatDate(selectedPO.tanggalKirimDiharapkan)}</p>
                </div>
                {selectedPO.tanggalKirimAktual && (
                  <div>
                    <Label className="text-gray-600">Actual Delivery</Label>
                    <p className="font-medium">{formatDate(selectedPO.tanggalKirimAktual)}</p>
                  </div>
                )}
                <div>
                  <Label className="text-gray-600">Created By</Label>
                  <p className="font-medium">{selectedPO.createdBy}</p>
                </div>
                {selectedPO.approvedBy && (
                  <div>
                    <Label className="text-gray-600">Approved By</Label>
                    <p className="font-medium">{selectedPO.approvedBy}</p>
                  </div>
                )}
              </div>

              <div>
                <Label className="text-gray-600 mb-2 block">Items</Label>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Obat</TableHead>
                      <TableHead className="text-right">Dipesan</TableHead>
                      <TableHead className="text-right">Diterima</TableHead>
                      <TableHead className="text-right">Harga</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedPO.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.obatNama}</TableCell>
                        <TableCell className="text-right">{item.jumlahDipesan}</TableCell>
                        <TableCell className="text-right">{item.jumlahDiterima}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.hargaBeli)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.subtotal)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="space-y-2 text-right border-t pt-4">
                <div className="flex justify-end gap-4">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(selectedPO.subtotal)}</span>
                </div>
                <div className="flex justify-end gap-4">
                  <span className="text-gray-600">Pajak:</span>
                  <span className="font-medium">{formatCurrency(selectedPO.pajak)}</span>
                </div>
                <div className="flex justify-end gap-4 text-lg font-bold">
                  <span>Total:</span>
                  <span>{formatCurrency(selectedPO.total)}</span>
                </div>
              </div>

              {selectedPO.catatan && (
                <div>
                  <Label className="text-gray-600">Catatan</Label>
                  <p className="mt-1">{selectedPO.catatan}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}