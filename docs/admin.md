# Portal Admin dan afiliasi — langkah 5

Portal `/portal/admin` memerlukan akun dengan role `admin` dari database. Navigasi publik digantikan tepat tiga menu:

1. **Pembuat QR** (`/portal/admin/qr`): pembuatan PNG QR statis/dinamis, expiry per QR maksimal 15 hari, dan riwayat. Implementasi langkah 7 dijelaskan pada [panduan QR](qr.md).
2. **Daftar toko** (`/portal/admin`): tabel nama toko, pengelola, nomor HP, kategori, alamat, delivery, serta tautan edit. Daftar dibagi 20 toko per halaman.
3. **Kelola toko** (`/portal/admin/kelola`): tambah/edit toko, penautan akun pemilik, foto, tambah/edit menu dan harga, serta pengelolaan janji temu. Akun pemilik dapat dipilih dari akun ber-role toko; halaman ini tidak membuat akun Auth baru.

Nama pengelola tersimpan di `stores.manager_name`, terpisah dari identitas login. Toko dapat dibuat sebelum akun pemilik ditautkan. Nama pengelola tidak ditambahkan ke kolom katalog publik. Foto menggunakan Storage `store-media`, folder `stores/<id>/`, format JPG/PNG/WebP/AVIF/GIF maksimal 4 MiB melalui form. Batas divalidasi di browser dan server. Koordinat boleh kosong (peta memakai alamat); jika diisi, lintang dan bujur harus diisi berpasangan.

## Join Afiliasi

Form publik `/join-afiliasi` gratis, tanpa akun. Nama pengelola, WA, alamat, tanggal, dan jam wajib diisi; catatan opsional maksimal 200 karakter. Nomor `08…` dinormalisasi menjadi `628…`. Admin menghubungi pemohon melalui tautan WA; aplikasi tidak mengirim pesan otomatis.

Database menghitung tanggal menggunakan `Asia/Jakarta`: besok sampai 14 hari kalender ke depan, selain Minggu. Jam 09:00, 11:00, 13:00, 15:00 WIB. RPC ketersediaan hanya mengembalikan tanggal/jam kosong, tanpa data pemohon. Partial unique index mengunci satu slot untuk satu permohonan aktif, termasuk saat dua permohonan dikirim bersamaan. Status dibatalkan melepas slot tersebut.

Setelah pengajuan, pemohon diarahkan ke `/join-afiliasi/<id>`. Token acak 256 bit disimpan dalam cookie HttpOnly/SameSite Lax berumur 15 hari, terbatas pada path konfirmasi tersebut. Hanya hash SHA-256 tersimpan di database. Token tidak dimasukkan ke URL atau kode klien. Simpan tautan halaman dan buka kembali dengan browser yang sama; browser lain tidak bisa melihat data pribadi atau membatalkan. Menghapus cookie menghilangkan akses pembatalan mandiri.

Pemohon dapat membatalkan ketika status **menunggu**. Setelah **dikonfirmasi**, hubungi admin melalui WA yang dipakai saat konfirmasi. Admin bisa mengubah status menjadi menunggu/dikonfirmasi/selesai/dibatalkan; mengaktifkan kembali permohonan dibatalkan ditolak jika slot sudah dipakai orang lain.

Permohonan tidak otomatis menjadi toko publik. Admin memilih **Tambahkan toko dari permohonan**, melengkapi nama toko, slug, kategori, dan data lain. Penyimpanan toko serta penautan permohonan dilakukan dalam satu transaksi, sehingga permohonan yang sama tidak membuat dua toko.

## Keamanan dan pemeriksaan

Migrasi `202610280005_admin_affiliation.sql` menambah tabel reservasi dengan RLS. Publik dan akun toko tidak bisa membaca identitas pemohon. Admin hanya diberi akses kolom reservasi yang diperlukan; hash pembatalan tidak bisa dibaca melalui sesi biasa. RPC publik terbatas pada ketersediaan, pengajuan tervalidasi, konfirmasi milik pemegang token, dan pembatalan menunggu. Penyimpanan toko memeriksa role admin lagi di database.

```sh
npm run db:migrate
npm run test:db
npm run build
npm run admin:verify
```

`admin:verify` menggunakan Supabase Docker yang sebenarnya dan Chromium pada 360px/1440px: perebutan slot bersamaan, join, kerahasiaan konfirmasi, perubahan status, pembatalan, tiga menu, tambah/edit toko, akun pemilik, menu, unggah foto, dan hasil publik. Akun/data/foto uji sementara dibersihkan dan server QA dihentikan. Screenshot tersimpan di `test-results/admin/`. Jalankan setelah tes Playwright biasa karena Playwright membersihkan folder hasil saat mulai.
