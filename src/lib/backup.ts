import { toast } from 'sonner';
import type { 
  Obat, 
  Pasien, 
  Resep, 
  Penjualan, 
  PurchaseOrder, 
  Supplier, 
  User, 
  StockOpname 
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
    medications: Obat[];
    patients: Pasien[];
    prescriptions: Resep[];
    sales: Penjualan[];
    purchaseOrders: PurchaseOrder[];
    suppliers: Supplier[];
    users: User[];
    stockOpname: StockOpname[];
    settings: Record<string, unknown>;
  };
}

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
  const medications = JSON.parse(localStorage.getItem('medications') || '[]') as Obat[];
  const patients = JSON.parse(localStorage.getItem('patients') || '[]') as Pasien[];
  const prescriptions = JSON.parse(localStorage.getItem('prescriptions') || '[]') as Resep[];
  const sales = JSON.parse(localStorage.getItem('sales') || '[]') as Penjualan[];
  const purchaseOrders = JSON.parse(localStorage.getItem('purchaseOrders') || '[]') as PurchaseOrder[];
  const suppliers = JSON.parse(localStorage.getItem('suppliers') || '[]') as Supplier[];
  const users = JSON.parse(localStorage.getItem('users') || '[]') as User[];
  const stockOpname = JSON.parse(localStorage.getItem('stockOpname') || '[]') as StockOpname[];
  const settings = JSON.parse(localStorage.getItem('settings') || '{}') as Record<string, unknown>;

  return {
    medications,
    patients,
    prescriptions,
    sales,
    purchaseOrders,
    suppliers,
    users,
    stockOpname,
    settings,
  };
};

// Calculate backup statistics
export const calculateBackupStatistics = (): BackupStatistics => {
  const data = getAllSystemData();
  
  const recordCounts = {
    medications: data.medications.length,
    patients: data.patients.length,
    prescriptions: data.prescriptions.length,
    sales: data.sales.length,
    purchaseOrders: data.purchaseOrders.length,
    suppliers: data.suppliers.length,
    users: data.users.length,
    stockOpname: data.stockOpname.length,
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
    const newHistoryItem: BackupHistoryItem = {
      id: `backup-${Date.now()}`,
      date: now.toISOString(),
      size: blob.size,
      recordCount: Object.values(data).reduce((acc, arr) => {
        return acc + (Array.isArray(arr) ? arr.length : 0);
      }, 0),
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

        // Restore all data
        const { data } = backupData;
        localStorage.setItem('medications', JSON.stringify(data.medications || []));
        localStorage.setItem('patients', JSON.stringify(data.patients || []));
        localStorage.setItem('prescriptions', JSON.stringify(data.prescriptions || []));
        localStorage.setItem('sales', JSON.stringify(data.sales || []));
        localStorage.setItem('purchaseOrders', JSON.stringify(data.purchaseOrders || []));
        localStorage.setItem('suppliers', JSON.stringify(data.suppliers || []));
        localStorage.setItem('users', JSON.stringify(data.users || []));
        localStorage.setItem('stockOpname', JSON.stringify(data.stockOpname || []));
        if (data.settings) {
          localStorage.setItem('settings', JSON.stringify(data.settings));
        }

        toast.success('Backup berhasil dipulihkan. Silakan refresh halaman.');
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