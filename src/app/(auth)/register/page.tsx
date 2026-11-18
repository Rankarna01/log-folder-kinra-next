'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    if (password !== passwordConfirm) {
      setErrorMsg('Konfirmasi password tidak cocok.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password minimal 6 karakter.');
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message || 'Pendaftaran gagal. Silakan coba lagi.');
      setLoading(false);
      return;
    }

    router.push('/onboarding');
    router.refresh();
  };

  return (
    <div className="flex-1 px-5 pt-8 pb-10 flex flex-col justify-between">
      <div className="space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 px-1">
          <span className="text-[#0B6E6C] font-bold">Langkah 1 dari 2</span>
          <span>Akun & Kata Sandi</span>
        </div>

        <div className="bg-white rounded-[28px] p-6 shadow-sm space-y-4">
          <div className="border-b border-zinc-100 pb-3">
            <h1 className="text-base font-bold text-[#111827]">Daftar Akun Baru</h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Masukkan email dan kata sandi yang akan digunakan untuk login
            </p>
          </div>

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-3.5 py-2.5 rounded-xl font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#111827]">Alamat Email</label>
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

            <div>
              <label className="block text-xs font-semibold text-[#111827]">Konfirmasi Kata Sandi</label>
              <input
                type="password"
                required
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="Ulangi kata sandi"
                className="mt-1 w-full rounded-[14px] bg-[#F4F7F6] border-0 px-3.5 py-2.5 text-xs text-[#111827] focus:ring-2 focus:ring-[#0B6E6C]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0B6E6C] hover:bg-[#085856] text-white text-xs font-bold py-3.5 rounded-full shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{loading ? 'Menyiapkan...' : 'Lanjutkan ke Profil Peserta'}</span>
              <i className="fa-solid fa-arrow-right text-[10px]"></i>
            </button>
          </form>
        </div>
      </div>

      <div className="text-center pt-6">
        <p className="text-xs text-zinc-600">
          Sudah punya akun?{' '}
          <Link href="/login" className="font-bold text-[#0B6E6C] hover:underline">
            Masuk Sekarang
          </Link>
        </p>
      </div>
    </div>
  );
}
