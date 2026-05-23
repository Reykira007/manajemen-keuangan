"use client";

import Link from "next/link";

/**
 * Empty state yang inviting dengan illustration, headline, deskripsi, dan CTA.
 * Pakai prop `variant` untuk pilih illustration yang sesuai konteks.
 */
export default function EmptyState({
  variant = "default",
  title,
  description,
  ctaLabel,
  ctaHref,
  onCtaClick,
  className = "",
}) {
  return (
    <div
      className={`bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 md:p-12 text-center ${className}`}
    >
      <div className="mx-auto w-32 h-32 md:w-40 md:h-40 mb-4">
        <Illustration variant={variant} />
      </div>
      <h3 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-100">
        {title}
      </h3>
      {description ? (
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
          {description}
        </p>
      ) : null}
      {ctaLabel ? (
        ctaHref ? (
          <Link
            href={ctaHref}
            className="inline-flex items-center gap-2 mt-6 bg-income-600 hover:bg-income-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg shadow-sm transition-transform hover:scale-[1.02]"
          >
            {ctaLabel}
          </Link>
        ) : (
          <button
            onClick={onCtaClick}
            className="inline-flex items-center gap-2 mt-6 bg-income-600 hover:bg-income-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg shadow-sm transition-transform hover:scale-[1.02]"
          >
            {ctaLabel}
          </button>
        )
      ) : null}
    </div>
  );
}

function Illustration({ variant }) {
  const map = {
    default: <DefaultIllust />,
    book: <BookIllust />,
    transaction: <TxIllust />,
    debt: <DebtIllust />,
    report: <ReportIllust />,
    search: <SearchIllust />,
  };
  return map[variant] || map.default;
}

// Custom SVG illustrations — minimalist, sesuai brand color
function BookIllust() {
  return (
    <svg viewBox="0 0 200 200" fill="none" className="w-full h-full">
      <rect x="40" y="50" width="120" height="100" rx="8" fill="#d1fae5" />
      <rect x="40" y="50" width="120" height="20" rx="8" fill="#10b981" />
      <line x1="60" y1="90" x2="140" y2="90" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
      <line x1="60" y1="105" x2="120" y2="105" stroke="#a7f3d0" strokeWidth="3" strokeLinecap="round" />
      <line x1="60" y1="120" x2="135" y2="120" stroke="#a7f3d0" strokeWidth="3" strokeLinecap="round" />
      <line x1="60" y1="135" x2="100" y2="135" stroke="#a7f3d0" strokeWidth="3" strokeLinecap="round" />
      <circle cx="155" cy="155" r="22" fill="#10b981" />
      <path
        d="M155 145v20M145 155h20"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TxIllust() {
  return (
    <svg viewBox="0 0 200 200" fill="none" className="w-full h-full">
      <rect x="30" y="40" width="140" height="120" rx="10" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2" />
      <line x1="50" y1="65" x2="150" y2="65" stroke="#cbd5e1" strokeWidth="2" />
      <line x1="50" y1="65" x2="50" y2="160" stroke="#cbd5e1" strokeWidth="2" />
      <line x1="100" y1="65" x2="100" y2="160" stroke="#cbd5e1" strokeWidth="2" />
      <line x1="150" y1="65" x2="150" y2="160" stroke="#cbd5e1" strokeWidth="2" />
      <line x1="50" y1="90" x2="170" y2="90" stroke="#e2e8f0" strokeWidth="1" />
      <line x1="50" y1="115" x2="170" y2="115" stroke="#e2e8f0" strokeWidth="1" />
      <line x1="50" y1="140" x2="170" y2="140" stroke="#e2e8f0" strokeWidth="1" />
      <circle cx="155" cy="50" r="18" fill="#10b981" />
      <text x="155" y="56" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">+</text>
    </svg>
  );
}

function DebtIllust() {
  return (
    <svg viewBox="0 0 200 200" fill="none" className="w-full h-full">
      <circle cx="70" cy="100" r="35" fill="#fef2f2" stroke="#ef4444" strokeWidth="2" />
      <circle cx="70" cy="85" r="12" fill="#ef4444" />
      <path d="M50 110 Q70 130 90 110" stroke="#ef4444" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="135" cy="100" r="35" fill="#ecfdf5" stroke="#10b981" strokeWidth="2" />
      <circle cx="135" cy="85" r="12" fill="#10b981" />
      <path d="M115 110 Q135 130 155 110" stroke="#10b981" strokeWidth="3" fill="none" strokeLinecap="round" />
      <line x1="95" y1="100" x2="115" y2="100" stroke="#94a3b8" strokeWidth="2" strokeDasharray="3 3" />
      <text x="105" y="70" textAnchor="middle" fill="#64748b" fontSize="14" fontWeight="bold">Rp</text>
    </svg>
  );
}

function ReportIllust() {
  return (
    <svg viewBox="0 0 200 200" fill="none" className="w-full h-full">
      <rect x="30" y="60" width="30" height="100" rx="3" fill="#d1fae5" />
      <rect x="70" y="100" width="30" height="60" rx="3" fill="#10b981" />
      <rect x="110" y="40" width="30" height="120" rx="3" fill="#a7f3d0" />
      <rect x="150" y="80" width="30" height="80" rx="3" fill="#10b981" />
      <line x1="20" y1="170" x2="190" y2="170" stroke="#cbd5e1" strokeWidth="2" />
    </svg>
  );
}

function SearchIllust() {
  return (
    <svg viewBox="0 0 200 200" fill="none" className="w-full h-full">
      <circle cx="85" cy="85" r="45" fill="none" stroke="#cbd5e1" strokeWidth="6" />
      <line x1="120" y1="120" x2="160" y2="160" stroke="#cbd5e1" strokeWidth="8" strokeLinecap="round" />
      <text x="85" y="95" textAnchor="middle" fill="#94a3b8" fontSize="32">?</text>
    </svg>
  );
}

function DefaultIllust() {
  return (
    <svg viewBox="0 0 200 200" fill="none" className="w-full h-full">
      <rect x="50" y="50" width="100" height="100" rx="10" fill="#f1f5f9" />
      <circle cx="100" cy="100" r="20" fill="#cbd5e1" />
    </svg>
  );
}
