# Panduan Desain: Sistem Desain Natural-Tech Toko & Food Delivery

Panduan desain visual, interaksi, dan tata letak untuk platform pemesanan makanan dan toko lokal. Menghadirkan perpaduan **kesegaran alami (natural)** dan **ketajaman teknologi modern (clean tech)** yang ramah dan nyaman untuk **semua usia**, anti-*generic AI slop*, dengan mikro-animasi super ringan (60 FPS tanpa beban CPU/server).

---

## 1. Filosofi & Karakter Visual

* **Clean & Natural Tech**: Menggabungkan kesegaran bahan pangan alami dengan presisi antarmuka teknologi modern. Tidak ada gradasi ungu/biru generik atau efek kaca buram yang berlebihan.
* **Nyaman untuk Semua Umur**:
  * Ukuran teks dan kontras memenuhi standar WCAG AAA (mudah dibaca anak muda maupun lansia).
  * Target sentuh (*tap target*) minimal 44x44px ramah jempol tangan di smartphone.
  * Teks lugas, bahasa santun, alur pemesanan mudah dipahami dalam 3 detik pertama.
* **Bikin Betah Berlama-lama**: Latar belakang tidak menggunakan putih silau ataupun gelap suram, melainkan *Natural Canvas* hangat yang lembut di mata saat jelajah menu.
* **100% Pure SVG Icons**: Tidak ada emoji teks generik di seluruh antarmuka. Semua ikon menggunakan garis vektor SVG yang konsisten (stroke 1.8px).
* **Performa Ekstrem & Animasi Ringan**: Mikro-interaksi menggunakan CSS GPU-accelerated (`transform` & `opacity`). Zero JavaScript animation library, bundle size 0 kB overhead, aman untuk koneksi seluler hemat daya.

---

## 2. Palet Warna (Design Tokens)

### Warna Utama (Signature Palette)
* **Botanical Emerald (`#059669` / `#10B981` / hover `#047857`)**:
  * Warna utama (*brand accent*). Mewakili kesegaran makanan, higienitas, dan keandalan sistem pemesanan.
* **Warm Sun Amber (`#F59E0B` / hover `#D97706`)**:
  * Warna pendukung hangat. Menggugah selera makan, penanda bintang ulasan terverifikasi, dan badge promo/keunggulan.
* **Obsidian Ink (`#0F172A`)**:
  * Teks utama berkontras tinggi dan tajam, memastikan keterbacaan mutlak di layar apa pun.
* **Slate Muted (`#475569` / `#64748B`)**:
  * Teks sekunder, deskripsi menu, dan penanda jarak kilometer.

### Permukaan & Latar Belakang (Surfaces)
* **Natural Canvas (`#F8FAFC` / `#F9FBFA`)**: Latar belakang aplikasi yang nyaman dan tidak membuat mata lelah.
* **Card Surface (`#FFFFFF`)**: Kartu toko dan menu warna putih murni dengan border presisi tipis `1px border-slate-200/80` dan *ambient shadow* lembut.
* **Subtle Fill (`#F1F5F9`)**: Latar tombol sekunder dan badge netral.

---

## 3. Sistem Tipografi & Tata Letak

* **Font Utama**: `Inter, system-ui, -apple-system, sans-serif` dengan *letter-spacing* terukur dan *line-height* lega.
* **Skala Tipografi**:
  * Heading Utama: 28px – 36px (Font-weight: 800 ExtraBold)
  * Judul Toko / Menu: 16px – 18px (Font-weight: 700 Bold)
  * Harga Menu: 15px – 16px (Font-weight: 800 ExtraBold dengan format Rupiah `Rp xx.000`)
  * Deskripsi & Alamat: 12px – 13px (Font-weight: 400 Regular)
  * Label / Tag / Badge: 10px – 11px (Font-weight: 700 Bold uppercase/capitalize)
* **Breakpoint Responsif**:
  * **Mobile (< 640px)**: Navigasi utama berada di dock bawah (*bottom dock* mengambang ramah jempol), kartu menu berbentuk baris ergonomis dengan kontrol counter `[-] 1x [+]` mudah ditekan.
  * **Tablet (640px - 1023px)**: Grid 2 kolom kartu toko/menu dengan ruang pernapasan lega.
  * **Desktop (≥ 1024px)**: Grid 3 kolom, navigasi di header atas dengan pencarian terintegrasi dan keranjang mengambang di kanan bawah.

---

## 4. Mikro-Animasi & Interaksi Ringan (Snappy 60 FPS)

Animasi dirancang untuk memberikan kepuasan interaksi (*tactile delight*) tanpa membebani performa perangkat pengguna:

1. **Tombol Tekan (Spring Tap)**:
   * Setiap tombol interaktif memiliki `active:scale-95 transition-transform duration-150 ease-out`.
2. **Tambah ke Keranjang (Cart Pop & Pulse)**:
   * Saat menu dimasukkan ke keranjang, ikon keranjang dan counter mengalami *spring bounce* singkat (`@keyframes cartBounce`).
3. **Modal & Drawer Checkout**:
   * Muncul dengan kurva akselerasi `cubic-bezier(0.16, 1, 0.3, 1)` dari bawah ke atas secara mulus (durasi 250ms).
4. **Hover Kartu Toko**:
   * Sedikit terangkat (`translate-y-[-2px]`) dengan bayangan halus yang melebar secara lembut (`transition-all duration-200`).
5. **Aksesibilitas Gerakan**:
   * Mendukung penuh `@media (prefers-reduced-motion: reduce)` yang mematikan semua transformasi fisik bagi pengguna dengan sensitivitas gerak.

---

## 5. Komponen Utama

### A. Kartu Toko (Store Card)
* Rasio gambar makanan 16:10 dengan *subtle zoom* saat disentuh/di-hover.
* Badge kategori di kiri atas dan rating bintang di kanan atas dengan aksen hangat amber.
* Indikator jarak real-time dari posisi pengguna (misal: `± 1.2 km`).
* Saluran pemesanan yang tersedia (Kurir Toko WA, GoFood, ShopeeFood, GrabFood) hanya muncul jika toko memilikinya.

### B. Builder Pesanan & Keranjang (Cart & Checkout)
* Penghitung kuantitas besar dan kontras `[-]` dan `[+]` agar pengguna segala usia tidak salah tekan.
* Ringkasan total harga yang selalu terpampang jelas dengan format rupiah standar.
* Alamat lengkap wajib isi dengan tombol salin otomatis dari GPS/Google Maps.
* Tombol aksi Checkout WA besar berwarna hijau segar dengan format template nomor urut otomatis (`1. 2. 3. dst`).
