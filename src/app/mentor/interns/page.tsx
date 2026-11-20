'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Mentor, Profile } from '@/types/database';

type LogRow = {
  user_id: string;
  date: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  duration_minutes: number | null;
  attachments?: { id: string }[];
};

type Stats = {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  minutes: number;
  bukti: number;
  lastDate: string | null;
};

const EMPTY: Stats = { total: 0, approved: 0, pending: 0, rejected: 0, minutes: 0, bukti: 0, lastDate: null };
const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

const tgl = (iso?: string | null) => {
  if (!iso) return '–';
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return '–';
  return `${d} ${BULAN[m - 1]} ${y}`;
};
const jam = (minutes: number) => {
  const h = minutes / 60;
  return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 }).format(h);
};
const norm = (s?: string | null) => (s || '').trim().toLowerCase();

type Scope = 'mine' | 'all';
type Filter = 'all' | 'pending' | 'done';

function statusChip(s: Stats) {
  if (s.total === 0) return { cls: 'kc-chip-na', icon: 'fa-circle-dot', label: 'Belum ada logbook' };
  if (s.pending > 0) return { cls: 'kc-chip-warn', icon: 'fa-triangle-exclamation', label: `${s.pending} menunggu review` };
  if (s.rejected > 0) return { cls: 'kc-chip-serious', icon: 'fa-rotate-left', label: `${s.rejected} perlu revisi` };
  return { cls: 'kc-chip-good', icon: 'fa-circle-check', label: 'Semua ditinjau' };
}

