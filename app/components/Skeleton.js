"use client";

/**
 * Skeleton loader components — pengganti "Memuat..." text.
 * Animasi pulse subtle, sesuai dengan struktur konten yang akan loaded.
 */

const baseClass =
  "bg-slate-200 dark:bg-slate-700 rounded animate-pulse";

export function Skeleton({ className = "", width, height }) {
  return (
    <div
      className={`${baseClass} ${className}`}
      style={{ width, height }}
    />
  );
}

// Skeleton untuk satu baris transaksi
export function SkeletonTxRow() {
  return (
    <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <div className="space-y-1 text-right">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-3 w-16 ml-auto" />
      </div>
    </div>
  );
}

// Skeleton untuk card buku
export function SkeletonBookCard() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
      <div className="flex items-start gap-3">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-8 w-2/3" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-14 rounded-lg" />
        <Skeleton className="h-14 rounded-lg" />
      </div>
    </div>
  );
}

// Skeleton untuk summary card
export function SkeletonSummaryCard() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 md:p-5 space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-7 w-32" />
    </div>
  );
}

// Skeleton list — multiple tx rows
export function SkeletonList({ count = 4 }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonTxRow key={i} />
      ))}
    </div>
  );
}

// Skeleton grid (untuk dashboard buku)
export function SkeletonBookGrid({ count = 3 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonBookCard key={i} />
      ))}
    </div>
  );
}
