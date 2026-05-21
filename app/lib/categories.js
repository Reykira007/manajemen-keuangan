// Kategori default. Bisa ditambah/diubah di sini.

export const CATEGORIES_IN = [
  { id: "modal", label: "Modal / Tabungan" },
  { id: "pendapatan", label: "Pendapatan / Gaji" },
  { id: "penjualan", label: "Penjualan" },
  { id: "pinjaman", label: "Pinjaman" },
  { id: "hadiah", label: "Hadiah / Bantuan" },
  { id: "lain-in", label: "Lain-lain" },
];

export const CATEGORIES_OUT = [
  { id: "material", label: "Material / Bahan" },
  { id: "tukang", label: "Tukang / Upah" },
  { id: "transport", label: "Transportasi" },
  { id: "konsumsi", label: "Konsumsi" },
  { id: "listrik-air", label: "Listrik / Air" },
  { id: "pajak-izin", label: "Pajak / Izin" },
  { id: "perawatan", label: "Perawatan / Servis" },
  { id: "pendidikan", label: "Pendidikan" },
  { id: "kesehatan", label: "Kesehatan" },
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
