/**
 * Grafik SVG ringan untuk dashboard KINRA.
 * Warna lewat token CSS (var(--s1), var(--s2), …) sehingga mengikuti Panduan UI/UX bagian 3.3.
 * Setiap grafik punya role="img" + aria-label berisi angka kunci (bagian 10).
 */

type Series = { key: string; label: string; color: string };

/** Batas atas sumbu yang habis dibagi 4 (4, 8, 12, 20, 40, 80, 120, …) agar tick rata. */
const nice = (max: number) => {
  let base = 4;
  for (let guard = 0; guard < 12; guard++) {
    for (const k of [1, 2, 3, 5]) {
      if (base * k >= max) return base * k;
    }
    base *= 10;
  }
  return Math.ceil(max / 4) * 4;
};

const lastPositive = (a: number[]) => {
  for (let i = a.length - 1; i >= 0; i--) if (a[i] > 0) return i;
  return -1;
};

export function Legend({ items }: { items: { label: string; color: string; value?: string }[] }) {
  return (
    <ul className="kc-legend">
      {items.map((i) => (
        <li key={i.label}>
          <i style={{ background: i.color }} aria-hidden="true" />
          <span>{i.label}</span>
          {i.value !== undefined && <b className="tnum">{i.value}</b>}
        </li>
      ))}
    </ul>
  );
}

export function ChartEmpty({ text = 'Belum ada data untuk ditampilkan.' }: { text?: string }) {
  return <div className="kc-chart-empty">{text}</div>;
}

