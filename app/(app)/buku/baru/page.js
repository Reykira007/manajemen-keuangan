"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Topbar from "../../../components/Topbar";
import { useAuth } from "../../../components/AuthProvider";
import { createBook } from "../../../lib/storage";

export default function BukuBaruPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [opening, setOpening] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Nama buku wajib diisi.");
      return;
    }
    if (!user) return;
    setSaving(true);
    try {
      const book = await createBook(user.uid, {
        name,
        openingBalance: Number(opening.replace(/\D/g, "")) || 0,
      });
      router.push(`/buku/${book.id}`);
    } catch (err) {
      setError("Gagal menyimpan: " + (err?.message || "error"));
      setSaving(false);
    }
  };

  return (
    <>
      <Topbar
        title="Buat Buku Baru"
        subtitle="Misalnya: Pembangunan Rumah, Usaha Perikanan, dll."
      />

      <div className="p-4 md:p-8">
        <div className="max-w-xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-8">
          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Nama Buku <span className="text-expense-600">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError("");
                }}
                placeholder="Contoh: Pembangunan Rumah"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-income-500 focus:ring-2 focus:ring-income-100 outline-none text-slate-900 dark:text-slate-100"
                autoFocus
              />
              {error ? (
                <p className="text-xs text-expense-600 mt-1.5">{error}</p>
              ) : null}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Saldo Awal <span className="text-slate-400">(opsional)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                  Rp
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={opening}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "");
                    setOpening(
                      digits ? new Intl.NumberFormat("id-ID").format(digits) : ""
                    );
                  }}
                  placeholder="0"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-income-500 focus:ring-2 focus:ring-income-100 outline-none text-slate-900 dark:text-slate-100"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1.5">
                Jumlah uang yang sudah ada saat buku dibuat. Ikut dihitung
                sebagai Kas Masuk.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-income-600 hover:bg-income-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg"
              >
                {saving ? "Menyimpan..." : "Buat Buku"}
              </button>
              <Link
                href="/"
                className="px-4 py-2.5 text-slate-600 hover:text-slate-900 text-sm font-medium"
              >
                Batal
              </Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
