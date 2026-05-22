"use client";

import { createContext, useCallback, useContext, useState } from "react";

const ToastContext = createContext({
  showToast: () => {},
});

/**
 * Toast notification provider. Wrap aplikasi dengan ini lalu pakai
 * useToast().showToast(message, type) di komponen mana saja.
 *
 * Types: 'success' (default, hijau), 'error' (merah), 'info' (slate)
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Container toast — bottom-right desktop, agak ke atas di mobile
          biar tidak tertutup bottom-nav */}
      <div className="fixed inset-x-4 bottom-24 md:bottom-6 md:left-auto md:right-6 md:max-w-sm z-50 space-y-2 pointer-events-none">
        {toasts.map((t) => (
          <Toast key={t.id} message={t.message} type={t.type} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function Toast({ message, type }) {
  const styles = {
    success: "bg-income-600 text-white",
    error: "bg-expense-600 text-white",
    info: "bg-slate-700 text-white",
  };
  const icon = {
    success: "✓",
    error: "⚠",
    info: "ℹ",
  };
  return (
    <div
      className={`pointer-events-auto px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 ${styles[type] || styles.success}`}
    >
      <span className="text-lg leading-none shrink-0">
        {icon[type] || icon.success}
      </span>
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
}

export const useToast = () => useContext(ToastContext);
