'use client';

import { useState } from 'react';
import { promptInstall, useInstallState } from '@/lib/pwa';
import { useToast } from '@/components/feedback/FeedbackProvider';

/** Tombol "Instal aplikasi" di dalam aplikasi. Hanya tampil bila browser menawarkan pemasangan. */
export function InstallButton() {
  const state = useInstallState();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  if (state === 'installed') {
    return <p className="kc-small kc-muted" style={{ margin: 0 }}>Aplikasi sudah terpasang di perangkat ini.</p>;
  }
  if (state !== 'available') {
    return (
      <p className="kc-small kc-muted" style={{ margin: 0 }}>
        Untuk memasang, buka menu browser lalu pilih &quot;Tambahkan ke layar utama&quot;.
      </p>
    );
  }

  const install = async () => {
    setBusy(true);
    const ok = await promptInstall();
    setBusy(false);
    if (ok) toast.success('Aplikasi berhasil dipasang di layar utama.');
  };

  return (
    <button type="button" className="kc-btn kc-btn-primary" onClick={install} disabled={busy}>
      <i className="fa-solid fa-download" aria-hidden="true"></i> Instal aplikasi
    </button>
  );
}
