# ai.md

Panduan untuk AI coding agent. Baca file ini dulu, lalu desain.md dan fitur.md.

## Ringkasan proyek
Web marketplace toko lokal (UMKM). Pengunjung bisa mencari toko, lihat detail toko (kontak, alamat, menu), dan toko bisa join sebagai afiliasi. Setiap toko punya QR code yang mengarah ke halamannya.

Isi web:
1. Landing page publik (mobile first)
2. Portal Admin
3. Portal Toko (pemilik toko)

## Aturan kerja
- Mobile first. Desain utama untuk HP, lalu tablet dan desktop.
- Web harus dinamis dan lancar dibuka di browser dan perangkat apa pun.
- Toko bebas edit semua data di dashboard miliknya sendiri. Omset diinput manual.
- Join afiliasi gratis. Field wajib: nomor HP (WA only), alamat toko, nama pengelola, janji temu.
- Sederhana dulu. Jangan tambah fitur di luar fitur.md tanpa tanya.
- Satu langkah per task. Selesaikan, jalankan, cek, baru lanjut.
- Kalau buntu lebih dari 2 kali coba, ganti pendekatan, jangan debug berlarut.
- Pakai API gratis kalau ada (contoh: embed Google Maps untuk lokasi).
- Teks UI pakai Bahasa Indonesia.
- Jangan simpan secret di repo. Pakai .env.

## Stack (usulan, boleh diganti)
- Next.js (App Router) + Tailwind CSS
- Supabase (auth, database, storage)
- Library QR: qrcode
- Hosting: Vercel

## Urutan pengerjaan
1. Setup proyek, layout dasar, token desain dari desain.md
2. Landing page (header, pencarian, kategori, daftar toko)
3. Halaman detail toko
4. Auth dan role (admin, toko)
5. Portal Admin: 3 menu
6. Portal Toko: dashboard
7. QR statis dan dinamis (masa berlaku bisa diatur)
8. Tracking pengunjung dan sumber kunjungan
9. Polish, tes responsif, deploy

## Definisi selesai per task
- Jalan tanpa error di HP (lebar 360px) dan desktop
- Sesuai desain.md
- Tidak ada fitur di luar fitur.md
