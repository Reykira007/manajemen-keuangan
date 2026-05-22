"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Link from "next/link";
import Topbar from "../../components/Topbar";
import { useAuth } from "../../components/AuthProvider";
import {
  openingRows,
  subscribeAllTransactions,
  subscribeBooks,
} from "../../lib/storage";
import { displayCategoryLabel } from "../../lib/categories";
import { formatRupiah, todayISO } from "../../lib/format";

// Palet warna untuk pie chart
const COLORS = [
  "#10b981", "#ef4444", "#3b82f6", "#f59e0b", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16",
];

function firstDayOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

export default function LaporanPage() {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [txs, setTxs] = useState([]);
  const [from, setFrom] = useState(firstDayOfMonth());
  const [to, setTo] = useState(todayISO());
  const [bookFilter, setBookFilter] = useState("all");

  useEffect(() => {
    if (!user) return;
    const unsubB = subscribeBooks(user.uid, setBooks);
    const unsubT = subscribeAllTransactions(user.uid, setTxs);
    return () => {
      unsubB();
      unsubT();
    };
  }, [user]);

  const allEntries = useMemo(() => {
    const synth = books.flatMap((b) => openingRows(b));
    return [...synth, ...txs];
  }, [books, txs]);

  const inRange = useMemo(() => {
    return allEntries.filter((t) => {
      if (bookFilter !== "all" && t.bookId !== bookFilter) return false;
      if (from && t.date < from) return false;
      if (to && t.date > to) return false;
      return true;
    });
  }, [allEntries, from, to, bookFilter]);

  // Ringkasan
  const totals = useMemo(() => {
    let inSum = 0, outSum = 0;
    for (const t of inRange) {
      if (t.type === "in") inSum += t.amount;
      else outSum += t.amount;
    }
    return { inSum, outSum, net: inSum - outSum };
  }, [inRange]);

  // Aggregasi per kategori (kas keluar saja, paling sering yang ingin dianalisis)
  const byCategoryOut = useMemo(() => {
    const map = {};
    for (const t of inRange) {
      if (t.type !== "out") continue;
      const label = displayCategoryLabel(t) || "Tanpa Kategori";
      map[label] = (map[label] || 0) + t.amount;
    }
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [inRange]);

  const byCategoryIn = useMemo(() => {
    const map = {};
    for (const t of inRange) {
      if (t.type !== "in") continue;
      const label = t.isOpening
        ? "Saldo Awal"
        : displayCategoryLabel(t) || "Tanpa Kategori";
      map[label] = (map[label] || 0) + t.amount;
    }
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [inRange]);

  // Aggregasi per bulan
  const byMonth = useMemo(() => {
    const map = {};
    for (const t of inRange) {
      const ym = (t.date || "").slice(0, 7); // YYYY-MM
      if (!ym) continue;
      if (!map[ym]) map[ym] = { month: ym, masuk: 0, keluar: 0 };
      if (t.type === "in") map[ym].masuk += t.amount;
      else map[ym].keluar += t.amount;
    }
    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month));
  }, [inRange]);

  return (
    <>
      <Topbar
        title="Laporan"
        subtitle="Analisis pengeluaran & pemasukan per kategori dan bulan"
        actions={
          <Link
            href="/laporan/laba-rugi"
            className="inline-flex items-center gap-2 bg-income-600 hover:bg-income-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
            </svg>
            <span className="hidden sm:inline">Laba Rugi + PDF</span>
            <span className="sm:hidden">Laba Rugi</span>
          </Link>
        }
      />

      <div className="p-4 md:p-8 space-y-6">
        {/* Filter */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Dari Tanggal
            </label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-income-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Sampai Tanggal
            </label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-income-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Buku
            </label>
            <select
              value={bookFilter}
              onChange={(e) => setBookFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-income-500"
            >
              <option value="all">Semua Buku</option>
              {books.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* Ringkasan */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          <SumBox label="Kas Masuk" value={totals.inSum} tone="income" />
          <SumBox label="Kas Keluar" value={totals.outSum} tone="expense" />
          <SumBox label="Selisih" value={totals.net} tone="neutral" />
        </section>

        {/* Chart per bulan */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 md:p-5">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Per Bulan
          </h3>
          {byMonth.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-10">
              Tidak ada data di rentang ini.
            </p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byMonth}>
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={12}
                    tickFormatter={(v) => formatShort(v)}
                  />
                  <Tooltip
                    formatter={(v) => formatRupiah(v)}
                    contentStyle={{
                      background: "#0f172a",
                      border: "none",
                      borderRadius: 8,
                      color: "#f1f5f9",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="masuk" name="Kas Masuk" fill="#10b981" />
                  <Bar dataKey="keluar" name="Kas Keluar" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        {/* Pie chart kategori keluar & masuk */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CategoryPie
            title="Kas Keluar per Kategori"
            data={byCategoryOut}
            emptyText="Belum ada pengeluaran di rentang ini."
          />
          <CategoryPie
            title="Kas Masuk per Kategori"
            data={byCategoryIn}
            emptyText="Belum ada pemasukan di rentang ini."
          />
        </section>
      </div>
    </>
  );
}

function formatShort(v) {
  const n = Number(v) || 0;
  if (Math.abs(n) >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + "M";
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + "jt";
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(0) + "rb";
  return String(n);
}

function CategoryPie({ title, data, emptyText }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 md:p-5">
      <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">
        {title}
      </h3>
      {data.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-10">{emptyText}</p>
      ) : (
        <>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={false}
                >
                  {data.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => formatRupiah(v)}
                  contentStyle={{
                    background: "#0f172a",
                    border: "none",
                    borderRadius: 8,
                    color: "#f1f5f9",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-3 space-y-1.5">
            {data.map((d, i) => {
              const total = data.reduce((s, x) => s + x.value, 0);
              const pct = total ? ((d.value / total) * 100).toFixed(1) : 0;
              return (
                <li
                  key={d.name}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-sm shrink-0"
                      style={{ background: COLORS[i % COLORS.length] }}
                    />
                    <span className="truncate text-slate-700 dark:text-slate-300">
                      {d.name}
                    </span>
                  </span>
                  <span className="shrink-0 text-slate-500 dark:text-slate-400">
                    {formatRupiah(d.value)}{" "}
                    <span className="text-xs">({pct}%)</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

function SumBox({ label, value, tone }) {
  const chip = {
    income: "bg-income-50 text-income-700",
    expense: "bg-expense-50 text-expense-700",
    neutral: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300",
  }[tone];

  const color =
    tone === "income"
      ? "text-income-700"
      : tone === "expense"
      ? "text-expense-700"
      : value < 0
      ? "text-expense-700"
      : "text-slate-900 dark:text-slate-100";

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 md:p-5">
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
