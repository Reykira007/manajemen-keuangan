# Contributing

Terima kasih atas minatnya untuk berkontribusi! Berikut panduan singkat.

## Setup Lokal

```bash
git clone https://github.com/Reykira007/manajemen-keuangan.git
cd manajemen-keuangan
npm install
cp .env.local.example .env.local
# isi .env.local dengan kredensial Firebase Anda (lihat README.md)
npm run dev
```

## Alur Kontribusi

1. Fork repo ini
2. Buat branch baru: `git checkout -b feat/nama-fitur` (atau `fix/bug-x`, `chore/...`, `docs/...`)
3. Commit perubahan Anda dengan pesan yang jelas
4. Push ke fork Anda: `git push origin feat/nama-fitur`
5. Buka Pull Request dengan deskripsi yang menjelaskan **apa** dan **kenapa**

## Konvensi Commit

Gunakan format [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` fitur baru
- `fix:` perbaikan bug
- `chore:` housekeeping (rename, restructure, dependency update)
- `docs:` perubahan dokumentasi
- `style:` formatting/styling tanpa perubahan logika
- `refactor:` refactor kode tanpa perubahan perilaku
- `test:` tambah/ubah test

Contoh: `feat: tambah filter tanggal di halaman laporan`

## Sebelum Submit PR

- [ ] `npm run build` jalan tanpa error
- [ ] Sudah dites di browser (terutama login + buat transaksi)
- [ ] Sudah dicek tampilan mobile/responsive
- [ ] Tidak ada console error
- [ ] Kode mengikuti gaya yang ada di repo

## Melaporkan Bug

Buka Issue baru dengan:

- Langkah reproduksi (1, 2, 3, ...)
- Hasil yang diharapkan vs hasil yang muncul
- Screenshot jika relevan
- Browser & device yang dipakai

## Pertanyaan

Untuk pertanyaan umum, buka Discussions, bukan Issues. Issues hanya untuk bug & feature request.
