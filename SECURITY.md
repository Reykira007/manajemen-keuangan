# Security Policy

## Versi yang Didukung

Hanya versi terbaru (`main` branch) yang menerima perbaikan keamanan.

## Melaporkan Kerentanan

Kalau Anda menemukan celah keamanan, **jangan** buka Issue publik. Kontak privat:

- Email: **rearryc@gmail.com**

Sertakan dalam laporan:

1. Deskripsi kerentanan
2. Langkah reproduksi (kalau memungkinkan PoC)
3. Dampak yang mungkin terjadi
4. Saran perbaikan (opsional)

Saya akan merespons dalam **3 hari kerja** dan berkoordinasi terkait disclosure.

## Cakupan

✅ Yang termasuk:

- Code di repository ini (`app/`, `lib/`, dll)
- Bug di Firestore Security Rules yang direkomendasikan
- Bug autentikasi/otorisasi

❌ Yang **bukan** kerentanan:

- API key Firebase yang publik di bundle JavaScript (memang didesain begitu — diamankan oleh Security Rules)
- Akses ke data sendiri (memang seharusnya bisa)
- Misconfiguration di project Firebase pengguna lain yang fork aplikasi ini

## Best Practice untuk Pengguna

- Pakai password kuat (min. 8 karakter, kombinasi huruf-angka)
- Jangan share kredensial Firebase Anda
- Set Firestore Security Rules sesuai panduan di [README.md](README.md)
- Backup data secara berkala via menu Backup

Terima kasih sudah membantu menjaga aplikasi ini aman.
