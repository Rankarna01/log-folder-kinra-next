'use client';

import { Fragment, useMemo, useState, useEffect, useRef, type ReactNode } from 'react';
import type { Logbook, Profile } from '@/types/database';
import {
  CELL_OPTIONS,
  DEFAULT_TEMPLATE,
  STATUS_OPTIONS,
  WEEKS,
  type CellColor,
  type ColumnKey,
  type IdentitySource,
  type TemplateConfig,
} from '@/lib/reports/template';

const cellColor = (c: CellColor) => CELL_OPTIONS.find((o) => o.key === c)?.color ?? '#ffffff';
const statusColor = (k: string) => STATUS_OPTIONS.find((o) => o.key === k)?.color ?? '#9ca3af';

export const NAMES_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
export const DAYS_ID = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

export const parseIso = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const toIso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const fmtLong = (d: Date) => `${d.getDate()} ${NAMES_ID[d.getMonth()]} ${d.getFullYear()}`;

export const STATUS_LABEL: Record<Logbook['status'], string> = {
  draft: 'Draf',
  submitted: 'Menunggu review',
  approved: 'Disetujui',
  rejected: 'Perlu revisi',
};

const CENTER_KEYS: ColumnKey[] = ['date', 'time', 'duration', 'location', 'status', 'attachments'];
const BOLD_KEYS: ColumnKey[] = ['title'];
const PRE_KEYS: ColumnKey[] = ['description'];

type Props = {
  config?: TemplateConfig;
  profile: Profile | null;
  logs: Logbook[];
  /** Hari-hari dalam periode (untuk timeline). Timeline disembunyikan bila lebih dari 31 hari. */
  days: Date[];
  periodText: string;
  kindText: string;
};

function identityValue(source: IdentitySource, profile: Profile | null, periodText: string, kindText: string) {
  switch (source) {
    case 'name':
      return profile?.name || '–';
    case 'division':
      return profile?.division || '–';
    case 'position':
      return profile?.position || '–';
    case 'mentor':
      return profile?.mentor_name || '–';
    case 'period':
      return periodText;
    case 'kind':
      return kindText;
  }
}

function cellValue(l: Logbook, key: ColumnKey): ReactNode {
  switch (key) {
    case 'date': {
      const d = parseIso(l.date);
      return `${d.getDate()} ${NAMES_ID[d.getMonth()].slice(0, 3)}`;
    }
    case 'time':
      return `${l.start_time.slice(0, 5)}–${l.end_time.slice(0, 5)}`;
    case 'title':
      return l.title;
    case 'description':
      return l.final_description;
    case 'output':
      return l.output || '–';
    case 'location':
      return l.work_location === 'lapangan' ? 'Lapangan' : 'Kantor';
    case 'duration':
      return l.duration_minutes ? `${(l.duration_minutes / 60).toFixed(1)} jam` : '–';
    case 'status':
      return STATUS_LABEL[l.status];
    case 'attachments':
      return l.attachments?.length ?? 0;
    case 'obstacles':
      return l.obstacles || '–';
    case 'review_notes':
      return l.review_notes || '–';
  }
}

