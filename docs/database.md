# Rancangan database yang disetujui

Rancangan ini disetujui sebelum langkah 1. Implementasi mengikuti tahap fungsional di `ai.md`.

Pada langkah 2, migrasi `supabase/migrations/202610280001_public_catalog.sql` sudah menyiapkan `profiles` (fondasi FK pemilik), `categories`, `stores`, `products`, RLS baca publik, pembatasan profil sendiri, serta RPC `search_stores` dengan SECURITY INVOKER. Kategori juga memiliki `sort_order` untuk urutan di landing page. Tidak ada izin tulis untuk `anon` atau `authenticated` pada tahap ini; akses tulis pemilik/admin menyusul bersama auth. Nama dan role profil tidak otomatis disalin dari metadata pengguna.

Migrasi sudah diterapkan pada Supabase lokal melalui Docker (PostgreSQL 17). Pembacaan katalog, pencarian, dan RLS diverifikasi melalui PostgREST yang sebenarnya, selain tes PGlite. `.env.local` memakai database Docker; belum ada deployment Supabase remote. Reservasi diterapkan pada langkah 5, omset/penjualan langkah 6, QR langkah 7, dan kunjungan langkah 8.

Langkah 3 menambahkan migrasi `202610280002_store_photos.sql`: bucket Storage publik `store-media`, batas berkas 5 MiB, MIME JPEG/PNG/WebP/AVIF/GIF. Tidak ada kebijakan unggah/tulis anonim. Hak tulis pemilik menyusul dengan auth. `photo_path` menyimpan path relatif di bucket tersebut. Detail toko membaca kolom bisnis publik yang eksplisit dan menu milik `store_id` terkait, tanpa data profil/ID pemilik.

Langkah 4 menerapkan `202610280003_auth_roles.sql` dan `202610280004_service_access.sql`: profil otomatis dengan role toko, penjagaan perubahan role/kepemilikan, akses tulis bisnis bagi pemilik/admin, serta kebijakan Storage di folder toko sendiri. Kebijakan baca sesi toko sekarang dibatasi ke baris miliknya; katalog publik tetap memakai client anon dan kolom publik. Admin membaca seluruh profil/toko/menu melalui role database. Service-role key tepercaya hanya dipakai alat pengelola lokal, bukan aplikasi browser. Rincian ada di [auth.md](auth.md); paragraf langkah sebelumnya menjelaskan urutan implementasi historis.

## Tabel

Langkah 8 menerapkan `202610280008_store_visits.sql`: `store_visits`, indeks `(store_id, visited_at)` dengan `source`, RLS baca pemilik/admin, RPC pencatatan terbatas `record_store_visit`, dan ringkasan `store_visit_summary` dengan SECURITY INVOKER. UUID per pembukaan halaman mencegah hit ganda saat retry; waktu ditentukan database. Sesi publik/toko/admin tidak memperoleh izin tulis langsung. Ringkasan memakai batas hari WIB dan tetap dibatasi RLS. Lihat [tracking kunjungan](tracking.md).

Langkah 7 menerapkan `202610280007_qr_codes.sql`: QR privat admin, snapshot origin/slug statis, pembatasan expiry 15 hari sejak pembuatan, dan RPC resolver publik yang hanya mengembalikan status/slug aktif. Unduhan PNG mengikuti izin sesi admin. Lihat [panduan QR](qr.md).

Langkah 6 menambahkan `202610280006_store_dashboard.sql`: `daily_sales`, RLS pemilik/admin, validasi nilai dan tanggal WIB, serta RPC UPSERT SECURITY INVOKER. Catatan unik per toko/tanggal; publik tidak bisa membaca omset. `updated_at` diperbarui server database. Rincian ada di [Portal Toko](store-portal.md).

Langkah 5 menerapkan `202610280005_admin_affiliation.sql`: `stores.manager_name`, tabel `affiliation_requests`, partial unique index slot aktif, dan RPC ketersediaan/pengajuan/konfirmasi/pembatalan. Penyimpanan toko dan penautan permohonan dilakukan atomik melalui RPC khusus admin. Nama kolom yang diterapkan adalah `address` dan `cancellation_hash`; status menggunakan teks dengan CHECK empat nilai. Lihat [panduan Admin](admin.md).

