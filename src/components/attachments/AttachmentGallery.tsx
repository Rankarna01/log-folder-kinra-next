'use client';

import { useEffect, useState } from 'react';
import type { Attachment } from '@/types/database';
import { fileNameOf, isImage, isPdf } from '@/lib/attachments';

const extOf = (path: string) => {
  const name = fileNameOf(path);
  const dot = name.lastIndexOf('.');
  return dot > 0 && dot < name.length - 1 ? name.slice(dot + 1).toUpperCase() : 'FILE';
};

type Props = {
  items: Attachment[];
  emptyText?: string;
};

/** Galeri bukti dokumentasi: kisi pratinjau + penampil layar penuh (Esc, panah kiri/kanan). */
export function AttachmentGallery({ items, emptyText = 'Belum ada bukti dokumentasi yang dilampirkan.' }: Props) {
  const [open, setOpen] = useState<number | null>(null);
  const count = items.length;

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null);
      if (e.key === 'ArrowRight') setOpen((i) => (i === null ? null : (i + 1) % count));
      if (e.key === 'ArrowLeft') setOpen((i) => (i === null ? null : (i - 1 + count) % count));
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, count]);

  if (count === 0) {
    return (
      <div className="kc-bukti-empty" role="status">
        <i className="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
        <span>{emptyText}</span>
      </div>
    );
  }

  const current = open !== null ? items[open] : null;

  return (
    <>
      <ul className="kc-bukti-grid">
        {items.map((att, i) => (
          <li key={att.id}>
            <button type="button" className="kc-bukti-tile" onClick={() => setOpen(i)} aria-label={`Buka bukti ${i + 1}: ${fileNameOf(att.file_path)}`}>
              {isImage(att.mime_type) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={att.file_url} alt="" loading="lazy" />
              ) : (
                <span className="kc-bukti-pdf">
                  <i className={`fa-solid ${isPdf(att.mime_type) ? 'fa-file-pdf' : 'fa-file-lines'}`} aria-hidden="true"></i>
                  {extOf(att.file_path)}
                </span>
              )}
              <span className="kc-bukti-num tnum">#{i + 1}</span>
            </button>
          </li>
        ))}
      </ul>

      {current && open !== null && (
        <div className="kc-lightbox" role="dialog" aria-modal="true" aria-label={`Bukti ${open + 1} dari ${count}`}>
          <div className="kc-lightbox-top">
            <span className="kc-lb-count tnum">
              {open + 1} / {count}
            </span>
            <span className="kc-lb-name" title={fileNameOf(current.file_path)}>{fileNameOf(current.file_path)}</span>
            <button type="button" className="kc-lb-btn" onClick={() => setOpen(null)} aria-label="Tutup">
              <i className="fa-solid fa-xmark" aria-hidden="true"></i>
            </button>
          </div>

          <div className="kc-lightbox-stage" onClick={(e) => e.target === e.currentTarget && setOpen(null)}>
            {count > 1 && (
              <button
                type="button"
                className="kc-lb-btn kc-lb-nav kc-lb-prev"
                onClick={() => setOpen((open - 1 + count) % count)}
                aria-label="Bukti sebelumnya"
              >
                <i className="fa-solid fa-chevron-left" aria-hidden="true"></i>
              </button>
            )}

            {isImage(current.mime_type) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={current.file_url} alt={current.caption || `Bukti ${open + 1}`} />
            ) : isPdf(current.mime_type) ? (
              <iframe src={current.file_url} title={`Bukti ${open + 1}`} />
            ) : (
              <div className="kc-bukti-file">
                <i className="fa-solid fa-file-lines" aria-hidden="true"></i>
                <b>{fileNameOf(current.file_path)}</b>
                <span>{extOf(current.file_path)} · pratinjau tidak tersedia, silakan unduh</span>
                <a className="kc-lb-btn" href={current.file_url} download>
                  <i className="fa-solid fa-download" aria-hidden="true"></i>
                  <span>Unduh berkas</span>
                </a>
              </div>
            )}

            {count > 1 && (
              <button
                type="button"
                className="kc-lb-btn kc-lb-nav kc-lb-next"
                onClick={() => setOpen((open + 1) % count)}
                aria-label="Bukti berikutnya"
              >
                <i className="fa-solid fa-chevron-right" aria-hidden="true"></i>
              </button>
            )}
          </div>

          <div className="kc-lightbox-top">
            <span className="kc-lb-name">{current.caption || ' '}</span>
            <span className="kc-lb-actions">
              <a className="kc-lb-btn" href={current.file_url} target="_blank" rel="noopener noreferrer">
                <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>
                <span>Buka asli</span>
              </a>
              <a className="kc-lb-btn" href={current.file_url} download>
                <i className="fa-solid fa-download" aria-hidden="true"></i>
                <span>Unduh</span>
              </a>
            </span>
          </div>
        </div>
      )}
    </>
  );
}
