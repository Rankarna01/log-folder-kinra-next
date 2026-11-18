'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Logbook } from '@/types/database';

export default function CreateLogbookPage() {
  const router = useRouter();
  const supabase = createClient();

  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('08:30');
  const [endTime, setEndTime] = useState('12:00');
  const [title, setTitle] = useState('');
  const [workLocation, setWorkLocation] = useState<'kantor' | 'lapangan'>('kantor');
  const [description, setDescription] = useState('');
  const [output, setOutput] = useState('');
  const [obstacles, setObstacles] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const [existingTodayLog, setExistingTodayLog] = useState<Logbook | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Check 1 Day = 1 Logbook
  useEffect(() => {
    async function checkExisting() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const { data } = await supabase
        .from('logbooks')
        .select('*, attachments(*)')
        .eq('user_id', user.id)
        .eq('date', date)
        .maybeSingle();

      if (data) {
        setExistingTodayLog(data as Logbook);
      } else {
        setExistingTodayLog(null);
      }
      setInitialLoading(false);
    }

    checkExisting();
  }, [date, router, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    // 1. Insert Logbook
    const { data: newLog, error: logError } = await supabase
      .from('logbooks')
      .insert({
        user_id: user.id,
        date,
        start_time: startTime + ':00',
        end_time: endTime + ':00',
        title,
        work_location: workLocation,
        raw_description: description,
        final_description: description,
        output: output || null,
        obstacles: obstacles || null,
        status: 'approved',
      })
      .select()
      .single();

    if (logError) {
      alert('Gagal menyimpan: ' + logError.message);
      setLoading(false);
      return;
    }

    // 2. Upload Photo if selected
    if (photoFile && newLog) {
      const fileExt = photoFile.name.split('.').pop();
      const filePath = `${user.id}/${date}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('logbook-photos')
        .upload(filePath, photoFile);

      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage
          .from('logbook-photos')
          .getPublicUrl(filePath);

        await supabase.from('attachments').insert({
          logbook_id: newLog.id,
          file_url: publicUrlData.publicUrl,
          file_path: filePath,
          caption: title,
        });
      }
    }

    router.push('/dashboard');
    router.refresh();
  };

  if (initialLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-xs text-zinc-500">
        Memuat data...
      </div>
    );
  }

  return (
    <div className="flex-1 px-5 pt-4 pb-8 space-y-4">
      {/* Header */}
      <header className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#18181B] shadow-2xs hover:scale-105 transition"
        >
          <i className="fa-solid fa-chevron-left text-sm"></i>
        </Link>
        <h1 className="text-[17px] font-semibold text-[#111827]">
          {existingTodayLog ? 'Logbook Hari Ini' : 'Tambah Logbook Harian'}
        </h1>
        <div className="w-10"></div>
      </header>

      {existingTodayLog ? (
        /* Bento Grid View when Today's Logbook Already Exists */
        <div className="space-y-4">
          <section className="bg-kinra-grid rounded-[28px] p-5 text-white shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 bg-white text-[#0B6E6C] text-[11px] font-bold px-3 py-1 rounded-full">
                <i className="fa-solid fa-circle-check"></i>
                <span>Sudah Tercatat Hari Ini</span>
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
                <i
                  className={
                    existingTodayLog.work_location === 'lapangan'
                      ? 'fa-solid fa-person-digging'
                      : 'fa-solid fa-building'
                  }
                ></i>
                <span>{existingTodayLog.work_location === 'lapangan' ? 'Lapangan' : 'Kantor'}</span>
              </span>
            </div>

            <h2 className="text-[18px] font-bold text-white leading-snug pt-1">
              {existingTodayLog.title}
            </h2>
            <p className="text-xs text-emerald-100">
              Pencatatan dibatasi 1 logbook per hari. Kamu tetap dapat mengubah isi catatan hari ini melalui tombol Edit di bawah.
            </p>
          </section>

          {/* Bento Grid Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-[24px] p-4 shadow-2xs flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-zinc-400">Tanggal Kegiatan</span>
              <p className="text-sm font-bold text-[#111827] mt-2">{existingTodayLog.date}</p>
            </div>

            <div className="bg-white rounded-[24px] p-4 shadow-2xs flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-zinc-400">Jam Kegiatan</span>
              <p className="text-sm font-bold text-[#111827] mt-2">
                {existingTodayLog.start_time.slice(0, 5)} - {existingTodayLog.end_time.slice(0, 5)}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-[26px] p-5 space-y-3 shadow-2xs">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Uraian Kegiatan
              </p>
              <p className="text-xs text-[#111827] leading-relaxed mt-1">
                {existingTodayLog.final_description}
              </p>
            </div>

            {existingTodayLog.output && (
              <div className="pt-2.5 border-t border-zinc-100">
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  Hasil / Output
                </p>
                <p className="text-xs font-semibold text-[#0B6E6C] mt-1">{existingTodayLog.output}</p>
              </div>
            )}
          </div>

          <Link
            href={`/logbook/${existingTodayLog.id}/edit`}
            className="w-full bg-[#0B6E6C] hover:bg-[#085856] text-white text-xs font-bold py-3.5 rounded-full shadow-md flex items-center justify-center gap-2 transition"
          >
            <i className="fa-solid fa-pen-to-square"></i>
            <span>Edit Logbook Hari Ini</span>
          </Link>
        </div>
      ) : (
        /* Create Form */
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Bento 2-Column Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-[24px] p-4 shadow-2xs">
              <label htmlFor="input-date" className="block text-[11px] font-semibold text-zinc-400">
                Tanggal Kegiatan
              </label>
              <div className="mt-1 relative flex items-center justify-between">
                <input
                  type="date"
                  id="input-date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full border-0 p-0 text-sm font-bold text-[#111827] focus:ring-0 bg-transparent cursor-pointer tracking-tight"
                />
                <i className="fa-regular fa-calendar text-zinc-400 text-xs shrink-0 pointer-events-none"></i>
              </div>
            </div>

            <div className="bg-white rounded-[24px] p-4 shadow-2xs">
              <label className="block text-[11px] font-semibold text-zinc-400">Jam Mulai & Selesai</label>
              <div className="mt-1 flex items-center justify-between gap-1 text-[#111827]">
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full border-0 p-0 text-sm font-bold text-[#111827] focus:ring-0 bg-transparent cursor-pointer"
                />
                <span className="text-zinc-300 font-bold px-0.5 text-xs">–</span>
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full border-0 p-0 text-sm font-bold text-[#111827] focus:ring-0 bg-transparent cursor-pointer"
                />
                <i className="fa-regular fa-clock text-zinc-400 text-xs shrink-0 pointer-events-none ml-1"></i>
              </div>
            </div>
          </div>

          {/* Title & Lokasi Kegiatan */}
          <div className="bg-white rounded-[26px] p-4 space-y-3 shadow-2xs">
            <div>
              <label className="block text-xs font-semibold text-[#111827]">Judul Kegiatan Harian</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Pengerjaan Sistem HR & Rekap Data Harian"
                className="mt-1.5 w-full rounded-[14px] bg-[#F4F7F6] border-0 px-3.5 py-2.5 text-sm text-[#111827] focus:ring-2 focus:ring-[#0B6E6C]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#111827]">Lokasi Kegiatan</label>
              <select
                value={workLocation}
                onChange={(e) => setWorkLocation(e.target.value as 'kantor' | 'lapangan')}
                className="mt-1.5 w-full rounded-[14px] bg-[#F4F7F6] border-0 px-3.5 py-2.5 text-xs font-semibold text-[#111827] focus:ring-2 focus:ring-[#0B6E6C]"
              >
                <option value="kantor">Kantor</option>
                <option value="lapangan">Lapangan</option>
              </select>
            </div>
          </div>

          {/* Description Section with Slider Pills */}
          <section className="bg-kinra-grid rounded-[28px] p-5 space-y-3 shadow-xs text-white">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <i className="fa-solid fa-pen-clip"></i>
                <span>Deskripsi Kegiatan Harian</span>
              </span>
            </div>

            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tuliskan rincian kegiatan harian yang kamu kerjakan hari ini..."
              className="w-full rounded-[18px] bg-white border-0 p-3.5 text-xs text-[#111827] leading-relaxed focus:ring-2 focus:ring-[#FDE9B4]"
            />

            {/* Slider Action Pills */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 pt-0.5 -mx-1 px-1">
              <button
                type="button"
                onClick={() => alert('Fitur Rapikan AI akan segera hadir.')}
                className="shrink-0 h-9 bg-[#18181B] hover:bg-[#27272A] text-white text-xs font-semibold px-4 rounded-full flex items-center gap-2 shadow-xs transition cursor-pointer"
              >
                <i className="fa-solid fa-wand-magic-sparkles text-[#FDE9B4] text-xs"></i>
                <span className="whitespace-nowrap">Rapikan AI</span>
                <span className="bg-[#C8EBE5] text-[#074745] text-[9px] font-bold px-2 py-0.5 rounded-full">
                  Segera
                </span>
              </button>

              <button
                type="button"
                onClick={() => alert('Fitur Rekam Suara (Voice-to-Log) akan segera hadir.')}
                className="shrink-0 h-9 bg-white hover:bg-[#F4F7F6] text-[#074745] text-xs font-semibold px-4 rounded-full flex items-center gap-2 shadow-xs transition cursor-pointer"
              >
                <i className="fa-solid fa-microphone-lines text-[#0B6E6C] text-xs"></i>
                <span className="whitespace-nowrap">Rekam Suara</span>
                <span className="bg-[#FDE9B4] text-[#78350F] text-[9px] font-bold px-2 py-0.5 rounded-full">
                  Lanjutan
                </span>
              </button>

              <button
                type="button"
                onClick={() => alert('Fitur Ambil Foto Langsung akan segera hadir.')}
                className="shrink-0 h-9 bg-[#D4EEFC] hover:bg-[#BCE3FA] text-[#0C4A6E] text-xs font-semibold px-4 rounded-full flex items-center gap-2 shadow-xs transition cursor-pointer"
              >
                <i className="fa-solid fa-camera text-[#0C4A6E] text-xs"></i>
                <span className="whitespace-nowrap">Ambil Foto</span>
                <span className="bg-white/80 text-[#0C4A6E] text-[9px] font-bold px-2 py-0.5 rounded-full">
                  Fitur
                </span>
              </button>
            </div>
          </section>

          {/* Output, Obstacles & Photo Upload */}
          <div className="bg-white rounded-[26px] p-4 space-y-3 shadow-2xs">
            <div>
              <label className="block text-xs font-semibold text-[#111827]">
                Hasil / Output Kerja (Teks atau Link Dokumen / Drive)
              </label>
              <input
                type="text"
                value={output}
                onChange={(e) => setOutput(e.target.value)}
                placeholder="Contoh: https://docs.google.com/... atau Laporan Akhir Modul HR"
                className="mt-1.5 w-full rounded-[14px] bg-[#F4F7F6] border-0 px-3.5 py-2.5 text-xs text-[#111827]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#111827]">Kendala (Opsional)</label>
              <input
                type="text"
                value={obstacles}
                onChange={(e) => setObstacles(e.target.value)}
                placeholder="Contoh: Penyesuaian format data laporan"
                className="mt-1.5 w-full rounded-[14px] bg-[#F4F7F6] border-0 px-3.5 py-2.5 text-xs text-[#111827]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#111827]">
                Lampiran Bukti Foto (Opsional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                className="mt-1.5 block w-full text-xs text-zinc-500 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#C8EBE5] file:text-[#074745]"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0B6E6C] hover:bg-[#085856] text-white text-sm font-bold py-4 rounded-full shadow-md transition active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            <i className="fa-solid fa-floppy-disk"></i>
            <span>{loading ? 'Menyimpan...' : 'Simpan Logbook Harian'}</span>
          </button>
        </form>
      )}
    </div>
  );
}
