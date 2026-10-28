# QR toko — langkah 7

Admin membuka **Pembuat QR** di `/portal/admin/qr`. Pilih toko dan jenis QR, lalu tekan **Buat QR**. Hasil ditampilkan beserta tautan tujuannya dan **Unduh PNG**. Riwayat memakai tabel 20 QR per halaman; ketiga menu Admin tetap sama.

## Statis dan dinamis

- **Statis:** PNG menyimpan alamat langsung `/toko/<slug>?src=qr`, tanpa kedaluwarsa. Slug disalin saat QR dibuat; mengunduh ulang menghasilkan tujuan yang sama. Jika slug toko berubah, buat QR statis baru untuk alamat terbaru.
- **Dinamis:** PNG menyimpan `/q/<kode-acak>`. Server membaca toko dan masa berlaku setiap kali tautan dibuka. QR aktif memberi redirect sementara HTTP 307 ke slug toko terbaru dengan `?src=qr`; perubahan slug tidak mengubah PNG dinamis.

Masa berlaku dinamis dipilih sebagai **tanggal dan jam berakhir dalam WIB**, sehingga tiap QR dapat memiliki durasi berbeda, termasuk beberapa jam. Batasnya `created_at < expires_at <= created_at + 15 hari`, diterapkan database. Admin boleh mengubah waktu berakhir dalam batas awal tersebut, tanpa mengganti tanggal pembuatan. QR lama yang sudah melewati batas 15 hari memerlukan kode baru.

Resolver mengembalikan halaman Bahasa Indonesia dengan HTTP **410** untuk QR kedaluwarsa, **404** untuk kode hilang/tidak valid, dan **503** ketika backend tidak tersedia. Redirect dan halaman kesalahan memakai `Cache-Control: no-store`, sehingga hasil aktif tidak disimpan untuk kunjungan setelah kedaluwarsa. Parameter tujuan eksternal diabaikan; resolver hanya mengarahkan ke halaman toko di situs yang sama.

PNG dibuat di server memakai library `qrcode`, ukuran 320px, hitam-putih, quiet zone empat modul, dan koreksi kesalahan M. Unduhan/gambar hanya tersedia untuk sesi admin; tamu memperoleh 401 dan akun toko 403. Kode dinamis yang sudah dicetak memang dapat dibuka publik, tetapi daftar metadata QR tidak dapat dibaca publik/toko melalui API.

## Alamat situs

Atur `SITE_URL=https://domain-situs` pada environment deployment. Gunakan origin saja, tanpa path/query/fragment atau kredensial. Alamat ini disimpan ketika membuat QR agar unduhan lama tidak berubah diam-diam saat konfigurasi situs diperbarui.

Saat `SITE_URL` kosong dalam pengembangan, alamat diturunkan hanya dari Host lokal: localhost/loopback atau IP jaringan privat. Untuk mencoba pemindaian ponsel, jalankan Next.js pada jaringan yang dapat dijangkau ponsel, buka Admin lewat alamat IP jaringan itu, lalu buat QR. QR beralamat `localhost` menunjuk perangkat yang membukanya. Tidak ada pengunggahan QR ke layanan pembuat QR eksternal.

Konfigurasi produksi yang belum memiliki origin valid menampilkan pesan di Pembuat QR; aplikasi tidak membuat tautan dengan domain yang ditebak dari Host publik.

## Database dan akses

Migrasi `202610280007_qr_codes.sql` menambah `qr_codes`, snapshot slug, indeks, RLS khusus admin, serta RPC `resolve_dynamic_qr`. Izin insert sesi admin hanya mencakup toko, jenis, origin, dan expiry; ID/kode/tanggal pembuatan ditentukan database. Update dibatasi ke expiry. Publik hanya boleh menukar satu kode dinamis dengan status dan slug aktif, tanpa membaca tabel.

Resolver tidak mencatat kunjungan. Tracking tahap 8 mencatat saat halaman toko dibuka di browser dengan `src=qr`, sehingga redirect dinamis menghasilkan satu hit. QR kedaluwarsa atau toko tidak ditemukan tidak menghasilkan hit. Lihat [tracking kunjungan](tracking.md).

## Pemeriksaan

```sh
npm run db:migrate
npm run typecheck
npm run test:db
npm run build
npm run test:e2e
npm run qr:verify
```

`qr:verify` memakai Supabase Docker dan Chromium 360px/1440px pada port 3009. PNG hasil endpoint dan unduhan didekode memakai `jsQR` + `pngjs` (dependensi pengujian) untuk membuktikan isi tautan. Tes juga memeriksa perbedaan durasi, WIB dengan zona waktu browser berbeda, pengubahan expiry, larangan menggeser tanggal pembuatan, slug terbaru untuk QR dinamis, snapshot statis, `src=qr`, akses 401/403, kode 404, dan perubahan aktif menjadi 410 tanpa cache. Data QR/toko/akun uji dibersihkan dan server QA dihentikan. Screenshot ada di `test-results/qr/`; jalankan setelah tes Playwright umum.
