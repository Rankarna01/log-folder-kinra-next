# Buku Panduan Catat Logbook & Manajemen Template Laporan Timesheet KINRA
**PT Kawasan Industri Nusantara · Kawasan Ekonomi Khusus (KEK) Sei Mangkei**  
*Standard Operating Procedure (SOP) & Dokumen Panduan Pengguna Resmi — Edisi 2026/2027*

Dokumen PDF resmi (A4 Landscape dengan Visual Screenshot Live Sistem, Header Danantara & KINRA):  
[Buku Panduan Catat Logbook dan Template Report KINRA.pdf](file:///Users/calvin/KINRA/log-folder-kinra-next/report/Buku%20Panduan%20Catat%20Logbook%20dan%20Template%20Report%20KINRA.pdf)

---

## 1. Panduan Fitur Catat Logbook Harian

### A. Akses Menu & Navigasi Kalender (`/logbook`)
1. **Buka Menu Logbook:** Pada desktop, klik menu **Logbook** di sidebar sebelah kiri. Pada ponsel pintar (mobile), klik ikon **Logbook** pada dock navigasi bawah.
2. **Tampilan Kalender:** Sistem menampilkan kalender bulan berjalan lengkap dengan total akumulasi jam kerja dan jumlah kegiatan terverifikasi.
3. **Memilih Tanggal:**
   - Klik langsung pada sel tanggal yang ingin diisi kegiatan.
   - Atau klik tombol **"Catat Kegiatan"** di pojok kanan atas untuk mengisi kegiatan hari ini.
   - *Catatan Batasan:* Tanggal masa depan tidak dapat dipilih untuk menjamin riil kegiatan yang dilaporkan.
4. **Indikator Status Harian:**
   - **Disetujui (Hijau):** Logbook telah ditinjau dan disetujui mentor pembimbing. Entri terkunci otomatis.
   - **Menunggu Review (Oranye):** Logbook telah diisi dan tersimpan, menunggu persetujuan mentor.
   - **Hari Ini (Lingkaran Tosca):** Menandakan tanggal kalender berjalan saat ini.

### B. Pengisian Formulir Logbook (7 Komponen Wajib)
1. **Jam Kerja (Mulai - Selesai):** Masukkan jam mulai dan selesai (standar: 08:00 s.d. 17:00 WIB). Minimal total jam kerja efektif adalah 8 jam.
2. **Lokasi Penugasan:** Pilih **Kantor** (gedung pengelola KEK Sei Mangkei) atau **Lapangan** (area pabrik mitra, utilitas kawasan, gardu, dll).
3. **Judul & Uraian Deskripsi Pekerjaan:** Tulis judul pekerjaan secara singkat dan jabarkan tahapan eksekusi secara runtut.
4. **Fitur Rekam Suara (Voice-to-Log):** Klik ikon mikrofon untuk mendiktekan kegiatan menggunakan ucapan Bahasa Indonesia secara otomatis tanpa perlu mengetik manual.
5. **Fitur Rapikan AI:** Klik tombol *"Rapikan AI"* agar susunan uraian tugas dirapikan menjadi kalimat laporan kerja formal.
6. **Output & Bukti Hasil:** Cantumkan ringkasan fisik deliverable atau sematkan tautan dokumen cloud (Google Drive, SharePoint, GitHub).
7. **Dokumentasi Foto / Lampiran Berkas:** Klik tombol *"Ambil Foto"* untuk menyalakan kamera HP langsung atau unggah dokumen pendukung (maksimal 20 MB per berkas, mendukung JPG, PNG, PDF).

---

## 2. Panduan Menu Rekap & Laporan (`/reports`)

### A. Tab Mingguan (Weekly Report)
- Menampilkan rekapitulasi kegiatan magang dalam rentang Senin hingga Minggu per pekan.
- Navigasi antar minggu dapat dilakukan dengan tombol *"Minggu Sebelumnya"* dan *"Minggu Berikutnya"*.
- Menampilkan persentase logbook yang disetujui mentor, total jam kerja mingguan, dan rekap kendala operasional.

### B. Tab Rentang Tanggal (Custom Range Report)
- Digunakan untuk mencetak laporan dengan rentang waktu bebas (misal: 14 hari, 1 bulan penuh, atau evaluasi tengah periode magang).
- Pilih tanggal awal (*Dari*) dan tanggal akhir (*Sampai*). Sistem secara otomatis menghitung validitas dan merekap seluruh logbook dalam periode tersebut.

### C. Ekspor PDF & Cetak Laporan
- **Tombol "Unduh PDF":** Menghasilkan berkas PDF A4 Landscape kualitas tinggi yang identik dengan pratinjau lembar cetak standar KINRA, lengkap dengan kop resmi Danantara-KINRA, tabel aktivitas harian, matriks progress mingguan, serta tautan verifikasi digital.
- **Tombol "Cetak":** Membuka dialog pencetakan printer bawaan browser.

---

## 3. Panduan Tab Template (Membuat & Mengedit Template Laporan)

### A. Memilih Template Aktif
1. Masuk ke menu **Rekap & Laporan** (`/reports`), lalu klik tab **"Template"**.
2. Sistem menampilkan kartu-kartu template laporan yang tersedia (Template Standar bawaan serta template kustom yang dibuat pengguna).
3. Klik tombol **"Gunakan untuk cetak"** pada kartu template yang diinginkan. Template aktif akan ditandai dengan badge tosca dan langsung menjadi acuan format cetak pada tab Mingguan dan Rentang Tanggal.

### B. Membuat Template Kustom Baru (`/reports/templates/new`)
1. Pada tab Template, klik tombol **"+ Buat template"** (atau klik *"Salin"* pada template Standar).
2. **Pengaturan Judul & Kop Laporan:**
   - Tentukan Nama Template dan Judul Utama Laporan.
   - Atur baris header: bisa memilih sumber data otomatis (Nama Peserta, NIK, Divisi, Periode) atau mengisi teks statis bebas.
3. **Kustomisasi Kolom Tabel Rekap:**
   - Mengatur kolom yang ditampilkan (centang visibilitas).
   - Mengubah teks label kepala kolom (contoh: *Uraian Tugas*, *Hasil / Link Output*, *Kendala*).
   - Mengatur proporsi lebar kolom dalam persen (`width %`).
   - Mengatur urutan kolom tabel menggunakan tombol panah atas/bawah.
   - Menambahkan kolom kustom dari daftar pilihan kolom.
4. **Matriks Progres & Timeline:**
   - Menambahkan baris aktivitas program kerja strategis.
   - Mengisi capaian persentase s.d. saat ini (contoh: `±90%`).
   - Menentukan warna target vs realisasi mingguan (Minggu ke-1 s.d. Minggu ke-4).
5. **Bagian Teks Tambahan (Sections):**
   - Menyesuaikan butir-butir ringkasan tugas (*Update s.d. Saat Ini*).
   - Menyesuaikan analisis masalah & perbaikan (*PICA: Problem Identification & Corrective Action*).
   - Menyesuaikan rencana kerja tindak lanjut (*Next Actions*).
6. **Simpan Template:**
   - Klik tombol **"Simpan template"**. Template baru akan tersimpan di cloud database Supabase dan langsung aktif untuk kebutuhan ekspor PDF berikutnya.

---

## 4. Berkas Resmi yang Tersedia di Repositori
- **File PDF Siap Cetak (A4 Landscape):** [report/Buku Panduan Catat Logbook dan Template Report KINRA.pdf](file:///Users/calvin/KINRA/log-folder-kinra-next/report/Buku%20Panduan%20Catat%20Logbook%20dan%20Template%20Report%20KINRA.pdf)
- **Sumber Template HTML:** [report/panduan-logbook-template-report.html](file:///Users/calvin/KINRA/log-folder-kinra-next/report/panduan-logbook-template-report.html)
- **Asset Gambar Screenshot Sistem:** Tersimpan di folder `report/screenshots/` (6 berkas PNG kualitas tinggi).
