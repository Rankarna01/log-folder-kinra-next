'use client';

import { useEffect, useMemo, useState } from 'react';
import { useToast } from '@/components/feedback/FeedbackProvider';
import type { Mentor, Profile } from '@/types/database';

type Props = {
  mentor: Mentor;
  people: Profile[];
  onClose: () => void;
  onChanged: () => void;
};

const norm = (s?: string | null) => (s || '').trim().toLowerCase();

async function assignRequest(profileIds: string[], mentorId: string | null, mentorName: string | null) {
  const res = await fetch('/api/admin/accounts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'assign', profileIds, mentorId, mentorName }),
  });
  const json = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new Error(json.error || 'Perubahan gagal disimpan.');
}

/** Detail mentor: lihat anak magang bimbingan, lepas, dan tambahkan anak magang baru. */
export function MentorDetailModal({ mentor, people, onClose, onChanged }: Props) {
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const mine = useMemo(() => people.filter((p) => p.mentor_id === mentor.id), [people, mentor.id]);
  const unassigned = useMemo(() => people.filter((p) => !p.mentor_id).length, [people]);

  // Hanya anak magang yang belum punya mentor yang bisa ditambahkan
  const candidates = useMemo(() => {
    const q = norm(query);
    return people
      .filter((p) => !p.mentor_id)
      .filter((p) => !q || [p.name, p.email, p.division].some((v) => norm(v).includes(q)))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [people, query]);

  const run = async (ids: string[], attach: boolean, label: string) => {
    if (ids.length === 0) return;
    setSaving(true);
    try {
      await assignRequest(ids, attach ? mentor.id : null, attach ? mentor.name : null);
      toast.success(label);
      setPicked([]);
      onChanged();
    } catch (err) {
      toast.error((err as Error).message, 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const togglePick = (id: string) =>
    setPicked((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));

  const release = (p: Profile) => {
    if (!window.confirm(`Lepas ${p.name} dari bimbingan ${mentor.name}?`)) return;
    run([p.id], false, `${p.name} dilepas dari bimbingan.`);
  };

  return (
    <div className="kc-modal-backdrop" role="presentation" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="kc-modal kc-modal-wide" role="dialog" aria-modal="true" aria-labelledby="mentor-detail-title">
        <div className="kc-modal-head">
          <div>
            <p className="kc-eyebrow">Detail mentor</p>
            <h2 id="mentor-detail-title">{mentor.name}</h2>
            <p className="kc-small kc-muted" style={{ margin: '4px 0 0' }}>
              {mentor.position || '–'} · {mentor.division}
            </p>
          </div>
          <button type="button" className="kc-icon-btn" onClick={onClose} aria-label="Tutup">
            <i className="fa-solid fa-xmark" aria-hidden="true"></i>
          </button>
        </div>

        <div className="kc-stats" style={{ gridTemplateColumns: '1fr 1fr 1fr', marginBottom: 16 }}>
          <div><span>Bimbingan</span><b>{mine.length}</b></div>
          <div><span>Belum punya mentor</span><b>{unassigned}</b></div>
          <div><span>Status</span><b style={{ fontSize: 14 }}>{mentor.is_active ? 'Aktif' : 'Nonaktif'}</b></div>
        </div>

        <section style={{ marginBottom: 18 }}>
          <p className="kc-eyebrow" style={{ marginBottom: 8 }}>Anak magang bimbingan ({mine.length})</p>
          {mine.length === 0 ? (
            <p className="kc-muted kc-small">Belum ada anak magang yang dibimbing mentor ini.</p>
          ) : (
            <ul className="kc-attn">
              {mine.map((p) => (
                <li key={p.id}>
                  <div className="kc-avatar" aria-hidden="true">{p.name.charAt(0).toUpperCase()}</div>
                  <div>
                    <b>{p.name}</b>
                    <small>{p.division || '–'} · {p.email}</small>
                  </div>
                  <button type="button" className="kc-btn kc-btn-danger" disabled={saving} onClick={() => release(p)}>
                    <i className="fa-solid fa-link-slash" aria-hidden="true"></i> Lepas
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <div className="kc-card-row" style={{ marginBottom: 8 }}>
            <p className="kc-eyebrow" style={{ margin: 0 }}>Tambahkan anak magang</p>
            <button
              type="button"
              className="kc-btn kc-btn-primary"
              disabled={saving || picked.length === 0}
              onClick={() => run(picked, true, `${picked.length} anak magang ditambahkan ke ${mentor.name}.`)}
            >
              <i className="fa-solid fa-user-plus" aria-hidden="true"></i> Tambahkan terpilih ({picked.length})
            </button>
          </div>

          <label className="kc-search" style={{ marginBottom: 10 }}>
            <i className="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari nama, email, divisi…" aria-label="Cari anak magang" />
          </label>

          {candidates.length === 0 ? (
            <p className="kc-muted kc-small">Tidak ada anak magang yang cocok.</p>
          ) : (
            <ul className="kc-attn" style={{ maxHeight: 320, overflowY: 'auto' }}>
              {candidates.map((p) => {
                const checked = picked.includes(p.id);
                return (
                  <li key={p.id} onClick={() => togglePick(p.id)} style={{ cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => togglePick(p.id)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Pilih ${p.name}`}
                      style={{ width: 18, height: 18, accentColor: 'var(--brand)', flex: 'none' }}
                    />
                    <div>
                      <b>{p.name}</b>
                      <small>{p.division || '–'} · {p.email}</small>
                    </div>
                      <span className="kc-chip kc-chip-na">Belum punya mentor</span>
                    <button
                      type="button"
                      className="kc-btn"
                      disabled={saving}
                      onClick={(e) => {
                        e.stopPropagation();
                        run([p.id], true, `${p.name} dipilih ${mentor.name}.`);
                      }}
                    >
                      Pilih
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
