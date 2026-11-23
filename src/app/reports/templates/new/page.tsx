'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { PageHead, Skeleton } from '@/components/ui/Kit';
import { useToast } from '@/components/feedback/FeedbackProvider';
import { TemplateEditor } from '@/components/reports/TemplateEditor';
import { ReportSheet, toIso } from '@/components/reports/ReportSheet';
import { DEFAULT_TEMPLATE, type TemplateConfig } from '@/lib/reports/template';
import type { Logbook, Profile } from '@/types/database';

function NewTemplateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromStandar = searchParams.get('from') === 'standar';
  const supabase = createClient();
  const { toast } = useToast();

  const [name, setName] = useState(fromStandar ? 'Salinan Standar' : '');
  const [config, setConfig] = useState<TemplateConfig>(() => JSON.parse(JSON.stringify(DEFAULT_TEMPLATE)));
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sampleLogs, setSampleLogs] = useState<Logbook[]>([]);

  useEffect(() => {
    async function loadSampleData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const [{ data: prof }, { data: logsData }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('logbooks').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(7),
      ]);
      setProfile((prof as Profile) || null);
      setSampleLogs((logsData as Logbook[]) || []);
      setLoading(false);
    }
    loadSampleData();
  }, [supabase]);

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.warning('Isi nama template terlebih dahulu sebelum menyimpan.', 'Nama template kosong');
      return;
    }

    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaving(false);
      toast.error('Sesi tidak valid. Silakan login kembali.');
      return;
    }

    const { data, error } = await supabase
      .from('report_templates')
      .insert({ user_id: user.id, name: trimmedName, config })
      .select('id, name, config')
      .single();

    setSaving(false);

    if (error || !data) {
      toast.error(error?.message ?? 'Template belum bisa disimpan.', 'Gagal menyimpan');
      return;
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('kinra_report_template_active', data.id);
    }

    toast.success(`Template "${trimmedName}" berhasil dibuat dan diaktifkan untuk cetak.`, 'Template Dibuat');
    router.push('/reports?tab=template');
  };

  const handleCancel = () => {
    router.push('/reports?tab=template');
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton height={50} />
        <Skeleton height={380} />
      </div>
    );
  }

  const today = new Date();
  const sampleDays = Array.from({ length: 7 }, (_, i) => {
    return new Date(today.getFullYear(), today.getMonth(), today.getDate() - (6 - i));
  });

  return (
    <div className="space-y-5 pb-12">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Link
          href="/reports?tab=template"
          className="kc-btn text-xs hover:border-[#008187] hover:text-[#008187] transition"
        >
          <i className="fa-solid fa-arrow-left" aria-hidden="true"></i>
          <span>Kembali ke Laporan</span>
        </Link>
      </div>

      <PageHead
        eyebrow="Laporan · Template"
        title={fromStandar ? 'Buat Salinan Template Standar' : 'Buat Template Laporan Baru'}
        lead="Sesuaikan tata letak, judul, kolom tabel, blok progres, dan bagian laporan cetak PDF."
      />

      <section className="kc-card" style={{ padding: '20px 24px' }}>
        <div className="kc-field mb-4">
          <label htmlFor="tpl-name" className="text-xs font-bold text-[#111827]">
            Nama Template <span className="kc-req">*</span>
          </label>
          <input
            id="tpl-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contoh: Laporan Mingguan Khusus IT / Template Eksekutif"
            className="mt-1.5 w-full rounded-[14px] bg-[#F4F7F6] border-0 px-3.5 py-2.5 text-xs text-[#111827] focus:ring-2 focus:ring-[#008187]"
          />
          <p className="kc-help">Beri nama unik agar mudah dibedakan saat memilih template cetak.</p>
        </div>

        <TemplateEditor
          name={name}
          onNameChange={setName}
          draft={config}
          onChange={setConfig}
          isNew={true}
          saving={saving}
          onSave={handleSave}
          onCancel={handleCancel}
          onDelete={null}
        />
      </section>

      <section className="space-y-3">
        <div className="kc-card-row" style={{ justifyContent: 'space-between' }}>
          <p className="kc-eyebrow" style={{ margin: 0 }}>
            Pratinjau Live Template
          </p>
          <span className="kc-small kc-muted">Tampilan cetak lembar A4 secara langsung</span>
        </div>
        <ReportSheet
          config={config}
          profile={profile}
          logs={sampleLogs}
          days={sampleDays}
          periodText="Pratinjau Template Baru"
          kindText="Template Kustom"
        />
      </section>
    </div>
  );
}

export default function NewTemplatePage() {
  return (
    <Suspense fallback={<Skeleton height={400} />}>
      <NewTemplateContent />
    </Suspense>
  );
}
