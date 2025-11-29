import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { storageService } from '@/lib/storage';
import { ReorderSuggestion, PurchaseOrder, POItem } from '@/types';
import { AlertTriangle, TrendingDown, Package, CheckCircle, X, ShoppingCart } from 'lucide-react';
import { formatCurrency, formatDate, generateId, logAktivitas } from '@/lib/utils-pharmacy';
import { generateReorderSuggestions, generatePONumber } from '@/lib/po-utils';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function ReorderSuggestions() {
  const [suggestions, setSuggestions] = useState<ReorderSuggestion[]>([]);
  const [showCreatePODialog, setShowCreatePODialog] = useState(false);
  const [selectedSuggestions, setSelectedSuggestions] = useState<ReorderSuggestion[]>([]);
  const [deliveryDate, setDeliveryDate] = useState('');

  useEffect(() => {
    loadSuggestions();
    
    // Set default delivery date (7 days from now)
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 7);
    setDeliveryDate(defaultDate.toISOString().split('T')[0]);
  }, []);

  const loadSuggestions = () => {
    const generated = generateReorderSuggestions();
    const stored = storageService.getReorderSuggestions();
    
    // Merge generated with stored, prioritizing stored status
    const merged = generated.map(gen => {
      const existing = stored.find(s => s.obatId === gen.obatId);
      return existing || gen;
    });
    
    setSuggestions(merged.filter(s => s.status === 'pending'));
    storageService.saveReorderSuggestions(merged);
  };

  const getPriorityBadge = (priority: ReorderSuggestion['priority']) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-blue-100 text-blue-800'
    };
    const icons = {
      high: <AlertTriangle size={12} className="mr-1" />,
      medium: <TrendingDown size={12} className="mr-1" />,
      low: <Package size={12} className="mr-1" />
    };
    return (
      <Badge className={colors[priority]}>
        {icons[priority]}
        {priority.toUpperCase()}
      </Badge>
    );
  };

  const handleDismiss = (suggestion: ReorderSuggestion) => {
    const allSuggestions = storageService.getReorderSuggestions();
    const updated = allSuggestions.map(s =>
      s.id === suggestion.id ? { ...s, status: 'dismissed' as const } : s
    );
    storageService.saveReorderSuggestions(updated);
    
    const currentUser = storageService.getCurrentUser();
    logAktivitas(currentUser.id, currentUser.nama, 'DISMISS_REORDER', `Mengabaikan saran reorder: ${suggestion.obatNama}`);
    toast.success('Saran reorder diabaikan');
    loadSuggestions();
  };

  const handleSelectForPO = (suggestion: ReorderSuggestion) => {
    setSelectedSuggestions([suggestion]);
    setShowCreatePODialog(true);
  };

  const handleCreatePOFromSelected = () => {
    if (selectedSuggestions.length === 0) {
      toast.error('Pilih minimal 1 item!');
      return;
    }

    // Group by supplier
    const groupedBySupplier: Record<string, ReorderSuggestion[]> = {};
    selectedSuggestions.forEach(sugg => {
      const supplierId = sugg.recommendedSupplier.supplierId;
      if (!groupedBySupplier[supplierId]) {
        groupedBySupplier[supplierId] = [];
      }
      groupedBySupplier[supplierId].push(sugg);
    });

    const currentUser = storageService.getCurrentUser();
    const allPO = storageService.getPurchaseOrders();
    const newPOs: PurchaseOrder[] = [];

    // Create PO for each supplier
    Object.entries(groupedBySupplier).forEach(([supplierId, suggestionsForSupplier]) => {
      const items: POItem[] = suggestionsForSupplier.map(sugg => ({
        obatId: sugg.obatId,
        obatNama: sugg.obatNama,
        jumlahDipesan: sugg.suggestedQuantity,
        jumlahDiterima: 0,
        hargaBeli: sugg.recommendedSupplier.lastPrice,
        subtotal: sugg.suggestedQuantity * sugg.recommendedSupplier.lastPrice
      }));

      const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
      const pajak = subtotal * 0.1;
      const total = subtotal + pajak;

      const newPO: PurchaseOrder = {
        id: generateId('po'),
        nomorPO: generatePONumber(),
        supplierId: supplierId,
        supplierNama: suggestionsForSupplier[0].recommendedSupplier.supplierNama,
        tanggalPO: new Date().toISOString(),
        tanggalKirimDiharapkan: deliveryDate,
        items,
        subtotal,
        pajak,
        total,
        status: 'pending',
        catatan: 'Auto-generated from reorder suggestions',
        createdBy: currentUser.nama,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      newPOs.push(newPO);
    });

    // Save all new POs
    storageService.savePurchaseOrders([...allPO, ...newPOs]);

    // Update suggestion status
    const allSuggestions = storageService.getReorderSuggestions();
    const updated = allSuggestions.map(s => {
      const isOrdered = selectedSuggestions.some(sel => sel.id === s.id);
      return isOrdered ? { ...s, status: 'ordered' as const } : s;
    });
    storageService.saveReorderSuggestions(updated);

    logAktivitas(currentUser.id, currentUser.nama, 'CREATE_PO_FROM_REORDER', `Membuat ${newPOs.length} PO dari saran reorder`);
    toast.success(`${newPOs.length} Purchase Order berhasil dibuat!`);
    
    setShowCreatePODialog(false);
    setSelectedSuggestions([]);
    loadSuggestions();
  };

  const handleBulkCreatePO = () => {
    const highPriority = suggestions.filter(s => s.priority === 'high');
    if (highPriority.length === 0) {
      toast.error('Tidak ada item prioritas tinggi untuk diproses!');
      return;
    }
    
    setSelectedSuggestions(highPriority);
    setShowCreatePODialog(true);
  };

  const calculateTotalForSelected = () => {
    return selectedSuggestions.reduce((sum, sugg) => 
      sum + (sugg.suggestedQuantity * sugg.recommendedSupplier.lastPrice), 0
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Smart Reorder Suggestions</h1>
          <p className="text-gray-500 mt-1">Saran otomatis untuk pemesanan ulang obat</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadSuggestions}>
            <Package className="mr-2 h-4 w-4" />
            Refresh Suggestions
          </Button>
          {suggestions.filter(s => s.priority === 'high').length > 0 && (
            <Button onClick={handleBulkCreatePO}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Buat PO untuk Prioritas Tinggi
            </Button>
          )}
        </div>
      </div>

      {suggestions.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Semua Stok Aman!</h3>
              <p className="mt-1 text-sm text-gray-500">
                Tidak ada obat yang memerlukan pemesanan ulang saat ini
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-red-300">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle size={16} className="text-red-600" />
                  High Priority
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  {suggestions.filter(s => s.priority === 'high').length}
                </div>
                <p className="text-xs text-gray-600 mt-1">Stok kritis, segera pesan!</p>
              </CardContent>
            </Card>

            <Card className="border-yellow-300">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingDown size={16} className="text-yellow-600" />
                  Medium Priority
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600">
                  {suggestions.filter(s => s.priority === 'medium').length}
                </div>
                <p className="text-xs text-gray-600 mt-1">Perlu perhatian</p>
              </CardContent>
            </Card>

            <Card className="border-blue-300">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Package size={16} className="text-blue-600" />
                  Low Priority
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {suggestions.filter(s => s.priority === 'low').length}
                </div>
                <p className="text-xs text-gray-600 mt-1">Dapat ditunda</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Reorder Suggestions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Priority</TableHead>
                    <TableHead>Obat</TableHead>
                    <TableHead className="text-center">Stok Saat Ini</TableHead>
                    <TableHead className="text-center">Stok Minimum</TableHead>
                    <TableHead className="text-center">Saran Qty</TableHead>
                    <TableHead>Supplier Rekomendasi</TableHead>
                    <TableHead className="text-right">Est. Harga</TableHead>
                    <TableHead className="text-center">Delivery</TableHead>
                    <TableHead className="text-center">Quality</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suggestions.map((suggestion) => (
                    <TableRow key={suggestion.id}>
                      <TableCell>{getPriorityBadge(suggestion.priority)}</TableCell>
                      <TableCell className="font-medium">{suggestion.obatNama}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-red-600">
                          {suggestion.stokCurrent}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">{suggestion.stokMinimum}</TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-green-100 text-green-800">
                          {suggestion.suggestedQuantity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{suggestion.recommendedSupplier.supplierNama}</p>
                          <p className="text-xs text-gray-500">
                            Last price: {formatCurrency(suggestion.recommendedSupplier.lastPrice)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(suggestion.suggestedQuantity * suggestion.recommendedSupplier.lastPrice)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">
                          {suggestion.recommendedSupplier.averageDeliveryTime}d
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span className="font-medium">{suggestion.recommendedSupplier.qualityScore.toFixed(1)}</span>
                          <span className="text-yellow-500">★</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleSelectForPO(suggestion)}>
                            <ShoppingCart size={14} className="mr-1" />
                            Order
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDismiss(suggestion)}>
                            <X size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {/* Create PO Dialog */}
      <Dialog open={showCreatePODialog} onOpenChange={setShowCreatePODialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Buat Purchase Order dari Reorder Suggestions</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Tanggal Kirim Diharapkan</Label>
              <Input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
              />
            </div>

            <div>
              <Label className="mb-2 block">Items yang Akan Dipesan</Label>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Obat</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                    <TableHead className="text-right">Harga</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedSuggestions.map((sugg) => (
                    <TableRow key={sugg.id}>
                      <TableCell>{sugg.obatNama}</TableCell>
                      <TableCell>{sugg.recommendedSupplier.supplierNama}</TableCell>
                      <TableCell className="text-right">{sugg.suggestedQuantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(sugg.recommendedSupplier.lastPrice)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(sugg.suggestedQuantity * sugg.recommendedSupplier.lastPrice)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="border-t pt-4 space-y-2 text-right">
              <div className="flex justify-end gap-4">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">{formatCurrency(calculateTotalForSelected())}</span>
              </div>
              <div className="flex justify-end gap-4">
                <span className="text-gray-600">Pajak (10%):</span>
                <span className="font-medium">{formatCurrency(calculateTotalForSelected() * 0.1)}</span>
              </div>
              <div className="flex justify-end gap-4 text-lg font-bold">
                <span>Total:</span>
                <span>{formatCurrency(calculateTotalForSelected() * 1.1)}</span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Catatan:</strong> Sistem akan membuat {Object.keys(
                  selectedSuggestions.reduce((acc, sugg) => {
                    acc[sugg.recommendedSupplier.supplierId] = true;
                    return acc;
                  }, {} as Record<string, boolean>)
                ).length} Purchase Order terpisah berdasarkan supplier yang berbeda.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreatePODialog(false)}>
              Batal
            </Button>
            <Button onClick={handleCreatePOFromSelected}>
              Buat Purchase Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}