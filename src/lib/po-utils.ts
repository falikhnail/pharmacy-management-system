import { PurchaseOrder, POItem, Obat, Supplier, SupplierPerformance, ReorderSuggestion } from '@/types';
import { storageService } from './storage';
import { generateId } from './utils-pharmacy';

/**
 * Generate Purchase Order number
 */
export function generatePONumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `PO${year}${month}${random}`;
}

/**
 * Get medications with low stock
 */
export function getLowStockMedications(): Obat[] {
  const obatList = storageService.getObat();
  return obatList.filter(obat => 
    !obat.isArchived && 
    obat.stokCurrent <= obat.stokMinimum
  ).sort((a, b) => {
    const ratioA = a.stokCurrent / a.stokMinimum;
    const ratioB = b.stokCurrent / b.stokMinimum;
    return ratioA - ratioB;
  });
}

/**
 * Get frequently purchased medications from a supplier
 */
export function getFrequentlyPurchasedFromSupplier(supplierId: string, limit: number = 10): { obatId: string; obatNama: string; frequency: number; lastPrice: number }[] {
  const pembelianList = storageService.getPembelian();
  const purchaseOrders = storageService.getPurchaseOrders();
  
  const medicationFrequency: Record<string, { count: number; totalQuantity: number; lastPrice: number; obatNama: string }> = {};
  
  // Count from pembelian
  pembelianList
    .filter(p => p.supplierId === supplierId)
    .forEach(pembelian => {
      pembelian.items.forEach(item => {
        if (!medicationFrequency[item.obatId]) {
          medicationFrequency[item.obatId] = {
            count: 0,
            totalQuantity: 0,
            lastPrice: item.hargaBeli,
            obatNama: item.obatNama
          };
        }
        medicationFrequency[item.obatId].count++;
        medicationFrequency[item.obatId].totalQuantity += item.jumlah;
        medicationFrequency[item.obatId].lastPrice = item.hargaBeli;
      });
    });
  
  // Count from purchase orders
  purchaseOrders
    .filter(po => po.supplierId === supplierId && po.status === 'received')
    .forEach(po => {
      po.items.forEach(item => {
        if (!medicationFrequency[item.obatId]) {
          medicationFrequency[item.obatId] = {
            count: 0,
            totalQuantity: 0,
            lastPrice: item.hargaBeli,
            obatNama: item.obatNama
          };
        }
        medicationFrequency[item.obatId].count++;
        medicationFrequency[item.obatId].totalQuantity += item.jumlahDiterima;
        medicationFrequency[item.obatId].lastPrice = item.hargaBeli;
      });
    });
  
  return Object.entries(medicationFrequency)
    .map(([obatId, data]) => ({
      obatId,
      obatNama: data.obatNama,
      frequency: data.count,
      lastPrice: data.lastPrice
    }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, limit);
}

/**
 * Calculate supplier performance metrics
 */
export function calculateSupplierPerformance(supplierId: string): SupplierPerformance | null {
  const supplier = storageService.getSupplier().find(s => s.id === supplierId);
  if (!supplier) return null;
  
  const purchaseOrders = storageService.getPurchaseOrders().filter(po => po.supplierId === supplierId);
  
  if (purchaseOrders.length === 0) {
    return {
      supplierId,
      supplierNama: supplier.nama,
      totalOrders: 0,
      completedOrders: 0,
      averageDeliveryTime: 0,
      orderFulfillmentRate: 0,
      qualityScore: 0,
      totalValue: 0,
      lastOrderDate: ''
    };
  }
  
  const completedOrders = purchaseOrders.filter(po => po.status === 'received');
  const totalOrders = purchaseOrders.length;
  
  // Calculate average delivery time
  let totalDeliveryTime = 0;
  let deliveryCount = 0;
  
  completedOrders.forEach(po => {
    if (po.tanggalKirimAktual) {
      const expected = new Date(po.tanggalKirimDiharapkan);
      const actual = new Date(po.tanggalKirimAktual);
      const diffTime = actual.getTime() - expected.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      totalDeliveryTime += Math.abs(diffDays);
      deliveryCount++;
    }
  });
  
  const averageDeliveryTime = deliveryCount > 0 ? Math.round(totalDeliveryTime / deliveryCount) : 0;
  
  // Calculate order fulfillment rate
  let totalOrdered = 0;
  let totalReceived = 0;
  
  completedOrders.forEach(po => {
    po.items.forEach(item => {
      totalOrdered += item.jumlahDipesan;
      totalReceived += item.jumlahDiterima;
    });
  });
  
  const orderFulfillmentRate = totalOrdered > 0 ? Math.round((totalReceived / totalOrdered) * 100) : 0;
  
  // Calculate quality score (based on fulfillment rate and delivery time)
  let qualityScore = 5;
  if (orderFulfillmentRate < 80) qualityScore -= 1;
  if (orderFulfillmentRate < 60) qualityScore -= 1;
  if (averageDeliveryTime > 7) qualityScore -= 1;
  if (averageDeliveryTime > 14) qualityScore -= 1;
  qualityScore = Math.max(1, qualityScore);
  
  // Calculate total value
  const totalValue = purchaseOrders.reduce((sum, po) => sum + po.total, 0);
  
  // Get last order date
  const lastOrderDate = purchaseOrders.length > 0
    ? purchaseOrders.sort((a, b) => new Date(b.tanggalPO).getTime() - new Date(a.tanggalPO).getTime())[0].tanggalPO
    : '';
  
  return {
    supplierId,
    supplierNama: supplier.nama,
    totalOrders,
    completedOrders: completedOrders.length,
    averageDeliveryTime,
    orderFulfillmentRate,
    qualityScore,
    totalValue,
    lastOrderDate
  };
}

/**
 * Get all supplier performance metrics
 */
export function getAllSupplierPerformance(): SupplierPerformance[] {
  const suppliers = storageService.getSupplier().filter(s => s.isActive);
  return suppliers
    .map(supplier => calculateSupplierPerformance(supplier.id))
    .filter((perf): perf is SupplierPerformance => perf !== null)
    .sort((a, b) => b.qualityScore - a.qualityScore);
}

/**
 * Generate reorder suggestions based on low stock
 */
export function generateReorderSuggestions(): ReorderSuggestion[] {
  const lowStockMeds = getLowStockMedications();
  const suppliers = storageService.getSupplier().filter(s => s.isActive);
  const purchaseOrders = storageService.getPurchaseOrders();
  const pembelianList = storageService.getPembelian();
  
  const suggestions: ReorderSuggestion[] = [];
  
  lowStockMeds.forEach(obat => {
    // Find best supplier for this medication
    const supplierScores: { supplier: Supplier; score: number; lastPrice: number; avgDeliveryTime: number }[] = [];
    
    suppliers.forEach(supplier => {
      const performance = calculateSupplierPerformance(supplier.id);
      if (!performance) return;
      
      // Check if supplier has supplied this medication before
      const hasSuppplied = [...purchaseOrders, ...pembelianList].some(order => 
        order.supplierId === supplier.id && 
        order.items.some(item => item.obatId === obat.id)
      );
      
      if (hasSuppplied) {
        // Get last price from this supplier
        let lastPrice = obat.hargaBeli;
        const lastPO = purchaseOrders
          .filter(po => po.supplierId === supplier.id && po.items.some(item => item.obatId === obat.id))
          .sort((a, b) => new Date(b.tanggalPO).getTime() - new Date(a.tanggalPO).getTime())[0];
        
        if (lastPO) {
          const item = lastPO.items.find(item => item.obatId === obat.id);
          if (item) lastPrice = item.hargaBeli;
        }
        
        // Calculate score based on quality, delivery time, and price
        const score = performance.qualityScore * 10 + 
                     (performance.orderFulfillmentRate / 10) - 
                     (performance.averageDeliveryTime / 2);
        
        supplierScores.push({
          supplier,
          score,
          lastPrice,
          avgDeliveryTime: performance.averageDeliveryTime
        });
      }
    });
    
    if (supplierScores.length > 0) {
      // Sort by score and pick the best
      supplierScores.sort((a, b) => b.score - a.score);
      const best = supplierScores[0];
      const performance = calculateSupplierPerformance(best.supplier.id);
      
      // Calculate suggested quantity (2-3x minimum stock)
      const suggestedQuantity = Math.max(
        obat.stokMinimum * 2,
        obat.stokMinimum - obat.stokCurrent + obat.stokMinimum
      );
      
      // Determine priority
      const stockRatio = obat.stokCurrent / obat.stokMinimum;
      let priority: 'high' | 'medium' | 'low' = 'low';
      if (stockRatio <= 0.3) priority = 'high';
      else if (stockRatio <= 0.7) priority = 'medium';
      
      suggestions.push({
        id: generateId('reorder'),
        obatId: obat.id,
        obatNama: obat.nama,
        stokCurrent: obat.stokCurrent,
        stokMinimum: obat.stokMinimum,
        suggestedQuantity,
        recommendedSupplier: {
          supplierId: best.supplier.id,
          supplierNama: best.supplier.nama,
          lastPrice: best.lastPrice,
          averageDeliveryTime: best.avgDeliveryTime,
          qualityScore: performance?.qualityScore || 0
        },
        priority,
        createdAt: new Date().toISOString(),
        status: 'pending'
      });
    }
  });
  
  return suggestions.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

/**
 * Auto-update stock when PO is received
 */
export function updateStockFromPO(po: PurchaseOrder): void {
  const obatList = storageService.getObat();
  
  po.items.forEach(item => {
    const obatIndex = obatList.findIndex(o => o.id === item.obatId);
    if (obatIndex !== -1) {
      obatList[obatIndex].stokCurrent += item.jumlahDiterima;
      obatList[obatIndex].updatedAt = new Date().toISOString();
    }
  });
  
  storageService.saveObat(obatList);
}