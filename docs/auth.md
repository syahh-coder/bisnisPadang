# Akun dan role — langkah 4

Login tersedia di `/akun` melalui email dan kata sandi. Pengunjung tidak perlu login untuk melihat katalog/detail. Tidak ada pilihan role pada formulir: aplikasi membaca role dari `public.profiles` setelah Auth memverifikasi identitas. Metadata pengguna, field form tambahan, parameter URL, dan objek cookie tidak dipakai sebagai sumber role.

## Akun pengembangan lokal

```sh
npm run db:start
npm run auth:setup
npm run dev
```

Buka http://localhost:3000/akun. Email dan kata sandi ada di `.env.accounts.local` pada root proyek. Berkas itu diabaikan Git dan tidak dimuat sebagai konfigurasi frontend.

- Akun admin awal: `admin@tokolokal.test`.
- Akun toko awal: `toko@tokolokal.test`.
- Kata sandi acak tidak ditampilkan di terminal/chat.
- Menjalankan ulang `auth:setup` mempertahankan kata sandi dan memakai ID akun tersimpan. Akun yang tidak cocok tidak ditimpa otomatis.
- Akun toko awal tidak membuat toko fiktif. Hubungkan `stores.owner_id` ke ID akun toko melalui Studio sebelum portal Admin tersedia.

Skrip hanya dapat menggunakan Supabase lokal yang dikonfirmasi lewat CLI. Pembuatan akun memakai Auth Admin API; promosi admin dilakukan oleh pengelola database. Service-role key hanya berada di memori skrip, bukan di `.env.local` atau bundle aplikasi. Skrip tidak mereset akun/data yang sudah ada.

Signup publik dinonaktifkan pada `[auth].enable_signup`. Provider email tetap diaktifkan melalui `[auth.email].enable_signup` supaya akun yang dibuat pengelola dapat login. Form Join Afiliasi tidak ditambah field email; data publiknya tetap mengikuti `fitur.md`.

## Pembatasan akses

| Aktor | Akses saat ini |
| --- | --- |
| Pengunjung | Kategori, kolom bisnis publik toko, menu, dan unduhan foto publik; tanpa data profil/ID pemilik atau izin tulis |
| Toko | Profil sendiri, toko miliknya, CRUD menu sendiri, dan CRUD foto di folder toko sendiri |
| Admin | Seluruh profil dan toko/menu aplikasi, pengelolaan kategori, kepemilikan toko, dan role profil |

Profil baru selalu dibuat dengan role `toko` oleh trigger database. Metadata `role=admin` tidak menaikkan hak akses. Trigger lain menolak perubahan role/kepemilikan oleh pemilik toko. ID dan waktu pembuatan toko/profil tidak menjadi kolom yang dapat diubah melalui API pengguna. Pembuatan/penghapusan toko dilakukan admin; pemilik dapat mengubah seluruh kolom bisnis tokonya dan mengelola menu/foto.

Katalog publik memakai client anon terpisah. Sesi toko yang mengakses tabel melalui API hanya membaca baris miliknya; login tidak memberi akses privat toko lain. Admin memperoleh akses luas melalui kebijakan berbasis role database, tanpa service-role key di browser.

Foto pemilik harus memakai path `stores/<id-toko>/<nama-berkas>` di bucket `store-media`. Mengunggah, memindahkan, mengganti, atau menghapus foto milik toko lain ditolak. Foto bisnis tetap dapat dilihat publik. Profil dan kepemilikan dibaca melalui helper SECURITY DEFINER di schema `private` untuk menghindari rekursi RLS; schema ini tidak diekspos lewat Data API.

## Halaman dan sesi

- Login sukses mengarah ke `/portal/admin` atau `/portal/toko` sesuai role.
- Pengunjung yang membuka portal diarahkan ke login.
- Toko yang mencoba portal Admin diarahkan ke Akun dengan pesan akses ditolak.
- Halaman dan Server Actions memeriksa sesi/role; Proxy bukan satu-satunya pemeriksaan.
- Proxy memverifikasi klaim dan memperbarui sesi. Pembacaan akun memanggil Auth `getUser()` serta membaca profil database.
- Cookie HttpOnly dan SameSite=Lax digunakan karena autentikasi dilakukan lewat server. Cookie Secure digunakan pada deployment HTTPS. Halaman akun/portal memakai cache privat/no-store.
- Logout memakai POST Server Action dan menghapus cookie lokal, termasuk ketika layanan Auth tidak dapat dihubungi.
- Kesalahan login tidak membedakan email tidak terdaftar dari kata sandi salah. Batas percobaan berasal dari layanan Supabase Auth.

Portal tahap 4 menjadi fondasi akses dan identitas. Portal Admin tiga menu serta reservasi afiliasi tersedia pada [langkah 5](admin.md). Dashboard, catatan omset/penjualan, dan edit mandiri toko tersedia pada [langkah 6](store-portal.md). Hak database membatasi formulir melalui RLS.

## Migrasi dan verifikasi

`202610280003_auth_roles.sql` membuat trigger profil, penjagaan role/kepemilikan, dan kebijakan RLS data/foto. `202610280004_service_access.sql` memberi akses eksplisit untuk service_role tepercaya karena pembuatan tabel otomatis tidak diekspos oleh konfigurasi lokal.

```sh
npm run test:db
npm run build
npm run test:e2e
npm run auth:verify
```

Tes SQL memeriksa penolakan akses lintas pemilik, metadata palsu, dan pemindahan foto. Tes browser tanpa Docker memeriksa pengalihan tamu serta backend yang belum dikonfigurasi. `auth:verify` memakai Docker sebenarnya dengan akun/toko/foto sementara, termasuk login/logout, batas role, cookie HttpOnly, penyegaran sesi, dan penolakan cookie palsu pada 360px/1440px. Port 3005 harus tersedia. Screenshot disimpan di `test-results/auth/` dan data uji dibersihkan setelah tes.

Referensi: [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), dan [Next.js Proxy](https://nextjs.org/docs/app/api-reference/file-conventions/proxy).
