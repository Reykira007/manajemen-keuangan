"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import TransactionFormModal from "./TransactionFormModal";

export default function QuickAddFab() {
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState(false);
  const [modal, setModal] = useState({ open: false, type: "in" });

  // Extract bookId dari URL jika sedang di halaman /buku/[id]/... → FAB bisa
  // langsung pakai buku tersebut tanpa minta pilih buku lagi.
  const contextBookId = useMemo(() => {
    if (!pathname) return null;
    const m = pathname.match(/^\/buku\/([^/]+)(?:\/|$)/);
    if (!m) return null;
    if (m[1] === "baru") return null; // /buku/baru bukan id
    return m[1];
  }, [pathname]);

  // Sembunyikan di halaman form (sudah ada form sendiri) & halaman auth
  const hidden =
    pathname.startsWith("/buku/baru") ||
    pathname.endsWith("/edit") ||
    pathname.startsWith("/pengaturan") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password");

  if (hidden) return null;

  const openModal = (type) => {
    setOpenMenu(false);
    setModal({ open: true, type });
  };

  return (
    <>
      {/* Backdrop saat menu terbuka — klik di luar untuk tutup */}
      {openMenu ? (
        <button
          aria-label="Tutup menu"
          onClick={() => setOpenMenu(false)}
          className="fixed inset-0 z-20 bg-transparent cursor-default"
        />
      ) : null}

      {/* Container FAB - posisi di atas bottom-nav mobile */}
      <div className="fixed right-4 bottom-20 md:bottom-6 z-30 flex flex-col items-end gap-2">
        {/* Action buttons (muncul saat menu terbuka) */}
        {openMenu ? (
          <>
            <button
              onClick={() => openModal("in")}
              className="flex items-center gap-2 bg-income-600 hover:bg-income-700 text-white text-sm font-medium px-4 py-2.5 rounded-full shadow-lg animate-in slide-in-from-bottom-2"
            >
              <PlusIcon />
              Kas Masuk
            </button>
            <button
              onClick={() => openModal("out")}
              className="flex items-center gap-2 bg-expense-600 hover:bg-expense-700 text-white text-sm font-medium px-4 py-2.5 rounded-full shadow-lg animate-in slide-in-from-bottom-2"
            >
              <MinusIcon />
              Kas Keluar
            </button>
          </>
        ) : null}

        {/* Main FAB button */}
        <button
          onClick={() => setOpenMenu((v) => !v)}
          className={`w-14 h-14 rounded-full text-white shadow-xl grid place-items-center transition-transform ${
            openMenu
              ? "bg-slate-700 rotate-45"
              : "bg-income-600 hover:bg-income-700"
          }`}
          aria-label={openMenu ? "Tutup menu cepat" : "Tambah transaksi cepat"}
          title="Tambah transaksi cepat"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-6 h-6"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>

      {/* Form modal — kalau context book ada (di halaman /buku/[id]), langsung
          pakai. Kalau tidak, modal akan munculkan dropdown pilih buku. */}
      <TransactionFormModal
        open={modal.open}
        type={modal.type}
        bookId={contextBookId}
        onClose={() => setModal({ open: false, type: modal.type })}
      />
    </>
  );
}

function PlusIcon() {
  return (
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
  );
}

function MinusIcon() {
  return (
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
      <path d="M5 12h14" />
    </svg>
  );
}