| Tabel | Kolom inti dan relasi |
| --- | --- |
| `profiles` | `id uuid PK → auth.users.id`, `name text`, `role enum(toko, admin)`, `created_at timestamptz` |
| `categories` | `id uuid PK`, `name text`, `slug text UNIQUE` |
| `stores` | `id uuid PK`, `owner_id uuid → profiles.id` (boleh kosong sampai akun pemilik dibuat), `manager_name text`, `category_id uuid → categories.id`, `name text`, `slug text UNIQUE`, `phone text`, `address text`, `latitude numeric`, `longitude numeric`, `delivery_info text`, `photo_path text`, `created_at timestamptz` |
| `products` | `id uuid PK`, `store_id uuid → stores.id`, `name text`, `price numeric(14,2) >= 0`, `photo_path text`, `sort_order integer` |
| `affiliation_requests` | `id uuid PK`, `store_id uuid UNIQUE → stores.id` (opsional sebelum toko dibuat), `manager_name text`, `whatsapp text`, `address text`, `appointment_date date`, `appointment_time time`, `notes text` (maksimal 200 karakter), `status text CHECK(menunggu, dikonfirmasi, selesai, dibatalkan)`, `cancellation_hash text`, `created_at timestamptz` |
| `daily_sales` | `id uuid PK`, `store_id uuid → stores.id`, `date date`, `revenue numeric(14,2) >= 0`, `sales_count integer >= 0`, `updated_at timestamptz`, `UNIQUE(store_id, date)` |
| `store_visits` | `id uuid PK`, `store_id uuid → stores.id ON DELETE CASCADE`, `visited_at timestamptz DEFAULT now()`, `source text CHECK(qr, google_maps, search, direct)` |
| `qr_codes` | `id uuid PK`, `store_id uuid → stores.id`, `kind text CHECK(static, dynamic)`, `code text UNIQUE`, `site_origin text`, `target_slug text`, `created_at timestamptz`, `expires_at timestamptz` (null untuk statis) |

Omset dan jumlah penjualan diinput manual. Tidak ada checkout atau sistem pembayaran. Foto memakai Supabase Storage; database menyimpan path berkas.

## Reservasi

- Semua perhitungan tanggal reservasi menggunakan `Asia/Jakarta` (WIB), terlepas dari zona waktu perangkat.
- Tanggal valid adalah besok hingga hari ke-14 dari hari pengajuan, tidak termasuk Minggu. Bukan 14 hari kerja.
- Jam yang diperbolehkan: 09:00, 11:00, 13:00, dan 15:00 WIB.
- Partial unique index pada `(appointment_date, appointment_time)` untuk status selain `dibatalkan` mencegah perebutan slot secara bersamaan. Slot yang dibatalkan dapat dipakai kembali.
- Validasi rentang tanggal dilakukan saat pengajuan melalui transaksi/fungsi database, bukan CHECK yang bergantung pada tanggal berjalan. Permohonan lama tetap dapat dibaca atau diubah statusnya.
- Pemohon tanpa akun memperoleh token pembatalan rahasia; hanya hash token yang disimpan. Pembatalan memakai endpoint tervalidasi, dibatasi ke status `menunggu`, dan dilakukan secara atomik.
- Admin mengubah status dan menghubungi pemohon lewat WhatsApp.

## RLS dan akses

- Tabel bisnis memakai RLS. Publik hanya boleh membaca data publik toko, kategori, dan menu.
- Pemilik mengelola data toko dan menu miliknya serta omset/penjualannya. Role, kepemilikan, dan data kunjungan bukan input bisnis yang dapat diubah sendiri.
- Pemilik hanya membaca statistik kunjungan toko sendiri. Admin mengakses seluruh data sesuai tiga menu yang ditentukan.
- `profiles.role` tidak dapat diedit pengguna biasa. Pembatasan perubahan role/kepemilikan memerlukan privilege kolom atau fungsi terkontrol, selain kebijakan RLS per baris.
- Permohonan afiliasi tidak dapat dibaca publik. Pengajuan, ketersediaan slot tanpa data pemohon, dan pembatalan melalui endpoint/fungsi khusus dengan validasi sisi server.
- Pencatatan kunjungan melalui endpoint tervalidasi. Publik tidak memperoleh akses baca statistik atau izin insert langsung yang tidak dibatasi.
- Storage membatasi tulis/hapus ke pemilik toko terkait atau admin. Foto toko/menu dapat dibaca publik.

## QR dan tracking

- QR statis langsung menuju halaman toko dengan `?src=qr` dan tidak mempunyai kedaluwarsa.
- QR dinamis memakai kode unik melalui resolver server yang memeriksa kedaluwarsa, lalu mengarahkan ke halaman toko dengan `?src=qr`.
- Constraint dinamis: `created_at < expires_at <= created_at + interval '15 days'`. Batas dihitung sejak pembuatan, tidak dapat diperpanjang melewati batas awal.
- Kunjungan dicatat pada halaman toko; resolver QR tidak mencatat kunjungan kedua. Sumber tidak dikenal dipetakan ke `direct`.
- Statistik harian menggunakan batas hari `Asia/Jakarta`.

## Urutan aktivasi

Tabel katalog diperlukan ketika landing page dihubungkan ke Supabase. Auth dan kebijakan akses diaktifkan bersama integrasi data, sebelum akses publik ke data sungguhan. Portal, QR, serta tracking mengikuti langkah 5–8. Tidak ada tabel berisi data pribadi yang boleh dibuka tanpa RLS selama pengembangan.
