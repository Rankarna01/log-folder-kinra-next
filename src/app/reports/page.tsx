'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Logbook, Profile } from '@/types/database';

export default function ReportsPage() {
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [logs, setLogs] = useState<Logbook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (prof) setProfile(prof);

      const { data: logbooks } = await supabase
        .from('logbooks')
        .select('*, attachments(*)')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      if (logbooks) setLogs(logbooks as Logbook[]);
      setLoading(false);
    }

    loadData();
  }, [supabase]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 flex flex-col space-y-4">
      <div className="space-y-4 print:p-0 print:m-0">
        {/* Screen Header (Hidden on Print) */}
        <header className="flex items-center justify-between print:hidden">
          <Link
            href="/dashboard"
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#18181B] shadow-2xs hover:scale-105 transition"
          >
            <i className="fa-solid fa-chevron-left text-sm"></i>
          </Link>
          <h1 className="text-[17px] font-semibold text-[#111827]">Laporan Kegiatan Magang</h1>
          <button
            onClick={handlePrint}
            className="bg-[#0B6E6C] hover:bg-[#085856] text-white text-xs font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <i className="fa-solid fa-print text-[11px]"></i>
            <span>Cetak PDF</span>
          </button>
        </header>

        {/* Printable Official KINRA Document Sheet */}
        <div className="bg-white rounded-[28px] p-6 shadow-sm space-y-4 print:shadow-none print:rounded-none print:p-2 text-xs">
          {/* Letterhead */}
          <div className="border-b-2 border-[#0B6E6C] pb-3 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/kinra.png" alt="KINRA Sei Mangkei" className="h-10 w-auto object-contain" />
            <div>
              <h2 className="font-bold text-[#0B6E6C] uppercase text-sm tracking-wide">
                PT Kawasan Industri Nusantara (KINRA Sei Mangkei)
              </h2>
              <p className="text-[10px] text-zinc-500">KEK Sei Mangkei, Sumatera Utara</p>
              <p className="text-[11px] font-bold text-zinc-800 uppercase mt-0.5">
                Laporan Kegiatan Harian Peserta Magang (Monthly)
              </p>
            </div>
          </div>

          {/* Identity Grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] bg-[#F4F7F6] p-3 rounded-2xl print:bg-transparent">
            <div>
              <span className="text-zinc-500">Nama Peserta:</span>{' '}
              <strong className="text-[#111827]">{profile?.name || 'Peserta Magang'}</strong>
            </div>
            <div>
              <span className="text-zinc-500">Divisi:</span>{' '}
              <strong className="text-[#111827]">{profile?.division || 'Divisi IT'}</strong>
            </div>
            <div>
              <span className="text-zinc-500">Posisi:</span>{' '}
              <strong className="text-[#111827]">{profile?.position || 'Junior Full stack'}</strong>
            </div>
            <div>
              <span className="text-zinc-500">Mentor:</span>{' '}
              <strong className="text-[#111827]">{profile?.mentor_name || 'RIZKY DELIANNGI'}</strong>
            </div>
          </div>

          {/* Table of Entries */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[10px]">
              <thead>
                <tr className="bg-[#0B6E6C] text-white">
                  <th className="p-2 rounded-l-lg">No</th>
                  <th className="p-2">Tanggal & Jam</th>
                  <th className="p-2">Judul Kegiatan</th>
                  <th className="p-2">Deskripsi Kegiatan</th>
                  <th className="p-2">Output / Hasil</th>
                  <th className="p-2 rounded-r-lg">Lokasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-zinc-400">
                      {loading ? 'Memuat rekapan logbook...' : 'Belum ada logbook pada periode ini.'}
                    </td>
                  </tr>
                ) : (
                  logs.map((log, index) => {
                    const isLink = log.output && /^(https?:\/\/|www\.)/i.test(log.output.trim());
                    const linkHref = isLink
                      ? log.output!.trim().startsWith('http')
                        ? log.output!.trim()
                        : `https://${log.output!.trim()}`
                      : null;

                    return (
                      <tr key={log.id} className="hover:bg-zinc-50/50">
                        <td className="p-2 align-top font-bold">{index + 1}</td>
                        <td className="p-2 align-top whitespace-nowrap">
                          <strong>{log.date}</strong>
                          <br />
                          {log.start_time.slice(0, 5)} - {log.end_time.slice(0, 5)}
                        </td>
                        <td className="p-2 align-top font-semibold text-[#111827]">{log.title}</td>
                        <td className="p-2 align-top text-zinc-700 leading-relaxed whitespace-pre-line">
                          {log.final_description}
                        </td>
                        <td className="p-2 align-top">
                          {linkHref ? (
                            <a
                              href={linkHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#0B6E6C] font-bold underline break-all"
                            >
                              🔗 Tautan Berkas
                            </a>
                          ) : (
                            log.output || '-'
                          )}

                          {log.attachments && log.attachments.length > 0 && (
                            <div className="mt-1 space-y-1">
                              {log.attachments.map((att, aIdx) => (
                                <a
                                  key={att.id}
                                  href={att.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-block bg-[#C8EBE5] text-[#074745] font-bold text-[9px] px-2 py-0.5 rounded-full"
                                >
                                  🖼️ Lihat Foto Bukti #{aIdx + 1}
                                </a>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="p-2 align-top font-bold">
                          {log.work_location === 'lapangan' ? 'Lapangan' : 'Kantor'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Signatures */}
          <div className="pt-6 grid grid-cols-2 gap-8 text-center text-[11px]">
            <div>
              <p>Peserta Magang,</p>
              <div className="h-16"></div>
              <p className="font-bold underline">{profile?.name || 'Peserta Magang'}</p>
            </div>
            <div>
              <p>Mengetahui, Mentor Pembimbing</p>
              <div className="h-16"></div>
              <p className="font-bold underline">{profile?.mentor_name || 'RIZKY DELIANNGI'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
