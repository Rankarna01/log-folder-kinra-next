'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export type Division = { id: string; name: string; is_active: boolean };

/** Daftar divisi aktif dari master data (tabel `divisions`). */
export function useDivisions() {
  const supabase = createClient();
  const [divisions, setDivisions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    async function load() {
      const { data } = await supabase
        .from('divisions')
        .select('name')
        .eq('is_active', true)
        .order('name');
      if (!active) return;
      setDivisions((data ?? []).map((d: { name: string }) => d.name));
      setLoading(false);
    }
    load();
    return () => {
      active = false;
    };
  }, [supabase, reloadKey]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  return { divisions, loading, reload };
}
