// Kategori default. Bisa ditambah/diubah di sini.
// Diurutkan berdasarkan frekuensi pemakaian untuk UMKM / proyek.

export const CATEGORIES_IN = [
  // UMKM / Dagang
  { id: "penjualan", label: "Penjualan / Omzet" },
  { id: "modal-awal", label: "Modal Awal" },
  { id: "modal-tambahan", label: "Modal Tambahan" },
  { id: "pinjaman-usaha", label: "Pinjaman Usaha" },
  // Pribadi / Proyek
  { id: "pendapatan", label: "Pendapatan / Gaji" },
  { id: "hadiah", label: "Hadiah / Bantuan" },
  { id: "pinjaman", label: "Pinjaman Pribadi" },
  // Fallback
  { id: "lain-in", label: "Lain-lain" },
];

export const CATEGORIES_OUT = [
  // UMKM / Dagang (paling sering dipakai pedagang)
  { id: "bahan-baku", label: "Bahan Baku / Stok" },
  { id: "kemasan", label: "Kemasan / Packaging" },
  { id: "gaji-karyawan", label: "Gaji Karyawan" },
  { id: "sewa-tempat", label: "Sewa Tempat" },
  { id: "operasional", label: "Operasional Usaha" },
  { id: "promosi", label: "Promosi / Iklan" },
  { id: "pajak-usaha", label: "Pajak Usaha" },
  // Proyek bangunan / renovasi
  { id: "material", label: "Material / Bahan" },
  { id: "tukang", label: "Tukang / Upah" },
  { id: "perawatan", label: "Perawatan / Servis" },
  // Umum / Pribadi
  { id: "transport", label: "Transportasi" },
  { id: "konsumsi", label: "Konsumsi" },
  { id: "listrik-air", label: "Listrik / Air" },
  { id: "internet-pulsa", label: "Internet / Pulsa" },
  { id: "pajak-izin", label: "Pajak / Izin" },
  { id: "pendidikan", label: "Pendidikan" },
  { id: "kesehatan", label: "Kesehatan" },
  // Fallback
  { id: "lain-out", label: "Lain-lain" },
];

export function getCategoriesFor(type) {
  return type === "in" ? CATEGORIES_IN : CATEGORIES_OUT;
}

export function getCategory(type, id) {
  if (!id) return null;
  return getCategoriesFor(type).find((c) => c.id === id) || null;
}

export function getCategoryLabel(type, id) {
  return getCategory(type, id)?.label || "Lain-lain";
}

// Kategori-kategori yang termasuk "penjualan" untuk perhitungan Laba Rugi.
// Modal awal/tambahan & pinjaman TIDAK termasuk penjualan (bukan omzet).
export const SALES_CATEGORIES = new Set(["penjualan", "pendapatan"]);

export function isSalesCategory(categoryId) {
  return SALES_CATEGORIES.has(categoryId);
}
