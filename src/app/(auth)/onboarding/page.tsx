'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState('');
  const [division, setDivision] = useState('Divisi Teknologi Informasi');
  const [position, setPosition] = useState('');
  const [mentorName, setMentorName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email || '',
      name,
      division,
      position: position || 'Junior Full stack developer',
      mentor_name: mentorName || 'RIZKY DELIANNGI',
      updated_at: new Date().toISOString(),
    });

    if (error) {
      setErrorMsg(error.message || 'Gagal menyimpan profil.');
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  };

  return (
    <div className="flex-1 px-5 pt-8 pb-10 flex flex-col justify-between">
      <div className="space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 px-1">
          <span className="text-[#0B6E6C] font-bold">Langkah 2 dari 2</span>
          <span>Data Diri & Penempatan</span>
        </div>

        <div className="bg-white rounded-[28px] p-6 shadow-sm space-y-4">
          <div className="border-b border-zinc-100 pb-3">
            <h1 className="text-base font-bold text-[#111827]">Lengkapi Profil Peserta</h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Data ini akan dicantumkan pada Laporan Logbook Harian resmi KINRA
            </p>
          </div>

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-3.5 py-2.5 rounded-xl font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#111827]">Nama Lengkap</label>
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
              <label className="block text-xs font-semibold text-[#111827]">Divisi Penempatan</label>
              <select
                value={division}
                onChange={(e) => setDivision(e.target.value)}
                className="mt-1 w-full rounded-[14px] bg-[#F4F7F6] border-0 px-3.5 py-2.5 text-xs text-[#111827] focus:ring-2 focus:ring-[#0B6E6C]"
              >
                <option value="Divisi Teknologi Informasi">Divisi Teknologi Informasi</option>
                <option value="Divisi Operasional & Lapangan">Divisi Operasional & Lapangan</option>
                <option value="Divisi Keuangan & Akuntansi">Divisi Keuangan & Akuntansi</option>
                <option value="Divisi Umum & SDM">Divisi Umum & SDM</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#111827]">Bagian / Posisi</label>
              <input
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="Contoh: Junior Full stack developer"
                className="mt-1 w-full rounded-[14px] bg-[#F4F7F6] border-0 px-3.5 py-2.5 text-xs text-[#111827] focus:ring-2 focus:ring-[#0B6E6C]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#111827]">Nama Mentor Pembimbing</label>
              <input
                type="text"
                value={mentorName}
                onChange={(e) => setMentorName(e.target.value)}
                placeholder="Contoh: RIZKY DELIANNGI"
                className="mt-1 w-full rounded-[14px] bg-[#F4F7F6] border-0 px-3.5 py-2.5 text-xs text-[#111827] focus:ring-2 focus:ring-[#0B6E6C]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0B6E6C] hover:bg-[#085856] text-white text-xs font-bold py-3.5 rounded-full shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer pt-2"
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
