// Konfigurasi template laporan cetak. Disimpan sebagai JSON di tabel report_templates.

export type ColumnKey =
  | 'date'
  | 'time'
  | 'title'
  | 'description'
  | 'output'
  | 'location'
  | 'duration'
  | 'status'
  | 'attachments'
  | 'obstacles'
  | 'review_notes';

export const COLUMN_OPTIONS: { key: ColumnKey; name: string }[] = [
  { key: 'date', name: 'Tanggal' },
  { key: 'time', name: 'Jam' },
  { key: 'title', name: 'Judul kegiatan' },
  { key: 'description', name: 'Deskripsi' },
  { key: 'output', name: 'Output / hasil' },
  { key: 'location', name: 'Lokasi' },
  { key: 'duration', name: 'Durasi' },
  { key: 'status', name: 'Status' },
  { key: 'attachments', name: 'Jumlah bukti' },
  { key: 'obstacles', name: 'Kendala' },
  { key: 'review_notes', name: 'Catatan mentor' },
];

export type IdentitySource = 'name' | 'division' | 'position' | 'mentor' | 'period' | 'kind';

export const IDENTITY_OPTIONS: { source: IdentitySource; name: string }[] = [
  { source: 'name', name: 'Nama peserta' },
  { source: 'division', name: 'Divisi' },
  { source: 'position', name: 'Posisi' },
  { source: 'mentor', name: 'Mentor' },
  { source: 'period', name: 'Periode' },
  { source: 'kind', name: 'Jenis laporan' },
];

export type TemplateColumn = { key: ColumnKey; label: string; width: number; visible: boolean };

export type HeaderItem = { label: string; value: string; source?: IdentitySource };

// ---- Blok progres (seperti template progres divisi) ----

export type StatusKey = 'ongoing' | 'done' | 'delayed' | 'attention';

export const STATUS_OPTIONS: { key: StatusKey; name: string; color: string }[] = [
  { key: 'ongoing', name: 'Rencana / on-going', color: '#8bc34a' },
  { key: 'done', name: 'Selesai', color: '#1e6b35' },
  { key: 'delayed', name: 'Sedikit tertunda', color: '#f5b400' },
  { key: 'attention', name: 'Perlu perhatian khusus', color: '#d32f2f' },
];

export type CellColor = 'none' | 'light' | 'mid' | 'dark' | 'warn';

export const CELL_OPTIONS: { key: CellColor; name: string; color: string }[] = [
  { key: 'none', name: 'Kosong', color: '#ffffff' },
  { key: 'light', name: 'Hijau muda', color: '#a9d18e' },
  { key: 'mid', name: 'Hijau sedang', color: '#70ad47' },
  { key: 'dark', name: 'Hijau tua', color: '#2f6b36' },
  { key: 'warn', name: 'Kuning', color: '#ffd966' },
];

export const WEEKS = 4;

export type ProgressRow = {
  name: string;
  status: StatusKey;
  /** Warna sel per minggu (1–4), untuk baris Target dan Real. */
  target: CellColor[];
  real: CellColor[];
};

export type ProgressBlock = {
  enabled: boolean;
  percent: number;
  percentLabel: string;
  rows: ProgressRow[];
};

export type TextSection = { title: string; bullets: string[] };

export type TemplateConfig = {
  title: string;
  progress: ProgressBlock;
  /** Bagian teks di kolom kanan blok progres (mis. Update sd Saat Ini, PICA, Next Actions). */
  sections: TextSection[];
  /** Blok header di bawah judul, dua kolom per baris. Nilai dari data (source) otomatis terisi. */
  header: HeaderItem[];
  columns: TemplateColumn[];
  headings: { summary: string; obstacles: string; mentorNotes: string };
  footnote: string;
  signLeft: string;
  signRight: string;
};

export const DEFAULT_TEMPLATE: TemplateConfig = {
  title: 'Laporan Logbook Harian Peserta Magang',
  header: [
    { label: 'Program Strategis', value: 'Pengembangan aplikasi logbook harian peserta magang berbasis web (PWA), dengan cetak laporan PDF' },
    { label: 'PIC', value: 'Bagian Teknologi Informasi (IT Development)' },
    { label: 'Deskripsi', value: 'Logbook harian peserta magang yang dicatat per tanggal beserta bukti kegiatan.' },
    { label: 'Target', value: '' },
    { label: 'Nama Peserta', value: '', source: 'name' },
    { label: 'Divisi', value: '', source: 'division' },
    { label: 'Mentor', value: '', source: 'mentor' },
    { label: 'Periode', value: '', source: 'period' },
  ],
  columns: [
    { key: 'date', label: 'Tanggal', width: 11, visible: true },
    { key: 'time', label: 'Jam', width: 9, visible: false },
    { key: 'title', label: 'Judul Kegiatan', width: 15, visible: true },
    { key: 'description', label: 'Deskripsi', width: 28, visible: true },
    { key: 'output', label: 'Hasil', width: 13, visible: true },
    { key: 'location', label: 'Lokasi', width: 9, visible: true },
    { key: 'status', label: 'Status', width: 10, visible: false },
    { key: 'attachments', label: 'Bukti', width: 5, visible: true },
    { key: 'duration', label: 'Durasi', width: 8, visible: false },
    { key: 'obstacles', label: 'Kendala', width: 14, visible: false },
    { key: 'review_notes', label: 'Catatan Mentor', width: 14, visible: false },
  ],
  progress: {
    enabled: true,
    percent: 0,
    percentLabel: 'S.d saat ini',
    rows: [
      { name: 'Contoh aktivitas 1', status: 'ongoing', target: ['none', 'none', 'none', 'none'], real: ['none', 'none', 'none', 'none'] },
      { name: 'Contoh aktivitas 2', status: 'done', target: ['none', 'none', 'none', 'none'], real: ['none', 'none', 'none', 'none'] },
    ],
  },
  sections: [
    { title: 'Update sd Saat Ini', bullets: [] },
    { title: 'PICA', bullets: [] },
    { title: 'Next Actions', bullets: [] },
  ],
  headings: { summary: 'Ringkasan', obstacles: 'Kendala', mentorNotes: 'Catatan Mentor' },
  footnote: '',
  signLeft: 'Peserta Magang,',
  signRight: 'Mengetahui, Mentor Pembimbing,',
};

/** Menjaga bentuk config dari JSON tersimpan. Field yang hilang diisi dari standar. */
export function normalizeTemplate(raw: unknown): TemplateConfig {
  const r = (raw ?? {}) as Partial<TemplateConfig>;
  return {
    ...DEFAULT_TEMPLATE,
    ...r,
    header: Array.isArray(r.header) ? r.header : DEFAULT_TEMPLATE.header,
    columns: Array.isArray(r.columns) && r.columns.length ? r.columns : DEFAULT_TEMPLATE.columns,
    headings: { ...DEFAULT_TEMPLATE.headings, ...(r.headings ?? {}) },
    progress: { ...DEFAULT_TEMPLATE.progress, ...(r.progress ?? {}) },
    sections: Array.isArray(r.sections) ? r.sections : DEFAULT_TEMPLATE.sections,
  };
}

/** Nomor minggu dalam bulan untuk Senin tertentu (Minggu ke-1 = minggu yang memuat tanggal 1). */
export function weekNumberOfMonth(monday: Date): number {
  const first = new Date(monday.getFullYear(), monday.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  return Math.floor((monday.getDate() - 1 + offset) / 7) + 1;
}
