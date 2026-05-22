"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Topbar from "../../../components/Topbar";
import TransactionFormModal from "../../../components/TransactionFormModal";
import MultiSourceFormModal from "../../../components/MultiSourceFormModal";
import { useAuth } from "../../../components/AuthProvider";
import {
  deleteBook,
  deleteTransaction,
  subscribeBook,
  subscribeBookDebts,
  subscribeBookTransactions,
  summarize,
  withRunningBalance,
} from "../../../lib/storage";
import { displayCategoryLabel, getCategoryLabel } from "../../../lib/categories";
import { getQuickActions, getTemplate } from "../../../lib/templates";
import { PAYMENT_SOURCES, getSourceIcon, getSourceLabel } from "../../../lib/sources";
import { formatDate, formatRupiah } from "../../../lib/format";

export default function BukuDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const { user } = useAuth();

  const [book, setBook] = useState(null);
  const [txs, setTxs] = useState([]);
  const [debts, setDebts] = useState([]);
  const [ready, setReady] = useState(false);
  const [bookLoaded, setBookLoaded] = useState(false);

  const [modal, setModal] = useState({
    open: false,
    type: "in",
    initial: null,
    preset: null,
  });
  const [multiModal, setMultiModal] = useState({ open: false, preset: null });
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    if (!user) return;
    let gotBook = false;
    let gotTxs = false;
    const markReady = () => {
      if (gotBook && gotTxs) setReady(true);
    };
    const unsubB = subscribeBook(user.uid, id, (b) => {
      setBook(b);
      gotBook = true;
      setBookLoaded(true);
      markReady();
    });
    const unsubT = subscribeBookTransactions(user.uid, id, (t) => {
      setTxs(t);
      gotTxs = true;
      markReady();
    });
    const unsubD = subscribeBookDebts(user.uid, id, setDebts);
    return () => {
      unsubB();
      unsubT();
      unsubD();
    };
  }, [user, id]);

  const debtsSummary = useMemo(() => {
    const piutangBelum = debts
      .filter((d) => d.type === "piutang" && d.status === "belum_lunas")
      .reduce((s, d) => s + d.amount, 0);
    const hutangBelum = debts
      .filter((d) => d.type === "hutang" && d.status === "belum_lunas")
      .reduce((s, d) => s + d.amount, 0);
    const countBelum = debts.filter((d) => d.status === "belum_lunas").length;
    return { piutangBelum, hutangBelum, countBelum };
  }, [debts]);

  const summary = summarize(book, txs);
  const rowsRaw = useMemo(() => withRunningBalance(book, txs), [book, txs]);

  // Collapse multiple "Saldo Awal" rows jadi 1 row dengan breakdown.
  // Issue 5 fix: kalau buku punya saldo awal di 3 sumber, tabel tampil 1
  // baris "Saldo Awal Total" dengan breakdown per-sumber di sub-text.
  const rows = useMemo(() => {
    const opening = rowsRaw.filter((r) => r.isOpening);
    const rest = rowsRaw.filter((r) => !r.isOpening);
    if (opening.length <= 1) return rowsRaw;
    const totalAmount = opening.reduce((s, r) => s + r.amount, 0);
    const lastRunning = opening[opening.length - 1].running;
    const combined = {
      id: `__opening_combined_${opening[0].bookId}`,
      bookId: opening[0].bookId,
      type: "in",
      date: opening[0].date,
      description: "Saldo Awal",
      amount: totalAmount,
      running: lastRunning,
      quantity: 0,
      unitPrice: 0,
      createdAt: opening[0].createdAt,
      isOpening: true,
      openingBreakdown: opening.map((r) => ({
        source: r.source,
        amount: r.amount,
      })),
    };
    return [combined, ...rest];
  }, [rowsRaw]);

  const visibleRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      // Source filter (skip untuk opening combined yang punya breakdown)
      if (sourceFilter !== "all") {
        if (r.openingBreakdown) {
          // opening combined: cek apakah ada source yang cocok
          const hasMatch = r.openingBreakdown.some(
            (b) => b.source === sourceFilter
          );
          if (!hasMatch) return false;
        } else if ((r.source || "cash") !== sourceFilter) {
          return false;
        }
      }
      // Date filter (skip opening, supaya tetap selalu tampil)
      if (!r.isOpening) {
        if (dateFrom && r.date < dateFrom) return false;
        if (dateTo && r.date > dateTo) return false;
      }
      // Search
      if (q) {
        const desc = (r.description || "").toLowerCase();
        const cat = displayCategoryLabel(r).toLowerCase();
        const src = getSourceLabel(r.source).toLowerCase();
        if (
          !desc.includes(q) &&
          !cat.includes(q) &&
          !src.includes(q)
        )
          return false;
      }
      return true;
    });
  }, [rows, search, sourceFilter, dateFrom, dateTo]);

  if (bookLoaded && !book) {
    return (
      <>
        <Topbar title="Buku tidak ditemukan" />
        <div className="p-8 text-center">
          <p className="text-slate-500">Buku ini mungkin sudah dihapus.</p>
          <Link
            href="/"
            className="inline-block mt-4 text-income-700 font-medium"
          >
            Kembali ke Dashboard
          </Link>
        </div>
      </>
    );
  }

  const onDeleteBook = async () => {
    if (
      !confirm(
        `Hapus buku "${book?.name}"? Semua transaksi di dalamnya juga akan dihapus.`
      )
    )
      return;
    await deleteBook(user.uid, id);
    router.push("/");
  };

  const onDeleteTx = async (txId) => {
    if (!confirm("Hapus transaksi ini?")) return;
    await deleteTransaction(user.uid, txId);
  };

  const onEditTx = (tx) => {
    setModal({ open: true, type: tx.type, initial: tx, preset: null });
  };

  return (
    <>
      <Topbar
        title={book?.name || "Memuat..."}
        subtitle={
          book ? `Saldo awal ${formatRupiah(summary.opening)}` : undefined
        }
        actions={
          book ? (
            <div className="flex items-center gap-1 md:gap-2">
              <Link
                href={`/buku/${id}/hutang-piutang`}
                className="text-xs md:text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white font-medium px-2 md:px-3 py-2"
                title="Hutang & Piutang"
              >
                <span className="hidden sm:inline">Hutang/Piutang</span>
                <span className="sm:hidden">H/P</span>
              </Link>
              <Link
                href={`/buku/${id}/edit`}
                className="text-xs md:text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white font-medium px-2 md:px-3 py-2"
              >
                Edit
              </Link>
              <button
                onClick={onDeleteBook}
                className="text-xs md:text-sm text-expense-600 hover:text-expense-700 font-medium px-2 md:px-3 py-2"
                title="Hapus buku"
              >
                Hapus
              </button>
            </div>
          ) : null
        }
      />

      <div className="p-4 md:p-8 space-y-6">
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          <SummaryBox label="Total Kas Masuk" value={summary.totalIn} tone="income" />
          <SummaryBox label="Total Kas Keluar" value={summary.totalOut} tone="expense" />
          <SummaryBox label="Sisa Saldo" value={summary.balance} tone="neutral" />
        </section>

        {/* Hutang Piutang Summary - tampil hanya kalau ada record */}
        {debtsSummary.countBelum > 0 ? (
          <Link
            href={`/buku/${id}/hutang-piutang`}
            className="block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 hover:border-income-500 transition-colors"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                  Hutang & Piutang Belum Lunas
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {debtsSummary.piutangBelum > 0 ? (
                    <div className="text-sm">
                      <span className="text-income-700 font-semibold">
                        📥 {formatRupiah(debtsSummary.piutangBelum)}
                      </span>
                      <span className="text-xs text-slate-400 ml-1">
                        (piutang)
                      </span>
                    </div>
                  ) : null}
                  {debtsSummary.hutangBelum > 0 ? (
                    <div className="text-sm">
                      <span className="text-expense-700 font-semibold">
                        📤 {formatRupiah(debtsSummary.hutangBelum)}
                      </span>
                      <span className="text-xs text-slate-400 ml-1">
                        (hutang)
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
              <span className="text-xs text-income-700 font-medium shrink-0">
                Lihat →
              </span>
            </div>
          </Link>
        ) : null}

        <QuickActionsBar
          book={book}
          onAction={(action) => {
            if (action.preset?.multiSource) {
              setMultiModal({ open: true, preset: action.preset });
            } else {
              setModal({
                open: true,
                type: action.preset.type,
                initial: null,
                preset: action.preset,
              });
            }
          }}
        />

        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">
                Riwayat Transaksi
              </h2>
              <span className="text-xs text-slate-500 whitespace-nowrap">
                {visibleRows.filter((r) => !r.isOpening).length} transaksi
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari keterangan / kategori / sumber..."
                className="sm:col-span-5 text-sm px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-income-500 outline-none"
              />
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="sm:col-span-3 text-sm px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-income-500 outline-none"
              >
                <option value="all">Semua Sumber</option>
                {PAYMENT_SOURCES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.icon} {s.shortLabel}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                placeholder="Dari"
                title="Dari tanggal"
                className="sm:col-span-2 text-sm px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-income-500 outline-none"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                placeholder="Sampai"
                title="Sampai tanggal"
                className="sm:col-span-2 text-sm px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-income-500 outline-none"
              />
            </div>
            {(sourceFilter !== "all" || dateFrom || dateTo || search) ? (
              <button
                onClick={() => {
                  setSearch("");
                  setSourceFilter("all");
                  setDateFrom("");
                  setDateTo("");
                }}
                className="text-xs text-income-700 hover:underline"
              >
                ✕ Reset filter
              </button>
            ) : null}
          </div>

          {!ready ? (
            <div className="p-8 text-sm text-slate-400">Memuat...</div>
          ) : visibleRows.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm text-slate-500">
                {search
                  ? "Tidak ada transaksi yang cocok."
                  : "Belum ada transaksi. Tambahkan kas masuk atau kas keluar untuk memulai."}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">
                    <tr>
                      <th className="text-left px-5 py-3 font-medium">Tanggal</th>
                      <th className="text-left px-5 py-3 font-medium">Keterangan</th>
                      <th className="text-left px-5 py-3 font-medium">Kategori</th>
                      <th className="text-left px-3 py-3 font-medium">Sumber</th>
                      <th className="text-right px-5 py-3 font-medium">Kas Masuk</th>
                      <th className="text-right px-5 py-3 font-medium">Kas Keluar</th>
                      <th className="text-right px-5 py-3 font-medium">Saldo</th>
                      <th className="px-5 py-3 w-16"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...visibleRows].reverse().map((r) => (
                      <tr
                        key={r.id}
                        className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      >
                        <td className="px-5 py-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {formatDate(r.date)}
                        </td>
                        <td className="px-5 py-3 text-slate-900 dark:text-slate-100">
                          <div>{r.description}</div>
                          {!r.isOpening && r.quantity > 1 && r.unitPrice > 0 ? (
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {r.quantity} × {formatRupiah(r.unitPrice)}
                            </div>
                          ) : null}
                          {r.openingBreakdown ? (
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {r.openingBreakdown
                                .map(
                                  (b) =>
                                    `${getSourceIcon(b.source)} ${formatRupiah(b.amount)}`
                                )
                                .join(" + ")}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-5 py-3 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">
                          {r.isOpening ? "—" : displayCategoryLabel(r) || "—"}
                        </td>
                        <td className="px-3 py-3 text-xs whitespace-nowrap">
                          {r.openingBreakdown ? (
                            <span className="text-slate-400">multi</span>
                          ) : r.source ? (
                            <span
                              className="text-slate-600 dark:text-slate-300"
                              title={getSourceLabel(r.source)}
                            >
                              {getSourceIcon(r.source)}{" "}
                              <span className="hidden lg:inline">
                                {getSourceLabel(r.source)}
                              </span>
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-5 py-3 text-right text-income-700 font-medium whitespace-nowrap">
                          {r.type === "in" ? formatRupiah(r.amount) : "-"}
                        </td>
                        <td className="px-5 py-3 text-right text-expense-700 font-medium whitespace-nowrap">
                          {r.type === "out" ? formatRupiah(r.amount) : "-"}
                        </td>
                        <td
                          className={`px-5 py-3 text-right font-semibold whitespace-nowrap ${
                            r.running < 0
                              ? "text-expense-600"
                              : "text-slate-900 dark:text-slate-100"
                          }`}
                        >
                          {formatRupiah(r.running)}
                        </td>
                        <td className="px-3 py-3 text-right whitespace-nowrap">
                          {r.isOpening ? null : (
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => onEditTx(r)}
                                className="text-slate-400 hover:text-income-700 p-1"
                                title="Edit"
                              >
                                <EditIcon />
                              </button>
                              <button
                                onClick={() => onDeleteTx(r.id)}
                                className="text-slate-400 hover:text-expense-600 p-1"
                                title="Hapus"
                              >
                                <TrashIcon />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <ul className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                {[...visibleRows].reverse().map((r) => (
                  <li key={r.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                          {r.description}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {formatDate(r.date)}
                          {!r.isOpening && r.source
                            ? ` · ${getSourceIcon(r.source)}`
                            : ""}
                          {!r.isOpening && displayCategoryLabel(r)
                            ? ` · ${displayCategoryLabel(r)}`
                            : ""}
                          {!r.isOpening && r.quantity > 1 && r.unitPrice > 0
                            ? ` · ${r.quantity} × ${formatRupiah(r.unitPrice)}`
                            : ""}
                        </p>
                        {r.openingBreakdown ? (
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {r.openingBreakdown
                              .map(
                                (b) =>
                                  `${getSourceIcon(b.source)} ${formatRupiah(b.amount)}`
                              )
                              .join(" + ")}
                          </p>
                        ) : null}
                      </div>
                      <div className="text-right shrink-0">
                        <div
                          className={`text-sm font-semibold ${
                            r.type === "in"
                              ? "text-income-700"
                              : "text-expense-700"
                          }`}
                        >
                          {r.type === "in" ? "+" : "-"}
                          {formatRupiah(r.amount)}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Saldo: {formatRupiah(r.running)}
                        </div>
                      </div>
                    </div>
                    {r.isOpening ? null : (
                      <div className="mt-2 flex justify-end gap-3 text-xs">
                        <button
                          onClick={() => onEditTx(r)}
                          className="text-income-700 hover:text-income-800"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDeleteTx(r.id)}
                          className="text-slate-400 hover:text-expense-600"
                        >
                          Hapus
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>

      <TransactionFormModal
        open={modal.open}
        type={modal.type}
        bookId={id}
        initial={modal.initial}
        preset={modal.preset}
        onClose={() =>
          setModal({ open: false, type: modal.type, initial: null, preset: null })
        }
      />

      <MultiSourceFormModal
        open={multiModal.open}
        bookId={id}
        preset={multiModal.preset}
        onClose={() => setMultiModal({ open: false, preset: null })}
      />
    </>
  );
}

function QuickActionsBar({ book, onAction }) {
  const actions = getQuickActions(book?.template);
  const template = getTemplate(book?.template);

  return (
    <section className="space-y-2">
      {template && template.id !== "custom" && template.tips ? (
        <p className="text-xs text-slate-500 dark:text-slate-400 px-1">
          💡 {template.tips}
        </p>
      ) : null}
      <div
        className={`grid gap-2 ${
          actions.length <= 2
            ? "grid-cols-2"
            : actions.length === 3
            ? "grid-cols-2 sm:grid-cols-3"
            : "grid-cols-2 sm:grid-cols-4"
        }`}
      >
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => onAction(action)}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 font-medium py-3 px-2 rounded-lg shadow-sm text-white text-sm text-center ${
              action.tone === "income"
                ? "bg-income-600 hover:bg-income-700"
                : "bg-expense-600 hover:bg-expense-700"
            }`}
          >
            <span className="text-base sm:text-lg">{action.icon}</span>
            <span className="leading-tight">{action.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function SummaryBox({ label, value, tone }) {
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

function PlusIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
function MinusIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <path d="M5 12h14" />
    </svg>
  );
}
function EditIcon() {
  return (
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
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}
function TrashIcon() {
  return (
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
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    </svg>
  );
}
