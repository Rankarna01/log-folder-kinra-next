'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types/database';

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState('');
  const [division, setDivision] = useState('');
  const [position, setPosition] = useState('');
  const [mentorName, setMentorName] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (data) {
        setProfile(data as Profile);
        setName(data.name || '');
        setDivision(data.division || 'Divisi Teknologi Informasi');
        setPosition(data.position || 'Junior Full stack developer');
        setMentorName(data.mentor_name || 'RIZKY DELIANNGI');
      }
      setFetching(false);
    }

    loadProfile();
  }, [router, supabase]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        name,
        division,
        position,
        mentor_name: mentorName,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      alert('Gagal update: ' + error.message);
      setLoading(false);
      return;
    }

    alert('Profil berhasil diperbarui!');
    setLoading(false);
    router.refresh();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  if (fetching) {
    return <div className="p-8 text-xs text-zinc-500 text-center">Memuat profil...</div>;
  }

  return (
    <div className="flex-1 flex flex-col space-y-4">
      <div className="space-y-4">
        <header className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#18181B] shadow-2xs hover:scale-105 transition"
          >
            <i className="fa-solid fa-chevron-left text-sm"></i>
          </Link>
          <h1 className="text-[17px] font-semibold text-[#111827]">Profil Peserta Magang</h1>
          <div className="w-10"></div>
        </header>

        {/* Profile Card Header */}
        <section className="bg-kinra-grid rounded-[28px] p-6 text-white shadow-xs text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-white text-[#0B6E6C] mx-auto flex items-center justify-center text-2xl shadow-sm font-bold">
            <i className="fa-solid fa-graduation-cap"></i>
          </div>
          <div>
            <h2 className="text-lg font-bold">{profile?.name || 'Muhammad Randy Karna'}</h2>
            <p className="text-xs text-emerald-100 mt-0.5">{profile?.email}</p>
          </div>
        </section>

        {/* Update Form */}
        <form onSubmit={handleUpdate} className="bg-white rounded-[28px] p-5 shadow-2xs space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-[#111827]">Nama Lengkap</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-[14px] bg-[#F4F7F6] border-0 px-3.5 py-2.5 text-xs text-[#111827] focus:ring-2 focus:ring-[#0B6E6C]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#111827]">Divisi Penempatan</label>
            <input
              type="text"
              required
              value={division}
              onChange={(e) => setDivision(e.target.value)}
              className="mt-1 w-full rounded-[14px] bg-[#F4F7F6] border-0 px-3.5 py-2.5 text-xs text-[#111827] focus:ring-2 focus:ring-[#0B6E6C]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#111827]">Bagian / Posisi</label>
            <input
              type="text"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="mt-1 w-full rounded-[14px] bg-[#F4F7F6] border-0 px-3.5 py-2.5 text-xs text-[#111827] focus:ring-2 focus:ring-[#0B6E6C]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#111827]">Nama Mentor Pembimbing</label>
            <input
              type="text"
              value={mentorName}
              onChange={(e) => setMentorName(e.target.value)}
              className="mt-1 w-full rounded-[14px] bg-[#F4F7F6] border-0 px-3.5 py-2.5 text-xs text-[#111827] focus:ring-2 focus:ring-[#0B6E6C]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0B6E6C] hover:bg-[#085856] text-white text-xs font-bold py-3.5 rounded-full shadow-md transition disabled:opacity-50 cursor-pointer pt-2"
          >
            {loading ? 'Menyimpan...' : 'Simpan Pembaruan Profil'}
          </button>
        </form>

        <button
          onClick={handleLogout}
          className="w-full bg-white border border-zinc-200 text-rose-600 text-xs font-bold py-3 rounded-full shadow-2xs hover:bg-rose-50 transition cursor-pointer flex items-center justify-center gap-1.5"
        >
          <i className="fa-solid fa-arrow-right-from-bracket"></i>
          <span>Keluar dari Akun</span>
        </button>
      </div>
    </div>
  );
}
