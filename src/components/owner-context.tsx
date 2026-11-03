import Link from "next/link";
import type { StoreRecord } from "@/lib/admin";
import { Icon, FoodAgentIcon } from "@/components/icon";
import { parseDeliveryChannels } from "@/lib/stores/links";

export function OwnerUnavailable({ status }: { status: "empty" | "missing" | "unavailable" }) {
  return (
    <div
      className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-sm space-y-2"
      role={status === "empty" ? "status" : "alert"}
    >
      <div className="flex items-center gap-2 font-bold">
        <Icon name="alertCircle" size={18} className="text-amber-700" />
        <span>
          {status === "empty"
            ? "Akun Anda belum terhubung ke toko. Hubungi pengelola untuk menghubungkannya."
            : status === "missing"
            ? "Toko tidak tersedia untuk akun Anda."
            : "Data toko belum dapat dimuat. Coba muat ulang halaman."}
        </span>
      </div>
      {status === "missing" && (
        <Link className="inline-flex items-center gap-1 font-bold text-emerald-800 hover:underline text-xs" href="/portal/toko">
          <Icon name="chevronLeft" size={14} />
          <span>Kembali ke dashboard</span>
        </Link>
      )}
    </div>
  );
}

export function OwnerStorePicker({
  store,
  stores,
  path,
}: {
  store: StoreRecord;
  stores: StoreRecord[];
  path: string;
}) {
  const channels = parseDeliveryChannels(store.delivery_info, store.name, {
    opening_hours: store.opening_hours,
    gofood_url: store.gofood_url,
    shopeefood_url: store.shopeefood_url,
    grabfood_url: store.grabfood_url,
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-700 flex items-center justify-center shrink-0">
            <Icon name="store" size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-extrabold text-slate-900">{store.name}</span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono text-[10px] font-semibold">
                /toko/{store.slug}
              </span>
            </div>
            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{store.address}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {stores.length > 1 && (
            <form action={path} className="flex items-center gap-1.5">
              <label htmlFor="owner-store-select" className="sr-only">
                Pilih toko
              </label>
              <select
                id="owner-store-select"
                name="toko"
                defaultValue={store.id}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold transition-colors"
              >
                Ganti Toko
              </button>
            </form>
          )}

          <Link
            href={`/toko/${encodeURIComponent(store.slug)}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 text-xs font-bold transition-colors"
          >
            <span>Lihat Halaman Toko</span>
            <Icon name="externalLink" size={13} />
          </Link>
        </div>
      </div>

      {/* Active Delivery Channels Summary */}
      <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-2 text-[11px]">
        <span className="font-semibold text-slate-500">Saluran Order Aktif:</span>
        {store.phone ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
            <FoodAgentIcon agent="whatsapp" size={12} />
            <span>WA Delivery ({store.phone})</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 font-medium">
            <span>WA Belum Diatur</span>
          </span>
        )}

        {channels.gofoodUrl && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-50 text-green-800 border border-green-200 font-semibold">
            <FoodAgentIcon agent="gofood" size={12} />
            <span>GoFood Aktif</span>
          </span>
        )}
        {channels.shopeefoodUrl && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-50 text-orange-800 border border-orange-200 font-semibold">
            <FoodAgentIcon agent="shopeefood" size={12} />
            <span>ShopeeFood Aktif</span>
          </span>
        )}
        {channels.grabfoodUrl && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
            <FoodAgentIcon agent="grabfood" size={12} />
            <span>GrabFood Aktif</span>
          </span>
        )}
        {!channels.hasAnyAgentLink && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 font-medium">
            <span>Tanpa Link GoFood/ShopeeFood/GrabFood (Disembunyikan di Toko)</span>
          </span>
        )}
      </div>
    </div>
  );
}
