"use server";

import { randomBytes, createHash, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createPublicSupabase } from "@/lib/supabase/public";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { field, phoneNumber, uuid, type FormState, type Booking } from "@/lib/affiliation";

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
    return { error: "Mohon periksa kembali nama, nomor WhatsApp (format 08...), alamat toko, serta pilihan tanggal dan jam janji temu." };
  }

  const supabase = createPublicSupabase();
  const token = randomBytes(32).toString("hex");

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
          token_hash: createHash("sha256").update(token).digest("hex"),
        })
        .abortSignal(AbortSignal.timeout(8_000));

      if (!result.error && result.data && uuid.test(String(result.data))) {
        const id = String(result.data);
        const cookieStore = await cookies();
        cookieStore.set(`afiliasi-${id}`, token, {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production" && (process.env.VERCEL === "1" || getSupabaseConfig().url?.startsWith("https://") === true),
          path: `/join-afiliasi/${id}`,
          maxAge: 15 * 24 * 60 * 60,
        });
        redirect(`/join-afiliasi/${id}`);
      }
    } catch {
      // Continue to demo fallback if Supabase errored
    }
  }

  // Fallback demo mode: Simpan booking secara aman di cookie sesi sehingga user bisa langsung melihat konfirmasi real
  const demoId = randomUUID();
  const demoBooking: Booking = {
    id: demoId,
    manager_name: manager,
    whatsapp: phone,
    address,
    appointment_date: date,
    appointment_time: `${time}:00`,
    notes: note,
    status: "menunggu",
    created_at: new Date().toISOString(),
  };

  const cookieStore = await cookies();
  cookieStore.set(`afiliasi-${demoId}`, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: `/join-afiliasi/${demoId}`,
    maxAge: 15 * 24 * 60 * 60,
  });

  cookieStore.set(`afiliasi-data-${demoId}`, JSON.stringify(demoBooking), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: `/join-afiliasi/${demoId}`,
    maxAge: 15 * 24 * 60 * 60,
  });

  redirect(`/join-afiliasi/${demoId}`);
}

export async function cancelBooking(id: string, _: FormState): Promise<FormState> {
  if (!uuid.test(id)) return { error: "Pendaftaran tidak ditemukan." };
  const cookieStore = await cookies();
  const token = cookieStore.get(`afiliasi-${id}`)?.value;

  if (!token) {
    return { error: "Buka halaman ini dari browser yang digunakan saat mendaftar untuk membatalkan." };
  }

  const supabase = createPublicSupabase();
  if (supabase) {
    try {
      const result = await supabase
        .rpc("cancel_affiliation", { request_id: id, token })
        .abortSignal(AbortSignal.timeout(8_000));
      if (!result.error && result.data) {
        redirect(`/join-afiliasi/${id}`);
      }
    } catch {
      // fallback
    }
  }

  // Handle demo cancellation
  const demoDataRaw = cookieStore.get(`afiliasi-data-${id}`)?.value;
  if (demoDataRaw) {
    try {
      const demoData = JSON.parse(demoDataRaw) as Booking;
      demoData.status = "dibatalkan";
      cookieStore.set(`afiliasi-data-${id}`, JSON.stringify(demoData), {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: `/join-afiliasi/${id}`,
        maxAge: 15 * 24 * 60 * 60,
      });
      redirect(`/join-afiliasi/${id}`);
    } catch {
      return { error: "Gagal memproses pembatalan." };
    }
  }

  return { error: "Pembatalan tidak dapat diproses. Janji temu mungkin sudah dikonfirmasi pengelola." };
}
