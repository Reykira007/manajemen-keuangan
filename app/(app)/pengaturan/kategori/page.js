"use client";

import { useEffect, useState } from "react";
import Topbar from "../../../components/Topbar";
import { useAuth } from "../../../components/AuthProvider";
import {
  addCustomCategory,
  deleteCustomCategory,
  subscribeCustomCategories,
  updateCustomCategory,
} from "../../../lib/storage";
import { CATEGORIES_IN, CATEGORIES_OUT } from "../../../lib/categories";

export default function KategoriPage() {
  const { user } = useAuth();
  const [customs, setCustoms] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeCustomCategories(user.uid, (list) => {
      setCustoms(list);
      setReady(true);
    });
    return unsub;
  }, [user]);

  const incomeCustoms = customs.filter((c) => c.type === "in");
  const expenseCustoms = customs.filter((c) => c.type === "out");

  return (
    <>
      <Topbar
        title="Kelola Kategori"
        subtitle="Tambah / edit / hapus kategori sesuai kebutuhan usaha Anda"
      />

      <div className="p-4 md:p-8 max-w-3xl space-y-6">
        <InfoBanner />

        <CategorySection
          title="Kas Masuk"
          tone="income"
          defaults={CATEGORIES_IN}
          customs={incomeCustoms}
          type="in"
          user={user}
          ready={ready}
        />

        <CategorySection
          title="Kas Keluar"
          tone="expense"
          defaults={CATEGORIES_OUT}
          customs={expenseCustoms}
          type="out"
          user={user}
          ready={ready}
        />
      </div>
    </>
  );
}

function InfoBanner() {
  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm text-slate-600 dark:text-slate-400">
      <p>
        <b className="text-slate-800 dark:text-slate-200">Kategori Default</b>{" "}
        tidak bisa dihapus — itu preset bawaan aplikasi. Anda bisa{" "}
        <b className="text-slate-800 dark:text-slate-200">tambah kategori sendiri</b>{" "}
        sesuai kebutuhan usaha Anda (mis. &quot;Tukang Batu&quot;, &quot;Voucher
        Game&quot;, &quot;Sayur Pasar&quot;).
      </p>
    </div>
  );
}

function CategorySection({ title, tone, defaults, customs, type, user, ready }) {
  const [newLabel, setNewLabel] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editLabel, setEditLabel] = useState("");
  const [error, setError] = useState("");

  const headerColor =
    tone === "income"
      ? "bg-income-50 text-income-700 dark:bg-income-500/10"
      : "bg-expense-50 text-expense-700 dark:bg-expense-500/10";

  const onAdd = async (e) => {
    e.preventDefault();
    setError("");
    if (!newLabel.trim()) return;
    if (!user) return;
    setAdding(true);
    try {
      await addCustomCategory(user.uid, { type, label: newLabel });
      setNewLabel("");
    } catch (err) {
      setError(err.message || "Gagal menambah kategori");
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (cat) => {
    setEditingId(cat.id);
    setEditLabel(cat.label);
    setError("");
  };

  const onSaveEdit = async (id) => {
    if (!editLabel.trim()) return;
    if (!user) return;
    try {
      await updateCustomCategory(user.uid, id, { label: editLabel });
      setEditingId(null);
    } catch (err) {
      setError(err.message || "Gagal update");
    }
  };

  const onDelete = async (cat) => {
    if (
      !confirm(
        `Hapus kategori "${cat.label}"?\n\nTransaksi yang sudah pakai kategori ini akan tetap menampilkan label lama (tidak hilang).`
      )
    )
      return;
    try {
      await deleteCustomCategory(user.uid, cat.id);
    } catch (err) {
      alert("Gagal hapus: " + (err.message || ""));
    }
  };

  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
      <div className={`px-5 py-3 ${headerColor}`}>
        <h2 className="font-semibold">{title}</h2>
      </div>

      {/* Default categories */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
          Default ({defaults.length})
        </div>
        <div className="flex flex-wrap gap-2">
          {defaults.map((c) => (
            <span
              key={c.id}
              className="text-xs px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              title="Default — tidak bisa dihapus"
            >
              {c.label}
            </span>
          ))}
        </div>
      </div>

      {/* Custom categories */}
      <div className="px-5 py-4">
        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
          Kategori Saya ({customs.length})
        </div>

        {!ready ? (
          <p className="text-sm text-slate-400">Memuat...</p>
        ) : customs.length === 0 ? (
          <p className="text-sm text-slate-400 italic">
            Belum ada kategori custom. Tambah di bawah.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {customs.map((c) => (
              <li
                key={c.id}
                className="py-2.5 flex items-center justify-between gap-3"
              >
                {editingId === c.id ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-income-500"
                      autoFocus
                    />
                    <button
                      onClick={() => onSaveEdit(c.id)}
                      className="text-xs px-3 py-1.5 bg-income-600 hover:bg-income-700 text-white rounded-lg font-medium"
                    >
                      Simpan
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-xs px-2 py-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="text-sm text-slate-900 dark:text-slate-100 truncate">
                      {c.label}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => startEdit(c)}
                        className="text-xs text-slate-500 hover:text-income-700 px-2 py-1"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(c)}
                        className="text-xs text-slate-500 hover:text-expense-600 px-2 py-1"
                      >
                        Hapus
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* Add new */}
        <form onSubmit={onAdd} className="mt-4 flex items-center gap-2">
          <input
            type="text"
            value={newLabel}
            onChange={(e) => {
              setNewLabel(e.target.value);
              setError("");
            }}
            placeholder={`Nama kategori ${title.toLowerCase()} baru...`}
            className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-income-500"
          />
          <button
            type="submit"
            disabled={adding || !newLabel.trim()}
            className={`text-sm font-medium px-4 py-2 rounded-lg text-white ${
              tone === "income"
                ? "bg-income-600 hover:bg-income-700"
                : "bg-expense-600 hover:bg-expense-700"
            } disabled:opacity-60`}
          >
            {adding ? "..." : "+ Tambah"}
          </button>
        </form>
        {error ? (
          <p className="text-xs text-expense-600 mt-2">{error}</p>
        ) : null}
      </div>
    </section>
  );
}
