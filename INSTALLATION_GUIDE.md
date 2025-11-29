# 📦 Panduan Instalasi Lengkap - Pharmacy Management System

Panduan step-by-step untuk membuat project React dengan Vite, TypeScript, Tailwind CSS, dan shadcn/ui dari awal.

## 📋 Daftar Isi

1. [Persiapan Environment](#1-persiapan-environment)
2. [Membuat Project React dengan Vite](#2-membuat-project-react-dengan-vite)
3. [Setup TypeScript](#3-setup-typescript)
4. [Setup Tailwind CSS](#4-setup-tailwind-css)
5. [Setup shadcn/ui](#5-setup-shadcnui)
6. [Setup React Router](#6-setup-react-router)
7. [Setup Dependencies Tambahan](#7-setup-dependencies-tambahan)
8. [Konfigurasi Project](#8-konfigurasi-project)
9. [Membuat Struktur Folder](#9-membuat-struktur-folder)
10. [Menjalankan Project](#10-menjalankan-project)

---

## 1. Persiapan Environment

### 1.1 Install Node.js

1. Download Node.js dari [nodejs.org](https://nodejs.org/)
2. Pilih versi **LTS (Long Term Support)** - minimal v16
3. Jalankan installer dan ikuti instruksi
4. Verifikasi instalasi:

```bash
node --version
# Output: v18.x.x atau lebih tinggi

npm --version
# Output: 9.x.x atau lebih tinggi
```

### 1.2 Install pnpm (Package Manager)

```bash
npm install -g pnpm
```

Verifikasi instalasi:
```bash
pnpm --version
# Output: 8.x.x atau lebih tinggi
```

**Kenapa pnpm?**
- ✅ Lebih cepat dari npm
- ✅ Hemat disk space
- ✅ Strict dependency management

### 1.3 Install Git (Opsional tapi Direkomendasikan)

Download dari [git-scm.com](https://git-scm.com/) dan install.

Verifikasi:
```bash
git --version
# Output: git version 2.x.x
```

### 1.4 Install Code Editor

Rekomendasi: **Visual Studio Code**
- Download dari [code.visualstudio.com](https://code.visualstudio.com/)
- Install extensions yang direkomendasikan:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - TypeScript Vue Plugin (Volar)

---

## 2. Membuat Project React dengan Vite

### 2.1 Buat Folder Project

```bash
# Buat folder untuk project
mkdir pharmacy-management-system
cd pharmacy-management-system
```

### 2.2 Inisialisasi Project dengan Vite

```bash
pnpm create vite@latest . --template react-ts
```

**Penjelasan:**
- `pnpm create vite@latest` - Membuat project Vite terbaru
- `.` - Install di folder saat ini
- `--template react-ts` - Gunakan template React + TypeScript

**Alternatif (jika folder belum dibuat):**
```bash
pnpm create vite@latest pharmacy-management-system --template react-ts
cd pharmacy-management-system
```

### 2.3 Install Dependencies Dasar

```bash
pnpm install
```

Tunggu hingga selesai (biasanya 1-2 menit).

### 2.4 Test Run Project

```bash
pnpm run dev
```

Buka browser dan akses: `http://localhost:5173`

Jika muncul halaman Vite + React, berarti berhasil! ✅

Tekan `Ctrl + C` untuk stop server.

---

## 3. Setup TypeScript

TypeScript sudah terinstall otomatis dengan template `react-ts`.

### 3.1 Konfigurasi tsconfig.json

Buka file `tsconfig.json` dan pastikan konfigurasi seperti ini:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

**Path alias `@/*`** memungkinkan import seperti:
```typescript
import { Button } from '@/components/ui/button'
// Daripada: import { Button } from '../../../components/ui/button'
```

---

## 4. Setup Tailwind CSS

### 4.1 Install Tailwind CSS

```bash
pnpm install -D tailwindcss postcss autoprefixer
```

### 4.2 Inisialisasi Tailwind

```bash
npx tailwindcss init -p
```

Ini akan membuat:
- `tailwind.config.js`
- `postcss.config.js`

### 4.3 Konfigurasi Tailwind

Edit `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))'
        }
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
}
```

### 4.4 Setup CSS Global

Edit `src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
    --chart-1: 12 76% 61%;
    --chart-2: 173 58% 39%;
    --chart-3: 197 37% 24%;
    --chart-4: 43 74% 66%;
    --chart-5: 27 87% 67%;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
    --chart-1: 220 70% 50%;
    --chart-2: 160 60% 45%;
    --chart-3: 30 80% 55%;
    --chart-4: 280 65% 60%;
    --chart-5: 340 75% 55%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

---

## 5. Setup shadcn/ui

### 5.1 Install Dependencies shadcn/ui

```bash
pnpm install class-variance-authority clsx tailwind-merge
pnpm install -D tailwindcss-animate
```

### 5.2 Setup Path Alias di vite.config.ts

Edit `vite.config.ts`:

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

### 5.3 Install @types/node

```bash
pnpm install -D @types/node
```

### 5.4 Buat File lib/utils.ts

```bash
mkdir -p src/lib
```

Buat file `src/lib/utils.ts`:

```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### 5.5 Buat components.json

Buat file `components.json` di root project:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/index.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

### 5.6 Install Komponen shadcn/ui

Sekarang Anda bisa install komponen yang dibutuhkan:

```bash
# Install komponen satu per satu
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add table
npx shadcn@latest add dialog
npx shadcn@latest add select
npx shadcn@latest add toast
npx shadcn@latest add dropdown-menu
npx shadcn@latest add separator
npx shadcn@latest add scroll-area
npx shadcn@latest add badge
npx shadcn@latest add tabs
npx shadcn@latest add alert
```

Atau install semua sekaligus:

```bash
npx shadcn@latest add button card input label table dialog select toast dropdown-menu separator scroll-area badge tabs alert
```

---

## 6. Setup React Router

### 6.1 Install React Router

```bash
pnpm install react-router-dom
```

### 6.2 Install Types

```bash
pnpm install -D @types/react-router-dom
```

---

## 7. Setup Dependencies Tambahan

### 7.1 Install Dependencies untuk Pharmacy System

```bash
# Icons
pnpm install lucide-react

# Toast Notifications
pnpm install sonner

# Date Utilities
pnpm install date-fns

# PDF Generation
pnpm install jspdf jspdf-autotable

# Screenshot
pnpm install html2canvas

# Charts
pnpm install recharts

# Types
pnpm install -D @types/jspdf
```

### 7.2 Verifikasi package.json

Setelah semua instalasi, `package.json` Anda harus terlihat seperti ini:

```json
{
  "name": "pharmacy-management-system",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^7.1.1",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.6.0",
    "lucide-react": "^0.468.0",
    "sonner": "^1.7.1",
    "date-fns": "^4.1.0",
    "jspdf": "^2.5.2",
    "jspdf-autotable": "^3.8.4",
    "html2canvas": "^1.4.1",
    "recharts": "^2.15.0",
    "@radix-ui/react-dialog": "^1.1.2",
    "@radix-ui/react-dropdown-menu": "^2.1.2",
    "@radix-ui/react-label": "^2.1.1",
    "@radix-ui/react-scroll-area": "^1.2.2",
    "@radix-ui/react-select": "^2.1.2",
    "@radix-ui/react-separator": "^1.1.1",
    "@radix-ui/react-slot": "^1.1.1",
    "@radix-ui/react-tabs": "^1.1.1",
    "@radix-ui/react-toast": "^1.2.2"
  },
  "devDependencies": {
    "@types/node": "^22.10.2",
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "@types/jspdf": "^2.0.0",
    "@typescript-eslint/eslint-plugin": "^8.18.1",
    "@typescript-eslint/parser": "^8.18.1",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "eslint": "^9.17.0",
    "eslint-plugin-react-hooks": "^5.0.0",
    "eslint-plugin-react-refresh": "^0.4.16",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.17",
    "tailwindcss-animate": "^1.0.7",
    "typescript": "^5.6.2",
    "vite": "^5.4.21"
  }
}
```

---

## 8. Konfigurasi Project

### 8.1 Setup ESLint

Buat file `eslint.config.js`:

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

### 8.2 Setup PostCSS

File `postcss.config.js` sudah dibuat otomatis, pastikan isinya:

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### 8.3 Update index.html

Edit `index.html`:

```html
<!doctype html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Pharmacy Management System</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

---

## 9. Membuat Struktur Folder

### 9.1 Buat Struktur Folder

```bash
# Buat folder struktur
mkdir -p src/components/layout
mkdir -p src/components/ui
mkdir -p src/hooks
mkdir -p src/lib
mkdir -p src/pages
mkdir -p src/types
mkdir -p public
```

### 9.2 Struktur Akhir

```
pharmacy-management-system/
├── public/
│   ├── favicon.svg
│   ├── robots.txt
│   └── _redirects
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   └── Sidebar.tsx
│   │   └── ui/
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── input.tsx
│   │       └── ... (komponen shadcn/ui lainnya)
│   ├── hooks/
│   │   └── (custom hooks)
│   ├── lib/
│   │   ├── utils.ts
│   │   ├── storage.ts
│   │   ├── permissions.ts
│   │   └── backup.ts
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Login.tsx
│   │   ├── Obat.tsx
│   │   └── ... (pages lainnya)
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   ├── App.css
│   ├── index.css
│   └── main.tsx
├── .gitignore
├── components.json
├── eslint.config.js
├── index.html
├── package.json
├── postcss.config.js
├── README.md
├── tailwind.config.ts
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

---

## 10. Menjalankan Project

### 10.1 Development Mode

```bash
pnpm run dev
```

Akses: `http://localhost:5173`

### 10.2 Build Production

```bash
pnpm run build
```

Output akan ada di folder `dist/`

### 10.3 Preview Production Build

```bash
pnpm run preview
```

### 10.4 Lint Check

```bash
pnpm run lint
```

---

## 🎉 Selesai!

Project React + TypeScript + Tailwind CSS + shadcn/ui Anda sudah siap!

### Langkah Selanjutnya:

1. **Copy source code** dari Pharmacy Management System yang sudah ada
2. **Sesuaikan konfigurasi** jika diperlukan
3. **Test aplikasi** dengan `pnpm run dev`
4. **Build dan deploy** ke Netlify

### Tips:

- Gunakan Git untuk version control
- Commit secara berkala
- Buat branch untuk fitur baru
- Test sebelum deploy

---

## 📚 Referensi

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [React Router Documentation](https://reactrouter.com/)

---

**Butuh bantuan?** Lihat dokumentasi lainnya:
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- [QUICK_START.md](./QUICK_START.md)
- [README.md](./README.md)