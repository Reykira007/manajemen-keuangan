"use client";

import Link from "next/link";
import { formatRupiah, formatDate } from "../lib/format";

export default function BookCard({ book, summary }) {
  return (
    <Link
      href={`/buku/${book.id}`}
      className="block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-income-500 hover:shadow-md transition-all p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
            {book.name}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Dibuat {formatDate(book.createdAt)}
          </p>
        </div>
        <span
          className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${
            summary.balance >= 0
              ? "bg-income-50 text-income-700"
              : "bg-expense-50 text-expense-700"
          }`}
        >
          Saldo
        </span>
      </div>

      <div className="mt-4">
        <div className="text-xs text-slate-500 dark:text-slate-400">Sisa Saldo</div>
        <div
          className={`text-2xl font-bold ${
            summary.balance >= 0
              ? "text-slate-900 dark:text-slate-100"
              : "text-expense-600"
          }`}
        >
          {formatRupiah(summary.balance)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="rounded-lg bg-income-50 dark:bg-income-500/10 p-3">
          <div className="text-[11px] text-income-700 font-medium">
            Kas Masuk
          </div>
          <div className="text-sm font-semibold text-income-700 mt-0.5 truncate">
            {formatRupiah(summary.totalIn)}
          </div>
        </div>
        <div className="rounded-lg bg-expense-50 dark:bg-expense-500/10 p-3">
          <div className="text-[11px] text-expense-700 font-medium">
            Kas Keluar
          </div>
          <div className="text-sm font-semibold text-expense-700 mt-0.5 truncate">
            {formatRupiah(summary.totalOut)}
          </div>
        </div>
      </div>
    </Link>
  );
}
