# Direktori UMKM & Marketplace Standar

Dokumen aturan ini menetapkan konvensi dan standar desain untuk proyek direktori toko, kuliner, dan marketplace lokal.

## 1. Navigasi & Segmentasi Pengguna
- **Navigasi Utama (Publik)**: Difokuskan murni pada penemuan konten (*discovery*): Beranda, Pencarian, dan Kategori Usaha. Hindari menyematkan menu "Akun" di navbar utama publik untuk platform direktori yang tidak mewajibkan registrasi pembeli.
- **Pintu Masuk Mitra / Pengelola**: Akses login pedagang atau pengelola ditempatkan secara eksplisit dengan label **"Portal Mitra"** (atau "Kelola Toko") di bagian header atau footer, terpisah dari alur pengguna biasa.

## 2. Cakupan Universal (Anti Hardcoded Daerah)
- Semua copy teks, penamaan kategori, pesan checkout WhatsApp, dan struktur alamat harus bersifat netral atau multi-daerah nasional (Indonesia/Nusantara).
- Hindari menyematkan nama satu kota spesifik secara statis/hardcoded di seluruh halaman.
- Gunakan fitur pendeteksi lokasi (Geolocation GPS / Pemilih Kota) dinamis dan hitung jarak dengan rumus Haversine.

## 3. Resiliensi Media & Endpoint QR Code
- Endpoint penyedia gambar dinamis (seperti `/gambar`, `/qr`) wajib selalu mengembalikan buffer gambar biner valid (`image/png` atau SVG) dengan status 200, bahkan saat basis data utama offline atau dalam mode fallback.
- Jangan pernah mengembalikan respons JSON (seperti 503 error) ke endpoint yang dipanggil oleh tag `<img>`, karena akan menyebabkan tampilan ikon gambar rusak (*broken image icon*).

## 4. Kelengkapan Kontrol CRUD Admin
- Dashboard admin harus menyediakan visualisasi metrik (KPI Cards), pencarian dan filter cepat, serta kontrol penuh terhadap entitas toko:
  - Tombol Tambah Toko & Edit Toko.
  - Tombol Hapus per Toko dengan konfirmasi pencegahan ketidaksengajaan.
  - Opsi reset/seeding data contoh untuk memudahkan pengujian.
