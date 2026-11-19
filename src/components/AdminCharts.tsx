'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types/database';
import { AreaLine, Donut, HBars, ChartEmpty } from '@/components/charts/Charts';
import {
  STATUS_META,
  type LogLite,
  countBy,
  fmtNum,
  hours,
  lastDays,
  statusTotals,
  weeklyCounts,
} from '@/lib/dashboard/stats';

const ROLE_LABEL = { participant: 'Peserta magang', mentor: 'Mentor', admin: 'Admin' } as const;

/** Dashboard grafik untuk Super Admin. Semua angka dihitung dari data Supabase (bukan data contoh). */
export function AdminCharts() {
  const supabase = createClient();
  const [people, setPeople] = useState<Profile[]>([]);
  const [logs, setLogs] = useState<LogLite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const from = lastDays(60)[0];
      const [{ data: prof }, { data: lg }] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase
          .from('logbooks')
          .select('user_id,date,status,duration_minutes,work_location')
          .gte('date', from),
      ]);
      setPeople((prof as Profile[]) || []);
      setLogs((lg as LogLite[]) || []);
      setLoading(false);
    }
    load();
  }, [supabase]);

  const d = useMemo(() => {
    const participants = people.filter((p) => p.role === 'participant');
    const days30 = new Set(lastDays(30));
    const days7 = new Set(lastDays(7));
    const logs30 = logs.filter((l) => days30.has(l.date));
    const totals = statusTotals(logs30);
    const reviewed = totals.approved + totals.rejected;
    const active7 = new Set(logs.filter((l) => days7.has(l.date)).map((l) => l.user_id));
    const minutes30 = logs30.reduce((a, l) => a + (l.duration_minutes || 0), 0);

    return {
      participants,
      logs30,
      totals,
      approvalRate: reviewed > 0 ? Math.round((totals.approved / reviewed) * 100) : null,
      active7: participants.filter((p) => active7.has(p.id)).length,
      minutes30,
      weekly: weeklyCounts(logs, 8),
      byDivision: countBy(participants, (p) => p.division).slice(0, 6),
      byMentor: countBy(participants, (p) => p.mentor_name, 'Belum memilih mentor').slice(0, 6),
      roles: (['participant', 'mentor', 'admin'] as const).map((r) => ({
        label: ROLE_LABEL[r],
        value: people.filter((p) => p.role === r).length,
      })),
    };
  }, [people, logs]);

  if (loading) {
    return <div className="kc-skeleton" aria-busy="true" style={{ height: 320 }} />;
  }

  const weeklyTotal = d.weekly.reduce((a, w) => a + w.value, 0);

  return (
    <section className="kc-page" aria-label="Dashboard grafik" style={{ gap: 16 }}>
      <div className="kc-tiles">
        <div className="kc-tile">
          <div className="kc-tile-top">
            <span className="kc-tile-icon"><i className="fa-solid fa-user-check" aria-hidden="true"></i></span>
            <span className="kc-tile-label">Peserta aktif 7 hari</span>
          </div>
          <span className="kc-tile-num">
            {d.active7}<small style={{ fontSize: 16, color: 'var(--muted)' }}> / {d.participants.length}</small>
          </span>
          <div className="kc-tile-meta">Mengisi minimal satu logbook</div>
        </div>
        <div className="kc-tile">
          <div className="kc-tile-top">
            <span className="kc-tile-icon"><i className="fa-solid fa-book" aria-hidden="true"></i></span>
            <span className="kc-tile-label">Logbook 30 hari</span>
          </div>
          <span className="kc-tile-num">{d.logs30.length}</span>
          <div className="kc-tile-meta">Seluruh peserta</div>
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
      </div>

      <div className="kc-grid-3-1">
        <div className="kc-card">
          <div>
            <h3 className="kc-section-title">Tren logbook mingguan</h3>
            <p className="kc-muted kc-small" style={{ margin: '2px 0 0' }}>
              Jumlah logbook per minggu, 8 minggu terakhir. Sumber: tabel logbook.
            </p>
          </div>
          {weeklyTotal === 0 ? (
            <ChartEmpty text="Belum ada logbook dalam 8 minggu terakhir." />
          ) : (
            <AreaLine
              points={d.weekly.map((w) => ({ label: w.label, value: w.value }))}
              label={`Tren logbook mingguan, total ${weeklyTotal} logbook dalam 8 minggu.`}
            />
          )}
        </div>

        <div className="kc-card">
          <div>
            <h3 className="kc-section-title">Status logbook</h3>
            <p className="kc-muted kc-small" style={{ margin: '2px 0 0' }}>30 hari terakhir</p>
          </div>
          {d.logs30.length === 0 ? (
            <ChartEmpty />
          ) : (
            <Donut
              centerValue={String(d.logs30.length)}
              centerLabel="logbook"
              label={`Status ${d.logs30.length} logbook: ${d.totals.approved} disetujui, ${d.totals.submitted} menunggu, ${d.totals.rejected} revisi.`}
              slices={(['approved', 'submitted', 'rejected', 'draft'] as const).map((k) => ({
                label: STATUS_META[k].label,
                value: d.totals[k],
                color: STATUS_META[k].color,
              }))}
            />
          )}
        </div>
      </div>

      <div className="kc-grid-2">
        <div className="kc-card">
          <div>
            <h3 className="kc-section-title">Peserta per divisi</h3>
            <p className="kc-muted kc-small" style={{ margin: '2px 0 0' }}>Sumber: profil peserta</p>
          </div>
          {d.byDivision.length === 0 ? (
            <ChartEmpty />
          ) : (
            <HBars
              label="Jumlah peserta per divisi"
              rows={d.byDivision.map((r) => ({ label: r.label, value: r.value, display: `${r.value} peserta` }))}
            />
          )}
        </div>

        <div className="kc-card">
          <div>
            <h3 className="kc-section-title">Beban bimbingan mentor</h3>
            <p className="kc-muted kc-small" style={{ margin: '2px 0 0' }}>Jumlah peserta per mentor pembimbing</p>
          </div>
          {d.byMentor.length === 0 ? (
            <ChartEmpty />
          ) : (
            <HBars
              color="var(--s2)"
              label="Jumlah peserta per mentor"
              rows={d.byMentor.map((r) => ({ label: r.label, value: r.value, display: `${r.value} peserta` }))}
            />
          )}
        </div>
      </div>

      <div className="kc-card">
        <div>
          <h3 className="kc-section-title">Komposisi pengguna</h3>
          <p className="kc-muted kc-small" style={{ margin: '2px 0 0' }}>Jumlah akun menurut peran</p>
        </div>
        <Donut
          centerValue={String(people.length)}
          centerLabel="akun"
          label={`Komposisi ${people.length} akun menurut peran.`}
          slices={[
            { label: d.roles[0].label, value: d.roles[0].value, color: 'var(--s1)' },
            { label: d.roles[1].label, value: d.roles[1].value, color: 'var(--s2)' },
            { label: d.roles[2].label, value: d.roles[2].value, color: 'var(--s3)' },
          ]}
        />
      </div>
    </section>
  );
}
