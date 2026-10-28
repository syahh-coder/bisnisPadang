# Persiapan deployment — langkah 9

Tahap 9 dikerjakan dan diuji di lokal. Sesuai keputusan pengguna, publikasi ke Vercel ditunda. Belum ada URL publik atau database produksi yang dikonfigurasi; Supabase Docker di PC tetap menjadi backend pengembangan.

## Berkas yang sudah siap

- `vercel.json`: preset Next.js, instalasi `npm ci`, dan build `npm run build`.
- `package.json` dan lockfile: Node.js `24.x`, sama dengan runtime yang diuji lokal. Vercel mendukung pemilihan versi melalui `engines.node`; lihat [versi Node.js Vercel](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).
- `.vercelignore`: mengecualikan environment lokal, akun lokal, hasil tes/build, dokumen pribadi, prototipe, serta alat Docker/QA dari unggahan CLI.
- `.gitignore`: mengecualikan `.env*` selain contoh kosong, hasil build/tes, dan konfigurasi lokal Vercel.
- Halaman kesalahan umum dan kesalahan layout tersedia dalam Bahasa Indonesia, dengan tombol muat ulang dan kembali ke Beranda.
- Form foto Admin dan Toko membatasi berkas ke 4 MiB, dengan validasi sebelum pengiriman serta pemeriksaan server. Ini menyisakan ruang multipart di bawah [batas request Vercel 4,5 MB](https://vercel.com/docs/functions/limitations); konfigurasi `serverActions.bodySizeLimit` tidak menaikkan batas platform. Bucket Storage tetap mempunyai batas 5 MiB untuk unggahan langsung melalui Studio.

## Backend produksi

Gunakan satu proyek Supabase produksi yang terpisah dari database pengembangan, berupa hosted atau Supabase Docker di server yang memiliki endpoint HTTPS publik. Alamat `127.0.0.1`, `localhost`, atau IP LAN PC pengembangan tidak dapat menjadi backend Vercel.

Terapkan seluruh delapan migrasi di `supabase/migrations/` sesuai urutan nama. Untuk Supabase hosted, gunakan CLI yang sudah ditautkan ke proyek tujuan atau SQL Editor; lihat [migrasi Supabase](https://supabase.com/docs/guides/deployment/database-migrations). Migrasi ini ditujukan untuk schema aplikasi baru. Supabase self-hosted memerlukan penerapan migrasi ke database server tersebut, bukan `npm run db:migrate` yang khusus Docker lokal.

Pastikan Data API mengekspos schema `public`; schema `private` tetap tidak diekspos. Migrasi mengatur hak tabel/RPC dan RLS secara eksplisit, termasuk bucket publik `store-media`. Bucket tersebut hanya untuk foto bisnis yang memang dapat dilihat pengunjung.

Matikan pendaftaran akun publik pada Auth, tetapi pertahankan provider email/kata sandi agar akun buatan pengelola dapat login. Buat akun admin dan pemilik melalui pengelola Auth. Profil otomatis memperoleh role `toko`; pengelola database menetapkan satu profil awal menjadi `admin` berdasarkan UUID akun yang sudah diverifikasi. Jangan mengandalkan metadata pengguna untuk role. Tautkan akun pemilik melalui Kelola toko. `npm run auth:setup` hanya membuat akun pengembangan lokal.

Sesuaikan Site URL pada konfigurasi Supabase Auth dengan domain HTTPS final. Aplikasi memakai login kata sandi melalui server; pengalihan portal ditentukan role database. Panduan konfigurasi URL tersedia di [Supabase Auth](https://supabase.com/docs/guides/auth/redirect-urls).

## Environment Vercel

Isi variabel melalui pengaturan environment proyek Vercel. Nilai lokal tidak ikut diunggah.

| Variabel | Isi produksi |
| --- | --- |
| `CATALOG_MODE` | `supabase` |
| `NEXT_PUBLIC_SUPABASE_URL` | URL HTTPS API Supabase produksi |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key atau anon key proyek yang sama |
| `SITE_URL` | Origin HTTPS final, misalnya `https://nama-situs.vercel.app`, tanpa path/query |

Service-role key, password database, dan `.env.accounts.local` tidak diperlukan aplikasi Vercel. Gunakan environment Preview terpisah jika ingin menguji deployment sebelum publikasi; atur `SITE_URL` sesuai alamat tujuan QR pada environment itu. QR menyimpan origin saat dibuat, sehingga hindari mencetak QR sebelum domain final dipastikan. Perubahan environment memerlukan deployment baru; lihat [environment Vercel](https://vercel.com/docs/environment-variables).

## Publikasi ketika dilanjutkan

Proyek ini dapat dikirim langsung melalui CLI tanpa GitHub. Login ke akun Vercel yang dituju, tautkan direktori ke proyek yang benar, isi environment di proyek tersebut, lalu buat Preview untuk pemeriksaan. Setelah Preview sesuai dan publikasi diotorisasi, lakukan deployment Production. Alur resmi: [deploy melalui CLI](https://vercel.com/docs/projects/deploy-from-cli). Alternatifnya, impor repositori GitHub setelah repositori tersedia.

Gunakan build standar Next.js; tidak memakai static export karena Auth, reservasi, QR dinamis, dan tracking membutuhkan server. Tetap gunakan pengaturan output bawaan Vercel. Database dan Storage berada di Supabase, bukan filesystem deployment.

Sesudah deployment, periksa katalog/pencarian, join dan konfirmasinya, login/logout, tiga menu masing-masing portal, unggah foto, catatan penjualan, QR statis/dinamis serta expiry, dan kenaikan statistik WIB. Ulangi pada 360px serta desktop melalui URL publik. Pemeriksaan lokal tidak menggantikan pemeriksaan jaringan/HTTPS dan konfigurasi Supabase produksi.

## Pengujian lokal

```sh
npm ci
npm run db:start
npm run typecheck
npm run test:db
npm run build
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

Jalankan tes browser berurutan agar server, fokus browser Windows, dan hasil gambar tidak bertabrakan. `test:e2e` memakai Chromium pada 360px/640px/1440px. `test:e2e:compat` menjalankan rangkaian yang sama di Firefox dan WebKit pada 360px/1440px dengan satu worker. Pemeriksaan tambahan menyapu 320px, batas 639px/640px, tablet 768px, 1024px, serta landscape 740×360. Preferensi gerak dikurangi dan navigasi keyboard diperiksa pada tiap browser. WebKit adalah engine pengujian; perangkat iOS/Safari fisik belum diuji.

Hasil gambar Chromium ada di `test-results/chromium/`, kompatibilitas di `test-results/compat/`, dan integrasi Docker di subfolder masing-masing alat. Folder output dipisah agar satu perintah tidak membersihkan hasil perintah lain. Semua data bisnis, akun, QR, serta foto sementara dibersihkan oleh alat integrasi; volume Docker lokal dipertahankan.

Pencarian mempertahankan ketikan yang masuk sebelum JavaScript siap, membaca nilai formulir saat dikirim, dan memakai event `input` untuk pencarian otomatis lintas browser. Tes sengaja menahan unduhan JavaScript pada Beranda dan Pencarian, lalu memeriksa ketikan serta hasil pencariannya.

Pemeriksaan exception menggunakan `window.error` dan `unhandledrejection`. WebKit dapat mengklasifikasikan pembatalan prefetch saat pergantian dokumen sebagai `pageerror` meskipun tidak ada exception JavaScript; kondisi engine ini dijelaskan dalam [laporan upstream Playwright/WebKit](https://github.com/microsoft/playwright/issues/43120). Tes tetap menangkap exception aplikasi dan promise yang tidak ditangani. Chromium/Firefox memeriksa Tab ke skip-link; pada WebKit Windows, tautan difokuskan secara eksplisit lalu diaktifkan dengan Enter karena urutan Tab mengikuti preferensi browser [tabsToLinks](https://developer.apple.com/documentation/webkit/webpreferences/tabstolinks).
