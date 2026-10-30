"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminClient } from "@/lib/admin";
import { MAX_PHOTO_BYTES } from "@/lib/media";
import { field, phoneNumber, statuses, uuid, type FormState } from "@/lib/affiliation";
import { addDemoStore, addDemoProduct, updateDemoBookingStatus } from "@/lib/catalog/demo";

export async function saveStore(_: FormState, form: FormData): Promise<FormState> {
  const client = await adminClient();
  const id = field(form, "id");
  const requestId = field(form, "request_id");
  const owner = field(form, "owner_id");
  const name = field(form, "name");
  const manager = field(form, "manager_name");
  const slug = field(form, "slug");
  const phone = phoneNumber(field(form, "phone"));
  const address = field(form, "address");
  const delivery = field(form, "delivery_info");
  const category = field(form, "category_id");
  const latitude = field(form, "latitude");
  const longitude = field(form, "longitude");

  if (
    (id && !uuid.test(id)) ||
    (requestId && !uuid.test(requestId)) ||
    (owner && !uuid.test(owner)) ||
    !uuid.test(category) ||
    name.length < 1 ||
    name.length > 160 ||
    manager.length < 2 ||
    manager.length > 160 ||
    !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) ||
    slug.length > 160 ||
    !phone ||
    address.length < 5 ||
    address.length > 1000 ||
    delivery.length > 1000 ||
    (latitude !== "" && (!Number.isFinite(Number(latitude)) || Math.abs(Number(latitude)) > 90)) ||
    (longitude !== "" && (!Number.isFinite(Number(longitude)) || Math.abs(Number(longitude)) > 180)) ||
    Boolean(latitude) !== Boolean(longitude)
  ) {
    return { error: "Periksa data wajib, slug, nomor WA, dan koordinat. Isi kedua koordinat atau kosongkan keduanya." };
  }

  const storeId = id || randomUUID();

  if (!client) {
    addDemoStore({
      id: storeId,
      slug,
      name,
      manager_name: manager,
      category_name: "Makanan",
      category_slug: "makanan",
      category_id: category,
      address,
      delivery_info: delivery,
      photo_path: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
      phone: phone || "081234567890",
      latitude: latitude ? Number(latitude) : -6.2,
      longitude: longitude ? Number(longitude) : 106.8,
      rating: 5.0,
      reviews_count: 1,
      opening_hours: "09:00 - 21:00 WIB",
      products: [],
    });
    revalidatePath("/", "layout");
    redirect(`/portal/admin/kelola?toko=${storeId}&tersimpan=1`);
  }

  const result = await client.rpc("save_admin_store", {
    store_id: id || null,
    request_id: requestId || null,
    details: { name, slug, manager_name: manager, owner_id: owner || null, category_id: category, phone, address, delivery_info: delivery, latitude, longitude },
  });

  if (result.error) {
    return { error: result.error.code === "23505" ? "Slug sudah digunakan atau permohonan sudah terhubung ke toko lain." : "Toko belum tersimpan. Periksa data dan akun pemilik, lalu coba lagi." };
  }

  revalidatePath("/", "layout");
  redirect(`/portal/admin/kelola?toko=${result.data}&tersimpan=1`);
}

export async function changeBookingStatus(id: string, _: FormState, form: FormData): Promise<FormState> {
  const client = await adminClient();
  const status = field(form, "status");
  if (!uuid.test(id) || !statuses.includes(status as typeof statuses[number])) return { error: "Status tidak valid." };

  if (!client) {
    updateDemoBookingStatus(id, status);
    revalidatePath("/portal/admin/kelola");
    return { success: `Status berhasil diubah menjadi ${status} (Mode Demo).` };
  }

  const result = await client.from("affiliation_requests").update({ status }).eq("id", id).select("id");
  if (result.error || !result.data?.length) {
    return { error: result.error?.code === "23505" ? "Slot ini sudah dipesan toko lain. Status tidak diubah." : "Status belum tersimpan. Coba lagi." };
  }

  revalidatePath("/portal/admin/kelola");
  return { success: "Status tersimpan." };
}

export async function savePhoto(id: string, _: FormState, form: FormData): Promise<FormState> {
  const client = await adminClient();
  const file = form.get("photo");
  const extensions: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif", "image/gif": "gif" };
  if (!uuid.test(id) || !(file instanceof File) || !file.size || file.size > MAX_PHOTO_BYTES || !extensions[file.type]) {
    return { error: "Pilih JPG, PNG, WebP, AVIF, atau GIF, maksimal 4 MB." };
  }

  if (!client) {
    revalidatePath("/", "layout");
    return { success: "Foto toko tersimpan (Mode Demo)." };
  }

  const existing = await client.from("stores").select("id").eq("id", id).maybeSingle();
  if (existing.error || !existing.data) return { error: "Toko tidak ditemukan." };
  const path = `stores/${id}/${randomUUID()}.${extensions[file.type]}`;
  const uploaded = await client.storage.from("store-media").upload(path, file, { contentType: file.type, upsert: false });
  if (uploaded.error) return { error: "Foto belum terunggah. Periksa berkas dan coba lagi." };
  const updated = await client.from("stores").update({ photo_path: path }).eq("id", id).select("id");
  if (updated.error || !updated.data?.length) {
    await client.storage.from("store-media").remove([path]);
    return { error: "Foto belum tersimpan. Coba lagi." };
  }

  revalidatePath("/", "layout");
  return { success: "Foto toko tersimpan." };
}

export async function saveProduct(storeId: string, productId: string | null, _: FormState, form: FormData): Promise<FormState> {
  const client = await adminClient();
  const name = field(form, "name");
  const rawPrice = field(form, "price");
  const order = Number(field(form, "sort_order"));

  if (!uuid.test(storeId) || (productId && !uuid.test(productId)) || !name || name.length > 160 || !/^\d{1,12}(\.\d{1,2})?$/.test(rawPrice) || !Number.isSafeInteger(order) || Math.abs(order) > 2147483647) {
    return { error: "Periksa nama, harga (angka tanpa pemisah ribuan), dan urutan menu." };
  }

  if (!client) {
    addDemoProduct(storeId, { name, price: Number(rawPrice) });
    revalidatePath("/", "layout");
    return { success: "Menu tersimpan (Mode Demo)." };
  }

  const data = { name, price: Number(rawPrice), sort_order: order };
  const result = productId ? await client.from("products").update(data).eq("id", productId).eq("store_id", storeId).select("id") : await client.from("products").insert({ ...data, store_id: storeId }).select("id");
  if (result.error || !result.data?.length) return { error: "Menu belum tersimpan. Coba kembali." };
  revalidatePath("/", "layout");
  return { success: "Menu tersimpan." };
}
