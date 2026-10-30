# Panduan Sistem Notifikasi & Popup Dialog (Toko Lokal)

Dokumen ini merupakan **standar mutlak** bagi seluruh tim pengembang (sekarang dan yang akan datang) dalam menampilkan pesan konfirmasi, peringatan, maupun notifikasi kepada pengguna di aplikasi Toko Lokal.

---

## 🚫 Larangan Keras (Zero Tolerance)
**DILARANG MENGGUNAKAN NOTIFIKASI / DIALOG BAWAAN BROWSER**:
- ❌ `window.alert(...)`
- ❌ `window.confirm(...)`
- ❌ `window.prompt(...)`

**Alasan**: Dialog bawaan browser terlihat kaku, menghentikan seluruh thread browser (blocking), memunculkan teks jelek seperti *"localhost:3000 menyatakan"*, tidak mendukung animasi, dan merusak kenyamanan visual (*User Experience*) aplikasi.

---

## ✨ Standar Sistem Kita: Custom In-App Modal & Toast

Seluruh pesan dan interaksi wajib menggunakan sistem popup terintegrasi yang telah disediakan:

| Jenis Pesan | Komponen / Hook | Kapan Digunakan |
| :--- | :--- | :--- |
| **Konfirmasi Aksi (Ya / Batal)** | `const { confirm } = useDialog()` atau `showConfirm(...)` | Aksi destruktif (Hapus Toko, Kosongkan Data, Hapus Menu, Hapus Foto) atau tindakan krusial. |
| **Pemberitahuan / Alert Modal** | `const { alert } = useDialog()` atau `showAlert(...)` | Pesan penting yang butuh persetujuan/dibaca pengguna (misal: GPS ditolak, kontak belum diisi). |
| **Toast Notification** | `const { toast } = useToast()` | Umpan balik cepat sementara yang otomatis hilang setelah 4 detik (misal: "Toko berhasil disimpan", "Disalin ke clipboard"). |

---

## 🎨 4 Varian Tema Popup Dialog

Setiap popup dialog telah disesuaikan dengan tema visual dan palet warna desain sistem Toko Lokal:

1. **`danger` (Merah / Rose)**
   - **Ikon**: `trash` atau `alertCircle`
   - **Latar Ikon**: Soft Rose (`bg-rose-100 text-rose-600`)
   - **Tombol Aksi**: Rose solid dengan shadow lembut (`bg-rose-600 hover:bg-rose-700 text-white`)
   - **Penggunaan**: Hapus toko, hapus produk, reset database, hapus transaksi.

2. **`warning` (Kuning / Amber)**
   - **Ikon**: `alertCircle`
   - **Latar Ikon**: Soft Amber (`bg-amber-100 text-amber-700`)
   - **Tombol Aksi**: Amber solid (`bg-amber-600 hover:bg-amber-700 text-white`)
   - **Penggunaan**: Izin lokasi GPS tidak aktif, nomor WhatsApp belum tersedia, kuota slot penuh.

3. **`info` (Teal / Brand Toko Lokal)**
   - **Ikon**: `sparkles` atau `info`
   - **Latar Ikon**: Soft Teal (`bg-teal-100 text-teal-800`)
   - **Tombol Aksi**: Teal solid (`bg-teal-700 hover:bg-teal-800 text-white`)
   - **Penggunaan**: Muat data contoh toko, informasi fitur baru, panduan singkat.

4. **`success` (Hijau / Emerald)**
   - **Ikon**: `check`
   - **Latar Ikon**: Soft Emerald (`bg-emerald-100 text-emerald-700`)
   - **Tombol Aksi**: Emerald solid (`bg-emerald-700 hover:bg-emerald-800 text-white`)
   - **Penggunaan**: Notifikasi konfirmasi berhasil yang membutuhkan atensi khusus.

---

## 🎬 Animasi & Interaktivitas

