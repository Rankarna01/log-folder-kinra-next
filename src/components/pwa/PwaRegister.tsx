'use client';

import { useEffect } from 'react';

/** Mendaftarkan service worker agar aplikasi bisa dipasang di layar utama. */
export function PwaRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
      /* pemasangan PWA hanya tidak tersedia; aplikasi tetap berjalan */
    });
  }, []);
  return null;
}
