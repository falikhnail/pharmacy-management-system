import { ObatBatch, ExpiryAlert, Obat } from '@/types';

/**
 * Calculate days until expiry
 */
export const calculateDaysUntilExpiry = (expiryDate: string): number => {
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Check if batch is expired
 */
export const isBatchExpired = (expiryDate: string): boolean => {
  return calculateDaysUntilExpiry(expiryDate) < 0;
};

/**
 * Check if batch is near expiry (within warning days)
 */
export const isBatchNearExpiry = (expiryDate: string, warningDays: number = 30): boolean => {
  const daysUntil = calculateDaysUntilExpiry(expiryDate);
  return daysUntil >= 0 && daysUntil <= warningDays;
};

/**
 * Get batch status based on expiry date
 */
export const getBatchStatus = (expiryDate: string, warningDays: number = 30): 'Aktif' | 'Near Expiry' | 'Expired' => {
  if (isBatchExpired(expiryDate)) {
    return 'Expired';
  }
  if (isBatchNearExpiry(expiryDate, warningDays)) {
    return 'Near Expiry';
  }
  return 'Aktif';
};

/**
 * Sort batches by FEFO (First Expired First Out)
 * Returns batches sorted by expiry date (earliest first)
 */
export const sortBatchesByFEFO = (batches: ObatBatch[]): ObatBatch[] => {
  return [...batches].sort((a, b) => {
    const dateA = new Date(a.tanggalKadaluarsa).getTime();
    const dateB = new Date(b.tanggalKadaluarsa).getTime();
    return dateA - dateB;
  });
};

/**
 * Get available batches (not expired, with stock)
 */
export const getAvailableBatches = (batches: ObatBatch[]): ObatBatch[] => {
  return batches.filter(batch => 
    !isBatchExpired(batch.tanggalKadaluarsa) && 
    batch.jumlahStok > 0 &&
    batch.status === 'Aktif'
  );
};

/**
 * Get next batch to use based on FEFO
 */
export const getNextBatchFEFO = (batches: ObatBatch[]): ObatBatch | null => {
  const availableBatches = getAvailableBatches(batches);
  const sortedBatches = sortBatchesByFEFO(availableBatches);
  return sortedBatches.length > 0 ? sortedBatches[0] : null;
};

/**
 * Allocate quantity from batches using FEFO
 * Returns array of { batchId, quantity } allocations
 */
export const allocateQuantityFEFO = (
  batches: ObatBatch[], 
  requestedQuantity: number
): Array<{ batch: ObatBatch; quantity: number }> => {
  const availableBatches = getAvailableBatches(batches);
  const sortedBatches = sortBatchesByFEFO(availableBatches);
  
  const allocations: Array<{ batch: ObatBatch; quantity: number }> = [];
  let remainingQuantity = requestedQuantity;
  
  for (const batch of sortedBatches) {
    if (remainingQuantity <= 0) break;
    
    const allocatedQuantity = Math.min(batch.jumlahStok, remainingQuantity);
    allocations.push({
      batch,
      quantity: allocatedQuantity
    });
    
    remainingQuantity -= allocatedQuantity;
  }
  
  return allocations;
};

/**
 * Check if there's enough stock across all batches
 */
export const hasEnoughStock = (batches: ObatBatch[], requestedQuantity: number): boolean => {
  const availableBatches = getAvailableBatches(batches);
  const totalStock = availableBatches.reduce((sum, batch) => sum + batch.jumlahStok, 0);
  return totalStock >= requestedQuantity;
};

/**
 * Get total available stock from all active batches
 */
export const getTotalAvailableStock = (batches: ObatBatch[]): number => {
  const availableBatches = getAvailableBatches(batches);
  return availableBatches.reduce((sum, batch) => sum + batch.jumlahStok, 0);
};

/**
 * Generate expiry alerts for batches
 */
export const generateExpiryAlerts = (
  obat: Obat,
  batches: ObatBatch[],
  warningDays: number = 30
): ExpiryAlert[] => {
  const alerts: ExpiryAlert[] = [];
  
  batches.forEach(batch => {
    const daysUntil = calculateDaysUntilExpiry(batch.tanggalKadaluarsa);
    
    if (daysUntil < 0) {
      // Expired
      alerts.push({
        id: `alert-${batch.id}-${Date.now()}`,
        obatId: obat.id,
        obatNama: obat.nama,
        batchId: batch.id,
        nomorBatch: batch.nomorBatch,
        tanggalKadaluarsa: batch.tanggalKadaluarsa,
        jumlahStok: batch.jumlahStok,
        daysUntilExpiry: daysUntil,
        priority: 'high',
        status: 'active',
        createdAt: new Date().toISOString(),
      });
    } else if (daysUntil <= warningDays) {
      // Near expiry
      const priority = daysUntil <= 7 ? 'high' : daysUntil <= 14 ? 'medium' : 'low';
      alerts.push({
        id: `alert-${batch.id}-${Date.now()}`,
        obatId: obat.id,
        obatNama: obat.nama,
        batchId: batch.id,
        nomorBatch: batch.nomorBatch,
        tanggalKadaluarsa: batch.tanggalKadaluarsa,
        jumlahStok: batch.jumlahStok,
        daysUntilExpiry: daysUntil,
        priority,
        status: 'active',
        createdAt: new Date().toISOString(),
      });
    }
  });
  
  return alerts;
};

/**
 * Format batch display name
 */
export const formatBatchDisplay = (batch: ObatBatch): string => {
  const daysUntil = calculateDaysUntilExpiry(batch.tanggalKadaluarsa);
  const expiryDate = new Date(batch.tanggalKadaluarsa).toLocaleDateString('id-ID');
  return `${batch.nomorBatch} - Exp: ${expiryDate} (${batch.jumlahStok} unit, ${daysUntil} hari)`;
};

/**
 * Get batch color indicator based on status
 */
export const getBatchColorClass = (batch: ObatBatch): string => {
  if (isBatchExpired(batch.tanggalKadaluarsa)) {
    return 'bg-red-100 text-red-800 border-red-300';
  }
  if (isBatchNearExpiry(batch.tanggalKadaluarsa, 30)) {
    const daysUntil = calculateDaysUntilExpiry(batch.tanggalKadaluarsa);
    if (daysUntil <= 7) {
      return 'bg-orange-100 text-orange-800 border-orange-300';
    }
    return 'bg-yellow-100 text-yellow-800 border-yellow-300';
  }
  return 'bg-green-100 text-green-800 border-green-300';
};

/**
 * Update batch status based on expiry date
 */
export const updateBatchStatus = (batch: ObatBatch, warningDays: number = 30): ObatBatch => {
  return {
    ...batch,
    status: getBatchStatus(batch.tanggalKadaluarsa, warningDays),
    updatedAt: new Date().toISOString(),
  };
};

/**
 * Generate batch number (format: BATCH-YYYYMMDD-XXX)
 */
export const generateBatchNumber = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `BATCH-${year}${month}${day}-${random}`;
};