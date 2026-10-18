# Catatan perubahan

## v2: perbaikan freeze di HP + ukuran fluid
**Freeze (penyebab yang ditemukan dan diperbaiki)**
- Event `resize` di HP (bilah alamat naik/turun saat scroll, keyboard muncul saat mengetik) memicu bangun-ulang galeri dan ticker berulang kali, ditambah refresh ScrollTrigger. Sekarang hanya perubahan LEBAR layar yang diproses (`saatLebarBerubah` di `js/app.js`), dan ScrollTrigger memakai `ignoreMobileResize`.
- Galeri beranda di HP tidak lagi memakai marquee dengan banyak foto kloning + `will-change`; diganti geser manual (swipe).
- Tirai transisi halaman diberi jaring pengaman: error di satu langkah tidak membuatnya macet, dan paling lama 4 detik di layar (`js/router.js`, `js/guard.js`).
- Loop `requestAnimationFrame` permanen untuk halo menu dihapus; diganti event.
- Animasi tak berujung (melayang/bergoyang) dimatikan di HP; efek blur halo menu dimatikan; filter berat di folder siswa dimatikan.
- Foto siswa yang terbuka tidak ikut tergulir di sentuh (`touch-action:none`).
- Mode debug: buka `alamat-situs/?debug` di HP untuk melihat error dan tugas lambat langsung di layar.

**Tampilan HP (konsep baru)**
- `font-size` akar fluid: 16px di layar >=760px, mengecil sampai 14px di HP, sehingga semua ukuran rem ikut menyesuaikan.
- Menu, ticker, hero, kartu, folder siswa (2 kolom di HP), lab, dan panel admin diberi ukuran khusus per perangkat di blok `RESPONSIVE v2` pada akhir `css/style.css`.
- Efek hover tidak lagi "menempel" setelah diketuk (`@media (hover:none)`), font input 16px agar iOS tidak zoom otomatis.
