// User types
export interface User {
  id: string;
  username: string;
  password: string;
  nama: string;
  role: 'Admin' | 'Apoteker' | 'Kasir';
  email: string;
  telepon: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

// Batch tracking for medicines
export interface ObatBatch {
  id: string;
  obatId: string;
  nomorBatch: string;
  tanggalKadaluarsa: string;
  jumlahStok: number;
  hargaBeli: number;
  tanggalMasuk: string;
  supplierId: string;
  supplierNama: string;
  status: 'Aktif' | 'Expired' | 'Near Expiry';
  createdAt: string;
  updatedAt?: string;
}

// Medicine/Drug types
export interface Obat {
  id: string;
  kode: string;
  nama: string;
  kategori: string;
  satuan: string;
  hargaBeli: number;
  hargaJual: number;
  stokMinimum: number;
  stokCurrent: number;
  deskripsi?: string;
  batches?: ObatBatch[]; // Array of batches for this medicine
  createdAt: string;
  updatedAt?: string;
}

// Patient types
export interface Pasien {
  id: string;
  nomorRM: string;
  nama: string;
  tanggalLahir: string;
  jenisKelamin: 'Laki-laki' | 'Perempuan';
  alamat: string;
  telepon: string;
  email?: string;
  riwayatAlergi?: string;
  createdAt: string;
  updatedAt?: string;
}

// Prescription types
export interface ResepItem {
  obatId: string;
  obatNama: string;
  jumlah: number;
  dosis: string;
  aturanPakai: string;
  hargaSatuan: number;
  subtotal: number;
  batchId?: string; // Link to specific batch
  nomorBatch?: string;
}

export interface Resep {
  id: string;
  nomorResep: string;
  pasienId: string;
  pasienNama: string;
  dokter: string;
  tanggal: string;
  items: ResepItem[];
  total: number;
  status: 'Pending' | 'Diproses' | 'Selesai' | 'Dibatalkan';
  catatan?: string;
  apotekerId?: string;
  apotekerNama?: string;
  createdAt: string;
  updatedAt?: string;
}

// Stock/Sales types
export interface StokItem {
  obatId: string;
  obatNama: string;
  jumlah: number;
  hargaSatuan: number;
  subtotal: number;
  batchId?: string; // Link to specific batch
  nomorBatch?: string;
}

export interface Stok {
  id: string;
  nomorTransaksi: string;
  tanggal: string;
  kasirId: string;
  kasirNama: string;
  items: StokItem[];
  subtotal: number;
  diskon: number;
  diskonPersen: number;
  pajak: number;
  pajakPersen: number;
  total: number;
  metodePembayaran: 'Tunai' | 'Debit' | 'Kredit' | 'Transfer' | 'QRIS';
  jumlahBayar: number;
  kembalian: number;
  catatan?: string;
  createdAt: string;
}

// Supplier types
export interface Supplier {
  id: string;
  kode: string;
  nama: string;
  alamat: string;
  telepon: string;
  email?: string;
  kontak: string;
  keterangan?: string;
  status: 'Aktif' | 'Nonaktif';
  createdAt: string;
  updatedAt?: string;
}

// Purchase Order types
export interface PurchaseOrderItem {
  obatId: string;
  obatNama: string;
  jumlah: number;
  hargaSatuan: number;
  subtotal: number;
  nomorBatch?: string;
  tanggalKadaluarsa?: string;
}

export interface PurchaseOrder {
  id: string;
  nomorPO: string;
  supplierId: string;
  supplierNama: string;
  tanggalPO: string;
  tanggalKirim?: string;
  items: PurchaseOrderItem[];
  subtotal: number;
  pajak: number;
  total: number;
  status: 'Draft' | 'Dikirim' | 'Diterima' | 'Dibatalkan';
  catatan?: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt?: string;
}

// Stock Opname types
export interface StockOpnameItem {
  obatId: string;
  obatNama: string;
  stokSistem: number;
  stokFisik: number;
  selisih: number;
  keterangan?: string;
  batchId?: string;
  nomorBatch?: string;
}

export interface StockOpname {
  id: string;
  nomorOpname: string;
  tanggal: string;
  items: StockOpnameItem[];
  status: 'Draft' | 'Selesai';
  penanggungJawab: string;
  catatan?: string;
  createdAt: string;
  updatedAt?: string;
}

// Backup types
export interface BackupSettings {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  lastBackup?: string;
  autoBackup: boolean;
}

export interface BackupHistory {
  id: string;
  timestamp: string;
  size: number;
  status: 'success' | 'failed';
  message?: string;
}

// Expiry Alert types
export interface ExpiryAlert {
  id: string;
  obatId: string;
  obatNama: string;
  batchId: string;
  nomorBatch: string;
  tanggalKadaluarsa: string;
  jumlahStok: number;
  daysUntilExpiry: number;
  priority: 'high' | 'medium' | 'low';
  status: 'active' | 'resolved';
  createdAt: string;
}

// Legacy types for compatibility
export interface Pembelian {
  id: string;
  nomorPembelian: string;
  supplierId: string;
  supplierNama: string;
  tanggal: string;
  items: PurchaseOrderItem[];
  subtotal: number;
  pajak: number;
  total: number;
  status: string;
  createdAt: string;
}

// Penjualan type - extends Stok with all its properties
export type Penjualan = Stok;

// Transaksi type - extends Stok with all its properties
export type Transaksi = Stok;

export interface Return {
  id: string;
  nomorReturn: string;
  tanggal: string;
  tipe: 'Penjualan' | 'Pembelian';
  referensiId: string;
  items: StokItem[];
  total: number;
  alasan: string;
  status: 'Pending' | 'Disetujui' | 'Ditolak';
  createdBy: string;
  createdAt: string;
}

export interface AktivitasLog {
  id: string;
  userId: string;
  userName: string;
  aksi: string;
  detail: string;
  tanggal: string;
}

export interface LogStok {
  id: string;
  obatId: string;
  obatNama: string;
  tipe: 'masuk' | 'keluar' | 'transfer' | 'retur' | 'opname';
  jumlah: number;
  stokSebelum: number;
  stokSesudah: number;
  tanggal: string;
  keterangan: string;
  userId: string;
  userName: string;
  referensiId?: string;
  batchId?: string;
  nomorBatch?: string;
}

export interface Settings {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  storeEmail: string;
  taxRate: number;
  lowStockThreshold: number;
  expiryWarningDays: number;
  enableNotifications: boolean;
  enableAutoBackup: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  fefoEnabled: boolean; // FEFO system toggle
}

export interface Notifikasi {
  id: string;
  tipe: 'stok_menipis' | 'kadaluarsa' | 'sistem' | 'batch_expired';
  judul: string;
  pesan: string;
  tanggal: string;
  isRead: boolean;
  referensiId?: string;
  batchId?: string;
  priority: 'high' | 'medium' | 'low';
}

export interface ReorderSuggestion {
  id: string;
  obatId: string;
  obatNama: string;
  stokCurrent: number;
  stokMinimum: number;
  suggestedOrder: number;
  recommendedSupplier?: string;
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
}