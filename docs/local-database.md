# Supabase lokal melalui Docker

Database pengembangan memakai PostgreSQL 17 dari Supabase lokal. Supabase dipilih agar database, Auth, Storage, PostgREST, dan RLS tetap memakai stack yang sama sampai tahap portal dan deployment.

Untuk langkah instalasi dan penggunaan pertama, ikuti [cara pakai dari nol](cara-pakai.md). Dokumen ini merinci perintah dan alamat layanan.

## Menjalankan

Aktifkan Docker Desktop dengan engine Linux. Dari root proyek:

```sh
npm ci
npm run db:start
npm run auth:setup
npm run dev
```

Di PowerShell dengan pembatasan `npm.ps1`, gunakan `npm.cmd`. Buka Docker Desktop terlebih dahulu dan tunggu engine Linux siap; periksa dengan `docker info --format '{{.OSType}}'`. `auth:setup` hanya diperlukan saat menyiapkan akun lokal.

`db:start` mengunduh image pada pemakaian pertama, menjalankan container proyek `web-bisnis-padang`, menerapkan migrasi tertunda, dan mengisi `.env.local` dengan URL serta publishable/anon key lokal. Service-role key tidak ditulis ke aplikasi atau ditampilkan oleh skrip. Nilai environment lain yang sudah ada dipertahankan; skrip menolak mengganti koneksi Supabase remote secara otomatis.

| Layanan | Alamat |
| --- | --- |
| Aplikasi Next.js | http://localhost:3000 |
| API Supabase | http://127.0.0.1:55321 |
| PostgreSQL | `127.0.0.1:55322` |
| Supabase Studio | http://127.0.0.1:55323 |
| Email pengembangan | http://127.0.0.1:55324 |

Auth dan Storage tersedia di stack. Realtime, analytics, edge runtime, dan transformasi gambar tidak dijalankan karena belum dibutuhkan aplikasi.

## Perintah harian

| Perintah | Hasil |
| --- | --- |
| `npm run db:start` | Menjalankan stack, migrasi tertunda, dan konfigurasi aplikasi |
| `npm run db:status` | Menampilkan alamat layanan tanpa key/password |
| `npm run db:stop` | Menghentikan stack proyek dengan volume/data tetap disimpan |
| `npm run db:migrate` | Menerapkan migrasi baru pada database lokal tanpa reset |
| `npm run db:env` | Menghubungkan ulang `.env.local` ke stack lokal yang berjalan |
| `npm run db:verify` | Memverifikasi database, API/RLS, dan tampilan pada 360px serta desktop |
| `npm run auth:setup` | Membuat akun admin/toko lokal; kredensial di `.env.accounts.local` |
| `npm run auth:verify` | Memverifikasi login, sesi cookie, role, serta isolasi toko/menu/foto |

Data tersimpan di volume Docker, bukan di berkas proyek yang di-commit. `.env.local`, state sementara CLI, dan screenshot tes diabaikan Git. Tidak ada perintah reset otomatis dalam alur ini.

## Isi awal dan pengelolaan

Migrasi awal menyediakan kategori Makanan, Minuman, Jasa, dan Belanja. Tabel toko/menu kosong sampai diisi dengan data sungguhan. Tidak ada seed toko fiktif otomatis.

Tambahkan toko melalui **Kelola toko** di Portal Admin, lalu pilih **Akun pemilik** untuk menautkannya. Studio tetap dapat digunakan untuk inspeksi data. Jika mengisi tabel langsung, gunakan `category_id` dari tabel kategori; `stores.owner_id` boleh kosong sampai akun pemilik disiapkan. Baris di `products` harus menunjuk ke ID toko dan memiliki harga. Perubahan terlihat pada permintaan halaman berikutnya.

Foto toko memakai bucket publik `store-media`. Form unggah Admin/Toko menerima foto maksimal 4 MiB. Untuk unggahan langsung melalui Storage di Studio, simpan path relatifnya ke `stores.photo_path`. Lihat [panduan detail toko](store-details.md). Tidak ada izin unggah anonim; RLS membatasi foto pemilik ke `stores/<id-toko>/` miliknya.

Untuk mencoba tampilan tanpa mengisi database, mode `CATALOG_MODE=demo` tetap tersedia. Data tersebut terpisah dari PostgreSQL. `db:env` mengembalikan mode aplikasi menjadi `supabase`; jalankan ulang server Next.js setelah mengganti environment.

## Verifikasi

```sh
npm run build
npx playwright install chromium
npm run db:verify
```

Skrip hanya menggunakan stack lokal proyek ini. Dua toko/menu uji dibuat dengan UUID acak dan dihapus berdasarkan UUID tersebut. Satu foto diunggah/dibersihkan dengan service-role key yang hanya berada di memori skrip; aplikasi tetap membaca melalui publishable key dan RLS. Unggah anonim harus ditolak. Profil uji dibuat dalam transaksi yang di-rollback. Toko pengguna lain dipertahankan. Browser memeriksa katalog, detail, menu kosong, foto dari Storage, tautan kontak, dan lebar 360px/1440px. Iframe Google diganti respons lokal saat tes. Port 3004 dipakai selama tes lalu server uji dihentikan; container database tetap berjalan.

Verifikasi awal berhasil pada Docker Engine 29.7.2, Supabase CLI 2.122.0, dan PostgreSQL 17.11. Hasil screenshot ada di `test-results/local-db/`.

## Saat deploy

Untuk Vercel, gunakan endpoint Supabase yang dapat dijangkau server Vercel: Supabase Docker di server/VPS dengan HTTPS atau Supabase hosted. Database lokal PC tetap dipakai untuk pengembangan. Migrasi SQL dan adapter aplikasi dapat digunakan kembali; URL/key deployment diatur melalui environment Vercel.

Referensi: [Supabase Local Development](https://supabase.com/docs/guides/local-development/cli/getting-started), [konfigurasi CLI](https://supabase.com/docs/guides/local-development/cli/config), dan [migrasi database](https://supabase.com/docs/guides/local-development/database-migrations).
