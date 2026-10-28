"use client";
import { useActionState, useState, type ChangeEvent, type FormEvent } from "react";
import { saveOwnedStore, saveOwnedProduct, deleteOwnedProduct, saveOwnedPhoto, removeOwnedPhoto, saveDailySales, deleteDailySales } from "@/app/portal/toko/actions";
import type { StoreRecord, Choice } from "@/lib/admin";
import type { DailySale } from "@/lib/portal/format";
import { PhotoInput } from "@/components/photo-input";

function Feedback({ error, success }: { error?: string; success?: string }) { return <>{error && <p role="alert">{error}</p>}{success && <p role="status">{success}</p>}</>; }
function confirmDelete(event: FormEvent<HTMLFormElement>, text: string) { if (!window.confirm(text)) event.preventDefault(); }

export function OwnerInfoForm({ store, categories }: { store: StoreRecord; categories: Choice[] }) {
  const [state, action, pending] = useActionState(saveOwnedStore.bind(null, store.id), {});
  const [fields, setFields] = useState({ name: store.name, slug: store.slug, manager_name: store.manager_name, category_id: store.category_id, phone: store.phone, address: store.address, delivery_info: store.delivery_info, latitude: String(store.latitude ?? ""), longitude: String(store.longitude ?? "") });
  const bind = (name: keyof typeof fields) => ({ value: fields[name], onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setFields((old) => ({ ...old, [name]: event.target.value })) });
  return <form action={action} className="editor-form" aria-label="Edit info toko">
    <label>Nama toko<input name="name" required maxLength={160} {...bind("name")} /></label>
    <label>Slug halaman toko<input name="slug" required maxLength={160} pattern="[a-z0-9]+(-[a-z0-9]+)*" {...bind("slug")} /><span className="form-hint">Huruf kecil, angka, dan tanda hubung. Mengubah slug juga mengubah alamat halaman toko.</span></label>
    <label>Nama pengelola<input name="manager_name" maxLength={160} {...bind("manager_name")} /></label>
    <label>Kategori<select name="category_id" required {...bind("category_id")}>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
    <label>Nomor WhatsApp <span className="muted">(opsional)</span><input name="phone" type="tel" maxLength={24} {...bind("phone")} /></label>
    <label>Alamat toko<textarea name="address" required maxLength={1000} rows={3} {...bind("address")} /></label>
    <label>Info delivery<textarea name="delivery_info" maxLength={1000} rows={2} {...bind("delivery_info")} /></label>
    <fieldset><legend>Lokasi peta (opsional)</legend><p className="form-hint">Isi kedua koordinat untuk lokasi tepat. Jika kosong, peta memakai alamat toko.</p><div className="form-pair"><label>Lintang<input name="latitude" type="number" step="any" min={-90} max={90} {...bind("latitude")} /></label><label>Bujur<input name="longitude" type="number" step="any" min={-180} max={180} {...bind("longitude")} /></label></div></fieldset>
    <Feedback {...state} /><button className="button button--primary" disabled={pending}>{pending ? "Menyimpan…" : "Simpan info toko"}</button>
  </form>;
}

export function OwnerPhotoForm({ storeId, productId = null, hasPhoto }: { storeId: string; productId?: string | null; hasPhoto: boolean }) {
  const [state, action, pending] = useActionState(saveOwnedPhoto.bind(null, storeId, productId), {});
  const [removed, remove, removing] = useActionState(removeOwnedPhoto.bind(null, storeId, productId), {});
  return <div><form action={action} className="editor-form" aria-label={productId ? "Foto menu" : "Foto toko"}><label>{productId ? "Foto menu" : "Foto toko"}<PhotoInput /><span className="form-hint">JPG, PNG, WebP, AVIF, atau GIF. Maksimal 4 MB.</span></label><Feedback {...state} /><button className="button" disabled={pending}>{pending ? "Mengunggah…" : "Simpan foto"}</button></form>{hasPhoto && <form action={remove} className="editor-form"><Feedback {...removed} /><button className="text-link" disabled={removing}>{removing ? "Melepas…" : "Hapus foto"}</button></form>}</div>;
}

export type OwnerProduct = { id: string; name: string; price: number; sort_order: number; photo_path: string | null };
export function OwnerProductForm({ storeId, product }: { storeId: string; product?: OwnerProduct }) {
  const [state, action, pending] = useActionState(saveOwnedProduct.bind(null, storeId, product?.id ?? null), {});
  const [fields, setFields] = useState({ name: product?.name ?? "", price: String(product?.price ?? ""), sort_order: String(product?.sort_order ?? 0) });
  const bind = (name: keyof typeof fields) => ({ value: fields[name], onChange: (event: ChangeEvent<HTMLInputElement>) => setFields((old) => ({ ...old, [name]: event.target.value })) });
  return <form action={action} className="editor-form" aria-label={product ? `Edit menu ${product.name}` : "Tambah menu"}><label>Nama menu<input name="name" required maxLength={160} {...bind("name")} /></label><div className="form-pair"><label>Harga (Rp)<input name="price" type="number" step="0.01" min={0} max={999999999999.99} required {...bind("price")} /></label><label>Urutan<input name="sort_order" type="number" required min={-2147483647} max={2147483647} {...bind("sort_order")} /></label></div><Feedback {...state} /><button className="button" disabled={pending}>{pending ? "Menyimpan…" : product ? "Simpan menu" : "Tambah menu"}</button></form>;
}
export function DeleteProductForm({ storeId, productId }: { storeId: string; productId: string }) {
  const [state, action, pending] = useActionState(deleteOwnedProduct.bind(null, storeId, productId), {});
  return <form action={action} className="editor-form" onSubmit={(e) => confirmDelete(e, "Hapus menu ini dari toko?")}><Feedback {...state} /><button className="text-link" disabled={pending}>{pending ? "Menghapus…" : "Hapus menu"}</button></form>;
}

export function DailySalesForm({ storeId, date, entry }: { storeId: string; date: string; entry?: DailySale }) {
  const [state, action, pending] = useActionState(saveDailySales.bind(null, storeId, date), {});
  const [revenue, setRevenue] = useState(String(entry?.revenue ?? ""));
  const [count, setCount] = useState(String(entry?.sales_count ?? ""));
  return <form action={action} className="editor-form" aria-label="Catatan omset dan penjualan"><label>Omset (Rp)<input name="revenue" type="number" step="0.01" min={0} max={999999999999.99} required value={revenue} onChange={(e) => setRevenue(e.target.value)} /></label><label>Jumlah penjualan<input name="sales_count" type="number" step={1} min={0} max={2147483647} required value={count} onChange={(e) => setCount(e.target.value)} /><span className="form-hint">Isi jumlah transaksi penjualan. Masukkan 0 bila tidak ada penjualan.</span></label><Feedback {...state} /><button className="button button--primary" disabled={pending}>{pending ? "Menyimpan…" : "Simpan catatan"}</button></form>;
}
export function DeleteSalesForm({ storeId, date }: { storeId: string; date: string }) {
  const [state, action, pending] = useActionState(deleteDailySales.bind(null, storeId, date), {});
  return <form action={action} className="editor-form" onSubmit={(e) => confirmDelete(e, "Hapus catatan omset dan penjualan pada tanggal ini?")}><Feedback {...state} /><button className="text-link" disabled={pending}>{pending ? "Menghapus…" : "Hapus catatan"}</button></form>;
}
