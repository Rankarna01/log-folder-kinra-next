'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

// Tipe minimal Web Speech API (tidak semua browser menyediakannya di lib.dom).
type SpeechResultEvent = { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> };
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SpeechResultEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type SpeechCtor = new () => SpeechRecognitionLike;

const getCtor = (): SpeechCtor | null => {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: SpeechCtor; webkitSpeechRecognition?: SpeechCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

const noopSubscribe = () => () => {};
const isSupported = () => getCtor() !== null;
const serverSupported = () => false;

type Props = {
  /** Dipanggil dengan teks hasil ucapan yang sudah final. */
  onText: (text: string) => void;
  disabled?: boolean;
};

/** Tombol rekam suara: mengubah ucapan (Bahasa Indonesia) menjadi teks. Berjalan di browser, tanpa server. */
export function VoiceInput({ onText, disabled }: Props) {
  const supported = useSyncExternalStore(noopSubscribe, isSupported, serverSupported);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState('');
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const onTextRef = useRef(onText);

  useEffect(() => {
    onTextRef.current = onText;
  }, [onText]);

  useEffect(() => {
    return () => recRef.current?.stop();
  }, []);

  const toggle = () => {
    setError('');
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const Ctor = getCtor();
    if (!Ctor) return;

    const rec = new Ctor();
    rec.lang = 'id-ID';
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (e) => {
      let text = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) text += `${r[0].transcript.trim()} `;
      }
      if (text.trim()) onTextRef.current(text.trim());
    };
    rec.onerror = (e) => {
      setError(e.error === 'not-allowed' ? 'Izin mikrofon ditolak. Aktifkan di pengaturan browser.' : 'Rekam suara gagal. Coba lagi.');
      setListening(false);
    };
    rec.onend = () => setListening(false);

    recRef.current = rec;
    rec.start();
    setListening(true);
  };

  if (!supported) {
    return (
      <p className="kc-small kc-muted" style={{ margin: 0 }}>
        Rekam suara tidak didukung di browser ini. Gunakan Chrome atau Safari terbaru.
      </p>
    );
  }

  return (
    <div className="kc-voice-row">
      <button type="button" className={`kc-btn${listening ? ' kc-btn-danger' : ''}`} onClick={toggle} disabled={disabled} aria-pressed={listening}>
        <i className={`fa-solid ${listening ? 'fa-stop' : 'fa-microphone'}`} aria-hidden="true"></i>
        {listening ? ' Berhenti merekam' : ' Rekam suara'}
      </button>
      {listening && <span className="kc-small kc-muted" role="status">Mendengarkan…</span>}
      {error && <span className="kc-field-error" role="alert">{error}</span>}
    </div>
  );
}
