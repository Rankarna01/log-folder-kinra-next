'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { homeForRole, roleFromEmail } from '@/lib/auth/roles';
import { AuthShell, AuthField } from '@/components/AuthShell';

function translateError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) {
    return 'Email atau kata sandi salah. Periksa kembali, atau daftar bila belum punya akun.';
  }
  if (m.includes('email not confirmed')) {
    return 'Email belum diverifikasi. Buka tautan konfirmasi di inbox atau folder spam Anda.';
  }
  if (m.includes('failed to fetch') || m.includes('network')) {
    return 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
  }
  return message || 'Gagal masuk. Silakan coba lagi.';
}

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error || !data.user) {
      setErrorMsg(translateError(error?.message ?? ''));
      setLoading(false);
      return;
    }

    // Arahkan sesuai role: admin -> /admin, mentor -> /mentor, peserta -> /dashboard
    const { data: prof } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .maybeSingle();

    const role = prof?.role ?? roleFromEmail(data.user.email);
    router.replace(homeForRole(role));
    router.refresh();
  };

  return (
    <AuthShell
      brandEyebrow="Timesheet KINRA"
      brandTitle="Logbook harian peserta magang."
      brandText="Catat kegiatan, ajukan ke mentor, dan pantau persetujuan dalam satu tempat."
    >
      <p className="eyebrow auth-eyebrow">Masuk</p>
      <h1 className="auth-title">Masuk ke akun Anda</h1>
      <p className="auth-lead">
        Peserta magang, mentor, dan admin masuk lewat halaman yang sama. Anda akan diarahkan sesuai peran.
      </p>

      {errorMsg && (
        <div className="auth-alert auth-alert-error" role="alert">
          <i className="fa-solid fa-circle-xmark" aria-hidden="true"></i>
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="auth-form">
        <AuthField
          id="email"
          label="Email"
          type="email"
          icon="fa-envelope"
          value={email}
          onChange={setEmail}
          placeholder="nama@email.com"
          autoComplete="email"
        />
        <AuthField
          id="password"
          label="Kata sandi"
          type="password"
          icon="fa-lock"
          value={password}
          onChange={setPassword}
          placeholder="Masukkan kata sandi"
          autoComplete="current-password"
        />

        <button type="submit" disabled={loading} className="btn-masuk">
          {loading ? 'Memproses...' : 'Masuk'}
        </button>
      </form>

      <p className="auth-switch">
        Belum punya akun? <Link href="/register">Daftar sebagai peserta</Link>
      </p>
      <p className="auth-foot">PT Kawasan Industri Nusantara · KEK Sei Mangkei</p>
    </AuthShell>
  );
}
