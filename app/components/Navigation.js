"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  BarChart3,
  Save,
  MoreHorizontal,
  Sun,
  Moon,
  LogOut,
  Tags,
  X,
} from "lucide-react";
import { useAuth } from "./AuthProvider";
import { useTheme } from "./ThemeProvider";

const navItems = [
  { href: "/", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/transaksi", label: "Transaksi", Icon: Receipt },
  { href: "/laporan", label: "Laporan", Icon: BarChart3 },
  { href: "/backup", label: "Backup", Icon: Save },
];

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (href) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const onLogout = async () => {
    setMoreOpen(false);
    if (!confirm("Yakin ingin keluar?")) return;
    await logout();
    router.replace("/login");
  };

  return (
    <>
      {/* ============ Sidebar — Desktop ============ */}
      <aside className="hidden md:flex md:flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shrink-0">
        <div className="px-6 py-6 border-b border-slate-200 dark:border-slate-800">
          <Link href="/" className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-lg bg-income-600 text-white grid place-items-center font-bold">
              Rp
            </span>
            <span className="font-semibold text-slate-900 dark:text-slate-100 leading-tight">
              Manajemen
              <br />
              Keuangan
            </span>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive(href)
                  ? "bg-income-50 dark:bg-income-500/10 text-income-700"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <Link
            href="/pengaturan/kategori"
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
              pathname.startsWith("/pengaturan")
                ? "bg-income-50 dark:bg-income-500/10 text-income-700"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Tags className="w-5 h-5" />
            Kelola Kategori
          </Link>
          <div className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Masuk sebagai
            </div>
            <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
              {user?.email || "—"}
            </div>
          </div>
          <button
            onClick={toggle}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
            {theme === "dark" ? "Mode Terang" : "Mode Gelap"}
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <LogOut className="w-5 h-5" />
            Keluar
          </button>
        </div>
      </aside>

      {/* ============ Bottom Nav — Mobile (5 cols: 4 nav + More) ============ */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="grid grid-cols-5">
          {navItems.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium ${
                isActive(href)
                  ? "text-income-700"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          ))}
          <button
            onClick={() => setMoreOpen(true)}
            className="flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium text-slate-500 dark:text-slate-400"
          >
            <MoreHorizontal className="w-5 h-5" />
            Lainnya
          </button>
        </div>
      </nav>

      {/* ============ "More" Sheet — Mobile ============ */}
      {moreOpen ? (
        <div
          className="md:hidden fixed inset-0 z-40 bg-slate-900/40 dark:bg-black/60 flex items-end modal-backdrop"
          onClick={() => setMoreOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 w-full rounded-t-2xl shadow-xl modal-content-mobile"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                Menu Lainnya
              </h3>
              <button
                onClick={() => setMoreOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-3 py-2 mx-3 mt-3 rounded-lg bg-slate-50 dark:bg-slate-800">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Masuk sebagai
              </div>
              <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                {user?.email || "—"}
              </div>
            </div>
            <div className="p-3 space-y-1">
              <Link
                href="/pengaturan/kategori"
                onClick={() => setMoreOpen(false)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Tags className="w-5 h-5 text-income-700" />
                <span>Kelola Kategori</span>
              </Link>
              <button
                onClick={() => {
                  toggle();
                  setMoreOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {theme === "dark" ? (
                  <Sun className="w-5 h-5 text-amber-500" />
                ) : (
                  <Moon className="w-5 h-5 text-indigo-500" />
                )}
                <span>{theme === "dark" ? "Mode Terang" : "Mode Gelap"}</span>
              </button>
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-expense-600 hover:bg-expense-50 dark:hover:bg-expense-500/10"
              >
                <LogOut className="w-5 h-5" />
                <span>Keluar</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
