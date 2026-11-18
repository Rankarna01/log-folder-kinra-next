'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.toLowerCase().includes('invalid login credentials')) {
        setErrorMsg(
          'Email atau kata sandi salah. Jika baru mendaftar, pastikan Anda telah memverifikasi email konfirmasi dari Supabase di inbox/spam Anda.'
        );
      } else {
        setErrorMsg(error.message || 'Email atau kata sandi salah.');
      }
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  };

  return (
    <div className="flex-1 px-5 pt-8 pb-10 flex flex-col justify-between">
      <div className="space-y-6">
        {/* Brand Card */}
        <div className="bg-kinra-grid rounded-[28px] p-6 text-white shadow-md text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-white mx-auto flex items-center justify-center p-2 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/kinra.png" alt="KINRA Sei Mangkei" className="h-9 w-auto object-contain" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">Timesheet KINRA</h1>
            <p className="text-xs text-emerald-100 font-medium mt-1">
              Pencatatan Logbook Kegiatan Harian Peserta Magang
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-[28px] p-6 shadow-sm space-y-4">
          <div className="border-b border-zinc-100 pb-3">
            <h2 className="text-base font-bold text-[#111827]">Masuk ke Akun</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Gunakan email & kata sandi yang telah kamu daftarkan
            </p>
          </div>

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-3.5 py-2.5 rounded-xl font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#111827]">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="mt-1 w-full rounded-[14px] bg-[#F4F7F6] border-0 px-3.5 py-2.5 text-xs text-[#111827] focus:ring-2 focus:ring-[#0B6E6C]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#111827]">Kata Sandi</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="mt-1 w-full rounded-[14px] bg-[#F4F7F6] border-0 px-3.5 py-2.5 text-xs text-[#111827] focus:ring-2 focus:ring-[#0B6E6C]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0B6E6C] hover:bg-[#085856] text-white text-xs font-bold py-3.5 rounded-full shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              <i className="fa-solid fa-right-to-bracket"></i>
              <span>{loading ? 'Memproses...' : 'Masuk Sekarang'}</span>
            </button>
          </form>
        </div>
      </div>

      <div className="text-center pt-6">
        <p className="text-xs text-zinc-600">
          Belum memiliki akun?{' '}
          <Link href="/register" className="font-bold text-[#0B6E6C] hover:underline">
            Daftar Akun Baru
          </Link>
        </p>
      </div>
    </div>
  );
}
