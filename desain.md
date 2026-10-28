# desain.md

Desain polos dan jelas. Hindari tampilan template generik (grid kartu seragam, tile angka besar, teks dramatis).

## Prinsip
- Mobile first, lalu tablet dan desktop
- Web dinamis dan responsif, jalan di browser mana pun
- Satu aksi utama per layar
- Teks langsung dan pendek
- Warna sedikit, kontras jelas

## Token (nilai awal, bisa diubah)
- Font: Inter atau system-ui
- Aksen: hijau teal #0F766E (hover #115E59), pendukung amber #F59E0B untuk tombol Join
- Latar #FAFAF9, kartu putih, teks #1C1917, teks sekunder #78716C, garis #E7E5E4
- Radius: 8px
- Spasi: kelipatan 4px
- Gutter sisi: 16px di HP

## Breakpoint
- HP: sampai 639px (desain utama)
- Tablet: 640 sampai 1023px
- Desktop: 1024px ke atas

## Landing page
Header (bar atas):
- Kiri: logo
- Kanan: tombol Masuk dan tombol Join Afiliasi

Isi:
- Kolom pencarian (bebas, cari nama toko atau produk)
- Kategori (beberapa saja, contoh: Makanan, Minuman, Jasa, Belanja)
- Daftar toko sesuai kategori atau hasil pencarian

Bar bawah (HP): 3 menu, semua ikon SVG (stroke, 24px).
- Kiri: Beranda
- Tengah: Pencarian, tombol bulat lebih besar (56px vs 24px ikon lain), warna aksen, menonjol sedikit ke atas bar
- Kanan: Akun
- Bar melayang, sudut membulat, latar putih dengan bayangan tipis
- Menu aktif: ikon berubah warna aksen, ada titik indikator kecil yang bergeser mulus ke menu aktif (transisi 250ms, ease-out)
- Tombol Pencarian: saat ditekan sedikit mengecil lalu kembali (scale 0.92), ikon kaca pembesar berputar ringan saat aktif
- Ganti layar: fade dan geser tipis 8px (200ms)
- Hormati prefers-reduced-motion: matikan animasi
- Di tablet dan desktop bar bawah diganti navigasi di header

## Halaman detail toko
Contoh: klik kategori Makanan, lalu pilih toko. Isi lengkap:
- Nama toko dan foto
- Nomor HP (tombol telepon/WhatsApp)
- Info delivery
- Alamat
- Google Maps (embed atau tombol buka peta)
- Daftar menu atau produk

## Portal Toko (dashboard sederhana)
Maksimal 3 menu. Isi dashboard:
- Pengunjung hari ini
- Asal pengunjung (lewat mana, contoh: Google Maps, QR, pencarian)
- Omset
- Penjualan

Pakai grafik garis atau tabel kecil, bukan tile angka besar.

## Portal Admin
3 menu, tampilan tabel dan form sederhana. Lihat fitur.md.
