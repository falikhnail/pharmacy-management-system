# Sistem Manajemen Apotek - Development Plan

## Tech Stack
- React + TypeScript + Vite
- Shadcn-UI Components
- Tailwind CSS
- LocalStorage untuk data persistence
- React Router untuk navigasi
- Recharts untuk visualisasi laporan

## File Structure

### 1. Core Files (Utilities & Types)
- `src/types/index.ts` - TypeScript interfaces untuk semua entitas
- `src/lib/storage.ts` - LocalStorage utilities
- `src/lib/barcode.ts` - Barcode generator utilities
- `src/lib/utils-pharmacy.ts` - Helper functions (format currency, date, dll)

### 2. Layout & Navigation
- `src/components/layout/Sidebar.tsx` - Sidebar navigation
- `src/components/layout/Header.tsx` - Top header dengan notifikasi
- `src/components/layout/MainLayout.tsx` - Main layout wrapper

### 3. Pages (12 Modul Utama)
- `src/pages/Dashboard.tsx` - Dashboard dengan statistik & notifikasi
- `src/pages/Obat.tsx` - Manajemen Obat (CRUD)
- `src/pages/Stok.tsx` - Manajemen Stok (masuk/keluar)
- `src/pages/Supplier.tsx` - Manajemen Supplier
- `src/pages/Pasien.tsx` - Manajemen Pasien
- `src/pages/Resep.tsx` - Manajemen Resep Dokter
- `src/pages/POS.tsx` - Point of Sales / Kasir
- `src/pages/Return.tsx` - Return & Refund
- `src/pages/Laporan.tsx` - Laporan Lengkap
- `src/pages/User.tsx` - User Management
- `src/pages/Login.tsx` - Login page

### 4. Components (Reusable)
- `src/components/obat/ObatForm.tsx` - Form tambah/edit obat
- `src/components/obat/ObatCard.tsx` - Card display obat
- `src/components/pos/CartItem.tsx` - Item di keranjang POS
- `src/components/pos/PaymentModal.tsx` - Modal pembayaran
- `src/components/common/BarcodeScanner.tsx` - Barcode scanner component
- `src/components/common/NotificationBell.tsx` - Bell notifikasi
- `src/components/laporan/SalesChart.tsx` - Chart penjualan

## Implementation Priority
1. Setup types & storage utilities
2. Layout & navigation structure
3. Dashboard dengan notifikasi
4. Manajemen Obat (fitur paling kritis)
5. Manajemen Stok
6. POS System
7. Supplier & Pasien
8. Resep & Return
9. Laporan
10. User Management

## Key Features Per Module
- **Obat**: CRUD, foto upload, barcode, batch, kadaluarsa, stok minimum alert
- **Stok**: Masuk/keluar, transfer, notifikasi, log pergerakan
- **Supplier**: Data supplier, pembelian, invoice
- **Pasien**: Data pasien, riwayat pembelian & resep
- **Resep**: Input manual, konfirmasi apoteker, cetak label
- **POS**: Scan barcode, keranjang, diskon, pajak, multi payment, struk
- **Return**: Return obat, refund, log retur
- **Laporan**: Penjualan, stok, terlaris, kadaluarsa, laba rugi
- **User**: Role (Admin/Apoteker/Kasir), permissions, log aktivitas
- **Notifikasi**: Stok menipis, kadaluarsa, penjualan besar
- **Bonus**: Dark mode, barcode scanner kamera, responsive

## Data Models
- Obat: id, nama, kategori, bentuk, satuan, batch, registrasi, kadaluarsa, foto, barcode, stokMin, stokCurrent, hargaBeli, hargaJual
- Stok: id, obatId, tipe (masuk/keluar), jumlah, tanggal, keterangan, userId
- Supplier: id, nama, alamat, telepon, email, kontak
- Pasien: id, nama, alamat, telepon, tanggalLahir, riwayatPembelian[], riwayatResep[]
- Resep: id, pasienId, dokter, tanggal, items[], status, apotekerId
- Transaksi: id, tanggal, items[], subtotal, diskon, pajak, total, metodePembayaran, kasirId
- Return: id, transaksiId, items[], alasan, tanggal, refundAmount
- User: id, username, password, role, permissions[], lastLogin