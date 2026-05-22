// Sumber Dana - dari mana uang masuk atau ke mana uang keluar.
// Berguna agar pemilik usaha tahu uangnya di cash, bank, atau e-wallet.

export const PAYMENT_SOURCES = [
  { id: "cash", label: "Cash", icon: "💵", shortLabel: "Cash" },
  { id: "bank", label: "Transfer Bank", icon: "🏦", shortLabel: "Bank" },
  { id: "ewallet", label: "E-wallet", icon: "📱", shortLabel: "E-wallet" },
  { id: "qris", label: "QRIS", icon: "📲", shortLabel: "QRIS" },
  { id: "lain", label: "Lain-lain", icon: "❓", shortLabel: "Lain" },
];

export const DEFAULT_SOURCE = "cash";

export function getSource(id) {
  return PAYMENT_SOURCES.find((s) => s.id === id) || null;
}

export function getSourceLabel(id) {
  return getSource(id)?.label || "Cash";
}

export function getSourceIcon(id) {
  return getSource(id)?.icon || "💵";
}