/* ---------- Batang bertumpuk (mis. logbook per hari, per status) ---------- */
export function StackedBars({
  rows,
  series,
  label,
  xLabel,
}: {
  rows: { key: string; values: number[] }[];
  series: Series[];
  label: string;
  xLabel: (key: string, index: number) => string | null;
}) {
  const W = 640;
  const H = 230;
  const L = 34;
  const B = 26;
  const T = 10;
  const totals = rows.map((r) => r.values.reduce((a, b) => a + b, 0));
  const max = nice(Math.max(...totals, 1));
  const innerW = W - L - 6;
  const innerH = H - B - T;
  const slot = innerW / rows.length;
  const bw = Math.min(26, slot * 0.62);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="kc-svg">
      {ticks.map((t, i) => {
        const y = T + innerH - (t / max) * innerH;
        return (
          <g key={`${t}-${i}`}>
            <line x1={L} x2={W - 6} y1={y} y2={y} stroke="var(--line-2)" strokeDasharray={t === 0 ? undefined : '3 4'} />
            <text x={L - 8} y={y + 3.5} textAnchor="end" className="kc-axis">{t}</text>
          </g>
        );
      })}
      {rows.map((r, i) => {
        const x = L + slot * i + (slot - bw) / 2;
        let acc = 0;
        const total = totals[i];
        const xl = xLabel(r.key, i);
        return (
          <g key={r.key}>
            <title>{`${xLabel(r.key, i) ?? r.key}: ${total} logbook`}</title>
            {r.values.map((v, s) => {
              if (v === 0) return null;
              const h = (v / max) * innerH;
              const y = T + innerH - acc - h;
              acc += h;
              const top = s === lastPositive(r.values);
              return (
                <rect
                  key={series[s].key}
                  x={x}
                  y={y}
                  width={bw}
                  height={Math.max(h - 1, 1)}
                  rx={top ? 4 : 0}
                  fill={series[s].color}
                />
              );
            })}
            {xl && (
              <text x={x + bw / 2} y={H - 8} textAnchor="middle" className="kc-axis">{xl}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* ---------- Garis + area (tren) ---------- */
export function AreaLine({
  points,
  label,
  color = 'var(--s1)',
}: {
  points: { label: string; value: number }[];
  label: string;
  color?: string;
}) {
  const W = 640;
  const H = 230;
  const L = 34;
  const B = 26;
  const T = 14;
  const max = nice(Math.max(...points.map((p) => p.value), 1));
  const innerW = W - L - 14;
  const innerH = H - B - T;
  const step = points.length > 1 ? innerW / (points.length - 1) : 0;
  const xy = points.map((p, i) => ({
    x: L + 7 + step * i,
    y: T + innerH - (p.value / max) * innerH,
    ...p,
  }));
  const line = xy.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const area = `${line} L${xy[xy.length - 1].x.toFixed(1)},${T + innerH} L${xy[0].x.toFixed(1)},${T + innerH} Z`;
  const ticks = [0, 0.5, 1].map((f) => Math.round(max * f));
  const gid = `g-${color.replace(/[^a-z0-9]/gi, '')}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="kc-svg">
      <defs>
        <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.32" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {ticks.map((t, i) => {
        const y = T + innerH - (t / max) * innerH;
        return (
          <g key={`${t}-${i}`}>
            <line x1={L} x2={W - 6} y1={y} y2={y} stroke="var(--line-2)" strokeDasharray={t === 0 ? undefined : '3 4'} />
            <text x={L - 8} y={y + 3.5} textAnchor="end" className="kc-axis">{t}</text>
          </g>
        );
      })}
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {xy.map((p) => (
        <g key={p.label}>
          <title>{`Minggu ${p.label}: ${p.value} logbook`}</title>
          <circle cx={p.x} cy={p.y} r="4.5" fill={color} stroke="var(--surface)" strokeWidth="2" />
          <text x={p.x} y={H - 8} textAnchor="middle" className="kc-axis">{p.label}</text>
        </g>
      ))}
    </svg>
  );
}

/* ---------- Donat ---------- */
export function Donut({
  slices,
  centerValue,
  centerLabel,
  label,
}: {
  slices: { label: string; value: number; color: string }[];
  centerValue: string;
  centerLabel: string;
  label: string;
}) {
  const total = slices.reduce((a, s) => a + s.value, 0);
  const R = 62;
  const C = 2 * Math.PI * R;
  let offset = 0;

  return (
    <div className="kc-donut">
      <svg viewBox="0 0 160 160" role="img" aria-label={label} className="kc-donut-svg">
        <circle cx="80" cy="80" r={R} fill="none" stroke="var(--surface-3)" strokeWidth="20" />
        {total > 0 &&
          slices
            .filter((s) => s.value > 0)
            .map((s) => {
              const len = (s.value / total) * C;
              const gap = slices.filter((x) => x.value > 0).length > 1 ? 2 : 0;
              const el = (
                <circle
                  key={s.label}
                  cx="80"
                  cy="80"
                  r={R}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="20"
                  strokeDasharray={`${Math.max(len - gap, 0)} ${C - Math.max(len - gap, 0)}`}
                  strokeDashoffset={-offset}
                  transform="rotate(-90 80 80)"
                >
                  <title>{`${s.label}: ${s.value}`}</title>
                </circle>
              );
              offset += len;
              return el;
            })}
        <text x="80" y="78" textAnchor="middle" className="kc-donut-num">{centerValue}</text>
        <text x="80" y="97" textAnchor="middle" className="kc-axis">{centerLabel}</text>
      </svg>
      <Legend
        items={slices.map((s) => ({
          label: s.label,
          color: s.color,
          value: total > 0 ? `${s.value} (${Math.round((s.value / total) * 100)}%)` : '0',
        }))}
      />
    </div>
  );
}

/* ---------- Batang horizontal (peringkat) ---------- */
export function HBars({
  rows,
  color = 'var(--s1)',
  label,
  max,
}: {
  rows: { label: string; value: number; display?: string; sub?: string }[];
  color?: string;
  label: string;
  max?: number;
}) {
  const top = max ?? Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="kc-hbars" role="img" aria-label={label}>
      {rows.map((r) => (
        <li key={r.label}>
          <div className="kc-hbar-top">
            <span className="kc-hbar-label" title={r.label}>{r.label}</span>
            <b className="tnum">{r.display ?? r.value}</b>
          </div>
          <div className="kc-track">
            <i style={{ width: `${Math.max((r.value / top) * 100, r.value > 0 ? 2 : 0)}%`, background: color }} />
          </div>
          {r.sub && <span className="kc-small kc-muted">{r.sub}</span>}
        </li>
      ))}
    </ul>
  );
}
