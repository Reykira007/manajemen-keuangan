"use client";

import { useEffect, useMemo, useState } from "react";
import { addTransaction, updateTransaction } from "../lib/storage";
import { getCategoriesFor } from "../lib/categories";
import { useAuth } from "./AuthProvider";
import { formatRupiah, todayISO } from "../lib/format";

const formatGroup = (digits) =>
  digits ? new Intl.NumberFormat("id-ID").format(digits) : "";

export default function TransactionFormModal({
  open,
  type, // "in" | "out"
  bookId,
  initial = null, // bila edit: { id, date, description, category, quantity, unitPrice, type }
  onClose,
  onSaved,
}) {
  const { user } = useAuth();
  const isEdit = !!initial;
  const actualType = initial?.type || type;

  const [date, setDate] = useState(todayISO());
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (initial) {
        setDate(initial.date || todayISO());
        setDescription(initial.description || "");
        setCategory(initial.category || "");
        setQuantity(String(initial.quantity || 1));
        setUnitPrice(formatGroup(String(initial.unitPrice || "")));
      } else {
        setDate(todayISO());
        setDescription("");
        setCategory("");
        setQuantity("1");
        setUnitPrice("");
      }
      setError("");
      setSaving(false);
    }
  }, [open, initial]);

  const qtyNum = Number(quantity.replace(/[^\d.]/g, "")) || 0;
  const unitNum = Number(unitPrice.replace(/\D/g, "")) || 0;
  const total = useMemo(() => qtyNum * unitNum, [qtyNum, unitNum]);

  const categories = getCategoriesFor(actualType);

  if (!open) return null;

  const isIn = actualType === "in";
  const accent = isIn
    ? {
        title: isEdit ? "Edit Kas Masuk" : "Tambah Kas Masuk",
        btn: "bg-income-600 hover:bg-income-700",
        ring: "focus:ring-income-100 focus:border-income-500",
        chip: "bg-income-50 text-income-700",
        totalColor: "text-income-700",
      }
    : {
        title: isEdit ? "Edit Kas Keluar" : "Tambah Kas Keluar",
        btn: "bg-expense-600 hover:bg-expense-700",
        ring: "focus:ring-expense-100 focus:border-expense-500",
        chip: "bg-expense-50 text-expense-700",
        totalColor: "text-expense-700",
      };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      setError("Keterangan wajib diisi.");
      return;
    }
    if (qtyNum <= 0) {
      setError("Jumlah barang harus lebih dari 0.");
      return;
    }
    if (unitNum <= 0) {
      setError("Harga satuan harus lebih dari 0.");
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
          quantity: qtyNum,
          unitPrice: unitNum,
        });
      } else {
        await addTransaction(user.uid, {
          bookId,
          type: actualType,
          date,
          description,
          category,
          quantity: qtyNum,
          unitPrice: unitNum,
        });
      }
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
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Kategori
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={`w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none text-slate-900 dark:text-slate-100 ${accent.ring}`}
            >
              <option value="">— Pilih kategori (opsional) —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

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
                className={`w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none text-slate-900 dark:text-slate-100 ${accent.ring}`}
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
                  className={`w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none text-slate-900 dark:text-slate-100 ${accent.ring}`}
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Harga per unit</p>
            </div>
          </div>

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
