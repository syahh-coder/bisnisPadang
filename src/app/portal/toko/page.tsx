import Link from "next/link";
import { redirect } from "next/navigation";
import { ownerContext } from "@/lib/portal/owner";
import { todayWib, validDate, offsetDate, shortDate, rupiah, type DailySale } from "@/lib/portal/format";
import { dateLabel } from "@/lib/affiliation";
import { OwnerUnavailable, OwnerStorePicker } from "@/components/owner-context";
import { DailySalesForm, DeleteSalesForm } from "@/components/owner-forms";
import { visitSources, sourceLabels, type VisitSummary } from "@/lib/visits";

export default async function StorePortalPage({ searchParams }: { searchParams: Promise<{ toko?: string; tanggal?: string }> }) {
  const params = await searchParams;
  const context = await ownerContext(params.toko);
  const heading = <div className="page-heading"><h1>Portal Toko</h1><p>Catatan harian toko Anda.</p></div>;
  if (context.status !== "ready") return <section className="page-view">{heading}<OwnerUnavailable status={context.status} /></section>;
  const { client, store, stores } = context;
  if (!params.toko && stores.length > 1) redirect(`/portal/toko?toko=${store.id}${params.tanggal ? `&tanggal=${encodeURIComponent(params.tanggal)}` : ""}`);
  const today = todayWib();
  const date = params.tanggal ?? today;
  if (!validDate(date) || date > today) return <section className="page-view">{heading}<p role="alert" className="notice">Pilih tanggal yang valid, maksimal hari ini (WIB). <Link className="text-link" href={`/portal/toko?toko=${store.id}`}>Kembali ke hari ini</Link></p></section>;
  const dates = Array.from({ length: 7 }, (_, i) => offsetDate(date, i - 6));
  const [result,visitsResult] = await Promise.all([
    client.from("daily_sales").select("id,date,revenue,sales_count").eq("store_id", store.id).gte("date", dates[0]).lte("date", date).order("date"),
    client.rpc("store_visit_summary",{shop_id:store.id}),
  ]);
  const visits = (visitsResult.data ?? []) as VisitSummary[];
  const visitsFailed = visitsResult.error || visits.length !== 4 || !visitSources.every((source) => visits.some((v) => v.source === source && Number.isSafeInteger(Number(v.visits)) && Number(v.visits) >= 0));
  const records = (result.data ?? []).map((r) => ({ ...r, revenue: Number(r.revenue) })) as DailySale[];
  const entry = records.find((r) => r.date === date);
  const totalCents = records.reduce((sum, r) => sum + Math.round(r.revenue * 100), 0);
  return <section className="page-view">{heading}<OwnerStorePicker store={store} stores={stores} path="/portal/toko" />
    <section className="dashboard-section" aria-labelledby="daily-record"><h2 className="section-title" id="daily-record">Omset & penjualan</h2>
      <form action="/portal/toko" className="editor-form date-picker" aria-label="Pilih tanggal catatan"><input type="hidden" name="toko" value={store.id} /><label>Tanggal catatan (WIB)<input name="tanggal" type="date" min="1900-01-01" max={today} required defaultValue={date} /></label><button className="button">Tampilkan</button></form>
      <p className="record-date">{dateLabel(date)}</p>
      {result.error ? <p className="notice" role="alert">Catatan belum dapat dimuat. Coba muat ulang sebelum mengubah data.</p> : <><p className="form-hint">{entry ? "Tanggal ini sudah dicatat. Simpan untuk memperbarui catatan yang sama." : "Tanggal ini belum dicatat. Isi omset dan jumlah transaksi secara manual."}</p><DailySalesForm key={`${store.id}-${date}-${entry?.id ?? "new"}`} storeId={store.id} date={date} entry={entry} />{entry && <DeleteSalesForm storeId={store.id} date={date} />}
        <h3 className="section-title">Ringkasan 7 hari</h3><div className="table-scroll" role="region" aria-label="Ringkasan omset dan penjualan" tabIndex={0}><table className="data-table compact-table"><thead><tr><th>Tanggal</th><th className="number-cell">Omset</th><th className="number-cell">Penjualan</th></tr></thead><tbody>{dates.map((d) => {
          const record = records.find((r) => r.date === d);
          return <tr key={d}><th scope="row"><Link className="text-link" href={`/portal/toko?toko=${store.id}&tanggal=${d}`}>{shortDate(d)}</Link></th>{record ? <><td className="number-cell">{rupiah(record.revenue)}</td><td className="number-cell">{record.sales_count.toLocaleString("id-ID")}</td></> : <td colSpan={2} className="muted">Belum dicatat</td>}</tr>;
        })}</tbody>{records.length > 0 && <tfoot><tr><th>Total tercatat</th><td className="number-cell">{rupiah(totalCents / 100)}</td><td className="number-cell">{records.reduce((sum, r) => sum + r.sales_count, 0).toLocaleString("id-ID")}</td></tr></tfoot>}</table></div><p className="form-hint">{records.length} dari 7 hari dicatat. Hari yang belum dicatat tidak dihitung sebagai nol.</p>
      </>}
    </section>
    <section className="admin-section" aria-labelledby="visits"><h2 className="section-title" id="visits">Pengunjung hari ini</h2>{visitsFailed ? <p role="alert" className="notice">Statistik kunjungan belum dapat dimuat. Coba muat ulang halaman.</p> : <><p className="form-hint">{dateLabel(visits[0].visit_date)} (WIB). Jumlah pembukaan halaman toko, termasuk kunjungan ulang.</p><div className="table-scroll" role="region" aria-label="Statistik pengunjung hari ini" tabIndex={0}><table className="data-table compact-table"><thead><tr><th>Sumber</th><th className="number-cell">Kunjungan</th></tr></thead><tbody>{visitSources.map((source) => <tr key={source}><th scope="row">{sourceLabels[source]}</th><td className="number-cell">{Number(visits.find((v) => v.source === source)!.visits).toLocaleString("id-ID")}</td></tr>)}</tbody><tfoot><tr><th>Total kunjungan</th><td className="number-cell">{visits.reduce((sum,v) => sum + Number(v.visits),0).toLocaleString("id-ID")}</td></tr></tfoot></table></div><p className="form-hint">Statistik diperbarui saat halaman dimuat.</p></>}</section>
  </section>;
}