/** Lembar laporan cetak. Susunan dan teks mengikuti template yang dipilih. */
export function ReportSheet({ config, profile, logs, days, periodText, kindText }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const [containerWidth, setContainerWidth] = useState<number | null>(null);
  const [sheetHeight, setSheetHeight] = useState<number | null>(null);
  const [mode, setMode] = useState<'fit' | 'actual' | 'custom'>('fit');
  const [customZoom, setCustomZoom] = useState<number>(1);

  const BASE_WIDTH = 740;

  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
      if (sheetRef.current) {
        setSheetHeight(sheetRef.current.offsetHeight);
      }
    };

    measure();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(measure);
      if (containerRef.current) ro.observe(containerRef.current);
      if (sheetRef.current) ro.observe(sheetRef.current);
    }

    window.addEventListener('resize', measure);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  const autoFitScale = useMemo(() => {
    if (!containerWidth || containerWidth >= BASE_WIDTH) return 1;
    const available = Math.max(260, containerWidth - 4);
    return Math.round((available / BASE_WIDTH) * 100) / 100;
  }, [containerWidth]);

  const effectiveScale = useMemo(() => {
    if (!containerWidth || containerWidth >= BASE_WIDTH) return 1;
    if (mode === 'fit') return autoFitScale;
    if (mode === 'actual') return 1;
    return customZoom;
  }, [containerWidth, mode, autoFitScale, customZoom]);

  const isScaled = effectiveScale < 1 || (containerWidth !== null && containerWidth < BASE_WIDTH);

  const handleZoomIn = () => {
    setMode('custom');
    setCustomZoom((prev) => Math.min(1.4, Math.round((prev + 0.1) * 10) / 10));
  };

  const handleZoomOut = () => {
    setMode('custom');
    setCustomZoom((prev) => Math.max(0.3, Math.round((prev - 0.1) * 10) / 10));
  };

  const tpl = config ?? DEFAULT_TEMPLATE;

  const visibleCols = useMemo(() => {
    const cols = tpl.columns.filter((c) => c.visible);
    return cols.length ? cols : tpl.columns.slice(0, 1);
  }, [tpl.columns]);

  const totalWidth = visibleCols.reduce((acc, c) => acc + (c.width || 1), 0) || 1;

  const summary = useMemo(() => {
    const count = (s: Logbook['status']) => logs.filter((l) => l.status === s).length;
    const minutes = logs.reduce((acc, l) => acc + (l.duration_minutes || 0), 0);
    return {
      total: logs.length,
      approved: count('approved'),
      submitted: count('submitted'),
      rejected: count('rejected'),
      hours: Math.round((minutes / 60) * 10) / 10,
      attachments: logs.reduce((acc, l) => acc + (l.attachments?.length ?? 0), 0),
    };
  }, [logs]);

  const withObstacles = logs.filter((l) => l.obstacles);
  const withNotes = logs.filter((l) => l.status === 'rejected' && l.review_notes);

  return (
    <div ref={containerRef} className="rp-container w-full overflow-hidden">
      {/* Toolbar Kontrol Skala Pratinjau (khusus layar mobile agar tidak terpotong) */}
      {isScaled && (
        <div className="rp-preview-toolbar print:hidden mb-2.5 px-3 py-2 bg-[var(--surface-2)] border border-[var(--line-2)] rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-2xs select-none">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-file-invoice text-[var(--brand)] text-xs" aria-hidden="true"></i>
            <span className="font-bold text-xs text-[var(--ink)]">Pratinjau Lembar</span>
            <span className="px-2 py-0.5 rounded-full bg-[var(--surface-3)] text-[var(--ink)] font-mono text-[10.5px] font-bold">
              {Math.round(effectiveScale * 100)}%
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setMode('fit');
                setCustomZoom(autoFitScale);
              }}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                mode === 'fit'
                  ? 'bg-[var(--tosca)] text-white shadow-2xs'
                  : 'bg-[var(--surface)] text-[var(--ink-2)] border border-[var(--line-2)] hover:bg-[var(--surface-3)]'
              }`}
              title="Kecilkan agar pas di layar dan tidak terpotong"
            >
              <i className="fa-solid fa-compress text-[10px]"></i>
              <span>Pas Layar</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('actual');
                setCustomZoom(1);
              }}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                mode === 'actual'
                  ? 'bg-[var(--tosca)] text-white shadow-2xs'
                  : 'bg-[var(--surface)] text-[var(--ink-2)] border border-[var(--line-2)] hover:bg-[var(--surface-3)]'
              }`}
              title="Ukuran asli 100% (bisa digeser ke samping)"
            >
              <i className="fa-solid fa-expand text-[10px]"></i>
              <span>100%</span>
            </button>

            <div className="h-4 w-px bg-[var(--line-2)] mx-0.5 hidden sm:block" />

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleZoomOut}
                className="w-7 h-7 rounded-lg bg-[var(--surface)] border border-[var(--line-2)] text-[var(--ink-2)] hover:bg-[var(--surface-3)] flex items-center justify-center transition cursor-pointer"
                aria-label="Perkecil pratinjau"
                title="Perkecil"
              >
                <i className="fa-solid fa-minus text-[10px]"></i>
              </button>

              <button
                type="button"
                onClick={handleZoomIn}
                className="w-7 h-7 rounded-lg bg-[var(--surface)] border border-[var(--line-2)] text-[var(--ink-2)] hover:bg-[var(--surface-3)] flex items-center justify-center transition cursor-pointer"
                aria-label="Perbesar pratinjau"
                title="Perbesar"
              >
                <i className="fa-solid fa-plus text-[10px]"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kontainer scroll & scale viewport */}
      <div
        className="rp-scroll-viewport"
        style={{
          width: '100%',
          overflowX: effectiveScale < 1 && mode === 'fit' ? 'hidden' : 'auto',
          overflowY: 'hidden',
          height:
            effectiveScale < 1 && sheetHeight
              ? `${Math.ceil(sheetHeight * effectiveScale) + 6}px`
              : 'auto',
          transition: 'height 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      >
        <div
          ref={sheetRef}
          id="print-area"
          className="rp-sheet"
          style={{
            width: isScaled ? `${BASE_WIDTH}px` : '100%',
            minWidth: isScaled ? `${BASE_WIDTH}px` : undefined,
            transform: effectiveScale !== 1 ? `scale(${effectiveScale})` : undefined,
            transformOrigin: 'top left',
            transition: 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
          }}
        >
          <div className="rp-head">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/logo/danantara-logo.png" alt="Danantara Indonesia" className="rp-logo-left" />
        <h1 className="rp-title">{tpl.title}</h1>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/logo/kinra-logo.png" alt="KINRA Sei Mangkei" className="rp-logo-right" />
      </div>

      <table className="rp-table rp-ident">
        <tbody>
          {Array.from({ length: Math.ceil(tpl.header.length / 2) }, (_, row) => (
            <tr key={row}>
              {[tpl.header[row * 2], tpl.header[row * 2 + 1]].map((item, col) =>
                item ? (
                  <FragmentPair
                    key={col}
                    label={item.label}
                    value={item.source ? identityValue(item.source, profile, periodText, kindText) : item.value || '–'}
                  />
                ) : (
                  <td key={col} colSpan={2} />
                )
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {tpl.progress.enabled && (
        <div className="rp-prog">
          <div className="rp-pct">
            <span className="rp-pct-lab">{tpl.progress.percentLabel || 'S.d saat ini'}</span>
            <span className="rp-pct-bar" aria-hidden="true">
              <span style={{ width: `${Math.min(100, Math.max(0, tpl.progress.percent))}%` }} />
            </span>
            <b className="rp-pct-val">{Math.min(100, Math.max(0, tpl.progress.percent))}%</b>
          </div>

          <div className="rp-prog-grid">
            <div>
              <table className="rp-table rp-ptable">
                <thead>
                  <tr>
                    <th rowSpan={2}>Progress</th>
                    <th rowSpan={2} style={{ width: 60 }}>Status</th>
                    <th colSpan={WEEKS + 1}>Timeline</th>
                  </tr>
                  <tr>
                    <th style={{ width: 60 }}>Minggu</th>
                    {Array.from({ length: WEEKS }, (_, w) => (
                      <th key={w} style={{ width: 36 }}>{w + 1}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tpl.progress.rows.map((r, i) => (
                    <Fragment key={i}>
                      <tr>
                        <td rowSpan={2} className="b">{r.name}</td>
                        <td rowSpan={2} className="c">
                          <span className="rp-dot" style={{ background: statusColor(r.status) }} />
                        </td>
                        <td className="c">Target</td>
                        {Array.from({ length: WEEKS }, (_, w) => (
                          <td key={w} className="rp-cell" style={{ background: cellColor(r.target[w] ?? 'none') }} />
                        ))}
                      </tr>
                      <tr>
                        <td className="c">Real</td>
                        {Array.from({ length: WEEKS }, (_, w) => (
                          <td key={w} className="rp-cell" style={{ background: cellColor(r.real[w] ?? 'none') }} />
                        ))}
                      </tr>
                    </Fragment>
                  ))}
                </tbody>
              </table>
              <div className="rp-legend">
                {STATUS_OPTIONS.map((o) => (
                  <span key={o.key}><i style={{ background: o.color }} /> {o.name}</span>
                ))}
              </div>
            </div>

            <aside className="rp-side">
              {tpl.sections.map((sec, i) => (
                <Fragment key={i}>
                  <div className="rp-sec">{sec.title}</div>
                  <ul>
                    {sec.bullets.filter((b) => b.trim()).length === 0 ? (
                      <li className="kc-muted">–</li>
                    ) : (
                      sec.bullets.filter((b) => b.trim()).map((b, j) => <li key={j}>{b}</li>)
                    )}
                  </ul>
                </Fragment>
              ))}
            </aside>
          </div>
        </div>
      )}

      <div className="rp-body">
        <div className="rp-main">
          {logs.length === 0 ? (
            <div className="rp-empty">Belum ada logbook pada periode ini.</div>
          ) : (
            <table className="rp-table rp-detail">
              <thead>
                <tr>
                  <th style={{ width: '4%' }}>No</th>
                  {visibleCols.map((c) => (
                    <th key={c.key} style={{ width: `${((c.width || 1) / totalWidth) * 96}%` }}>{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((l, i) => (
                  <tr key={l.id}>
                    <td className="c">{i + 1}</td>
                    {visibleCols.map((c) => {
                      const cls = [
                        CENTER_KEYS.includes(c.key) ? 'c' : '',
                        BOLD_KEYS.includes(c.key) ? 'b' : '',
                        PRE_KEYS.includes(c.key) ? 'pre' : '',
                      ].join(' ').trim();
                      return <td key={c.key} className={cls}>{cellValue(l, c.key)}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <aside className="rp-side">
          <div className="rp-sec">{tpl.headings.summary}</div>
          <ul>
            <li>Hari tercatat: <b>{summary.total}</b>{days.length ? <> dari {days.length} hari</> : null}</li>
            <li>Disetujui: <b>{summary.approved}</b>, menunggu review: <b>{summary.submitted}</b>, perlu revisi: <b>{summary.rejected}</b></li>
            <li>Total jam tercatat: <b>{summary.hours} jam</b></li>
            <li>Lampiran bukti: <b>{summary.attachments}</b> berkas</li>
          </ul>

          <div className="rp-sec">{tpl.headings.obstacles}</div>
          <ul>
            {withObstacles.length === 0 ? (
              <li>Tidak ada kendala tercatat.</li>
            ) : (
              withObstacles.map((l) => (
                <li key={l.id}><b>{fmtLong(parseIso(l.date))}:</b> {l.obstacles}</li>
              ))
            )}
          </ul>

          {withNotes.length > 0 && (
            <>
              <div className="rp-sec">{tpl.headings.mentorNotes}</div>
              <ul>
                {withNotes.map((l) => (
                  <li key={l.id}><b>{fmtLong(parseIso(l.date))}:</b> {l.review_notes}</li>
                ))}
              </ul>
            </>
          )}
        </aside>
      </div>

      {tpl.footnote && <p className="rp-foot">{tpl.footnote}</p>}

      <div className="rp-sign">
        <div>
          <p>{tpl.signLeft}</p>
          <div className="rp-sign-space" />
          <p className="rp-sign-name">{profile?.name || '–'}</p>
        </div>
        <div>
          <p>{tpl.signRight}</p>
          <div className="rp-sign-space" />
          <p className="rp-sign-name">{profile?.mentor_name || '–'}</p>
        </div>
      </div>

      <style>{`
        .rp-sheet { background: #fff; color: #222; font-family: "Helvetica Neue", Arial, sans-serif; font-size: 11px; border-radius: 20px; padding: 22px; box-shadow: 0 1px 2px rgba(0,0,0,.06); }
        .rp-head { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 12px; margin-bottom: 10px; }
        .rp-logo-left { height: 40px; justify-self: start; }
        .rp-logo-right { height: 52px; justify-self: end; }
        .rp-title { margin: 0; text-align: center; color: #2e7d32; font-size: 19px; font-weight: 700; }
        .rp-table { width: 100%; border-collapse: collapse; }
        .rp-table th, .rp-table td { border: 1px solid #bbb; padding: 4px 6px; vertical-align: middle; text-align: left; }
        .rp-ident th { background: #7f7f7f; color: #fff; width: 13%; }
        .rp-ident td { width: 37%; }
        .rp-detail thead th { background: #7f7f7f; color: #fff; text-align: center; font-weight: 700; }
        .rp-detail td { vertical-align: top; font-size: 10px; }
        .rp-detail td.c { text-align: center; }
        .rp-detail td.b { font-weight: 700; }
        .rp-detail td.pre { white-space: pre-line; }
        .rp-timeline { margin: 10px 0; }
        .rp-timeline-row { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(0, 1fr); gap: 3px; }
        .rp-day { border-radius: 6px; padding: 4px 0; text-align: center; color: #fff; display: flex; flex-direction: column; gap: 1px; }
        .rp-day-name { font-size: 8px; opacity: .85; }
        .rp-day-num { font-weight: 700; font-size: 11px; }
        .rp-st-approved { background: #1e6b35; }
        .rp-st-submitted { background: #8bc34a; }
        .rp-st-rejected { background: #f5b400; color: #222 !important; }
        .rp-st-draft { background: #9ca3af; }
        .rp-st-empty { background: #eef2f1; color: #666 !important; }
        .rp-st-future { background: #f8faf9; color: #aaa !important; border: 1px dashed #ccc; }
        .rp-legend { display: flex; flex-wrap: wrap; gap: 12px; font-size: 9px; color: #555; margin: 6px 0 0; }
        .rp-legend i { display: inline-block; width: 10px; height: 10px; border-radius: 3px; margin-right: 4px; vertical-align: middle; }
        .rp-body { display: grid; grid-template-columns: minmax(0, 1fr) 270px; gap: 12px; margin-top: 8px; }
        .rp-side { border-left: 1px dashed #aaa; padding-left: 12px; }
        .rp-sec { background: #2f6b36; color: #fff; text-align: center; font-weight: 700; padding: 4px; margin: 6px 0; font-size: 11px; }
        .rp-side ul { margin: 0 0 4px 14px; padding: 0; }
        .rp-side li { margin-bottom: 4px; line-height: 1.35; }
        .rp-empty { border: 1px dashed #ccc; padding: 24px; text-align: center; color: #666; }
                .rp-prog { margin: 8px 0 10px; }
        .rp-pct { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
        .rp-pct-lab { background: #7f7f7f; color: #fff; font-weight: 700; padding: 4px 10px; }
        .rp-pct-bar { flex: 1; height: 16px; background: #e5f2e5; position: relative; }
        .rp-pct-bar > span { position: absolute; left: 0; top: 0; bottom: 0; background: #a9d18e; }
        .rp-pct-val { color: #2e7d32; font-size: 13px; min-width: 48px; text-align: right; }
        .rp-prog-grid { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr); gap: 12px; }
        .rp-ptable td, .rp-ptable th { padding: 3px 5px; }
        .rp-ptable th { background: #7f7f7f; color: #fff; text-align: center; font-weight: 700; }
        .rp-ptable td.c { text-align: center; }
        .rp-cell { height: 16px; }
        .rp-dot { display: inline-block; width: 12px; height: 12px; border-radius: 50%; }
        .rp-prog .rp-legend { margin-top: 4px; }
        .rp-prog .rp-legend i { width: 9px; height: 9px; border-radius: 50%; }
        .rp-foot { margin: 12px 0 0; font-size: 9px; color: #555; font-style: italic; }
        .rp-sign { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; text-align: center; margin-top: 16px; }
        .rp-sign-space { height: 56px; }
        .rp-sign-name { font-weight: 700; text-decoration: underline; margin: 0; }
        @media print {
          @page { size: A4 landscape; margin: 10mm; }
          body * { visibility: hidden !important; }
          #print-area, #print-area * { visibility: visible !important; }
          #print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            min-width: 0 !important;
            transform: none !important;
            padding: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          .rp-container, .rp-scroll-viewport {
            overflow: visible !important;
            height: auto !important;
            width: 100% !important;
          }
          .rp-preview-toolbar {
            display: none !important;
          }
          .rp-detail tr, .rp-side li { break-inside: avoid; }
        }
      `}</style>
        </div>
      </div>
    </div>
  );
}

/** Satu pasangan label-nilai pada baris identitas. */
function FragmentPair({ label, value }: { label: string; value: string }) {
  return (
    <>
      <th>{label}</th>
      <td>{value}</td>
    </>
  );
}
