import Link from "next/link";
import type { StoreRecord } from "@/lib/admin";

export function OwnerUnavailable({ status }: { status: "empty" | "missing" | "unavailable" }) {
  return <div className="notice" role={status === "empty" ? "status" : "alert"}><p>{status === "empty" ? "Akun Anda belum terhubung ke toko. Hubungi pengelola untuk menghubungkannya." : status === "missing" ? "Toko tidak tersedia untuk akun Anda." : "Data toko belum dapat dimuat. Coba muat ulang halaman."}</p>{status === "missing" && <Link className="text-link" href="/portal/toko">Kembali ke dashboard</Link>}</div>;
}
export function OwnerStorePicker({ store, stores, path }: { store: StoreRecord; stores: StoreRecord[]; path: string }) {
  return <div className="owner-store-context">{stores.length > 1 && <form action={path} className="editor-form store-picker"><label>Pilih toko<select name="toko" defaultValue={store.id}>{stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label><button className="button">Tampilkan</button></form>}<p><Link className="text-link" href={`/toko/${encodeURIComponent(store.slug)}`}>{store.name}</Link></p></div>;
}
