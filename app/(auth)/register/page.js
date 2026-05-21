"use client";

import { useState } from "react";
import Link from "next/link";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../lib/firebase";

const errorMessage = (code) => {
  const map = {
    "auth/invalid-email": "Format email tidak valid.",
    "auth/email-already-in-use": "Email sudah terdaftar. Silakan masuk.",
    "auth/weak-password": "Password minimal 6 karakter.",
    "auth/network-request-failed": "Tidak ada koneksi internet.",
  };
  return map[code] || "Gagal mendaftar. Coba lagi.";
};

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }
    if (password !== confirm) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
    } catch (err) {
      setError(errorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1 className="text-xl font-semibold text-slate-900">Daftar Akun</h1>
      <p className="text-sm text-slate-500 mt-1">
        Sudah punya akun?{" "}
        <Link href="/login" className="text-income-700 font-medium">
          Masuk
        </Link>
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@email.com"
            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-income-500 focus:ring-2 focus:ring-income-100 outline-none text-slate-900"
            required
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              type={showPwd ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              className="w-full px-4 py-2.5 pr-20 rounded-lg border border-slate-300 focus:border-income-500 focus:ring-2 focus:ring-income-100 outline-none text-slate-900"
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-900"
            >
              {showPwd ? "Sembunyikan" : "Tampilkan"}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Konfirmasi Password
          </label>
          <input
            type={showPwd ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Ulangi password"
            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-income-500 focus:ring-2 focus:ring-income-100 outline-none text-slate-900"
            required
          />
        </div>

        {error ? (
          <div className="text-sm text-expense-600 bg-expense-50 border border-expense-100 rounded-lg px-3 py-2">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-income-600 hover:bg-income-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg"
        >
          {loading ? "Memuat..." : "Daftar"}
        </button>
      </form>
    </>
  );
}
