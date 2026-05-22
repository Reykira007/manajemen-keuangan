"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Topbar from "../../../components/Topbar";
import TransactionFormModal from "../../../components/TransactionFormModal";
import { useAuth } from "../../../components/AuthProvider";
import {
  deleteBook,
  deleteTransaction,
  subscribeBook,
  subscribeBookTransactions,
  summarize,
  withRunningBalance,
} from "../../../lib/storage";
import { displayCategoryLabel, getCategoryLabel } from "../../../lib/categories";
import { formatDate, formatRupiah } from "../../../lib/format";

export default function BukuDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const { user } = useAuth();

  const [book, setBook] = useState(null);
  const [txs, setTxs] = useState([]);
  const [ready, setReady] = useState(false);
  const [bookLoaded, setBookLoaded] = useState(false);

  const [modal, setModal] = useState({ open: false, type: "in", initial: null });
  const [search, setSearch] = useState("");

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
    return () => {
      unsubB();
      unsubT();
    };
  }, [user, id]);

  const summary = summarize(book, txs);
  const rows = useMemo(() => withRunningBalance(book, txs), [book, txs]);

  const visibleRows = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (r) =>
        r.description?.toLowerCase().includes(q) ||
        displayCategoryLabel(r).toLowerCase().includes(q)
    );
  }, [rows, search]);

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
    setModal({ open: true, type: tx.type, initial: tx });
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
            <div className="flex items-center gap-2">
              <Link
                href={`/buku/${id}/edit`}
                className="text-xs md:text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white font-medium px-3 py-2"
              >
                Edit Buku
              </Link>
              <button
                onClick={onDeleteBook}
                className="text-xs md:text-sm text-expense-600 hover:text-expense-700 font-medium px-3 py-2"
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

        <section className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setModal({ open: true, type: "in", initial: null })}
            className="flex items-center justify-center gap-2 bg-income-600 hover:bg-income-700 text-white font-medium py-3 rounded-lg shadow-sm"
          >
            <PlusIcon /> Tambah Kas Masuk
          </button>
          <button
            onClick={() => setModal({ open: true, type: "out", initial: null })}
            className="flex items-center justify-center gap-2 bg-expense-600 hover:bg-expense-700 text-white font-medium py-3 rounded-lg shadow-sm"
          >
            <MinusIcon /> Tambah Kas Keluar
          </button>
        </section>

        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">
              Riwayat Transaksi
            </h2>
            <div className="flex items-center gap-2">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari keterangan / kategori..."
                className="text-sm px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-income-500 focus:ring-2 focus:ring-income-100 outline-none w-full sm:w-64"
              />
              <span className="text-xs text-slate-500 whitespace-nowrap">
                {visibleRows.filter((r) => !r.isOpening).length} transaksi
              </span>
            </div>
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
                        </td>
                        <td className="px-5 py-3 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">
                          {r.isOpening ? "—" : (displayCategoryLabel(r) || "—")}
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
                          {!r.isOpening && displayCategoryLabel(r)
                            ? ` · ${displayCategoryLabel(r)}`
                            : ""}
                          {!r.isOpening && r.quantity > 1 && r.unitPrice > 0
                            ? ` · ${r.quantity} × ${formatRupiah(r.unitPrice)}`
                            : ""}
                        </p>
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
        onClose={() =>
          setModal({ open: false, type: modal.type, initial: null })
        }
      />
    </>
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
