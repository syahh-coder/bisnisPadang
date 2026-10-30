"use server";

import { randomBytes, createHash, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createPublicSupabase } from "@/lib/supabase/public";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { field, phoneNumber, uuid, type FormState, type Booking } from "@/lib/affiliation";
import { addDemoBooking, updateDemoBookingStatus } from "@/lib/catalog/demo";

export async function submitBooking(_: FormState, form: FormData): Promise<FormState> {
  const manager = field(form, "manager");
  const phone = phoneNumber(field(form, "phone"));
  const address = field(form, "address");
  const date = field(form, "date");
  const time = field(form, "time");
  const note = field(form, "notes");

  if (
    manager.length < 2 ||
    manager.length > 160 ||
    !phone ||
    address.length < 5 ||
    address.length > 500 ||
    note.length > 200 ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !["09:00", "11:00", "13:00", "15:00"].includes(time)
  ) {
    return { error: "Periksa nama, nomor WA, alamat, tanggal, dan jam janji temu." };
  }

  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const supabase = createPublicSupabase();

  if (supabase) {
    try {
      const result = await supabase
        .rpc("submit_affiliation", {
          manager,
          phone,
          shop_address: address,
          booking_date: date,
          booking_time: time,
          note,
          token_hash: tokenHash,
        })
        .abortSignal(AbortSignal.timeout(8_000));

      if (!result.error && result.data && uuid.test(String(result.data))) {
        const id = String(result.data);
        (await cookies()).set(`afiliasi-${id}`, token, {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production" && (process.env.VERCEL === "1" || getSupabaseConfig().url?.startsWith("https://") === true),
          path: `/join-afiliasi/${id}`,
          maxAge: 15 * 24 * 60 * 60,
        });
        redirect(`/join-afiliasi/${id}`);
      }
    } catch {
      // Fallback to standalone local booking
    }
  }

  // Standalone / Offline fallback
  const fallbackId = randomUUID();
  const demoBooking: Booking = {
    id: fallbackId,
    manager_name: manager,
    whatsapp: phone,
    address,
    appointment_date: date,
    appointment_time: time,
    notes: note,
    status: "menunggu",
    store_id: null,
  };

  addDemoBooking(demoBooking);

  const cookieStore = await cookies();
  cookieStore.set(`afiliasi-${fallbackId}`, token, {
    httpOnly: true,
    sameSite: "lax",
    path: `/join-afiliasi/${fallbackId}`,
    maxAge: 15 * 24 * 60 * 60,
  });
  cookieStore.set(`afiliasi-data-${fallbackId}`, JSON.stringify(demoBooking), {
    httpOnly: true,
    sameSite: "lax",
    path: `/join-afiliasi/${fallbackId}`,
    maxAge: 15 * 24 * 60 * 60,
  });

  redirect(`/join-afiliasi/${fallbackId}`);
}

export async function cancelBooking(id: string, _: FormState): Promise<FormState> {
  if (!uuid.test(id)) return { error: "Pendaftaran tidak ditemukan." };
  const cookieStore = await cookies();
  const token = cookieStore.get(`afiliasi-${id}`)?.value;
  if (!token) return { error: "Buka halaman ini dari browser yang digunakan saat mendaftar." };

  const supabase = createPublicSupabase();
  if (supabase) {
    try {
      const result = await supabase.rpc("cancel_affiliation", { request_id: id, token }).abortSignal(AbortSignal.timeout(8_000));
      if (!result.error && result.data) {
        redirect(`/join-afiliasi/${id}`);
      }
    } catch {
      // Fallback
    }
  }

  // Standalone fallback
  updateDemoBookingStatus(id, "dibatalkan");
  const rawDemo = cookieStore.get(`afiliasi-data-${id}`)?.value;
  if (rawDemo) {
    try {
      const parsed = JSON.parse(rawDemo) as Booking;
      parsed.status = "dibatalkan";
      cookieStore.set(`afiliasi-data-${id}`, JSON.stringify(parsed), {
        httpOnly: true,
        sameSite: "lax",
        path: `/join-afiliasi/${id}`,
        maxAge: 15 * 24 * 60 * 60,
      });
    } catch {
      // ignore
    }
  }

  redirect(`/join-afiliasi/${id}`);
}
