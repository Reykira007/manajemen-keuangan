"use client";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";

/* =========================================================
   STRUKTUR DATA DI FIRESTORE
   users/{uid}/books/{bookId}         -> Book document
   users/{uid}/transactions/{txId}    -> Transaction document
   users/{uid}/categories/{catId}     -> Custom category (user-defined)
   users/{uid}/debts/{debtId}         -> Hutang & Piutang
   ========================================================= */

const booksCol = (uid) => collection(db, "users", uid, "books");
const bookDoc = (uid, id) => doc(db, "users", uid, "books", id);
const txCol = (uid) => collection(db, "users", uid, "transactions");
const txDoc = (uid, id) => doc(db, "users", uid, "transactions", id);
const catCol = (uid) => collection(db, "users", uid, "categories");
const catDoc = (uid, id) => doc(db, "users", uid, "categories", id);
const debtCol = (uid) => collection(db, "users", uid, "debts");
const debtDoc = (uid, id) => doc(db, "users", uid, "debts", id);

function snapToBook(s) {
  const data = s.data() || {};
  return {
    id: s.id,
    name: data.name || "",
    openingBalance: Number(data.openingBalance) || 0,
    template: data.template || "custom",
    createdAt:
      data.createdAt instanceof Timestamp
        ? data.createdAt.toDate().toISOString()
        : data.createdAt || new Date().toISOString(),
  };
}

function snapToTx(s) {
  const data = s.data() || {};
  return {
    id: s.id,
    bookId: data.bookId,
    type: data.type, // "in" | "out"
    date: data.date, // YYYY-MM-DD
    description: data.description || "",
    category: data.category || "",
    categoryLabel: data.categoryLabel || "",
    source: data.source || "cash", // sumber dana: cash, bank, ewallet, qris, lain
    quantity: Number(data.quantity) || 0,
    unitPrice: Number(data.unitPrice) || 0,
    amount: Number(data.amount) || 0,
    createdAt:
      data.createdAt instanceof Timestamp
        ? data.createdAt.toDate().toISOString()
        : data.createdAt || new Date().toISOString(),
  };
}

function snapToCategory(s) {
  const data = s.data() || {};
  return {
    id: s.id,
    type: data.type || "out",
    label: data.label || "",
    custom: true,
  };
}

function snapToDebt(s) {
  const data = s.data() || {};
  return {
    id: s.id,
    bookId: data.bookId,
    type: data.type, // 'piutang' (orang lain hutang ke kita) | 'hutang' (kita hutang ke orang)
    counterpart: data.counterpart || "",
    amount: Number(data.amount) || 0,
    date: data.date || "",
    dueDate: data.dueDate || "",
    note: data.note || "",
    status: data.status || "belum_lunas", // 'belum_lunas' | 'lunas'
    paidAt: data.paidAt || "",
    paidTransactionId: data.paidTransactionId || "",
    createdAt:
      data.createdAt instanceof Timestamp
        ? data.createdAt.toDate().toISOString()
        : data.createdAt || new Date().toISOString(),
  };
}

/* ===========================
   BOOKS
   =========================== */

export async function getBooks(uid) {
  if (!uid) return [];
  const snap = await getDocs(query(booksCol(uid), orderBy("createdAt", "desc")));
  return snap.docs.map(snapToBook);
}

export async function getBook(uid, id) {
  if (!uid || !id) return null;
  const s = await getDoc(bookDoc(uid, id));
  return s.exists() ? snapToBook(s) : null;
}

export async function createBook(uid, { name, openingBalance = 0, template = "custom" }) {
  const ref = await addDoc(booksCol(uid), {
    name: (name || "").trim(),
    openingBalance: Number(openingBalance) || 0,
    template,
    createdAt: serverTimestamp(),
  });
  return {
    id: ref.id,
    name,
    openingBalance,
    template,
    createdAt: new Date().toISOString(),
  };
}

export async function updateBook(uid, id, patch) {
  await setDoc(bookDoc(uid, id), patch, { merge: true });
}

