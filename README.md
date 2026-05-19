# 📊 Trading Journal

Dashboard jurnal trading dengan analisis **Risk & Reward**, kalkulator **position sizing**, dan **tracking pertumbuhan modal** harian/bulanan/tahunan untuk saham dan kripto.

![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite&logoColor=white)

## ✨ Fitur

- **Jurnal Trading** — catat trade saham & kripto dengan entry, SL, TP, qty
- **Live Price** — harga real-time dari Binance, Coinbase, CoinGecko, Yahoo Finance
- **Risk/Reward Analysis** — auto-hitung R:R, R-multiple, expectancy, profit factor
- **Money Management** — kalkulator posisi berbasis % risiko akun (USD/IDR)
- **Pertumbuhan Modal** — tracking harian, bulanan, tahunan dengan equity curve
- **Analitik** — win rate, distribusi R-multiple, equity curve
- **Edit & Delete** — bisa edit trade yang sudah masuk, termasuk yang sudah closed
- **Persistent Storage** — data tersimpan di browser (localStorage)

## 🚀 Setup di GitHub (Auto-Deploy ke GitHub Pages)

### 1. Buat repository GitHub baru

Buka https://github.com/new dan buat repo baru, contoh nama: `trading-journal`. Set **Public** (gratis Pages butuh public).

### 2. Push code ke repo

Di folder project ini, jalankan di terminal:

```bash
git init
git add .
git commit -m "Initial commit: trading journal"
git branch -M main
git remote add origin https://github.com/USERNAME/trading-journal.git
git push -u origin main
```

Ganti `USERNAME` dengan username GitHub Anda.

### 3. Aktifkan GitHub Pages

1. Buka repo di GitHub → klik tab **Settings**
2. Sidebar kiri → klik **Pages**
3. Bagian **Source** → pilih **GitHub Actions**

### 4. Tunggu deployment selesai

1. Klik tab **Actions** di repo
2. Tunggu workflow "Deploy to GitHub Pages" selesai (warna hijau, ~1-2 menit)
3. Akses aplikasi di: **https://USERNAME.github.io/trading-journal/**

Setiap kali Anda `git push`, GitHub Actions akan auto-build & deploy ulang. 🎉

## 💻 Development Lokal

Butuh **Node.js 18+** terinstall.

```bash
# Install dependencies
npm install

# Jalankan dev server (biasanya di http://localhost:5173)
npm run dev

# Build untuk production
npm run build

# Preview production build
npm run preview
```

## 📁 Struktur Project

```
trading-journal/
├── .github/workflows/deploy.yml   # Auto-deploy ke GitHub Pages
├── public/                        # Static assets
├── src/
│   ├── App.jsx                    # Main app (semua komponen)
│   ├── main.jsx                   # React entry point
│   └── index.css                  # Global styles
├── index.html                     # HTML template
├── package.json
├── vite.config.js                 # Vite config (base: "./")
└── README.md
```

## 🔌 Sumber Data Harga

App melakukan fetch ke API publik berikut secara langsung dari browser:

**Kripto** (fallback berurutan):
1. Binance API (`api.binance.com`)
2. Coinbase API (`api.coinbase.com`)
3. CoinGecko API (`api.coingecko.com`)

**Saham** (Yahoo Finance via 3 CORS proxy berurutan):
1. `corsproxy.io`
2. `api.allorigins.win`
3. `api.codetabs.com`

Tidak ada API key yang dibutuhkan. Semua dipakai gratis dengan rate limit.

### Format Simbol

- **Kripto**: BTC, ETH, SOL, BNB, XRP, DOGE, dst (tanpa USDT)
- **Saham US**: AAPL, TSLA, NVDA, MSFT, GOOGL, dst
- **Saham IDX**: tambahkan `.JK` → BBCA.JK, BBRI.JK, TLKM.JK, BMRI.JK, dst

## 💾 Data Storage

Semua data disimpan di **browser localStorage**. Artinya:

- ✅ Tidak butuh backend, gratis hosting di GitHub Pages
- ✅ Data privacy 100% (cuma di device Anda)
- ⚠️ Data tidak sync antar device/browser
- ⚠️ Clear browser data = data hilang

Untuk backup, kosongkan localStorage `trades:all` dan `settings:account` lewat DevTools jika perlu pindah device.

## 🎨 Tech Stack

- **React 18** — UI library
- **Vite 5** — build tool
- **Recharts** — chart library
- **Lucide React** — icons
- **Inline styles + Google Fonts** — Fraunces (serif), JetBrains Mono, Manrope

## 📝 Tips Penggunaan

1. **Set Modal Awal & Currency** dulu di tab "Modal" — pilih USD atau IDR
2. **Set Risiko per Trade** di tab "Risiko" (umumnya 1-2% per trade)
3. **Tambah Trade**: tap "Trade Baru", isi simbol, tap "Cek Harga", isi SL & TP
4. **Pakai Position Sizer**: tap "Pakai Qty" untuk auto-fill quantity berdasarkan risk %
5. **Sync Harga**: tap tombol "Sync" untuk update harga semua open trade sekaligus
6. **Tutup Trade**: tap "Tutup Trade" lalu isi exit price untuk realisasi P/L
7. **Review**: cek tab "Analitik" untuk performance, "Modal" untuk pertumbuhan

## 📄 License

MIT — bebas dipakai dan dimodif.
