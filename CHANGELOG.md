# Changelog

Semua perubahan signifikan di project ini akan dicatat di file ini.

Format mengikuti [Keep a Changelog](https://keepachangelog.com/id-ID/1.1.0/),
dan project ini mengikuti [Semantic Versioning](https://semver.org/lang/id/).

## [Unreleased]

### Direncanakan

- Upload foto nota/struk (Firebase Storage)
- Custom kategori (user bisa add/edit/delete kategori sendiri)
- Budget / anggaran per kategori dengan peringatan
- Login dengan Google
- Multi-user / share buku dengan partner

## [1.0.0] - 2026-05-22

### Ditambahkan

- 🔐 Autentikasi: login, register, lupa password (Firebase Auth)
- 📚 Multi-buku dengan saldo awal sebagai kas masuk
- 💸 Transaksi dengan kategori (Material, Tukang, dll) + qty × harga satuan
- ✏️ Edit & hapus transaksi/buku
- 🔍 Cari/search di detail buku & semua transaksi
- 📊 Laporan: pie chart per kategori + bar chart per bulan + filter tanggal
- 💾 Backup: export/import JSON
- 🌙 Dark mode (mengikuti preference sistem)
- 📱 PWA installable + offline mode (Firestore persistent cache)
- ☁️ Sinkron antar device via Firestore
- 📐 Responsive: sidebar desktop, bottom-nav mobile

### Tech Stack

- Next.js 14 (App Router)
- React 18
- Tailwind CSS 3
- Firebase (Auth + Firestore)
- Recharts (charts)
