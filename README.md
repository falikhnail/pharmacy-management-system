# 🏥 Pharmacy Management System

Sistem Manajemen Apotek yang komprehensif dengan kontrol akses berbasis peran (Role-Based Access Control), dirancang untuk mengoptimalkan operasi apotek, manajemen inventori, layanan pelanggan, dan meningkatkan pengalaman pengguna.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6.2-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-5.4.21-646CFF?logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4.17-38B2AC?logo=tailwind-css)

## 📋 Daftar Isi

- [Fitur Utama](#-fitur-utama)
- [Role-Based Access Control](#-role-based-access-control)
- [Teknologi](#-teknologi)
- [Prasyarat](#-prasyarat)
- [Instalasi](#-instalasi)
- [Menjalankan Aplikasi](#-menjalankan-aplikasi)
- [Build untuk Production](#-build-untuk-production)
- [Struktur Project](#-struktur-project)
- [Kredensial Login](#-kredensial-login)
- [Troubleshooting](#-troubleshooting)
- [Kontribusi](#-kontribusi)
- [Lisensi](#-lisensi)

## ✨ Fitur Utama

### 🔐 Manajemen User & Keamanan
- **Role-Based Access Control (RBAC)** - Kontrol akses berdasarkan peran pengguna
- **Autentikasi User** - Sistem login yang aman
- **Activity Logging** - Pencatatan aktivitas pengguna
- **Permission Management** - Manajemen hak akses yang fleksibel

### 💊 Manajemen Inventory
- **CRUD Obat** - Kelola data obat lengkap
- **Stock Opname** - Penyesuaian stok fisik
- **Batch & Expiry Tracking** - Pelacakan batch dan tanggal kadaluarsa
- **Low Stock Alerts** - Notifikasi stok menipis
- **Smart Reorder Suggestions** - Saran pemesanan ulang otomatis

### 🛒 Point of Sale (POS)
- **Mobile-Friendly Interface** - Responsif untuk semua perangkat
- **Quick Transaction Processing** - Proses transaksi cepat
- **Receipt Generation** - Pembuatan struk otomatis
- **Sales History** - Riwayat penjualan lengkap

### 📊 Reporting & Analytics
- **Sales Reports** - Laporan penjualan detail
- **Inventory Reports** - Laporan stok dan pergerakan barang
- **Financial Reports** - Laporan keuangan
- **Export to PDF/Excel** - Export laporan ke berbagai format
- **Analytics Dashboard** - Dashboard analitik real-time

### 👥 Manajemen Pasien & Resep
- **Patient Records** - Catatan pasien lengkap
- **Prescription Management** - Manajemen resep
- **Digital Prescription** - Resep digital
- **Prescription History** - Riwayat resep pasien

### 🚚 Manajemen Supplier
- **Supplier Database** - Database supplier
- **Purchase Order Management** - Manajemen pesanan pembelian
- **Supplier Performance Tracking** - Pelacakan performa supplier
- **Automated Reordering** - Pemesanan ulang otomatis

### ⚙️ Sistem & Utilitas
- **Automatic Backup** - Backup otomatis terjadwal
- **Manual Backup/Restore** - Backup dan restore manual
- **System Settings** - Pengaturan sistem
- **Notification Management** - Manajemen notifikasi
- **Return Management** - Manajemen retur barang

## 🔐 Role-Based Access Control

Sistem ini mengimplementasikan kontrol akses berbasis peran yang ketat:

### 👨‍💼 Admin
**Akses Penuh ke Semua Fitur:**
- ✅ Dashboard
- ✅ POS & Penjualan
- ✅ Manajemen Obat & Inventory
- ✅ Manajemen Pasien
- ✅ Resep & Resep Digital
- ✅ Supplier & Purchase Order
- ✅ Stock Opname
- ✅ Return & Refund
- ✅ Laporan & Reports
- ✅ Manajemen User
- ✅ Settings & Backup

### 👨‍⚕️ Apoteker (Pharmacist)
**Akses Terbatas - Fokus pada Inventory:**
- ✅ Dashboard
- ✅ Manajemen Obat
- ✅ Stock Opname
- ❌ Tidak bisa akses fitur lainnya

### 💰 Kasir (Cashier)
**Akses Terbatas - Fokus pada Penjualan:**
- ✅ Dashboard
- ✅ POS (Point of Sale)
- ✅ Stok (Sales Management)
- ❌ Tidak bisa akses fitur lainnya

## 🛠 Teknologi

### Frontend Framework
- **React 18.3.1** - Library UI modern
- **TypeScript 5.6.2** - Type-safe JavaScript
- **Vite 5.4.21** - Build tool yang cepat

### UI & Styling
- **Tailwind CSS 3.4.17** - Utility-first CSS framework
- **shadcn/ui** - Komponen UI yang dapat disesuaikan
- **Lucide React** - Icon library
- **Recharts** - Library untuk visualisasi data

### State Management & Routing
- **React Router DOM 7.1.1** - Routing untuk SPA
- **Local Storage** - Penyimpanan data lokal

### Utilities
- **date-fns** - Manipulasi tanggal
- **jsPDF** - Generate PDF
- **jsPDF-AutoTable** - Tabel untuk PDF
- **html2canvas** - Screenshot HTML
- **Sonner** - Toast notifications

## 📦 Prasyarat

Sebelum memulai, pastikan Anda telah menginstall:

- **Node.js** (v16 atau lebih tinggi) - [Download](https://nodejs.org/)
- **pnpm** (Package Manager) - Install dengan: `npm install -g pnpm`
- **Git** (opsional, untuk version control) - [Download](https://git-scm.com/)

## 🚀 Instalasi

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/pharmacy-management-system.git
cd pharmacy-management-system
```

Atau download ZIP dan extract ke folder yang diinginkan.

### 2. Install Dependencies

```bash
pnpm install
```

Tunggu hingga semua dependencies terinstall (biasanya 2-5 menit).

## 💻 Menjalankan Aplikasi

### Development Mode

```bash
pnpm run dev
```

Aplikasi akan berjalan di: **http://localhost:5173**

### Preview Production Build

```bash
pnpm run build
pnpm run preview
```

## 🏗 Build untuk Production

```bash
pnpm run build
```

File production-ready akan dibuat di folder `dist/`.

### Lint Check

```bash
pnpm run lint
```

## 🌐 Deploy ke Netlify

### Metode 1: Drag & Drop (Termudah)

1. Build project:
```bash
pnpm run build
```

2. Buka [app.netlify.com](https://app.netlify.com)

3. Drag & drop folder `dist` ke Netlify

4. Selesai! ✅

### Metode 2: Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login ke Netlify
netlify login

# Build dan Deploy
pnpm run build
netlify deploy --prod
```

Pilih `dist` sebagai publish directory.

### Metode 3: GitHub Integration (Continuous Deployment)

1. Push project ke GitHub
2. Login ke [app.netlify.com](https://app.netlify.com)
3. Klik "Add new site" → "Import an existing project"
4. Pilih repository Anda
5. Konfigurasi:
   - **Build command:** `pnpm run build`
   - **Publish directory:** `dist`
6. Deploy!

Setiap push ke GitHub akan otomatis trigger rebuild dan deploy.

**📝 Catatan:** File `netlify.toml` sudah dikonfigurasi untuk deployment yang optimal.

## 📁 Struktur Project

```
pharmacy-management-system/
├── public/                      # Static assets
│   ├── favicon.svg
│   ├── robots.txt
│   └── _redirects              # Netlify redirects
├── src/
│   ├── components/             # React components
│   │   ├── layout/            # Layout components
│   │   │   └── Sidebar.tsx    # Dynamic sidebar with RBAC
│   │   └── ui/                # UI components (shadcn/ui)
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utilities & services
│   │   ├── backup.ts          # Backup functionality
│   │   ├── batch-utils.ts     # Batch management
│   │   ├── permissions.ts     # RBAC logic
│   │   ├── storage.ts         # Data management
│   │   └── utils.ts           # Helper functions
│   ├── pages/                  # Application pages
│   │   ├── Dashboard.tsx      # Main dashboard
│   │   ├── POS.tsx            # Point of Sale
│   │   ├── Obat.tsx           # Medicine management
│   │   ├── Pasien.tsx         # Patient management
│   │   ├── Resep.tsx          # Prescription management
│   │   ├── DigitalPrescription.tsx
│   │   ├── Stok.tsx           # Sales management
│   │   ├── Supplier.tsx       # Supplier management
│   │   ├── PurchaseOrder.tsx
│   │   ├── SupplierPerformance.tsx
│   │   ├── ReorderSuggestions.tsx
│   │   ├── StockOpname.tsx    # Stock adjustment
│   │   ├── Return.tsx         # Returns management
│   │   ├── Laporan.tsx        # Reports
│   │   ├── Reports.tsx        # Advanced reports
│   │   ├── User.tsx           # User management
│   │   ├── Settings.tsx       # System settings
│   │   └── Login.tsx          # Login page
│   ├── types/                  # TypeScript type definitions
│   │   └── index.ts
│   ├── App.tsx                 # Main app component with routing
│   ├── App.css                 # Global styles
│   └── main.tsx                # Entry point
├── .gitignore
├── components.json             # shadcn/ui config
├── eslint.config.js            # ESLint configuration
├── index.html                  # HTML template
├── netlify.toml                # Netlify configuration
├── package.json                # Dependencies
├── postcss.config.js           # PostCSS config
├── tailwind.config.ts          # Tailwind CSS config
├── tsconfig.json               # TypeScript config
├── vite.config.ts              # Vite configuration
├── README.md                   # This file
├── DEPLOYMENT_GUIDE.md         # Detailed deployment guide
├── QUICK_START.md              # Quick start guide
└── STOCK_OPNAME_GUIDE.md       # Stock opname guide
```

## 🔑 Kredensial Login

### Admin
- **Username:** `admin`
- **Password:** `admin123`
- **Akses:** Semua fitur

### Apoteker (Pharmacist)
- **Username:** `apoteker`
- **Password:** `apoteker123`
- **Akses:** Dashboard, Obat, Stock Opname

### Kasir (Cashier)
- **Username:** `kasir`
- **Password:** `kasir123`
- **Akses:** Dashboard, POS, Stok

**⚠️ Penting:** Ganti password default setelah login pertama kali!


## 🔧 Troubleshooting

### Error: "Command not found: pnpm"
```bash
npm install -g pnpm
```

### Error: Build gagal
```bash
# Hapus cache dan install ulang
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm run build
```

### Error: Port 5173 sudah digunakan
```bash
# Ubah port di vite.config.ts atau kill process yang menggunakan port tersebut
```

### Error: Routing tidak work setelah deploy
Pastikan file `netlify.toml` dan `public/_redirects` ada di project.

### Error: Data hilang setelah refresh
Data disimpan di Local Storage. Gunakan fitur backup untuk menyimpan data permanen.

## 🤝 Kontribusi

Kontribusi sangat diterima! Silakan:

1. Fork repository ini
2. Buat branch fitur baru (`git checkout -b feature/AmazingFeature`)
3. Commit perubahan (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

### Coding Standards
- Gunakan TypeScript untuk type safety
- Follow ESLint rules
- Write clean, readable code
- Add comments untuk logic yang kompleks
- Test fitur sebelum submit PR

## 📄 Lisensi

Project ini dilisensikan di bawah MIT License - lihat file [LICENSE](LICENSE) untuk detail.

## 👥 Tim Pengembang

- **Lead Developer** - Sistem Manajemen & RBAC
- **UI/UX Designer** - Interface Design
- **Backend Developer** - Data Management

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) - Komponen UI yang luar biasa
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework yang powerful
- [React](https://react.dev/) - Library UI terbaik
- [Vite](https://vitejs.dev/) - Build tool yang super cepat

## 📞 Support & Contact

Jika Anda memiliki pertanyaan atau butuh bantuan:

- 📧 Email: falikhrifqi69@gmail.com
- 🐛 Issues: [GitHub Issues](https://github.com/falikhnail/pharmacy-management-system/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/falikhnail/pharmacy-management-system/discussions)

## 🗺 Roadmap

### Version 2.0 (Planned)
- [ ] Multi-language support (English, Indonesian)
- [ ] Dark mode
- [ ] Mobile app (React Native)
- [ ] API integration untuk sistem eksternal
- [ ] Advanced analytics dengan AI
- [ ] Barcode scanner integration
- [ ] E-prescription integration
- [ ] Payment gateway integration

### Version 1.1 (In Progress)
- [x] Role-based access control
- [x] Stock opname feature
- [x] Batch & expiry tracking
- [x] Automatic backup
- [ ] Email notifications
- [ ] SMS notifications
- [ ] Advanced reporting

---

<div align="center">

**⭐ Jika project ini membantu Anda, berikan star di GitHub! ⭐**

Made with ❤️ by FalikhNail
</div>