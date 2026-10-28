"use server";
import { MAX_PHOTO_BYTES } from "@/lib/media";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { ownedStore } from "@/lib/portal/owner";
import { todayWib, validDate } from "@/lib/portal/format";
import { field, phoneNumber, uuid, type FormState } from "@/lib/affiliation";

const denied = { error: "Toko tidak tersedia untuk akun Anda. Muat ulang halaman dan coba lagi." };
function refresh() { revalidatePath("/", "layout"); }

export async function saveOwnedStore(id: string, _: FormState, form: FormData): Promise<FormState> {
  const context = await ownedStore(id);
  if (!context) return denied;
  const name = field(form, "name"), slug = field(form, "slug"), manager = field(form, "manager_name"), category = field(form, "category_id");
  const rawPhone = field(form, "phone"), phone = rawPhone ? phoneNumber(rawPhone) : "";
  const address = field(form, "address"), delivery = field(form, "delivery_info"), lat = field(form, "latitude"), lng = field(form, "longitude");
  if (!name || name.length > 160 || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || slug.length > 160 || manager.length > 160 || !uuid.test(category) || phone === null || !address || address.length > 1000 || delivery.length > 1000 || Boolean(lat) !== Boolean(lng) || (lat !== "" && (!Number.isFinite(Number(lat)) || Math.abs(Number(lat)) > 90)) || (lng !== "" && (!Number.isFinite(Number(lng)) || Math.abs(Number(lng)) > 180))) return { error: "Periksa nama, slug, kategori, nomor WA, alamat, dan koordinat toko." };
  // Role, owner_id, ID toko, dan metadata dibuat server; bukan input bisnis.
  const result = await context.client.from("stores").update({ name, slug, manager_name: manager, category_id: category, phone, address, delivery_info: delivery, latitude: lat === "" ? null : Number(lat), longitude: lng === "" ? null : Number(lng) }).eq("id", id).eq("owner_id", context.account.id).select("id");
  if (result.error || !result.data?.length) return { error: result.error?.code === "23505" ? "Slug sudah digunakan toko lain. Pilih slug berbeda." : "Data toko belum tersimpan. Coba kembali." };
  refresh();
  return { success: "Data toko tersimpan." };
}

export async function saveOwnedProduct(storeId: string, productId: string | null, _: FormState, form: FormData): Promise<FormState> {
  const context = await ownedStore(storeId);
  if (!context) return denied;
  const name = field(form, "name"), price = field(form, "price"), order = field(form, "sort_order");
  if ((productId && !uuid.test(productId)) || !name || name.length > 160 || !/^\d{1,12}(\.\d{1,2})?$/.test(price) || !/^-?\d{1,10}$/.test(order) || Math.abs(Number(order)) > 2147483647) return { error: "Periksa nama, harga tanpa pemisah ribuan, dan urutan menu." };
  const data = { name, price: Number(price), sort_order: Number(order) };
  const result = productId ? await context.client.from("products").update(data).eq("id", productId).eq("store_id", storeId).select("id") : await context.client.from("products").insert({ ...data, store_id: storeId }).select("id");
  if (result.error || !result.data?.length) return { error: "Menu belum tersimpan. Muat ulang dan coba lagi." };
  refresh();
  return { success: "Menu tersimpan." };
}

export async function deleteOwnedProduct(storeId: string, productId: string, _: FormState): Promise<FormState> {
  const context = await ownedStore(storeId);
  if (!context || !uuid.test(productId)) return denied;
  const result = await context.client.from("products").delete().eq("id", productId).eq("store_id", storeId).select("id");
  if (result.error || !result.data?.length) return { error: "Menu belum dihapus. Muat ulang dan coba lagi." };
  refresh();
  return { success: "Menu dihapus." };
}

export async function saveOwnedPhoto(storeId: string, productId: string | null, _: FormState, form: FormData): Promise<FormState> {
  const context = await ownedStore(storeId);
  if (!context) return denied;
  if (productId) {
    if (!uuid.test(productId)) return denied;
    const product = await context.client.from("products").select("id").eq("id", productId).eq("store_id", storeId).maybeSingle();
    if (product.error || !product.data) return { error: "Menu tidak ditemukan." };
  }
  const file = form.get("photo");
  const extensions: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif", "image/gif": "gif" };
  if (!(file instanceof File) || !file.size || file.size > MAX_PHOTO_BYTES || !extensions[file.type]) return { error: "Pilih foto JPG, PNG, WebP, AVIF, atau GIF, maksimal 4 MB." };
  const path = `stores/${storeId}/${randomUUID()}.${extensions[file.type]}`;
  const uploaded = await context.client.storage.from("store-media").upload(path, file, { contentType: file.type, upsert: false });
  if (uploaded.error) return { error: "Foto belum terunggah. Periksa berkas lalu coba lagi." };
  const updated = productId ? await context.client.from("products").update({ photo_path: path }).eq("id", productId).eq("store_id", storeId).select("id") : await context.client.from("stores").update({ photo_path: path }).eq("id", storeId).eq("owner_id", context.account.id).select("id");
  if (updated.error || !updated.data?.length) { await context.client.storage.from("store-media").remove([path]); return { error: "Foto belum tersimpan. Coba kembali." }; }
  refresh();
  return { success: "Foto tersimpan." };
}

export async function removeOwnedPhoto(storeId: string, productId: string | null, _: FormState): Promise<FormState> {
  const context = await ownedStore(storeId);
  if (!context || (productId && !uuid.test(productId))) return denied;
  const result = productId ? await context.client.from("products").update({ photo_path: null }).eq("id", productId).eq("store_id", storeId).select("id") : await context.client.from("stores").update({ photo_path: null }).eq("id", storeId).eq("owner_id", context.account.id).select("id");
  if (result.error || !result.data?.length) return { error: "Foto belum dilepas. Coba lagi." };
  refresh();
  return { success: "Foto dilepas dari halaman toko." };
}

export async function saveDailySales(storeId: string, date: string, _: FormState, form: FormData): Promise<FormState> {
  const context = await ownedStore(storeId);
  if (!context) return denied;
  const revenue = field(form, "revenue"), count = field(form, "sales_count");
  if (!validDate(date) || date > todayWib() || !/^\d{1,12}(\.\d{1,2})?$/.test(revenue) || !/^\d{1,10}$/.test(count) || Number(count) > 2147483647) return { error: "Isi omset dan jumlah penjualan dengan angka nol atau lebih. Tanggal maksimal hari ini (WIB)." };
  const result = await context.client.rpc("save_daily_sales", { shop_id: storeId, sales_date: date, total_revenue: Number(revenue), total_sales: Number(count) });
  if (result.error || !result.data) return { error: "Catatan belum tersimpan. Coba lagi." };
  refresh();
  return { success: "Omset dan penjualan tersimpan." };
}

export async function deleteDailySales(storeId: string, date: string, _: FormState): Promise<FormState> {
  const context = await ownedStore(storeId);
  if (!context || !validDate(date)) return denied;
  const result = await context.client.from("daily_sales").delete().eq("store_id", storeId).eq("date", date).select("id");
  if (result.error || !result.data?.length) return { error: "Catatan belum dihapus. Muat ulang dan coba lagi." };
  refresh();
  return { success: "Catatan dihapus." };
}