Popup dirancang dengan micro-animation yang halus dan elegan:
- **Backdrop Overlay**: Animasi fade-in halus dengan latar semi-transparan dan efek blur (`backdrop-blur-xs`).
- **Modal Card**: Animasi zoom-in halus (`scale(0.93) -> scale(1)`) dengan spring curve alami (`cubic-bezier(0.16, 1, 0.3, 1)`).
- **Aksesibilitas & Keyboard**:
  - Tekan tombol **`Escape`** untuk membatalkan / menutup popup.
  - Klik pada area di luar kartu modal (backdrop) untuk membatalkan aksi secara aman.
  - Tombol aksi utama otomatis difokuskan (*auto-focus*) sehingga pengguna bisa langsung menekan **`Enter`**.

---

## 💻 Panduan Penggunaan & Contoh Kode

### 1. Konfirmasi Aksi Destruktif (Hapus Data)
```tsx
import { useDialog } from "@/components/dialog";
import { useToast } from "@/components/toast";

export function HapusTokoButton({ id, nama }: { id: string; nama: string }) {
  const { confirm } = useDialog();
  const { toast } = useToast();

  const handleHapus = async () => {
    const setuju = await confirm({
      title: `Hapus Toko "${nama}"?`,
      message: `Data toko "${nama}" dan seluruh produk terkait akan dihapus secara permanen dari sistem.`,
      confirmText: "Ya, Hapus Toko",
      cancelText: "Batal",
      variant: "danger",
      icon: "trash",
    });

    if (setuju) {
      await hapusTokoAction(id);
      toast(`Toko "${nama}" berhasil dihapus`, "success");
    }
  };

  return (
    <button onClick={handleHapus} className="btn-danger">
      Hapus Toko
    </button>
  );
}
```

### 2. Pemberitahuan Modal (Alert)
```tsx
import { useDialog } from "@/components/dialog";

export function TombolOrder({ whatsappUrl }: { whatsappUrl?: string | null }) {
  const { alert } = useDialog();

  const handleOrder = () => {
    if (!whatsappUrl) {
      alert({
        title: "Nomor WhatsApp Belum Tersedia",
        message: "Toko ini belum menambahkan kontak WhatsApp aktif. Silakan hubungi via Google Maps atau datangi langsung.",
        variant: "warning",
        confirmText: "Mengerti",
      });
      return;
    }
    window.open(whatsappUrl, "_blank");
  };

  return <button onClick={handleOrder}>Order Sekarang</button>;
}
```

### 3. Pemanggilan Imperatif di Luar React Hooks
Jika kamu berada di dalam fungsi utilitas atau event handler luar:
```tsx
import { showConfirm, showAlert } from "@/components/dialog";

async function prosesData() {
  const ok = await showConfirm({
    title: "Simpan Perubahan?",
    message: "Apakah kamu yakin ingin memperbarui data sekarang?",
    variant: "info",
  });

  if (ok) {
    // Lanjutkan proses
  }
}
```

---

## 📂 Struktur File Implementasi
- **Komponen Dialog & Context**: [src/components/dialog.tsx](file:///C:/Users/pf3sg/.gemini/antigravity-ide/scratch/bisnisPadang/src/components/dialog.tsx)
- **Komponen Toast & Context**: [src/components/toast.tsx](file:///C:/Users/pf3sg/.gemini/antigravity-ide/scratch/bisnisPadang/src/components/toast.tsx)
- **Keyframe & Kelas Animasi**: [src/app/globals.css](file:///C:/Users/pf3sg/.gemini/antigravity-ide/scratch/bisnisPadang/src/app/globals.css) (`.animate-modal-backdrop`, `.animate-modal-card`)
- **Root Provider Mounting**: [src/app/layout.tsx](file:///C:/Users/pf3sg/.gemini/antigravity-ide/scratch/bisnisPadang/src/app/layout.tsx) (`<DialogProvider>`, `<ToastProvider>`)
