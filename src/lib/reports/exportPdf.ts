import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Ekspor elemen lembar laporan ke file PDF berukuran A4 Landscape.
 * Menggunakan html2canvas untuk merender DOM langsung dan jsPDF untuk membuat file PDF.
 */
export async function exportReportToPdf(
  element: HTMLElement,
  filename = 'Laporan_Logbook_KINRA.pdf'
): Promise<void> {
  // Simpan properti asli elemen
  const originalTransform = element.style.transform;
  const originalTransition = element.style.transition;

  try {
    // 1. Matikan transformasi sementara agar render 100% ukuran asli tanpa distorsi
    element.style.transition = 'none';
    element.style.transform = 'none';

    // Beri jeda sejenak untuk reflow DOM
    await new Promise((r) => setTimeout(r, 60));

    // 2. Render elemen langsung ke Canvas menggunakan html2canvas
    const canvas = await html2canvas(element, {
      scale: 2, // Kualitas 2x Retina tajam
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      scrollX: 0,
      scrollY: 0,
    });

    const imgData = canvas.toDataURL('image/png', 1.0);

    // 3. Masukkan gambar ke dokumen jsPDF A4 Landscape
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageWidth = 297;
    const pageHeight = 210;
    const margin = 8;
    const printWidth = pageWidth - margin * 2; // 281mm
    const printHeight = (canvas.height * printWidth) / canvas.width;

    // Jika muat dalam 1 halaman A4 landscape
    if (printHeight <= pageHeight - margin * 2 + 15) {
      const actualHeight = Math.min(printHeight, pageHeight - margin * 2);
      const yOffset = margin + Math.max(0, (pageHeight - margin * 2 - actualHeight) / 2);
      pdf.addImage(imgData, 'PNG', margin, yOffset, printWidth, actualHeight, undefined, 'FAST');
    } else {
      // Jika lebih dari 1 halaman
      let heightLeft = printHeight;
      let position = margin;
      let page = 1;

      while (heightLeft > 0) {
        if (page > 1) {
          pdf.addPage('a4', 'landscape');
        }
        pdf.addImage(imgData, 'PNG', margin, position, printWidth, printHeight, undefined, 'FAST');
        heightLeft -= pageHeight - margin * 2;
        position -= pageHeight - margin * 2;
        page++;
      }
    }

    pdf.save(filename);
  } finally {
    // Kembalikan transformasi asli
    element.style.transform = originalTransform;
    element.style.transition = originalTransition;
  }
}
