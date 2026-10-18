# Website Kelas 8E: siap deploy ke Vercel

## Struktur
```
kelas-8e/
├─ vercel.json            Konfigurasi Vercel + header keamanan (folder yang dipublikasi: public/)
├─ public/                SEMUA yang dipublikasikan
│  ├─ index.html          Halaman (struktur saja)
│  ├─ css/                style.css, fonts.css
│  ├─ js/                 config.js (pengaturan), app.js (logika), router.js (halaman + animasi)
│  ├─ vendor/             Library yang di-host sendiri (GSAP, Lenis, supabase-js, Blockly)
│  ├─ fonts/              Font (Unbounded, Figtree, JetBrains Mono)
│  ├─ assets/             Gambar logo/foto utama
│  └─ siswa/              Foto murid dan guru
├─ supabase/              SQL untuk audit & penguatan database (TIDAK ikut dipublikasi)
├─ AUDIT-KEAMANAN.md      Hasil audit + daftar yang perlu kamu kerjakan
└─ README.md
```
Pengaturan utama (nama kelas, WhatsApp, kunci Supabase, dll.) ada di `public/js/config.js`.

## Langkah deploy
Vercel tidak menerima upload zip lewat dashboard. Pilih salah satu:

**Cara A: GitHub (disarankan, otomatis update tiap push)**
1. Ekstrak zip, buat repo baru di GitHub, upload isi folder `kelas-8e/` (termasuk `vercel.json`).
2. Di vercel.com: Add New > Project > pilih repo tadi.
3. Framework Preset: **Other**. Biarkan Build Command kosong. Output Directory sudah diatur lewat `vercel.json` (`public`). Klik Deploy.

**Cara B: Vercel CLI**
```bash
npm i -g vercel
cd kelas-8e
vercel          # preview
vercel --prod   # produksi
```

## Sesudah deploy (wajib)
1. **Supabase > Authentication > URL Configuration**: isi Site URL dengan domain Vercel-mu.
2. **Supabase > Authentication**: matikan "Allow new users to sign up" (akun admin sudah ada).
3. Jalankan `supabase/01-audit-dan-hardening.sql` bagian A di SQL Editor, baca hasilnya, lalu bagian B bila perlu. Detail ada di `AUDIT-KEAMANAN.md`.
4. Ganti `og:url` dan `og:image` di `public/index.html` (baris 12-13) ke domain barumu.
5. Tes: login admin, tambah/hapus satu berita, kirim satu saran lalu tinjau/hapus di admin panel.

## Mengubah isi
Edit file di `public/`, lalu deploy ulang. File `css/` dan `js/` selalu divalidasi ulang oleh browser (`must-revalidate`), jadi perubahan langsung terlihat setelah deploy. Font, vendor, dan assets di-cache lama; jika mengganti isinya, beri nama file baru.

## Lisensi pihak ketiga
GSAP (Standard "no charge" License, gsap.com/standard-license), Lenis (MIT), supabase-js (MIT), Blockly (Apache-2.0), font via Fontsource (OFL).
