import Link from "next/link";

export default function StoreNotFound() {
  return <div className="page-heading"><h1>Toko tidak ditemukan</h1><p>Periksa kembali alamat toko yang Anda buka.</p><Link href="/" className="button button--primary mt-6">Kembali ke Beranda</Link></div>;
}
