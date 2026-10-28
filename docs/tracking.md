# Tracking kunjungan — langkah 8

Halaman `/toko/<slug>` yang memakai data Supabase mencatat pembukaan halaman ketika browser selesai menjalankan JavaScript dan halaman terlihat. Dashboard Toko menampilkan jumlah hari ini dalam tabel sumber dan total. Angka adalah pembukaan halaman, termasuk kunjungan ulang, bukan jumlah orang unik.

| Parameter pada halaman toko | Sumber di Dashboard |
| --- | --- |
| `?src=google_maps` | Google Maps |
| `?src=qr` | QR |
| `?src=search` | Pencarian |
| Tanpa `src`, nilai lain, atau parameter `src` berulang | Langsung |

Tautan hasil Pencarian otomatis memakai `src=search`. QR statis langsung memakai `src=qr`; QR dinamis mengarah ke resolver lalu halaman toko dengan parameter yang sama. Untuk sumber Google Maps, isi tautan situs pada profil bisnis dengan alamat halaman toko beserta `?src=google_maps`. Sumber dibaca dari parameter tersebut, bukan ditebak dari referrer.

## Kapan dicatat

Komponen browser mengirim POST JSON ke `/api/visits` dengan ID toko, UUID kejadian, dan sumber. Setiap pembukaan memperoleh UUID baru. Reload, navigasi kembali/maju, serta kunjungan melalui navigasi Next.js dihitung sebagai pembukaan baru. Pemulihan halaman melalui cache kembali/maju browser juga memulai kejadian baru.

Kegagalan jaringan atau respons server 5xx dicoba ulang sekali dengan UUID yang sama. Primary key database membuat retry dan dua kiriman bersamaan dengan ID sama tetap menghasilkan satu baris. Pelacakan tidak menghalangi tampilan toko ketika gagal.

Metadata, prefetch Next.js, GET/HEAD server, dan resolver QR sendiri tidak menulis kunjungan. Satu pembukaan QR dinamis hanya dihitung pada halaman toko setelah redirect. Mode demo, toko hilang, halaman gagal dimuat, dan QR kedaluwarsa tidak mencatat hit. Browser tanpa JavaScript, pemblokir request, atau koneksi terputus dapat menyebabkan kunjungan tidak tercatat; ini merupakan pengukuran pembukaan halaman dari browser.

## Endpoint dan database

Endpoint hanya menerima JSON dari origin situs yang sama, membatasi payload 1 KiB, memvalidasi UUID toko/kejadian, dan menormalkan sumber. Pemeriksaan origin menggunakan Host request agar tetap benar saat server lokal diikat ke `0.0.0.0`. Input waktu dari klien diabaikan. Respons memakai `no-store`.

Migrasi `202610280008_store_visits.sql` menyimpan `id`, `store_id`, `visited_at`, dan `source`. RPC `record_store_visit` memeriksa keberadaan toko, membatasi sumber, menentukan waktu dari default database, serta mengabaikan UUID yang sudah tercatat. Menghapus toko menghapus kunjungannya melalui foreign key cascade.

Publik tidak dapat membaca statistik. RLS mengizinkan pemilik membaca kunjungan toko sendiri dan admin membaca seluruh toko. Tidak ada izin insert/update/delete langsung bagi sesi aplikasi, termasuk admin; pencatatan publik hanya melalui fungsi terbatas tersebut. RPC ringkasan `store_visit_summary` memakai SECURITY INVOKER dan pemeriksaan akses toko, sehingga permintaan untuk toko milik akun lain ditolak.

Ringkasan menghitung interval mulai pukul 00:00 WIB hari ini, inklusif, hingga pukul 00:00 WIB besok, eksklusif. Zona `Asia/Jakarta` ditentukan di database sehingga tidak bergantung pada zona perangkat atau sesi SQL. Empat sumber selalu tersedia, termasuk angka nol jika memang belum ada kunjungan. Tanggal statistik selalu hari ini, terpisah dari filter tanggal omset. Data diperbarui ketika Dashboard dimuat; kegagalan membaca data menampilkan pesan, bukan angka nol.

Tidak ada penyimpanan IP, user-agent, fingerprint, cookie, atau identitas pengunjung dalam tabel kunjungan. Request pelacakan memakai `credentials: omit`. UUID menandai satu pembukaan halaman dan tidak dipakai sebagai identitas pengunjung lintas kunjungan.

## Pemeriksaan

```sh
npm run db:migrate
npm run typecheck
npm run test:db
npm run build
npm run test:e2e
npm run visits:verify
```

Tes database mencakup izin publik/pemilik/admin, larangan tulis langsung, idempotensi, waktu server, batas hari WIB, serta cascade. Tes browser umum memakai 360px, 640px, dan 1440px untuk sumber, reload, retry, mode demo, toko hilang, serta fallback UUID pada HTTP lokal.

`visits:verify` memakai Supabase Docker sebenarnya dan Chromium pada 360px/1440px. Server Next.js sementara berjalan pada port 3010, diikat ke `0.0.0.0` dan diakses lewat loopback untuk memverifikasi origin. Pemeriksaan mencakup validasi endpoint, kiriman bersamaan, QR satu hit, GET/HEAD/prefetch tanpa hit, sumber, pencarian SPA, kembali/maju, retry, waktu server/WIB, dan privasi Dashboard. Toko, QR, kunjungan, dan akun sementara dibersihkan setelah tes; server QA dihentikan. Screenshot ada di `test-results/visits/`. Jalankan setelah tes Playwright umum agar hasil gambar tidak ikut dibersihkan.
