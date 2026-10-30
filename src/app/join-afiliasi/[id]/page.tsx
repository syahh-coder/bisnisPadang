import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createPublicSupabase } from "@/lib/supabase/public";
import { CancelBooking } from "@/components/affiliation-form";
import { dateLabel, uuid, type Booking } from "@/lib/affiliation";
import { Icon } from "@/components/icon";

export const metadata: Metadata = {
  title: "Status Janji Temu Afiliasi — Toko Lokal",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!uuid.test(id)) notFound();

  const cookieStore = await cookies();
  const token = cookieStore.get(`afiliasi-${id}`)?.value;

  if (!token) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4">
          <Icon name="alertCircle" size={28} />
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Akses Terbatas</h1>
        <p className="text-slate-600 text-sm mb-6">
          Buka tautan ini dari browser perangkat yang digunakan saat mendaftar untuk melihat atau membatalkan janji temu Anda.
        </p>
        <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-700 text-white font-medium hover:bg-teal-800 transition-colors">
          <Icon name="home" size={18} /> Kembali ke Beranda
        </Link>
      </div>
    );
  }

  let booking: Booking | null = null;
  const supabase = createPublicSupabase();

  if (supabase) {
    try {
      const result = await supabase
        .rpc("affiliation_receipt", { request_id: id, token })
        .abortSignal(AbortSignal.timeout(8_000));
      if (!result.error && result.data && (result.data as Booking[]).length > 0) {
        booking = (result.data as Booking[])[0];
      }
    } catch {
      // Fallback
    }
  }

  // Fallback to demo booking stored in cookie
  if (!booking) {
    const rawDemo = cookieStore.get(`afiliasi-data-${id}`)?.value;
    if (rawDemo) {
      try {
        booking = JSON.parse(rawDemo) as Booking;
      } catch {
        // failed parse
      }
    }
  }

  if (!booking) notFound();

  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    menunggu: { bg: "bg-amber-100 border-amber-200", text: "text-amber-800", label: "Menunggu Konfirmasi" },
    dikonfirmasi: { bg: "bg-emerald-100 border-emerald-200", text: "text-emerald-800", label: "Telah Dikonfirmasi" },
    selesai: { bg: "bg-teal-100 border-teal-200", text: "text-teal-800", label: "Selesai" },
    dibatalkan: { bg: "bg-rose-100 border-rose-200", text: "text-rose-800", label: "Dibatalkan" },
  };

  const statusInfo = statusColors[booking.status] ?? statusColors.menunggu;

  return (
    <div className="max-w-2xl mx-auto py-6 sm:py-10 px-4">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-teal-700 transition-colors mb-6">
        <Icon name="back" size={16} /> Kembali ke Beranda
      </Link>

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Janji Temu Afiliasi</h1>
            <p className="text-slate-500 text-sm mt-1">ID Pendaftaran: <span className="font-mono text-xs">{id.slice(0, 8)}...</span></p>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border ${statusInfo.bg} ${statusInfo.text}`}>
            <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
            {statusInfo.label}
          </span>
        </div>

        <div className="py-6 grid gap-4 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 py-2 border-b border-slate-100">
            <span className="text-slate-500 font-medium">Pengelola Toko</span>
            <span className="sm:col-span-2 font-semibold text-slate-900">{booking.manager_name}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 py-2 border-b border-slate-100">
            <span className="text-slate-500 font-medium">WhatsApp</span>
            <span className="sm:col-span-2 font-mono font-medium text-slate-900">+{booking.whatsapp}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 py-2 border-b border-slate-100">
            <span className="text-slate-500 font-medium">Alamat Toko</span>
            <span className="sm:col-span-2 text-slate-800">{booking.address}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 py-2 border-b border-slate-100">
            <span className="text-slate-500 font-medium">Jadwal Janji Temu</span>
            <span className="sm:col-span-2 font-semibold text-teal-800">
              {dateLabel(booking.appointment_date)} pukul {booking.appointment_time.slice(0, 5)} WIB
            </span>
          </div>

          {booking.notes && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 py-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Catatan</span>
              <span className="sm:col-span-2 text-slate-700 italic">“{booking.notes}”</span>
            </div>
          )}
        </div>

        <div className="bg-slate-50 rounded-xl p-4 mt-2 text-xs text-slate-600 leading-relaxed flex items-start gap-2.5">
          <Icon name="info" size={18} className="text-teal-700 shrink-0 mt-0.5" />
          <p>
            Tim Toko Lokal akan menghubungi nomor WhatsApp Anda untuk konfirmasi pertemuan dan verifikasi data toko. Simpan halaman ini sebagai bukti registrasi.
          </p>
        </div>

        {booking.status === "menunggu" && (
          <div className="mt-6 pt-6 border-t border-slate-100">
            <CancelBooking id={id} />
          </div>
        )}
      </div>
    </div>
  );
}
