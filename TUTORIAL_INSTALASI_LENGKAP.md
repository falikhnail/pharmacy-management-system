# Tutorial Instalasi Lengkap - Pharmacy Management System

Panduan lengkap instalasi sistem manajemen farmasi dari awal hingga aplikasi dapat dijalankan.

## Daftar Isi
- [1. Persiapan Awal](#1-persiapan-awal)
- [2. Instalasi Node.js dan pnpm](#2-instalasi-nodejs-dan-pnpm)
- [3. Setup Project React dengan Vite](#3-setup-project-react-dengan-vite)
- [4. Instalasi dan Konfigurasi Tailwind CSS](#4-instalasi-dan-konfigurasi-tailwind-css)
- [5. Instalasi dan Setup shadcn/ui](#5-instalasi-dan-setup-shadcnui)
- [6. Instalasi Dependencies Project](#6-instalasi-dependencies-project)
- [7. Menjalankan Aplikasi](#7-menjalankan-aplikasi)
- [8. Troubleshooting](#8-troubleshooting)
- [9. Tips dan Best Practices](#9-tips-dan-best-practices)
- [10. Resources dan Dokumentasi](#10-resources-dan-dokumentasi)

---

## 1. Persiapan Awal

### System Requirements
- **Operating System**: Windows 10/11, macOS 10.15+, atau Linux (Ubuntu 20.04+)
- **RAM**: Minimal 4GB (disarankan 8GB)
- **Storage**: Minimal 2GB ruang kosong
- **Internet**: Koneksi stabil untuk download dependencies

### Tools yang Dibutuhkan
- ✅ Node.js (v16 atau lebih tinggi)
- ✅ pnpm (Package Manager)
- ✅ Git (opsional, untuk version control)
- ✅ Code Editor (disarankan VS Code)
- ✅ Browser modern (Chrome, Firefox, Edge, atau Safari)

---

## 2. Instalasi Node.js dan pnpm

### Windows

#### Instalasi Node.js
1. **Download Node.js**
   - Kunjungi https://nodejs.org/
   - Download versi LTS (Long Term Support)
   - Pilih installer Windows (.msi)

2. **Install Node.js**
   ```
   - Jalankan file installer yang sudah didownload
   - Klik "Next" pada welcome screen
   - Accept license agreement
   - Pilih lokasi instalasi (default: C:\Program Files\nodejs)
   - Pastikan "Add to PATH" tercentang
   - Klik "Install"
   - Tunggu hingga selesai
   ```

3. **Verifikasi Instalasi**
   ```bash
   # Buka Command Prompt atau PowerShell
   node --version
   # Output: v18.x.x atau v20.x.x
   
   npm --version
   # Output: 9.x.x atau 10.x.x
   ```

#### Instalasi pnpm
```bash
# Menggunakan npm (sudah terinstall dengan Node.js)
npm install -g pnpm

# Verifikasi instalasi
pnpm --version
# Output: 8.x.x atau 9.x.x
```

### macOS

#### Instalasi Node.js
**Metode 1: Menggunakan Official Installer**
1. Download dari https://nodejs.org/
2. Jalankan file .pkg
3. Ikuti wizard instalasi

**Metode 2: Menggunakan Homebrew (Disarankan)**
```bash
# Install Homebrew jika belum ada
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node

# Verifikasi
node --version
npm --version
```

#### Instalasi pnpm
```bash
# Menggunakan npm
npm install -g pnpm

# Atau menggunakan Homebrew
brew install pnpm

# Verifikasi
pnpm --version
```

### Linux (Ubuntu/Debian)

#### Instalasi Node.js
```bash
# Update package list
sudo apt update

# Install Node.js dari NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verifikasi
node --version
npm --version
```

#### Instalasi pnpm
```bash
# Menggunakan npm
sudo npm install -g pnpm

# Atau menggunakan curl
curl -fsSL https://get.pnpm.io/install.sh | sh -

# Verifikasi
pnpm --version
```

---

## 3. Setup Project React dengan Vite

### Membuat Project Baru (Jika Mulai dari Awal)

```bash
# Buat project React dengan Vite
pnpm create vite@latest pharmacy-management-system --template react-ts

# Masuk ke direktori project
cd pharmacy-management-system

# Install dependencies
pnpm install

# Jalankan development server untuk test
pnpm run dev
```

### Struktur Project Awal
```
pharmacy-management-system/
├── node_modules/          # Dependencies (auto-generated)
├── public/                # Static assets
├── src/                   # Source code
│   ├── App.css           # App styles
│   ├── App.tsx           # Main component
│   ├── main.tsx          # Entry point
│   └── index.css         # Global styles
├── index.html            # HTML template
├── package.json          # Project metadata
├── tsconfig.json         # TypeScript config
├── vite.config.ts        # Vite config
└── .gitignore            # Git ignore rules
```

---

## 4. Instalasi dan Konfigurasi Tailwind CSS

### Step 1: Install Dependencies
```bash
pnpm install -D tailwindcss postcss autoprefixer
```

### Step 2: Generate Config Files
```bash
npx tailwindcss init -p
```

Ini akan membuat:
- `tailwind.config.js`
- `postcss.config.js`

### Step 3: Konfigurasi Tailwind
Edit `tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### Step 4: Update CSS
Edit `src/index.css` dan tambahkan Tailwind directives:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Step 5: Test Tailwind
Edit `src/App.tsx` untuk test:
```tsx
function App() {
  return (
    <div className="min-h-screen bg-blue-500 flex items-center justify-center">
      <h1 className="text-4xl font-bold text-white">
        Tailwind CSS Working!
      </h1>
    </div>
  )
}

export default App
```

Jalankan `pnpm run dev` dan buka browser untuk melihat hasilnya.

---

## 5. Instalasi dan Setup shadcn/ui

### Step 1: Install shadcn/ui CLI
```bash
pnpm dlx shadcn-ui@latest init
```

### Step 2: Konfigurasi Interaktif
Jawab pertanyaan berikut:
```
✔ Would you like to use TypeScript? … yes
✔ Which style would you like to use? › Default
✔ Which color would you like to use as base color? › Slate
✔ Where is your global CSS file? … src/index.css
✔ Would you like to use CSS variables for colors? … yes
✔ Where is your tailwind.config.js located? … tailwind.config.ts
✔ Configure the import alias for components: … @/components
✔ Configure the import alias for utils: … @/lib/utils
✔ Are you using React Server Components? … no
```

### Step 3: Update tsconfig.json
Pastikan `tsconfig.json` memiliki path aliases:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Step 4: Update vite.config.ts
```typescript
import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
```

### Step 5: Install Komponen yang Dibutuhkan
```bash
# Install komponen shadcn/ui satu per satu
pnpm dlx shadcn-ui@latest add button
pnpm dlx shadcn-ui@latest add card
pnpm dlx shadcn-ui@latest add input
pnpm dlx shadcn-ui@latest add label
pnpm dlx shadcn-ui@latest add table
pnpm dlx shadcn-ui@latest add dialog
pnpm dlx shadcn-ui@latest add select
pnpm dlx shadcn-ui@latest add tabs
pnpm dlx shadcn-ui@latest add badge
pnpm dlx shadcn-ui@latest add alert
pnpm dlx shadcn-ui@latest add dropdown-menu
pnpm dlx shadcn-ui@latest add toast
pnpm dlx shadcn-ui@latest add switch
pnpm dlx shadcn-ui@latest add calendar
pnpm dlx shadcn-ui@latest add popover
pnpm dlx shadcn-ui@latest add form
pnpm dlx shadcn-ui@latest add checkbox
pnpm dlx shadcn-ui@latest add textarea
pnpm dlx shadcn-ui@latest add avatar
pnpm dlx shadcn-ui@latest add separator
```

---

## 6. Instalasi Dependencies Project

### Install Semua Dependencies Sekaligus
```bash
# Core dependencies
pnpm install react-router-dom lucide-react sonner date-fns

# Form handling
pnpm install react-hook-form @hookform/resolvers zod

# PDF generation
pnpm install jspdf

# Charts
pnpm install recharts

# Radix UI components (untuk shadcn/ui)
pnpm install @radix-ui/react-dialog
pnpm install @radix-ui/react-dropdown-menu
pnpm install @radix-ui/react-label
pnpm install @radix-ui/react-select
pnpm install @radix-ui/react-separator
pnpm install @radix-ui/react-slot
pnpm install @radix-ui/react-switch
pnpm install @radix-ui/react-tabs
pnpm install @radix-ui/react-toast
pnpm install @radix-ui/react-popover
pnpm install @radix-ui/react-avatar
pnpm install @radix-ui/react-checkbox

# Utilities
pnpm install class-variance-authority clsx tailwind-merge

# Dev dependencies
pnpm install -D @types/node
pnpm install -D @types/react
pnpm install -D @types/react-dom
pnpm install -D typescript
pnpm install -D vite
pnpm install -D @vitejs/plugin-react
pnpm install -D tailwindcss
pnpm install -D postcss
pnpm install -D autoprefixer
pnpm install -D eslint
```

### Verifikasi package.json
Setelah instalasi, `package.json` harus terlihat seperti ini:
```json
{
  "name": "pharmacy-management-system",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "lucide-react": "^0.294.0",
    "sonner": "^1.2.0",
    "date-fns": "^2.30.0",
    "jspdf": "^2.5.1",
    "recharts": "^2.10.3",
    "react-hook-form": "^7.48.2",
    "@hookform/resolvers": "^3.3.2",
    "zod": "^3.22.4",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-separator": "^1.0.3",
    "@radix-ui/react-slot": "^1.0.2",
    "@radix-ui/react-switch": "^1.0.3",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-toast": "^1.1.5",
    "@radix-ui/react-popover": "^1.0.7",
    "@radix-ui/react-avatar": "^1.0.4",
    "@radix-ui/react-checkbox": "^1.0.4",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.1.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.2.2",
    "vite": "^5.0.0",
    "tailwindcss": "^3.3.6",
    "postcss": "^8.4.32",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.55.0"
  }
}
```

---

## 7. Menjalankan Aplikasi

### Jika Clone/Copy Project yang Sudah Ada

#### Step 1: Clone atau Copy Project
```bash
# Jika menggunakan Git
git clone <repository-url>
cd pharmacy-management-system

# Atau copy folder project ke komputer Anda
```

#### Step 2: Install Dependencies
```bash
# Pastikan Anda berada di root directory project
pnpm install
```

Proses ini akan:
- Download semua dependencies yang tercantum di `package.json`
- Membuat folder `node_modules`
- Generate `pnpm-lock.yaml`
- Biasanya memakan waktu 2-5 menit tergantung koneksi internet

#### Step 3: Jalankan Development Server
```bash
pnpm run dev
```

Output yang diharapkan:
```
VITE v5.0.0  ready in 500 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
➜  press h to show help
```

#### Step 4: Akses Aplikasi
1. Buka browser
2. Kunjungi `http://localhost:5173/`
3. Anda akan melihat halaman login

#### Step 5: Login dengan Credentials Default
```
Admin:
- Username: admin
- Password: admin123

Pharmacist:
- Username: pharmacist
- Password: pharma123

Cashier:
- Username: cashier
- Password: cashier123
```

### Build untuk Production

```bash
# Build aplikasi
pnpm run build

# Preview production build
pnpm run preview
```

Build akan menghasilkan folder `dist/` yang berisi file-file optimized untuk production.

---

## 8. Troubleshooting

### Problem 1: Command 'pnpm' not found
**Solusi:**
```bash
# Install pnpm secara global
npm install -g pnpm

# Atau restart terminal/command prompt setelah instalasi
```

### Problem 2: Port 5173 sudah digunakan
**Solusi:**
```bash
# Ubah port di vite.config.ts
export default defineConfig({
  server: {
    port: 3000, // Ganti dengan port lain
  },
})
```

### Problem 3: Module not found errors
**Solusi:**
```bash
# Hapus node_modules dan install ulang
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Problem 4: TypeScript errors
**Solusi:**
```bash
# Update TypeScript
pnpm update typescript

# Atau install versi spesifik
pnpm install -D typescript@5.2.2
```

### Problem 5: Tailwind styles tidak muncul
**Solusi:**
1. Pastikan `@tailwind` directives ada di `src/index.css`
2. Restart development server
3. Clear browser cache (Ctrl+Shift+R atau Cmd+Shift+R)

### Problem 6: shadcn/ui components error
**Solusi:**
```bash
# Install ulang komponen yang error
pnpm dlx shadcn-ui@latest add button --overwrite

# Atau install semua komponen ulang
```

### Problem 7: Build fails
**Solusi:**
```bash
# Check TypeScript errors
pnpm run lint

# Fix linting issues
pnpm run lint --fix

# Clear cache dan rebuild
rm -rf dist node_modules
pnpm install
pnpm run build
```

### Problem 8: Cannot find module '@/...'
**Solusi:**
Pastikan `vite.config.ts` memiliki alias configuration:
```typescript
resolve: {
  alias: {
    "@": path.resolve(__dirname, "./src"),
  },
}
```

---

## 9. Tips dan Best Practices

### VS Code Extensions (Disarankan)
```
1. ESLint - Linting JavaScript/TypeScript
2. Prettier - Code formatter
3. Tailwind CSS IntelliSense - Autocomplete untuk Tailwind
4. TypeScript Vue Plugin (Volar) - TypeScript support
5. Path Intellisense - Autocomplete file paths
6. Auto Rename Tag - Rename HTML tags
7. ES7+ React/Redux/React-Native snippets - Code snippets
```

### Setup Prettier
Buat `.prettierrc` di root directory:
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": false,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

### Setup ESLint
File `eslint.config.js` sudah ada, pastikan berisi:
```javascript
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
)
```

### Git Setup
```bash
# Initialize Git
git init

# Add .gitignore
echo "node_modules
dist
.env
.DS_Store
*.log" > .gitignore

# First commit
git add .
git commit -m "Initial commit"
```

### Development Workflow
1. **Selalu gunakan branch untuk fitur baru**
   ```bash
   git checkout -b feature/nama-fitur
   ```

2. **Commit secara berkala**
   ```bash
   git add .
   git commit -m "Add: deskripsi perubahan"
   ```

3. **Test sebelum push**
   ```bash
   pnpm run lint
   pnpm run build
   ```

---

## 10. Resources dan Dokumentasi

### Official Documentation
- **React**: https://react.dev/
- **Vite**: https://vitejs.dev/
- **Tailwind CSS**: https://tailwindcss.com/docs
- **shadcn/ui**: https://ui.shadcn.com/
- **TypeScript**: https://www.typescriptlang.org/docs/
- **React Router**: https://reactrouter.com/
- **pnpm**: https://pnpm.io/

### Video Tutorials (Bahasa Indonesia)
- **React + Vite**: https://www.youtube.com/results?search_query=react+vite+tutorial+indonesia
- **Tailwind CSS**: https://www.youtube.com/results?search_query=tailwind+css+tutorial+indonesia
- **shadcn/ui**: https://www.youtube.com/results?search_query=shadcn+ui+tutorial

### Community & Support
- **React Discord**: https://discord.gg/react
- **Tailwind Discord**: https://discord.gg/tailwindcss
- **Stack Overflow**: https://stackoverflow.com/questions/tagged/reactjs

---

## Checklist Instalasi

Gunakan checklist ini untuk memastikan semua langkah sudah dilakukan:

- [ ] Node.js terinstall (versi 16+)
- [ ] pnpm terinstall
- [ ] Project React dengan Vite sudah dibuat
- [ ] Tailwind CSS terinstall dan terkonfigurasi
- [ ] shadcn/ui terinstall dan terkonfigurasi
- [ ] Semua dependencies terinstall
- [ ] Development server berjalan tanpa error
- [ ] Bisa login ke aplikasi
- [ ] Build production berhasil
- [ ] VS Code extensions terinstall (opsional)
- [ ] Git tersetup (opsional)

---

## Struktur Project Lengkap

```
pharmacy-management-system/
├── node_modules/                    # Dependencies (auto-generated)
├── public/                          # Static assets
│   └── _redirects                   # Netlify redirects
├── src/                             # Source code
│   ├── components/                  # Reusable UI components
│   │   ├── ui/                      # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── table.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── select.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── alert.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── switch.tsx
│   │   │   ├── calendar.tsx
│   │   │   ├── popover.tsx
│   │   │   ├── form.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── avatar.tsx
│   │   │   └── separator.tsx
│   │   ├── Layout.tsx               # Main layout component
│   │   ├── Sidebar.tsx              # Sidebar navigation
│   │   └── ProtectedRoute.tsx       # Route protection
│   ├── hooks/                       # Custom React hooks
│   │   └── use-toast.ts             # Toast notification hook
│   ├── lib/                         # Utility functions
│   │   ├── storage.ts               # LocalStorage management
│   │   ├── permissions.ts           # Role-based permissions
│   │   └── utils.ts                 # Helper functions
│   ├── pages/                       # Application pages
│   │   ├── Login.tsx                # Login page
│   │   ├── Dashboard.tsx            # Dashboard page
│   │   ├── Users.tsx                # User management
│   │   ├── Patients.tsx             # Patient management
│   │   ├── Prescriptions.tsx        # Prescription management
│   │   ├── Inventory.tsx            # Inventory management
│   │   ├── Sales.tsx                # Sales/POS page
│   │   ├── PurchaseOrders.tsx       # Purchase order management
│   │   ├── SupplierPerformance.tsx  # Supplier analytics
│   │   ├── StockOpname.tsx          # Stock opname
│   │   ├── Reports.tsx              # Reports page
│   │   ├── Analytics.tsx            # Analytics dashboard
│   │   ├── Settings.tsx             # Settings page
│   │   ├── Notifications.tsx        # Notification center
│   │   └── ActivityLog.tsx          # Activity logging
│   ├── types/                       # TypeScript type definitions
│   │   └── index.ts                 # All type definitions
│   ├── App.css                      # Global styles
│   ├── App.tsx                      # Main App component
│   ├── index.css                    # Tailwind directives
│   └── main.tsx                     # Entry point
├── .gitignore                       # Git ignore rules
├── components.json                  # shadcn/ui config
├── eslint.config.js                 # ESLint configuration
├── index.html                       # HTML template
├── netlify.toml                     # Netlify configuration
├── package.json                     # Project metadata
├── postcss.config.js                # PostCSS configuration
├── tailwind.config.ts               # Tailwind configuration
├── tsconfig.json                    # TypeScript configuration
├── vite.config.ts                   # Vite configuration
├── README.md                        # Project documentation
├── INSTALLATION_GUIDE.md            # Installation guide
├── DEPLOYMENT_GUIDE.md              # Deployment guide
├── QUICK_START.md                   # Quick start guide
├── STOCK_OPNAME_GUIDE.md            # Stock opname guide
└── TUTORIAL_INSTALASI_LENGKAP.md    # This file
```

---

## Selamat! 🎉

Anda telah berhasil menginstall dan menjalankan Pharmacy Management System!

Jika mengalami masalah, silakan:
1. Cek bagian Troubleshooting di atas
2. Baca dokumentasi official dari teknologi yang digunakan
3. Cari solusi di Stack Overflow atau forum developer lainnya

**Happy Coding!** 💻✨