import { toast } from 'sonner';
import type { 
  Obat, 
  Pasien, 
  Resep, 
  Penjualan, 
  PurchaseOrder, 
  Supplier, 
  User, 
  StockOpname,
  ObatBatch,
  Pembelian,
  Return,
  AktivitasLog,
  LogStok,
  Notifikasi,
  ExpiryAlert,
  ReorderSuggestion
} from '@/types';

export type BackupFrequency = 'daily' | 'weekly' | 'monthly';

export interface BackupSettings {
  enabled: boolean;
  frequency: BackupFrequency;
  lastBackupDate: string | null;
  nextBackupDate: string | null;
}

export interface BackupStatistics {
  totalSize: number; // in bytes
  recordCounts: {
    medications: number;
    patients: number;
    prescriptions: number;
    sales: number;
    purchaseOrders: number;
    suppliers: number;
    users: number;
    stockOpname: number;
  };
  lastBackupSize: number;
  backupHistory: BackupHistoryItem[];
}

export interface BackupHistoryItem {
  id: string;
  date: string;
  size: number;
  recordCount: number;
  status: 'success' | 'failed';
}

export interface BackupData {
  version: string;
  timestamp: string;
  data: {
    // Core data with correct keys
    pharmacy_users: User[];
    pharmacy_obat: Obat[];
    pharmacy_obat_batches: ObatBatch[];
    pharmacy_expiry_alerts: ExpiryAlert[];
    pharmacy_pasien: Pasien[];
    pharmacy_resep: Resep[];
    pharmacy_supplier: Supplier[];
    pharmacy_pembelian: Pembelian[];
    pharmacy_purchase_orders: PurchaseOrder[];
    pharmacy_reorder_suggestions: ReorderSuggestion[];
    pharmacy_penjualan: Penjualan[];
    pharmacy_return: Return[];
    pharmacy_stock_opname: StockOpname[];
    pharmacy_aktivitas: AktivitasLog[];
    pharmacy_log_stok: LogStok[];
    pharmacy_settings: Record<string, unknown>;
    pharmacy_notifikasi: Notifikasi[];
    // Backup settings
    backupSettings: BackupSettings;
    backupHistory: BackupHistoryItem[];
    settings: Record<string, unknown>;
  };
}

// Storage keys matching storage.ts
const STORAGE_KEYS = {
  USERS: 'pharmacy_users',
  CURRENT_USER: 'pharmacy_current_user',
  OBAT: 'pharmacy_obat',
  OBAT_BATCHES: 'pharmacy_obat_batches',
  EXPIRY_ALERTS: 'pharmacy_expiry_alerts',
  PASIEN: 'pharmacy_pasien',
  RESEP: 'pharmacy_resep',
  SUPPLIER: 'pharmacy_supplier',
  PEMBELIAN: 'pharmacy_pembelian',
  PURCHASE_ORDERS: 'pharmacy_purchase_orders',
  REORDER_SUGGESTIONS: 'pharmacy_reorder_suggestions',
  PENJUALAN: 'pharmacy_penjualan',
  RETURN: 'pharmacy_return',
  STOCK_OPNAME: 'pharmacy_stock_opname',
  AKTIVITAS: 'pharmacy_aktivitas',
  LOG_STOK: 'pharmacy_log_stok',
  SETTINGS: 'pharmacy_settings',
  NOTIFIKASI: 'pharmacy_notifikasi',
};

// Get backup settings from localStorage
export const getBackupSettings = (): BackupSettings => {
  const settings = localStorage.getItem('backupSettings');
  if (settings) {
    return JSON.parse(settings);
  }
  return {
    enabled: false,
    frequency: 'weekly',
    lastBackupDate: null,
    nextBackupDate: null,
  };
};

// Save backup settings to localStorage
export const saveBackupSettings = (settings: BackupSettings): void => {
  localStorage.setItem('backupSettings', JSON.stringify(settings));
};

// Calculate next backup date based on frequency
export const calculateNextBackupDate = (lastBackup: Date, frequency: BackupFrequency): Date => {
  const nextDate = new Date(lastBackup);
  
  switch (frequency) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
  }
  
  return nextDate;
};

