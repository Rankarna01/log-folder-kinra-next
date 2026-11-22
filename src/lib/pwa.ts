'use client';

import { useSyncExternalStore } from 'react';

// Event "instal aplikasi" dari browser disimpan agar bisa dipicu lewat tombol di dalam aplikasi.
type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

let deferred: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

let wired = false;
function wire() {
  if (wired || typeof window === 'undefined') return;
  wired = true;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as InstallPromptEvent;
    emit();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    emit();
  });
}

const subscribe = (cb: () => void) => {
  wire();
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

const isInstalled = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true);

/** Status instal: 'installed' | 'available' (browser menawarkan) | 'unavailable'. */
export function useInstallState(): 'installed' | 'available' | 'unavailable' {
  return useSyncExternalStore(
    subscribe,
    () => (isInstalled() ? 'installed' : deferred ? 'available' : 'unavailable'),
    () => 'unavailable'
  );
}

/** Menampilkan dialog instal browser. Mengembalikan true bila pengguna menerima. */
export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false;
  await deferred.prompt();
  const { outcome } = await deferred.userChoice;
  deferred = null;
  emit();
  return outcome === 'accepted';
}
