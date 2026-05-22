"use client";

import { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Topbar from "../../../components/Topbar";
import { useAuth } from "../../../components/AuthProvider";
import {
  subscribeAllTransactions,
  subscribeBooks,
} from "../../../lib/storage";
import { getCategoryLabel } from "../../../lib/categories";
import { formatRupiah, formatDate, todayISO } from "../../../lib/format";

// Kategori yang dihitung sebagai "Penjualan / Omzet" (bukan modal/pinjaman)
const SALES_CATEGORIES = new Set(["penjualan", "pendapatan"]);

function firstDayOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

export default function LabaRugiPage() {
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

  const bookName =
    bookFilter === "all"
      ? "Semua Buku"
      : books.find((b) => b.id === bookFilter)?.name || "—";

  const inRange = useMemo(() => {
    return txs.filter((t) => {
      if (bookFilter !== "all" && t.bookId !== bookFilter) return false;
      if (from && t.date < from) return false;
      if (to && t.date > to) return false;
      return true;
    });
  }, [txs, from, to, bookFilter]);

  // Aggregasi per kategori
  const aggregate = useMemo(() => {
    const salesByCat = {};
    const modalByCat = {};
    const expenseByCat = {};
    let salesTotal = 0;
    let modalTotal = 0;
    let expenseTotal = 0;

    for (const t of inRange) {
      if (t.type === "in") {
        if (SALES_CATEGORIES.has(t.category)) {
          const label = getCategoryLabel("in", t.category);
          salesByCat[label] = (salesByCat[label] || 0) + t.amount;
          salesTotal += t.amount;
        } else {
          const label = t.category
            ? getCategoryLabel("in", t.category)
            : "Lain-lain";
          modalByCat[label] = (modalByCat[label] || 0) + t.amount;
          modalTotal += t.amount;
        }
      } else {
        const label = t.category
          ? getCategoryLabel("out", t.category)
          : "Lain-lain";
        expenseByCat[label] = (expenseByCat[label] || 0) + t.amount;
        expenseTotal += t.amount;
      }
    }

    return {
      salesByCat,
      modalByCat,
      expenseByCat,
      salesTotal,
      modalTotal,
      expenseTotal,
      labaBersih: salesTotal - expenseTotal,
      cashFlow: salesTotal + modalTotal - expenseTotal,
    };
  }, [inRange]);

  const downloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const periodeStr = `${formatDate(from)} s/d ${formatDate(to)}`;

    // Header
    doc.setFontSize(16);
    doc.setFont(undefined, "bold");
    doc.text("LAPORAN LABA RUGI", pageWidth / 2, 16, { align: "center" });

    doc.setFontSize(11);
    doc.setFont(undefined, "normal");
    doc.text(`Buku: ${bookName}`, pageWidth / 2, 23, { align: "center" });
    doc.text(`Periode: ${periodeStr}`, pageWidth / 2, 29, { align: "center" });

    let y = 40;

    // Section 1: Penjualan / Omzet
    doc.setFont(undefined, "bold");
    doc.setFontSize(12);
    doc.text("PENJUALAN / OMZET", 14, y);
    y += 4;

    const salesRows = Object.entries(aggregate.salesByCat).map(([k, v]) => [
      k,
      formatRupiah(v),
    ]);
    if (salesRows.length === 0) salesRows.push(["(belum ada penjualan)", "-"]);
    salesRows.push(["TOTAL PENJUALAN", formatRupiah(aggregate.salesTotal)]);

    autoTable(doc, {
      startY: y,
      head: [["Kategori", "Jumlah"]],
      body: salesRows,
      theme: "striped",
      headStyles: { fillColor: [16, 185, 129] },
      columnStyles: { 1: { halign: "right" } },
      footStyles: { fontStyle: "bold" },
      didParseCell: (data) => {
        if (data.row.index === salesRows.length - 1) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = [209, 250, 229];
        }
      },
    });
    y = doc.lastAutoTable.finalY + 8;

    // Section 2: Pengeluaran
    doc.setFont(undefined, "bold");
    doc.setFontSize(12);
    doc.text("PENGELUARAN", 14, y);
    y += 4;

    const expenseRows = Object.entries(aggregate.expenseByCat)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => [k, formatRupiah(v)]);
    if (expenseRows.length === 0)
      expenseRows.push(["(belum ada pengeluaran)", "-"]);
    expenseRows.push([
      "TOTAL PENGELUARAN",
      formatRupiah(aggregate.expenseTotal),
    ]);

    autoTable(doc, {
      startY: y,
      head: [["Kategori", "Jumlah"]],
      body: expenseRows,
      theme: "striped",
      headStyles: { fillColor: [239, 68, 68] },
      columnStyles: { 1: { halign: "right" } },
      didParseCell: (data) => {
        if (data.row.index === expenseRows.length - 1) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = [254, 226, 226];
        }
      },
    });
    y = doc.lastAutoTable.finalY + 8;

    // Section 3: Modal Tambahan (kalau ada)
    if (aggregate.modalTotal > 0) {
      doc.setFont(undefined, "bold");
      doc.setFontSize(12);
      doc.text("MODAL / PINJAMAN MASUK", 14, y);
      y += 4;
      const modalRows = Object.entries(aggregate.modalByCat).map(([k, v]) => [
        k,
        formatRupiah(v),
      ]);
      modalRows.push(["TOTAL", formatRupiah(aggregate.modalTotal)]);
      autoTable(doc, {
        startY: y,
        head: [["Sumber", "Jumlah"]],
        body: modalRows,
        theme: "plain",
        styles: { textColor: [100, 116, 139] },
        columnStyles: { 1: { halign: "right" } },
      });
      y = doc.lastAutoTable.finalY + 8;
    }

    // Section: Hasil Laba/Rugi
    doc.setFont(undefined, "bold");
    doc.setFontSize(13);
    const labaLabel =
      aggregate.labaBersih >= 0 ? "UNTUNG BERSIH" : "RUGI BERSIH";
    const labaColor =
      aggregate.labaBersih >= 0 ? [5, 150, 105] : [220, 38, 38];

    doc.setFillColor(...labaColor);
    doc.rect(14, y, pageWidth - 28, 14, "F");
    doc.setTextColor(255, 255, 255);
    doc.text(labaLabel, 18, y + 9);
    doc.text(formatRupiah(Math.abs(aggregate.labaBersih)), pageWidth - 18, y + 9, {
      align: "right",
    });
    doc.setTextColor(0, 0, 0);
    y += 18;

    // Catatan
    doc.setFontSize(8);
    doc.setFont(undefined, "italic");
    doc.setTextColor(100, 116, 139);
    doc.text(
      "Catatan: Untung Bersih = Total Penjualan - Total Pengeluaran. Modal & pinjaman tidak dihitung sebagai untung.",
      14,
      y,
      { maxWidth: pageWidth - 28 }
    );

    // Footer
    const now = new Date();
    const tgl = formatDate(now.toISOString().slice(0, 10));
    doc.setFontSize(8);
    doc.setFont(undefined, "normal");
    doc.text(`Dicetak: ${tgl} - Manajemen Keuangan`, pageWidth - 14, 290, {
      align: "right",
    });

    const safeBook = bookName.replace(/[^a-z0-9-_]/gi, "-").toLowerCase();
    doc.save(`laba-rugi_${safeBook}_${from}_${to}.pdf`);
  };

  return (
    <>
      <Topbar
        title="Laporan Laba Rugi"
        subtitle="Untung-rugi sederhana untuk UMKM & usaha kecil"
        actions={
          <button
            onClick={downloadPDF}
            className="inline-flex items-center gap-2 bg-expense-600 hover:bg-expense-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-sm"
          >
            <PdfIcon />
            <span className="hidden sm:inline">Download PDF</span>
            <span className="sm:hidden">PDF</span>
          </button>
        }
      />

      <div className="p-4 md:p-8 space-y-6">
        {/* Filter */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Dari
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
              Sampai
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

        {/* Ringkasan besar - hero card */}
        <section
          className={`rounded-2xl p-6 text-white ${
            aggregate.labaBersih >= 0 ? "bg-income-600" : "bg-expense-600"
          }`}
        >
          <div className="text-sm opacity-90">
            {aggregate.labaBersih >= 0 ? "UNTUNG BERSIH" : "RUGI BERSIH"}
          </div>
          <div className="text-4xl md:text-5xl font-bold mt-1">
            {formatRupiah(Math.abs(aggregate.labaBersih))}
          </div>
          <div className="text-xs opacity-80 mt-2">
            Periode {formatDate(from)} – {formatDate(to)} · {bookName}
          </div>
        </section>

        {/* Rincian Penjualan vs Pengeluaran */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Breakdown
            title="Penjualan / Omzet"
            total={aggregate.salesTotal}
            tone="income"
            items={aggregate.salesByCat}
            emptyText="Belum ada penjualan di periode ini."
          />
          <Breakdown
            title="Pengeluaran"
            total={aggregate.expenseTotal}
            tone="expense"
            items={aggregate.expenseByCat}
            emptyText="Belum ada pengeluaran di periode ini."
          />
        </section>

        {/* Modal/Pinjaman info (kalau ada) */}
        {aggregate.modalTotal > 0 ? (
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 grid place-items-center shrink-0 text-sm">
                ℹ️
              </div>
              <div className="min-w-0 text-sm text-slate-700 dark:text-slate-300">
                <p>
                  Di periode ini juga ada <b>{formatRupiah(aggregate.modalTotal)}</b>{" "}
                  dari Modal / Pinjaman / Sumber lain (bukan penjualan).
                </p>
                <p className="text-slate-500 dark:text-slate-400 mt-1 text-xs">
                  Modal & pinjaman tidak dihitung sebagai untung — itu hanya
                  uang masuk yang harus dikelola/dikembalikan, bukan hasil usaha.
                </p>
              </div>
            </div>
          </section>
        ) : null}

        {/* Penjelasan rumus */}
        <section className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-xs text-slate-600 dark:text-slate-400">
          <p className="font-medium text-slate-700 dark:text-slate-300 mb-1">
            Cara hitung:
          </p>
          <p>
            Untung Bersih = <b>Total Penjualan</b> − <b>Total Pengeluaran</b>
            <br />= {formatRupiah(aggregate.salesTotal)} −{" "}
            {formatRupiah(aggregate.expenseTotal)} ={" "}
            <b
              className={
                aggregate.labaBersih >= 0
                  ? "text-income-700"
                  : "text-expense-700"
              }
            >
              {formatRupiah(aggregate.labaBersih)}
            </b>
          </p>
        </section>
      </div>
    </>
  );
}

function Breakdown({ title, total, tone, items, emptyText }) {
  const color = tone === "income" ? "text-income-700" : "text-expense-700";
  const chipBg =
    tone === "income"
      ? "bg-income-50 text-income-700"
      : "bg-expense-50 text-expense-700";

  const entries = Object.entries(items).sort((a, b) => b[1] - a[1]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h3>
          <span className={`text-xs font-medium px-2 py-1 rounded-md ${chipBg}`}>
            {entries.length} kategori
          </span>
        </div>
        <div className={`mt-2 text-2xl font-bold ${color}`}>
          {formatRupiah(total)}
        </div>
      </div>

      {entries.length === 0 ? (
        <p className="p-6 text-sm text-slate-400 text-center">{emptyText}</p>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {entries.map(([k, v]) => {
            const pct = total ? (v / total) * 100 : 0;
            return (
              <li key={k} className="px-5 py-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-700 dark:text-slate-300 truncate">
                    {k}
                  </span>
                  <span className={`font-medium ${color} whitespace-nowrap ml-2`}>
                    {formatRupiah(v)}
                  </span>
                </div>
                <div className="mt-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={
                      tone === "income" ? "bg-income-500" : "bg-expense-500"
                    }
                    style={{ width: `${pct}%`, height: "100%" }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function PdfIcon() {
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
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M9 13h6M9 17h4" />
    </svg>
  );
}
