'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { homeForRole, roleFromEmail } from '@/lib/auth/roles';
import { MIN_PASSWORD_LENGTH } from '@/lib/auth/password';
import { AuthShell, AuthField } from '@/components/AuthShell';

const EMAIL_KEY = 'kinra_last_email';

// NIK/email terakhir yang berhasil masuk disimpan di perangkat ini (bukan kata sandi).
const emailListeners = new Set<() => void>();
const subscribeEmail = (cb: () => void) => {
  emailListeners.add(cb);
  return () => {
    emailListeners.delete(cb);
  };
};
const readEmail = () => {
  try {
    return localStorage.getItem(EMAIL_KEY) ?? '';
  } catch {
    return '';
  }
};
const writeEmail = (value: string) => {
  try {
    localStorage.setItem(EMAIL_KEY, value);
  } catch {
    /* penyimpanan diblokir: hanya untuk sesi ini */
  }
  emailListeners.forEach((l) => l());
};

type Step = 'email' | 'password' | 'create';

function translateError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'Kata sandi salah. Periksa kembali kata sandi Anda.';
  if (m.includes('email not confirmed')) return 'Akun belum diaktifkan. Hubungi admin KINRA.';
  if (m.includes('failed to fetch') || m.includes('network')) return 'Tidak dapat terhubung ke server. Periksa koneksi Anda.';
  return message || 'Gagal masuk. Silakan coba lagi.';
}

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  // `email` berisi NIK (peserta) atau email (mentor/admin) yang diketik
  const savedEmail = useSyncExternalStore(subscribeEmail, readEmail, () => '');
  const [emailInput, setEmailInput] = useState<string | null>(null);
  const email = emailInput ?? savedEmail;
  // Email login Supabase hasil dari NIK atau email yang diketik (dikembalikan server)
  const [loginEmail, setLoginEmail] = useState('');

  const [step, setStep] = useState<Step>('email');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Tautan dari email membawa sesi di URL. Langsung arahkan sesuai role.
  useEffect(() => {
    // Hanya untuk tautan dari email. Sesi lama di browser tidak boleh melewati form login.
    if (!window.location.hash.includes('access_token')) return;
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!session?.user || (event !== 'SIGNED_IN' && event !== 'INITIAL_SESSION')) return;
      const { data: prof } = await supabase.from('profiles').select('role').eq('id', session.user.id).maybeSingle();
      router.replace(homeForRole(prof?.role ?? roleFromEmail(session.user.email)));
      router.refresh();
    });
    return () => sub.subscription.unsubscribe();
  }, [router, supabase]);

  const finishLogin = async (authEmail: string, pass: string, identifier: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email: authEmail, password: pass });
    if (error || !data.user) {
      setErrorMsg(translateError(error?.message ?? ''));
      setLoading(false);
      return;
    }
    writeEmail(identifier);
    const { data: prof } = await supabase.from('profiles').select('role').eq('id', data.user.id).maybeSingle();
    router.replace(homeForRole(prof?.role ?? roleFromEmail(data.user.email)));
    router.refresh();
  };

  // Langkah 1: cek NIK atau email
  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    const identifier = email.trim();

    const res = await fetch('/api/auth/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier }),
    });
    const json = (await res.json().catch(() => ({}))) as { state?: string; email?: string; error?: string };
    setLoading(false);

    if (!res.ok) {
      setErrorMsg(json.error || 'Gagal memeriksa data masuk.');
      return;
    }
    if (json.state === 'not_found') {
      setErrorMsg('Data ini belum didaftarkan admin. Hubungi admin KINRA.');
      return;
    }
    setLoginEmail(json.email ?? '');
    setPassword('');
    setConfirm('');
    setStep(json.state === 'pending' ? 'create' : 'password');
  };

  // Langkah 2a: masuk dengan kata sandi
  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    await finishLogin(loginEmail, password, email.trim());
  };

  // Langkah 2b: aktivasi pertama kali (kata sandi dua kali), lalu masuk
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (password.length < MIN_PASSWORD_LENGTH) {
      setErrorMsg(`Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter.`);
      return;
    }
    if (password !== confirm) {
      setErrorMsg('Konfirmasi kata sandi tidak sama. Ketik ulang dengan benar.');
      return;
    }
    setLoading(true);
    const identifier = email.trim();

    const res = await fetch('/api/auth/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string; email?: string };
    if (!res.ok) {
      setErrorMsg(json.error || 'Aktivasi gagal. Coba lagi.');
      setLoading(false);
      return;
    }
    await finishLogin(json.email ?? loginEmail, password, identifier);
  };

  const backToEmail = () => {
    setStep('email');
    setErrorMsg('');
    setPassword('');
    setConfirm('');
  };

  return (
    <AuthShell
      brandEyebrow="Timesheet KINRA"
      brandTitle="Logbook harian peserta magang."
      brandText="Catat kegiatan, ajukan ke mentor, dan pantau persetujuan dalam satu tempat."
    >
      <p className="eyebrow auth-eyebrow">Masuk</p>
      <h1 className="auth-title">
        {step === 'email' && 'Masuk ke akun Anda'}
        {step === 'password' && 'Masukkan kata sandi'}
        {step === 'create' && 'Buat kata sandi Anda'}
      </h1>
      <p className="auth-lead">
        {step === 'email' && 'Peserta dan mentor masuk dengan NIK. Admin masuk dengan ID.'}
        {step === 'password' && `Masuk sebagai ${email.trim()}.`}
        {step === 'create' && 'Pertama kali masuk. Buat kata sandi, lalu ulangi sekali lagi untuk memastikan.'}
      </p>

      {errorMsg && (
        <div className="auth-alert auth-alert-error" role="alert">
          <i className="fa-solid fa-circle-xmark" aria-hidden="true"></i>
          <span>{errorMsg}</span>
        </div>
      )}

      {step === 'email' && (
        <form onSubmit={handleEmail} className="auth-form">
          <AuthField id="email" label="Masukkan NIK ID Absen FInger" type="text" icon="fa-id-card" value={email} onChange={setEmailInput} placeholder="NIK (peserta), ID admin, atau email" autoComplete="username" />
          <button type="submit" disabled={loading} className="btn-masuk">
            {loading ? 'Memeriksa…' : 'Lanjut'}
          </button>
        </form>
      )}

      {step === 'password' && (
        <form onSubmit={handlePassword} className="auth-form">
          <input type="text" name="username" value={email.trim()} autoComplete="username" readOnly tabIndex={-1} aria-hidden="true" className="sr-only" />
          <AuthField id="password" label="Kata sandi" type="password" icon="fa-lock" value={password} onChange={setPassword} placeholder="Masukkan kata sandi" autoComplete="current-password" />
          <button type="submit" disabled={loading} className="btn-masuk">
            {loading ? 'Memproses…' : 'Masuk'}
          </button>
          <button type="button" className="auth-link-btn" onClick={backToEmail}>
            Ganti NIK atau email
          </button>
        </form>
      )}

      {step === 'create' && (
        <form onSubmit={handleCreate} className="auth-form">
          <input type="text" name="username" value={email.trim()} autoComplete="username" readOnly tabIndex={-1} aria-hidden="true" className="sr-only" />
          <AuthField id="new-password" label="Buat kata sandi" type="password" icon="fa-lock" value={password} onChange={setPassword} placeholder={`Minimal ${MIN_PASSWORD_LENGTH} karakter`} autoComplete="new-password" />
          <AuthField id="confirm-password" label="Ulangi kata sandi" type="password" icon="fa-shield-halved" value={confirm} onChange={setConfirm} placeholder="Ketik ulang kata sandi" autoComplete="new-password" />
          <button type="submit" disabled={loading} className="btn-masuk">
            {loading ? 'Menyimpan…' : 'Simpan dan masuk'}
          </button>
          <button type="button" className="auth-link-btn" onClick={backToEmail}>
            Ganti NIK atau email
          </button>
        </form>
      )}

      <p className="auth-foot">PT Kawasan Industri Nusantara · KEK Sei Mangkei</p>
    </AuthShell>
  );
}
