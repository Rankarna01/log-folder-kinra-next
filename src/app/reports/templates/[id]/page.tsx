'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { PageHead, Skeleton } from '@/components/ui/Kit';
import { useToast } from '@/components/feedback/FeedbackProvider';
import { useConfirm } from '@/components/feedback/ConfirmProvider';
import { TemplateEditor } from '@/components/reports/TemplateEditor';
import { ReportSheet, toIso } from '@/components/reports/ReportSheet';
import { DEFAULT_TEMPLATE, normalizeTemplate, type TemplateConfig } from '@/lib/reports/template';
import type { Logbook, Profile } from '@/types/database';

export default function EditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();
  const confirm = useConfirm();

  const [name, setName] = useState('');
  const [config, setConfig] = useState<TemplateConfig>(() => JSON.parse(JSON.stringify(DEFAULT_TEMPLATE)));
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sampleLogs, setSampleLogs] = useState<Logbook[]>([]);

  useEffect(() => {
    if (id === 'standar') {
      router.replace('/reports/templates/new?from=standar');
      return;
    }

    async function loadTemplate() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const [{ data: tpl, error }, { data: prof }, { data: logsData }] = await Promise.all([
        supabase.from('report_templates').select('id, name, config').eq('id', id).maybeSingle(),
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('logbooks').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(7),
      ]);

      if (error || !tpl) {
        setNotFound(true);
      } else {
        setName(tpl.name || '');
        setConfig(normalizeTemplate(tpl.config));
      }

      setProfile((prof as Profile) || null);
      setSampleLogs((logsData as Logbook[]) || []);
      setLoading(false);
    }

    loadTemplate();
  }, [id, supabase, router]);

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.warning('Isi nama template terlebih dahulu sebelum menyimpan.', 'Nama template kosong');
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from('report_templates')
      .update({ name: trimmedName, config, updated_at: new Date().toISOString() })
      .eq('id', id);

    setSaving(false);

    if (error) {
      toast.error(error.message, 'Gagal memperbarui');
      return;
    }

    toast.success(`Template "${trimmedName}" berhasil diperbarui.`, 'Template Diperbarui');
    router.push('/reports?tab=template');
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      message: `Template "${name}" akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.`,
      confirmLabel: 'Hapus template',
      danger: true,
    });
    if (!confirmed) return;

    setSaving(true);
    const { error } = await supabase.from('report_templates').delete().eq('id', id);
    setSaving(false);

    if (error) {
      toast.error(error.message, 'Gagal menghapus');
      return;
    }

    if (typeof window !== 'undefined') {
      const active = localStorage.getItem('kinra_report_template_active');
      if (active === id) {
        localStorage.setItem('kinra_report_template_active', 'standar');
      }
    }

    toast.info(`Template "${name}" telah dihapus.`);
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

  if (notFound) {
    return (
      <div className="space-y-4 text-center py-16">
        <i className="fa-solid fa-triangle-exclamation text-4xl text-amber-500"></i>
        <h2 className="text-xl font-bold">Template Tidak Ditemukan</h2>
        <p className="text-sm text-zinc-500">Template yang Anda cari mungkin sudah dihapus atau tidak tersedia.</p>
        <Link href="/reports?tab=template" className="kc-btn kc-btn-primary inline-flex mt-4">
          Kembali ke Daftar Template
        </Link>
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
        title={`Edit Template: ${name || 'Kustom'}`}
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
            placeholder="Contoh: Laporan Mingguan Khusus IT"
            className="mt-1.5 w-full rounded-[14px] bg-[#F4F7F6] border-0 px-3.5 py-2.5 text-xs text-[#111827] focus:ring-2 focus:ring-[#008187]"
          />
        </div>

        <TemplateEditor
          name={name}
          onNameChange={setName}
          draft={config}
          onChange={setConfig}
          isNew={false}
          saving={saving}
          onSave={handleSave}
          onCancel={handleCancel}
          onDelete={handleDelete}
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
          periodText={`Pratinjau ${name}`}
          kindText="Template Kustom"
        />
      </section>
    </div>
  );
}