export async function deleteBook(uid, id) {
  // hapus buku + semua transaksinya dalam batch
  const txSnap = await getDocs(query(txCol(uid), where("bookId", "==", id)));
  const batch = writeBatch(db);
  txSnap.forEach((d) => batch.delete(d.ref));
  batch.delete(bookDoc(uid, id));
  await batch.commit();
}

/* Realtime: dengarkan perubahan list books */
export function subscribeBooks(uid, handler) {
  if (!uid) return () => {};
  const q = query(booksCol(uid), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    handler(snap.docs.map(snapToBook));
  });
}

export function subscribeBook(uid, id, handler) {
  if (!uid || !id) return () => {};
  return onSnapshot(bookDoc(uid, id), (s) => {
    handler(s.exists() ? snapToBook(s) : null);
  });
}

/* ===========================
   TRANSACTIONS
   =========================== */

export async function getTransactions(uid) {
  if (!uid) return [];
  const snap = await getDocs(query(txCol(uid), orderBy("date", "desc")));
  return snap.docs.map(snapToTx);
}

export async function getBookTransactions(uid, bookId) {
  if (!uid || !bookId) return [];
  const snap = await getDocs(
    query(txCol(uid), where("bookId", "==", bookId), orderBy("date", "asc"))
  );
  // urutkan dari lama ke baru (untuk running balance)
  const list = snap.docs.map(snapToTx);
  list.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.createdAt.localeCompare(b.createdAt);
  });
  return list;
}

export async function addTransaction(
  uid,
  {
    bookId,
    type,
    date,
    description,
    category,
    categoryLabel,
    source,
    quantity,
    unitPrice,
  }
) {
  const qty = Math.max(0, Number(quantity) || 0);
  const unit = Math.max(0, Number(unitPrice) || 0);
  const amount = qty * unit;
  const ref = await addDoc(txCol(uid), {
    bookId,
    type,
    date,
    description: (description || "").trim(),
    category: category || "",
    categoryLabel: categoryLabel || "",
    source: source || "cash",
    quantity: qty,
    unitPrice: unit,
    amount,
    createdAt: serverTimestamp(),
  });
  return {
    id: ref.id,
    bookId,
    type,
    date,
    description,
    category: category || "",
    categoryLabel: categoryLabel || "",
    source: source || "cash",
    quantity: qty,
    unitPrice: unit,
    amount,
    createdAt: new Date().toISOString(),
  };
}

export async function updateTransaction(
  uid,
  id,
  { date, description, category, categoryLabel, source, quantity, unitPrice }
) {
  const qty = Math.max(0, Number(quantity) || 0);
  const unit = Math.max(0, Number(unitPrice) || 0);
  await setDoc(
    txDoc(uid, id),
    {
      date,
      description: (description || "").trim(),
      category: category || "",
      categoryLabel: categoryLabel || "",
      source: source || "cash",
      quantity: qty,
      unitPrice: unit,
      amount: qty * unit,
    },
    { merge: true }
  );
}

export async function deleteTransaction(uid, id) {
  await deleteDoc(txDoc(uid, id));
}

/* Realtime: semua transaksi user */
export function subscribeAllTransactions(uid, handler) {
  if (!uid) return () => {};
  const q = query(txCol(uid), orderBy("date", "desc"));
  return onSnapshot(q, (snap) => {
    handler(snap.docs.map(snapToTx));
  });
}

/* Realtime: transaksi 1 buku (urut lama -> baru, untuk running balance) */
export function subscribeBookTransactions(uid, bookId, handler) {
  if (!uid || !bookId) return () => {};
  const q = query(txCol(uid), where("bookId", "==", bookId));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map(snapToTx);
    list.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.createdAt.localeCompare(b.createdAt);
    });
    handler(list);
  });
}

/* ===========================
   CUSTOM CATEGORIES (user-defined)
   =========================== */

export async function getCustomCategories(uid) {
  if (!uid) return [];
  const snap = await getDocs(catCol(uid));
  return snap.docs.map(snapToCategory);
}

export async function addCustomCategory(uid, { type, label }) {
  const trimmed = (label || "").trim();
  if (!trimmed) throw new Error("Nama kategori wajib diisi");
  if (!["in", "out"].includes(type))
    throw new Error("Tipe kategori harus 'in' atau 'out'");
  const ref = await addDoc(catCol(uid), {
    type,
    label: trimmed,
    createdAt: serverTimestamp(),
  });
  return { id: ref.id, type, label: trimmed, custom: true };
}

