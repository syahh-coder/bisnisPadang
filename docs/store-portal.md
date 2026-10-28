# Portal Toko — langkah 6

Login melalui `/akun` dengan akun ber-role toko. Portal memiliki tiga menu, menggantikan navigasi publik:

1. **Dashboard** (`/portal/toko`): input omset/jumlah transaksi harian, edit/hapus catatan, tabel ringkasan tujuh hari hingga tanggal yang dipilih, serta kunjungan hari ini menurut sumber.
2. **Info toko** (`/portal/toko/info`): nama, slug, pengelola, kategori, WhatsApp, alamat, delivery, koordinat, serta unggah/ganti/hapus foto dari tampilan toko.
3. **Menu / Produk** (`/portal/toko/menu`): tambah/edit/hapus menu, nama, harga, urutan, serta foto. Daftar dibagi 20 menu per halaman. Buka baris menu untuk mengedit.

Akun yang belum ditautkan ke toko menampilkan pesan untuk menghubungi pengelola, tanpa formulir bisnis. Jika sebuah akun memiliki beberapa toko, pemilik bisa memilih toko lewat dropdown. ID pilihan disimpan pada parameter `toko` dan dibawa oleh ketiga menu agar pergantian nama tidak memindahkan toko yang sedang diedit. ID milik akun lain ditolak; aplikasi tidak mengganti pilihan tersebut diam-diam.

## Catatan harian

Tanggal memakai WIB, maksimal hari ini. Pilih tanggal lalu tekan **Tampilkan** untuk memuat catatan yang akan diedit. Omset diinput dalam rupiah tanpa pemisah ribuan, maksimal dua angka desimal; penjualan adalah jumlah transaksi, bilangan bulat nol atau lebih. Memasukkan nol berbeda dari belum mencatat.

`daily_sales` memiliki `UNIQUE(store_id,date)`. Fungsi `save_daily_sales` melakukan UPSERT dengan SECURITY INVOKER: menyimpan ulang tanggal yang sama memperbarui catatan tersebut, termasuk saat dua penyimpanan bersamaan. Tabel ringkasan hanya menjumlahkan catatan yang ada. Hari tanpa catatan ditandai **Belum dicatat**, tanpa mengasumsikan omset nol.

Omset dan penjualan tidak tersedia untuk pengunjung publik. RLS membatasi baca/tulis/hapus ke pemilik toko terkait atau admin. Izin kolom mencegah sesi toko mengganti ID/kepemilikan/tanggal baris yang sudah ada; memilih tanggal lain membuat atau memperbarui catatan tanggal itu melalui UPSERT. Database juga menolak omset/penjualan negatif dan tanggal mendatang.

Bagian pengunjung hari ini menampilkan tabel Google Maps, QR, Pencarian, Langsung, dan total dari database. Angka menghitung pembukaan halaman, termasuk kunjungan ulang, bukan orang unik. Tanggal memakai WIB dan selalu hari ini, terlepas dari tanggal omset yang dipilih. Statistik diperbarui saat halaman dimuat. Kegagalan membaca statistik menampilkan pesan belum tersedia, tanpa mengganti kegagalan menjadi angka nol. Pemilik hanya membaca toko sendiri melalui RLS; lihat [tracking kunjungan](tracking.md).

## Data dan foto

Perubahan info/menu langsung dibaca halaman publik, termasuk foto menu. Slug unik; mengubahnya mengubah alamat halaman toko. ID toko, role, dan penautan akun bukan input bisnis pemilik; field palsu di formulir diabaikan dan tetap dibatasi RLS.

Portal toko menerima JPG/PNG/WebP/AVIF/GIF maksimal 4 MiB, ke folder Storage `stores/<id-toko>/`. Menekan **Hapus foto** melepas foto dari toko/menu; objek lama tidak dihapus otomatis karena mungkin masih dipakai referensi lain. Foto bisnis pada bucket `store-media` bersifat publik. SVG tidak diterima. Foto yang gagal dimuat memiliki fallback; thumbnail menu yang gagal disembunyikan, sedangkan nama dan harga tetap tersedia.

## Pemeriksaan

```sh
npm run db:migrate
npm run typecheck
npm run test:db
npm run build
npm run test:e2e
npm run owner:verify
```

`owner:verify` menggunakan Supabase Docker dan Chromium pada 360px/1440px. Pemeriksaan meliputi UPSERT bersamaan, RLS, admin membaca catatan, angka nol, edit/hapus catatan, penolakan tanggal mendatang/URL toko lain, input palsu role/pemilik, slug duplikat tanpa kehilangan isian, foto toko/menu, hasil halaman publik, hapus menu/foto, pilihan cabang, logout/login, dan akun belum ditautkan. Pengujian memakai data/foto/akun sementara yang dibersihkan, lalu menghentikan server QA port 3008. Screenshot disimpan di `test-results/owner/`. Jalankan tes browser satu per satu karena Playwright membersihkan folder hasil saat mulai.