export default function MentorInternsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [interns, setInterns] = useState<Profile[]>([]);
  const [stats, setStats] = useState<Record<string, Stats>>({});
  const [mine, setMine] = useState<Set<string>>(new Set());
  const [scope, setScope] = useState<Scope>('all');
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: me } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      const { data: mentorRows } = await supabase.from('mentors').select('*');
      const { data: people } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'participant')
        .order('name');

      const list = (people as Profile[]) || [];

      // Cocokkan peserta dengan mentor yang sedang login (via mentor_id atau nama mentor)
      const myName = norm(me?.name);
      const myMentor = ((mentorRows as Mentor[]) || []).find(
        (m) => norm(m.email) === norm(user.email) || norm(m.name) === myName
      );
      const mineIds = new Set(
        list
          .filter(
            (p) =>
              (myMentor && p.mentor_id === myMentor.id) ||
              (p.mentor_name && (norm(p.mentor_name) === myName || norm(p.mentor_name) === norm(myMentor?.name)))
          )
          .map((p) => p.id)
      );

      // Statistik logbook per peserta
      const ids = list.map((p) => p.id);
      const byUser: Record<string, Stats> = {};
      if (ids.length > 0) {
        const { data: logs } = await supabase
          .from('logbooks')
          .select('user_id,date,status,duration_minutes,attachments(id)')
          .in('user_id', ids);
        ((logs as LogRow[]) || []).forEach((l) => {
          const s = (byUser[l.user_id] ||= { ...EMPTY });
          s.total += 1;
          s.minutes += l.duration_minutes || 0;
          s.bukti += l.attachments?.length ?? 0;
          if (l.status === 'approved') s.approved += 1;
          if (l.status === 'submitted') s.pending += 1;
          if (l.status === 'rejected') s.rejected += 1;
          if (!s.lastDate || l.date > s.lastDate) s.lastDate = l.date;
        });
      }

      setInterns(list);
      setStats(byUser);
      setMine(mineIds);
      setScope(mineIds.size > 0 ? 'mine' : 'all');
      setLoading(false);
    }
    load();
  }, [router, supabase]);

  const visible = useMemo(() => {
    const q = norm(query);
    return interns.filter((p) => {
      if (scope === 'mine' && !mine.has(p.id)) return false;
      const s = stats[p.id] || EMPTY;
      if (filter === 'pending' && s.pending === 0) return false;
      if (filter === 'done' && (s.total === 0 || s.pending > 0)) return false;
      if (!q) return true;
      return [p.name, p.email, p.division, p.institution].some((v) => norm(v).includes(q));
    });
  }, [interns, stats, mine, scope, filter, query]);

  const scoped = scope === 'mine' ? interns.filter((p) => mine.has(p.id)) : interns;
  const totals = scoped.reduce(
    (a, p) => {
      const s = stats[p.id] || EMPTY;
      a.pending += s.pending;
      a.approved += s.approved;
      a.minutes += s.minutes;
      return a;
    },
    { pending: 0, approved: 0, minutes: 0 }
  );

  return (
    <div className="kc-page">
      <header className="kc-head">
        <p className="kc-eyebrow">Portal mentor · Anak magang bimbingan</p>
        <h1>
          {loading
            ? 'Memuat daftar peserta…'
            : `${scoped.length} peserta magang, ${totals.pending} logbook menunggu review`}
        </h1>
        <p>
          Pantau kemajuan tiap peserta: jumlah logbook, persetujuan, dan jam kerja tercatat. Sumber: data
          profil dan logbook peserta di Supabase.
        </p>
      </header>

      <section className="kc-tiles" aria-label="Ringkasan bimbingan">
        <div className="kc-tile">
          <div className="kc-tile-top">
            <span className="kc-tile-icon"><i className="fa-solid fa-user-graduate" aria-hidden="true"></i></span>
            <span className="kc-tile-label">Peserta</span>
          </div>
          <span className="kc-tile-num">{scoped.length}</span>
          <div className="kc-tile-meta">{scope === 'mine' ? 'Dibimbing langsung' : 'Seluruh peserta magang'}</div>
        </div>
        <div className="kc-tile">
          <div className="kc-tile-top">
            <span className="kc-tile-icon"><i className="fa-solid fa-hourglass-half" aria-hidden="true"></i></span>
            <span className="kc-tile-label">Menunggu review</span>
          </div>
          <span className="kc-tile-num">{totals.pending}</span>
          <div className="kc-tile-meta">Logbook berstatus diajukan</div>
        </div>
        <div className="kc-tile">
          <div className="kc-tile-top">
            <span className="kc-tile-icon"><i className="fa-solid fa-circle-check" aria-hidden="true"></i></span>
            <span className="kc-tile-label">Disetujui</span>
          </div>
          <span className="kc-tile-num">{totals.approved}</span>
          <div className="kc-tile-meta">Logbook terverifikasi</div>
        </div>
        <div className="kc-tile">
          <div className="kc-tile-top">
            <span className="kc-tile-icon"><i className="fa-solid fa-clock" aria-hidden="true"></i></span>
            <span className="kc-tile-label">Total jam</span>
          </div>
          <span className="kc-tile-num">{jam(totals.minutes)}</span>
          <div className="kc-tile-meta">Jam kerja tercatat di logbook</div>
        </div>
      </section>

      {!loading && mine.size === 0 && (
        <div className="kc-note" role="status">
          <i className="fa-solid fa-circle-info" aria-hidden="true"></i>
          <span>
            Belum ada peserta yang memilih Anda sebagai mentor, jadi seluruh peserta ditampilkan. Peserta
            memilih mentor saat melengkapi profil.
          </span>
        </div>
      )}

      <div className="kc-toolbar">
        <label className="kc-search">
          <i className="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama, email, institusi…"
            aria-label="Cari peserta"
          />
        </label>

        {mine.size > 0 && (
          <div className="kc-seg" role="tablist" aria-label="Cakupan peserta">
            <button role="tab" aria-selected={scope === 'mine'} onClick={() => setScope('mine')}>
              Bimbingan saya
            </button>
            <button role="tab" aria-selected={scope === 'all'} onClick={() => setScope('all')}>
              Semua peserta
            </button>
          </div>
        )}

        <div className="kc-seg" role="tablist" aria-label="Filter status">
          <button role="tab" aria-selected={filter === 'all'} onClick={() => setFilter('all')}>Semua</button>
          <button role="tab" aria-selected={filter === 'pending'} onClick={() => setFilter('pending')}>
            Perlu review
          </button>
          <button role="tab" aria-selected={filter === 'done'} onClick={() => setFilter('done')}>
            Sudah ditinjau
          </button>
        </div>
      </div>

      {loading ? (
        <div className="kc-grid" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="kc-skeleton" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="kc-empty">Tidak ada peserta yang cocok.</div>
      ) : (
        <div className="kc-grid">
          {visible.map((p) => {
            const s = stats[p.id] || EMPTY;
            const chip = statusChip(s);
            const pct = s.total > 0 ? Math.round((s.approved / s.total) * 100) : 0;
            return (
              <article key={p.id} className="kc-card">
                <div className="kc-card-head">
                  <div className="kc-avatar" aria-hidden="true">
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h3>{p.name}</h3>
                    <p>{p.position || 'Peserta Magang'}</p>
                  </div>
                </div>

                <span className={`kc-chip ${chip.cls}`} style={{ alignSelf: 'flex-start' }}>
                  <i className={`fa-solid ${chip.icon}`} aria-hidden="true"></i>
                  {chip.label}
                </span>

                <ul className="kc-info">
                  <li>
                    <i className="fa-solid fa-building" aria-hidden="true"></i>
                    <span>{p.division || '–'}</span>
                  </li>
                  <li>
                    <i className="fa-solid fa-graduation-cap" aria-hidden="true"></i>
                    <span>{p.institution || '–'}</span>
                  </li>
                  <li>
                    <i className="fa-solid fa-id-card" aria-hidden="true"></i>
                  </li>
                  <li>
                    <i className="fa-regular fa-calendar" aria-hidden="true"></i>
                    <span>
                      {p.start_date || p.end_date ? `${tgl(p.start_date)} – ${tgl(p.end_date)}` : '–'}
                    </span>
                  </li>
                  <li>
                    <i className="fa-regular fa-envelope" aria-hidden="true"></i>
                    <span>
                      <a href={`mailto:${p.email}`}>{p.email}</a>
                    </span>
                  </li>
                  {p.phone && (
                    <li>
                      <i className="fa-solid fa-phone" aria-hidden="true"></i>
                      <span>
                        <a href={`tel:${p.phone}`}>{p.phone}</a>
                      </span>
                    </li>
                  )}
                </ul>

                <div className="kc-stats">
                  <div><span>Logbook</span><b>{s.total}</b></div>
                  <div><span>Setuju</span><b>{s.approved}</b></div>
                  <div><span>Bukti</span><b>{s.bukti}</b></div>
                  <div><span>Jam</span><b>{jam(s.minutes)}</b></div>
                </div>

                <div>
                  <div className="kc-progress-label">
                    <span>Logbook disetujui</span>
                    <span className="tnum">{pct}%</span>
                  </div>
                  <div
                    className="kc-track"
                    role="img"
                    aria-label={`${s.approved} dari ${s.total} logbook disetujui (${pct} persen)`}
                  >
                    <i style={{ width: `${pct}%` }} />
                  </div>
                </div>

                <div className="kc-card-foot">
                  <span className="kc-small kc-muted">Terakhir mengisi: {tgl(s.lastDate)}</span>
                  <Link
                    href={`/mentor/review?peserta=${p.id}`}
                    className={`kc-btn ${s.pending > 0 ? 'kc-btn-primary' : ''}`}
                  >
                    Tinjau logbook
                    <i className="fa-solid fa-arrow-right" aria-hidden="true"></i>
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
