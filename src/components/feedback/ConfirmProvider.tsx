'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

export type ConfirmOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Tombol konfirmasi berwarna merah, untuk tindakan hapus atau lepas. */
  danger?: boolean;
};

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/** Dialog konfirmasi bergaya kartu KINRA (kc-modal). Menggantikan window.confirm bawaan browser. */
export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((v: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((next) => {
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
      setOpts(next);
    });
  }, []);

  const close = (value: boolean) => {
    resolver.current?.(value);
    resolver.current = null;
    setOpts(null);
  };

  useEffect(() => {
    if (!opts) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close(false);
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts]);

  const value = useMemo(() => confirm, [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {opts && (
        <div className="kc-modal-backdrop" role="presentation" onClick={(e) => e.target === e.currentTarget && close(false)}>
          <div className="kc-modal" role="alertdialog" aria-modal="true" aria-labelledby="kc-confirm-title" aria-describedby="kc-confirm-msg">
            <div className="kc-modal-head">
              <div>
                <p className="kc-eyebrow">{opts.danger ? 'Perhatian' : 'Konfirmasi'}</p>
                <h2 id="kc-confirm-title">{opts.title ?? (opts.danger ? 'Yakin menghapus?' : 'Lanjutkan tindakan ini?')}</h2>
              </div>
            </div>
            <p id="kc-confirm-msg" className="kc-small" style={{ margin: '4px 0 16px', lineHeight: 1.5 }}>
              {opts.message}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button type="button" className="kc-btn" onClick={() => close(false)} autoFocus>
                {opts.cancelLabel ?? 'Batal'}
              </button>
              <button type="button" className={opts.danger ? 'kc-btn kc-btn-danger' : 'kc-btn kc-btn-primary'} onClick={() => close(true)}>
                {opts.confirmLabel ?? (opts.danger ? 'Hapus' : 'Lanjutkan')}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm harus dipakai di dalam ConfirmProvider');
  return ctx;
}
