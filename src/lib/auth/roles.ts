import type { UserRole } from '@/types/database';

/** Halaman beranda untuk tiap role setelah login. */
export function homeForRole(role?: string | null): string {
  if (role === 'admin') return '/admin';
  if (role === 'mentor') return '/mentor';
  return '/dashboard';
}

/**
 * Cadangan bila baris `profiles` belum ada. Aturannya sama dengan trigger
 * `handle_new_user` di migrasi Supabase.
 */
export function roleFromEmail(email?: string | null): UserRole {
  const e = (email || '').toLowerCase();
  if (e.startsWith('admin')) return 'admin';
  if (e.startsWith('mentor')) return 'mentor';
  return 'participant';
}
