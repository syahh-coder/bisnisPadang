# fitur.md

## 1. Landing page (publik)
- Header: logo, tombol Masuk, tombol Join Afiliasi
- Pencarian bebas
- Kategori toko (beberapa saja)
- Detail toko: nomor HP, delivery, alamat, Google Maps, daftar menu
- Bar bawah: 3 menu dengan ikon SVG: Beranda, Pencarian (tengah, lebih besar dan menonjol), Akun
- Web dinamis dan responsif, bisa dibuka di browser dan perangkat apa pun (HP, tablet, desktop)

## 2. Portal Toko
Dashboard sederhana, maksimal 3 menu.
- Pengunjung hari ini
- Sumber pengunjung (Google Maps atau lainnya, pakai API gratis)
- Dashboard omset (diinput manual oleh toko)
- Dashboard penjualan
- Toko bebas mengedit apa pun di dashboardnya sendiri (info toko, menu, omset, penjualan, dll)

## 3. Portal Admin
Tepat 3 menu.

### Menu 1: Pembuat QR
- QR statis
- QR dinamis dengan masa berlaku, maksimal 15 hari
- Masa berlaku bisa diatur per QR (bukan fixed 15 hari, hanya batas atasnya)
- QR terhubung ke halaman toko

### Menu 2: Daftar toko
Semua toko yang sudah join.
- Nama toko
- Nama pemilik
- Nomor HP
- Data toko lain

### Menu 3: Kelola toko
- Tambah toko baru (saat ada toko yang mau join)
- Form join afiliasi (gratis, tanpa biaya). Wajib diisi: nomor HP (WA only), alamat toko, nama pengelola, janji temu
- Edit toko
- Pengaturan toko

## Role
- Pengunjung: tanpa login
- Toko: login, bebas edit semua data tokonya sendiri
- Admin: login, akses semua

## Keputusan (sudah dikonfirmasi)
1. Bar bawah: 3 menu (Beranda, Pencarian, Akun), ikon SVG semua, Pencarian di tengah dan lebih besar
2. Warna dan animasi bar bawah diserahkan ke AI (lihat desain.md)
3. Web dinamis, responsif, bisa dibuka di browser mana pun
4. Omset diinput manual oleh toko
5. Toko bebas edit apa pun di dashboardnya sendiri
6. Join afiliasi gratis. Data wajib: nomor HP (WA only), alamat toko, nama pengelola, janji temu
7. Reservasi janji temu: detail diserahkan ke AI

## Aturan reservasi janji temu (keputusan AI)
- Pilih tanggal: mulai besok, sampai 14 hari ke depan, Minggu libur
- Pilih slot jam: 09:00, 11:00, 13:00, 15:00 (WIB)
- Satu slot satu toko. Slot yang sudah diambil tidak bisa dipilih
- Catatan opsional (maks 200 karakter)
- Status: menunggu, dikonfirmasi, selesai, dibatalkan
- Admin mengubah status dari menu Kelola toko dan menghubungi lewat WA
- Pemohon bisa membatalkan sebelum dikonfirmasi

## Pertanyaan terbuka
Tidak ada. Lanjut bangun.
