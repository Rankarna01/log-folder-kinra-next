'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Profile, Logbook } from '@/types/database';

export default function MentorReviewPage() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [pendingLogs, setPendingLogs] = useState<Logbook[]>([]);
  const [approvedLogs, setApprovedLogs] = useState<Logbook[]>([]);
  const [interns, setInterns] = useState<Profile[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'interns'>('pending');
  const [loading, setLoading] = useState(true);

  // Review modal / action
  const [selectedLog, setSelectedLog] = useState<Logbook | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    async function loadMentorData() {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      setProfile(prof);

      // Load all submitted / pending logbooks
      const { data: pending } = await supabase
        .from('logbooks')
        .select('*, profiles:user_id(name, division, mentor_name, avatar_url)')
        .eq('status', 'submitted')
        .order('date', { ascending: false });

      if (pending) {
        setPendingLogs(pending);
      }

      // Load approved logbooks
      const { data: approved } = await supabase
        .from('logbooks')
        .select('*, profiles:user_id(name, division, mentor_name, avatar_url)')
        .eq('status', 'approved')
        .order('date', { ascending: false })
        .limit(30);

      if (approved) {
        setApprovedLogs(approved);
      }

      // Load supervised interns
      const { data: allInterns } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'participant')
        .order('name');

      if (allInterns) {
        // If mentor has a name, filter or show all interns
        setInterns(allInterns);
      }

      setLoading(false);
    }

    loadMentorData();
  }, [router, supabase]);

  const handleApprove = async (logbookId: string) => {
    setIsSubmittingReview(true);
    const reviewer = profile?.name || 'Mentor Pembimbing';

    const { error } = await supabase
      .from('logbooks')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewer,
      })
      .eq('id', logbookId);

    if (!error) {
      const movedLog = pendingLogs.find((l) => l.id === logbookId);
      if (movedLog) {
        setPendingLogs((prev) => prev.filter((l) => l.id !== logbookId));
        setApprovedLogs((prev) => [{ ...movedLog, status: 'approved', reviewed_by: reviewer }, ...prev]);
      }
      setToastMessage('Logbook berhasil disetujui (Approved)!');
      setTimeout(() => setToastMessage(''), 3000);
    }

    setIsSubmittingReview(false);
    setSelectedLog(null);
  };

  const handleRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLog) return;
    setIsSubmittingReview(true);

    const reviewer = profile?.name || 'Mentor Pembimbing';

    const { error } = await supabase
      .from('logbooks')
      .update({
        status: 'rejected',
        review_notes: reviewNote.trim() || 'Perlu perbaikan deskripsi kegiatan.',
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewer,
      })
      .eq('id', selectedLog.id);

    if (!error) {
      setPendingLogs((prev) => prev.filter((l) => l.id !== selectedLog.id));
      setToastMessage('Catatan revisi telah dikirim ke peserta magang.');
      setTimeout(() => setToastMessage(''), 3000);
    }

    setIsSubmittingReview(false);
    setSelectedLog(null);
    setReviewNote('');
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-zinc-500 font-medium">Memuat Portal Mentor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="bg-emerald-600 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-lg flex items-center justify-between animate-fade-in">
          <span className="flex items-center gap-2">
            <i className="fa-solid fa-circle-check"></i>
            {toastMessage}
          </span>
          <button onClick={() => setToastMessage('')}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#18181B] via-amber-700 to-amber-900 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="bg-amber-500/20 text-amber-200 border border-amber-400/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
              <i className="fa-solid fa-clipboard-check text-[9px]"></i>
              Portal Mentor Pembimbing
            </span>
            <span className="text-zinc-300 text-xs">• KINRA Sei Mangkei</span>
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">
            Verifikasi & Review Logbook Harian
          </h1>
          <p className="text-xs md:text-sm text-amber-100 max-w-2xl">
            Tinjau catatan logbook kegiatan harian peserta magang, berikan feedback, dan setujui laporan sebelum dicetak.
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5">
        <div className="bg-white rounded-2xl p-4 border border-zinc-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Perlu Review</span>
            <i className="fa-solid fa-clock text-amber-600"></i>
          </div>
          <p className="text-2xl font-black text-amber-700">{pendingLogs.length}</p>
          <p className="text-[10px] text-zinc-500">Logbook menunggu tindakan</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-zinc-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Telah Disetujui</span>
            <i className="fa-solid fa-circle-check text-emerald-600"></i>
          </div>
          <p className="text-2xl font-black text-emerald-700">{approvedLogs.length}</p>
          <p className="text-[10px] text-zinc-500">Logbook terverifikasi</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-zinc-200/80 shadow-xs space-y-1 col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Anak Magang</span>
            <i className="fa-solid fa-users text-[#0B6E6C]"></i>
          </div>
          <p className="text-2xl font-black text-[#111827]">{interns.length}</p>
          <p className="text-[10px] text-zinc-500">Peserta di bimbingan</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200/80 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'pending'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-zinc-600 hover:bg-white'
          }`}
        >
          <i className="fa-solid fa-inbox text-xs"></i>
          <span>Menunggu Review ({pendingLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('approved')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'approved'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-zinc-600 hover:bg-white'
          }`}
        >
          <i className="fa-solid fa-check-double text-xs"></i>
          <span>Sudah Disetujui ({approvedLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('interns')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'interns'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-zinc-600 hover:bg-white'
          }`}
        >
          <i className="fa-solid fa-users text-xs"></i>
          <span>Anak Magang ({interns.length})</span>
        </button>
      </div>

      {/* Tab 1: Menunggu Review */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {pendingLogs.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-zinc-200/80 space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-lg">
                <i className="fa-solid fa-circle-check"></i>
              </div>
              <h3 className="text-sm font-bold text-[#111827]">Semua Logbook Sudah Ditinjau!</h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Tidak ada logbook kegiatan peserta magang yang sedang menunggu persetujuan saat ini.
              </p>
            </div>
          ) : (
            pendingLogs.map((log) => (
              <div
                key={log.id}
                className="bg-white rounded-3xl p-5 border border-zinc-200/80 shadow-xs space-y-4 hover:shadow-md transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#0B6E6C] text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {log.profiles?.name?.charAt(0) || 'P'}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-[#111827]">
                        {log.profiles?.name || 'Peserta Magang'}
                      </h3>
                      <p className="text-[10px] text-zinc-500">
                        {log.profiles?.division || 'KINRA'} • {log.date} ({log.start_time?.slice(0, 5)} - {log.end_time?.slice(0, 5)})
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full self-start sm:self-auto">
                    Menunggu Persetujuan
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <h4 className="font-extrabold text-[#111827] text-sm">{log.title}</h4>
                  <p className="text-zinc-700 leading-relaxed bg-[#F8FAF9] p-3.5 rounded-2xl border border-zinc-200/60 whitespace-pre-line">
                    {log.final_description || log.raw_description}
                  </p>

                  {log.output && (
                    <div className="text-[11px] text-zinc-600 bg-zinc-50 p-2.5 rounded-xl">
                      <span className="font-bold text-[#111827]">Output/Hasil: </span>
                      {log.output}
                    </div>
                  )}

                  {log.obstacles && (
                    <div className="text-[11px] text-amber-800 bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/50">
                      <span className="font-bold">Kendala: </span>
                      {log.obstacles}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-zinc-100 flex items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      setSelectedLog(log);
                      setReviewNote('');
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <i className="fa-solid fa-rotate-left"></i>
                    <span>Minta Revisi</span>
                  </button>

                  <button
                    onClick={() => handleApprove(log.id)}
                    disabled={isSubmittingReview}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs transition cursor-pointer flex items-center gap-1.5"
                  >
                    <i className="fa-solid fa-check"></i>
                    <span>Setujui Logbook</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Sudah Disetujui */}
      {activeTab === 'approved' && (
        <div className="bg-white rounded-3xl p-5 border border-zinc-200/80 shadow-xs space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-200 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  <th className="py-3 px-3">Tanggal</th>
                  <th className="py-3 px-3">Nama Peserta</th>
                  <th className="py-3 px-3">Judul Kegiatan</th>
                  <th className="py-3 px-3">Diverifikasi Oleh</th>
                  <th className="py-3 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {approvedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-50/80 transition">
                    <td className="py-3 px-3 font-medium text-zinc-600 whitespace-nowrap">
                      {log.date}
                    </td>
                    <td className="py-3 px-3 font-bold text-[#111827]">
                      {log.profiles?.name || 'Peserta'}
                    </td>
                    <td className="py-3 px-3 max-w-xs truncate text-zinc-800">
                      {log.title}
                    </td>
                    <td className="py-3 px-3 text-zinc-500">
                      {log.reviewed_by || 'Mentor'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Disetujui
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Daftar Anak Magang */}
      {activeTab === 'interns' && (
        <div className="bg-white rounded-3xl p-5 border border-zinc-200/80 shadow-xs space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {interns.map((i) => (
              <div
                key={i.id}
                className="bg-[#F8FAF9] rounded-2xl p-4 border border-zinc-200/70 space-y-2"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#0B6E6C] text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {i.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-[#111827] truncate">{i.name}</h3>
                    <p className="text-[10px] text-zinc-500 truncate">{i.division}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-200/60 text-[11px] text-zinc-600 space-y-1">
                  <div>
                    <span className="font-semibold text-zinc-400 text-[10px]">Posisi: </span>
                    {i.position || 'Peserta Magang'}
                  </div>
                  <div>
                    <span className="font-semibold text-zinc-400 text-[10px]">Mentor: </span>
                    <span className="font-bold text-[#0B6E6C]">{i.mentor_name || 'RIZKY DELIANNGI'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Minta Revisi */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-sm font-bold text-[#111827]">Catatan Revisi Logbook</h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-zinc-400 hover:text-zinc-600 text-sm cursor-pointer"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleRevision} className="space-y-3.5 text-xs">
              <p className="text-zinc-600">
                Tuliskan bagian mana yang perlu diperbaiki oleh{' '}
                <strong className="text-[#111827]">{selectedLog.profiles?.name || 'Peserta'}</strong> untuk logbook tanggal{' '}
                <strong>{selectedLog.date}</strong>:
              </p>

              <textarea
                required
                rows={4}
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="Contoh: Tolong uraikan lebih detail hasil analisis sistem dan kendala teknis yang dihadapi..."
                className="w-full rounded-xl bg-[#F4F7F6] p-3 text-xs text-[#111827] border-0 focus:ring-2 focus:ring-amber-600"
              />

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 rounded-xl text-zinc-600 font-semibold hover:bg-zinc-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="bg-rose-600 text-white font-bold px-4 py-2 rounded-xl hover:bg-rose-700 shadow-xs"
                >
                  {isSubmittingReview ? 'Mengirim...' : 'Kirim Catatan Revisi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
