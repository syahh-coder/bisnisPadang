# Toko Lokal

Marketplace UMKM dengan Next.js App Router, TypeScript, Tailwind CSS, Supabase, dan `qrcode`. Target hosting: Vercel.

Repositori: [syahh-coder/bisnisPadang](https://github.com/syahh-coder/bisnisPadang).

**Baru mulai? Baca [cara pakai dari nol](docs/cara-pakai.md)** untuk instalasi, menyalakan Docker, konfigurasi Supabase/key, login, menambahkan toko, dan mengatasi error.

## Status

Langkah 1–8: setup, token desain, landing page, detail toko, login/role, Portal Admin, reservasi afiliasi, Portal Toko, QR statis/dinamis, serta tracking kunjungan. Pencarian mengabaikan kapital, bekerja langsung saat mengetik di halaman Pencarian, dan tersimpan di URL. Kategori dapat digabung dengan kata kunci. Daftar memakai 20 toko per halaman agar tidak memuat seluruh katalog sekaligus.

Tahap 9 lokal selesai: polish, pemulihan kesalahan Bahasa Indonesia, perbaikan pencarian sebelum JavaScript siap, pemeriksaan responsif/kompatibilitas, validasi foto 4 MiB, serta persiapan Vercel. [Hasil pemeriksaan tahap 9](docs/qa-stage9.md). Publikasi ditunda sesuai keputusan pengguna.

Database utama pengembangan sekarang Supabase lokal (PostgreSQL 17) melalui Docker. Migrasi katalog sudah diterapkan dan koneksi aplikasi aktif melalui `.env.local`; empat kategori tersedia, sedangkan toko sungguhan belum ditambahkan. RLS dan integrasi API telah diverifikasi pada Supabase Docker, termasuk tampilan 360px dan desktop. Mode demo tanpa database tetap tersedia sebagai opsi terpisah.

Baris toko membuka `/toko/[slug]`, berisi foto, kontak WhatsApp/telepon, delivery, alamat, iframe Google Maps, dan menu/harga dalam rupiah. Tombol kembali mempertahankan pencarian serta kategori. Toko tidak ditemukan, koneksi gagal, foto gagal, nomor kosong, dan menu kosong memiliki tampilan masing-masing. Foto menggunakan bucket publik `store-media`; [cara mengisi data](docs/store-details.md).

Halaman Akun menyediakan login email/kata sandi dan logout. Role dari database menentukan akses ke `/portal/admin` atau `/portal/toko`; cookie sesi HttpOnly diperbarui melalui Proxy. RLS membatasi data bisnis dan foto pemilik, sementara admin dapat mengelola seluruh data aplikasi yang sudah dibuat. [Panduan akun dan role](docs/auth.md).

Portal Admin menyediakan tepat tiga menu: Pembuat QR, Daftar toko, dan Kelola toko. Daftar serta tambah/edit data toko, penautan akun pemilik, foto, menu, dan pengelolaan janji temu sudah tersedia. Form Join Afiliasi gratis beserta reservasi/pembatalan sudah memakai database. [Panduan Admin dan afiliasi](docs/admin.md).

Pembuat QR sudah menghasilkan PNG statis atau dinamis untuk toko. Dinamis memiliki waktu berakhir per QR, maksimal 15 hari sejak dibuat; resolver menolak QR kedaluwarsa dan mengikuti slug toko terbaru. Kedua jenis membuka halaman toko dengan `src=qr`. Konfigurasikan `SITE_URL` untuk alamat publik saat deploy. [Panduan QR](docs/qr.md).

Portal Toko menyediakan Dashboard, Info toko, dan Menu / Produk. Pemilik bisa mengedit data/foto/menu serta menginput, memperbarui, atau menghapus catatan omset dan jumlah transaksi per tanggal. Ringkasan memakai tabel tujuh hari. Dashboard menampilkan kunjungan hari ini menurut WIB beserta sumber Google Maps, QR, Pencarian, dan Langsung; RLS membatasi statistik ke toko miliknya. [Panduan Portal Toko](docs/store-portal.md) dan [tracking kunjungan](docs/tracking.md).

Sumber kebenaran: `ai.md`, `desain.md`, dan `fitur.md`. Prototipe yang tersedia ada di `index.html` pada root; berkas tersebut dipertahankan. Jika berbeda, aturan `desain.md` berlaku, termasuk pergantian navigasi pada lebar 640px dan tombol Pencarian 56px.

## Menjalankan

Siapkan Git, Node.js 24 beserta npm, dan Docker Desktop. Versi Node dikunci ke `24.x` agar pengembangan dan build Vercel konsisten. Di Windows, buka **Docker Desktop** dari Start Menu, tunggu engine berjalan, dan gunakan Linux containers. Detail: [menyalakan Docker](docs/cara-pakai.md#2-nyalakan-docker).

Jika belum mengunduh proyek:

```sh
git clone https://github.com/syahh-coder/bisnisPadang.git
cd bisnisPadang
```

Jalankan perintah berikut dari folder proyek. **Di Windows PowerShell**, gunakan `npm.cmd` jika `npm.ps1` diblokir; misalnya `npm.cmd run db:start`.

```sh
npm ci
npm run db:start
npm run auth:setup
npm run dev
```

Buka http://localhost:3000. Biarkan terminal `npm run dev` tetap terbuka. Supabase CLI sudah termasuk dependency proyek; tidak perlu memasangnya secara global atau membuat proyek di dashboard Supabase untuk mode lokal.

`db:start` menjalankan stack Supabase dalam Docker, menerapkan migrasi yang belum dijalankan, dan mengisi `.env.local` otomatis tanpa menampilkan key. Data tersimpan di volume Docker. Studio tersedia di http://127.0.0.1:55323 untuk mengelola isi database lokal. Lihat [panduan database lokal](docs/local-database.md) untuk port dan perintah start/stop/status.

`auth:setup` membuat akun admin dan toko lokal. Email/kata sandi acak tersimpan di `.env.accounts.local`, yang diabaikan Git; menjalankan ulang tidak mengganti kata sandi. Akun toko awal belum terhubung ke toko. Signup publik Supabase dinonaktifkan; Join Afiliasi tetap menjadi alur pendaftaran publik.

Untuk mulai mengisi data, buka `.env.accounts.local` di editor dan gunakan `LOCAL_ADMIN_EMAIL` serta `LOCAL_ADMIN_PASSWORD` untuk login di http://localhost:3000/akun. Masuk ke **Kelola toko**, tambahkan toko, lalu pilih **Pemilik Toko Lokal** pada **Akun pemilik** agar akun toko awal dapat mengelolanya. Kredensial akun toko memakai `LOCAL_STORE_EMAIL` dan `LOCAL_STORE_PASSWORD`. Lihat [alur penggunaan pertama](docs/cara-pakai.md#5-login-dan-tambahkan-toko-pertama).

Untuk pemakaian berikutnya, buka Docker Desktop, lalu jalankan `npm run db:start` dan `npm run dev`. Saat selesai, hentikan Next.js dengan **Ctrl+C**, kemudian jalankan `npm run db:stop`; data tetap tersimpan. `npm ci` dan `auth:setup` tidak perlu diulang setiap kali membuka aplikasi.

Untuk pratinjau tanpa Docker, ubah `CATALOG_MODE=demo` di `.env.local`. Lima toko fiktif tersedia dengan label data contoh. Mode ini tidak menulis ke Supabase dan tidak mengimpor toko contoh ke database. `db:start`/`db:env` mengembalikan aplikasi ke database lokal.

### Mengisi Supabase key

**Docker lokal:** `npm run db:start` membuat `.env.local` dengan URL dan publishable/anon key lokal secara otomatis. Jika hanya perlu memperbarui koneksi stack yang sudah aktif, jalankan `npm run db:env`, lalu mulai ulang Next.js. Tidak perlu menyalin key dari dashboard hosted.

**Supabase hosted/remote:** siapkan schema melalui delapan migrasi, lalu isi `.env.local` memakai URL API dan publishable key milik proyek remote yang sama:

```dotenv
CATALOG_MODE=supabase
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF_ANDA.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=PASTE_PUBLISHABLE_KEY_DI_SINI
SITE_URL=http://localhost:3000
```

Salin key dari **Settings → API Keys** di dashboard Supabase; gunakan **Publishable key**, bukan Secret/service-role key. Alur lengkap, lokasi URL, pembuatan admin, dan pergantian backend ada di [panduan Supabase remote](docs/cara-pakai.md#8-memakai-supabase-hostedremote). Mulai ulang `npm run dev` setelah mengubah environment. Untuk deployment, ganti `SITE_URL` dengan domain HTTPS situs.

Tanpa konfigurasi atau saat backend gagal, halaman menampilkan pesan daftar tidak tersedia beserta tautan coba lagi. Tidak ada perpindahan otomatis ke data demo saat Supabase gagal.

Jangan commit `.env.local` atau menaruh secret pada variabel `NEXT_PUBLIC_*`. Pembacaan katalog menggunakan publishable key dan RLS; service-role key tidak diperlukan.

## Pemeriksaan

```sh
npm run typecheck
npm run build
npm run test:db
npx playwright install chromium firefox webkit
npm run test:e2e
npm run test:e2e:compat
npm run db:verify
npm run auth:verify
npm run admin:verify
npm run owner:verify
npm run qr:verify
npm run visits:verify
```

Pengujian browser memakai hasil production build pada lebar 360px, 640px, dan 1440px: layout, navigasi, preferensi gerak dikurangi, keyboard, pencarian/kategori, URL/riwayat, detail toko, tautan kontak, URL peta, foto/fallback, menu, dan label mode demo. Iframe Google diganti respons lokal saat tes agar pemeriksaan tidak bergantung pada jaringan Google. Screenshot disimpan di `test-results/` yang diabaikan Git.

`test:db` menjalankan migrasi pada PostgreSQL ringan berbasis PGlite. `test:e2e` memakai pengganti HTTP PostgREST khusus tes pada port 3101 dan server Next.js pada port 3000/3002, sehingga dapat dijalankan tanpa Docker.

`test:e2e:compat` menjalankan rangkaian browser di Firefox dan WebKit pada 360px/1440px. Pemeriksaan responsif tambahan mencakup 320px, batas 639px/640px, tablet 768px, 1024px, dan landscape 740×360. Hasil Chromium disimpan di `test-results/chromium/` dan kompatibilitas di `test-results/compat/`, agar hasil antarperintah tidak saling dibersihkan. WebKit menguji engine browser; perangkat Safari/iOS fisik belum diuji.

`db:verify` memeriksa Supabase Docker yang sebenarnya: katalog/menu, detail toko, foto Storage, hak akses anonim, isolasi profil, serta browser 360px/1440px melalui Next.js pada port 3004. Dua toko dengan UUID acak dan satu foto dibuat hanya selama tes lalu dihapus; toko lain tidak diubah. Profil uji dibatalkan melalui rollback. Skrip memakai service-role key di memori hanya untuk menyiapkan/membersihkan foto uji, bukan untuk pembacaan aplikasi. Jalankan setelah `db:start`, `build`, dan pemasangan Chromium. Screenshot ada di `test-results/local-db/`.

`auth:verify` menguji Auth/PostgREST/Storage Docker dengan akun uji sementara: login/logout, sesi diperbarui, cookie palsu ditolak, pemilik tidak dapat mengakses toko/menu/foto lain, admin dapat mengelola seluruh data, dan role dari metadata/form diabaikan. Browser diuji pada 360px/1440px melalui port 3005. Data uji dibersihkan tanpa menghapus akun lokal dari `auth:setup`. Jalankan pemeriksaan browser satu per satu agar screenshot tidak saling dibersihkan.

`admin:verify` menguji perebutan slot bersamaan, join, privasi konfirmasi, pembatalan, perubahan status, tiga menu Admin, tambah/edit toko, menu, unggah foto, dan hasil katalog publik di Supabase Docker. Browser memakai 360px/1440px melalui port 3007. Data/foto/akun sementara dibersihkan; hasil gambar ada di `test-results/admin/`.

`owner:verify` memeriksa Dashboard Toko, input/edit/hapus omset dan penjualan, batas akses pemilik, data toko/menu/foto, hasil publik, pilih cabang, dan akun belum ditautkan pada Supabase Docker. Browser memakai 360px/1440px melalui port 3008. Data uji dibersihkan; hasil gambar ada di `test-results/owner/`.

`qr:verify` menguji QR statis/dinamis di Supabase Docker pada 360px/1440px melalui port 3009. PNG endpoint dan unduhan didekode untuk memverifikasi tautan, kemudian diperiksa expiry per QR, WIB, batas 15 hari, slug terbaru, hak admin, dan status 404/410 tanpa cache. Data uji dibersihkan; hasil gambar ada di `test-results/qr/`.

`visits:verify` memeriksa tracking di Supabase Docker pada 360px/1440px melalui port 3010: sumber kunjungan, QR satu hit, reload/kembali/maju, pencarian SPA, retry dengan ID sama, waktu server, batas hari WIB, validasi endpoint, dan isolasi statistik pemilik. GET/prefetch, resolver, toko hilang, serta QR kedaluwarsa tidak menambah hit. Data/akun sementara dibersihkan dan server QA dihentikan; screenshot ada di `test-results/visits/`.

## Struktur

- `src/app/`: layout App Router, halaman, metadata, token Tailwind, dan gaya global.
- `src/components/`: header, navigasi, ikon SVG, serta keadaan kosong.
- `src/lib/catalog/`: adapter Supabase, data demo terpisah, serta pembacaan filter URL.
- `src/lib/stores/`: pembacaan detail/menu dan pembentukan tautan kontak/peta.
- `src/lib/auth/`, `src/proxy.ts`: verifikasi akun/role dan penyegaran cookie sesi.
- `supabase/migrations/`: migrasi katalog publik beserta RLS dan fungsi pencarian.
- `supabase/config.toml`: konfigurasi Supabase Docker per proyek.
- `scripts/`: perintah database lokal serta verifikasi integrasi Docker.
- `docs/database.md`: rancangan database lengkap dan status implementasinya.
- `tests/`: pemeriksaan browser, SQL/RLS, dan backend lokal khusus pengujian.

Font menggunakan system-ui dengan Inter sebagai pilihan jika terpasang pada perangkat. Tidak ada unduhan font eksternal yang diperlukan saat build.

## Deployment

Persiapan langkah 9 mencakup `vercel.json`, Node.js `24.x`, `.vercelignore`, serta [panduan deployment](docs/deployment.md). Build memakai Next.js standar dengan output bawaan. **Publikasi ditunda sesuai keputusan pengguna; belum ada deployment atau URL publik.**

Database Docker pada PC dipakai untuk pengembangan. Saat deploy Vercel, endpoint Supabase harus dapat diakses dari server Vercel, misalnya Supabase Docker di server/VPS dengan HTTPS atau Supabase hosted. `localhost` PC tidak menjadi database Vercel.

## Progres

Fitur langkah 1–8 dan pekerjaan lokal langkah 9 selesai. Publikasi Vercel dilakukan nanti sesuai keputusan pengguna; [panduan deployment](docs/deployment.md) sudah tersedia.

| Tahap | Status |
| --- | --- |
| 1. Setup, layout, token desain | Selesai |
| 2. Landing page | Selesai |
| 3. Detail toko | Selesai |
| 4. Auth dan role | Selesai |
| 5. Portal Admin dan reservasi afiliasi | Selesai |
| 6. Dashboard Toko | Selesai |
| 7. QR statis dan dinamis | Selesai |
| 8. Tracking kunjungan | Selesai |
| 9. Polish dan deploy | Lokal selesai; deploy ditunda sesuai keputusan pengguna |

Referensi setup: [Next.js](https://nextjs.org/docs/app/getting-started/installation), [Tailwind CSS](https://tailwindcss.com/docs/installation/framework-guides/nextjs), dan [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client).
