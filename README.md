# Trading Journal · Risk & Reward

Dashboard jurnal trading untuk saham & kripto dengan analisis risk/reward, position sizing, money management, dan tracking pertumbuhan modal harian/bulanan/tahunan.

## Fitur

- **Jurnal Trade** — catat trade saham & kripto (long/short) dengan entry, SL, TP, qty
- **Harga Real-time** — auto-fetch harga dari Binance/Coinbase/CoinGecko (kripto) dan Yahoo Finance via CORS proxy (saham US & IDX)
- **Money Management** — kalkulator position sizing otomatis berdasarkan % risk per trade
- **Analitik** — win rate, profit factor, R-multiple, equity curve, distribusi hasil
- **Modal/Pertumbuhan** — track equity harian, bulanan, tahunan dengan grafik
- **Edit Trade** — bisa edit semua data trade (open maupun closed)
- **Multi Currency** — toggle tampilan USD ↔ IDR
- **Data Lokal** — tersimpan di `localStorage` browser (tidak ada backend, privacy aman)

## Setup

```bash
# Install dependencies
npm install

# Run dev server (http://localhost:5173)
npm run dev

# Build untuk production
npm run build

# Preview build hasil production
npm run preview
```

## Deploy ke GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/USERNAME/REPO_NAME.git
git push -u origin main
```

## Deploy Public (gratis)

### Vercel (paling gampang)
1. Push ke GitHub dulu
2. Buka https://vercel.com → Import Project → pilih repo Anda
3. Vercel auto-detect Vite, klik Deploy. Selesai.

### Netlify
1. Push ke GitHub dulu
2. Buka https://app.netlify.com → New site from Git → pilih repo
3. Build command: `npm run build`, publish directory: `dist`

### GitHub Pages
1. Edit `vite.config.js`, uncomment & isi `base: "/REPO_NAME/"`
2. Build: `npm run build`
3. Push folder `dist/` ke branch `gh-pages`, atau pakai GitHub Actions

## Catatan Penggunaan

### Simbol yang didukung
- **Kripto**: `BTC`, `ETH`, `SOL`, `XRP`, `BNB`, `DOGE`, `ADA`, dll. — pakai simbol pendek tanpa `USDT`
- **Saham US**: ticker biasa seperti `AAPL`, `TSLA`, `NVDA`, `MSFT`
- **Saham IDX**: wajib akhiran `.JK` — contoh `BBCA.JK`, `BBRI.JK`, `TLKM.JK`, `BMRI.JK`

### Money Management
Setiap trade baru otomatis menghitung position size berdasarkan:
```
Qty = (Modal × Risk%) ÷ |Entry − Stop Loss|
```
Contoh: Modal $10.000, risk 1%, entry BTC $60.000, SL $58.500 → otomatis qty = 0.0667 BTC (risk = $100)

### Currency
Toggle USD/IDR di tab Modal **hanya mengubah label tampilan**, bukan konversi. Sesuaikan ukuran modal manual setelah ganti currency.

## Tech Stack

- React 18
- Vite 5
- Recharts (grafik)
- Lucide React (icons)
- localStorage (persistensi)

## Lisensi

Bebas dipakai untuk pribadi.
