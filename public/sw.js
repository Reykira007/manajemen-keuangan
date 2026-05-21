// Service worker minimal untuk memenuhi syarat PWA installable.
// Tidak melakukan caching aset agar update aplikasi langsung berlaku.
// Offline data ditangani oleh Firestore persistent cache di sisi aplikasi.

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // pass-through; biarkan browser tangani fetch normal
});
