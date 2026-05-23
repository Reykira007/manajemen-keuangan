"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Topbar from "../components/Topbar";
import BookCard from "../components/BookCard";
import EmptyState from "../components/EmptyState";
import { SkeletonBookGrid } from "../components/Skeleton";
import { useAuth } from "../components/AuthProvider";
import {
  subscribeAllTransactions,
  subscribeBooks,
  summarize,
} from "../lib/storage";

export default function DashboardPage() {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [txs, setTxs] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!user) return;
    let gotBooks = false;
    let gotTxs = false;
    const markReady = () => {
      if (gotBooks && gotTxs) setReady(true);
    };
    const unsubB = subscribeBooks(user.uid, (b) => {
      setBooks(b);
      gotBooks = true;
      markReady();
    });
    const unsubT = subscribeAllTransactions(user.uid, (t) => {
      setTxs(t);
      gotTxs = true;
      markReady();
    });
    return () => {
      unsubB();
      unsubT();
    };
  }, [user]);

  const items = books.map((book) => {
    const bookTxs = txs.filter((t) => t.bookId === book.id);
    return { book, summary: summarize(book, bookTxs) };
  });

  return (
    <>
      <Topbar
        title="Dashboard"
        subtitle="Pilih buku untuk melihat detail & menambah transaksi"
        actions={
          <Link
            href="/buku/baru"
            className="inline-flex items-center gap-2 bg-income-600 hover:bg-income-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-sm"
          >
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
            <span className="hidden sm:inline">Buat Buku Baru</span>
            <span className="sm:hidden">Baru</span>
          </Link>
        }
      />

      <div className="p-4 md:p-8">
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-100">
              Buku Saya
            </h2>
            <span className="text-xs text-slate-500">
              {ready ? `${items.length} buku` : ""}
            </span>
          </div>

          {!ready ? (
            <SkeletonBookGrid count={3} />
          ) : items.length === 0 ? (
            <EmptyState
              variant="book"
              title="Belum ada buku"
              description="Buat buku pertama Anda untuk mulai mencatat keuangan. Pilih dari 8 template (Warung, Konter, Bangunan, Pribadi, dll)."
              ctaLabel="Buat Buku Pertama"
              ctaHref="/buku/baru"
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map(({ book, summary }) => (
                <BookCard key={book.id} book={book} summary={summary} />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
