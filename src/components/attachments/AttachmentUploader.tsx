'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { MAX_FILE_MB, MAX_FILES, isImage, validateFiles } from '@/lib/attachments';

type Props = {
  files: File[];
  onChange: (files: File[]) => void;
  /** Jumlah lampiran yang sudah tersimpan (mis. saat edit), ikut dihitung dalam batas. */
  existingCount?: number;
  disabled?: boolean;
};

/** Pemilih lampiran bukti: pratinjau, validasi, dan batas jumlah. Unggahnya dilakukan oleh halaman pemanggil. */
export function AttachmentUploader({ files, onChange, existingCount = 0, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');

  const previews = useMemo(
    () => files.map((f) => (isImage(f.type) ? URL.createObjectURL(f) : null)),
    [files]
  );

  useEffect(() => {
    return () => previews.forEach((u) => u && URL.revokeObjectURL(u));
  }, [previews]);

  const remaining = MAX_FILES - existingCount - files.length;

  const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (picked.length === 0) return;
    const err = validateFiles(picked, existingCount + files.length);
    if (err) {
      setError(err);
      return;
    }
    setError('');
    onChange([...files, ...picked]);
  };

  const removeAt = (i: number) => {
    setError('');
    onChange(files.filter((_, idx) => idx !== i));
  };

  return (
    <div className="kc-uploader">
      <div className="kc-uploader-head">
        <span className="kc-label">Lampiran bukti dokumentasi</span>
        <span className="kc-small kc-muted tnum">
          {existingCount + files.length} / {MAX_FILES}
        </span>
      </div>

      <button
        type="button"
        className="kc-dropzone"
        disabled={disabled || remaining <= 0}
        onClick={() => inputRef.current?.click()}
      >
        <i className="fa-solid fa-cloud-arrow-up" aria-hidden="true"></i>
        <span className="kc-dropzone-title">
          {remaining > 0 ? 'Pilih berkas bukti' : 'Batas lampiran tercapai'}
        </span>
        <span className="kc-small kc-muted">
          Semua jenis berkas · maks. {MAX_FILE_MB} MB per berkas · bisa banyak sekaligus
        </span>
      </button>
      <div className="kc-uploader-actions">
        <button
          type="button"
          className="kc-btn"
          disabled={disabled || remaining <= 0}
          onClick={() => cameraRef.current?.click()}
        >
          <i className="fa-solid fa-camera" aria-hidden="true"></i> Ambil foto
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        onChange={handlePick}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />
      {/* Kamera langsung di HP; di desktop membuka pemilih berkas gambar */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handlePick}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />

      {error && (
        <p className="kc-field-error" role="alert">
          <i className="fa-solid fa-circle-exclamation" aria-hidden="true"></i> {error}
        </p>
      )}

      {files.length > 0 && (
        <ul className="kc-pending-list">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`}>
              <div className="kc-pending-thumb">
                {previews[i] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previews[i]!} alt={`Pratinjau ${f.name}`} />
                ) : (
                  <i className="fa-solid fa-file-pdf" aria-hidden="true"></i>
                )}
              </div>
              <div className="kc-pending-meta">
                <span className="kc-pending-name" title={f.name}>{f.name}</span>
                <span className="kc-small kc-muted">{Math.max(1, Math.round(f.size / 1024))} KB</span>
              </div>
              <button type="button" className="kc-pending-remove" onClick={() => removeAt(i)} aria-label={`Hapus ${f.name}`}>
                <i className="fa-solid fa-xmark" aria-hidden="true"></i>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
