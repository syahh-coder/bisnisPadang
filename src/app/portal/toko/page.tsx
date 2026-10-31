import Link from "next/link";
import { redirect } from "next/navigation";
import { ownerContext } from "@/lib/portal/owner";
import { todayWib, validDate, offsetDate, shortDate, rupiah, type DailySale } from "@/lib/portal/format";
import { dateLabel } from "@/lib/affiliation";
import { OwnerUnavailable, OwnerStorePicker } from "@/components/owner-context";
import { DailySalesForm, DeleteSalesForm } from "@/components/owner-forms";
import { visitSources, sourceLabels, type VisitSummary } from "@/lib/visits";
import { getDemoSales, getDemoStore } from "@/lib/catalog/demo";
import { Icon, FoodAgentIcon } from "@/components/icon";
import { parseDeliveryChannels } from "@/lib/stores/links";

export default async function StorePortalPage({
  searchParams,
}: {
  searchParams: Promise<{ toko?: string; tanggal?: string }>;
}) {
  const params = await searchParams;
  const context = await ownerContext(params.toko);

  if (context.status !== "ready") {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <OwnerUnavailable status={context.status} />
      </div>
    );
  }

  const { client, store, stores } = context;
  if (!params.toko && stores.length > 1) {
    redirect(`/portal/toko?toko=${store.id}${params.tanggal ? `&tanggal=${encodeURIComponent(params.tanggal)}` : ""}`);
  }

  const today = todayWib();
  const date = params.tanggal ?? today;

  if (!validDate(date) || date > today) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm">
          <p>Pilih tanggal yang valid, maksimal hari ini (WIB).</p>
          <Link className="font-semibold text-teal-800 underline mt-2 inline-block" href={`/portal/toko?toko=${store.id}`}>
            Kembali ke hari ini
          </Link>
        </div>
      </div>
    );
  }

  const dates = Array.from({ length: 7 }, (_, i) => offsetDate(date, i - 6));
  let records: DailySale[] = [];
  let visits: VisitSummary[] = [];
  let visitsFailed = false;
  let productsCount = 0;

  if (client) {
    try {
      const [result, visitsResult, prodCountRes] = await Promise.all([
        client
          .from("daily_sales")
          .select("id,date,revenue,sales_count")
          .eq("store_id", store.id)
          .gte("date", dates[0])
          .lte("date", date)
          .order("date"),
        client.rpc("store_visit_summary", { shop_id: store.id }),
        client.from("products").select("id", { count: "exact", head: true }).eq("store_id", store.id),
      ]);
      productsCount = prodCountRes.count ?? 0;
      visits = (visitsResult.data ?? []) as VisitSummary[];
      visitsFailed =
        Boolean(visitsResult.error) ||
        visits.length !== 4 ||
        !visitSources.every(
          (source) =>
            visits.some((v) => v.source === source && Number.isSafeInteger(Number(v.visits)) && Number(v.visits) >= 0)
        );
      records = (result.data ?? []).map((r: { id: string; date: string; revenue: number | string; sales_count: number }) => ({ ...r, revenue: Number(r.revenue) })) as DailySale[];
    } catch {
      visitsFailed = true;
    }
  } else {
    // Mock data for demo mode
    visits = [
      { visit_date: date, source: "google_maps", visits: 28 },
      { visit_date: date, source: "qr", visits: 19 },
      { visit_date: date, source: "search", visits: 42 },
      { visit_date: date, source: "direct", visits: 15 },
    ];
    records = getDemoSales(store.id, dates);
    const demoStore = getDemoStore(store.slug);
    productsCount = demoStore?.products.length ?? 0;
  }

  const channels = parseDeliveryChannels(store.delivery_info, store.name, {
    opening_hours: store.opening_hours,
    gofood_url: store.gofood_url,
    shopeefood_url: store.shopeefood_url,
    grabfood_url: store.grabfood_url,
  });

  const entry = records.find((r) => r.date === date);
  const totalCents = records.reduce((sum, r) => sum + Math.round(r.revenue * 100), 0);
  const totalVisits = visits.reduce((sum, v) => sum + Number(v.visits), 0);

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-8 px-4 sm:px-0 space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md">
            Dashboard Pemilik
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1.5">{store.name}</h1>
          <p className="text-xs text-slate-500 mt-0.5">Kelola profil toko, menu, info delivery, omset, dan pantau kunjungan harian toko Anda.</p>
        </div>
        <Link
          href={`/toko/${store.slug}`}
          target="_blank"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition-colors self-start sm:self-auto"
        >
          <span>Lihat Halaman Publik</span>
          <Icon name="externalLink" size={14} />
        </Link>
      </div>

      <OwnerStorePicker store={store} stores={stores} path="/portal/toko" />

      {/* Quick Store & Menu Control Center */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-slate-900">
                <Icon name="truck" size={16} className="text-teal-700" />
                <span>Profil Toko, Jam Buka & Delivery</span>
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                Tersinkronisasi
              </span>
            </div>

            <div className="text-xs text-slate-600 space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <p className="flex items-center justify-between gap-2">
                <span className="text-slate-500">Jam Operasional:</span>
                <span className="font-bold text-slate-800">{channels.openingHours || "Setiap Hari, 08.00 - 21.00 WIB"}</span>
              </p>
              <p className="flex items-center justify-between gap-2">
                <span className="text-slate-500">Kurir Toko / WA:</span>
                <span className="font-bold text-emerald-700 truncate max-w-[200px]">
                  {channels.cleanDeliveryInfo || "Antar langsung & Ambil di toko"}
                </span>
              </p>
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/70">
                <span className="text-slate-500">Food Delivery Agent:</span>
                <div className="flex items-center gap-1.5">
                  {channels.gofoodUrl && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-green-100 text-green-800 text-[10px] font-bold">
                      <FoodAgentIcon agent="gofood" size={11} />
                      <span>GoFood</span>
                    </span>
                  )}
                  {channels.shopeefoodUrl && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-orange-100 text-orange-800 text-[10px] font-bold">
                      <FoodAgentIcon agent="shopeefood" size={11} />
                      <span>ShopeeFood</span>
                    </span>
                  )}
                  {channels.grabfoodUrl && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      <FoodAgentIcon agent="grabfood" size={11} />
                      <span>GrabFood</span>
                    </span>
                  )}
                  {!channels.hasAnyAgentLink && (
                    <span className="text-[11px] font-medium text-slate-400">Tidak memakai aplikasi</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Link
            href={`/portal/toko/info?toko=${store.id}`}
            className="w-full py-2.5 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
          >
            <Icon name="edit" size={14} />
            <span>Edit Info Toko, Jam Buka & Link Delivery</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-slate-900">
                <Icon name="shoppingBag" size={16} className="text-teal-700" />
                <span>Katalog Menu & Produk Toko</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200 text-[11px] font-extrabold">
                {productsCount} Menu
              </span>
            </div>

            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5">
              {productsCount > 0 ? (
                <>
                  <p className="font-semibold text-slate-800">
                    Toko Anda memiliki {productsCount} menu/produk aktif yang siap dipesan pelanggan.
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Pelanggan dapat memasukkan menu ke keranjang dan checkout langsung ke WhatsApp Anda dengan format nomor urut otomatis.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-amber-800">
                    Belum ada menu yang ditambahkan (Tampilan Menu Kosong di halaman toko).
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Tambahkan menu makanan, minuman, atau layanan agar pelanggan bisa memesan dari halaman toko Anda.
                  </p>
                </>
              )}
            </div>
          </div>

          <Link
            href={`/portal/toko/menu?toko=${store.id}`}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
          >
            <Icon name="plus" size={14} />
            <span>Tambah / Edit Menu & Harga ({productsCount})</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Kunjungan Hari Ini</p>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">{totalVisits.toLocaleString("id-ID")}</p>
          <span className="text-[10px] text-teal-700 font-semibold mt-0.5 block">WIB Real-time</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Omset Tercatat</p>
          <p className="text-xl sm:text-2xl font-black text-teal-800 mt-1">{rupiah(entry?.revenue ?? 0)}</p>
          <span className="text-[10px] text-slate-400 mt-0.5 block">{dateLabel(date).split(",")[0]}</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Transaksi</p>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            {(entry?.sales_count ?? 0).toLocaleString("id-ID")}
          </p>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Struk / pesanan</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Total Omset 7 Hari</p>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">{rupiah(totalCents / 100)}</p>
          <span className="text-[10px] text-emerald-700 font-semibold mt-0.5 block">{records.length} hari terisi</span>
        </div>
      </div>

      {/* Omset & Penjualan Section */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Catat Omset & Penjualan</h2>
            <p className="text-xs text-slate-500 mt-0.5">Pilih tanggal untuk melihat atau memperbarui catatan penjualan.</p>
          </div>

          <form action="/portal/toko" className="flex items-center gap-2">
            <input type="hidden" name="toko" value={store.id} />
            <input
              name="tanggal"
              type="date"
              min="1900-01-01"
              max={today}
              required
              defaultValue={date}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-2xs transition-colors"
            >
              Pilih
            </button>
          </form>
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-600 mb-2">Tanggal: {dateLabel(date)}</p>
          <DailySalesForm
            key={`${store.id}-${date}-${entry?.id ?? "new"}`}
            storeId={store.id}
            date={date}
            entry={entry}
          />
          {entry && (
            <div className="mt-3">
              <DeleteSalesForm storeId={store.id} date={date} />
            </div>
          )}
        </div>

        {/* 7-Days Summary Table */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Riwayat Penjualan 7 Hari Terakhir</h3>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Tanggal</th>
                  <th className="py-2.5 px-3 text-right">Omset</th>
                  <th className="py-2.5 px-3 text-right">Jumlah Transaksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dates.map((d) => {
                  const record = records.find((r) => r.date === d);
                  return (
                    <tr key={d} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-2.5 px-3 font-medium">
                        <Link className="text-teal-700 hover:underline" href={`/portal/toko?toko=${store.id}&tanggal=${d}`}>
                          {shortDate(d)}
                        </Link>
                      </td>
                      {record ? (
                        <>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-900">{rupiah(record.revenue)}</td>
                          <td className="py-2.5 px-3 text-right text-slate-600">
                            {record.sales_count.toLocaleString("id-ID")}
                          </td>
                        </>
                      ) : (
                        <td colSpan={2} className="py-2.5 px-3 text-right text-slate-400 italic">
                          Belum dicatat
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
              {records.length > 0 && (
                <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-slate-900">
                  <tr>
                    <td className="py-2.5 px-3">Total Tercatat</td>
                    <td className="py-2.5 px-3 text-right text-teal-800">{rupiah(totalCents / 100)}</td>
                    <td className="py-2.5 px-3 text-right">
                      {records.reduce((sum, r) => sum + r.sales_count, 0).toLocaleString("id-ID")}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>

      {/* Traffic & Visit Sources */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Sumber Pengunjung Hari Ini</h2>
            <p className="text-xs text-slate-500 mt-0.5">Asal trafik pengunjung yang membuka halaman toko Anda.</p>
          </div>
          <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg">
            Total {totalVisits} Kunjungan
          </span>
        </div>

        {visitsFailed ? (
          <p className="text-xs text-slate-400">Statistik belum dapat dimuat.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {visitSources.map((source) => {
              const count = Number(visits.find((v) => v.source === source)?.visits ?? 0);
              const percentage = totalVisits > 0 ? Math.round((count / totalVisits) * 100) : 0;
              const sourceIcons: Record<string, "mapPin" | "qrCode" | "search" | "link"> = {
                google_maps: "mapPin",
                qr: "qrCode",
                search: "search",
                direct: "link",
              };

              return (
                <div key={source} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-teal-700 flex items-center justify-center shrink-0">
                      <Icon name={sourceIcons[source] || "info"} size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{sourceLabels[source]}</p>
                      <p className="text-[10px] text-slate-400">{percentage}% dari total</p>
                    </div>
                  </div>
                  <span className="text-base font-black text-slate-900">{count.toLocaleString("id-ID")}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
