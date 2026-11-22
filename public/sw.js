// Service worker minimal Timesheet KINRA: memenuhi syarat instal PWA.
// Sengaja tidak menyimpan cache data halaman, agar sesi dan data logbook selalu segar.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', () => {
  // Biarkan permintaan lewat ke jaringan seperti biasa.
});
