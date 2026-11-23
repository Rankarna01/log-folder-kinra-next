import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

/**
 * Ekspor elemen lembar laporan ke file PDF berukuran A4 Landscape.
 * Menggunakan html-to-image dan jsPDF untuk hasil 1:1 identik dengan pratinjau di layar.
 */
export async function exportReportToPdf(
  element: HTMLElement,
  filename = 'Laporan_Logbook_KINRA.pdf'
): Promise<void> {
  // 1. Kloning elemen ke kontainer off-screen dengan lebar desktop A4 landscape standar (1060px)
  // agar hasil cetak selalu tajam dan tidak terpengaruh zoom/skala layar mobile.
  const clone = element.cloneNode(true) as HTMLElement;
  clone.id = 'print-clone-export';
  clone.style.transform = 'none';
  clone.style.width = '1060px';
  clone.style.minWidth = '1060px';
  clone.style.maxWidth = '1060px';
  clone.style.position = 'fixed';
  clone.style.left = '-9999px';
  clone.style.top = '0';
  clone.style.zIndex = '-9999';
  clone.style.backgroundColor = '#ffffff';
  clone.style.borderRadius = '0px';
  clone.style.boxShadow = 'none';
  clone.style.padding = '24px 28px';

  document.body.appendChild(clone);

  try {
    // 2. Render ke PNG berkualitas tinggi (retina pixel ratio 2x)
    const dataUrl = await toPng(clone, {
      quality: 0.98,
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      cacheBust: true,
    });

    // 3. Buat dokumen A4 Landscape (297mm x 210mm)
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageWidth = 297;
    const pageHeight = 210;
    const margin = 8; // 8mm margin sekeliling
    const printWidth = pageWidth - margin * 2; // 281mm

    const img = new Image();
    img.src = dataUrl;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Gagal memuat raster gambar laporan'));
    });

    const imgWidth = img.naturalWidth || 1060;
    const imgHeight = img.naturalHeight || 750;
    const printHeight = (imgHeight * printWidth) / imgWidth;

    // Jika muat dalam 1 lembar A4 landscape (dengan toleransi kecil)
    if (printHeight <= pageHeight - margin * 2 + 10) {
      const actualHeight = Math.min(printHeight, pageHeight - margin * 2);
      const yOffset = margin + Math.max(0, (pageHeight - margin * 2 - actualHeight) / 2);
      pdf.addImage(dataUrl, 'PNG', margin, yOffset, printWidth, actualHeight, undefined, 'FAST');
    } else {
      // Jika melebihi 1 halaman, pecah halaman secara proporsional
      let heightLeft = printHeight;
      let position = margin;
      let page = 1;

      while (heightLeft > 0) {
        if (page > 1) {
          pdf.addPage('a4', 'landscape');
        }
        pdf.addImage(dataUrl, 'PNG', margin, position, printWidth, printHeight, undefined, 'FAST');
        heightLeft -= pageHeight - margin * 2;
        position -= pageHeight - margin * 2;
        page++;
      }
    }

    pdf.save(filename);
  } finally {
    if (clone.parentNode) {
      clone.parentNode.removeChild(clone);
    }
  }
}
