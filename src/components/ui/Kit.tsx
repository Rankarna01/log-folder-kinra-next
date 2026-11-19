import type { ReactNode } from 'react';

/*
 * Komponen UI bersama untuk halaman KINRA (Panduan UI/UX bagian 6).
 * Gaya ada di globals.css dengan awalan kc-. Pakai komponen ini
 * alih-alih menulis ulang markup-nya di tiap halaman.
 */

type Tone = 'good' | 'warn' | 'serious' | 'crit' | 'na';

export function PageHead({
  eyebrow,
  title,
  lead,
  actions,
}: {
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="kc-head kc-head-row">
      <div>
        <p className="kc-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {lead && <p>{lead}</p>}
      </div>
      {actions && <div className="kc-head-actions">{actions}</div>}
    </header>
  );
}

export function StatTiles({ children, label = 'Ringkasan' }: { children: ReactNode; label?: string }) {
  return (
    <section className="kc-tiles" aria-label={label}>
      {children}
    </section>
  );
}

export function StatTile({
  icon,
  label,
  value,
  meta,
}: {
  icon: string;
  label: string;
  value: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <div className="kc-tile">
      <div className="kc-tile-top">
        <span className="kc-tile-icon" aria-hidden="true">
          <i className={icon}></i>
        </span>
        <span className="kc-tile-label">{label}</span>
      </div>
      <span className="kc-tile-num">{value}</span>
      {meta && <div className="kc-tile-meta">{meta}</div>}
    </div>
  );
}

const TONE_CLASS: Record<Tone, string> = {
  good: 'kc-chip-good',
  warn: 'kc-chip-warn',
  serious: 'kc-chip-serious',
  crit: 'kc-chip-serious',
  na: 'kc-chip-na',
};

export function Chip({ tone = 'na', icon, children }: { tone?: Tone; icon?: string; children: ReactNode }) {
  return (
    <span className={`kc-chip ${TONE_CLASS[tone]}`}>
      {icon && <i className={icon} aria-hidden="true"></i>}
      {children}
    </span>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="kc-empty">{children}</div>;
}

export function Skeleton({ height = 240 }: { height?: number }) {
  return <div className="kc-skeleton" aria-busy="true" style={{ height }} />;
}
