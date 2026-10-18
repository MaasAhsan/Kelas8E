/* ============================================================
   PUSAT PENGATURAN: edit bagian ini saja, tidak perlu ubah HTML
   ============================================================ */
const CONFIG = {
  KELAS: "8E",                 // ganti ke "9E" jika sudah naik kelas
  TAHUN_AJARAN: "2025/2026",   // cek: tahun ajaran berjalan mungkin 2026/2027
  NAMA_SEKOLAH: "SMP Birrul Walidain Muhammadiyah Sragen",
  WA_NOMOR: "",                // format 62812xxxxxxx. Kosong = kartu WhatsApp disembunyikan
  WA_PESAN: "Assalamualaikum, saya ingin bertanya tentang Kelas 8E.",
  ALAMAT: "",                  // contoh: "Jl. ..., Sragen". Kosong = tidak ditampilkan
  MAPS_URL: ""                 // kosong = otomatis cari nama sekolah di Google Maps
};
const WALI = [
  { peran: "Wali kelas", nama: "Ustadzah Fida", foto: ["siswa/guru_fida.png"] },
  { peran: "Pendamping", nama: "Ustadz Imam",   foto: ["siswa/guru_imam.png"] }
];
/* foto: "" = pakai inisial. Isi nama file, mis. "alfon.jpg" (taruh di folder yang sama) */
const PENGURUS = [
  { peran: "Ketua kelas", nama: ["Alfon"],            foto: ["siswa/orang_10.png"] },
  { peran: "Wakil ketua", nama: ["Kido"],             foto: ["siswa/orang_09.png"] },
  { peran: "Bendahara",   nama: ["Agha", "Kenzie"],   foto: ["siswa/orang_25.png", "siswa/orang_07.png"] },
  { peran: "Sekretaris",  nama: ["Yusuf", "Ahsan"],   foto: ["siswa/orang_18.png", "siswa/orang_11.png"] },
  { peran: "Keamanan",    nama: ["Sakha", "Zhafran"], foto: ["siswa/orang_29.png", "siswa/orang_16.png"] }
];
/* Tambah foto dengan menambah baris. Galeri otomatis jadi geser samping jika fotonya banyak */
const GALERI = [
  { src: document.querySelector(".polaroid img")?.src || "foto1.jpeg", alt: "Foto bersama Kelas 8E", cap: "Foto hari Batik" },
  { src: "assets/img-559abc31f0.jpg", alt: "Kumpulan pas foto siswa Kelas 8E", cap: "Pas foto Kelas 8E", rasio: "1/1" }
  // , { src: "belajar1.jpg", alt: "Siswa belajar kelompok di kelas", cap: "Belajar bersama" }
];
/* Topik Informatika yang dipelajari. Sesuaikan dengan yang benar-benar diajarkan di kelasmu */
const BELAJAR = [
  "Berpikir komputasional",
  "Sistem komputer",
  "Jaringan komputer dan internet",
  "Analisis data",
  "Algoritma dan pemrograman",
  "Dampak sosial informatika"
];
/* Bagian di bawah muncul otomatis begitu diisi */
const PENGUMUMAN = [
  // { tanggal: "2026-10-20", judul: "Ulangan harian IPA", isi: "Materi bab 3. Bawa alat tulis." }
];
const JADWAL_PELAJARAN = [
  // { hari: "Senin", isi: ["07.00 Matematika", "08.20 Bahasa Indonesia"] }
];
const JADWAL_PIKET = [
  // { hari: "Senin", isi: ["Alfon", "Kido"] }
];
