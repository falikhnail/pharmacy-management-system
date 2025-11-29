import {
  User,
  Obat,
  ObatBatch,
  Pasien,
  Resep,
  Supplier,
  Pembelian,
  PurchaseOrder,
  ReorderSuggestion,
  Penjualan,
  Return,
  StockOpname,
  AktivitasLog,
  LogStok,
  Settings,
  Transaksi,
  Notifikasi,
  ExpiryAlert,
} from '@/types';

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

// Initialize default users if not exists
const initializeDefaultUsers = () => {
  const existingUsers = localStorage.getItem(STORAGE_KEYS.USERS);
  if (!existingUsers) {
    const defaultUsers: User[] = [
      {
        id: '1',
        username: 'admin',
        password: 'admin123',
        nama: 'Administrator',
        role: 'Admin',
        email: 'admin@pharmacy.com',
        telepon: '081234567890',
        isActive: true,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      },
      {
        id: '2',
        username: 'apoteker',
        password: 'apoteker123',
        nama: 'Apoteker Utama',
        role: 'Apoteker',
        email: 'apoteker@pharmacy.com',
        telepon: '081234567891',
        isActive: true,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      },
      {
        id: '3',
        username: 'kasir',
        password: 'kasir123',
        nama: 'Kasir',
        role: 'Kasir',
        email: 'kasir@pharmacy.com',
        telepon: '081234567892',
        isActive: true,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      },
    ];
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
  }
};

// Call initialization on module load
initializeDefaultUsers();

