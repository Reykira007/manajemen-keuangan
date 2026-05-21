"use client";

import { useState } from "react";
import Link from "next/link";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../lib/firebase";

const errorMessage = (code) => {
  const map = {
    "auth/invalid-email": "Format email tidak valid.",
    "auth/user-disabled": "Akun ini dinonaktifkan.",
    "auth/user-not-found": "Akun tidak ditemukan.",
    "auth/wrong-password": "Password salah.",
    "auth/invalid-credential": "Email atau password salah.",
    "auth/too-many-requests":
      "Terlalu banyak percobaan. Coba lagi beberapa saat.",
    "auth/network-request-failed": "Tidak ada koneksi internet.",
  };
  return map[code] || "Gagal masuk. Coba lagi.";
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // redirect ditangani oleh AuthLayout / app layout
    } catch (err) {
      setError(errorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1 className="text-xl font-semibold text-slate-900">Masuk</h1>
      <p className="text-sm text-slate-500 mt-1">
        Belum punya akun?{" "}
        <Link href="/register" className="text-income-700 font-medium">
          Daftar
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
              placeholder="••••••••"
              className="w-full px-4 py-2.5 pr-20 rounded-lg border border-slate-300 focus:border-income-500 focus:ring-2 focus:ring-income-100 outline-none text-slate-900"
              required
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-900"
            >
              {showPwd ? "Sembunyikan" : "Tampilkan"}
            </button>
          </div>
          <div className="text-right mt-1.5">
            <Link
              href="/forgot-password"
              className="text-xs text-slate-500 hover:text-income-700"
            >
              Lupa password?
            </Link>
          </div>
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
          {loading ? "Memuat..." : "Masuk"}
        </button>
      </form>
    </>
  );
}
