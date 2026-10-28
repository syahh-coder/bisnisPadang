# Menghubungkan katalog ke Supabase

Pengembangan memakai Supabase lokal lewat Docker. Jalankan `npm run db:start`; migrasi dan `.env.local` diatur otomatis. Lihat [panduan lokal](local-database.md).

Langkah manual di bawah berlaku untuk Supabase remote. Login/role dan kebijakan tulis pemilik/admin sudah tersedia pada langkah 4; lihat [panduan auth](auth.md). Belum ada konfigurasi/deployment remote.

1. Buka proyek Supabase yang akan digunakan.
2. Jalankan migrasi di `supabase/migrations/` sesuai urutan namanya melalui SQL Editor, atau terapkan dengan Supabase CLI jika proyek sudah ditautkan. Migrasi pertama membuat katalog; migrasi kedua membuat bucket foto toko. Migrasi pertama ditujukan untuk schema baru dan dijalankan satu kali. Jangan jalankan pada proyek yang sudah memiliki tabel bernama sama tanpa meninjau perbedaannya.
3. Salin `.env.example` ke `.env.local` dan isi:

   ```dotenv
   CATALOG_MODE=supabase
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
   ```

4. Tambahkan toko/menu sungguhan melalui SQL Editor atau Table Editor dengan akses pengelola proyek. Empat kategori sudah tersedia dari migrasi. `stores.owner_id` boleh kosong sampai akun toko disiapkan. Nomor kontak bisnis dimasukkan ke `stores.phone`, bukan ke profil pemilik. Tidak ada data toko fiktif yang dimasukkan otomatis.
5. Jalankan ulang `npm run dev`. Katalog kosong akan menampilkan keadaan kosong; kesalahan konfigurasi atau database menampilkan pesan tidak tersedia.

Jangan kirim key rahasia lewat chat. Service-role key tidak digunakan oleh aplikasi katalog. `.env.local` diabaikan Git.

## Cara pembacaan

- Server membaca kategori dan memanggil `public.search_stores(search_text, category_slug)` memakai publishable key tanpa sesi pengguna.
- Fungsi memakai SECURITY INVOKER, mengikuti RLS, dan tidak mengembalikan `owner_id` atau data profil.
- Pencarian menggunakan substring literal pada nama toko atau nama produk. Karakter `%` dan `_` diperlakukan sebagai teks biasa, bukan wildcard SQL. Satu toko hanya tampil sekali walau beberapa produknya cocok.
- Kata kunci dibatasi 120 karakter. Kategori memakai slug; filter dan nomor halaman tersimpan dalam parameter `q`, `kategori`, dan `halaman`.
- Hasil diurutkan dari toko terbaru, lalu ID untuk urutan stabil; 20 toko per halaman dengan total dari backend.
- Pembacaan tidak di-cache lintas permintaan, sehingga perubahan katalog terlihat pada permintaan berikutnya. Batas waktu koneksi 8 detik; data contoh tidak dijadikan cadangan otomatis ketika backend gagal.

## Pemeriksaan pada proyek sungguhan

Setelah konfigurasi tersedia, buka halaman tanpa login dan periksa kategori, pencarian nama/menu, serta penggabungan filter. Di Supabase, pastikan RLS aktif pada empat tabel. Pengunjung harus ditolak saat membaca `profiles`, membaca `stores.owner_id`, atau menulis data katalog. Pemilik hanya membaca/mengubah data bisnis miliknya; admin mengakses seluruh data aplikasi. Nonaktifkan signup publik melalui pengaturan Auth pada server remote sebagaimana konfigurasi lokal.

`test:db` dan `test:e2e` dapat berjalan dengan PostgreSQL PGlite/pengganti HTTP khusus tes. `db:verify` menguji Supabase Docker yang sebenarnya, termasuk PostgREST, RLS, dan browser. Periksa juga deployment Supabase/PostgREST remote saat nantinya diaktifkan.

Referensi: [RLS Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security), [fungsi database](https://supabase.com/docs/guides/database/functions), dan [filter rentang hasil](https://supabase.com/docs/reference/javascript/using-modifiers-range).
