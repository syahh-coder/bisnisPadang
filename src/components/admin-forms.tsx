"use client";

import { useActionState, useState, type ChangeEvent } from "react";
import { saveStore, changeBookingStatus, savePhoto, saveProduct } from "@/app/portal/admin/actions";
import { statuses, type Booking } from "@/lib/affiliation";
import type { StoreRecord, Choice } from "@/lib/admin";
import { PhotoInput } from "@/components/photo-input";

function Feedback({ error, success }: { error?: string; success?: string }) { return <>{error && <p role="alert">{error}</p>}{success && <p role="status">{success}</p>}</>; }

export function StoreForm({ store, request, categories, owners }: { store?: StoreRecord; request?: Booking; categories: Choice[]; owners: Choice[] }) {
  const [state, action, pending] = useActionState(saveStore, {});
  const [fields, setFields] = useState({ name: store?.name ?? "", slug: store?.slug ?? "", manager_name: store?.manager_name || request?.manager_name || owners.find((owner) => owner.id === store?.owner_id)?.name || "", owner_id: store?.owner_id ?? "", category_id: store?.category_id ?? "", phone: store?.phone || request?.whatsapp || "", address: store?.address || request?.address || "", delivery_info: store?.delivery_info ?? "", latitude: String(store?.latitude ?? ""), longitude: String(store?.longitude ?? "") });
  const bind = (name: keyof typeof fields) => ({ value: fields[name], onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setFields((old) => ({ ...old, [name]: event.target.value })) });
  return <form action={action} className="editor-form" aria-label={store ? "Edit toko" : "Tambah toko"}>
    <input type="hidden" name="id" value={store?.id ?? ""} /><input type="hidden" name="request_id" value={request?.id ?? ""} />
    <label>Nama toko<input name="name" required maxLength={160} {...bind("name")} /></label>
    <label>Slug halaman toko<input name="slug" required maxLength={160} pattern="[a-z0-9]+(-[a-z0-9]+)*" {...bind("slug")} placeholder="contoh-toko" /><span className="form-hint">Huruf kecil, angka, dan tanda hubung. Alamat: /toko/slug-toko.</span></label>
    <label>Nama pengelola<input name="manager_name" required minLength={2} maxLength={160} {...bind("manager_name")} /></label>
    <label>Akun pemilik<select name="owner_id" {...bind("owner_id")}><option value="">Belum ditautkan</option>{owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.name || owner.id}</option>)}</select><span className="form-hint">Tautkan akun toko agar pemilik dapat mengelola data sendiri.</span></label>
    <label>Kategori<select name="category_id" {...bind("category_id")} required><option value="">Pilih kategori</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
    <label>Nomor WhatsApp<input name="phone" type="tel" required maxLength={24} {...bind("phone")} /></label>
    <label>Alamat toko<textarea name="address" rows={3} required minLength={5} maxLength={1000} {...bind("address")} /></label>
    <label>Info delivery<textarea name="delivery_info" rows={2} maxLength={1000} {...bind("delivery_info")} /></label>
    <fieldset><legend>Lokasi peta (opsional)</legend><p className="form-hint">Isi kedua koordinat untuk lokasi tepat. Jika kosong, peta menggunakan alamat toko.</p><div className="form-pair"><label>Lintang<input name="latitude" type="number" step="any" min={-90} max={90} {...bind("latitude")} /></label><label>Bujur<input name="longitude" type="number" step="any" min={-180} max={180} {...bind("longitude")} /></label></div></fieldset>
    <Feedback {...state} /><button className="button button--primary" disabled={pending}>{pending ? "Menyimpan…" : "Simpan toko"}</button>
  </form>;
}

export function BookingStatusForm({ booking }: { booking: Booking }) {
  const [state, action, pending] = useActionState(changeBookingStatus.bind(null, booking.id), {});
  return <form action={action} className="editor-form status-form" aria-label={`Status ${booking.manager_name}`}><label>Status<select name="status" defaultValue={booking.status}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label><Feedback {...state} /><button className="button" disabled={pending}>{pending ? "Menyimpan…" : "Simpan status"}</button></form>;
}

export function PhotoForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState(savePhoto.bind(null, id), {});
  return <form action={action} className="editor-form" aria-label="Foto toko"><label>Foto toko<PhotoInput /><span className="form-hint">Maksimal 4 MB. JPG, PNG, WebP, AVIF, atau GIF.</span></label><Feedback {...state} /><button className="button" disabled={pending}>{pending ? "Mengunggah…" : "Simpan foto"}</button></form>;
}

export type ProductRecord = { id: string; name: string; price: number; sort_order: number };
export function ProductForm({ storeId, product }: { storeId: string; product?: ProductRecord }) {
  const [state, action, pending] = useActionState(saveProduct.bind(null, storeId, product?.id ?? null), {});
  return <form action={action} className="editor-form product-editor" aria-label={product ? `Edit menu ${product.name}` : "Tambah menu"}><label>Nama menu<input name="name" required maxLength={160} defaultValue={product?.name} /></label><div className="form-pair"><label>Harga (Rp)<input name="price" type="number" min={0} max={999999999999.99} step="0.01" required defaultValue={product?.price} /></label><label>Urutan<input name="sort_order" type="number" min={-2147483647} max={2147483647} required defaultValue={product?.sort_order ?? 0} /></label></div><Feedback {...state} /><button className="button" disabled={pending}>{pending ? "Menyimpan…" : product ? "Simpan menu" : "Tambah menu"}</button></form>;
}
