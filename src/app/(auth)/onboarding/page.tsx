'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Mentor } from '@/types/database';

const DEFAULT_MENTORS: Mentor[] = [
  {
    id: 'm-1',
    name: 'RIZKY DELIANNGI',
    division: 'Divisi Teknologi Informasi',
    position: 'Kepala Unit TI & Sistem Digital',
    email: 'rizky.delianngi@kinra.co.id',
    phone: '08126001234',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'm-2',
    name: 'Ir. HENDRA SAPUTRA',
    division: 'Divisi Operasional & Kawasan',
    position: 'Manajer Operasional Kawasan KEK',
    email: 'hendra.s@kinra.co.id',
    phone: '08126005678',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'm-3',
    name: 'SITI RAHMAWATI, S.E., M.Ak',
    division: 'Divisi Keuangan & Akuntansi',
    position: 'Supervisor Keuangan & Pajak',
    email: 'siti.rahmawati@kinra.co.id',
    phone: '08137009876',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'm-4',
    name: 'DEDI IRAWAN, S.H.',
    division: 'Divisi Umum, SDM & Hukum',
    position: 'Staf Senior SDM & Legal',
    email: 'dedi.irawan@kinra.co.id',
    phone: '08216503412',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'm-5',
    name: 'Ir. AGUS WIJAYA',
    division: 'Divisi Teknik & Pemeliharaan',
    position: 'Kepala Divisi Pemeliharaan Aset',
    email: 'agus.wijaya@kinra.co.id',
    phone: '08116307890',
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState('');
  const [nimNik, setNimNik] = useState('');
  const [division, setDivision] = useState('Divisi Teknologi Informasi');
  const [position, setPosition] = useState('Junior Full stack developer');
  const [mentors, setMentors] = useState<Mentor[]>(DEFAULT_MENTORS);
  const [selectedMentorId, setSelectedMentorId] = useState<string>('m-1');
  const [customMentorName, setCustomMentorName] = useState('');
  const [isCustomMentor, setIsCustomMentor] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch mentors from Supabase if table exists
  useEffect(() => {
    async function loadMentors() {
      const { data, error } = await supabase
        .from('mentors')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (!error && data && data.length > 0) {
        setMentors(data);
        setSelectedMentorId(data[0].id);
      }
    }
    loadMentors();
  }, [supabase]);

  // When division changes, try to recommend matching mentor
  const handleDivisionChange = (newDivision: string) => {
    setDivision(newDivision);
    const matched = mentors.find((m) => m.division === newDivision);
    if (matched) {
      setSelectedMentorId(matched.id);
      setIsCustomMentor(false);
    }
  };

  const handleMentorSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'custom') {
      setIsCustomMentor(true);
      setSelectedMentorId('');
    } else {
      setIsCustomMentor(false);
      setSelectedMentorId(val);
      const chosen = mentors.find((m) => m.id === val);
      if (chosen && chosen.division) {
        setDivision(chosen.division);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    let finalMentorName = '';
    let mentorUuid: string | null = null;

    if (isCustomMentor) {
      if (!customMentorName.trim()) {
        setErrorMsg('Silakan masukkan nama mentor pembimbing Anda.');
        setLoading(false);
        return;
      }
      finalMentorName = customMentorName.trim();
    } else {
      const chosen = mentors.find((m) => m.id === selectedMentorId);
      finalMentorName = chosen?.name || 'RIZKY DELIANNGI';
      // Only set mentor_id if it's a valid DB UUID, not a fallback mock id
      if (chosen && !chosen.id.startsWith('m-')) {
        mentorUuid = chosen.id;
      }
    }

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email || '',
      name: name.trim(),
      role: 'participant',
      division,
      position: position.trim() || 'Junior Full stack developer',
      mentor_id: mentorUuid,
      mentor_name: finalMentorName,
      nim_nik: nimNik.trim() || null,
      institution: 'PT Kawasan Industri Nusantara (KINRA Sei Mangkei)',
      updated_at: new Date().toISOString(),
    });

    if (error) {
      setErrorMsg(error.message || 'Gagal menyimpan profil peserta magang.');
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  };

  return (
    <div className="flex-1 px-5 pt-8 pb-10 flex flex-col justify-between max-w-lg mx-auto w-full">
      <div className="space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 px-1">
          <span className="text-[#0B6E6C] font-bold">Langkah 2 dari 2</span>
          <span>Data Diri & Mentor Pembimbing</span>
        </div>

        <div className="bg-white rounded-[28px] p-6 shadow-sm space-y-4">
          <div className="border-b border-zinc-100 pb-3">
            <h1 className="text-base font-bold text-[#111827]">Lengkapi Profil Peserta Magang</h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Pilih mentor pembimbing dan divisi tempat Anda bertugas di KINRA Sei Mangkei
            </p>
          </div>

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-3.5 py-2.5 rounded-xl font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#111827]">
                Nama Lengkap Peserta Magang <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Muhammad Randy Karna"
                className="mt-1 w-full rounded-[14px] bg-[#F4F7F6] border-0 px-3.5 py-2.5 text-xs text-[#111827] focus:ring-2 focus:ring-[#0B6E6C]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#111827]">NIM / NIK / No. Induk</label>
              <input
                type="text"
                value={nimNik}
                onChange={(e) => setNimNik(e.target.value)}
                placeholder="Contoh: 210103045 / KINRA-INT-2026"
                className="mt-1 w-full rounded-[14px] bg-[#F4F7F6] border-0 px-3.5 py-2.5 text-xs text-[#111827] focus:ring-2 focus:ring-[#0B6E6C]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#111827]">
                Divisi Penempatan <span className="text-rose-500">*</span>
              </label>
              <select
                value={division}
                onChange={(e) => handleDivisionChange(e.target.value)}
                className="mt-1 w-full rounded-[14px] bg-[#F4F7F6] border-0 px-3.5 py-2.5 text-xs text-[#111827] focus:ring-2 focus:ring-[#0B6E6C]"
              >
                <option value="Divisi Teknologi Informasi">Divisi Teknologi Informasi</option>
                <option value="Divisi Operasional & Kawasan">Divisi Operasional & Kawasan</option>
                <option value="Divisi Keuangan & Akuntansi">Divisi Keuangan & Akuntansi</option>
                <option value="Divisi Umum, SDM & Hukum">Divisi Umum, SDM & Hukum</option>
                <option value="Divisi Teknik & Pemeliharaan">Divisi Teknik & Pemeliharaan</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#111827]">
                Bagian / Posisi Penugasan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="Contoh: Junior Full stack developer"
                className="mt-1 w-full rounded-[14px] bg-[#F4F7F6] border-0 px-3.5 py-2.5 text-xs text-[#111827] focus:ring-2 focus:ring-[#0B6E6C]"
              />
            </div>

            {/* Mentor Selection (Required) */}
            <div className="pt-1">
              <label className="block text-xs font-semibold text-[#111827] flex items-center justify-between">
                <span>
                  Mentor Pembimbing Lapangan <span className="text-rose-500">*</span>
                </span>
                <span className="text-[10px] text-[#0B6E6C] font-normal">Wajib dipilih</span>
              </label>
              <select
                value={isCustomMentor ? 'custom' : selectedMentorId}
                onChange={handleMentorSelect}
                className="mt-1 w-full rounded-[14px] bg-[#F4F7F6] border-0 px-3.5 py-2.5 text-xs text-[#111827] focus:ring-2 focus:ring-[#0B6E6C]"
              >
                {mentors.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} — {m.division} ({m.position})
                  </option>
                ))}
                <option value="custom">+ Ketik Nama Mentor Lainnya...</option>
              </select>

              {isCustomMentor && (
                <div className="mt-2">
                  <input
                    type="text"
                    required
                    value={customMentorName}
                    onChange={(e) => setCustomMentorName(e.target.value)}
                    placeholder="Ketik Nama Lengkap Mentor & Gelar"
                    className="w-full rounded-[14px] bg-[#EAF2F0] border border-[#0B6E6C]/30 px-3.5 py-2 text-xs text-[#111827] focus:ring-2 focus:ring-[#0B6E6C]"
                  />
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Nama ini akan dicantumkan sebagai penandatangan lembar verifikasi logbook.
                  </p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0B6E6C] hover:bg-[#085856] text-white text-xs font-bold py-3.5 rounded-full shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-4"
            >
              <span>{loading ? 'Menyimpan Profil...' : 'Mulai Catat Logbook'}</span>
              <i className="fa-solid fa-circle-check text-[11px]"></i>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
