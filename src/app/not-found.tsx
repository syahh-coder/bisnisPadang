import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page-heading">
      <h1>Halaman tidak ditemukan</h1>
      <p>Periksa kembali alamat halaman yang Anda buka.</p>
      <Link href="/" className="button button--primary mt-6">Kembali ke Beranda</Link>
    </div>
  );
}
