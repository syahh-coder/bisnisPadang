"use client";

export default function ErrorPage() {
  return <section className="page-heading" role="alert">
    <h1>Halaman belum dapat dimuat</h1>
    <p>Terjadi gangguan. Muat ulang halaman untuk mencoba kembali.</p>
    <div className="recovery-actions">
      <button type="button" className="button button--primary" onClick={() => window.location.reload()}>Coba lagi</button>
      <a href="/" className="button">Kembali ke Beranda</a>
    </div>
  </section>;
}
