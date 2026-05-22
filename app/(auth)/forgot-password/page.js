"use client";

import { useState } from "react";
import Link from "next/link";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../lib/firebase";

const errorMessage = (code) => {
  const map = {
    "auth/invalid-email": "Format email tidak valid.",
    "auth/user-not-found": "Email tidak terdaftar.",
    "auth/network-request-failed": "Tidak ada koneksi internet.",
  };
  return map[code] || "Gagal mengirim email reset. Coba lagi.";
};

const inputClass =
  "w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-income-500 focus:ring-2 focus:ring-income-100 outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSuccess(true);
    } catch (err) {
      setError(errorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
        Lupa Password
      </h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
        Masukkan email Anda. Kami akan kirim link untuk reset password.
      </p>

      {success ? (
        <div className="mt-6 space-y-4">
          <div className="text-sm text-income-700 bg-income-50 dark:bg-income-500/10 border border-income-100 dark:border-income-500/20 rounded-lg px-3 py-3">
            Email reset password sudah dikirim ke <b>{email}</b>. Cek inbox /
            folder spam, lalu ikuti tautannya untuk membuat password baru.
          </div>
          <Link
            href="/login"
            className="block w-full text-center bg-income-600 hover:bg-income-700 text-white font-medium py-2.5 rounded-lg"
          >
            Kembali ke halaman Masuk
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              className={inputClass}
              required
              autoFocus
            />
          </div>

          {error ? (
            <div className="text-sm text-expense-600 bg-expense-50 dark:bg-expense-500/10 border border-expense-100 dark:border-expense-500/20 rounded-lg px-3 py-2">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-income-600 hover:bg-income-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg"
          >
            {loading ? "Mengirim..." : "Kirim Link Reset"}
          </button>

          <div className="text-center">
            <Link
              href="/login"
              className="text-sm text-slate-500 dark:text-slate-400 hover:text-income-700"
            >
              ← Kembali ke Masuk
            </Link>
          </div>
        </form>
      )}
    </>
  );
}