export async function updateCustomCategory(uid, id, { label }) {
  const trimmed = (label || "").trim();
  if (!trimmed) throw new Error("Nama kategori wajib diisi");
  await setDoc(catDoc(uid, id), { label: trimmed }, { merge: true });
}

export async function deleteCustomCategory(uid, id) {
  await deleteDoc(catDoc(uid, id));
}

export function subscribeCustomCategories(uid, handler) {
  if (!uid) return () => {};
  return onSnapshot(catCol(uid), (snap) => {
    handler(snap.docs.map(snapToCategory));
  });
}

/* ===========================
   HUTANG & PIUTANG
   ===========================
   type 'piutang' = orang lain hutang ke kita (uang akan masuk saat lunas)
   type 'hutang'  = kita hutang ke orang lain (uang akan keluar saat lunas)
*/

export async function addDebt(
  uid,
  { bookId, type, counterpart, amount, date, dueDate, note }
) {
  if (!["piutang", "hutang"].includes(type))
    throw new Error("Tipe harus 'piutang' atau 'hutang'");
  if (!counterpart?.trim()) throw new Error("Nama pihak wajib diisi");
  if (!amount || amount <= 0) throw new Error("Jumlah harus lebih dari 0");

  const ref = await addDoc(debtCol(uid), {
    bookId,
    type,
    counterpart: counterpart.trim(),
    amount: Number(amount),
    date: date || new Date().toISOString().slice(0, 10),
    dueDate: dueDate || "",
    note: (note || "").trim(),
    status: "belum_lunas",
    paidAt: "",
    paidTransactionId: "",
    createdAt: serverTimestamp(),
  });
  return { id: ref.id };
}

export async function updateDebt(uid, id, patch) {
  await setDoc(debtDoc(uid, id), patch, { merge: true });
}

export async function deleteDebt(uid, id) {
  await deleteDoc(debtDoc(uid, id));
}

/**
 * Tandai hutang/piutang sebagai lunas.
 * Otomatis create transaksi kas masuk (piutang) atau kas keluar (hutang).
 */
export async function markDebtPaid(uid, debtId, { paidDate, source } = {}) {
  const d = await getDoc(debtDoc(uid, debtId));
  if (!d.exists()) throw new Error("Hutang/piutang tidak ditemukan");
  const data = d.data();
  if (data.status === "lunas") throw new Error("Sudah lunas");

  const txType = data.type === "piutang" ? "in" : "out";
  const txDesc =
    data.type === "piutang"
      ? `Pelunasan piutang dari ${data.counterpart}`
      : `Pelunasan hutang ke ${data.counterpart}`;
  const txCategoryLabel =
    data.type === "piutang" ? "Pelunasan Piutang" : "Pelunasan Hutang";
  const effectiveDate = paidDate || new Date().toISOString().slice(0, 10);

  // Create transaksi
  const txRef = await addDoc(txCol(uid), {
    bookId: data.bookId,
    type: txType,
    date: effectiveDate,
    description: txDesc,
    category: "",
    categoryLabel: txCategoryLabel,
    source: source || "cash",
    quantity: 1,
    unitPrice: Number(data.amount) || 0,
    amount: Number(data.amount) || 0,
    createdAt: serverTimestamp(),
  });

  // Update status debt
  await setDoc(
    debtDoc(uid, debtId),
    {
      status: "lunas",
      paidAt: effectiveDate,
      paidTransactionId: txRef.id,
    },
    { merge: true }
  );

  return { transactionId: txRef.id };
}

export function subscribeBookDebts(uid, bookId, handler) {
  if (!uid || !bookId) return () => {};
  const q = query(debtCol(uid), where("bookId", "==", bookId));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map(snapToDebt);
    list.sort((a, b) => {
      // belum lunas dulu, lalu sort by due date / date
      if (a.status !== b.status) return a.status === "belum_lunas" ? -1 : 1;
      const aDue = a.dueDate || a.date;
      const bDue = b.dueDate || b.date;
      return aDue.localeCompare(bDue);
    });
    handler(list);
  });
}

