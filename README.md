# Manajemen Keuangan

[![Live Demo](https://img.shields.io/badge/Live_Demo-Open_App-10b981?style=for-the-badge&logo=vercel&logoColor=white)](https://my-manajemen-keuangan.vercel.app/)

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38bdf8?logo=tailwindcss&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Auth%20%2B%20Firestore-orange?logo=firebase&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-installable-5a0fc8?logo=pwa&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green)

Aplikasi web untuk mencatat keuangan pribadi / proyek (mis. Pembangunan Rumah, Usaha Perikanan). **Login email/password**, data tersimpan **aman di Firebase Cloud**, **sinkron antar device** (HP & laptop), dan ada fitur **Export/Import** sebagai backup tambahan.

> 🌐 **Coba langsung:** [my-manajemen-keuangan.vercel.app](https://my-manajemen-keuangan.vercel.app/) — daftar akun baru untuk mencoba semua fitur.

## Tech Stack

- **Next.js 14** (App Router)
- **React 18**
- **Tailwind CSS 3**
- **Firebase**: Authentication (email/password) + Firestore (database)

## Fitur

- 🔐 Login / Register / Lupa Password (Firebase Auth)
- 📚 Dashboard semua buku dengan ringkasan kas masuk / keluar / saldo
- ➕ Buat buku baru dengan saldo awal opsional (dihitung sebagai Kas Masuk)
- 📋 Detail buku: ringkasan + tabel transaksi dengan saldo berjalan
- 🛒 Form transaksi dengan **Jumlah Barang × Harga Satuan** (mis. 40 papan × Rp 30.000 = Rp 1.200.000)
- 🔎 Halaman "Semua Transaksi" lintas buku, dengan filter
- ☁️ Sinkron realtime antar device (buka di HP & laptop, data sama)
- 💾 Backup: Export ke file JSON, Import dari file (mode Replace / Merge)
- 📱 Responsive — sidebar di desktop, bottom-nav di mobile

## 🗺️ Roadmap

Rencana fitur ke depan (urut prioritas). Vote / usulkan via [Issues](https://github.com/Reykira007/manajemen-keuangan/issues) atau [Discussions](https://github.com/Reykira007/manajemen-keuangan/discussions).

### Direncanakan v1.1

- 📸 **Upload foto nota/struk** — lampirkan bukti tiap transaksi (Firebase Storage)
- 🏷️ **Kategori custom** — user bisa tambah/edit/hapus kategori sendiri
- 💰 **Budget per kategori** — set target pengeluaran + peringatan saat hampir lewat
- 🔐 **Login dengan Google** — alternatif login lebih cepat & aman

### Direncanakan v1.2

- ⚙️ **Halaman Pengaturan Akun** — ganti password, hapus akun, info session
- 📝 **Catatan panjang** — field deskripsi multi-baris di setiap transaksi
- 🖨️ **Export laporan ke PDF** — siap print / share ke pasangan / partner
- ⚡ **Quick Add** — tombol floating (+) untuk input super cepat dari mana saja

### Pertimbangan (kalau dibutuhkan)

- 👥 **Buku bersama** — share buku ke partner via email
- 🔄 **Recurring transactions** — auto-create cicilan / gaji rutin
- 📊 **Comparison periode** — bulan ini vs bulan lalu
- 💸 **Hutang piutang tracker** — daftar piutang dengan jatuh tempo

Lihat [CHANGELOG.md](CHANGELOG.md) untuk daftar perubahan yang sudah dirilis.

---

## A. Setup Firebase (sekali saja, ~5 menit)

### 1. Buat Firebase Project

1. Buka [https://console.firebase.google.com](https://console.firebase.google.com) — login dengan akun Google.
2. Klik **Add project** → beri nama (mis. `manajemen-keuangan`) → Next.
3. **Google Analytics**: boleh dinonaktifkan (tidak diperlukan).
4. Klik **Create project** → tunggu sampai selesai.

### 2. Aktifkan Authentication (Email/Password)

1. Di sidebar Firebase Console, pilih **Build → Authentication**.
2. Klik **Get started**.
3. Pilih tab **Sign-in method** → klik **Email/Password** → aktifkan toggle **Enable** → **Save**.

### 3. Buat Firestore Database

1. Sidebar → **Build → Firestore Database**.
2. Klik **Create database**.
3. Pilih lokasi: **asia-southeast1 (Jakarta/Singapore)** untuk performa terbaik dari Indonesia.
4. Mode: pilih **Start in production mode** → Enable.

### 4. Set Security Rules (penting!)

1. Di Firestore Database → tab **Rules**.
2. Ganti seluruh isinya dengan rules berikut, lalu klik **Publish**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Rules ini memastikan tiap user **hanya bisa baca/tulis data miliknya sendiri**.

### 5. Daftarkan Web App & Ambil Config

1. Di halaman utama Firebase Console (klik logo Firebase), klik ikon **`</>`** (Web).
2. Beri nickname (mis. `Web App`) → klik **Register app**. (Skip Firebase Hosting.)
3. Anda akan melihat blok `const firebaseConfig = { ... }`. **Copy semua nilainya** — Anda akan butuhnya sebentar lagi.

### 6. (Opsional) Authorized Domains

Kalau nanti deploy ke Vercel:

1. Authentication → tab **Settings** → **Authorized domains**.
2. Klik **Add domain** → tambahkan domain Vercel Anda (mis. `nama-app.vercel.app`).
   (Otomatis sudah ada `localhost` untuk development.)

---

## B. Menjalankan di Komputer Lokal

Prasyarat: **Node.js 18.17+** dan npm.

### 1. Install dependencies

```bash
npm install
```

### 2. Buat file `.env.local`

Copy `.env.local.example` jadi `.env.local`, lalu isi dengan nilai dari Firebase config (Bagian A.5):

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=manajemen-keuangan.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=manajemen-keuangan
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=manajemen-keuangan.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abc123
```

### 3. Jalankan

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000). Anda akan langsung diarahkan ke halaman Login — klik **Daftar** untuk buat akun pertama.

### Script tersedia

```bash
npm run dev     # development server
npm run build   # build production
npm run start   # jalankan hasil build
```

---

## C. Deploy ke Vercel

### Opsi 1 — Lewat Dashboard Vercel (paling mudah)

1. **Push proyek ke GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<username>/<repo>.git
   git push -u origin main
   ```
   > File `.env.local` **tidak ikut** karena sudah masuk `.gitignore` — ini benar, env var diset terpisah di Vercel.

2. Buka [https://vercel.com/new](https://vercel.com/new) → login dengan akun GitHub → klik **Import** pada repo Anda.

3. Di halaman konfigurasi proyek:
   - **Framework Preset:** Next.js (terdeteksi otomatis)
   - Buka **Environment Variables**, lalu tambahkan **6 variable** ini satu per satu (copy nilainya dari `.env.local`):
     - `NEXT_PUBLIC_FIREBASE_API_KEY`
     - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
     - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
     - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
     - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
     - `NEXT_PUBLIC_FIREBASE_APP_ID`

4. Klik **Deploy** → tunggu ~1–2 menit → dapat URL `https://<nama>.vercel.app`.

5. Kembali ke **Firebase Console → Authentication → Settings → Authorized domains** → tambahkan domain Vercel Anda.

Setiap kali `git push` ke `main`, Vercel akan otomatis re-deploy.

### Opsi 2 — Lewat Vercel CLI

```bash
npm install -g vercel
vercel login
vercel              # deploy preview, ikuti petunjuk
vercel --prod       # deploy production
```

Env vars bisa diset lewat CLI:
```bash
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
# ulangi untuk 6 variable di atas
```

---

## D. Cara Pakai

1. **Daftar akun**: pilih *Daftar* di halaman login, isi email & password (min. 6 karakter).
2. **Buat buku**: klik *Buat Buku Baru*. Misalnya nama "Pembangunan Rumah", saldo awal Rp 5.000.000.
3. **Tambah transaksi**:
   - Klik buku → *Tambah Kas Masuk* / *Tambah Kas Keluar*.
   - Untuk belanja material: Keterangan = `Papan kayu`, Jumlah Barang = `40`, Harga Satuan = `30.000` → total otomatis Rp 1.200.000.
4. **Lihat di device lain**: login pakai email & password yang sama di HP/laptop lain — data otomatis sama.
5. **Backup**: menu *Backup Data* → *Download Backup (.json)*. Simpan ke Google Drive sebulan sekali sebagai cadangan ekstra.

---

## E. Catatan Keamanan

- **Password tidak pernah disimpan** di kode atau Firestore — di-handle Firebase Auth (di-hash).
- File `NEXT_PUBLIC_FIREBASE_*` aman untuk publik. Keamanan datanya dilindungi oleh **Firestore Security Rules** (Bagian A.4), bukan oleh kerahasiaan API key.
- Lupa password? Halaman *Login* → *Lupa password?* → kirim link reset ke email Anda.

## F. Biaya

Free tier Firebase (Spark plan) — gratis selamanya untuk pemakaian wajar:

- ✅ 1 GB storage Firestore
- ✅ 50.000 read/hari, 20.000 write/hari
- ✅ 50.000 user aktif/bulan
- ✅ **Tidak ada auto-pause** — boleh nganggur berbulan-bulan

Untuk catatan keuangan pribadi/keluarga, hampir mustahil melewati batas ini.

---

## Struktur Proyek

```
app/
├── layout.js                       # Root layout + AuthProvider
├── globals.css
├── (auth)/                         # Route group — halaman tanpa sidebar
│   ├── layout.js                   # Centered card layout
│   ├── login/page.js
│   ├── register/page.js
│   └── forgot-password/page.js
├── (app)/                          # Route group — halaman aplikasi (butuh login)
│   ├── layout.js                   # Sidebar + auth gate (redirect ke /login)
│   ├── page.js                     # Dashboard
│   ├── buku/baru/page.js           # Form buat buku
│   ├── buku/[id]/page.js           # Detail buku + transaksi
│   ├── transaksi/page.js           # Semua transaksi lintas buku
│   └── backup/page.js              # Export/Import JSON
├── components/
│   ├── AuthProvider.js             # Context: user, loading, logout
│   ├── Navigation.js               # Sidebar + Bottom nav + Logout
│   ├── Topbar.js
│   ├── BookCard.js
│   └── TransactionFormModal.js
└── lib/
    ├── firebase.js                 # Init Firebase App, Auth, Firestore
    ├── storage.js                  # CRUD Firestore + subscribe realtime + export/import
    └── format.js                   # Format Rupiah & tanggal
```

## Lisensi

Bebas digunakan dan dimodifikasi untuk keperluan pribadi.
