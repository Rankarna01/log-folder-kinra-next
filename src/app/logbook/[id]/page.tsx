'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Logbook } from '@/types/database';
import { AttachmentGallery } from '@/components/attachments/AttachmentGallery';

const STATUS_CHIP = {
  approved: { label: 'Disetujui', icon: 'fa-circle-check', cls: 'bg-white text-[#0B6E6C]' },
  submitted: { label: 'Menunggu review', icon: 'fa-hourglass-half', cls: 'bg-[#FDE9B4] text-[#78350F]' },
  rejected: { label: 'Perlu revisi', icon: 'fa-rotate-left', cls: 'bg-[#FCE1D4] text-[#9A3412]' },
  draft: { label: 'Draf', icon: 'fa-pen', cls: 'bg-white/80 text-[#111827]' },
} as const;

export default function LogbookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const supabase = createClient();

  const [logbook, setLogbook] = useState<Logbook | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLog() {
      const { data } = await supabase
        .from('logbooks')
        .select('*, attachments(*)')
        .eq('id', resolvedParams.id)
        .single();

      if (data) setLogbook(data as Logbook);
      setLoading(false);
    }

    loadLog();
  }, [resolvedParams.id, supabase]);

  if (loading) {
    return <div className="p-8 text-xs text-zinc-500 text-center">Memuat rincian logbook...</div>;
  }

  if (!logbook) {
    return <div className="p-8 text-xs text-zinc-500 text-center">Logbook tidak ditemukan.</div>;
  }

  const isLink = logbook.output && /^(https?:\/\/|www\.)/i.test(logbook.output.trim());
  const linkHref = isLink
    ? logbook.output!.trim().startsWith('http')
      ? logbook.output!.trim()
      : `https://${logbook.output!.trim()}`
    : null;

  const status = STATUS_CHIP[logbook.status] ?? STATUS_CHIP.submitted;
  const bukti = logbook.attachments ?? [];

  return (
    <div className="flex-1 px-5 pt-4 pb-8 space-y-4">
      <header className="flex items-center justify-between">
        <Link
          href="/logbook"
          className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#18181B] shadow-2xs hover:scale-105 transition"
          aria-label="Kembali"
        >
          <i className="fa-solid fa-chevron-left text-sm"></i>
        </Link>
        <h1 className="text-[17px] font-semibold text-[#111827]">Rincian Logbook</h1>
        {logbook.status !== 'approved' ? (
          <Link
            href={`/logbook?date=${logbook.date}&open=1`}
            className="bg-[#0B6E6C] text-white text-xs font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-2xs"
          >
            <i className="fa-solid fa-pen-to-square text-[10px]"></i>
            <span>Edit</span>
          </Link>
        ) : (
          <span className="text-[11px] font-bold text-[#0B6E6C] flex items-center gap-1">
            <i className="fa-solid fa-lock" aria-hidden="true"></i> Terkunci
          </span>
        )}
      </header>

      <section className="bg-kinra-grid rounded-[28px] p-5 text-white shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full ${status.cls}`}>
            <i className={`fa-solid ${status.icon}`}></i>
            <span>{status.label}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
            <i className={logbook.work_location === 'lapangan' ? 'fa-solid fa-person-digging' : 'fa-solid fa-building'}></i>
            <span>{logbook.work_location === 'lapangan' ? 'Lapangan' : 'Kantor'}</span>
          </span>
        </div>

        <h2 className="text-[19px] font-bold text-white leading-snug">{logbook.title}</h2>
      </section>

      {logbook.status === 'rejected' && logbook.review_notes && (
        <div className="auth-alert auth-alert-error" role="alert">
          <i className="fa-solid fa-rotate-left" aria-hidden="true"></i>
          <span>
            <strong>Catatan mentor:</strong> {logbook.review_notes}
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-[24px] p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-zinc-400">Tanggal kegiatan</span>
          <p className="text-sm font-bold text-[#111827] mt-1.5 tnum">{logbook.date}</p>
        </div>
        <div className="bg-white rounded-[24px] p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-zinc-400">Jam kegiatan</span>
          <p className="text-sm font-bold text-[#111827] mt-1.5 tnum">
            {logbook.start_time.slice(0, 5)} – {logbook.end_time.slice(0, 5)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[26px] p-5 space-y-3.5 shadow-2xs">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Deskripsi pekerjaan</p>
          <p className="text-xs text-[#111827] leading-relaxed mt-1.5 whitespace-pre-line">{logbook.final_description}</p>
        </div>

        {logbook.output && (
          <div className="pt-3 border-t border-zinc-100">
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Hasil / output</p>
            {linkHref ? (
              <a href={linkHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B6E6C] hover:underline bg-[#C8EBE5] px-3.5 py-1.5 rounded-full mt-1.5">
                <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                <span className="truncate max-w-[280px]">Buka link: {logbook.output}</span>
              </a>
            ) : (
              <p className="text-xs font-semibold text-[#0B6E6C] mt-1">{logbook.output}</p>
            )}
          </div>
        )}

        {logbook.obstacles && (
          <div className="pt-3 border-t border-zinc-100">
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Kendala</p>
            <p className="text-xs text-zinc-700 mt-1">{logbook.obstacles}</p>
          </div>
        )}
      </div>

      <section id="bukti" className="bg-white rounded-[26px] p-5 space-y-3.5 shadow-2xs scroll-mt-6" aria-labelledby="bukti-title">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 id="bukti-title" className="text-sm font-semibold text-[#111827]">Bukti dokumentasi</h2>
            <p className="text-[11px] text-zinc-500">{bukti.length} lampiran · ketuk untuk memperbesar</p>
          </div>
          {logbook.status !== 'approved' && (
            <Link href={`/logbook?date=${logbook.date}&open=1`} className="text-xs font-bold text-[#0B6E6C] hover:underline">
              Kelola bukti
            </Link>
          )}
        </div>
        <AttachmentGallery items={bukti} emptyText="Belum ada bukti dokumentasi untuk logbook ini." />
      </section>
    </div>
  );
}
