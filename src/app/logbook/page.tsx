'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LogbookModal } from '@/components/logbook/LogbookModal';

type MiniLog = { id: string; date: string; status: 'draft' | 'submitted' | 'approved' | 'rejected'; title: string; start_time: string; end_time: string };

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const WEEK = ['Sn', 'Sl', 'Rb', 'Km', 'Jm', 'Sb', 'Mg'];
const pad = (n: number) => String(n).padStart(2, '0');
const isoOf = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
const todayIso = () => {
  const t = new Date();
  return isoOf(t.getFullYear(), t.getMonth(), t.getDate());
};

const STATUS_STYLE: Record<MiniLog['status'], { cell: string; label: string; icon: string }> = {
  approved: { cell: 'kc-day-approved', label: 'Terverifikasi', icon: 'fa-lock' },
  submitted: { cell: 'kc-day-submitted', label: 'Menunggu review', icon: 'fa-hourglass-half' },
  rejected: { cell: 'kc-day-rejected', label: 'Perlu revisi', icon: 'fa-rotate-left' },
  draft: { cell: 'kc-day-submitted', label: 'Draf', icon: 'fa-pen' },
};

function CalendarInner() {
  const supabase = createClient();
  const params = useSearchParams();

  const initialDate = params.get('date');
  const [current, setCurrent] = useState(() => {
    const base = initialDate && /^\d{4}-\d{2}-\d{2}$/.test(initialDate) ? new Date(initialDate) : new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const [selected, setSelected] = useState<string>(() => (initialDate && /^\d{4}-\d{2}-\d{2}$/.test(initialDate) ? initialDate : todayIso()));
  const [modalDate, setModalDate] = useState<string | null>(() =>
    params.get('open') === '1' && initialDate && /^\d{4}-\d{2}-\d{2}$/.test(initialDate) ? initialDate : null
  );
  const [logs, setLogs] = useState<MiniLog[]>([]);
  const [reloadKey, setReloadKey] = useState(0);

  const year = current.getFullYear();
  const month = current.getMonth();

  useEffect(() => {
    let active = true;
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const first = isoOf(year, month, 1);
      const last = isoOf(year, month, new Date(year, month + 1, 0).getDate());
      const { data } = await supabase
        .from('logbooks')
        .select('id,date,status,title,start_time,end_time')
        .eq('user_id', user.id)
        .gte('date', first)
        .lte('date', last);
      if (active) setLogs((data as MiniLog[]) ?? []);
    }
    load();
    return () => {
      active = false;
    };
  }, [year, month, supabase, reloadKey]);

  const byDate = useMemo(() => new Map(logs.map((l) => [l.date, l])), [logs]);

  // Susun sel kalender, mulai dari Senin
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: ({ day: number; iso: string } | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, iso: isoOf(year, month, d) });

  const counts = useMemo(() => {
    const c = { approved: 0, submitted: 0, rejected: 0 };
    logs.forEach((l) => {
      if (l.status === 'approved') c.approved += 1;
      else if (l.status === 'rejected') c.rejected += 1;
      else c.submitted += 1;
    });
    return c;
  }, [logs]);

  const selectedLog = byDate.get(selected);
  // Navigasi dibatasi 6 bulan ke belakang dan 6 bulan ke depan dari bulan ini
  const now = new Date();
  const monthIndex = (d: Date) => d.getFullYear() * 12 + d.getMonth();
  const curIdx = monthIndex(new Date(year, month, 1));
  const baseIdx = monthIndex(new Date(now.getFullYear(), now.getMonth(), 1));
  const canGo = (n: number) => Math.abs(curIdx + n - baseIdx) <= 6;
  const shift = (n: number) => {
    if (canGo(n)) setCurrent(new Date(year, month + n, 1));
  };

  return (
    <div className="kc-cal">
      <header className="kc-cal-head">
        <button type="button" onClick={() => shift(-1)} disabled={!canGo(-1)} className="kc-cal-nav" aria-label="Bulan sebelumnya">
          <i className="fa-solid fa-chevron-left" aria-hidden="true"></i>
        </button>
        <h1>
          {MONTHS[month]} <span>{year}</span>
        </h1>
        <button type="button" onClick={() => shift(1)} disabled={!canGo(1)} className="kc-cal-nav" aria-label="Bulan berikutnya">
          <i className="fa-solid fa-chevron-right" aria-hidden="true"></i>
        </button>
      </header>

      <section className="kc-cal-card" aria-label="Kalender logbook">
        <div className="kc-cal-week">
          {WEEK.map((w) => (
            <span key={w}>{w}</span>
          ))}
        </div>
        <div className="kc-cal-grid">
          {cells.map((cell, i) => {
            if (!cell) return <span key={`e-${i}`} />;
            const log = byDate.get(cell.iso);
            const isToday = cell.iso === todayIso();
            const classes = [
              'kc-day',
              log ? STATUS_STYLE[log.status].cell : '',
              cell.iso === selected ? 'kc-day-selected' : '',
              isToday ? 'kc-day-today' : '',
            ].join(' ');
            return (
              <button
                disabled={cell.iso > todayIso()}
                key={cell.iso}
                type="button"
                className={classes}
                onClick={() => {
                  setSelected(cell.iso);
                  setModalDate(cell.iso);
                }}
                aria-label={`${cell.day} ${MONTHS[month]}${log ? `, ${STATUS_STYLE[log.status].label}` : ''}`}
              >
                {cell.day}
              </button>
            );
          })}
        </div>
      </section>

      <ul className="kc-cal-legend" aria-label="Keterangan status">
        <li><i className="kc-dot kc-dot-approved" aria-hidden="true"></i>Terverifikasi <b>{counts.approved}</b></li>
        <li><i className="kc-dot kc-dot-submitted" aria-hidden="true"></i>Menunggu <b>{counts.submitted}</b></li>
        <li><i className="kc-dot kc-dot-rejected" aria-hidden="true"></i>Revisi <b>{counts.rejected}</b></li>
      </ul>

      {modalDate ? (
        <div className="kc-cal-form">
          <LogbookModal
            key={modalDate}
            inline
            date={modalDate}
            onClose={() => setModalDate(null)}
            onChanged={() => setReloadKey((k) => k + 1)}
          />
        </div>
      ) : (
      <section className="kc-cal-day" aria-label="Logbook tanggal terpilih">
        <div className="kc-cal-day-head">
          <span className="kc-eyebrow">{selected}</span>
        </div>
        {selectedLog ? (
          <button type="button" className="kc-cal-entry" onClick={() => setModalDate(selected)}>
            <span className={`kc-cal-chip ${STATUS_STYLE[selectedLog.status].cell}`}>
              <i className={`fa-solid ${STATUS_STYLE[selectedLog.status].icon}`} aria-hidden="true"></i>
              {STATUS_STYLE[selectedLog.status].label}
            </span>
            <b>{selectedLog.title}</b>
            <small>{selectedLog.start_time.slice(0, 5)} – {selectedLog.end_time.slice(0, 5)}</small>
          </button>
        ) : (
          <div className="kc-cal-empty">
            <p>Belum ada logbook di tanggal ini.</p>
            <button type="button" className="kc-cal-add" onClick={() => setModalDate(selected)}>
              <i className="fa-solid fa-plus" aria-hidden="true"></i> Catat logbook
            </button>
          </div>
        )}
      </section>
      )}


    </div>
  );
}

export default function LogbookCalendarPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-zinc-500 text-center">Memuat kalender…</div>}>
      <CalendarInner />
    </Suspense>
  );
}
