'use client';

import { useSyncExternalStore } from 'react';

// Status sidebar (diciutkan / diperlebar) disimpan per browser.
// Dibaca lewat useSyncExternalStore agar aman untuk render di server.
const KEY = 'kinra_sidebar_collapsed';
const listeners = new Set<() => void>();

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

const read = () => {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
};

export function setSidebarCollapsed(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? '1' : '0');
  } catch {
    /* penyimpanan diblokir: berlaku untuk sesi ini saja */
  }
  listeners.forEach((l) => l());
}

export function useSidebarCollapsed() {
  return useSyncExternalStore(subscribe, read, () => false);
}