class StorageService {
  // Generic get/set methods
  private get<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading ${key}:`, error);
      return defaultValue;
    }
  }

  private set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing ${key}:`, error);
    }
  }

  // User methods
  getUsers(): User[] {
    return this.get<User[]>(STORAGE_KEYS.USERS, []);
  }

  saveUsers(users: User[]): void {
    this.set(STORAGE_KEYS.USERS, users);
  }

  getUser(): User[] {
    return this.getUsers();
  }

  saveUser(users: User[]): void {
    this.saveUsers(users);
  }

  getCurrentUser(): User {
    return this.get<User>(STORAGE_KEYS.CURRENT_USER, {} as User);
  }

  setCurrentUser(user: User): void {
    this.set(STORAGE_KEYS.CURRENT_USER, user);
  }

  clearCurrentUser(): void {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }

  // Obat methods
  getObat(): Obat[] {
    const obatList = this.get<Obat[]>(STORAGE_KEYS.OBAT, []);
    const batches = this.getObatBatches();
    
    // Attach batches to each obat
    return obatList.map(obat => ({
      ...obat,
      batches: batches.filter(b => b.obatId === obat.id),
    }));
  }

  saveObat(obat: Obat[]): void {
    this.set(STORAGE_KEYS.OBAT, obat);
  }

  // Obat Batch methods
  getObatBatches(): ObatBatch[] {
    return this.get<ObatBatch[]>(STORAGE_KEYS.OBAT_BATCHES, []);
  }

  saveObatBatches(batches: ObatBatch[]): void {
    this.set(STORAGE_KEYS.OBAT_BATCHES, batches);
  }

  getBatchesByObatId(obatId: string): ObatBatch[] {
    const batches = this.getObatBatches();
    return batches.filter(b => b.obatId === obatId);
  }

  addObatBatch(batch: ObatBatch): void {
    const batches = this.getObatBatches();
    batches.push(batch);
    this.saveObatBatches(batches);
  }

  updateObatBatch(batchId: string, updates: Partial<ObatBatch>): void {
    const batches = this.getObatBatches();
    const index = batches.findIndex(b => b.id === batchId);
    if (index !== -1) {
      batches[index] = { ...batches[index], ...updates, updatedAt: new Date().toISOString() };
      this.saveObatBatches(batches);
    }
  }

  deleteObatBatch(batchId: string): void {
    const batches = this.getObatBatches();
    const filtered = batches.filter(b => b.id !== batchId);
    this.saveObatBatches(filtered);
  }

  // Expiry Alert methods
  getExpiryAlerts(): ExpiryAlert[] {
    return this.get<ExpiryAlert[]>(STORAGE_KEYS.EXPIRY_ALERTS, []);
  }

  saveExpiryAlerts(alerts: ExpiryAlert[]): void {
    this.set(STORAGE_KEYS.EXPIRY_ALERTS, alerts);
  }

  addExpiryAlert(alert: ExpiryAlert): void {
    const alerts = this.getExpiryAlerts();
    alerts.push(alert);
    this.saveExpiryAlerts(alerts);
  }

  // Pasien methods
  getPasien(): Pasien[] {
    return this.get<Pasien[]>(STORAGE_KEYS.PASIEN, []);
  }

  savePasien(pasien: Pasien[]): void {
    this.set(STORAGE_KEYS.PASIEN, pasien);
  }

  // Resep methods
  getResep(): Resep[] {
    return this.get<Resep[]>(STORAGE_KEYS.RESEP, []);
  }

  saveResep(resep: Resep[]): void {
    this.set(STORAGE_KEYS.RESEP, resep);
  }

  // Supplier methods
  getSupplier(): Supplier[] {
    return this.get<Supplier[]>(STORAGE_KEYS.SUPPLIER, []);
  }

  saveSupplier(supplier: Supplier[]): void {
    this.set(STORAGE_KEYS.SUPPLIER, supplier);
  }

  // Pembelian methods
  getPembelian(): Pembelian[] {
    return this.get<Pembelian[]>(STORAGE_KEYS.PEMBELIAN, []);
  }

  savePembelian(pembelian: Pembelian[]): void {
    this.set(STORAGE_KEYS.PEMBELIAN, pembelian);
  }

  // Purchase Order methods
  getPurchaseOrders(): PurchaseOrder[] {
    return this.get<PurchaseOrder[]>(STORAGE_KEYS.PURCHASE_ORDERS, []);
  }

  savePurchaseOrders(purchaseOrders: PurchaseOrder[]): void {
    this.set(STORAGE_KEYS.PURCHASE_ORDERS, purchaseOrders);
  }

  // Reorder Suggestions methods
  getReorderSuggestions(): ReorderSuggestion[] {
    return this.get<ReorderSuggestion[]>(STORAGE_KEYS.REORDER_SUGGESTIONS, []);
  }

  saveReorderSuggestions(suggestions: ReorderSuggestion[]): void {
    this.set(STORAGE_KEYS.REORDER_SUGGESTIONS, suggestions);
  }

  // Penjualan methods
  getPenjualan(): Penjualan[] {
    return this.get<Penjualan[]>(STORAGE_KEYS.PENJUALAN, []);
  }

  savePenjualan(penjualan: Penjualan[]): void {
    this.set(STORAGE_KEYS.PENJUALAN, penjualan);
  }

  // Transaksi aliases (compatibility)
  getTransaksi(): Transaksi[] {
    return this.getPenjualan();
  }

  saveTransaksi(transaksi: Transaksi[]): void {
    this.savePenjualan(transaksi);
  }

  // Return methods
  getReturn(): Return[] {
    return this.get<Return[]>(STORAGE_KEYS.RETURN, []);
  }

  saveReturn(returnData: Return[]): void {
    this.set(STORAGE_KEYS.RETURN, returnData);
  }

  // Stock Opname methods
  getStockOpname(): StockOpname[] {
    return this.get<StockOpname[]>(STORAGE_KEYS.STOCK_OPNAME, []);
  }

  saveStockOpname(stockOpname: StockOpname[]): void {
    this.set(STORAGE_KEYS.STOCK_OPNAME, stockOpname);
  }

  // Aktivitas methods
  getAktivitas(): AktivitasLog[] {
    return this.get<AktivitasLog[]>(STORAGE_KEYS.AKTIVITAS, []);
  }

  saveAktivitas(aktivitas: AktivitasLog[]): void {
    this.set(STORAGE_KEYS.AKTIVITAS, aktivitas);
  }

  getLogAktivitas(): AktivitasLog[] {
    return this.getAktivitas();
  }

  saveLogAktivitas(aktivitas: AktivitasLog[]): void {
    this.saveAktivitas(aktivitas);
  }

  // Log Stok methods
  getLogStok(): LogStok[] {
    return this.get<LogStok[]>(STORAGE_KEYS.LOG_STOK, []);
  }

  saveLogStok(logs: LogStok[]): void {
    this.set(STORAGE_KEYS.LOG_STOK, logs);
  }

  // Settings methods
  getSettings(): Settings {
    return this.get<Settings>(STORAGE_KEYS.SETTINGS, {
      storeName: 'Apotek Sehat',
      storeAddress: 'Jl. Kesehatan No. 123',
      storePhone: '021-12345678',
      storeEmail: 'info@apoteksehat.com',
      taxRate: 10,
      lowStockThreshold: 10,
      expiryWarningDays: 30,
      enableNotifications: true,
      enableAutoBackup: false,
      backupFrequency: 'weekly',
      fefoEnabled: true,
    });
  }

  saveSettings(settings: Settings): void {
    this.set(STORAGE_KEYS.SETTINGS, settings);
  }

  // Notifikasi methods
  getNotifikasi(): Notifikasi[] {
    return this.get<Notifikasi[]>(STORAGE_KEYS.NOTIFIKASI, []);
  }

  saveNotifikasi(notifikasi: Notifikasi[]): void {
    this.set(STORAGE_KEYS.NOTIFIKASI, notifikasi);
  }

  // Clear all data
  clearAll(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    // Reinitialize default users after clearing
    initializeDefaultUsers();
  }
}

export const storageService = new StorageService();