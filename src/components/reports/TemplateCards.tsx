'use client';

import type { TemplateConfig } from '@/lib/reports/template';

export type TemplateCardItem = { key: string; name: string; config: TemplateConfig; builtIn?: boolean };

type Props = {
  items: TemplateCardItem[];
  activeKey: string;
  editingKey: string | null;
  onActivate: (key: string, on: boolean) => void;
  onEdit: (key: string) => void;
  onNew: () => void;
};

/** Daftar template sebagai kartu. Centang "Aktifkan" menentukan template yang dipakai untuk cetak. */
export function TemplateCards({ items, activeKey, editingKey, onActivate, onEdit, onNew }: Props) {
  return (
    <div className="space-y-3">
      <div className="kc-card-row" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <p className="kc-eyebrow" style={{ margin: 0 }}>Daftar template</p>
        <button type="button" className="kc-btn kc-btn-primary" onClick={onNew}>
          <i className="fa-solid fa-plus" aria-hidden="true"></i> Template baru
        </button>
      </div>
      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {items.map((t) => {
          const active = t.key === activeKey;
          const editing = t.key === editingKey;
          const visibleCols = t.config.columns.filter((c) => c.visible).length;
          return (
            <li
              key={t.key}
              className="kc-card"
              style={{
                gap: 8,
                outline: editing ? '2px solid var(--brand, #0B6E6C)' : 'none',
                borderRadius: 20,
              }}
            >
              <div className="kc-card-row" style={{ justifyContent: 'space-between' }}>
                <span className="kc-chip kc-chip-na">{t.builtIn ? 'Bawaan' : 'Template saya'}</span>
                {active && <span className="kc-chip kc-chip-good">Dipakai cetak</span>}
              </div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{t.name}</h3>
              <p className="kc-small kc-muted" style={{ margin: 0 }}>
                {t.config.title} · {visibleCols} kolom tabel · {t.config.progress.enabled ? 'dengan blok progres' : 'tanpa blok progres'}
              </p>
              <div className="kc-card-row" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                <label className="kc-small" style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                  <input type="checkbox" checked={active} onChange={(e) => onActivate(t.key, e.target.checked)} />
                  Aktifkan
                </label>
                <button type="button" className="kc-btn" onClick={() => onEdit(t.key)}>
                  <i className="fa-solid fa-pen" aria-hidden="true"></i> {t.builtIn ? 'Lihat' : 'Edit'}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
