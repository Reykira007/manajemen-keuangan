"use client";

import { useRef, useState } from "react";
import Topbar from "../../components/Topbar";
import { useAuth } from "../../components/AuthProvider";
import { exportAll, importAll } from "../../lib/storage";

export default function BackupPage() {
  const { user } = useAuth();
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'ok'|'err', text }

  const onExport = async () => {
    if (!user) return;
    setBusy(true);
    setMessage(null);
    try {
      const data = await exportAll(user.uid);
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const stamp = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `manajemen-keuangan-${stamp}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setMessage({
        type: "ok",
        text: `Berhasil export ${data.books.length} buku & ${data.transactions.length} transaksi.`,
      });
    } catch (err) {
      setMessage({ type: "err", text: "Gagal export: " + (err.message || err) });
    } finally {
      setBusy(false);
    }
  };

  const onImportClick = () => fileRef.current?.click();

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setBusy(true);
    setMessage(null);
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      const replace = confirm(
        "Mode REPLACE?\n\n" +
          "OK = Hapus semua data lama, ganti dengan isi file.\n" +
          "Cancel = Tambahkan data file ke data yang sudah ada (mode merge)."
      );
      const result = await importAll(user.uid, payload, { replace });
      const parts = [
        `${result.importedBooks} buku`,
        `${result.importedTransactions} transaksi`,
      ];
      if (result.importedDebts > 0)
        parts.push(`${result.importedDebts} hutang/piutang`);
      if (result.importedCategories > 0)
        parts.push(`${result.importedCategories} kategori custom`);
      setMessage({
        type: "ok",
        text:
          `Import berhasil. ${parts.join(", ")} ditambahkan` +
          (replace ? " (data lama dihapus)." : "."),
      });
    } catch (err) {
      setMessage({ type: "err", text: "Gagal import: " + (err.message || err) });
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  };

  return (
    <>
      <Topbar
        title="Backup Data"
        subtitle="Export & import data sebagai file JSON"
      />

      <div className="p-4 md:p-8 max-w-2xl space-y-6">
        {/* Export */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-income-50 text-income-700 grid place-items-center shrink-0">
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
                <path d="M12 3v12" />
                <path d="m7 10 5 5 5-5" />
                <path d="M5 21h14" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">Export Data</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Unduh semua buku & transaksi sebagai file <code>.json</code>.
                Simpan ke Google Drive / HP / kirim ke email sendiri sebagai
                cadangan.
              </p>
              <button
                onClick={onExport}
                disabled={busy}
                className="mt-4 bg-income-600 hover:bg-income-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2.5 rounded-lg"
              >
                {busy ? "Memproses..." : "Download Backup (.json)"}
              </button>
            </div>
          </div>
        </section>

        {/* Import */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 grid place-items-center shrink-0">
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
                <path d="M12 21V9" />
                <path d="m7 14 5-5 5 5" />
                <path d="M5 3h14" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">Import Data</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Pulihkan dari file backup. Anda akan ditanya: <b>Replace</b>{" "}
                (ganti semua data lama) atau <b>Merge</b> (tambahkan ke data
                yang ada).
              </p>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={onFile}
              />
              <button
                onClick={onImportClick}
                disabled={busy}
                className="mt-4 bg-slate-900 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-60 text-white text-sm font-medium px-4 py-2.5 rounded-lg"
              >
                {busy ? "Memproses..." : "Pilih File Backup..."}
              </button>
            </div>
          </div>
        </section>

        {message ? (
          <div
            className={`rounded-xl px-4 py-3 text-sm ${
              message.type === "ok"
                ? "bg-income-50 border border-income-100 text-income-700"
                : "bg-expense-50 border border-expense-100 text-expense-700"
            }`}
          >
            {message.text}
          </div>
        ) : null}

        <div className="text-xs text-slate-400 dark:text-slate-500">
          Tips: backup secara rutin (mis. 1× sebulan) sebagai jaminan tambahan,
          walaupun data Anda sudah aman di cloud Firebase.
        </div>
      </div>
    </>
  );
}
