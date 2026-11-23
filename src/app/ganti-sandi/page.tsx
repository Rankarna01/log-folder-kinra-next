'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { homeForRole } from '@/lib/auth/roles';
import { DEFAULT_PASSWORD, MIN_PASSWORD_LENGTH } from '@/lib/auth/password';
import { useToast } from '@/components/feedback/FeedbackProvider';
import { PageHead, Skeleton } from '@/components/ui/Kit';

/** Wajib dibuka setelah masuk pertama kali dengan kata sandi awal. */
export default function GantiSandiPage() {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();

  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
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
      setErrorMsg('Pilih kata sandi yang berbeda dari kata sandi awal (password123).');
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
    toast.success('Kata sandi berhasil diperbarui. Selamat datang di Timesheet KINRA!', 'Berhasil');
    const { data: prof } = await supabase.from('profiles').select('role').eq('id', data.user.id).maybeSingle();
    router.replace(homeForRole(prof?.role ?? 'participant'));
    router.refresh();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
    router.refresh();
  };

  if (!ready) {
    return (
      <div className="kc-page" style={{ maxWidth: 540, margin: '24px auto' }}>
        <Skeleton height={320} />
      </div>
    );
  }

  const isMinLength = password.length >= MIN_PASSWORD_LENGTH;
  const isNotDefault = password && password !== DEFAULT_PASSWORD;
  const isMatch = confirm && password === confirm;

  return (
    <div className="kc-page" style={{ maxWidth: 540, margin: '0 auto', paddingBottom: 48 }}>
      <PageHead
        eyebrow="Keamanan Akun · Pertama Kali Masuk"
        title="Buat Kata Sandi Baru"
        lead="Untuk keamanan akun Anda, silakan ubah kata sandi bawaan (default) sebelum melanjutkan ke dashboard."
      />

      <div className="kc-card" style={{ padding: '28px 24px' }}>
        <div className="kc-note" style={{ marginBottom: 18 }}>
          <i className="fa-solid fa-shield-halved" aria-hidden="true"></i>
          <div>
            <p style={{ fontWeight: 700, margin: '0 0 2px' }}>Kata Sandi Awal Wajib Diganti</p>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>
              Akun Anda saat ini masih menggunakan kata sandi awal sistem. Buat kata sandi baru pribadi Anda (minimal {MIN_PASSWORD_LENGTH} karakter).
            </p>
          </div>
        </div>

        {errorMsg && (
          <div
            className="kc-note"
            role="alert"
            style={{
              marginBottom: 18,
              borderColor: 'rgba(239, 68, 68, 0.35)',
              background: 'rgba(239, 68, 68, 0.08)',
              color: '#dc2626',
            }}
          >
            <i className="fa-solid fa-circle-exclamation" style={{ color: '#dc2626' }} aria-hidden="true"></i>
            <span style={{ fontWeight: 600 }}>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={save} className="kc-form">
          <div className="kc-field">
            <label htmlFor="new-password">
              Kata sandi baru <span className="kc-req">*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={MIN_PASSWORD_LENGTH}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder={`Minimal ${MIN_PASSWORD_LENGTH} karakter`}
                autoComplete="new-password"
                style={{ paddingRight: 44, width: '100%' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--muted)',
                  cursor: 'pointer',
                  padding: 4,
                  fontSize: 15,
                }}
                aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
              >
                <i className={`fa-regular ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} aria-hidden="true"></i>
              </button>
            </div>
          </div>

          <div className="kc-field">
            <label htmlFor="confirm-password">
              Ulangi kata sandi baru <span className="kc-req">*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="confirm-password"
                type={showConfirm ? 'text' : 'password'}
                required
                minLength={MIN_PASSWORD_LENGTH}
                value={confirm}
                onChange={(e) => {
                  setConfirm(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="Ketik ulang kata sandi baru"
                autoComplete="new-password"
                style={{ paddingRight: 44, width: '100%' }}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--muted)',
                  cursor: 'pointer',
                  padding: 4,
                  fontSize: 15,
                }}
                aria-label={showConfirm ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
              >
                <i className={`fa-regular ${showConfirm ? 'fa-eye-slash' : 'fa-eye'}`} aria-hidden="true"></i>
              </button>
            </div>
          </div>

          {/* Checklist indikator validasi kata sandi */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              padding: '12px 14px',
              borderRadius: 12,
              background: 'var(--surface-2)',
              fontSize: 13,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: isMinLength ? 'var(--good)' : 'var(--muted)' }}>
              <i className={`fa-solid ${isMinLength ? 'fa-circle-check text-emerald-600' : 'fa-circle text-zinc-300'}`} style={{ fontSize: 13 }}></i>
              <span>Minimal {MIN_PASSWORD_LENGTH} karakter</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: isNotDefault ? 'var(--good)' : 'var(--muted)' }}>
              <i className={`fa-solid ${isNotDefault ? 'fa-circle-check text-emerald-600' : 'fa-circle text-zinc-300'}`} style={{ fontSize: 13 }}></i>
              <span>Bukan kata sandi awal ({DEFAULT_PASSWORD})</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: isMatch ? 'var(--good)' : 'var(--muted)' }}>
              <i className={`fa-solid ${isMatch ? 'fa-circle-check text-emerald-600' : 'fa-circle text-zinc-300'}`} style={{ fontSize: 13 }}></i>
              <span>Konfirmasi kata sandi cocok</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="kc-btn kc-btn-primary"
            style={{ justifyContent: 'center', height: 46, fontSize: 14, fontWeight: 700, marginTop: 6 }}
          >
            <i className="fa-solid fa-check" aria-hidden="true"></i>
            {loading ? 'Menyimpan kata sandi…' : 'Simpan kata sandi dan lanjut'}
          </button>
        </form>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
        <button
          type="button"
          onClick={handleLogout}
          className="kc-btn"
          style={{ color: 'var(--txt-bad)', fontSize: 13 }}
        >
          <i className="fa-solid fa-arrow-right-from-bracket" aria-hidden="true"></i>
          Keluar dari akun
        </button>
      </div>
    </div>
  );
}
