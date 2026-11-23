'use client';

import { useState } from 'react';

type Props = {
  /** Teks kecil mono di panel brand (kiri bawah). */
  brandEyebrow: string;
  brandTitle: string;
  brandText: string;
  children: React.ReactNode;
  wide?: boolean;
};

const THEME_COOKIE = 'kinra_tema';

function ThemeToggle() {
  // Tema efektif dibaca dari DOM saat klik; ikon diganti lewat CSS (tanpa state).
  const toggle = () => {
    const root = document.documentElement;
    const explicit = root.getAttribute('data-theme');
    const isDark =
      explicit === 'dark' ||
      (explicit !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const next = isDark ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
  };

  return (
    <button type="button" onClick={toggle} className="auth-theme" aria-label="Ganti tema terang/gelap">
      <i className="fa-regular fa-moon icon-moon" aria-hidden="true"></i>
      <i className="fa-solid fa-sun icon-sun" aria-hidden="true"></i>
    </button>
  );
}

export function AuthShell({ brandEyebrow, brandTitle, brandText, children, wide }: Props) {
  return (
    <div className="auth-split">
      <aside className="auth-brand">
        <span className="auth-circle auth-circle-jingga" aria-hidden="true" />
        <span className="auth-circle auth-circle-merah" aria-hidden="true" />
        <span className="auth-circle auth-circle-biru" aria-hidden="true" />

        <div className="auth-logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo/kinra-logo-tosca.png" alt="KINRA Sei Mangkei" width={200} height={79} />
        </div>

        <div className="auth-brand-copy">
          <p className="eyebrow">{brandEyebrow}</p>
          <h2>{brandTitle}</h2>
          <p>{brandText}</p>
        </div>
      </aside>

      <section className="auth-panel">
        <ThemeToggle />
        <div className={`auth-panel-inner${wide ? ' auth-panel-wide' : ''}`}>{children}</div>
      </section>
    </div>
  );
}

type FieldProps = {
  id: string;
  label: string;
  type?: 'email' | 'password' | 'text';
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  icon: string;
  autoComplete?: string;
};

export function AuthField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  icon,
  autoComplete,
}: FieldProps) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <div className="input-wrap">
        <i className={`fa-solid ${icon}`} aria-hidden="true"></i>
        <input
          id={id}
          type={isPassword && show ? 'text' : type}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
        />
        {isPassword && (
          <button
            type="button"
            className="input-eye"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
            aria-pressed={show}
          >
            <i className={show ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye'} aria-hidden="true"></i>
          </button>
        )}
      </div>
    </div>
  );
}
