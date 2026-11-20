import { redirect } from 'next/navigation';

// Pendaftaran mandiri dinonaktifkan. Akun didaftarkan oleh admin.
export default function RegisterRedirect() {
  redirect('/login');
}
