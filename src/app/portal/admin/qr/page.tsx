import Link from "next/link";
import { adminClient, pageNumber } from "@/lib/admin";
import { uuid } from "@/lib/affiliation";
import { qrColumns, qrDate, qrTarget, localHost, type QRRecord } from "@/lib/qr/format";
import { siteOrigin } from "@/lib/qr/server";
import { CreateQRForm, QRExpiryForm } from "@/components/qr-forms";

export default async function QRPage({ searchParams }: { searchParams: Promise<{ qr?: string; halaman?: string }> }) {
  const params = await searchParams;
  const client = await adminClient();
  const page = pageNumber(params.halaman);
  const origin = await siteOrigin();
  const now = new Date().toISOString();
  const stores: { id: string; name: string }[] = [];
  let storesFailed = false;
  for (let offset = 0; ; offset += 1000) {
    const result = await client.from("stores").select("id,name").order("name").order("id").range(offset, offset + 999);
    if (result.error) { storesFailed = true; break; }
    stores.push(...result.data);
    if (result.data.length < 1000) break;
  }
  const history = await client.from("qr_codes").select(qrColumns, { count: "exact" }).order("created_at", { ascending: false }).order("id").range((page - 1) * 20, page * 20 - 1);
  const selectedResult = params.qr && uuid.test(params.qr) ? await client.from("qr_codes").select(qrColumns).eq("id", params.qr).maybeSingle() : null;
  const selected = selectedResult?.data as QRRecord | undefined;
  const target = selected ? qrTarget(selected) : null;
  return <section className="page-view"><div className="page-heading"><h1>Pembuat QR</h1><p>Buat QR yang membuka halaman toko.</p></div>
    {storesFailed ? <p role="alert" className="notice">Daftar toko belum dapat dimuat. Coba muat ulang.</p> : !origin ? <p role="alert" className="notice">Alamat situs belum tersedia. Hubungi pengelola untuk mengatur alamat situs.</p> : <>{localHost(new URL(origin).hostname) && <p className="demo-note">Alamat QR saat ini: {origin}. Agar dapat dipindai dari ponsel, buka situs melalui alamat jaringan yang juga dapat dijangkau ponsel sebelum membuat QR.</p>}<CreateQRForm stores={stores} now={now} />{!stores.length && <p className="notice">Belum ada toko. <Link className="text-link" href="/portal/admin/kelola">Tambahkan toko terlebih dahulu.</Link></p>}</>}
    {params.qr && <section className="admin-section" aria-label="Hasil QR">{selectedResult?.error ? <p role="alert">QR belum dapat dimuat. Coba kembali.</p> : !selected || !target ? <p role="alert">QR tidak ditemukan.</p> : <><h2 className="section-title">{stores.find((s) => s.id === selected.store_id)?.name ?? "Toko"}</h2><p>{selected.kind === "static" ? "QR statis · Tidak kedaluwarsa" : `QR dinamis · ${Date.parse(selected.expires_at!) <= Date.parse(now) ? "Kedaluwarsa" : "Aktif"}`}</p><div className="qr-result"><img className="qr-image" src={`/portal/admin/qr/${selected.id}/gambar`} width={320} height={320} alt={`QR ${selected.kind === "static" ? "statis" : "dinamis"} untuk toko`} /><div className="qr-result-info"><p className="qr-target"><a className="text-link" href={target} target="_blank" rel="noopener noreferrer">{target}</a></p>{selected.expires_at && <p>Berakhir: {qrDate(selected.expires_at)}</p>}<p className="form-hint">Dibuat: {qrDate(selected.created_at)}</p><a className="button" href={`/portal/admin/qr/${selected.id}/gambar?unduh=1`}>Unduh PNG</a></div></div>{selected.kind === "dynamic" && selected.expires_at && <QRExpiryForm key={selected.id} id={selected.id} createdAt={selected.created_at} expiresAt={selected.expires_at} now={now} />}</>}</section>}
    <section className="admin-section" aria-labelledby="qr-history"><h2 className="section-title" id="qr-history">Riwayat QR <span className="muted">({history.count ?? 0})</span></h2>{history.error ? <p role="alert" className="notice">Riwayat QR belum dapat dimuat. Coba muat ulang.</p> : <>{!history.data?.length ? <p className="notice">Belum ada QR di halaman ini.</p> : <div className="table-scroll" role="region" aria-label="Riwayat QR" tabIndex={0}><table className="data-table compact-table qr-history-table"><thead><tr><th>Toko</th><th>Jenis / masa berlaku</th><th><span className="sr-only">Aksi</span></th></tr></thead><tbody>{(history.data as QRRecord[]).map((qr) => <tr key={qr.id}><td>{stores.find((s) => s.id === qr.store_id)?.name ?? "Toko"}</td><td>{qr.kind === "static" ? "Statis · Tidak kedaluwarsa" : <>Dinamis · {Date.parse(qr.expires_at!) <= Date.parse(now) ? "Kedaluwarsa" : "Aktif"}<p className="muted">{qrDate(qr.expires_at!)}</p></>}</td><td><Link className="text-link qr-view-link" href={`/portal/admin/qr?qr=${qr.id}&halaman=${page}`}>Lihat</Link></td></tr>)}</tbody></table></div>}<div className="pagination">{page > 1 && <Link className="button" href={`/portal/admin/qr?halaman=${page - 1}`}>Sebelumnya</Link>}<span>Halaman {page}</span>{page * 20 < (history.count ?? 0) && <Link className="button" href={`/portal/admin/qr?halaman=${page + 1}`}>Berikutnya</Link>}</div></>}</section>
  </section>;
}
