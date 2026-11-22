'use client';

import {
  CELL_OPTIONS,
  COLUMN_OPTIONS,
  IDENTITY_OPTIONS,
  STATUS_OPTIONS,
  WEEKS,
  type CellColor,
  type ProgressRow,
  type StatusKey,
  type TemplateColumn,
  type TemplateConfig,
} from '@/lib/reports/template';

type Props = {
  name: string;
  onNameChange: (name: string) => void;
  draft: TemplateConfig;
  onChange: (next: TemplateConfig) => void;
  isNew: boolean;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
  onDelete: (() => void) | null;
};

const swap = <T,>(list: T[], a: number, b: number): T[] => {
  if (b < 0 || b >= list.length) return list;
  const next = [...list];
  [next[a], next[b]] = [next[b], next[a]];
  return next;
};

const fieldClass = 'mt-1 w-full rounded-[12px] bg-[#F4F7F6] border-0 px-3 py-2 text-xs text-[#111827]';

/** Editor template laporan: judul, kolom (label, lebar, tampil, urutan), dan teks bagian. */
export function TemplateEditor({ name, onNameChange, draft, onChange, isNew, saving, onSave, onCancel, onDelete }: Props) {

  const set = <K extends keyof TemplateConfig>(key: K, value: TemplateConfig[K]) => onChange({ ...draft, [key]: value });

  const updateColumn = (index: number, patch: Partial<TemplateColumn>) =>
    set('columns', draft.columns.map((c, i) => (i === index ? { ...c, ...patch } : c)));

  const moveColumn = (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= draft.columns.length) return;
    const next = [...draft.columns];
    [next[index], next[j]] = [next[j], next[index]];
    set('columns', next);
  };

  const addColumn = (key: TemplateColumn['key']) => {
    if (draft.columns.some((c) => c.key === key)) return;
    const option = COLUMN_OPTIONS.find((o) => o.key === key);
    set('columns', [...draft.columns, { key, label: option?.name ?? key, width: 10, visible: true }]);
  };

  const setProgress = (patch: Partial<TemplateConfig['progress']>) => set('progress', { ...draft.progress, ...patch });
  const setRow = (i: number, patch: Partial<ProgressRow>) =>
    setProgress({ rows: draft.progress.rows.map((r, j) => (j === i ? { ...r, ...patch } : r)) });
  const setCell = (i: number, kind: 'target' | 'real', w: number, value: CellColor) =>
    setRow(i, { [kind]: draft.progress.rows[i][kind].map((c, k) => (k === w ? value : c)) } as Partial<ProgressRow>);
  const emptyRow = (): ProgressRow => ({ name: 'Aktivitas baru', status: 'ongoing', target: Array(WEEKS).fill('none'), real: Array(WEEKS).fill('none') });
  const setSection = (i: number, patch: Partial<TemplateConfig['sections'][number]>) =>
    set('sections', draft.sections.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  const unused = COLUMN_OPTIONS.filter((o) => !draft.columns.some((c) => c.key === o.key));

  return (
    <div className="space-y-4">
      <section className="kc-card" style={{ gap: 10 }}>
        <p className="kc-eyebrow" style={{ margin: 0 }}>Judul dan identitas</p>
        <label className="kc-small">
          Judul laporan
          <input className={fieldClass} value={draft.title} onChange={(e) => set('title', e.target.value)} />
        </label>
        <p className="kc-small kc-muted" style={{ margin: 0 }}>
          Header tampil dua kolom per baris. Baris &quot;otomatis&quot; diisi dari data akun atau periode, sedangkan baris teks bisa diisi bebas.
        </p>
        <ul className="kc-attn" style={{ margin: 0 }}>
          {draft.header.map((item, i) => (
            <li key={i} style={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                className={fieldClass}
                style={{ width: 170, marginTop: 0 }}
                value={item.label}
                aria-label={`Label header ${i + 1}`}
                onChange={(e) => set('header', draft.header.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
              />
              {item.source ? (
                <span className="kc-small kc-muted" style={{ flex: 1, minWidth: 180 }}>
                  Otomatis: {IDENTITY_OPTIONS.find((o) => o.source === item.source)?.name ?? item.source}
                </span>
              ) : (
                <input
                  className={fieldClass}
                  style={{ flex: 1, minWidth: 220, marginTop: 0 }}
                  value={item.value}
                  placeholder="Isi teks header"
                  aria-label={`Nilai header ${i + 1}`}
                  onChange={(e) => set('header', draft.header.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))}
                />
              )}
              <button type="button" className="kc-btn" disabled={i === 0} onClick={() => set('header', swap(draft.header, i, i - 1))} aria-label="Naikkan baris header">
                <i className="fa-solid fa-arrow-up" aria-hidden="true"></i>
              </button>
              <button type="button" className="kc-btn" disabled={i === draft.header.length - 1} onClick={() => set('header', swap(draft.header, i, i + 1))} aria-label="Turunkan baris header">
                <i className="fa-solid fa-arrow-down" aria-hidden="true"></i>
              </button>
              <button type="button" className="kc-btn kc-btn-danger" onClick={() => set('header', draft.header.filter((_, j) => j !== i))} aria-label="Hapus baris header">
                <i className="fa-solid fa-trash-can" aria-hidden="true"></i>
              </button>
            </li>
          ))}
        </ul>
        <div className="kc-card-row" style={{ flexWrap: 'wrap', gap: 6 }}>
          <button type="button" className="kc-btn" onClick={() => set('header', [...draft.header, { label: 'Keterangan', value: '' }])}>
            <i className="fa-solid fa-plus" aria-hidden="true"></i> Tambah baris teks
          </button>
          {IDENTITY_OPTIONS.filter((o) => !draft.header.some((h) => h.source === o.source)).map((o) => (
            <button
              key={o.source}
              type="button"
              className="kc-btn"
              onClick={() => set('header', [...draft.header, { label: o.name, value: '', source: o.source }])}
            >
              <i className="fa-solid fa-plus" aria-hidden="true"></i> {o.name} (otomatis)
            </button>
          ))}
        </div>
      </section>

      <section className="kc-card" style={{ gap: 10 }}>
        <p className="kc-eyebrow" style={{ margin: 0 }}>Kolom tabel</p>
        <ul className="kc-attn" style={{ margin: 0 }}>
          {draft.columns.map((c, i) => (
            <li key={`${c.key}-${i}`} style={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <label className="kc-small" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="checkbox" checked={c.visible} onChange={(e) => updateColumn(i, { visible: e.target.checked })} />
                Tampil
              </label>
              <input
                className={fieldClass}
                style={{ flex: 1, minWidth: 140, marginTop: 0 }}
                value={c.label}
                aria-label={`Judul kolom ${c.key}`}
                onChange={(e) => updateColumn(i, { label: e.target.value })}
              />
              <label className="kc-small" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                Lebar
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={c.width}
                  onChange={(e) => updateColumn(i, { width: Math.max(1, Number(e.target.value) || 1) })}
                  className={fieldClass}
                  style={{ width: 70, marginTop: 0 }}
                />
              </label>
              <span className="kc-small kc-muted" style={{ minWidth: 110 }}>
                {COLUMN_OPTIONS.find((o) => o.key === c.key)?.name ?? c.key}
              </span>
              <button type="button" className="kc-btn" onClick={() => moveColumn(i, -1)} aria-label="Naikkan kolom" disabled={i === 0}>
                <i className="fa-solid fa-arrow-up" aria-hidden="true"></i>
              </button>
              <button type="button" className="kc-btn" onClick={() => moveColumn(i, 1)} aria-label="Turunkan kolom" disabled={i === draft.columns.length - 1}>
                <i className="fa-solid fa-arrow-down" aria-hidden="true"></i>
              </button>
              <button type="button" className="kc-btn kc-btn-danger" onClick={() => set('columns', draft.columns.filter((_, j) => j !== i))} aria-label="Hapus kolom">
                <i className="fa-solid fa-trash-can" aria-hidden="true"></i>
              </button>
            </li>
          ))}
        </ul>
        {unused.length > 0 && (
          <div className="kc-card-row" style={{ flexWrap: 'wrap', gap: 6 }}>
            <span className="kc-small kc-muted">Tambah kolom:</span>
            {unused.map((o) => (
              <button key={o.key} type="button" className="kc-btn" onClick={() => addColumn(o.key)}>
                <i className="fa-solid fa-plus" aria-hidden="true"></i> {o.name}
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="kc-card" style={{ gap: 10 }}>
        <p className="kc-eyebrow" style={{ margin: 0 }}>Judul bagian dan catatan</p>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          <label className="kc-small">
            Bagian ringkasan
            <input className={fieldClass} value={draft.headings.summary} onChange={(e) => set('headings', { ...draft.headings, summary: e.target.value })} />
          </label>
          <label className="kc-small">
            Bagian kendala
            <input className={fieldClass} value={draft.headings.obstacles} onChange={(e) => set('headings', { ...draft.headings, obstacles: e.target.value })} />
          </label>
          <label className="kc-small">
            Bagian catatan mentor
            <input className={fieldClass} value={draft.headings.mentorNotes} onChange={(e) => set('headings', { ...draft.headings, mentorNotes: e.target.value })} />
          </label>
        </div>
        <label className="kc-small">
          Catatan kaki (opsional)
          <textarea className={fieldClass} rows={2} value={draft.footnote} onChange={(e) => set('footnote', e.target.value)} />
        </label>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <label className="kc-small">
            Label tanda tangan kiri
            <input className={fieldClass} value={draft.signLeft} onChange={(e) => set('signLeft', e.target.value)} />
          </label>
          <label className="kc-small">
            Label tanda tangan kanan
            <input className={fieldClass} value={draft.signRight} onChange={(e) => set('signRight', e.target.value)} />
          </label>
        </div>
      </section>

      <section className="kc-card" style={{ gap: 10 }}>
        <div className="kc-card-row" style={{ flexWrap: 'wrap', gap: 8 }}>
          <p className="kc-eyebrow" style={{ margin: 0 }}>Blok progres</p>
          <label className="kc-small" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={draft.progress.enabled} onChange={(e) => setProgress({ enabled: e.target.checked })} />
            Tampilkan blok progres
          </label>
        </div>
        {draft.progress.enabled && (
          <>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <label className="kc-small">
                Label persentase
                <input className={fieldClass} value={draft.progress.percentLabel} onChange={(e) => setProgress({ percentLabel: e.target.value })} />
              </label>
              <label className="kc-small">
                Persentase progres (%)
                <input
                  type="number"
                  min={0}
                  max={100}
                  className={fieldClass}
                  value={draft.progress.percent}
                  onChange={(e) => setProgress({ percent: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })}
                />
              </label>
            </div>

            <p className="kc-small kc-muted" style={{ margin: 0 }}>
              Tiap aktivitas punya status (titik warna) dan warna sel per minggu untuk baris Target dan Real.
            </p>
            <ul className="kc-attn" style={{ margin: 0 }}>
              {draft.progress.rows.map((r, i) => (
                <li key={i} style={{ flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
                  <div className="kc-card-row" style={{ flexWrap: 'wrap', gap: 6 }}>
                    <input className={fieldClass} style={{ flex: 1, minWidth: 220, marginTop: 0 }} value={r.name} aria-label={`Nama aktivitas ${i + 1}`} onChange={(e) => setRow(i, { name: e.target.value })} />
                    <select className="kc-small" value={r.status} aria-label={`Status aktivitas ${i + 1}`} onChange={(e) => setRow(i, { status: e.target.value as StatusKey })}>
                      {STATUS_OPTIONS.map((o) => (
                        <option key={o.key} value={o.key}>{o.name}</option>
                      ))}
                    </select>
                    <button type="button" className="kc-btn" disabled={i === 0} onClick={() => setProgress({ rows: swap(draft.progress.rows, i, i - 1) })} aria-label="Naikkan aktivitas">
                      <i className="fa-solid fa-arrow-up" aria-hidden="true"></i>
                    </button>
                    <button type="button" className="kc-btn" disabled={i === draft.progress.rows.length - 1} onClick={() => setProgress({ rows: swap(draft.progress.rows, i, i + 1) })} aria-label="Turunkan aktivitas">
                      <i className="fa-solid fa-arrow-down" aria-hidden="true"></i>
                    </button>
                    <button type="button" className="kc-btn kc-btn-danger" onClick={() => setProgress({ rows: draft.progress.rows.filter((_, j) => j !== i) })} aria-label="Hapus aktivitas">
                      <i className="fa-solid fa-trash-can" aria-hidden="true"></i>
                    </button>
                  </div>
                  {(['target', 'real'] as const).map((kind) => (
                    <div key={kind} className="kc-card-row" style={{ flexWrap: 'wrap', gap: 6 }}>
                      <span className="kc-small kc-muted" style={{ width: 90 }}>{kind === 'target' ? 'Target' : 'Real'} per minggu</span>
                      {Array.from({ length: WEEKS }, (_, w) => (
                        <label key={w} className="kc-small" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          M{w + 1}
                          <select
                            className="kc-small"
                            value={r[kind][w] ?? 'none'}
                            aria-label={`${kind === 'target' ? 'Target' : 'Real'} aktivitas ${i + 1} minggu ${w + 1}`}
                            style={{ background: CELL_OPTIONS.find((o) => o.key === (r[kind][w] ?? 'none'))?.color }}
                            onChange={(e) => setCell(i, kind, w, e.target.value as CellColor)}
                          >
                            {CELL_OPTIONS.map((o) => (
                              <option key={o.key} value={o.key}>{o.name}</option>
                            ))}
                          </select>
                        </label>
                      ))}
                    </div>
                  ))}
                </li>
              ))}
            </ul>
            <div>
              <button type="button" className="kc-btn" onClick={() => setProgress({ rows: [...draft.progress.rows, emptyRow()] })}>
                <i className="fa-solid fa-plus" aria-hidden="true"></i> Tambah aktivitas
              </button>
            </div>

            <p className="kc-eyebrow" style={{ margin: '6px 0 0' }}>Bagian teks di samping progres</p>
            <p className="kc-small kc-muted" style={{ margin: 0 }}>Isi satu poin per baris. Contoh: Update sd Saat Ini, PICA, Next Actions.</p>
            {draft.sections.map((sec, i) => (
              <div key={i} className="kc-card-row" style={{ flexWrap: 'wrap', gap: 6, alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 240, display: 'grid', gap: 6 }}>
                  <input className={fieldClass} style={{ marginTop: 0 }} value={sec.title} aria-label={`Judul bagian ${i + 1}`} onChange={(e) => setSection(i, { title: e.target.value })} />
                  <textarea className={fieldClass} rows={3} value={sec.bullets.join('\n')} aria-label={`Poin bagian ${i + 1}`} onChange={(e) => setSection(i, { bullets: e.target.value.split('\n') })} />
                </div>
                <button type="button" className="kc-btn" disabled={i === 0} onClick={() => set('sections', swap(draft.sections, i, i - 1))} aria-label="Naikkan bagian">
                  <i className="fa-solid fa-arrow-up" aria-hidden="true"></i>
                </button>
                <button type="button" className="kc-btn" disabled={i === draft.sections.length - 1} onClick={() => set('sections', swap(draft.sections, i, i + 1))} aria-label="Turunkan bagian">
                  <i className="fa-solid fa-arrow-down" aria-hidden="true"></i>
                </button>
                <button type="button" className="kc-btn kc-btn-danger" onClick={() => set('sections', draft.sections.filter((_, j) => j !== i))} aria-label="Hapus bagian">
                  <i className="fa-solid fa-trash-can" aria-hidden="true"></i>
                </button>
              </div>
            ))}
            <div>
              <button type="button" className="kc-btn" onClick={() => set('sections', [...draft.sections, { title: 'Bagian baru', bullets: [] }])}>
                <i className="fa-solid fa-plus" aria-hidden="true"></i> Tambah bagian teks
              </button>
            </div>
          </>
        )}
      </section>

      <section className="kc-card" style={{ gap: 10 }}>
        <label className="kc-small">
          Nama template
          <input className={fieldClass} value={name} placeholder="Contoh: Laporan Mingguan Divisi IT" onChange={(e) => onNameChange(e.target.value)} />
        </label>
        <div className="kc-card-row" style={{ flexWrap: 'wrap', gap: 8 }}>
          <button type="button" className="kc-btn kc-btn-primary" disabled={saving} onClick={onSave}>
            <i className="fa-solid fa-floppy-disk" aria-hidden="true"></i> {isNew ? 'Simpan template' : 'Perbarui template'}
          </button>
          <button type="button" className="kc-btn" onClick={onCancel} disabled={saving}>Tutup editor</button>
          {onDelete && (
            <button type="button" className="kc-btn kc-btn-danger" disabled={saving} onClick={onDelete}>
              <i className="fa-solid fa-trash-can" aria-hidden="true"></i> Hapus
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