export function subscribeAllDebts(uid, handler) {
  if (!uid) return () => {};
  return onSnapshot(debtCol(uid), (snap) => {
    handler(snap.docs.map(snapToDebt));
  });
}

/* ===========================
   HELPERS: ringkasan & saldo
   =========================== */

export function summarize(book, transactions) {
  const opening = book?.openingBalance || 0;
  let totalIn = opening;
  let totalOut = 0;
  for (const t of transactions || []) {
    if (t.type === "in") totalIn += t.amount;
    else totalOut += t.amount;
  }
  return {
    totalIn,
    totalOut,
    balance: totalIn - totalOut,
    opening,
  };
}

export function openingRow(book) {
  const opening = book?.openingBalance || 0;
  if (opening <= 0) return null;
  return {
    id: `__opening_${book.id}`,
    bookId: book.id,
    type: "in",
    date: (book.createdAt || new Date().toISOString()).slice(0, 10),
    description: "Saldo Awal",
    amount: opening,
    quantity: 0,
    unitPrice: 0,
    createdAt: book.createdAt,
    isOpening: true,
  };
}

export function withRunningBalance(book, transactions) {
  if (!book) return [];
  const rows = [];
  let running = 0;
  const op = openingRow(book);
  if (op) {
    running += op.amount;
    rows.push({ ...op, running });
  }
  for (const t of transactions || []) {
    running += t.type === "in" ? t.amount : -t.amount;
    rows.push({ ...t, running });
  }
  return rows;
}

/* ===========================
   EXPORT / IMPORT (backup)
   =========================== */

export async function exportAll(uid) {
  if (!uid) throw new Error("Tidak ada user");
  const [books, transactions] = await Promise.all([
    getBooks(uid),
    getTransactions(uid),
  ]);
  return {
    schema: "manajemen-keuangan/v1",
    exportedAt: new Date().toISOString(),
    books,
    transactions,
  };
}

export async function importAll(uid, payload, { replace = false } = {}) {
  if (!uid) throw new Error("Tidak ada user");
  if (!payload || !Array.isArray(payload.books) || !Array.isArray(payload.transactions)) {
    throw new Error("Format file tidak valid.");
  }

  if (replace) {
    // hapus semua data dulu
    const batch = writeBatch(db);
    const [bs, ts] = await Promise.all([
      getDocs(booksCol(uid)),
      getDocs(txCol(uid)),
    ]);
    bs.forEach((d) => batch.delete(d.ref));
    ts.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }

  // Mapping ID lama -> ID baru supaya bookId di transaksi tetap nyambung
  const bookIdMap = {};
  // Tulis books
  for (const b of payload.books) {
    const ref = await addDoc(booksCol(uid), {
      name: b.name || "",
      openingBalance: Number(b.openingBalance) || 0,
      template: b.template || "custom",
      createdAt: b.createdAt ? Timestamp.fromDate(new Date(b.createdAt)) : serverTimestamp(),
    });
    bookIdMap[b.id] = ref.id;
  }

  // Tulis transactions secara batch (max 500 per batch)
  let batch = writeBatch(db);
  let count = 0;
  for (const t of payload.transactions) {
    const newBookId = bookIdMap[t.bookId];
    if (!newBookId) continue; // skip kalau bookId tidak dikenal
    const ref = doc(txCol(uid));
    batch.set(ref, {
      bookId: newBookId,
      type: t.type,
      date: t.date,
      description: t.description || "",
      category: t.category || "",
      categoryLabel: t.categoryLabel || "",
      source: t.source || "cash",
      quantity: Number(t.quantity) || 0,
      unitPrice: Number(t.unitPrice) || 0,
      amount: Number(t.amount) || 0,
      createdAt: t.createdAt ? Timestamp.fromDate(new Date(t.createdAt)) : serverTimestamp(),
    });
    count++;
    if (count % 400 === 0) {
      await batch.commit();
      batch = writeBatch(db);
    }
  }
  await batch.commit();

  return {
    importedBooks: payload.books.length,
    importedTransactions: payload.transactions.length,
  };
}
