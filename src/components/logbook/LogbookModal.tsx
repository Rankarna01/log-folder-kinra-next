'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { deleteAttachment, uploadAttachments, validateFiles } from '@/lib/attachments';
import { AttachmentUploader } from '@/components/attachments/AttachmentUploader';
import { AttachmentGallery } from '@/components/attachments/AttachmentGallery';
import { VoiceInput } from '@/components/logbook/VoiceInput';
import { useToast } from '@/components/feedback/FeedbackProvider';
import { useConfirm } from '@/components/feedback/ConfirmProvider';
import type { Attachment, Logbook } from '@/types/database';

type Props = {
  date: string; // YYYY-MM-DD
  onClose: () => void;
  onChanged: () => void;
  /** Tampil sebagai form biasa di dalam halaman, bukan overlay. */
  inline?: boolean;
};

const todayIso = () => {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
};

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const dayLabel = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  const names = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  return `${d} ${names[m - 1]} ${y}`;
};

/**
 * Modal input logbook dari kalender.
 * - Belum ada logbook  : form tambah.
 * - Diajukan / revisi : form ubah (dan hapus).
 * - Sudah approved     : tampil terkunci, hanya bisa dilihat.
 */
export function LogbookModal({ date, onClose, onChanged, inline = false }: Props) {
  const supabase = createClient();
  const { toast } = useToast();
  const confirm = useConfirm();

  const [loading, setLoading] = useState(true);
  const [log, setLog] = useState<(Logbook & { attachments?: Attachment[] }) | null>(null);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('08:30');
  const [endTime, setEndTime] = useState('12:00');
  const [workLocation, setWorkLocation] = useState<'kantor' | 'lapangan'>('kantor');
  const [description, setDescription] = useState('');
  // Teks asli sebelum dirapikan AI, disimpan sebagai raw_description
  const [rawDescription, setRawDescription] = useState('');
  const [polishing, setPolishing] = useState(false);
  const [output, setOutput] = useState('');
  const [obstacles, setObstacles] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  // Logbook tidak lagi dikunci: disetujui otomatis saat disimpan, dan tetap bisa diubah pemiliknya.
  const locked = false;

  useEffect(() => {
    let active = true;
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('logbooks')
        .select('*, attachments(*)')
        .eq('user_id', user.id)
        .eq('date', date)
        .maybeSingle();
      if (!active) return;
      const existing = (data as (Logbook & { attachments?: Attachment[] }) | null) ?? null;
      setLog(existing);
      if (existing) {
        setTitle(existing.title);
        setStartTime(existing.start_time.slice(0, 5));
        setEndTime(existing.end_time.slice(0, 5));
        setWorkLocation(existing.work_location);
        setDescription(existing.final_description);
        setRawDescription(existing.raw_description || existing.final_description);
        setOutput(existing.output || '');
        setObstacles(existing.obstacles || '');
        setAttachments(existing.attachments ?? []);
      }
      setLoading(false);
    }
    load();
    return () => {
      active = false;
    };
  }, [date, supabase]);

  // Tutup dengan Esc, dan kunci scroll halaman di belakang
  useEffect(() => {
    if (inline) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, inline]);

  const appendDescription = (text: string) =>
    setDescription((prev) => (prev.trim() ? `${prev.trimEnd()} ${text}` : text));

  const handlePolish = async () => {
    const text = description.trim();
    if (!text || polishing) return;
    setPolishing(true);
    try {
      const res = await fetch('/api/logbook/polish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const json = (await res.json().catch(() => ({}))) as { text?: string; error?: string };
      if (!res.ok || !json.text) {
        toast.error(json.error || 'Rapikan AI gagal. Coba lagi.', 'Gagal merapikan');
        return;
      }
      // Teks asli dipertahankan (hanya diisi saat pertama kali dirapikan)
      setRawDescription((raw) => raw || text);
      setDescription(json.text);
      toast.success('Teks sudah dirapikan. Periksa kembali sebelum dikirim.');
    } catch {
      toast.error('Tidak dapat terhubung ke server.', 'Gagal merapikan');
    } finally {
      setPolishing(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (locked) return;
    if (date > todayIso()) {
      toast.warning('Logbook hanya bisa diisi untuk hari ini atau tanggal sebelumnya.', 'Tanggal belum bisa diisi');
      return;
    }
    const limitErr = validateFiles(files, attachments.length);
    if (limitErr) {
      toast.warning(limitErr, 'Lampiran terlalu banyak');
      return;
    }

    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }

    const fields = {
      title,
      start_time: startTime + ':00',
      end_time: endTime + ':00',
      work_location: workLocation,
      raw_description: rawDescription || description,
      final_description: description,
      output: output || null,
      obstacles: obstacles || null,
    };

    let logbookId = log?.id;
    if (log) {
      // Revisi dikirim ulang ke mentor sebagai diajukan
      const { error } = await supabase
        .from('logbooks')
        .update({ ...fields, status: 'approved', updated_at: new Date().toISOString() })
        .eq('id', log.id);
      if (error) {
        setSaving(false);
        toast.error(error.message, 'Gagal memperbarui logbook');
        return;
      }
    } else {
      const { data, error } = await supabase
        .from('logbooks')
        .insert({ ...fields, user_id: user.id, date, status: 'approved' })
        .select()
        .single();
      if (error || !data) {
        setSaving(false);
        toast.error(error?.message ?? 'Logbook belum bisa disimpan.', 'Gagal menyimpan');
        return;
      }
      logbookId = data.id;
    }

    if (files.length > 0 && logbookId) {
      const { ok, failed } = await uploadAttachments(supabase, user.id, logbookId, files, title);
      if (failed.length > 0) {
        toast.warning(`${ok} bukti tersimpan, ${failed.length} gagal: ${failed.join(', ')}.`, 'Sebagian bukti gagal');
      }
    }

    setSaving(false);
    toast.success('Logbook tersimpan. Mentor dapat melihat dan meninjau.');
    onChanged();
    onClose();
  };

  const handleDelete = async () => {
    if (!log || locked) return;
    if (!(await confirm({ message: 'Logbook pada tanggal ini akan dihapus beserta buktinya.', confirmLabel: 'Hapus logbook', danger: true }))) return;
    const { error } = await supabase.from('logbooks').delete().eq('id', log.id);
    if (error) {
      toast.error(error.message, 'Gagal menghapus');
      return;
    }
    toast.info('Logbook dihapus.');
    onChanged();
    onClose();
  };

  const handleRemoveAttachment = async (att: Attachment) => {
    if (locked || !(await confirm({ message: 'Bukti ini akan dihapus dari logbook.', confirmLabel: 'Hapus bukti', danger: true }))) return;
    const err = await deleteAttachment(supabase, att);
    if (err) {
      toast.error(err, 'Bukti gagal dihapus');
      return;
    }
    setAttachments((list) => list.filter((a) => a.id !== att.id));
    toast.success('Bukti dihapus.');
  };

  const body = (
    <>
        <div className="kc-modal-head">
          <div>
            <p className="kc-eyebrow">{dayLabel(date)}</p>
            <h2 id="lb-modal-title">{log ? (locked ? 'Logbook terverifikasi' : 'Ubah logbook') : 'Catat logbook'}</h2>
          </div>
          <button type="button" className="kc-icon-btn" onClick={onClose} aria-label="Tutup">
            <i className="fa-solid fa-xmark" aria-hidden="true"></i>
          </button>
        </div>

        {loading ? (
          <div className="kc-skeleton" aria-busy="true" style={{ height: 240 }} />
        ) : locked ? (
          <div className="lb-view">
            <div className="lb-view-banner">
              <span className="lb-view-lock" aria-hidden="true">
                <i className="fa-solid fa-lock"></i>
              </span>
              <div>
                <p className="lb-view-title">Terverifikasi mentor</p>
                <p className="lb-view-sub">
                  {log?.reviewed_by ? `Disetujui oleh ${log.reviewed_by}` : 'Disetujui oleh mentor'}
                  {log?.reviewed_at ? ` · ${fmtDateTime(log.reviewed_at)}` : ''}
                </p>
              </div>
            </div>

            <div className="lb-view-grid">
              <InfoTile icon="fa-regular fa-clock" label="Waktu" value={`${log?.start_time.slice(0, 5)} – ${log?.end_time.slice(0, 5)}`} />
              <InfoTile icon="fa-solid fa-location-dot" label="Lokasi" value={log?.work_location === 'lapangan' ? 'Lapangan' : 'Kantor'} />
              <InfoTile icon="fa-regular fa-calendar" label="Tanggal" value={dayLabel(date)} />
              <InfoTile icon="fa-solid fa-heading" label="Judul" value={log?.title} wide />
            </div>

            <section className="lb-view-block">
              <p className="lb-view-label">Deskripsi pekerjaan</p>
              <p className="lb-view-text">{log?.final_description || '–'}</p>
            </section>

            {log?.output && (
              <section className="lb-view-block">
                <p className="lb-view-label">Hasil / output</p>
                {/^(https?:\/\/|www\.)/i.test(log.output.trim()) ? (
                  <a className="lb-view-link" href={log.output.trim().startsWith('http') ? log.output.trim() : `https://${log.output.trim()}`} target="_blank" rel="noopener noreferrer">
                    <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>
                    <span>{log.output}</span>
                  </a>
                ) : (
                  <p className="lb-view-text">{log.output}</p>
                )}
              </section>
            )}

            {log?.obstacles && (
              <section className="lb-view-block">
                <p className="lb-view-label">Kendala</p>
                <p className="lb-view-text">{log.obstacles}</p>
              </section>
            )}

            <section className="lb-view-block">
              <div className="lb-view-head">
                <p className="lb-view-label">Bukti dokumentasi</p>
                <span className="lb-view-count">{attachments.length} berkas</span>
              </div>
              <AttachmentGallery items={attachments} emptyText="Tidak ada bukti dilampirkan." />
            </section>

            <div className="lb-view-foot">
              <button type="button" className="kc-btn" onClick={onClose}>Tutup</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            {log?.status === 'rejected' && log.review_notes && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-3.5 py-2.5 rounded-xl font-medium">
                <strong>Catatan mentor:</strong> {log.review_notes}
              </div>
            )}

            {/* Tanggal, jam & lokasi */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-[24px] p-4 shadow-2xs">
                <span className="block text-[11px] font-semibold text-zinc-400">Tanggal Kegiatan</span>
                <p className="mt-1 text-sm font-bold text-[#111827]">{dayLabel(date)}</p>
              </div>
              <div className="bg-white rounded-[24px] p-4 shadow-2xs">
                <label htmlFor="lb-start" className="block text-[11px] font-semibold text-zinc-400">Jam Mulai & Selesai</label>
                <div className="mt-1 flex items-center justify-between gap-1 text-[#111827]">
                  <input id="lb-start" type="time" required value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full border-0 p-0 text-sm font-bold text-[#111827] focus:ring-0 bg-transparent cursor-pointer" />
                  <span className="text-zinc-300 font-bold px-0.5 text-xs">–</span>
                  <input id="lb-end" type="time" required value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full border-0 p-0 text-sm font-bold text-[#111827] focus:ring-0 bg-transparent cursor-pointer" aria-label="Jam selesai" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[26px] p-4 space-y-3 shadow-2xs">
              <div>
                <label htmlFor="lb-title" className="block text-xs font-semibold text-[#111827]">Judul Kegiatan Harian</label>
                <input id="lb-title" type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Contoh: Pengerjaan Sistem HR & Rekap Data Harian" className="mt-1.5 w-full rounded-[14px] bg-[#F4F7F6] border-0 px-3.5 py-2.5 text-sm text-[#111827] focus:ring-2 focus:ring-[#0B6E6C]" />
              </div>
              <div>
                <label htmlFor="lb-loc" className="block text-xs font-semibold text-[#111827]">Lokasi Kegiatan</label>
                <select id="lb-loc" value={workLocation} onChange={(e) => setWorkLocation(e.target.value as 'kantor' | 'lapangan')} className="mt-1.5 w-full rounded-[14px] bg-[#F4F7F6] border-0 px-3.5 py-2.5 text-xs font-semibold text-[#111827] focus:ring-2 focus:ring-[#0B6E6C]">
                  <option value="kantor">Kantor</option>
                  <option value="lapangan">Lapangan</option>
                </select>
              </div>
            </div>

            {/* Deskripsi: section gradasi */}
            <section className="bg-kinra-grid rounded-[28px] p-5 space-y-3 shadow-xs text-white">
              <label htmlFor="lb-desc" className="text-xs font-bold text-white flex items-center gap-2">
                <i className="fa-solid fa-pen-clip"></i>
                <span>Deskripsi Kegiatan Harian</span>
              </label>
              <textarea id="lb-desc" rows={4} required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tuliskan rincian kegiatan harian yang kamu kerjakan hari ini..." className="w-full rounded-[18px] bg-white border-0 p-3.5 text-xs text-[#111827] leading-relaxed focus:ring-2 focus:ring-[#FDE9B4]" />
              <div className="kc-desc-tools">
                <VoiceInput onText={appendDescription} disabled={saving} />
                <button type="button" className="kc-btn" onClick={handlePolish} disabled={saving || polishing || !description.trim()}>
                  <i className={`fa-solid ${polishing ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'}`} aria-hidden="true"></i>
                  {polishing ? ' Merapikan…' : ' Rapikan AI'}
                </button>
              </div>
            </section>

            <div className="bg-white rounded-[26px] p-4 space-y-3 shadow-2xs">
              <div>
                <label htmlFor="lb-out" className="block text-xs font-semibold text-[#111827]">Hasil / Output Kerja (Teks atau Link Dokumen / Drive)</label>
                <input id="lb-out" type="text" value={output} onChange={(e) => setOutput(e.target.value)} placeholder="Contoh: https://docs.google.com/... atau Laporan Akhir Modul HR" className="mt-1.5 w-full rounded-[14px] bg-[#F4F7F6] border-0 px-3.5 py-2.5 text-xs text-[#111827]" />
              </div>
              <div>
                <label htmlFor="lb-obs" className="block text-xs font-semibold text-[#111827]">Kendala (Opsional)</label>
                <input id="lb-obs" type="text" value={obstacles} onChange={(e) => setObstacles(e.target.value)} placeholder="Contoh: Penyesuaian format data laporan" className="mt-1.5 w-full rounded-[14px] bg-[#F4F7F6] border-0 px-3.5 py-2.5 text-xs text-[#111827]" />
              </div>

              {log && attachments.length > 0 && (
                <div>
                  <span className="block text-xs font-semibold text-[#111827] mb-2">Bukti tersimpan</span>
                  <AttachmentGallery items={attachments} />
                  <ul className="kc-manage-list mt-2">
                    {attachments.map((att, i) => (
                      <li key={att.id}>
                        <span className="kc-small">Bukti #{i + 1}</span>
                        <button type="button" className="kc-btn kc-btn-danger" onClick={() => handleRemoveAttachment(att)}>
                          <i className="fa-solid fa-trash-can" aria-hidden="true"></i> Hapus
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <AttachmentUploader files={files} onChange={setFiles} existingCount={attachments.length} disabled={saving} />
            </div>

            <div className="flex items-center justify-between gap-2">
              {log ? (
                <button type="button" onClick={handleDelete} disabled={saving} className="bg-[#FCE1D4] text-[#9A3412] text-xs font-bold px-3.5 py-2 rounded-full flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
                  <i className="fa-solid fa-trash-can text-[11px]"></i>
                  <span>Hapus</span>
                </button>
              ) : (
                <span />
              )}
              <button type="button" onClick={onClose} className="bg-white border border-zinc-200 text-[#111827] text-xs font-bold px-4 py-2 rounded-full shadow-2xs cursor-pointer">
                Batal
              </button>
            </div>

            <button type="submit" disabled={saving} className="w-full bg-[#0B6E6C] hover:bg-[#085856] text-white text-sm font-bold py-4 rounded-full shadow-md transition active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer">
              <i className="fa-solid fa-floppy-disk"></i>
              <span>{saving ? 'Menyimpan...' : 'Simpan Logbook'}</span>
            </button>
          </form>
        )}
    </>
  );

  if (inline) {
    return <section className="space-y-3" aria-labelledby="lb-modal-title">{body}</section>;
  }

  return (
    <div className="kc-modal-backdrop" role="presentation" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="kc-modal kc-modal-wide" role="dialog" aria-modal="true" aria-labelledby="lb-modal-title">
        {body}
      </div>
    </div>
  );
}

function InfoTile({ icon, label, value, wide }: { icon: string; label: string; value?: string | null; wide?: boolean }) {
  return (
    <div className={`lb-view-tile${wide ? ' lb-view-tile-wide' : ''}`}>
      <span className="lb-view-tile-icon" aria-hidden="true">
        <i className={icon}></i>
      </span>
      <div>
        <p className="lb-view-tile-label">{label}</p>
        <p className="lb-view-tile-value">{value || '–'}</p>
      </div>
    </div>
  );
}

function ReadRow({ label, value, multiline }: { label: string; value?: string | null; multiline?: boolean }) {
  return (
    <div className="kc-readrow">
      <span className="kc-label">{label}</span>
      <p className={multiline ? 'kc-readrow-multi' : undefined}>{value || '–'}</p>
    </div>
  );
}
