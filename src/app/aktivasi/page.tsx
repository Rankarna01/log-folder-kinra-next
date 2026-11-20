import { redirect } from 'next/navigation';

// Aktivasi sekarang dilakukan dari halaman login.
export default function AktivasiRedirect() {
  redirect('/login');
}
