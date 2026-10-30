# Aturan Notifikasi & Popup (Zero Native Dialogs)

1. **Dilarang Keras** menggunakan dialog native browser:
   - JANGAN PERNAH gunakan `window.alert()`, `alert()`
   - JANGAN PERNAH gunakan `window.confirm()`, `confirm()`
   - JANGAN PERNAH gunakan `window.prompt()`, `prompt()`

2. **Wajib Menggunakan Sistem Custom In-App Modal Dialog & Toast**:
   - Untuk konfirmasi aksi (hapus toko, reset data, hapus menu, hapus foto):
     Gunakan `const { confirm } = useDialog()` atau `await showConfirm(...)`.
   - Untuk notifikasi peringatan/alert penting:
     Gunakan `const { alert } = useDialog()` atau `await showAlert(...)`.
   - Untuk notifikasi status cepat yang otomatis menghilang:
     Gunakan `const { toast } = useToast()`.

3. **Tema dan Konsistensi**:
   - Selalu gunakan varian yang sesuai: `'danger'` (merah/hapus), `'warning'` (kuning/peringatan), `'info'` (teal/informasi), `'success'` (hijau/berhasil).
   - Pastikan teks ramah, jelas, dan tombol aksi spesifik (misal: "Ya, Hapus Toko", bukan cuma "OK").

Rujukan dokumentasi lengkap tersedia di `docs/notifikasi-dan-popup.md`.
