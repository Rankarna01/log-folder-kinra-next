'use client';

import { useEffect, useState } from 'react';
import { AuthField } from '@/components/AuthShell';
import { useDivisions } from '@/lib/divisions';
import { MIN_PASSWORD_LENGTH } from '@/lib/auth/password';

type Mentor = { id: string; name: string; division: string };

type Props = {
  /** Dipanggil setelah pendaftaran berhasil, untuk langsung masuk. */
  onRegistered: (args: { identifier: string; email: string; password: string }) => void;
};

/** Form daftar anak magang: data diri, mentor pembimbing, dan kata sandi sendiri. */
export function RegisterForm({ onRegistered }: Props) {
  const { divisions } = useDivisions();
  const [mentors, setMentors] = useState<Mentor[]>([]);

  const [name, setName] = useState('');
  const [nik, setNik] = useState('');
  const [email, setEmail] = useState('');
  const [division, setDivision] = useState('');
  const [position, setPosition] = useState('');
  const [mentorId, setMentorId] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/auth/mentors')
      .then((r) => r.json())
      .then((json: { mentors?: Mentor[] }) => {
        if (active) setMentors(json.mentors ?? []);
      })
      .catch(() => {
        if (active) setErrorMsg('Daftar mentor belum bisa dimuat. Muat ulang halaman.');
      });
    return () => {
      active = false;
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
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
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, nik, email, division, position, phone, mentorId, password }),
    });
    const json = (await res.json().catch(() => ({}))) as { ok?: boolean; email?: string; nik?: string; error?: string };
    if (!res.ok || !json.ok || !json.email || !json.nik) {
      setErrorMsg(json.error || 'Pendaftaran gagal. Coba lagi.');
      setLoading(false);
      return;
    }
    onRegistered({ identifier: json.nik, email: json.email, password });
  };

  const selectClass = 'auth-select';

  return (
    <form onSubmit={submit} className="auth-form">
      {errorMsg && (
        <div className="auth-alert auth-alert-error" role="alert">
          <i className="fa-solid fa-circle-xmark" aria-hidden="true"></i>
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="auth-grid-2">
        <div className="auth-col">
          <AuthField id="reg-name" label="Nama lengkap" value={name} onChange={setName} placeholder="Nama sesuai data diri" icon="fa-user" autoComplete="name" />
        </div>
        <div className="auth-col">
          <AuthField id="reg-nik" label="NIK" value={nik} onChange={(v) => setNik(v.replace(/\D/g, ''))} placeholder="NIK (angka)" icon="fa-id-card" autoComplete="off" />
        </div>

        <div className="auth-col">
          <AuthField id="reg-email" label="Email kontak (opsional)" type="email" value={email} onChange={setEmail} placeholder="nama@email.com" icon="fa-envelope" autoComplete="email" />
        </div>
        <div className="auth-col">
          <AuthField id="reg-phone" label="Telepon (opsional)" type="text" value={phone} onChange={setPhone} placeholder="08xxxxxxxxxx" icon="fa-phone" autoComplete="tel" />
        </div>

        <div className="auth-col">
          <div className="auth-field">
            <label htmlFor="reg-div">Divisi penempatan</label>
            <div className="input-wrap">
              <i className="fa-solid fa-building" aria-hidden="true"></i>
              <select id="reg-div" className={selectClass} value={division} onChange={(e) => setDivision(e.target.value)} required>
                <option value="">Pilih divisi</option>
                {divisions.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="auth-col">
          <AuthField id="reg-pos" label="Posisi / jabatan" value={position} onChange={setPosition} placeholder="Contoh: Staf Magang" icon="fa-briefcase" />
        </div>

        <div className="auth-col auth-col-full">
          <div className="auth-field">
            <label htmlFor="reg-mentor">Mentor pembimbing</label>
            <div className="input-wrap">
              <i className="fa-solid fa-user-tie" aria-hidden="true"></i>
              <select id="reg-mentor" className={selectClass} value={mentorId} onChange={(e) => setMentorId(e.target.value)} required>
                <option value="">Pilih mentor</option>
                {mentors.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="auth-col">
          <AuthField id="reg-pass" label="Kata sandi" type="password" value={password} onChange={setPassword} placeholder={`Minimal ${MIN_PASSWORD_LENGTH} karakter`} icon="fa-lock" autoComplete="new-password" />
        </div>
        <div className="auth-col">
          <AuthField id="reg-pass2" label="Ulangi kata sandi" type="password" value={confirm} onChange={setConfirm} placeholder="Ketik ulang kata sandi" icon="fa-shield-halved" autoComplete="new-password" />
        </div>
      </div>

      <button type="submit" disabled={loading || !divisions.length || !mentors.length} className="btn-masuk" style={{ width: '100%', marginTop: 6 }}>
        {loading ? 'Mendaftarkan…' : 'Daftar dan masuk'}
      </button>
    </form>
  );
}
