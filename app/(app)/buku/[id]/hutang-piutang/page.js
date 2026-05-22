"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Topbar from "../../../../components/Topbar";
import DebtFormModal from "../../../../components/DebtFormModal";
import MarkDebtPaidModal from "../../../../components/MarkDebtPaidModal";
import { useAuth } from "../../../../components/AuthProvider";
import {
  deleteDebt,
  subscribeBook,
  subscribeBookDebts,
} from "../../../../lib/storage";
import { formatDate, formatRupiah, todayISO } from "../../../../lib/format";

export default function HutangPiutangPage() {
  const { id } = useParams();
  const { user } = useAuth();

  const [book, setBook] = useState(null);
  const [debts, setDebts] = useState([]);
  const [ready, setReady] = useState(false);

  const [tab, setTab] = useState("piutang"); // 'piutang' | 'hutang'
  const [showLunas, setShowLunas] = useState(false);
  const [modal, setModal] = useState({ open: false, initial: null });
  const [paidModal, setPaidModal] = useState({ open: false, debt: null });

  useEffect(() => {
    if (!user) return;
    const unsubB = subscribeBook(user.uid, id, setBook);
    const unsubD = subscribeBookDebts(user.uid, id, (list) => {
      setDebts(list);
      setReady(true);
    });
    return () => {
      unsubB();
      unsubD();
    };
  }, [user, id]);

  const filtered = useMemo(() => {
    return debts.filter((d) => {
      if (d.type !== tab) return false;
      if (!showLunas && d.status === "lunas") return false;
      return true;
    });
  }, [debts, tab, showLunas]);

  const summary = useMemo(() => {
    const byType = { piutang: { belum: 0, lunas: 0 }, hutang: { belum: 0, lunas: 0 } };
    for (const d of debts) {
      if (!byType[d.type]) continue;
      const key = d.status === "lunas" ? "lunas" : "belum";
      byType[d.type][key] += d.amount;
    }
    return byType;
  }, [debts]);

  const onMarkPaid = (debt) => {
    setPaidModal({ open: true, debt });
  };

  const onDelete = async (debt) => {
    if (!confirm(`Hapus catatan ${debt.type} dari ${debt.counterpart}?`)) return;
    await deleteDebt(user.uid, debt.id);
  };

  return (
    <>
      <Topbar
        title="Hutang & Piutang"
        subtitle={book ? book.name : "Memuat..."}
        actions={
          <button
            onClick={() => setModal({ open: true, initial: null })}
            className="inline-flex items-center gap-2 bg-income-600 hover:bg-income-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-sm"
          >
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
            <span className="hidden sm:inline">Catat Baru</span>
            <span className="sm:hidden">Baru</span>
          </button>
        }
      />

      <div className="p-4 md:p-8 space-y-4">
        {/* Summary cards */}
        <section className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
            <div className="text-xs text-income-700 font-medium">📥 Piutang</div>
            <div className="mt-1 text-xl md:text-2xl font-bold text-income-700">
              {formatRupiah(summary.piutang.belum)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Belum lunas</div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
            <div className="text-xs text-expense-700 font-medium">📤 Hutang</div>
            <div className="mt-1 text-xl md:text-2xl font-bold text-expense-700">
              {formatRupiah(summary.hutang.belum)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Belum lunas</div>
          </div>
        </section>

        {/* Tab + filter */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-full sm:w-auto">
              <button
                onClick={() => setTab("piutang")}
                className={`px-4 py-1.5 rounded-md text-sm font-medium ${
                  tab === "piutang"
                    ? "bg-white dark:bg-slate-900 text-income-700 shadow-sm"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                📥 Piutang
              </button>
              <button
                onClick={() => setTab("hutang")}
                className={`px-4 py-1.5 rounded-md text-sm font-medium ${
                  tab === "hutang"
                    ? "bg-white dark:bg-slate-900 text-expense-700 shadow-sm"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                📤 Hutang
              </button>
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={showLunas}
                onChange={(e) => setShowLunas(e.target.checked)}
                className="rounded"
              />
              Tampilkan yang lunas
            </label>
          </div>

          {!ready ? (
            <div className="p-8 text-sm text-slate-400">Memuat...</div>
          ) : filtered.length === 0 ? (
            <EmptyState type={tab} showLunas={showLunas} />
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((d) => (
                <DebtCard
                  key={d.id}
                  debt={d}
                  onMarkPaid={() => onMarkPaid(d)}
                  onEdit={() => setModal({ open: true, initial: d })}
                  onDelete={() => onDelete(d)}
                />
              ))}
            </ul>
          )}
        </section>

        <div className="text-center">
          <Link
            href={`/buku/${id}`}
            className="text-sm text-slate-500 dark:text-slate-400 hover:text-income-700"
          >
            ← Kembali ke Buku
          </Link>
        </div>
      </div>

      <DebtFormModal
        open={modal.open}
        bookId={id}
        defaultType={tab}
        initial={modal.initial}
        onClose={() => setModal({ open: false, initial: null })}
      />

      <MarkDebtPaidModal
        open={paidModal.open}
        debt={paidModal.debt}
        onClose={() => setPaidModal({ open: false, debt: null })}
      />
    </>
  );
}

function DebtCard({ debt, onMarkPaid, onEdit, onDelete }) {
  const isPiutang = debt.type === "piutang";
  const isLunas = debt.status === "lunas";
  const isOverdue =
    !isLunas && debt.dueDate && debt.dueDate < todayISO();

  return (
    <li className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {debt.counterpart}
            </span>
            {isLunas ? (
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                ✓ LUNAS
              </span>
            ) : isOverdue ? (
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-expense-50 dark:bg-expense-500/10 text-expense-700 font-medium">
                ⏰ TERLAMBAT
              </span>
            ) : null}
          </div>
          <div
            className={`mt-1 text-lg font-bold ${
              isPiutang ? "text-income-700" : "text-expense-700"
            }`}
          >
            {formatRupiah(debt.amount)}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            Dicatat {formatDate(debt.date)}
            {debt.dueDate ? ` · Jatuh tempo ${formatDate(debt.dueDate)}` : ""}
            {isLunas && debt.paidAt
              ? ` · Lunas ${formatDate(debt.paidAt)}`
              : ""}
          </div>
          {debt.note ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 italic">
              &ldquo;{debt.note}&rdquo;
            </p>
          ) : null}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-end gap-2 text-xs">
        {!isLunas ? (
          <button
            onClick={onMarkPaid}
            className={`px-3 py-1.5 rounded-lg font-medium text-white ${
              isPiutang
                ? "bg-income-600 hover:bg-income-700"
                : "bg-expense-600 hover:bg-expense-700"
            }`}
          >
            ✓ Tandai Lunas
          </button>
        ) : null}
        <button
          onClick={onEdit}
          className="px-3 py-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white font-medium"
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          className="px-3 py-1.5 text-slate-400 hover:text-expense-600 font-medium"
        >
          Hapus
        </button>
      </div>
    </li>
  );
}

function EmptyState({ type, showLunas }) {
  const isPiutang = type === "piutang";
  return (
    <div className="p-10 text-center">
      <div className="text-4xl mb-3">{isPiutang ? "📥" : "📤"}</div>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        {showLunas
          ? `Belum ada catatan ${type}.`
          : `Tidak ada ${type} yang belum lunas.`}
      </p>
      {isPiutang ? (
        <p className="text-xs text-slate-400 mt-2">
          Contoh: pelanggan bawa beras 5kg, bayar Senin
        </p>
      ) : (
        <p className="text-xs text-slate-400 mt-2">
          Contoh: hutang ke supplier yang belum dibayar
        </p>
      )}
    </div>
  );
}
