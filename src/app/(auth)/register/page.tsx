'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AuthShell, AuthField } from '@/components/AuthShell';
import { ProfileSetupForm } from '@/components/onboarding/ProfileSetupForm';

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [setupOpen, setSetupOpen] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    if (password !== passwordConfirm) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Kata sandi minimal 6 karakter.');
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    if (error) {
      setErrorMsg(error.message || 'Pendaftaran gagal. Silakan coba lagi.');
      setLoading(false);
      return;
    }

    // Email sudah terdaftar (Supabase mengembalikan identities kosong)
    if (data?.user && data.user.identities && data.user.identities.length === 0) {
      setErrorMsg('Email ini sudah terdaftar. Silakan masuk lewat halaman login.');
      setLoading(false);
      return;
    }

    // Tanpa verifikasi email, sesi langsung aktif: lanjut ke modal pilih mentor.
    if (data?.session) {
      setLoading(false);
      setSetupOpen(true);
      return;
    }

    setErrorMsg(
      'Akun dibuat, tetapi Supabase masih meminta verifikasi email. Di dashboard Supabase, matikan "Confirm email" pada Authentication → Providers → Email.'
    );
    setLoading(false);
  };

  return (
    <AuthShell
      brandEyebrow="Pendaftaran peserta"
      brandTitle="Mulai catat kegiatan magang Anda."
      brandText="Buat akun, pilih mentor pembimbing, lalu logbook harian siap diisi."
    >
      <p className="eyebrow auth-eyebrow">Daftar · Langkah 1 dari 2</p>
      <h1 className="auth-title">Buat akun peserta</h1>
      <p className="auth-lead">Masukkan email dan kata sandi. Setelah itu Anda memilih mentor pembimbing.</p>

      {errorMsg && (
        <div className="auth-alert auth-alert-error" role="alert">
          <i className="fa-solid fa-circle-xmark" aria-hidden="true"></i>
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleRegister} className="auth-form">
        <AuthField
          id="email"
          label="Alamat email"
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
          placeholder="Minimal 6 karakter"
          autoComplete="new-password"
        />
        <AuthField
          id="password-confirm"
          label="Konfirmasi kata sandi"
          type="password"
          icon="fa-shield-halved"
          value={passwordConfirm}
          onChange={setPasswordConfirm}
          placeholder="Ulangi kata sandi"
          autoComplete="new-password"
        />

        <button type="submit" disabled={loading} className="btn-masuk">
          {loading ? 'Membuat akun…' : 'Daftar'}
        </button>
      </form>

      <p className="auth-switch">
        Sudah punya akun? <Link href="/login">Masuk</Link>
      </p>
      <p className="auth-foot">PT Kawasan Industri Nusantara · KEK Sei Mangkei</p>

      {setupOpen && (
        <div className="kc-modal-backdrop">
          <div className="kc-modal" role="dialog" aria-modal="true" aria-labelledby="setup-title">
            <p className="kc-eyebrow">Langkah 2 dari 2</p>
            <h2 id="setup-title">Pilih mentor pembimbing</h2>
            <p>Lengkapi data diri. Mentor dipilih dari daftar yang sudah didaftarkan admin.</p>
            <ProfileSetupForm
              onDone={() => {
                router.replace('/dashboard');
                router.refresh();
              }}
            />
          </div>
        </div>
      )}
    </AuthShell>
  );
}
