"use server";

import { randomBytes, createHash } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createPublicSupabase } from "@/lib/supabase/public";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { field, phoneNumber, uuid, type FormState } from "@/lib/affiliation";

export async function submitBooking(_: FormState, form: FormData): Promise<FormState> {
  const manager = field(form, "manager");
  const phone = phoneNumber(field(form, "phone"));
  const address = field(form, "address");
  const date = field(form, "date");
  const time = field(form, "time");
  const note = field(form, "notes");
  if (manager.length < 2 || manager.length > 160 || !phone || address.length < 5 || address.length > 500 || note.length > 200 || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !["09:00", "11:00", "13:00", "15:00"].includes(time)) {
    return { error: "Periksa nama, nomor WA, alamat, tanggal, dan jam janji temu." };
  }
  const supabase = createPublicSupabase();
  if (!supabase) return { error: "Pendaftaran belum dapat dihubungi. Coba lagi nanti." };
  const token = randomBytes(32).toString("hex");
  const result = await supabase.rpc("submit_affiliation", { manager, phone, shop_address: address, booking_date: date, booking_time: time, note, token_hash: createHash("sha256").update(token).digest("hex") }).abortSignal(AbortSignal.timeout(8_000));
  if (result.error) return { error: result.error.code === "23505" ? "Slot baru saja diambil. Pilih jam atau tanggal lain, lalu kirim kembali." : "Janji temu belum tersimpan. Pilih tanggal besok sampai 14 hari ke depan, selain Minggu, lalu coba kembali." };
  const id = String(result.data);
  if (!uuid.test(id)) return { error: "Pendaftaran belum dapat dipastikan. Coba lagi nanti." };
  (await cookies()).set(`afiliasi-${id}`, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" && (process.env.VERCEL === "1" || getSupabaseConfig().url?.startsWith("https://") === true), path: `/join-afiliasi/${id}`, maxAge: 15 * 24 * 60 * 60 });
  redirect(`/join-afiliasi/${id}`);
}

export async function cancelBooking(id: string, _: FormState): Promise<FormState> {
  if (!uuid.test(id)) return { error: "Pendaftaran tidak ditemukan." };
  const token = (await cookies()).get(`afiliasi-${id}`)?.value;
  const supabase = createPublicSupabase();
  if (!token || !supabase) return { error: "Buka halaman ini dari browser yang digunakan saat mendaftar." };
  const result = await supabase.rpc("cancel_affiliation", { request_id: id, token }).abortSignal(AbortSignal.timeout(8_000));
  if (result.error || !result.data) return { error: "Pembatalan tidak tersedia. Janji temu mungkin sudah dikonfirmasi; hubungi admin melalui WA yang digunakan saat konfirmasi." };
  redirect(`/join-afiliasi/${id}`);
}
