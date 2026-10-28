# Hasil pemeriksaan tahap 9

Pemeriksaan lokal pada 28 Oktober 2026, menggunakan Node.js 24 dan Supabase Docker PostgreSQL 17. Publikasi Vercel ditunda sesuai keputusan pengguna.

## Perubahan akhir

- Pencarian mempertahankan ketikan sebelum JavaScript siap, menggunakan nilai formulir saat submit, dan menerima event input secara konsisten di tiga engine browser.
- Halaman pemulihan kesalahan dan kesalahan layout memakai Bahasa Indonesia; ikon situs mengikuti ikon toko yang sudah digunakan.
- Form foto Admin/Toko memakai batas 4 MiB serta validasi browser/server agar sesuai dengan batas request Vercel. Storage tetap mempunyai batas bucket 5 MiB.
- Konfigurasi Vercel, pengecualian berkas unggahan, runtime Node.js, dan panduan environment/migrasi produksi disiapkan.
- Hasil Chromium, kompatibilitas, dan integrasi Docker dipisahkan agar tidak saling dibersihkan.

## Hasil

| Pemeriksaan | Hasil |
| --- | --- |
| TypeScript dan production build | Lulus |
| SQL, RLS, reservasi, omset, QR, tracking | 27 tes lulus |
| Chromium 360px/640px/1440px | 79 tes lulus; dua sapuan ukuran duplikat dilewati |
| Firefox 360px/1440px | 53 tes lulus; satu sapuan ukuran duplikat dilewati |
| WebKit 360px/1440px | 51 tes lulus dalam rangkaian; dua kasus tambahan lulus setelah masing-masing tiga pengulangan terpisah; satu sapuan ukuran duplikat dilewati |
| Supabase Docker: katalog/Storage dan auth | Lulus pada 360px/1440px |
| Supabase Docker: Admin/afiliasi dan Portal Toko | Lulus pada 360px/1440px; validasi foto diperiksa ulang setelah penyesuaian batas |
| Supabase Docker: QR dan tracking | Lulus pada 360px/1440px |
| `npm audit --omit=dev` | Tidak ditemukan advisori dependency produksi |

Dua kasus WebKit HP sempat tidak stabil saat browser QA Docker juga aktif: klik kategori dan kembali ke semua toko setelah pencarian. Keduanya kemudian dijalankan terpisah, masing-masing tiga kali, dengan hasil enam tes lulus. Jalankan perintah browser satu per satu, sebagaimana [panduan pengujian](deployment.md#pengujian-lokal). Tidak ada pengulangan otomatis yang menyembunyikan kegagalan pada konfigurasi pengujian.

Sapuan responsif mencakup 320px, 360px, 639px, 640px, 768px, 1024px, 1440px, dan landscape 740×360. Pemeriksaan meliputi overflow, pergantian navigasi, hasil pencarian, halaman detail, halaman kosong/gagal, keyboard, dan `prefers-reduced-motion`. Screenshot HP/desktop ditinjau secara visual. Rincian perilaku keyboard serta pencatatan exception WebKit ada di [panduan deployment](deployment.md).

Data, foto, QR, kunjungan, reservasi, dan akun sementara dibersihkan setelah integrasi. Dua toko serta tiga akun dari sesi tracking yang terputus juga dibersihkan berdasarkan UUID dan penanda uji yang diverifikasi. Akun lokal dari `auth:setup` serta volume database dipertahankan.

## Yang ditunda

Deployment ke Vercel, konfigurasi backend produksi, dan pemeriksaan melalui domain HTTPS publik belum dilakukan. Perangkat iOS/Safari fisik belum diuji; pengujian WebKit memeriksa engine browser. Panduan untuk melanjutkan publikasi tersedia di [deployment.md](deployment.md).
