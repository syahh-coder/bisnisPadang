# Halaman detail toko — langkah 3

Baris toko pada Beranda/Pencarian membuka `/toko/<slug>`. Halaman menampilkan nama, kategori, foto, WhatsApp/telepon, delivery, alamat, peta, dan menu dengan harga rupiah. Tombol kembali mempertahankan filter asal melalui parameter `kembali`, yang dibatasi ke Beranda/Pencarian pada situs ini. Tautan dari Pencarian menyertakan `src=search`; pembukaan halaman toko nyata dicatat oleh [tracking tahap 8](tracking.md).

Data dibaca di server dengan publishable key, RLS, dan daftar kolom publik eksplisit. Profil dan ID pemilik tidak dikirim ke halaman. Metadata judul memakai nama toko. Menu diurutkan berdasarkan `sort_order`, nama, lalu ID, dan dibaca per batch untuk menghindari pemotongan pada batas hasil API.

## Mengisi melalui Supabase Studio

1. Jalankan `npm run db:start`, kemudian buka http://127.0.0.1:55323.
2. Tambahkan baris `stores`: nama, slug huruf kecil dengan tanda hubung, kategori, alamat, nomor HP, dan informasi delivery. `owner_id` boleh kosong sampai auth disiapkan.
3. Isi `latitude` dan `longitude` jika tersedia. Jika tidak, peta menggunakan alamat. Koordinat `0` tetap valid.
4. Tambahkan baris `products` dengan `store_id`, nama, harga, dan `sort_order` (angka lebih kecil tampil lebih dahulu).
5. Untuk foto, unggah berkas ke bucket publik `store-media` melalui menu Storage. Misalnya path objek `stores/<id-toko>/depan.jpg`; simpan path tersebut di `stores.photo_path`, tanpa nama bucket, URL, atau awalan `/`.

Bucket menerima JPEG, PNG, WebP, AVIF, dan GIF hingga 5 MiB melalui Studio; form di Portal Admin/Toko membatasi unggahan ke 4 MiB dengan validasi browser dan server. Foto yang tidak ada/gagal dimuat menampilkan placeholder. Hanya foto bisnis yang boleh dimasukkan ke bucket publik ini; berkas di dalamnya dapat diakses publik. RLS membatasi unggah/tulis ke pemilik toko terkait atau admin. Tidak ada izin upload anonim.

Nomor WhatsApp mendukung bentuk Indonesia `08…`, `62…`, `+62…`, atau `0062…`, termasuk spasi/tanda kurung/tanda hubung. Tautan dibentuk ulang dari digit yang valid. Jika kosong/tidak valid, tombol kontak tidak ditampilkan dan halaman menyatakan nomor belum tersedia. Tidak ada nomor fiktif yang dipaksakan untuk toko tanpa kontak.

## Peta dan keadaan kosong

Iframe menggunakan format Google Maps pada prototipe (`maps.google.com/maps?q=...&output=embed`). Tautan `Buka Google Maps` tetap tersedia melalui [Maps URLs](https://developers.google.com/maps/documentation/urls/get-started), tanpa API key. Peta membutuhkan koneksi Google di perangkat pengunjung.

Toko tidak ada menampilkan halaman khusus tidak ditemukan. Kesalahan koneksi menampilkan informasi belum tersedia dan tombol coba lagi. Menu kosong, foto kosong, dan kontak kosong ditangani tanpa data palsu.

## Pengujian

`npm run test:e2e -- tests/e2e/store.spec.ts` memeriksa detail pada 360px, 640px, dan desktop: kontak, peta, gambar gagal/berhasil, menu, kembali ke filter, tautan kembali eksternal, toko hilang, dan koneksi gagal. Pengambilan iframe Google diganti respons lokal; tes ini memeriksa konstruksi tautan/iframe dan tidak mengklaim memverifikasi layanan Google.

`npm run db:verify` menguji pembacaan detail/menu dan foto dari Supabase Docker yang sebenarnya. Data/foto uji sementara dibersihkan setelah tes. Auth/role ditambahkan pada langkah 4; lihat [panduan auth](auth.md). Portal, QR, serta tracking sudah diterapkan sesuai urutan langkah 5–8 di `ai.md`.
