"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Topbar from "../../../components/Topbar";
import { useAuth } from "../../../components/AuthProvider";
import { createBook } from "../../../lib/storage";
import { BOOK_TEMPLATES } from "../../../lib/templates";

export default function BukuBaruPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [step, setStep] = useState("template"); // 'template' | 'form'
  const [template, setTemplate] = useState(null);

  // Form state
  const [name, setName] = useState("");
  const [opening, setOpening] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const pickTemplate = (t) => {
    setTemplate(t);
    setName(t.defaultBookName);
    setOpening("");
    setError("");
    setStep("form");
  };

  const backToTemplates = () => {
    setStep("template");
    setTemplate(null);
    setName("");
    setOpening("");
    setError("");
  };

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
        template: template?.id || "custom",
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
        title={step === "template" ? "Pilih Jenis Buku" : "Buat Buku Baru"}
        subtitle={
          step === "template"
            ? "Pilih template yang sesuai supaya kategori-nya pas"
            : template
            ? `Template: ${template.name}`
            : ""
        }
      />

      <div className="p-4 md:p-8">
        {step === "template" ? (
          <TemplateGrid onPick={pickTemplate} />
        ) : (
          <FormView
            template={template}
            name={name}
            setName={(v) => {
              setName(v);
              setError("");
            }}
            opening={opening}
            setOpening={setOpening}
            error={error}
            saving={saving}
            onSubmit={onSubmit}
            onBack={backToTemplates}
          />
        )}
      </div>
    </>
  );
}

function TemplateGrid({ onPick }) {
  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {BOOK_TEMPLATES.map((t) => (
          <button
            key={t.id}
            onClick={() => onPick(t)}
            className="text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-income-500 hover:shadow-md transition-all rounded-2xl p-4 group"
          >
            <div className="text-3xl mb-2">{t.icon}</div>
            <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm group-hover:text-income-700">
              {t.name}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
              {t.description}
            </div>
          </button>
        ))}
      </div>

      <div className="text-center pt-4">
        <Link
          href="/"
          className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        >
          ← Batal, kembali ke Dashboard
        </Link>
      </div>
    </div>
  );
}

function FormView({
  template,
  name,
  setName,
  opening,
  setOpening,
  error,
  saving,
  onSubmit,
  onBack,
}) {
  return (
    <div className="max-w-xl mx-auto space-y-4">
      {template ? (
        <div className="bg-income-50 dark:bg-income-500/10 border border-income-100 dark:border-income-500/20 rounded-xl p-4 flex items-start gap-3">
          <div className="text-2xl shrink-0">{template.icon}</div>
          <div className="min-w-0">
            <div className="font-medium text-income-700 text-sm">
              {template.name}
            </div>
            <p className="text-xs text-income-700/80 dark:text-income-700/90 mt-1">
              {template.tips}
            </p>
          </div>
        </div>
      ) : null}

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-8">
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Nama Buku <span className="text-expense-600">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={template?.defaultBookName || "Contoh: Warung Bu Ani"}
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
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
              {template?.openingBalanceHint ||
                "Jumlah uang yang sudah ada saat buku dibuat. Ikut dihitung sebagai Kas Masuk."}
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onBack}
              disabled={saving}
              className="px-4 py-2.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-sm font-medium"
            >
              ← Ganti Template
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-income-600 hover:bg-income-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg"
            >
              {saving ? "Menyimpan..." : "Buat Buku"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
