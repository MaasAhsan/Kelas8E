# Audit Keamanan: Website Kelas 8E

Ruang lingkup: seluruh kode di folder `public/` (HTML, CSS, JS), konfigurasi Vercel, dan cara website memakai Supabase.
Yang TIDAK bisa diaudit dari sini: isi project Supabase kamu (policy RLS, tabel admins, pengaturan Auth). Itu ditandai **Butuh tindakanmu**.

## Penting: memecah file bukan pengamanan
Memisahkan HTML, CSS, dan JS rapi dan lebih mudah dirawat, tapi **tidak membuat website lebih sulit diretas**. Semua kode frontend selalu bisa dibaca siapa pun lewat browser (View Source / DevTools), dipecah atau di-minify sekalipun. Keamanan yang sebenarnya ada di (1) aturan akses Supabase (RLS), (2) header keamanan, (3) tidak menyimpan rahasia di kode. Itulah yang dikerjakan di bawah.

## Temuan dan status

| # | Temuan | Tingkat | Status |
|---|--------|---------|--------|
| 1 | Kode owner `8E2026` tertulis di JavaScript, ada mode admin lokal yang bisa dibuka dengan kode itu | Tinggi | **Diperbaiki**: mode lokal dan kode dihapus total. Admin hanya lewat login Supabase |
| 2 | Keamanan tulis data (`site_data`) sepenuhnya bergantung pada RLS Supabase; tidak bisa diverifikasi dari kode | Kritis jika salah | **Butuh tindakanmu**: jalankan bagian A di `supabase/01-audit-dan-hardening.sql`, lalu bagian B bila perlu |
| 3 | Pendaftaran akun publik Supabase mungkin masih aktif | Tinggi | **Butuh tindakanmu**: Supabase > Authentication > matikan "Allow new users to sign up". Cek daftar user (query A4) |
| 4 | Library dimuat dari CDN pihak ketiga (cdnjs, jsDelivr) tanpa SRI; Google Fonts | Sedang | **Diperbaiki**: semua di-host sendiri di `vendor/` dan `fonts/` (versi sama: GSAP 3.12.5, Lenis 1.1.20, supabase-js 2.45.4, Blockly 12.5.1). Tidak ada lagi dependensi eksternal saat halaman dimuat |
| 5 | Tidak ada header keamanan | Sedang | **Diperbaiki** di `vercel.json`: CSP, anti-clickjacking (`frame-ancestors`, `X-Frame-Options`), `nosniff`, HSTS, Referrer-Policy, Permissions-Policy |
| 6 | Link dari data (kontak/pengumuman) dipasang ke `href` tanpa validasi: bisa `javascript:` jika data dirusak | Sedang | **Diperbaiki**: hanya `http`, `https`, `mailto`, `tel` yang diterima; nomor WhatsApp/telepon dibersihkan jadi angka saja |
| 7 | "Buka di tab baru" pada Coding Lab menjalankan kode pengunjung di origin website (bisa membaca sesi admin jika admin sedang login dan menjalankan kode asing) | Sedang (self-XSS) | **Diperbaiki**: tab baru kini membungkus kode dalam iframe `sandbox` (origin terisolasi) |
| 8 | Listener `message` Coding Lab menerima pesan dari sumber mana pun | Rendah | **Diperbaiki**: hanya diterima dari iframe pratinjau sendiri |
| 9 | Form Kritik & Saran: batas waktu kirim hanya di browser (mudah dilewati), tidak ada batas di server | Sedang | **Butuh tindakanmu**: policy di `01-audit-dan-hardening.sql` (B2) membatasi isi di server. Untuk spam serius, tambahkan CAPTCHA (mis. Cloudflare Turnstile) |
| 10 | Tombol tinjau/selesai/hapus saran gagal diam-diam bila policy UPDATE/DELETE tidak ada | Fungsional | **Diperbaiki di kode** (pesan jelas); izin di `02-perbaiki-izin-feedback.sql` |
| 11 | Meta `og:url` / `og:image` masih ke `kelas-8e.web.app` | Rendah | **Butuh tindakanmu**: ganti ke domain Vercel-mu di `public/index.html` (baris 12-13) |
| 12 | Supabase anon key ada di JS | Info | Normal dan memang dirancang publik. Aman **hanya jika RLS benar** (lihat #2). Jangan pernah menaruh `service_role` key di website |

## Yang sudah baik
- Semua data pengguna ditampilkan dengan `textContent`; tidak ditemukan celah XSS lewat `innerHTML` dengan data dinamis. Pemakaian `innerHTML` hanya untuk string tetap.
- Pratinjau Coding Lab berjalan di iframe `sandbox="allow-scripts allow-modals"` tanpa `allow-same-origin`.
- `target="_blank"` sudah memakai `rel="noopener"` (kini `noopener noreferrer`).

## Batasan CSP (kenapa masih ada `unsafe-inline` dan `unsafe-eval`)
Coding Lab menjalankan kode yang diketik pengunjung (pratinjau HTML dan editor blok lewat Web Worker + `new Function`). Pratinjau dan Worker mewarisi CSP halaman, sehingga `script-src` yang sangat ketat akan merusak fitur itu. Dampaknya: CSP di sini **tidak** memblokir inline script. Perlindungan yang tetap berlaku: `connect-src` hanya ke Supabase milikmu (data tidak bisa dikirim ke server lain), `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, dan tidak ada script pihak ketiga. Untuk CSP ketat penuh, Coding Lab perlu dipindah ke halaman terpisah dengan CSP sendiri (pekerjaan lanjutan).

## Belum dites
Semua perubahan lolos pengecekan syntax dan semua file yang dirujuk memang ada. Saya **belum** menjalankannya di browser. Setelah deploy, buka DevTools > Console dan Network, lalu coba: beranda, halaman Berita/Galeri/Warga, Coding Lab (pratinjau HTML dan editor blok), login admin, dan kirim satu saran. Jika ada yang diblokir CSP, pesannya muncul di Console.
