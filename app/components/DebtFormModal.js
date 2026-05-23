"use client";

import { useEffect, useState } from "react";
import { addDebt, updateDebt } from "../lib/storage";
import { useAuth } from "./AuthProvider";
import { useToast } from "./ToastProvider";
import { formatRupiah, todayISO } from "../lib/format";

const formatGroup = (digits) =>
  digits ? new Intl.NumberFormat("id-ID").format(digits) : "";

export default function DebtFormModal({
  open,
  bookId,
  defaultType = "piutang",
  initial = null,
  onClose,
  onSaved,
}) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isEdit = !!initial;

  const [type, setType] = useState(defaultType);
  const [counterpart, setCounterpart] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO());
  const [dueDate, setDueDate] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setType(initial.type || "piutang");
      setCounterpart(initial.counterpart || "");
      setAmount(formatGroup(String(initial.amount || "")));
      setDate(initial.date || todayISO());
      setDueDate(initial.dueDate || "");
      setNote(initial.note || "");
    } else {
      setType(defaultType);
      setCounterpart("");
      setAmount("");
      setDate(todayISO());
      setDueDate("");
      setNote("");
    }
    setError("");
    setSaving(false);
  }, [open, initial, defaultType]);

  if (!open) return null;

  const amountNum = Number(amount.replace(/\D/g, "")) || 0;

  const isPiutang = type === "piutang";
  const accent = isPiutang
    ? {
        title: isEdit ? "Edit Piutang" : "Catat Piutang Baru",
        chip: "bg-income-50 text-income-700",
        btn: "bg-income-600 hover:bg-income-700",
        ring: "focus:ring-income-100 focus:border-income-500",
        desc: "Orang lain hutang ke saya",
      }
    : {
        title: isEdit ? "Edit Hutang" : "Catat Hutang Baru",
        chip: "bg-expense-50 text-expense-700",
        btn: "bg-expense-600 hover:bg-expense-700",
        ring: "focus:ring-expense-100 focus:border-expense-500",
        desc: "Saya hutang ke orang lain",
      };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!counterpart.trim()) {
      setError("Nama pihak wajib diisi.");
      return;
    }
    if (amountNum <= 0) {
      setError("Jumlah harus lebih dari 0.");
      return;
    }
    if (!user) return;
    setSaving(true);
    try {
      if (isEdit) {
        await updateDebt(user.uid, initial.id, {
          type,
          counterpart: counterpart.trim(),
          amount: amountNum,
          date,
          dueDate,
          note: note.trim(),
        });
      } else {
        await addDebt(user.uid, {
          bookId,
          type,
          counterpart,
          amount: amountNum,
          date,
          dueDate,
          note,
        });
      }
      showToast(isEdit ? "Berhasil diperbarui" : "Berhasil disimpan");
      onSaved && onSaved();
      onClose();
    } catch (err) {
      setError(err.message || "Gagal menyimpan");
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
          {/* Toggle Piutang/Hutang */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <button
              type="button"
              onClick={() => setType("piutang")}
              className={`py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                isPiutang
                  ? "bg-white dark:bg-slate-900 text-income-700 shadow-sm"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              📥 Piutang
              <div className="text-[10px] font-normal opacity-80">
                Orang hutang ke saya
              </div>
            </button>
            <button
              type="button"
              onClick={() => setType("hutang")}
              className={`py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                !isPiutang
                  ? "bg-white dark:bg-slate-900 text-expense-700 shadow-sm"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              📤 Hutang
              <div className="text-[10px] font-normal opacity-80">
                Saya hutang ke orang
              </div>
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Nama {isPiutang ? "Pelanggan" : "Pemberi Hutang"}{" "}
              <span className="text-expense-600">*</span>
            </label>
            <input
              type="text"
              value={counterpart}
              onChange={(e) => {
                setCounterpart(e.target.value);
                setError("");
              }}
              placeholder={isPiutang ? "Bu Tini" : "Toko Bangunan ABC"}
              className={`w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none text-slate-900 dark:text-slate-100 ${accent.ring}`}
              autoFocus
            />
          </div>

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
                value={amount}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "");
                  setAmount(formatGroup(digits));
                  setError("");
                }}
                placeholder="0"
                className={`w-full pl-10 pr-3 py-3 text-lg rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none text-slate-900 dark:text-slate-100 font-semibold ${accent.ring}`}
              />
            </div>
          </div>

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
                Jatuh Tempo
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={`w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none text-slate-900 dark:text-slate-100 ${accent.ring}`}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Catatan <span className="text-slate-400">(opsional)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Detail tambahan..."
              className={`w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none text-slate-900 dark:text-slate-100 ${accent.ring}`}
            />
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
