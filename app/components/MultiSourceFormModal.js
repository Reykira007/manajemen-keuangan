"use client";

import { useEffect, useMemo, useState } from "react";
import { addTransaction, subscribeBooks } from "../lib/storage";
import { PAYMENT_SOURCES } from "../lib/sources";
import { useAuth } from "./AuthProvider";
import { useToast } from "./ToastProvider";
import { formatRupiah, todayISO } from "../lib/format";

const formatGroup = (digits) =>
  digits ? new Intl.NumberFormat("id-ID").format(digits) : "";

/**
 * Modal khusus untuk "Tutup Harian" — input penjualan dari multiple sumber dana
 * sekaligus. Cocok untuk warung/konter/jasa yang sehari terima cash + QRIS +
 * transfer dalam 1 hari.
 *
 * Saat simpan, otomatis create 1 transaksi per sumber yang terisi > 0.
 */
export default function MultiSourceFormModal({
  open,
  bookId,
  preset, // { type, category, description, title }
  onClose,
  onSaved,
}) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const needsBookPicker = !bookId;

  const [date, setDate] = useState(todayISO());
  const [description, setDescription] = useState("");
  const [amounts, setAmounts] = useState({
    cash: "",
    bank: "",
    ewallet: "",
    qris: "",
    lain: "",
  });
  const [selectedBookId, setSelectedBookId] = useState("");
  const [books, setBooks] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user || !needsBookPicker || !open) return;
    const unsub = subscribeBooks(user.uid, (list) => {
      setBooks(list);
      setSelectedBookId((prev) => prev || list[0]?.id || "");
    });
    return unsub;
  }, [user, needsBookPicker, open]);

  useEffect(() => {
    if (open) {
      setDate(todayISO());
      setDescription(preset?.description || "");
      setAmounts({ cash: "", bank: "", ewallet: "", qris: "", lain: "" });
      setSelectedBookId("");
      setError("");
      setSaving(false);
    }
  }, [open, preset]);

  const totals = useMemo(() => {
    const perSource = {};
    let total = 0;
    let filledCount = 0;
    for (const [k, v] of Object.entries(amounts)) {
      const n = Number(v.replace(/\D/g, "")) || 0;
      perSource[k] = n;
      total += n;
      if (n > 0) filledCount++;
    }
    return { perSource, total, filledCount };
  }, [amounts]);

  if (!open) return null;

  const isIn = preset?.type === "in";
  const accent = isIn
    ? {
        btn: "bg-income-600 hover:bg-income-700",
        ring: "focus:ring-income-100 focus:border-income-500",
        chip: "bg-income-50 text-income-700",
        totalColor: "text-income-700",
      }
    : {
        btn: "bg-expense-600 hover:bg-expense-700",
        ring: "focus:ring-expense-100 focus:border-expense-500",
        chip: "bg-expense-50 text-expense-700",
        totalColor: "text-expense-700",
      };

  const setAmount = (source, value) => {
    const digits = value.replace(/\D/g, "");
    setAmounts((prev) => ({ ...prev, [source]: formatGroup(digits) }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const effectiveBookId = bookId || selectedBookId;
    if (!effectiveBookId) {
      setError("Pilih buku dulu.");
      return;
    }
    if (!description.trim()) {
      setError("Keterangan wajib diisi.");
      return;
    }
    if (totals.total <= 0) {
      setError("Isi minimal 1 sumber dana.");
      return;
    }
    if (!user) return;
    setSaving(true);
    try {
      // Buat 1 transaksi per sumber yang terisi > 0
      for (const [source, amount] of Object.entries(totals.perSource)) {
        if (amount <= 0) continue;
        await addTransaction(user.uid, {
          bookId: effectiveBookId,
          type: preset.type,
          date,
          description: description.trim(),
          category: preset.category || "",
          categoryLabel: "",
          source,
          quantity: 1,
          unitPrice: amount,
        });
      }
      showToast(`${totals.filledCount} transaksi tersimpan`);
      onSaved && onSaved();
      onClose();
    } catch (err) {
      setError("Gagal menyimpan: " + (err?.message || "error"));
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 bg-slate-900/40 dark:bg-black/60 flex items-end md:items-center justify-center p-0 md:p-4 modal-backdrop"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 w-full md:max-w-md rounded-t-2xl md:rounded-2xl shadow-xl max-h-[95vh] overflow-y-auto modal-content-mobile md:animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-medium px-2 py-1 rounded-md ${accent.chip}`}
            >
              {isIn ? "Masuk" : "Keluar"}
            </span>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              {preset?.title || "Tutup Harian"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1"
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
          {needsBookPicker && books.length > 0 ? (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Buku
              </label>
              <select
                value={selectedBookId}
                onChange={(e) => setSelectedBookId(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none text-slate-900 dark:text-slate-100 ${accent.ring}`}
              >
                {books.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Tanggal
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none text-slate-900 dark:text-slate-100 ${accent.ring}`}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Keterangan
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setError("");
              }}
              placeholder="Penjualan hari ini"
              className={`w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none text-slate-900 dark:text-slate-100 ${accent.ring}`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Pendapatan per Sumber Dana
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Hanya isi yang ada. Tiap sumber yang terisi otomatis jadi 1
              transaksi terpisah.
            </p>
            <div className="space-y-2">
              {PAYMENT_SOURCES.map((s) => (
                <div key={s.id} className="flex items-center gap-3">
                  <div className="w-24 text-sm text-slate-600 dark:text-slate-300 shrink-0 flex items-center gap-1.5">
                    <span>{s.icon}</span>
                    <span className="truncate">{s.shortLabel}</span>
                  </div>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                      Rp
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={amounts[s.id]}
                      onChange={(e) => {
                        setAmount(s.id, e.target.value);
                        setError("");
                      }}
                      placeholder="0"
                      className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none text-slate-900 dark:text-slate-100 ${accent.ring}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Preview Total */}
          <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Total
              </div>
              <div className="text-[11px] text-slate-400">
                {totals.filledCount > 0
                  ? `${totals.filledCount} sumber terisi`
                  : "Belum ada yang diisi"}
              </div>
            </div>
            <div className={`text-lg font-bold ${accent.totalColor}`}>
              {formatRupiah(totals.total)}
            </div>
          </div>

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
              {saving
                ? "Menyimpan..."
                : `Simpan${totals.filledCount > 1 ? ` (${totals.filledCount} transaksi)` : ""}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
