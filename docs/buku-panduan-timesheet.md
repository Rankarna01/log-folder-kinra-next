# Buku Panduan Penggunaan Sistem Timesheet MagangHub KINRA
**PT Kawasan Industri Nusantara · Kawasan Ekonomi Khusus (KEK) Sei Mangkei**  
*Standard Operating Procedure (SOP) & Dokumen Panduan Pengguna Resmi — Edisi 2026/2027*

Dokumen PDF resmi (A4 Landscape dengan Header Danantara & KINRA):  
[Buku Panduan Sistem Timesheet MagangHub KINRA.pdf](file:///Users/calvin/KINRA/log-folder-kinra-next/report/Buku%20Panduan%20Sistem%20Timesheet%20MagangHub%20KINRA.pdf)

---

## 1. Ringkasan & Akses Portal
- **Nama Aplikasi:** Timesheet MagangHub KINRA (PWA Logbook Peserta Magang & Monitoring Mentor)
- **Tautan Akses Portal:** `https://timesheet-kinra.vercel.app/login`
- **Unit Pengelola:** Bagian Teknologi Informasi (IT) & Bagian SDM KINRA

---

## 2. Aturan Akses Akun: Peserta vs Mentor

### A. Peserta Magang (Anak Magang) — Wajib Registrasi Mandiri
1. **Wajib Mendaftar Sendiri (Self-Registration):**
   - Peserta **TIDAK BISA** langsung login sebelum mendaftar.
   - Buka halaman login, lalu klik tab **"Daftar"** di bagian atas formulir.
2. **Pengisian Data Diri Lengkap:**
   - **Nama Lengkap:** Nama sesuai identitas resmi / kampus.
   - **NIK:** Nomor Induk Kependudukan / ID Fingerprint absensi (berupa angka).
   - **Email & Nomor Telepon:** Email aktif dan nomor kontak WhatsApp.
   - **Posisi / Jabatan:** Contoh: *Staf Magang Teknologi Informasi*.
3. **Wajib Memilih Divisi & Mentor Pembimbing:**
   - Pilih **Divisi Penempatan** sesuai unit kerja di KEK Sei Mangkei.
   - Pilih salah satu **Mentor Pembimbing** dari dropdown daftar 13 mentor resmi KINRA.
   - *Penting:* Pemilihan mentor ini sangat krusial agar seluruh logbook kegiatan harian yang diisi peserta otomatis masuk ke dashboard mentor pembimbing bersangkutan.
4. **Pembuatan Kata Sandi Sendiri:**
   - Masukkan kata sandi mandiri (minimal 8 karakter) dan ulangi kata sandi.
   - Klik tombol **"Daftar dan masuk"**.
   - Akun langsung aktif seketika dan peserta langsung diarahkan ke Dashboard Peserta.

---

### B. Mentor Pembimbing — Login Awal & Kewajiban Ubah Kata Sandi
1. **Akun Sudah Didaftarkan oleh Sistem / SDM:**
   - 13 Mentor resmi telah terdaftar di database sistem (tersinkronisasi dengan IAM Testing KINRA).
   - Mentor **TIDAK PERLU** mendaftar di tab "Daftar".
2. **Login Menggunakan NIK SAP Resmi:**
   - Buka portal dan pastikan berada pada tab **"Masuk"**.
   - Masukkan **NIK SAP (8 digit angka)** pada kolom input login.
3. **Kata Sandi Awal Default:**
   - Masukkan kata sandi default awal: `password123`.
   - Klik tombol **"Masuk"**.
4. **Otomatis Wajib Mengubah Kata Sandi:**
   - Sistem akan langsung mengarahkan mentor ke halaman `/ganti-sandi` (*Buat Kata Sandi Baru*).
   - Mentor wajib membuat kata sandi pribadi baru (minimal 8 karakter, tidak boleh `password123`).
   - Klik **"Simpan dan lanjut"**.
   - Setelah tersimpan, status ganti sandi selesai dan mentor langsung masuk ke Dashboard Peninjauan Mentor (`/mentor`).
   - Pada login-login berikutnya, mentor masuk menggunakan NIK SAP dan kata sandi baru pribadi tersebut.

---

## 3. Daftar 13 Akun Mentor Resmi KINRA & NIK SAP Login

| No | Nama Mentor Pembimbing | NIK SAP (Input Login) | Unit Divisi Penempatan | Kata Sandi Awal |
|:---:|:---|:---:|:---|:---:|
| 1 | **Muhammad Fajrin Sembiring** | `22000064` | Manajemen Risiko dan Teknologi Informasi | `password123` |
| 2 | **Andika Yusuf Hermawan** | `22000074` | Akuntansi dan Keuangan | `password123` |
| 3 | **Aswin Muhammad Ginting** | `22000115` | SDM, Umum dan Pengadaan | `password123` |
| 4 | **Pindi Filsa** | `22000116` | Manajemen Risiko dan Teknologi Informasi | `password123` |
| 5 | **Eva Yunita Purba** | `22000021` | SDM, Umum dan Pengadaan | `password123` |
| 6 | **Masta Parulian Pandiangan** | `22000022` | SDM, Umum dan Pengadaan | `password123` |
| 7 | **Ruri Rizki Syahputri Zuhri** | `22000135` | Pengembangan | `password123` |
| 8 | **Dina Fachriani** | `22000118` | Pengembangan | `password123` |
| 9 | **Vivie Junika Damid** | `22000069` | SDM, Umum dan Pengadaan | `password123` |
| 10 | **Ananda S. Lubis** | `22000019` | Mekanikal & Elektrikal, Fasilitas & Pengamanan | `password123` |
| 11 | **Faisal** | `22000034` | Pemasaran dan Penjualan | `password123` |
| 12 | **Nurul Abadah** | `22000043` | Pemasaran dan Penjualan | `password123` |
| 13 | **Ronni Abdurrahman** | `22000052` | Produksi Kawasan | `password123` |

---

## 4. Alur Kerja Harian Sistem

```
[Peserta Magang]
   │
   ├─► Tab "Daftar" -> Isi NIK, Nama, Divisi, Pilih Mentor -> Set Password Pribadi -> Masuk
   │
   ├─► Pengisian Logbook Harian (Jam Kerja, Judul, Deskripsi Rinci, Output Tautan, Foto Bukti)
   │
   └─► Status: "Menunggu Review" ───┐
                                    ▼
[Mentor Pembimbing]
   │
   ├─► Tab "Masuk" -> Masukkan NIK SAP & "password123" -> Auto Redirect ke /ganti-sandi -> Set Password Baru
   │
   ├─► Masuk ke Dashboard Mentor (/mentor) -> Melihat Daftar Bimbingan & Logbook Masuk
   │
   └─► Tinjau & Klik "Setujui" (Approve) atau Berikan Catatan Feedback
                                    │
                                    ▼
                       [Logbook Resmi Terkunci]
                       (Ekspor PDF Rekap Mingguan/Bulanan)
```

---

## 5. Pertanyaan Umum (FAQ) & Layanan Bantuan

1. **Bagaimana jika peserta salah memilih mentor saat registrasi?**  
   Peserta dapat melapor ke Admin SDM/TI untuk memindahkan penugasan mentor melalui modul Manajemen Peserta Magang di panel Admin.
2. **Bagaimana jika mentor lupa kata sandi yang baru?**  
   Mentor dapat menghubungi Administrator SDM atau TI KINRA untuk mereset kata sandi akun kembali ke `password123`.
3. **Apakah logbook yang sudah disetujui masih bisa diubah?**  
   Tidak bisa. Begitu disetujui mentor, entri logbook langsung terkunci permanen demi akurasi dan keabsahan laporan pertanggungjawaban magang.
4. **Pusat Bantuan Teknis:**
   - **Unit TI:** Bagian Teknologi Informasi - Gedung Pengelola KEK Sei Mangkei
   - **Unit SDM:** Bagian SDM, Umum dan Pengadaan
   - **Email:** `it-support@seimangkeisez.co.id` / `sdm@seimangkeisez.co.id`
