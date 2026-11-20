'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { homeForRole } from '@/lib/auth/roles';
import { MIN_PASSWORD_LENGTH } from '@/lib/auth/password';
import { AuthShell, AuthField } from '@/components/AuthShell';

/**
 * Tujuan tautan undangan dan reset sandi. Supabase sudah menyiapkan sesi dari
 * tautan itu, jadi di sini penerima cukup membuat kata sandi lalu masuk.
 */
export default function SetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [ready, setReady] = useState<'checking' | 'ok' | 'invalid'>('checking');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let active = true;
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!active || !session?.user) return;
      setName(String(session.user.user_metadata?.name ?? ''));
      setReady('ok');
    });
    // Beri waktu Supabase membaca tautan, lalu cek sesi
    const t = setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      if (data.session?.user) {
        setName(String(data.session.user.user_metadata?.name ?? ''));
        setReady('ok');
      } else {
        setReady('invalid');
      }
    }, 2500);
    return () => {
      active = false;
      clearTimeout(t);
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (password.length < MIN_PASSWORD_LENGTH) {
      setErrorMsg(`Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter.`);
      return;
    }
    if (password !== confirm) {
      setErrorMsg('Konfirmasi kata sandi tidak sama.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: prof } = await supabase.from('profiles').select('role').eq('id', user?.id ?? '').maybeSingle();
    router.replace(homeForRole(prof?.role));
    router.refresh();
  };

  return (
    <AuthShell
      brandEyebrow="Akun baru"
      brandTitle="Selamat datang di Timesheet KINRA."
      brandText="Buat kata sandi untuk akun Anda. Setelah itu Anda langsung masuk ke halaman sesuai peran."
    >
      <p className="eyebrow auth-eyebrow">Aktivasi akun</p>
      <h1 className="auth-title">{name ? `Halo, ${name}` : 'Buat kata sandi'}</h1>

      {ready === 'checking' && <p className="auth-lead">Memeriksa tautan…</p>}

      {ready === 'invalid' && (
        <>
          <div className="auth-alert auth-alert-error" role="alert">
            <i className="fa-solid fa-circle-xmark" aria-hidden="true"></i>
            <span>Tautan tidak valid atau sudah kedaluwarsa. Minta super admin mengirim ulang undangan.</span>
          </div>
        </>
      )}

      {ready === 'ok' && (
        <>
          <p className="auth-lead">Kata sandi ini dipakai untuk masuk berikutnya.</p>
          {errorMsg && (
            <div className="auth-alert auth-alert-error" role="alert">
              <i className="fa-solid fa-circle-xmark" aria-hidden="true"></i>
              <span>{errorMsg}</span>
            </div>
          )}
          <form onSubmit={handleSubmit} className="auth-form">
            <AuthField id="sp-pass" label="Kata sandi baru" type="password" icon="fa-lock" value={password} onChange={setPassword} placeholder={`Minimal ${MIN_PASSWORD_LENGTH} karakter`} autoComplete="new-password" />
            <AuthField id="sp-confirm" label="Ulangi kata sandi" type="password" icon="fa-shield-halved" value={confirm} onChange={setConfirm} placeholder="Ketik ulang kata sandi" autoComplete="new-password" />
            <button type="submit" disabled={loading} className="btn-masuk">
              {loading ? 'Menyimpan…' : 'Simpan dan masuk'}
            </button>
          </form>
        </>
      )}
      <p className="auth-foot">PT Kawasan Industri Nusantara · KEK Sei Mangkei</p>
    </AuthShell>
  );
}
