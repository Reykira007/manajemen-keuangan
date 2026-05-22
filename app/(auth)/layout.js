"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../components/AuthProvider";

export default function AuthLayout({ children }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  // Kalau sudah login, jangan tampilkan lagi halaman login/register
  useEffect(() => {
    if (!loading && user) router.replace("/");
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="w-10 h-10 rounded-lg bg-income-600 text-white grid place-items-center font-bold">
            Rp
          </span>
          <span className="font-semibold text-slate-900 dark:text-slate-100 text-lg">
            Manajemen Keuangan
          </span>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 md:p-8">
          {children}
        </div>
        <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-6">
          Data disimpan aman di akun Firebase Anda.
        </p>
      </div>
    </div>
  );
}
