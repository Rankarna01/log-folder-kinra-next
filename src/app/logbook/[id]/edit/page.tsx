'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Logbook } from '@/types/database';

export default function EditLogbookPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const supabase = createClient();

  const [logbook, setLogbook] = useState<Logbook | null>(null);
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [title, setTitle] = useState('');
  const [workLocation, setWorkLocation] = useState<'kantor' | 'lapangan'>('kantor');
  const [description, setDescription] = useState('');
  const [output, setOutput] = useState('');
  const [obstacles, setObstacles] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    async function loadLog() {
      const { data } = await supabase
        .from('logbooks')
        .select('*, attachments(*)')
        .eq('id', resolvedParams.id)
        .single();

      if (data) {
        setLogbook(data as Logbook);
        setDate(data.date);
        setStartTime(data.start_time.slice(0, 5));
        setEndTime(data.end_time.slice(0, 5));
        setTitle(data.title);
        setWorkLocation(data.work_location);
        setDescription(data.final_description);
        setOutput(data.output || '');
        setObstacles(data.obstacles || '');
      }
      setFetching(false);
    }

    loadLog();
  }, [resolvedParams.id, supabase]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from('logbooks')
      .update({
        date,
        start_time: startTime + ':00',
        end_time: endTime + ':00',
        title,
        work_location: workLocation,
        final_description: description,
        output: output || null,
        obstacles: obstacles || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', resolvedParams.id);

    if (error) {
      alert('Gagal mengupdate: ' + error.message);
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  };

  const handleDelete = async () => {
    if (!confirm('Hapus logbook kegiatan ini?')) return;
    await supabase.from('logbooks').delete().eq('id', resolvedParams.id);
    router.push('/dashboard');
    router.refresh();
  };

  if (fetching) {
    return <div className="p-8 text-xs text-zinc-500 text-center">Memuat logbook...</div>;
  }

  if (!logbook) {
    return <div className="p-8 text-xs text-zinc-500 text-center">Logbook tidak ditemukan.</div>;
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
        <h1 className="text-[17px] font-semibold text-[#111827]">Edit Logbook Harian</h1>
        <button
          type="button"
          onClick={handleDelete}
          className="bg-[#FCE1D4] text-[#9A3412] text-xs font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 cursor-pointer"
        >
          <i className="fa-solid fa-trash-can text-[11px]"></i>
          <span>Hapus</span>
        </button>
      </header>

      <form onSubmit={handleUpdate} className="space-y-4">
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

          <div>
            <label className="block text-xs font-semibold text-[#111827]">Deskripsi Kegiatan</label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1.5 w-full rounded-[16px] bg-[#F4F7F6] border-0 p-3 text-xs text-[#111827] leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#111827]">
              Hasil / Output (Teks atau Link Dokumen / Drive)
            </label>
            <input
              type="text"
              value={output}
              onChange={(e) => setOutput(e.target.value)}
              placeholder="Contoh: https://docs.google.com/... atau Laporan Akhir"
              className="mt-1.5 w-full rounded-[14px] bg-[#F4F7F6] border-0 px-3.5 py-2.5 text-xs text-[#111827]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#111827]">Kendala</label>
            <input
              type="text"
              value={obstacles}
              onChange={(e) => setObstacles(e.target.value)}
              className="mt-1.5 w-full rounded-[14px] bg-[#F4F7F6] border-0 px-3.5 py-2.5 text-xs text-[#111827]"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#0B6E6C] hover:bg-[#085856] text-white text-sm font-bold py-3.5 rounded-full shadow-md flex items-center justify-center gap-2 cursor-pointer"
        >
          <i className="fa-solid fa-floppy-disk"></i>
          <span>{loading ? 'Menyimpan...' : 'Simpan Perubahan Logbook'}</span>
        </button>
      </form>
    </div>
  );
}
