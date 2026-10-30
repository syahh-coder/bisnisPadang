"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { adminClient } from "@/lib/admin";
import { field, uuid, type FormState } from "@/lib/affiliation";
import { parseWib } from "@/lib/qr/format";
import { siteOrigin } from "@/lib/qr/server";

export async function createQR(_: FormState, form: FormData): Promise<FormState> {
  const client = await adminClient();
  const store = field(form, "store_id"), kind = field(form, "kind");
  const expires = kind === "dynamic" ? parseWib(field(form, "expires_at")) : null;
  if (!uuid.test(store) || !["static", "dynamic"].includes(kind) || (kind === "dynamic" && (!expires || Date.parse(expires) <= Date.now() || Date.parse(expires) > Date.now() + 15 * 86400000))) {
    return { error: "Pilih toko dan jenis QR. Masa berlaku dinamis harus setelah sekarang, maksimal 15 hari." };
  }
  const origin = (await siteOrigin()) || "http://localhost:3000";

  if (!client) {
    revalidatePath("/portal/admin/qr");
    redirect(`/portal/admin/qr?qr=00000000-0000-4000-8000-000000000101`);
  }

  const result = await client.from("qr_codes").insert({ store_id: store, kind, site_origin: origin, expires_at: expires }).select("id").single();
  if (result.error) return { error: "QR belum tersimpan. Periksa toko dan masa berlaku, lalu coba kembali." };
  revalidatePath("/portal/admin/qr");
  redirect(`/portal/admin/qr?qr=${result.data.id}`);
}

export async function updateQRExpiry(id: string, _: FormState, form: FormData): Promise<FormState> {
  const client = await adminClient();
  const expires = parseWib(field(form, "expires_at"));
  if (!uuid.test(id) || !expires || Date.parse(expires) <= Date.now()) return { error: "Pilih tanggal dan jam berakhir setelah sekarang (WIB)." };

  if (!client) {
    revalidatePath("/portal/admin/qr");
    return { success: "Masa berlaku tersimpan (Mode Demo)." };
  }

  const result = await client.from("qr_codes").update({ expires_at: expires }).eq("id", id).eq("kind", "dynamic").select("id");
  if (result.error || !result.data?.length) return { error: "Masa berlaku belum berubah. Batasnya tetap 15 hari sejak QR dibuat." };
  revalidatePath("/portal/admin/qr");
  return { success: "Masa berlaku tersimpan." };
}
