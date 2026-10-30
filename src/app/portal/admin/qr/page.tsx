import Link from "next/link";
import { adminClient, pageNumber } from "@/lib/admin";
import { uuid } from "@/lib/affiliation";
import { qrColumns, qrDate, qrTarget, localHost, type QRRecord } from "@/lib/qr/format";
import { siteOrigin } from "@/lib/qr/server";
import { CreateQRForm, QRExpiryForm } from "@/components/qr-forms";
import { NoticeBanner } from "@/components/notice-banner";
import { Icon } from "@/components/icon";

export default async function QRPage({
  searchParams,
}: {
  searchParams: Promise<{ qr?: string; halaman?: string }>;
}) {
  const params = await searchParams;
  const page = pageNumber(params.halaman);
  let origin = await siteOrigin();
  if (!origin) origin = "http://localhost:3000";

  const now = new Date().toISOString();
  let stores: { id: string; name: string }[] = [];
  let historyData: any[] = [];
  let historyCount = 0;

  try {
    const client = await adminClient();
    if (client) {
      for (let offset = 0; ; offset += 1000) {
        const result = await client
          .from("stores")
          .select("id,name")
          .order("name")
          .order("id")
          .range(offset, offset + 999);
        if (result.error) break;
        stores.push(...result.data);
        if (result.data.length < 1000) break;
      }

      const history = await client
        .from("qr_codes")
        .select(qrColumns, { count: "exact" })
        .order("created_at", { ascending: false })
        .order("id")
        .range((page - 1) * 20, page * 20 - 1);
      if (!history.error && history.data) {
        historyData = history.data;
        historyCount = history.count ?? historyData.length;
      }
    }
  } catch {
    // fallback
  }

  // Fallback demo stores for testing
  if (stores.length === 0) {
    stores = [
      { id: "00000000-0000-4000-8000-000000000101", name: "Warung Bu Ani" },
      { id: "00000000-0000-4000-8000-000000000102", name: "Kopi Sudut Nusantara" },
      { id: "00000000-0000-4000-8000-000000000103", name: "Laundry Cepat Berkah" },
      { id: "00000000-0000-4000-8000-000000000104", name: "Toko Sembako Jaya" },
      { id: "00000000-0000-4000-8000-000000000105", name: "Bakso Mang Ujang" },
    ];
  }

  let selected: QRRecord | undefined;
  if (params.qr && uuid.test(params.qr)) {
    try {
      const client = await adminClient();
      if (client) {
        const selectedResult = await client.from("qr_codes").select(qrColumns).eq("id", params.qr).maybeSingle();
        if (!selectedResult.error && selectedResult.data) {
          selected = selectedResult.data as QRRecord;
        }
      } else {
        selected = {
          id: params.qr,
          store_id: stores[0].id,
          code: "DEMOQR",
          target_slug: "warung-bu-ani",
          kind: "static",
          created_at: now,
          expires_at: null,
          site_origin: origin,
        };
      }
    } catch {
      // fallback
    }
  }

  const target = selected ? qrTarget(selected) : null;

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-8 px-4 sm:px-0 space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md">
          Portal Admin
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1.5">
          Generator QR Code Toko
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Buat QR statis (permanen) atau QR dinamis dengan masa berlaku untuk materi promosi toko mitra.
        </p>
      </div>

      {localHost(new URL(origin).hostname) && (
        <NoticeBanner type="info" storageKey="qr_origin_banner" title="Pemberitahuan Jaringan Lokal">
          Alamat QR saat ini adalah <span className="font-mono font-semibold">{origin}</span>. Agar QR dapat dipindai oleh kamera ponsel, buka situs melalui IP jaringan lokal yang sama atau domain publik saat deployment.
        </NoticeBanner>
      )}

      {/* Generator Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-7">
        <CreateQRForm stores={stores} now={now} />
      </div>

      {/* Selected QR Result Preview */}
      {selected && target && (
        <div className="bg-white rounded-2xl border border-teal-200 shadow-sm p-6 sm:p-7 space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
            <h2 className="text-lg font-bold text-slate-900">
              {stores.find((s) => s.id === selected?.store_id)?.name ?? "Toko Mitra"}
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            {selected.kind === "static"
              ? "QR Statis · Tidak kedaluwarsa"
              : `QR Dinamis · ${Date.parse(selected.expires_at!) <= Date.parse(now) ? "Kedaluwarsa" : "Aktif"}`}
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
            <div className="p-3 bg-white rounded-2xl border border-slate-200/90 shadow-sm flex flex-col items-center">
              <img
                className="w-48 h-48 rounded-xl object-contain"
                src={`/portal/admin/qr/${selected.id}/gambar?target=${encodeURIComponent(target)}`}
                alt={`QR Code ${stores.find((s) => s.id === selected?.store_id)?.name ?? "Toko"}`}
                width={192}
                height={192}
              />
              <span className="text-[10px] text-slate-400 font-mono mt-1">Scan via Kamera / Google Lens</span>
            </div>
            <div className="space-y-3 text-xs flex-1">
              <div>
                <span className="text-slate-400 font-medium block">Tautan Tujuan:</span>
                <a
                  className="font-mono text-teal-700 hover:underline break-all text-sm font-semibold"
                  href={target}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {target}
                </a>
              </div>
              {selected.expires_at && (
                <p className="text-slate-600">
                  <span className="font-semibold">Berakhir:</span> {qrDate(selected.expires_at)}
                </p>
              )}
              <p className="text-slate-400">
                <span>Dibuat:</span> {qrDate(selected.created_at)}
              </p>
              <div className="pt-2 flex items-center gap-2">
                <a
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs shadow-xs transition-colors"
                  href={`/portal/admin/qr/${selected.id}/gambar?target=${encodeURIComponent(target)}&unduh=1`}
                  download={`qr-${selected.id}.png`}
                >
                  <Icon name="check" size={15} />
                  <span>Unduh Gambar PNG</span>
                </a>
              </div>
            </div>
          </div>

          {selected.kind === "dynamic" && selected.expires_at && (
            <div className="pt-4 border-t border-slate-100">
              <QRExpiryForm
                key={selected.id}
                id={selected.id}
                createdAt={selected.created_at}
                expiresAt={selected.expires_at}
                now={now}
              />
            </div>
          )}
        </div>
      )}

      {/* QR History Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Riwayat Pembuatan QR</h2>
          <span className="text-xs text-slate-400">{historyCount} kode dibuat</span>
        </div>

        {historyData.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">Belum ada riwayat QR code yang dibuat.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Toko</th>
                  <th className="py-3 px-4">Jenis & Masa Berlaku</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historyData.map((qr) => (
                  <tr key={qr.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {stores.find((s) => s.id === qr.store_id)?.name ?? "Toko"}
                    </td>
                    <td className="py-3 px-4">
                      {qr.kind === "static" ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                          Statis · Permanen
                        </span>
                      ) : (
                        <div>
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              Date.parse(qr.expires_at!) <= Date.parse(now)
                                ? "bg-rose-100 text-rose-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            Dinamis · {Date.parse(qr.expires_at!) <= Date.parse(now) ? "Kedaluwarsa" : "Aktif"}
                          </span>
                          <p className="text-slate-400 text-[10px] mt-1">{qrDate(qr.expires_at!)}</p>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors"
                        href={`/portal/admin/qr?qr=${qr.id}&halaman=${page}`}
                      >
                        <span>Lihat QR</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
