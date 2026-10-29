# Cara pakai dari nol

Panduan ini memakai repositori [bisnisPadang](https://github.com/syahh-coder/bisnisPadang). Pilih **Docker lokal** untuk menjalankan semuanya di PC, atau **Supabase hosted/remote** jika database sudah ada di server. Keduanya memakai aplikasi Next.js yang sama.

## 1. Siapkan alat dan unduh proyek

Pasang [Node.js 24](https://nodejs.org/en/download), [Git](https://git-scm.com/downloads), dan [Docker Desktop](https://docs.docker.com/desktop/setup/install/windows-install/). npm ikut terpasang bersama Node.js. Pada Windows, ikuti kebutuhan WSL 2/virtualisasi dari installer Docker dan restart PC jika diminta.

Cek di terminal baru:

```sh
node --version
npm --version
git --version
```

Node harus menunjukkan `v24.x`. Contoh perintah dalam panduan ini memakai `npm` dan `npx`. Jika Windows PowerShell memblokir `npm.ps1`/`npx.ps1`, gunakan `npm.cmd`/`npx.cmd` pada semua perintah. Tidak perlu mengubah execution policy.

Unduh proyek dan pasang dependency:

```sh
git clone https://github.com/syahh-coder/bisnisPadang.git
cd bisnisPadang
npm ci
```

Semua perintah berikutnya dijalankan dari folder `bisnisPadang`, tempat `package.json` berada. Jika proyek sudah ada, cukup buka folder tersebut. Untuk mengambil pembaruan pada checkout tanpa perubahan lokal, jalankan `git pull --ff-only`; jalankan `npm ci` lagi jika dependency berubah.

## 2. Nyalakan Docker

Di Windows, buka **Docker Desktop** dari Start Menu dan tunggu sampai engine berjalan. Gunakan Linux containers; jika menu Docker menawarkan **Switch to Linux containers**, pilih itu. Pengaturan WSL 2 dijelaskan pada [dokumentasi Docker](https://docs.docker.com/desktop/features/wsl/).

Periksa kesiapan engine:

```sh
docker info --format '{{.OSType}}'
```

Hasil yang diharapkan adalah `linux`. Jika muncul error koneksi ke Docker API atau named pipe, engine belum siap; tunggu Docker Desktop selesai memulai, lalu coba pemeriksaan ini lagi. Membuka terminal saja tidak menyalakan Docker Desktop.

Jalankan Supabase lokal:

```sh
npm run db:start
```

Pemakaian pertama mengunduh image dan dapat memerlukan beberapa menit. Tunggu sampai skrip menyatakan migrasi diterapkan dan `.env.local` terhubung. Tidak perlu menjalankan `supabase init`, membuat `docker-compose.yml`, atau membuat proyek Supabase hosted. Supabase CLI sudah terpasang melalui `npm ci`. Stack lokal berjalan di atas Docker sesuai [alur resmi Supabase](https://supabase.com/docs/guides/local-development/cli/getting-started).

`db:start` menyalakan database, Auth, Storage, dan API, menerapkan migrasi yang belum ada, serta mengisi URL/key aplikasi. Data lama di volume dipertahankan.

## 3. Pahami file environment dan Supabase key lokal

**Untuk Docker lokal, key diisi otomatis.** Setelah `db:start` selesai, file `.env.local` berisi:

| Variabel | Isi untuk lokal |
| --- | --- |
| `CATALOG_MODE` | `supabase` |
| `NEXT_PUBLIC_SUPABASE_URL` | `http://127.0.0.1:55321` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable/anon key dari stack lokal, diisi skrip |
| `SITE_URL` | Boleh kosong; QR mengikuti origin lokal yang dipakai Admin |

Tidak perlu menyalin `.env.example` di atas file yang sudah dibuat otomatis. `.env.example` hanya contoh nama konfigurasi, bukan key yang siap dipakai.

Jika stack sudah berjalan tetapi konfigurasi aplikasi belum terisi:

```sh
npm run db:env
```

Mulai ulang Next.js setelah mengubah environment: **Ctrl+C**, lalu `npm run dev` lagi. Gunakan `npm run db:status` untuk melihat alamat layanan tanpa menampilkan key/password. `.env.local` dan `.env.accounts.local` diabaikan Git.

## 4. Buat akun lokal dan buka aplikasi

Pada setup pertama:

```sh
npm run auth:setup
npm run dev
```

Buka http://localhost:3000. Biarkan terminal Next.js tetap berjalan. Terminal lain dapat dipakai untuk perintah database.

`auth:setup` membuat akun lokal dan menyimpan informasi login di `.env.accounts.local`. Buka file tersebut di editor:

| Akun | Email | Kata sandi |
| --- | --- | --- |
| Admin | Nilai `LOCAL_ADMIN_EMAIL` | Nilai `LOCAL_ADMIN_PASSWORD` |
| Pemilik toko | Nilai `LOCAL_STORE_EMAIL` | Nilai `LOCAL_STORE_PASSWORD` |

Email awal adalah `admin@tokolokal.test` dan `toko@tokolokal.test`. Kata sandi dibuat acak; tidak ada password bawaan yang perlu ditebak. Menjalankan ulang `auth:setup` mempertahankan akun/password yang tersimpan. File ini hanya untuk login lokal, bukan untuk diunggah atau dijadikan environment frontend.

Alamat penting:

| Kegunaan | Alamat |
| --- | --- |
| Beranda | http://localhost:3000 |
| Login | http://localhost:3000/akun |
| Form Join Afiliasi | http://localhost:3000/join-afiliasi |
| Portal Admin | http://localhost:3000/portal/admin |
| Portal Toko | http://localhost:3000/portal/toko |
| Supabase Studio lokal | http://127.0.0.1:55323 |
| Email pengembangan | http://127.0.0.1:55324 |

Katalog baru berisi empat kategori dan belum berisi toko. Pesan **Belum ada toko** berarti database berhasil dibaca tetapi datanya masih kosong.

## 5. Login dan tambahkan toko pertama

1. Buka `/akun`, lalu login dengan email/password Admin dari `.env.accounts.local`.
2. Buka menu **Kelola toko**. Isi nama toko, slug, nama pengelola, kategori, nomor WhatsApp, dan alamat. Contoh bentuk slug: `nama-toko`, memakai huruf kecil, angka, dan tanda hubung.
3. Pada **Akun pemilik**, pilih **Pemilik Toko Lokal** untuk menautkan toko ke akun lokal yang dibuat skrip. Pilihan **Belum ditautkan** dapat dipakai jika akun pemilik belum siap.
4. Simpan toko. Pada halaman edit, unggah foto dan tambahkan menu beserta harga. Format foto JPG/PNG/WebP/AVIF/GIF, maksimal 4 MiB melalui form.
5. Buka Beranda atau tautan `/toko/slug-toko` untuk melihat hasil publik.
6. Logout, lalu login memakai `LOCAL_STORE_EMAIL` dan `LOCAL_STORE_PASSWORD`. Portal Toko kini dapat mengelola toko yang ditautkan tadi.

Jika akun toko menampilkan pesan belum ditautkan, login sebagai Admin dan periksa kembali **Akun pemilik** pada toko tersebut. Membuat akun saja tidak otomatis membuat toko.

Pemilik memiliki tiga menu: **Dashboard**, **Info toko**, dan **Menu / Produk**. Input omset/jumlah transaksi dilakukan manual per tanggal WIB. Tabel pengunjung menghitung pembukaan halaman hari ini, termasuk kunjungan ulang. Perubahan data/foto/menu dibaca halaman publik pada pemuatan berikutnya.

Untuk akun pemilik tambahan, buat pengguna melalui pengelola Auth di Studio/dashboard Supabase, pastikan email terkonfirmasi, lalu tautkan melalui **Akun pemilik**. Profil pengguna baru otomatis ber-role `toko`. Form aplikasi tidak membuat akun Auth baru.

## 6. Join afiliasi, QR, dan sumber kunjungan

Pengunjung dapat membuka **Join Afiliasi** tanpa login. Isi nama pengelola, nomor WA, alamat, tanggal, jam, serta catatan opsional. Slot tersedia mulai besok hingga 14 hari ke depan, selain Minggu, pukul 09:00/11:00/13:00/15:00 WIB. Simpan tautan konfirmasi; pembatalan sebelum dikonfirmasi tersedia melalui browser yang sama.

Admin memeriksa permohonan dan mengubah status melalui **Kelola toko**. Pengajuan afiliasi tidak otomatis membuat akun login atau toko; Admin menambahkan dan menautkan toko melalui alur pengelolaan.

Untuk QR, buka **Pembuat QR**, pilih toko dan jenisnya, lalu tekan **Buat QR**. QR statis langsung membuka halaman toko. QR dinamis mempunyai tanggal/jam berakhir dalam WIB, maksimal 15 hari sejak dibuat. Gunakan **Unduh PNG** untuk menyimpan gambar. QR yang dibuat dengan alamat `localhost` hanya sesuai untuk PC tersebut; untuk penggunaan publik, gunakan alamat situs HTTPS dan atur `SITE_URL` sebelum membuat QR.

Sumber pengunjung memakai parameter halaman toko:

| Tautan | Sumber |
| --- | --- |
| `/toko/slug-toko?src=qr` | QR; ditambahkan otomatis oleh pembuat QR |
| `/toko/slug-toko?src=search` | Pencarian; ditambahkan otomatis dari hasil pencarian |
| `/toko/slug-toko?src=google_maps` | Google Maps; pasang tautan ini sebagai situs di profil bisnis Google Maps |
| `/toko/slug-toko` | Langsung |

Untuk alamat pada Google Maps, gunakan URL lengkap situs publik di depan path. Memuat ulang Dashboard memperbarui statistik. Rincian ada di [tracking](tracking.md) dan [QR](qr.md).

## 7. Menyalakan lagi dan mematikan

Setiap kali PC baru dinyalakan, buka Docker Desktop dan tunggu engine siap, lalu:

```sh
npm run db:start
npm run dev
```

`npm ci` tidak perlu diulang setiap hari. `auth:setup` hanya diperlukan saat menyiapkan akun lokal. Data tidak hilang hanya karena aplikasi atau container dihentikan.

Untuk berhenti, tekan **Ctrl+C** pada terminal Next.js, lalu:

```sh
npm run db:stop
```

Setelah stack berhenti, Docker Desktop boleh ditutup. Hindari menghapus volume atau menjalankan reset database jika ingin mempertahankan data.

Jika ingin menjalankan hasil build produksi di PC, hentikan server dev terlebih dahulu, lalu:

```sh
npm run build
npm run start
```

Supabase tetap harus aktif. Mode produksi ini tetap aplikasi lokal; bukan deployment Vercel.

## 8. Memakai Supabase hosted/remote

Bagian ini merupakan alternatif Docker lokal. Tidak perlu menjalankan Docker untuk aplikasi yang sudah terhubung ke Supabase hosted. Jangan mencampur URL remote dengan key lokal.

### Siapkan schema dan akun

Buat proyek Supabase baru untuk schema aplikasi ini. Di **SQL Editor**, jalankan seluruh isi file dalam `supabase/migrations/` satu per satu sesuai urutan nama, dari `202610280001_public_catalog.sql` sampai `202610280008_store_visits.sql`. Migrasi membuat tabel, fungsi, RLS, bucket foto, dan empat kategori. Migrasi awal ditujukan untuk schema aplikasi baru dan dijalankan satu kali; memasukkan key saja belum membuat tabel.

Jika menggunakan CLI untuk proyek hosted, alternatif alurnya adalah `npx supabase login`, `npx supabase link --project-ref PROJECT_REF_ANDA`, lalu `npx supabase db push --dry-run` untuk meninjau migrasi sebelum `npx supabase db push`. Gunakan nilai project reference yang benar; ikuti prompt login/password di terminal atau browser. Alur migrasi remote dijelaskan pada [dokumentasi Supabase](https://supabase.com/docs/guides/deployment/database-migrations).

Buat akun email/kata sandi melalui **Authentication → Users** dan pastikan email terkonfirmasi. Profil akan dibuat otomatis dengan role `toko`. Untuk admin pertama, salin UUID pengguna yang memang ditunjuk sebagai Admin, lalu jalankan di SQL Editor setelah mengganti placeholder berikut:

```sql
update public.profiles
set role = 'admin'
where id = 'GANTI_DENGAN_UUID_AKUN_ADMIN'::uuid;
```

Nonaktifkan pendaftaran akun publik pada pengaturan Auth, tetapi pertahankan provider email/kata sandi agar akun yang dibuat pengelola dapat login. Aplikasi menyediakan Join Afiliasi sebagai alur publik.

`npm run auth:setup`, `db:start`, dan `db:migrate` adalah alat **Docker lokal**, bukan alat untuk menyiapkan akun atau database hosted.

### Ambil URL dan key, lalu isi environment

Di proyek Supabase yang sama, ambil **Project URL/API URL** melalui dialog **Connect** atau pengaturan Data API. Gunakan URL HTTPS seperti `https://PROJECT_REF_ANDA.supabase.co`, bukan URL PostgreSQL `postgresql://...`.

Buka **Settings → API Keys** dan salin **Publishable key** (`sb_publishable_...`). Jangan memilih Secret key atau `service_role`. Lokasi dan jenis key dijelaskan pada [panduan API keys Supabase](https://supabase.com/docs/guides/getting-started/api-keys).

Jika belum ada `.env.local`, salin `.env.example` menjadi `.env.local` melalui editor. Jika sudah ada, edit file yang sama. Isinya untuk aplikasi yang masih dibuka di PC:

```dotenv
CATALOG_MODE=supabase
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF_ANDA.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=PASTE_PUBLISHABLE_KEY_DI_SINI
SITE_URL=http://localhost:3000
```

Ganti dua placeholder dengan nilai proyekmu. Bila memakai legacy anon key, isikan nilainya pada variabel `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` yang sama; kode aplikasi tidak membaca variabel bernama `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

Hentikan dan jalankan ulang `npm run dev`. Login menggunakan akun yang dibuat pada proyek hosted, bukan akun dari `.env.accounts.local` milik Docker. Mulai mengisi toko melalui Portal Admin sebagaimana langkah 5.

Untuk Vercel, isi empat variabel tersebut di pengaturan environment Vercel, gunakan `SITE_URL` berupa origin HTTPS final, dan sesuaikan Site URL pada Auth Supabase. Ikuti [panduan deployment](deployment.md); endpoint Supabase di PC tidak dapat digunakan server Vercel.

### Kembali dari remote ke Docker lokal

Simpan salinan konfigurasi remote di `.env.remote.local` melalui editor agar tidak hilang; file itu juga diabaikan Git. Di `.env.local`, ubah URL ke `http://127.0.0.1:55321` dan kosongkan `SITE_URL`. Nyalakan Docker, jalankan `npm run db:start`, lalu mulai ulang Next.js. Skrip akan mengisi key lokal dan `CATALOG_MODE=supabase`.

Jika URL di `.env.local` masih remote, skrip lokal sengaja menolak menggantinya secara otomatis. Mengganti koneksi tidak menyalin data atau akun antara backend lokal dan hosted.

## 9. Jika terjadi masalah

| Gejala | Yang diperiksa |
| --- | --- |
| `npm.ps1 cannot be loaded` | Gunakan `npm.cmd`; untuk npx gunakan `npx.cmd`. |
| `docker` tidak ditemukan | Pasang Docker Desktop, lalu buka terminal baru. |
| Koneksi Docker API/named pipe gagal | Buka Docker Desktop, tunggu engine siap, dan periksa `docker info --format '{{.OSType}}'`. |
| Container masih `starting` / `supabase start is already running` | Tunggu proses startup sebelumnya selesai. Periksa Docker Desktop dan `npm run db:status`; jalankan ulang `db:start` setelah stack siap agar migrasi/env selesai. |
| Port `3000` digunakan | Hentikan server proyek yang lama dari terminalnya, atau pakai `npm run dev -- --port 3001` dan buka alamat port baru. Sesuaikan `SITE_URL` bila diisi. |
| Port `55321`–`55324` digunakan | Periksa stack/container yang memakai port tersebut. Hentikan stack yang berbenturan sebelum menyalakan proyek ini. |
| **Daftar toko belum tersedia** | Lokal: cek Docker, `db:status`, lalu `db:env`. Remote: periksa URL/key dari proyek yang sama dan pastikan delapan migrasi sudah diterapkan. Mulai ulang Next.js. |
| **Belum ada toko** | Database terbaca tetapi kosong. Tambahkan toko melalui Admin. |
| Login lokal gagal | Gunakan nilai dari `.env.accounts.local`, cek `db:status`, dan pastikan `auth:setup` sudah berhasil. |
| Akun tersimpan tidak cocok dengan database | Periksa akun pada Studio dan file akun lokal; skrip tidak menimpa akun/password secara otomatis. Ini dapat terjadi setelah database/volume dihapus. |
| Akun toko belum ditautkan | Login Admin, edit toko, lalu pilih akun pada **Akun pemilik**. |
| QR mengarah ke alamat lama | Periksa `SITE_URL` sebelum membuat QR baru; origin disimpan ketika QR dibuat. |

## 10. Panduan lanjutan

- [Database lokal dan daftar perintah](local-database.md)
- [Akun dan role](auth.md)
- [Portal Admin dan afiliasi](admin.md)
- [Portal Toko](store-portal.md)
- [Deployment Vercel](deployment.md)
- [Hasil pemeriksaan tahap 9](qa-stage9.md)
