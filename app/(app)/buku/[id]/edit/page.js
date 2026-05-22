"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Topbar from "../../../../components/Topbar";
import { useAuth } from "../../../../components/AuthProvider";
import { getBook, updateBook } from "../../../../lib/storage";
import { PAYMENT_SOURCES } from "../../../../lib/sources";
import { formatRupiah } from "../../../../lib/format";

const formatGroup = (digits) =>
  digits ? new Intl.NumberFormat("id-ID").format(digits) : "";

export default function EditBukuPage() {
  const router = useRouter();
  const { id } = useParams();
  const { user } = useAuth();

  const [name, setName] = useState("");
  const [balances, setBalances] = useState({
    cash: "",
    bank: "",
    ewallet: "",
    qris: "",
    lain: "",
  });
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const b = await getBook(user.uid, id);
      if (b) {
        setName(b.name);
        const balanceInit = {
          cash: "",
          bank: "",
          ewallet: "",
          qris: "",
          lain: "",
        };
        for (const [k, v] of Object.entries(b.openingBalances || {})) {
          if (v > 0) balanceInit[k] = formatGroup(String(v));
        }
        setBalances(balanceInit);
      }
      setLoaded(true);
    })();
  }, [user, id]);

  const totalOpening = useMemo(
    () =>
      Object.values(balances).reduce(
        (s, v) => s + (Number(v.replace(/\D/g, "")) || 0),
        0
      ),
    [balances]
  );

  const setBalance = (source, value) => {
    const digits = value.replace(/\D/g, "");
    setBalances((prev) => ({ ...prev, [source]: formatGroup(digits) }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Nama buku wajib diisi.");
      return;
    }
    setSaving(true);
    try {
      const cleanedBalances = {};
      for (const [k, v] of Object.entries(balances)) {
        const n = Number(v.replace(/\D/g, "")) || 0;
        if (n > 0) cleanedBalances[k] = n;
      }
      const total = Object.values(cleanedBalances).reduce((s, v) => s + v, 0);
      await updateBook(user.uid, id, {
        name: name.trim(),
        openingBalance: total,
        openingBalances: cleanedBalances,
      });
      router.push(`/buku/${id}`);
    } catch (err) {
      setError("Gagal menyimpan: " + (err?.message || "error"));
      setSaving(false);
    }
  };

  return (
    <>
      <Topbar title="Edit Buku" subtitle="Ubah nama atau saldo awal buku" />

      <div className="p-4 md:p-8">
        <div className="max-w-xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-8">
          {!loaded ? (
            <p className="text-sm text-slate-400">Memuat...</p>
          ) : (
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
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-income-500 focus:ring-2 focus:ring-income-100 outline-none text-slate-900 dark:text-slate-100"
                />
                {error ? (
                  <p className="text-xs text-expense-600 mt-1.5">{error}</p>
                ) : null}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Saldo Awal per Sumber Dana
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  Mengubah saldo awal akan mempengaruhi perhitungan saldo
                  berjalan & saldo per sumber dana.
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
                          value={balances[s.id]}
                          onChange={(e) => setBalance(s.id, e.target.value)}
                          placeholder="0"
                          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-income-500 focus:ring-2 focus:ring-income-100 outline-none text-slate-900 dark:text-slate-100"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                {totalOpening > 0 ? (
                  <div className="mt-3 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">
                      Total Saldo Awal
                    </span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {formatRupiah(totalOpening)}
                    </span>
                  </div>
                ) : null}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-income-600 hover:bg-income-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg"
                >
                  {saving ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
                <Link
                  href={`/buku/${id}`}
                  className="px-4 py-2.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-sm font-medium"
                >
                  Batal
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
