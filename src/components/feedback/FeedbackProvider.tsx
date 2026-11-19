'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useSpeak } from 'react-text-to-speech';

type Tone = 'success' | 'error' | 'warning' | 'info';
type ToastItem = { id: number; tone: Tone; title: string; message: string };

type Toaster = {
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
};

type FeedbackCtx = {
  toast: Toaster;
  voiceOn: boolean;
  setVoiceOn: (on: boolean) => void;
  /** Bacakan teks. Dilewati bila voice over nonaktif, kecuali `force` true. */
  say: (text: string, opts?: { force?: boolean }) => void;
};

const Ctx = createContext<FeedbackCtx | null>(null);

const VOICE_KEY = 'kinra_voice';
const DURATION_MS = 4800;

const TONES: Record<Tone, { icon: string; title: string; color: string }> = {
  success: { icon: 'fa-circle-check', title: 'Berhasil', color: 'var(--good)' },
  error: { icon: 'fa-circle-xmark', title: 'Gagal', color: 'var(--crit)' },
  warning: { icon: 'fa-triangle-exclamation', title: 'Perhatian', color: 'var(--warn)' },
  info: { icon: 'fa-circle-info', title: 'Informasi', color: 'var(--brand)' },
};

/* Voice over disimpan per browser. Dibaca lewat useSyncExternalStore agar aman untuk SSR. */
const voiceListeners = new Set<() => void>();
const subscribeVoice = (cb: () => void) => {
  voiceListeners.add(cb);
  return () => {
    voiceListeners.delete(cb);
  };
};
const readVoice = () => {
  try {
    return localStorage.getItem(VOICE_KEY) !== '0';
  } catch {
    return true;
  }
};
const writeVoice = (on: boolean) => {
  try {
    localStorage.setItem(VOICE_KEY, on ? '1' : '0');
  } catch {
    /* penyimpanan diblokir: pengaturan hanya berlaku untuk sesi ini */
  }
  voiceListeners.forEach((l) => l());
};

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const voiceOn = useSyncExternalStore(subscribeVoice, readVoice, () => true);
  const { speak, stop } = useSpeak();

  const say = useCallback(
    (text: string, opts?: { force?: boolean }) => {
      if (!text || (!voiceOn && !opts?.force)) return;
      stop();
      speak(text, { lang: 'id-ID' });
    },
    [voiceOn, speak, stop]
  );

  const setVoiceOn = useCallback(
    (on: boolean) => {
      writeVoice(on);
      if (on) {
        stop();
        speak('Voice over aktif.', { lang: 'id-ID' });
      } else {
        stop();
      }
    },
    [speak, stop]
  );

  const push = useCallback(
    (tone: Tone, message: string, title?: string) => {
      const id = ++idRef.current;
      const finalTitle = title ?? TONES[tone].title;
      setToasts((list) => [...list.slice(-3), { id, tone, title: finalTitle, message }]);
      setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), DURATION_MS);
      say(`${finalTitle}. ${message}`);
    },
    [say]
  );

  const toast = useMemo<Toaster>(
    () => ({
      success: (m, t) => push('success', m, t),
      error: (m, t) => push('error', m, t),
      warning: (m, t) => push('warning', m, t),
      info: (m, t) => push('info', m, t),
    }),
    [push]
  );

  const dismiss = (id: number) => setToasts((list) => list.filter((t) => t.id !== id));

  return (
    <Ctx.Provider value={{ toast, voiceOn, setVoiceOn, say }}>
      {children}

      <div className="kc-toasts" aria-live="polite">
        {toasts.map((t) => {
          const meta = TONES[t.tone];
          return (
            <div
              key={t.id}
              role={t.tone === 'error' ? 'alert' : 'status'}
              className="kc-toast"
              style={{ ['--tone' as string]: meta.color }}
            >
              <span className="kc-toast-icon" aria-hidden="true">
                <i className={`fa-solid ${meta.icon}`}></i>
              </span>
              <div className="kc-toast-body">
                <p className="kc-toast-title">{t.title}</p>
                <p className="kc-toast-msg">{t.message}</p>
              </div>
              <button type="button" className="kc-toast-close" onClick={() => dismiss(t.id)} aria-label="Tutup notifikasi">
                <i className="fa-solid fa-xmark" aria-hidden="true"></i>
              </button>
              <span className="kc-toast-bar" style={{ animationDuration: `${DURATION_MS}ms` }} aria-hidden="true" />
            </div>
          );
        })}
      </div>

      <button
        type="button"
        className="kc-voice"
        aria-pressed={voiceOn}
        aria-label={voiceOn ? 'Voice over aktif, klik untuk mematikan' : 'Voice over nonaktif, klik untuk mengaktifkan'}
        title={voiceOn ? 'Voice over: aktif' : 'Voice over: nonaktif'}
        onClick={() => setVoiceOn(!voiceOn)}
      >
        <i className={`fa-solid ${voiceOn ? 'fa-volume-high' : 'fa-volume-xmark'}`} aria-hidden="true"></i>
      </button>
    </Ctx.Provider>
  );
}

export function useFeedback() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useFeedback harus dipakai di dalam FeedbackProvider');
  return ctx;
}

export const useToast = () => ({ toast: useFeedback().toast });
