'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// Ubah logbook sekarang dilakukan dari modal di kalender. Halaman ini hanya
// meneruskan pengguna ke tanggal logbook tersebut.
export default function EditLogbookRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    supabase
      .from('logbooks')
      .select('date')
      .eq('id', id)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        router.replace(data?.date ? `/logbook?date=${data.date}&open=1` : '/logbook');
      });
    return () => {
      active = false;
    };
  }, [id, router]);

  return <div className="p-8 text-xs text-zinc-500 text-center">Membuka kalender…</div>;
}
