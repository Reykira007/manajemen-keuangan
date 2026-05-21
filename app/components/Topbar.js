"use client";

export default function Topbar({ title, subtitle, actions }) {
  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      <div className="px-4 md:px-8 py-4 md:py-5 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-lg md:text-2xl font-semibold text-slate-900 dark:text-slate-100 truncate">
            {title}
          </h1>
          {subtitle ? (
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {subtitle}
            </p>
          ) : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
    </header>
  );
}
