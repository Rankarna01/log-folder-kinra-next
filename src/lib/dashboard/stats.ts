export type LogStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

export type LogLite = {
  user_id: string;
  date: string; // YYYY-MM-DD
  status: LogStatus;
  duration_minutes: number | null;
  work_location: string | null;
};

/** Warna status: satu warna = satu makna (Panduan UI/UX bagian 13). */
export const STATUS_META: Record<LogStatus, { label: string; color: string }> = {
  approved: { label: 'Disetujui', color: 'var(--s1)' },
  submitted: { label: 'Menunggu review', color: 'var(--s2)' },
  rejected: { label: 'Perlu revisi', color: 'var(--merah)' },
  draft: { label: 'Draf', color: 'var(--s3)' },
};

export const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

const pad = (n: number) => String(n).padStart(2, '0');
/** Tanggal lokal sebagai YYYY-MM-DD (tanpa pergeseran zona waktu). */
export const toKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export const shortDate = (key: string) => {
  const d = parseKey(key);
  return `${d.getDate()} ${BULAN[d.getMonth()]}`;
};

export function lastDays(n: number, today = new Date()): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    out.push(toKey(d));
  }
  return out;
}

export const isWeekday = (key: string) => {
  const g = parseKey(key).getDay();
  return g !== 0 && g !== 6;
};

export const fmtNum = (n: number, digits = 0) =>
  new Intl.NumberFormat('id-ID', { maximumFractionDigits: digits }).format(n);

export const hours = (minutes: number) => minutes / 60;

export function statusTotals(logs: LogLite[]): Record<LogStatus, number> {
  const t: Record<LogStatus, number> = { approved: 0, submitted: 0, rejected: 0, draft: 0 };
  logs.forEach((l) => {
    t[l.status] += 1;
  });
  return t;
}

/** Jumlah logbook per hari, dipisah per status (urutan sama dengan STACK_ORDER). */
export const STACK_ORDER: LogStatus[] = ['approved', 'submitted', 'rejected'];

export function dailyStacked(logs: LogLite[], days: string[]) {
  const idx = new Map(days.map((d, i) => [d, i]));
  const rows = days.map((d) => ({ key: d, values: STACK_ORDER.map(() => 0) }));
  logs.forEach((l) => {
    const i = idx.get(l.date);
    const s = STACK_ORDER.indexOf(l.status);
    if (i !== undefined && s >= 0) rows[i].values[s] += 1;
  });
  return rows;
}

/** Awal minggu (Senin) dari sebuah tanggal. */
function mondayOf(d: Date) {
  const g = (d.getDay() + 6) % 7;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - g);
}

/** Jumlah logbook per minggu untuk N minggu terakhir (termasuk minggu berjalan). */
export function weeklyCounts(logs: LogLite[], weeks: number, today = new Date()) {
  const start = mondayOf(new Date(today.getFullYear(), today.getMonth(), today.getDate() - (weeks - 1) * 7));
  const buckets = Array.from({ length: weeks }, (_, i) => {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i * 7);
    return { key: toKey(d), label: shortDate(toKey(d)), value: 0 };
  });
  logs.forEach((l) => {
    const m = toKey(mondayOf(parseKey(l.date)));
    const b = buckets.find((x) => x.key === m);
    if (b) b.value += 1;
  });
  return buckets;
}

export function countBy<T>(items: T[], pick: (t: T) => string | null | undefined, fallback = 'Belum diisi') {
  const m = new Map<string, number>();
  items.forEach((i) => {
    const k = (pick(i) || '').trim() || fallback;
    m.set(k, (m.get(k) || 0) + 1);
  });
  return [...m.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

export const norm = (s?: string | null) => (s || '').trim().toLowerCase();
