"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Topbar from "../../components/Topbar";
import { useAuth } from "../../components/AuthProvider";
import {
  openingRow,
  subscribeAllTransactions,
  subscribeBooks,
} from "../../lib/storage";
import { displayCategoryLabel, getCategoryLabel } from "../../lib/categories";
import { PAYMENT_SOURCES, getSourceIcon, getSourceLabel } from "../../lib/sources";
import { formatDate, formatRupiah } from "../../lib/format";

export default function SemuaTransaksiPage() {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [txs, setTxs] = useState([]);
  const [ready, setReady] = useState(false);
  const [bookFilter, setBookFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) return;
    let gotB = false;
    let gotT = false;
    const markReady = () => {
      if (gotB && gotT) setReady(true);
    };
    const unsubB = subscribeBooks(user.uid, (b) => {
      setBooks(b);
      gotB = true;
      markReady();
    });
    const unsubT = subscribeAllTransactions(user.uid, (t) => {
      setTxs(t);
      gotT = true;
      markReady();
    });
    return () => {
      unsubB();
      unsubT();
    };
  }, [user]);

  const bookMap = useMemo(() => {
    const m = {};
    for (const b of books) m[b.id] = b;
    return m;
  }, [books]);

  // Sertakan saldo awal sebagai entri sintetis "Kas Masuk"
  const allEntries = useMemo(() => {
    const synth = books.map((b) => openingRow(b)).filter(Boolean);
    return [...synth, ...txs];
  }, [books, txs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allEntries
      .filter((t) => (bookFilter === "all" ? true : t.bookId === bookFilter))
      .filter((t) => (typeFilter === "all" ? true : t.type === typeFilter))
      .filter((t) =>
        sourceFilter === "all" ? true : (t.source || "cash") === sourceFilter
      )
      .filter((t) => {
        if (!q) return true;
        const desc = (t.description || "").toLowerCase();
        const cat = displayCategoryLabel(t).toLowerCase();
        const bookName = (bookMap[t.bookId]?.name || "").toLowerCase();
        return desc.includes(q) || cat.includes(q) || bookName.includes(q);
      })
      .sort((a, b) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        return (b.createdAt || "").localeCompare(a.createdAt || "");
      });
  }, [allEntries, bookFilter, typeFilter, sourceFilter, search, bookMap]);

  // Saldo per Sumber Dana (untuk widget)
  const byPaymentSource = useMemo(() => {
    const map = {};
    for (const s of PAYMENT_SOURCES) {
      map[s.id] = { ...s, total: 0 };
    }
    for (const t of allEntries) {
      const id = t.source || "cash";
      if (!map[id]) continue;
      if (t.type === "in") map[id].total += t.amount;
      else map[id].total -= t.amount;
    }
    return Object.values(map);
  }, [allEntries]);

  const totals = useMemo(() => {
    let inSum = 0;
    let outSum = 0;
    for (const t of filtered) {
      if (t.type === "in") inSum += t.amount;
      else outSum += t.amount;
    }
    return { inSum, outSum, net: inSum - outSum };
  }, [filtered]);

  return (
    <>
      <Topbar title="Semua Transaksi" subtitle="Riwayat lintas semua buku" />

      <div className="p-4 md:p-8 space-y-6">
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          <Box label="Kas Masuk" value={totals.inSum} tone="income" />
          <Box label="Kas Keluar" value={totals.outSum} tone="expense" />
          <Box label="Selisih" value={totals.net} tone="neutral" />
        </section>

        {/* Saldo per Sumber Dana */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Saldo per Sumber Dana
            </h3>
            <span className="text-xs text-slate-400">total lintas buku</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {byPaymentSource.map((s) => (
              <button
                key={s.id}
                onClick={() =>
                  setSourceFilter(sourceFilter === s.id ? "all" : s.id)
                }
                className={`text-left px-3 py-2 rounded-lg border transition-colors ${
                  sourceFilter === s.id
                    ? "border-income-500 bg-income-50 dark:bg-income-500/10"
                    : "border-slate-200 dark:border-slate-700 hover:border-income-300"
                }`}
              >
                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <span>{s.icon}</span>
                  <span>{s.shortLabel}</span>
                </div>
                <div
                  className={`text-sm font-semibold mt-0.5 ${
                    s.total < 0
                      ? "text-expense-700"
                      : "text-slate-900 dark:text-slate-100"
                  }`}
                >
                  {formatRupiah(s.total)}
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-4">
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Cari
            </label>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari keterangan, kategori, atau nama buku..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:border-income-500 focus:ring-2 focus:ring-income-100 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Buku
            </label>
            <select
              value={bookFilter}
              onChange={(e) => setBookFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:border-income-500 focus:ring-2 focus:ring-income-100 outline-none"
            >
              <option value="all">Semua Buku</option>
              {books.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Jenis
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:border-income-500 focus:ring-2 focus:ring-income-100 outline-none"
            >
              <option value="all">Semua</option>
              <option value="in">Kas Masuk</option>
              <option value="out">Kas Keluar</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Sumber Dana
            </label>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:border-income-500 focus:ring-2 focus:ring-income-100 outline-none"
            >
              <option value="all">Semua</option>
              {PAYMENT_SOURCES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.icon} {s.label}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          {!ready ? (
            <div className="p-8 text-sm text-slate-400">Memuat...</div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm text-slate-500">
                Tidak ada transaksi yang cocok dengan filter.
              </p>
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                    <tr>
                      <th className="text-left px-5 py-3 font-medium">Tanggal</th>
                      <th className="text-left px-5 py-3 font-medium">Buku</th>
                      <th className="text-left px-5 py-3 font-medium">Keterangan</th>
                      <th className="text-right px-5 py-3 font-medium">Kas Masuk</th>
                      <th className="text-right px-5 py-3 font-medium">Kas Keluar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((t) => (
                      <tr
                        key={t.id}
                        className="border-t border-slate-100 hover:bg-slate-50"
                      >
                        <td className="px-5 py-3 text-slate-700 whitespace-nowrap">
                          {formatDate(t.date)}
                        </td>
                        <td className="px-5 py-3">
                          <Link
                            href={`/buku/${t.bookId}`}
                            className="text-income-700 hover:underline text-sm font-medium"
                          >
                            {bookMap[t.bookId]?.name || "—"}
                          </Link>
                        </td>
                        <td className="px-5 py-3 text-slate-900 dark:text-slate-100">
                          <div>{t.description}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5 space-x-2">
                            {!t.isOpening && t.source ? (
                              <span title={getSourceLabel(t.source)}>
                                {getSourceIcon(t.source)} {getSourceLabel(t.source)}
                              </span>
                            ) : null}
                            {!t.isOpening && displayCategoryLabel(t) ? (
                              <span>· {displayCategoryLabel(t)}</span>
                            ) : null}
                            {!t.isOpening && t.quantity > 1 && t.unitPrice > 0 ? (
                              <span>
                                · {t.quantity} × {formatRupiah(t.unitPrice)}
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-right text-income-700 font-medium whitespace-nowrap">
                          {t.type === "in" ? formatRupiah(t.amount) : "-"}
                        </td>
                        <td className="px-5 py-3 text-right text-expense-700 font-medium whitespace-nowrap">
                          {t.type === "out" ? formatRupiah(t.amount) : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <ul className="md:hidden divide-y divide-slate-100">
                {filtered.map((t) => (
                  <li key={t.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {t.description}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">
                          <Link
                            href={`/buku/${t.bookId}`}
                            className="text-income-700"
                          >
                            {bookMap[t.bookId]?.name || "—"}
                          </Link>
                          {" · "}
                          {formatDate(t.date)}
                          {!t.isOpening && t.source
                            ? ` · ${getSourceIcon(t.source)}`
                            : ""}
                          {!t.isOpening && t.quantity > 1 && t.unitPrice > 0
                            ? ` · ${t.quantity} × ${formatRupiah(t.unitPrice)}`
                            : ""}
                        </p>
                      </div>
                      <div
                        className={`text-sm font-semibold shrink-0 ${
                          t.type === "in"
                            ? "text-income-700"
                            : "text-expense-700"
                        }`}
                      >
                        {t.type === "in" ? "+" : "-"}
                        {formatRupiah(t.amount)}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>
    </>
  );
}

function Box({ label, value, tone }) {
  const chip = {
    income: "bg-income-50 text-income-700",
    expense: "bg-expense-50 text-expense-700",
    neutral: "bg-slate-100 text-slate-700",
  }[tone];

  const color =
    tone === "income"
      ? "text-income-700"
      : tone === "expense"
      ? "text-expense-700"
      : value < 0
      ? "text-expense-700"
      : "text-slate-900";

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5">
      <span
        className={`inline-block text-[11px] font-medium px-2 py-1 rounded-md ${chip}`}
      >
        {label}
      </span>
      <div className={`mt-2 text-xl md:text-2xl font-bold ${color}`}>
        {formatRupiah(value)}
      </div>
    </div>
  );
}
