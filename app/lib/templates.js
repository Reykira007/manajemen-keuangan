// Template buku — preset untuk berbagai jenis penggunaan.
// Memudahkan user baru paham apa yang harus dicatat & kategori apa yang relevan.
//
// Setiap template punya:
// - quickActions: tombol-tombol aksi cepat yang muncul di halaman detail buku.
//   Tiap action punya `preset` yang otomatis mengisi form transaksi.
//
// Preset properties:
// - type: 'in' | 'out'
// - category: ID kategori (dari lib/categories)
// - description: default text untuk field keterangan
// - simpleMode: true = hanya 1 field "Jumlah Total" (tanpa qty × harga)
// - title: judul custom untuk modal form

export const BOOK_TEMPLATES = [
  {
    id: "pribadi",
    icon: "📒",
    name: "Pribadi / Keluarga",
    description: "Catat pengeluaran rumah tangga sehari-hari, gaji, tagihan",
    defaultBookName: "Keuangan Bulanan",
    openingBalanceHint: "Saldo rekening / cash saat mulai mencatat",
    tips: "Catat pengeluaran sehari-hari biar tahu uang habis ke mana. Saldo awal = sisa uang Anda sekarang.",
    quickActions: [
      {
        id: "pemasukan",
        label: "Pemasukan",
        icon: "💰",
        tone: "income",
        preset: {
          type: "in",
          description: "",
          simpleMode: true,
          title: "Catat Pemasukan",
        },
      },
      {
        id: "pengeluaran",
        label: "Pengeluaran",
        icon: "💸",
        tone: "expense",
        preset: {
          type: "out",
          description: "",
          simpleMode: true,
          title: "Catat Pengeluaran",
        },
      },
      {
        id: "bayar-tagihan",
        label: "Bayar Tagihan",
        icon: "📃",
        tone: "expense",
        preset: {
          type: "out",
          category: "listrik-air",
          description: "Bayar tagihan",
          simpleMode: true,
          title: "Bayar Tagihan",
        },
      },
    ],
  },
  {
    id: "warung",
    icon: "🏪",
    name: "Warung / Sembako",
    description: "Toko kelontong, sembako, jualan harian",
    defaultBookName: "Warung",
    openingBalanceHint: "Modal usaha awal (uang yang sudah Anda siapkan)",
    tips: "Tutup toko = catat total penjualan hari ini. Belanja stok = catat per item dengan qty × harga.",
    quickActions: [
      {
        id: "penjualan-harian",
        label: "Penjualan Hari Ini",
        icon: "💰",
        tone: "income",
        preset: {
          type: "in",
          category: "penjualan",
          description: "Penjualan hari ini",
          simpleMode: true,
          title: "Catat Penjualan Hari Ini",
        },
      },
      {
        id: "belanja-stok",
        label: "Belanja Stok",
        icon: "🛒",
        tone: "expense",
        preset: {
          type: "out",
          category: "bahan-baku",
          description: "",
          simpleMode: false,
          title: "Belanja Stok (Kulakan)",
        },
      },
      {
        id: "operasional",
        label: "Bayar Operasional",
        icon: "🏠",
        tone: "expense",
        preset: {
          type: "out",
          description: "",
          simpleMode: true,
          title: "Bayar Operasional (Sewa/Listrik/dll)",
        },
      },
    ],
  },
  {
    id: "konter",
    icon: "📱",
    name: "Konter Pulsa & Aksesoris",
    description: "Jualan pulsa, paket data, aksesoris HP, voucher game",
    defaultBookName: "Konter",
    openingBalanceHint: "Modal awal + saldo deposit pulsa pertama",
    tips: "Deposit pulsa = 'Bahan Baku'. Penjualan harian = catat total cash yang masuk laci hari ini.",
    quickActions: [
      {
        id: "penjualan-harian",
        label: "Penjualan Hari Ini",
        icon: "💰",
        tone: "income",
        preset: {
          type: "in",
          category: "penjualan",
          description: "Penjualan pulsa & aksesoris hari ini",
          simpleMode: true,
          title: "Catat Penjualan Hari Ini",
        },
      },
      {
        id: "topup-deposit",
        label: "Top-up Deposit",
        icon: "📱",
        tone: "expense",
        preset: {
          type: "out",
          category: "bahan-baku",
          description: "Top-up deposit pulsa",
          simpleMode: true,
          title: "Top-up Deposit Pulsa",
        },
      },
      {
        id: "beli-aksesoris",
        label: "Beli Aksesoris",
        icon: "📦",
        tone: "expense",
        preset: {
          type: "out",
          category: "bahan-baku",
          description: "",
          simpleMode: false,
          title: "Beli Stok Aksesoris",
        },
      },
      {
        id: "operasional",
        label: "Operasional",
        icon: "🏠",
        tone: "expense",
        preset: {
          type: "out",
          description: "",
          simpleMode: true,
          title: "Bayar Operasional",
        },
      },
    ],
  },
  {
    id: "bangunan",
    icon: "🏗️",
    name: "Proyek Bangunan / Renovasi",
    description: "Pembangunan rumah, renovasi, proyek konstruksi",
    defaultBookName: "Pembangunan Rumah",
    openingBalanceHint: "Dana yang sudah disiapkan untuk proyek ini",
    tips: "Beli material = catat detail qty × harga (mis. 40 papan × Rp 30.000). Bayar tukang = jumlah hari × tarif harian.",
    quickActions: [
      {
        id: "beli-material",
        label: "Beli Material",
        icon: "🧱",
        tone: "expense",
        preset: {
          type: "out",
          category: "material",
          description: "",
          simpleMode: false,
          title: "Beli Material",
        },
      },
      {
        id: "bayar-tukang",
        label: "Bayar Tukang",
        icon: "👷",
        tone: "expense",
        preset: {
          type: "out",
          category: "tukang",
          description: "Upah tukang",
          simpleMode: false,
          title: "Bayar Upah Tukang (hari × tarif)",
        },
      },
      {
        id: "transport",
        label: "Transport / Lain",
        icon: "🚚",
        tone: "expense",
        preset: {
          type: "out",
          category: "transport",
          description: "",
          simpleMode: true,
          title: "Transport / Pengeluaran Lain",
        },
      },
      {
        id: "terima-dana",
        label: "Terima Dana",
        icon: "💰",
        tone: "income",
        preset: {
          type: "in",
          description: "",
          simpleMode: true,
          title: "Terima Modal / Pinjaman",
        },
      },
    ],
  },
  {
    id: "jasa",
    icon: "💇",
    name: "Usaha Jasa",
    description: "Laundry, salon, cuci motor, tukang, jasa lainnya",
    defaultBookName: "Usaha Jasa",
    openingBalanceHint: "Modal awal usaha",
    tips: "Akhir hari catat total pendapatan jasa. Beli bahan habis pakai (sabun/deterjen) = 'Operasional Usaha'.",
    quickActions: [
      {
        id: "pemasukan-harian",
        label: "Pemasukan Hari Ini",
        icon: "💰",
        tone: "income",
        preset: {
          type: "in",
          category: "penjualan",
          description: "Pemasukan jasa hari ini",
          simpleMode: true,
          title: "Catat Pemasukan Hari Ini",
        },
      },
      {
        id: "beli-bahan",
        label: "Beli Bahan",
        icon: "🧴",
        tone: "expense",
        preset: {
          type: "out",
          category: "bahan-baku",
          description: "",
          simpleMode: false,
          title: "Beli Bahan Operasional",
        },
      },
      {
        id: "bayar-gaji",
        label: "Bayar Gaji",
        icon: "👷",
        tone: "expense",
        preset: {
          type: "out",
          category: "gaji-karyawan",
          description: "Gaji karyawan",
          simpleMode: true,
          title: "Bayar Gaji Karyawan",
        },
      },
      {
        id: "operasional",
        label: "Operasional",
        icon: "🏠",
        tone: "expense",
        preset: {
          type: "out",
          description: "",
          simpleMode: true,
          title: "Bayar Operasional",
        },
      },
    ],
  },
  {
    id: "tani-ternak",
    icon: "🐟",
    name: "Tani / Ternak / Perikanan",
    description: "Perikanan, ternak ayam, sayur, pertanian dengan panen periodik",
    defaultBookName: "Usaha Tani",
    openingBalanceHint: "Modal awal usaha tani/ternak",
    tips: "Pakan/pupuk = 'Bahan Baku'. Hasil panen = 'Penjualan' (catat kg × harga jual). Modal tambahan bisa ditambah kapan saja.",
    quickActions: [
      {
        id: "hasil-panen",
        label: "Hasil Panen",
        icon: "💰",
        tone: "income",
        preset: {
          type: "in",
          category: "penjualan",
          description: "Hasil panen",
          simpleMode: false,
          title: "Catat Hasil Panen (kg × harga jual)",
        },
      },
      {
        id: "beli-pakan",
        label: "Beli Pakan / Bibit",
        icon: "🌾",
        tone: "expense",
        preset: {
          type: "out",
          category: "bahan-baku",
          description: "",
          simpleMode: false,
          title: "Beli Pakan / Pupuk / Bibit",
        },
      },
      {
        id: "operasional",
        label: "Operasional",
        icon: "🚜",
        tone: "expense",
        preset: {
          type: "out",
          category: "operasional",
          description: "",
          simpleMode: true,
          title: "Operasional Tani/Ternak",
        },
      },
      {
        id: "modal-tambahan",
        label: "Modal Tambahan",
        icon: "💵",
        tone: "income",
        preset: {
          type: "in",
          category: "modal-tambahan",
          description: "",
          simpleMode: true,
          title: "Tambah Modal",
        },
      },
    ],
  },
  {
    id: "tabungan",
    icon: "🎯",
    name: "Tabungan Tujuan",
    description: "Tabungan haji, sekolah anak, kendaraan, nikah, dll",
    defaultBookName: "Tabungan",
    openingBalanceHint: "Yang sudah terkumpul sebelum mulai mencatat",
    tips: "Setiap setor tabungan = Kas Masuk. Sebisa mungkin jangan diambil supaya target tercapai!",
    quickActions: [
      {
        id: "setor",
        label: "Setor Tabungan",
        icon: "💰",
        tone: "income",
        preset: {
          type: "in",
          category: "modal-tambahan",
          description: "Setor tabungan",
          simpleMode: true,
          title: "Setor Tabungan",
        },
      },
      {
        id: "ambil",
        label: "Ambil Tabungan",
        icon: "💸",
        tone: "expense",
        preset: {
          type: "out",
          category: "lain-out",
          description: "Ambil tabungan",
          simpleMode: true,
          title: "Ambil dari Tabungan",
        },
      },
    ],
  },
  {
    id: "custom",
    icon: "🆓",
    name: "Custom / Kosong",
    description: "Mulai dari kosong, atur sendiri sesuai kebutuhan",
    defaultBookName: "",
    openingBalanceHint: "Jumlah uang yang sudah ada (opsional)",
    tips: "Cocok kalau Anda mau atur sendiri tanpa preset. Semua kategori tetap tersedia.",
    quickActions: [
      {
        id: "kas-masuk",
        label: "Kas Masuk",
        icon: "💰",
        tone: "income",
        preset: {
          type: "in",
          description: "",
          simpleMode: false,
          title: "Tambah Kas Masuk",
        },
      },
      {
        id: "kas-keluar",
        label: "Kas Keluar",
        icon: "💸",
        tone: "expense",
        preset: {
          type: "out",
          description: "",
          simpleMode: false,
          title: "Tambah Kas Keluar",
        },
      },
    ],
  },
];

export function getTemplate(id) {
  return BOOK_TEMPLATES.find((t) => t.id === id) || null;
}

export function getQuickActions(templateId) {
  const t = getTemplate(templateId) || getTemplate("custom");
  return t.quickActions || [];
}
