'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Mentor } from '@/types/database';
import { useToast } from '@/components/feedback/FeedbackProvider';
import { useDivisions } from '@/lib/divisions';


/** Form lengkapi profil peserta. Dipakai di modal setelah daftar dan di halaman /onboarding. */
export function ProfileSetupForm({ onDone }: { onDone: () => void }) {
  const supabase = createClient();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const { divisions } = useDivisions();
  const [divisionPick, setDivision] = useState('');
  const division = divisionPick || divisions[0] || '';
  const [position, setPosition] = useState('');
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [mentorId, setMentorId] = useState('');
  const [loadingMentors, setLoadingMentors] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Mentor diambil dari data yang didaftarkan admin. Nama ganda dibuang agar dropdown bersih.
  useEffect(() => {
    async function loadMentors() {
      const { data, error } = await supabase
        .from('mentors')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (!error && data) setMentors(data as Mentor[]);
      setLoadingMentors(false);
    }
    loadMentors();
  }, [supabase]);

  const uniqueMentors = useMemo(() => {
    const seen = new Map<string, Mentor>();
    mentors.forEach((m) => {
      const key = m.name.trim().toLowerCase();
      if (!seen.has(key)) seen.set(key, m);
    });
    return [...seen.values()];
  }, [mentors]);

  const chosen = uniqueMentors.find((m) => m.id === mentorId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!chosen) {
      setErrorMsg('Pilih mentor pembimbing dari daftar.');
      return;
    }

    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setErrorMsg('Sesi berakhir. Silakan masuk kembali.');
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email || '',
      name: name.trim(),
      role: 'participant',
      division,
      position: position.trim() || 'Peserta Magang KINRA',
      mentor_id: chosen.id,
      mentor_name: chosen.name,
      institution: 'PT Kawasan Industri Nusantara (KINRA Sei Mangkei)',
      updated_at: new Date().toISOString(),
    });

    if (error) {
      setErrorMsg(error.message || 'Gagal menyimpan profil.');
      setLoading(false);
      return;
    }

    toast.success(`Profil tersimpan. Mentor Anda: ${chosen.name}.`, 'Selamat datang');
    onDone();
  };

  return (
    <form onSubmit={handleSubmit} className="kc-form" noValidate={false}>
      {errorMsg && (
        <div className="auth-alert auth-alert-error" role="alert">
          <i className="fa-solid fa-circle-xmark" aria-hidden="true"></i>
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="kc-field">
        <label htmlFor="ps-name">Nama lengkap <span className="kc-req">*</span></label>
        <input id="ps-name" type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Muhammad Randy Karna" autoComplete="name" />
      </div>

      <div className="kc-field">
        <label htmlFor="ps-div">Divisi penempatan <span className="kc-req">*</span></label>
        <select id="ps-div" value={division} onChange={(e) => setDivision(e.target.value)}>
          {divisions.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      <div className="kc-field">
        <label htmlFor="ps-pos">Bagian / posisi penugasan</label>
        <input id="ps-pos" type="text" value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Contoh: Junior Full stack developer" />
      </div>

      <div className="kc-field">
        <label htmlFor="ps-mentor">
          Mentor pembimbing <span className="kc-req">*</span>
        </label>
        <select
          id="ps-mentor"
          required
          value={mentorId}
          onChange={(e) => setMentorId(e.target.value)}
          disabled={loadingMentors || uniqueMentors.length === 0}
        >
          <option value="" disabled>
            {loadingMentors ? 'Memuat daftar mentor…' : uniqueMentors.length === 0 ? 'Belum ada mentor terdaftar' : 'Pilih mentor Anda'}
          </option>
          {uniqueMentors.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        {chosen && (
          <p className="kc-help">
            <i className="fa-solid fa-user-tie" aria-hidden="true"></i> {chosen.position} · {chosen.division}
          </p>
        )}
        {!loadingMentors && uniqueMentors.length === 0 && (
          <p className="kc-field-error">
            <i className="fa-solid fa-circle-exclamation" aria-hidden="true"></i> Admin belum mendaftarkan mentor. Hubungi admin KINRA.
          </p>
        )}
      </div>

      <button type="submit" className="btn-masuk" disabled={loading || !chosen}>
        {loading ? 'Menyimpan…' : 'Simpan dan mulai catat logbook'}
      </button>
    </form>
  );
}
