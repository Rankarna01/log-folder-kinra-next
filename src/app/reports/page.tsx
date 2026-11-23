'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { PageHead, StatTiles, StatTile, Skeleton } from '@/components/ui/Kit';
import { useToast } from '@/components/feedback/FeedbackProvider';
import { ReportSheet, fmtLong, parseIso, toIso } from '@/components/reports/ReportSheet';
import { TemplateCards, type TemplateCardItem } from '@/components/reports/TemplateCards';
import { DEFAULT_TEMPLATE, normalizeTemplate, weekNumberOfMonth, type TemplateConfig } from '@/lib/reports/template';
import type { Logbook, Profile } from '@/types/database';

type Tab = 'mingguan' | 'rentang' | 'template';

type SavedTemplate = { id: string; name: string; config: TemplateConfig };

const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const todayIso = () => toIso(new Date());
const mondayOf = (d: Date) => addDays(d, -((d.getDay() + 6) % 7));

export default function ReportsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [logs, setLogs] = useState<Logbook[]>([]);
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState<Tab>('mingguan');
  const [anchor, setAnchor] = useState<string>(todayIso());
  const [rangeStart, setRangeStart] = useState<string>(toIso(new Date(new Date().getFullYear(), new Date().getMonth(), 1)));
  const [rangeEnd, setRangeEnd] = useState<string>(todayIso());

  const [templates, setTemplates] = useState<SavedTemplate[]>([]);
  const [templatesReady, setTemplatesReady] = useState(true);
  const [activeKey, setActiveKey] = useState<string>('standar');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const qTab = new URLSearchParams(window.location.search).get('tab');
      if (qTab === 'template' || qTab === 'rentang' || qTab === 'mingguan') {
        setTab(qTab);
      }
    }
  }, []);

  useEffect(() => {
    async function loadData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const [{ data: prof }, { data: logbooks }, { data: tpls, error: tplErr }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('logbooks').select('*, attachments(*)').eq('user_id', user.id).order('date', { ascending: true }),
        supabase.from('report_templates').select('id,name,config').order('created_at', { ascending: true }),
      ]);

      if (prof) setProfile(prof as Profile);
      if (logbooks) setLogs(logbooks as Logbook[]);
      if (tplErr) {
        setTemplatesReady(false);
      } else {
        setTemplates((tpls ?? []).map((t) => ({ id: t.id, name: t.name, config: normalizeTemplate(t.config) })));
      }
      setLoading(false);
    }
    loadData();
  }, [supabase]);

  // Periode mingguan: Senin–Minggu dari tanggal jangkar
  const week = useMemo(() => {
    const mon = mondayOf(parseIso(anchor));
    const sun = addDays(mon, 6);
    const days = Array.from({ length: 7 }, (_, i) => addDays(mon, i));
    return {
      start: mon,
      end: sun,
      days,
      label: `Minggu ke-${weekNumberOfMonth(mon)} · ${fmtLong(mon)} – ${fmtLong(sun)}`,
    };
  }, [anchor]);

  // Periode rentang bebas
  const range = useMemo(() => {
    const s = parseIso(rangeStart);
    const e = parseIso(rangeEnd);
    const valid = s.getTime() <= e.getTime() && (e.getTime() - s.getTime()) / 86400000 < 366;
    const count = valid ? Math.round((e.getTime() - s.getTime()) / 86400000) + 1 : 0;
    const days = valid ? Array.from({ length: count }, (_, i) => addDays(s, i)) : [];
    return { start: s, end: e, days, valid, label: valid ? `${fmtLong(s)} – ${fmtLong(e)}` : '' };
  }, [rangeStart, rangeEnd]);

  // Periode yang sedang dicetak (tab template ikut menampilkan pratinjau mingguan)
  const active = tab === 'rentang' ? range : week;
  const startIso = toIso(active.start);
  const endIso = toIso(active.end);

  const periodLogs = useMemo(
    () => (active.start && active.end ? logs.filter((l) => l.date >= startIso && l.date <= endIso) : []),
    [logs, startIso, endIso, active.start, active.end]
  );

  const summary = useMemo(() => {
    const count = (s: Logbook['status']) => periodLogs.filter((l) => l.status === s).length;
    return { total: periodLogs.length, approved: count('approved'), submitted: count('submitted'), rejected: count('rejected') };
  }, [periodLogs]);

  const shiftWeek = (dir: -1 | 1) => setAnchor(toIso(addDays(parseIso(anchor), dir * 7)));

  const cardItems: TemplateCardItem[] = useMemo(
    () => [
      { key: 'standar', name: 'Standar', config: DEFAULT_TEMPLATE, builtIn: true },
      ...templates.map((t) => ({ key: t.id, name: t.name, config: t.config })),
    ],
    [templates]
  );

  const activeConfig = cardItems.find((c) => c.key === activeKey)?.config ?? DEFAULT_TEMPLATE;
  const cloneDefault = (): TemplateConfig => JSON.parse(JSON.stringify(DEFAULT_TEMPLATE));

  const openEditor = (key: string) => {
    if (key === 'standar') {
      router.push('/reports/templates/new?from=standar');
    } else {
      router.push(`/reports/templates/${key}`);
    }
  };

  const newTemplate = () => {
    router.push('/reports/templates/new');
  };

  const activate = (key: string, on: boolean) => setActiveKey(on ? key : 'standar');

  const tabBtn = (key: Tab, label: string) => {
    const active = tab === key;
    return (
      <button
        type="button"
        className={`kc-btn transition-all duration-150 cursor-pointer ${
          active
            ? 'kc-btn-primary shadow-xs font-bold !text-white !bg-[#008187] hover:!bg-[#006e73]'
            : 'hover:border-[#008187] hover:text-[#008187] hover:bg-[#008187]/10'
        }`}
        aria-pressed={active}
        onClick={() => setTab(key)}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="space-y-4">
      <PageHead
        eyebrow="Laporan"
        title="Cetak laporan"
        lead="Pilih periode dan template, lalu cetak atau simpan sebagai PDF."
        actions={
          <button type="button" className="kc-btn kc-btn-primary" onClick={() => window.print()} disabled={loading || (tab === 'rentang' && !range.valid)}>
            <i className="fa-solid fa-print" aria-hidden="true"></i> Cetak PDF
          </button>
        }
      />

      <section className="kc-card print:hidden" style={{ gap: 12 }}>
        <div className="kc-card-row" style={{ flexWrap: 'wrap', gap: 8 }}>
          {tabBtn('mingguan', 'Mingguan')}
          {tabBtn('rentang', 'Rentang tanggal')}
          {tabBtn('template', 'Template')}
          <span style={{ flex: 1 }} />
        </div>

        {!templatesReady && (
          <p className="kc-small kc-muted" style={{ margin: 0 }}>
            Penyimpanan template belum aktif. Jalankan migrasi <code>20261122000000_report_templates.sql</code> di Supabase. Template standar tetap bisa dipakai.
          </p>
        )}

        {tab === 'mingguan' && (
          <div className="kc-card-row" style={{ flexWrap: 'wrap', gap: 8 }}>
            <button type="button" className="kc-btn" onClick={() => shiftWeek(-1)} aria-label="Minggu sebelumnya">
              <i className="fa-solid fa-chevron-left" aria-hidden="true"></i>
            </button>
            <span className="kc-small" style={{ fontWeight: 700 }}>{week.label}</span>
            <button type="button" className="kc-btn" onClick={() => shiftWeek(1)} aria-label="Minggu berikutnya" disabled={toIso(week.start) > todayIso()}>
              <i className="fa-solid fa-chevron-right" aria-hidden="true"></i>
            </button>
            <input type="date" value={anchor} max={todayIso()} onChange={(e) => e.target.value && setAnchor(e.target.value)} aria-label="Pilih tanggal dalam minggu" className="kc-small" />
          </div>
        )}

        {tab === 'rentang' && (
          <div className="kc-card-row" style={{ flexWrap: 'wrap', gap: 8 }}>
            <label className="kc-small" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              Dari
              <input type="date" value={rangeStart} max={rangeEnd} onChange={(e) => e.target.value && setRangeStart(e.target.value)} className="kc-small" />
            </label>
            <label className="kc-small" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              Sampai
              <input type="date" value={rangeEnd} min={rangeStart} max={todayIso()} onChange={(e) => e.target.value && setRangeEnd(e.target.value)} className="kc-small" />
            </label>
            <button type="button" className="kc-btn" onClick={() => { setRangeStart(toIso(mondayOf(new Date()))); setRangeEnd(todayIso()); }}>
              Minggu ini
            </button>
            <button type="button" className="kc-btn" onClick={() => { setRangeStart(toIso(new Date(new Date().getFullYear(), new Date().getMonth(), 1))); setRangeEnd(todayIso()); }}>
              Bulan ini
            </button>
            {!range.valid && <span className="kc-small kc-field-error">Rentang tidak valid: tanggal awal harus sebelum tanggal akhir (maks. 1 tahun).</span>}
          </div>
        )}

        <StatTiles>
          <StatTile icon="fa-solid fa-book" label="Logbook" value={summary.total} />
          <StatTile icon="fa-solid fa-circle-check" label="Disetujui" value={summary.approved} />
          <StatTile icon="fa-regular fa-clock" label="Menunggu" value={summary.submitted} />
          <StatTile icon="fa-solid fa-rotate-left" label="Revisi" value={summary.rejected} />
        </StatTiles>
      </section>

      {tab === 'template' && (
        <div className="space-y-4 print:hidden">
          <TemplateCards
            items={cardItems}
            activeKey={activeKey}
            editingKey={null}
            onActivate={activate}
            onEdit={openEditor}
            onNew={newTemplate}
          />
          <p className="kc-eyebrow" style={{ margin: 0 }}>
            Pratinjau (template aktif, minggu berjalan)
          </p>
        </div>
      )}

      {loading ? (
        <Skeleton height={420} />
      ) : tab === 'rentang' && !range.valid ? null : (
        <ReportSheet
          config={activeConfig}
          profile={profile}
          logs={periodLogs}
          days={active.days}
          periodText={tab === 'rentang' ? range.label : `${fmtLong(week.start)} – ${fmtLong(week.end)}`}
          kindText={tab === 'rentang' ? 'Rentang tanggal' : 'Mingguan'}
        />
      )}
    </div>
  );
}
