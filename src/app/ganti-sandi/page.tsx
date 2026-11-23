'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { homeForRole } from '@/lib/auth/roles';
import { DEFAULT_PASSWORD, MIN_PASSWORD_LENGTH } from '@/lib/auth/password';
import { AuthShell, AuthField } from '@/components/AuthShell';

/** Wajib dibuka setelah masuk pertama kali dengan kata sandi awal. */
export default function GantiSandiPage() {
  const router = useRouter();
  const supabase = createClient();

  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!active) return;
      if (!user) {
        router.replace('/login');
        return;
      }
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, [router, supabase]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (password.length < MIN_PASSWORD_LENGTH) {
      setErrorMsg(`Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter.`);
      return;
    }
    if (password === DEFAULT_PASSWORD) {
      setErrorMsg('Pilih kata sandi yang berbeda dari kata sandi awal.');
      return;
    }
    if (password !== confirm) {
      setErrorMsg('Konfirmasi kata sandi tidak sama. Ketik ulang dengan benar.');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.updateUser({
      password,
      data: { must_change_password: false },
    });
    if (error || !data.user) {
      setErrorMsg(error?.message ?? 'Kata sandi belum bisa diganti. Coba lagi.');
      setLoading(false);
      return;
    }
    const { data: prof } = await supabase.from('profiles').select('role').eq('id', data.user.id).maybeSingle();
    router.replace(homeForRole(prof?.role ?? 'participant'));
    router.refresh();
  };

  return (
    <AuthShell
      brandEyebrow="Timesheet KINRA"
      brandTitle="Logbook harian peserta magang."
      brandText="Catat kegiatan, ajukan ke mentor, dan pantau persetujuan dalam satu tempat."
    >
      <p className="eyebrow auth-eyebrow">Keamanan akun</p>
      <h1 className="auth-title">Ganti kata sandi Anda</h1>
      <p className="auth-lead">Ini masuk pertama kali dengan kata sandi awal. Buat kata sandi baru sebelum melanjutkan.</p>

      {errorMsg && (
        <div className="auth-alert auth-alert-error" role="alert">
          <i className="fa-solid fa-circle-xmark" aria-hidden="true"></i>
          <span>{errorMsg}</span>
        </div>
      )}

      {ready && (
        <form onSubmit={save} className="auth-form">
          <AuthField id="new-password" label="Kata sandi baru" type="password" icon="fa-lock" value={password} onChange={setPassword} placeholder={`Minimal ${MIN_PASSWORD_LENGTH} karakter`} autoComplete="new-password" />
          <AuthField id="confirm-password" label="Ulangi kata sandi baru" type="password" icon="fa-shield-halved" value={confirm} onChange={setConfirm} placeholder="Ketik ulang kata sandi" autoComplete="new-password" />
          <button type="submit" disabled={loading} className="btn-masuk">
            {loading ? 'Menyimpan…' : 'Simpan dan lanjut'}
          </button>
        </form>
      )}

      <p className="auth-foot">PT Kawasan Industri Nusantara · KEK Sei Mangkei</p>
    </AuthShell>
  );
}