// Get all data from localStorage for backup
export const getAllSystemData = (): BackupData['data'] => {
  const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]') as User[];
  const obat = JSON.parse(localStorage.getItem(STORAGE_KEYS.OBAT) || '[]') as Obat[];
  const obatBatches = JSON.parse(localStorage.getItem(STORAGE_KEYS.OBAT_BATCHES) || '[]') as ObatBatch[];
  const expiryAlerts = JSON.parse(localStorage.getItem(STORAGE_KEYS.EXPIRY_ALERTS) || '[]') as ExpiryAlert[];
  const pasien = JSON.parse(localStorage.getItem(STORAGE_KEYS.PASIEN) || '[]') as Pasien[];
  const resep = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESEP) || '[]') as Resep[];
  const supplier = JSON.parse(localStorage.getItem(STORAGE_KEYS.SUPPLIER) || '[]') as Supplier[];
  const pembelian = JSON.parse(localStorage.getItem(STORAGE_KEYS.PEMBELIAN) || '[]') as Pembelian[];
  const purchaseOrders = JSON.parse(localStorage.getItem(STORAGE_KEYS.PURCHASE_ORDERS) || '[]') as PurchaseOrder[];
  const reorderSuggestions = JSON.parse(localStorage.getItem(STORAGE_KEYS.REORDER_SUGGESTIONS) || '[]') as ReorderSuggestion[];
  const penjualan = JSON.parse(localStorage.getItem(STORAGE_KEYS.PENJUALAN) || '[]') as Penjualan[];
  const returnData = JSON.parse(localStorage.getItem(STORAGE_KEYS.RETURN) || '[]') as Return[];
  const stockOpname = JSON.parse(localStorage.getItem(STORAGE_KEYS.STOCK_OPNAME) || '[]') as StockOpname[];
  const aktivitas = JSON.parse(localStorage.getItem(STORAGE_KEYS.AKTIVITAS) || '[]') as AktivitasLog[];
  const logStok = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOG_STOK) || '[]') as LogStok[];
  const pharmacySettings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || '{}') as Record<string, unknown>;
  const notifikasi = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFIKASI) || '[]') as Notifikasi[];
  
  const backupSettings = getBackupSettings();
  const backupHistory = getBackupHistory();
  const settings = JSON.parse(localStorage.getItem('settings') || '{}') as Record<string, unknown>;

  return {
    pharmacy_users: users,
    pharmacy_obat: obat,
    pharmacy_obat_batches: obatBatches,
    pharmacy_expiry_alerts: expiryAlerts,
    pharmacy_pasien: pasien,
    pharmacy_resep: resep,
    pharmacy_supplier: supplier,
    pharmacy_pembelian: pembelian,
    pharmacy_purchase_orders: purchaseOrders,
    pharmacy_reorder_suggestions: reorderSuggestions,
    pharmacy_penjualan: penjualan,
    pharmacy_return: returnData,
    pharmacy_stock_opname: stockOpname,
    pharmacy_aktivitas: aktivitas,
    pharmacy_log_stok: logStok,
    pharmacy_settings: pharmacySettings,
    pharmacy_notifikasi: notifikasi,
    backupSettings,
    backupHistory,
    settings,
  };
};

// Calculate backup statistics
export const calculateBackupStatistics = (): BackupStatistics => {
  const data = getAllSystemData();
  
  const recordCounts = {
    medications: data.pharmacy_obat.length,
    patients: data.pharmacy_pasien.length,
    prescriptions: data.pharmacy_resep.length,
    sales: data.pharmacy_penjualan.length,
    purchaseOrders: data.pharmacy_purchase_orders.length,
    suppliers: data.pharmacy_supplier.length,
    users: data.pharmacy_users.length,
    stockOpname: data.pharmacy_stock_opname.length,
  };

  // Calculate total size (approximate)
  const dataString = JSON.stringify(data);
  const totalSize = new Blob([dataString]).size;

  // Get backup history
  const backupHistory = getBackupHistory();
  const lastBackupSize = backupHistory.length > 0 ? backupHistory[0].size : 0;

  return {
    totalSize,
    recordCounts,
    lastBackupSize,
    backupHistory,
  };
};

// Get backup history
export const getBackupHistory = (): BackupHistoryItem[] => {
  const history = localStorage.getItem('backupHistory');
  if (history) {
    return JSON.parse(history);
  }
  return [];
};

// Save backup history
const saveBackupHistory = (history: BackupHistoryItem[]): void => {
  // Keep only last 10 backups in history
  const limitedHistory = history.slice(0, 10);
  localStorage.setItem('backupHistory', JSON.stringify(limitedHistory));
};

