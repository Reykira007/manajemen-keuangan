"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  addTransaction,
  subscribeBooks,
  subscribeCustomCategories,
  updateTransaction,
} from "../lib/storage";
import { getCategoriesFor } from "../lib/categories";
import { DEFAULT_SOURCE, PAYMENT_SOURCES } from "../lib/sources";
import { useAuth } from "./AuthProvider";
import { useToast } from "./ToastProvider";
import { formatRupiah, todayISO } from "../lib/format";

const formatGroup = (digits) =>
  digits ? new Intl.NumberFormat("id-ID").format(digits) : "";

export default function TransactionFormModal({
  open,
  type, // "in" | "out"
  bookId,
  initial = null, // bila edit: { id, date, description, category, quantity, unitPrice, type }
  preset = null, // { type, category, description, simpleMode, title } - pre-fill dari quick action template
  onClose,
  onSaved,
}) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isEdit = !!initial;
  const actualType = initial?.type || preset?.type || type;
  const needsBookPicker = !bookId && !isEdit; // dipanggil dari FAB
  const simpleMode = !isEdit && (preset?.simpleMode || false);
  // Transaksi pelunasan dari debt — amount, source, kategori dikunci agar
  // tetap sinkron dengan debt asli. User cuma boleh edit tanggal & keterangan.
  const isPaidDebtTx = isEdit && !!initial?.paidDebtId;

  const [date, setDate] = useState(todayISO());
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [source, setSource] = useState(DEFAULT_SOURCE);
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [selectedBookId, setSelectedBookId] = useState("");
  const [books, setBooks] = useState([]);
  const [customCategories, setCustomCategories] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Load list of books (untuk picker saat dipanggil dari FAB)
  useEffect(() => {
    if (!user || !needsBookPicker || !open) return;
    const unsub = subscribeBooks(user.uid, (list) => {
      setBooks(list);
      // Auto-pilih buku pertama kalau belum ada pilihan
      setSelectedBookId((prev) => prev || list[0]?.id || "");
    });
    return unsub;
  }, [user, needsBookPicker, open]);

  // Load custom categories (user-defined)
  useEffect(() => {
    if (!user || !open) return;
    const unsub = subscribeCustomCategories(user.uid, setCustomCategories);
    return unsub;
  }, [user, open]);

  useEffect(() => {
    if (open) {
      if (initial) {
        setDate(initial.date || todayISO());
        setDescription(initial.description || "");
        setCategory(initial.category || "");
        setSource(initial.source || DEFAULT_SOURCE);
        setQuantity(String(initial.quantity || 1));
        setUnitPrice(formatGroup(String(initial.unitPrice || "")));
      } else {
        setDate(todayISO());
        setDescription(preset?.description || "");
        setCategory(preset?.category || "");
        setSource(preset?.source || DEFAULT_SOURCE);
        // Di simple mode, qty selalu = 1
        setQuantity("1");
        setUnitPrice("");
        setSelectedBookId("");
      }
      setError("");
      setSaving(false);
    }
  }, [open, initial, preset]);

  const qtyNum = Number(quantity.replace(/[^\d.]/g, "")) || 0;
  const unitNum = Number(unitPrice.replace(/\D/g, "")) || 0;
  const total = useMemo(() => qtyNum * unitNum, [qtyNum, unitNum]);

  const defaultCats = getCategoriesFor(actualType);
  const customCats = customCategories.filter((c) => c.type === actualType);
  const allCategories = [...defaultCats, ...customCats];

  // Lookup label dari kategori yang dipilih untuk disimpan snapshot
  const selectedCategoryLabel = useMemo(() => {
    const found = allCategories.find((c) => c.id === category);
    return found?.label || "";
  }, [allCategories, category]);

  if (!open) return null;

  const isIn = actualType === "in";
  const defaultTitle = isIn
    ? isEdit
      ? "Edit Kas Masuk"
      : "Tambah Kas Masuk"
    : isEdit
    ? "Edit Kas Keluar"
    : "Tambah Kas Keluar";
  const accent = isIn
    ? {
        title: preset?.title || defaultTitle,
        btn: "bg-income-600 hover:bg-income-700",
        ring: "focus:ring-income-100 focus:border-income-500",
        chip: "bg-income-50 text-income-700",
        totalColor: "text-income-700",
      }
    : {
        title: preset?.title || defaultTitle,
        btn: "bg-expense-600 hover:bg-expense-700",
        ring: "focus:ring-expense-100 focus:border-expense-500",
        chip: "bg-expense-50 text-expense-700",
        totalColor: "text-expense-700",
      };

  const onSubmit = async (e) => {
    e.preventDefault();
    const effectiveBookId = bookId || selectedBookId;
    if (!isEdit && !effectiveBookId) {
      setError("Pilih buku dulu.");
      return;
    }
    if (!description.trim()) {
      setError("Keterangan wajib diisi.");
      return;
    }
    // Di simple mode, qty di-paksa = 1 (unitPrice = jumlah total)
    const finalQty = simpleMode ? 1 : qtyNum;
    if (!simpleMode && qtyNum <= 0) {
      setError("Jumlah barang harus lebih dari 0.");
      return;
    }
    if (unitNum <= 0) {
      setError(simpleMode ? "Jumlah wajib diisi." : "Harga satuan harus lebih dari 0.");
      return;
    }
    if (!user) return;
    setSaving(true);
    try {
      if (isEdit) {
        await updateTransaction(user.uid, initial.id, {
          date,
          description,
          category,
          categoryLabel: selectedCategoryLabel,
          source,
          quantity: finalQty,
          unitPrice: unitNum,
        });
      } else {
        await addTransaction(user.uid, {
          bookId: effectiveBookId,
          type: actualType,
          date,
          description,
          category,
          categoryLabel: selectedCategoryLabel,
          source,
          quantity: finalQty,
          unitPrice: unitNum,
        });
      }
      showToast(isEdit ? "Transaksi berhasil diperbarui" : "Transaksi tersimpan");
      onSaved && onSaved();
      onClose();
    } catch (err) {
      setError("Gagal menyimpan: " + (err?.message || "error"));
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 bg-slate-900/40 dark:bg-black/60 flex items-end md:items-center justify-center p-0 md:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 w-full md:max-w-md rounded-t-2xl md:rounded-2xl shadow-xl max-h-[95vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium px-2 py-1 rounded-md ${accent.chip}`}>
              {isIn ? "Masuk" : "Keluar"}
            </span>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              {accent.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1"
            aria-label="Tutup"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-5 space-y-4">
          {needsBookPicker ? (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Buku
              </label>
              {books.length === 0 ? (
                <p className="text-sm text-expense-600">
                  Belum ada buku. Buat buku dulu di Dashboard.
                </p>
              ) : (
                <select
                  value={selectedBookId}
                  onChange={(e) => {
                    setSelectedBookId(e.target.value);
                    setError("");
                  }}
                  className={`w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none text-slate-900 dark:text-slate-100 ${accent.ring}`}
                  required
                >
                  {books.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ) : null}

          {isPaidDebtTx ? (
            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-lg p-3 text-xs text-amber-700 dark:text-amber-300">
              <div className="font-medium mb-0.5">
                🔒 Transaksi pelunasan hutang/piutang
              </div>
              <p>
                Jumlah, sumber dana, dan kategori dikunci agar tetap sinkron
                dengan data hutang/piutang. Untuk ubah jumlah, hapus transaksi
                ini lalu tandai ulang dari halaman Hutang/Piutang.
              </p>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Tanggal
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none text-slate-900 dark:text-slate-100 ${accent.ring}`}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Sumber Dana
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                disabled={isPaidDebtTx}
                className={`w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none text-slate-900 dark:text-slate-100 disabled:opacity-60 disabled:cursor-not-allowed ${accent.ring}`}
              >
                {PAYMENT_SOURCES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.icon} {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Keterangan / Nama Barang
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setError("");
              }}
              placeholder={isIn ? "Contoh: Penjualan ikan" : "Contoh: Papan kayu"}
              className={`w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none text-slate-900 dark:text-slate-100 ${accent.ring}`}
              autoFocus
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Kategori
              </label>
              <Link
                href="/pengaturan/kategori"
                onClick={onClose}
                className="text-xs text-income-700 hover:underline"
              >
                Kelola kategori
              </Link>
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={isPaidDebtTx}
              className={`w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none text-slate-900 dark:text-slate-100 disabled:opacity-60 disabled:cursor-not-allowed ${accent.ring}`}
            >
              <option value="">— Pilih kategori (opsional) —</option>
              <optgroup label="Default">
                {defaultCats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </optgroup>
              {customCats.length > 0 ? (
                <optgroup label="Kategori Saya">
                  {customCats.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </optgroup>
              ) : null}
            </select>
          </div>

          {simpleMode ? (
            /* SIMPLE MODE: cuma 1 field Jumlah Total */
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Jumlah <span className="text-expense-600">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                  Rp
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={unitPrice}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "");
                    setUnitPrice(formatGroup(digits));
                    setError("");
                  }}
                  placeholder="0"
                  disabled={isPaidDebtTx}
                  className={`w-full pl-10 pr-3 py-3 text-lg rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none text-slate-900 dark:text-slate-100 font-semibold disabled:opacity-60 disabled:cursor-not-allowed ${accent.ring}`}
                  autoFocus={!!preset?.description}
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Total jumlah uang
              </p>
            </div>
          ) : (
            /* DETAILED MODE: qty × harga satuan */
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Jumlah Barang
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={quantity}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^\d.]/g, "");
                    setQuantity(v);
                    setError("");
                  }}
                  placeholder="1"
                  disabled={isPaidDebtTx}
                  className={`w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none text-slate-900 dark:text-slate-100 disabled:opacity-60 disabled:cursor-not-allowed ${accent.ring}`}
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Mis. 40 (keping), 2 (kg)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Harga Satuan
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                    Rp
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={unitPrice}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "");
                      setUnitPrice(formatGroup(digits));
                      setError("");
                    }}
                    placeholder="0"
                    disabled={isPaidDebtTx}
                    className={`w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none text-slate-900 dark:text-slate-100 disabled:opacity-60 disabled:cursor-not-allowed ${accent.ring}`}
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Harga per unit</p>
              </div>
            </div>
          )}

          {/* Preview Total - tampil di detailed mode (qty > 1 jadi total ≠ harga satuan) */}
          {!simpleMode ? (
            <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Total</div>
                <div className="text-[11px] text-slate-400">
                  {qtyNum > 0 && unitNum > 0
                    ? `${qtyNum} × ${formatRupiah(unitNum)}`
                    : "Isi jumlah & harga satuan"}
                </div>
              </div>
              <div className={`text-lg font-bold ${accent.totalColor}`}>
                {formatRupiah(total)}
              </div>
            </div>
          ) : null}

          {error ? <p className="text-xs text-expense-600">{error}</p> : null}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-sm font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className={`flex-1 text-white font-medium py-2.5 rounded-lg disabled:opacity-60 ${accent.btn}`}
            >
              {saving ? "Menyimpan..." : isEdit ? "Update" : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
