'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Mentor, Profile } from '@/types/database';
import { StackedBars, Donut, HBars, ChartEmpty, Legend } from '@/components/charts/Charts';
import {
  STATUS_META,
  STACK_ORDER,
  type LogLite,
  dailyStacked,
  fmtNum,
  hours,
  isWeekday,
  lastDays,
  norm,
  shortDate,
  statusTotals,
  toKey,
} from '@/lib/dashboard/stats';

export default function MentorDashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [interns, setInterns] = useState<Profile[]>([]);
  const [logs, setLogs] = useState<LogLite[]>([]);
  const [isMine, setIsMine] = useState(false);

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
      const { data: people } = await supabase.from('profiles').select('*').eq('role', 'participant').order('name');
      const all = (people as Profile[]) || [];

      // Peserta bimbingan: cocokkan lewat mentor_id atau nama mentor; bila tidak ada, tampilkan semua.
      const myName = norm(me?.name);
      const myMentor = ((mentorRows as Mentor[]) || []).find(
        (m) => norm(m.email) === norm(user.email) || norm(m.name) === myName
      );
      const mine = all.filter(
        (p) =>
          (myMentor && p.mentor_id === myMentor.id) ||
          (p.mentor_name && (norm(p.mentor_name) === myName || norm(p.mentor_name) === norm(myMentor?.name)))
      );
      const scoped = mine.length > 0 ? mine : all;

      let rows: LogLite[] = [];
      if (scoped.length > 0) {
        const from = lastDays(60)[0];
        const { data } = await supabase
          .from('logbooks')
          .select('user_id,date,status,duration_minutes,work_location')
          .in('user_id', scoped.map((p) => p.id))
          .gte('date', from);
        rows = (data as LogLite[]) || [];
      }

      setInterns(scoped);
      setIsMine(mine.length > 0);
      setLogs(rows);
      setLoading(false);
    }
    load();
  }, [router, supabase]);

  const d = useMemo(() => {
    const days14 = lastDays(14);
    const days30 = lastDays(30);
    const days7 = lastDays(7);
    const set30 = new Set(days30);
    const set7 = new Set(days7);
    const logs30 = logs.filter((l) => set30.has(l.date));
    const totals = statusTotals(logs30);
    const reviewed = totals.approved + totals.rejected;
    const approvalRate = reviewed > 0 ? Math.round((totals.approved / reviewed) * 100) : null;
    const active7 = new Set(logs.filter((l) => set7.has(l.date)).map((l) => l.user_id));
    const minutes30 = logs30.reduce((a, l) => a + (l.duration_minutes || 0), 0);

    const byUser = interns.map((p) => {
      const mine = logs.filter((l) => l.user_id === p.id);
      const m30 = mine.filter((l) => set30.has(l.date));
      const filled14 = new Set(mine.filter((l) => days14.includes(l.date) && isWeekday(l.date)).map((l) => l.date)).size;
      const last = mine.reduce<string | null>((a, l) => (!a || l.date > a ? l.date : a), null);
      return {
        p,
        minutes: m30.reduce((a, l) => a + (l.duration_minutes || 0), 0),
        filled14,
        last,
        pending: mine.filter((l) => l.status === 'submitted').length,
      };
    });

    const workdays14 = days14.filter(isWeekday).length;
    const kantor = logs30.filter((l) => l.work_location !== 'lapangan').length;
    const lapangan = logs30.length - kantor;

    // Perlu perhatian: belum mengisi >= 3 hari kerja terakhir, atau punya logbook menunggu
    const today = toKey(new Date());
    const lastWorkdays = lastDays(5).filter(isWeekday).slice(-3);
    const attention = byUser
      .map((u) => {
        const missed = lastWorkdays.filter((day) => day <= today && !logs.some((l) => l.user_id === u.p.id && l.date === day)).length;
        return { ...u, missed };
      })
      .filter((u) => u.missed >= 3 || u.pending > 0)
      .sort((a, b) => b.pending - a.pending || b.missed - a.missed)
      .slice(0, 5);

    return {
      days14,
      stacked: dailyStacked(logs, days14),
      totals,
      approvalRate,
      active7: active7.size,
      minutes30,
      byUser,
      workdays14,
      kantor,
      lapangan,
      attention,
      total30: logs30.length,
    };
  }, [logs, interns]);

  const topHours = [...d.byUser].sort((a, b) => b.minutes - a.minutes).slice(0, 6);
  const filled = [...d.byUser].sort((a, b) => b.filled14 - a.filled14).slice(0, 6);

  return (
    <div className="kc-page">
      <header className="kc-head">
        <p className="kc-eyebrow">Portal mentor · Dashboard</p>
        <h1>
          {loading
            ? 'Memuat dashboard…'
            : `${d.totals.submitted} logbook menunggu review dari ${interns.length} peserta`}
        </h1>
        <p>
          Ringkasan aktivitas logbook {isMine ? 'peserta bimbingan Anda' : 'seluruh peserta'} selama 30 hari
          terakhir. Sumber: tabel logbook dan profil di Supabase.
        </p>
      </header>

      <section className="kc-tiles" aria-label="Ringkasan">
        <div className="kc-tile">
          <div className="kc-tile-top">
            <span className="kc-tile-icon"><i className="fa-solid fa-hourglass-half" aria-hidden="true"></i></span>
            <span className="kc-tile-label">Perlu review</span>
          </div>
          <span className="kc-tile-num">{d.totals.submitted}</span>
          <div className="kc-tile-meta">Logbook diajukan, belum ditinjau</div>
        </div>
        <div className="kc-tile">
          <div className="kc-tile-top">
            <span className="kc-tile-icon"><i className="fa-solid fa-user-check" aria-hidden="true"></i></span>
            <span className="kc-tile-label">Aktif 7 hari</span>
          </div>
          <span className="kc-tile-num">
            {d.active7}<small style={{ fontSize: 16, color: 'var(--muted)' }}> / {interns.length}</small>
          </span>
          <div className="kc-tile-meta">Peserta yang mengisi logbook</div>
        </div>
        <div className="kc-tile">
          <div className="kc-tile-top">
            <span className="kc-tile-icon"><i className="fa-solid fa-circle-check" aria-hidden="true"></i></span>
            <span className="kc-tile-label">Tingkat persetujuan</span>
          </div>
          <span className="kc-tile-num">{d.approvalRate === null ? '–' : `${d.approvalRate}%`}</span>
          <div className="kc-tile-meta">Disetujui dari yang sudah ditinjau</div>
        </div>
        <div className="kc-tile">
          <div className="kc-tile-top">
            <span className="kc-tile-icon"><i className="fa-solid fa-clock" aria-hidden="true"></i></span>
            <span className="kc-tile-label">Jam kerja</span>
          </div>
          <span className="kc-tile-num">{fmtNum(hours(d.minutes30), 1)}</span>
          <div className="kc-tile-meta">Total jam tercatat, 30 hari</div>
        </div>
      </section>

      <section className="kc-grid-3-1">
        <div className="kc-card">
          <div className="kc-card-row">
            <div>
              <h3 className="kc-section-title">Logbook per hari</h3>
              <p className="kc-muted kc-small" style={{ margin: '2px 0 0' }}>14 hari terakhir, dipisah per status</p>
            </div>
            <Legend items={STACK_ORDER.map((k) => ({ label: STATUS_META[k].label, color: STATUS_META[k].color }))} />
          </div>
          {logs.length === 0 ? (
            <ChartEmpty text="Belum ada logbook dalam 14 hari terakhir." />
          ) : (
            <StackedBars
              rows={d.stacked}
              series={STACK_ORDER.map((k) => ({ key: k, label: STATUS_META[k].label, color: STATUS_META[k].color }))}
              label={`Logbook per hari, 14 hari terakhir. Total ${d.stacked.reduce((a, r) => a + r.values.reduce((x, y) => x + y, 0), 0)} logbook.`}
              xLabel={(key, i) => (i % 2 === 0 || i === d.days14.length - 1 ? shortDate(key) : null)}
            />
          )}
        </div>

        <div className="kc-card">
          <div>
            <h3 className="kc-section-title">Status logbook</h3>
            <p className="kc-muted kc-small" style={{ margin: '2px 0 0' }}>30 hari terakhir</p>
          </div>
          {d.total30 === 0 ? (
            <ChartEmpty />
          ) : (
            <Donut
              centerValue={String(d.total30)}
              centerLabel="logbook"
              label={`Komposisi status ${d.total30} logbook: ${d.totals.approved} disetujui, ${d.totals.submitted} menunggu, ${d.totals.rejected} revisi.`}
              slices={(['approved', 'submitted', 'rejected', 'draft'] as const).map((k) => ({
                label: STATUS_META[k].label,
                value: d.totals[k],
                color: STATUS_META[k].color,
              }))}
            />
          )}
        </div>
      </section>

      <section className="kc-grid-2">
        <div className="kc-card">
          <div>
            <h3 className="kc-section-title">Jam kerja per peserta</h3>
            <p className="kc-muted kc-small" style={{ margin: '2px 0 0' }}>Jam tercatat dalam 30 hari terakhir</p>
          </div>
          {topHours.length === 0 || topHours.every((u) => u.minutes === 0) ? (
            <ChartEmpty />
          ) : (
            <HBars
              label="Jam kerja per peserta dalam 30 hari terakhir"
              rows={topHours.map((u) => ({ label: u.p.name, value: u.minutes, display: `${fmtNum(hours(u.minutes), 1)} jam` }))}
            />
          )}
        </div>

        <div className="kc-card">
          <div>
            <h3 className="kc-section-title">Kedisiplinan pengisian</h3>
            <p className="kc-muted kc-small" style={{ margin: '2px 0 0' }}>
              Hari kerja terisi dari {d.workdays14} hari kerja terakhir (14 hari)
            </p>
          </div>
          {filled.length === 0 ? (
            <ChartEmpty />
          ) : (
            <HBars
              color="var(--s2)"
              max={Math.max(d.workdays14, 1)}
              label="Hari kerja terisi per peserta dalam 14 hari terakhir"
              rows={filled.map((u) => ({ label: u.p.name, value: u.filled14, display: `${u.filled14} / ${d.workdays14}` }))}
            />
          )}
        </div>
      </section>

      <section className="kc-grid-2">
        <div className="kc-card">
          <div>
            <h3 className="kc-section-title">Lokasi kerja</h3>
            <p className="kc-muted kc-small" style={{ margin: '2px 0 0' }}>Kantor atau lapangan, 30 hari terakhir</p>
          </div>
          {d.total30 === 0 ? (
            <ChartEmpty />
          ) : (
            <Donut
              centerValue={String(d.total30)}
              centerLabel="logbook"
              label={`Lokasi kerja: ${d.kantor} di kantor, ${d.lapangan} di lapangan.`}
              slices={[
                { label: 'Kantor', value: d.kantor, color: 'var(--s1)' },
                { label: 'Lapangan', value: d.lapangan, color: 'var(--s2)' },
              ]}
            />
          )}
        </div>

        <div className="kc-card">
          <div className="kc-card-row">
            <div>
              <h3 className="kc-section-title">Perlu perhatian</h3>
              <p className="kc-muted kc-small" style={{ margin: '2px 0 0' }}>Ada logbook menunggu, atau 3 hari kerja belum mengisi</p>
            </div>
            <Link href="/mentor/review" className="kc-btn">Buka review</Link>
          </div>
          {d.attention.length === 0 ? (
            <ChartEmpty text="Tidak ada peserta yang perlu perhatian saat ini." />
          ) : (
            <ul className="kc-attn">
              {d.attention.map((u) => (
                <li key={u.p.id}>
                  <div className="kc-avatar" aria-hidden="true">{u.p.name.charAt(0).toUpperCase()}</div>
                  <div>
                    <b>{u.p.name}</b>
                    <small>Terakhir mengisi: {u.last ? shortDate(u.last) : '–'}</small>
                  </div>
                  {u.pending > 0 ? (
                    <span className="kc-chip kc-chip-warn">
                      <i className="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
                      {u.pending} menunggu
                    </span>
                  ) : (
                    <span className="kc-chip kc-chip-serious">
                      <i className="fa-solid fa-rotate-left" aria-hidden="true"></i>
                      Belum mengisi
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