// Create backup
export const createBackup = (): void => {
  try {
    const data = getAllSystemData();
    const backup: BackupData = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      data,
    };

    const backupString = JSON.stringify(backup, null, 2);
    const blob = new Blob([backupString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `pharmacy-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Update backup settings
    const settings = getBackupSettings();
    const now = new Date();
    const nextBackup = calculateNextBackupDate(now, settings.frequency);
    
    settings.lastBackupDate = now.toISOString();
    settings.nextBackupDate = nextBackup.toISOString();
    saveBackupSettings(settings);

    // Add to backup history
    const history = getBackupHistory();
    
    // Calculate total record count
    const recordCount = 
      data.pharmacy_users.length +
      data.pharmacy_obat.length +
      data.pharmacy_obat_batches.length +
      data.pharmacy_pasien.length +
      data.pharmacy_resep.length +
      data.pharmacy_supplier.length +
      data.pharmacy_pembelian.length +
      data.pharmacy_purchase_orders.length +
      data.pharmacy_penjualan.length +
      data.pharmacy_return.length +
      data.pharmacy_stock_opname.length +
      data.pharmacy_aktivitas.length +
      data.pharmacy_log_stok.length +
      data.pharmacy_notifikasi.length;
    
    const newHistoryItem: BackupHistoryItem = {
      id: `backup-${Date.now()}`,
      date: now.toISOString(),
      size: blob.size,
      recordCount,
      status: 'success',
    };
    
    history.unshift(newHistoryItem);
    saveBackupHistory(history);

    toast.success('Backup berhasil dibuat dan diunduh');
  } catch (error) {
    console.error('Backup error:', error);
    
    // Add failed backup to history
    const history = getBackupHistory();
    const failedHistoryItem: BackupHistoryItem = {
      id: `backup-${Date.now()}`,
      date: new Date().toISOString(),
      size: 0,
      recordCount: 0,
      status: 'failed',
    };
    
    history.unshift(failedHistoryItem);
    saveBackupHistory(history);
    
    toast.error('Gagal membuat backup');
  }
};

// Restore backup from file
export const restoreBackup = (file: File): Promise<void> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const backupData: BackupData = JSON.parse(e.target?.result as string);
        
        // Validate backup data structure
        if (!backupData.data || !backupData.version) {
          throw new Error('Invalid backup file format');
        }

        // Restore all data with correct keys
        const { data } = backupData;
        
        // Restore core pharmacy data
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(data.pharmacy_users || []));
        localStorage.setItem(STORAGE_KEYS.OBAT, JSON.stringify(data.pharmacy_obat || []));
        localStorage.setItem(STORAGE_KEYS.OBAT_BATCHES, JSON.stringify(data.pharmacy_obat_batches || []));
        localStorage.setItem(STORAGE_KEYS.EXPIRY_ALERTS, JSON.stringify(data.pharmacy_expiry_alerts || []));
        localStorage.setItem(STORAGE_KEYS.PASIEN, JSON.stringify(data.pharmacy_pasien || []));
        localStorage.setItem(STORAGE_KEYS.RESEP, JSON.stringify(data.pharmacy_resep || []));
        localStorage.setItem(STORAGE_KEYS.SUPPLIER, JSON.stringify(data.pharmacy_supplier || []));
        localStorage.setItem(STORAGE_KEYS.PEMBELIAN, JSON.stringify(data.pharmacy_pembelian || []));
        localStorage.setItem(STORAGE_KEYS.PURCHASE_ORDERS, JSON.stringify(data.pharmacy_purchase_orders || []));
        localStorage.setItem(STORAGE_KEYS.REORDER_SUGGESTIONS, JSON.stringify(data.pharmacy_reorder_suggestions || []));
        localStorage.setItem(STORAGE_KEYS.PENJUALAN, JSON.stringify(data.pharmacy_penjualan || []));
        localStorage.setItem(STORAGE_KEYS.RETURN, JSON.stringify(data.pharmacy_return || []));
        localStorage.setItem(STORAGE_KEYS.STOCK_OPNAME, JSON.stringify(data.pharmacy_stock_opname || []));
        localStorage.setItem(STORAGE_KEYS.AKTIVITAS, JSON.stringify(data.pharmacy_aktivitas || []));
        localStorage.setItem(STORAGE_KEYS.LOG_STOK, JSON.stringify(data.pharmacy_log_stok || []));
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.pharmacy_settings || {}));
        localStorage.setItem(STORAGE_KEYS.NOTIFIKASI, JSON.stringify(data.pharmacy_notifikasi || []));
        
        // Restore backup settings and history
        if (data.backupSettings) {
          localStorage.setItem('backupSettings', JSON.stringify(data.backupSettings));
        }
        if (data.backupHistory) {
          localStorage.setItem('backupHistory', JSON.stringify(data.backupHistory));
        }
        if (data.settings) {
          localStorage.setItem('settings', JSON.stringify(data.settings));
        }

        toast.success('Backup berhasil dipulihkan. Halaman akan dimuat ulang dalam 2 detik...');
        
        // Reload page after 2 seconds to reflect restored data
        setTimeout(() => {
          window.location.reload();
        }, 2000);
        
        resolve();
      } catch (error) {
        console.error('Restore error:', error);
        toast.error('Gagal memulihkan backup. File mungkin rusak atau tidak valid.');
        reject(error);
      }
    };
    
    reader.onerror = () => {
      toast.error('Gagal membaca file backup');
      reject(new Error('Failed to read backup file'));
    };
    
    reader.readAsText(file);
  });
};

// Check if backup is due
export const isBackupDue = (): boolean => {
  const settings = getBackupSettings();
  
  if (!settings.enabled || !settings.nextBackupDate) {
    return false;
  }
  
  const now = new Date();
  const nextBackup = new Date(settings.nextBackupDate);
  
  return now >= nextBackup;
};

// Initialize backup scheduler
export const initializeBackupScheduler = (): void => {
  // Check every hour if backup is due
  setInterval(() => {
    if (isBackupDue()) {
      createBackup();
    }
  }, 60 * 60 * 1000); // Check every hour
  
  // Also check on initialization
  if (isBackupDue()) {
    createBackup();
  }
};

// Format bytes to human readable
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};
