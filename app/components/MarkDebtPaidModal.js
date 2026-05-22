"use client";

import { useEffect, useState } from "react";
import { markDebtPaid } from "../lib/storage";
import { DEFAULT_SOURCE, PAYMENT_SOURCES } from "../lib/sources";
import { useAuth } from "./AuthProvider";
import { useToast } from "./ToastProvider";
import { formatRupiah, todayISO } from "../lib/format";

export default function MarkDebtPaidModal({ open, debt, onClose, onSaved }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [paidDate, setPaidDate] = useState(todayISO());
  const [source, setSource] = useState(DEFAULT_SOURCE);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setPaidDate(todayISO());
      setSource(DEFAULT_SOURCE);
      setError("");
      setSaving(false);
    }
  }, [open]);

  if (!open || !debt) return null;

  const isPiutang = debt.type === "piutang";
  const accent = isPiutang
    ? {
        title: "Tandai Piutang Lunas",
        chip: "bg-income-50 text-income-700",
        btn: "bg-income-600 hover:bg-income-700",
        info: `${debt.counterpart} melunasi ${formatRupiah(debt.amount)}`,
        sourceLabel: "Dana masuk ke",
      }
    : {
        title: "Tandai Hutang Lunas",
        chip: "bg-expense-50 text-expense-700",
        btn: "bg-expense-600 hover:bg-expense-700",
        info: `Bayar ${formatRupiah(debt.amount)} ke ${debt.counterpart}`,
        sourceLabel: "Dana keluar dari",
      };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await markDebtPaid(user.uid, debt.id, { paidDate, source });
      showToast(
        isPiutang
          ? `Piutang ${debt.counterpart} dilunasi ✓`
          : `Hutang ke ${debt.counterpart} dilunasi ✓`
      );
      onSaved && onSaved();
      onClose();
    } catch (err) {
      setError(err.message || "Gagal menandai lunas");
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 bg-slate-900/40 dark:bg-black/60 flex items-end md:items-center justify-center p-0 md:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 w-full md:max-w-md rounded-t-2xl md:rounded-2xl shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-medium px-2 py-1 rounded-md ${accent.chip}`}
            >
              {isPiutang ? "Piutang" : "Hutang"}
            </span>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              {accent.title}
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
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-sm text-slate-700 dark:text-slate-300">
            {accent.info}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Tanggal Pelunasan
            </label>
            <input
              type="date"
              value={paidDate}
              onChange={(e) => setPaidDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none text-slate-900 dark:text-slate-100"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              {accent.sourceLabel}
            </label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none text-slate-900 dark:text-slate-100"
            >
              {PAYMENT_SOURCES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.icon} {s.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
              Otomatis dibuat transaksi {isPiutang ? "Kas Masuk" : "Kas Keluar"}{" "}
              di sumber dana ini.
            </p>
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
              {saving ? "Menyimpan..." : "Konfirmasi Lunas"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
