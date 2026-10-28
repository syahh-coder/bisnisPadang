import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { createPublicSupabase } from "@/lib/supabase/public";
import { CancelBooking } from "@/components/affiliation-form";
import { dateLabel, uuid, type Booking } from "@/lib/affiliation";

export const metadata: Metadata = { title: "Janji temu afiliasi", robots: { index: false, follow: false }, referrer: "no-referrer" };
export const dynamic = "force-dynamic";

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!uuid.test(id)) notFound();
  const token = (await cookies()).get(`afiliasi-${id}`)?.value;
  if (!token) return <section className="page-view"><div className="page-heading"><h1>Janji temu afiliasi</h1></div><p>Buka tautan ini dari browser yang digunakan saat mendaftar untuk melihat atau membatalkan janji temu.</p></section>;
  const supabase = createPublicSupabase();
  const result = supabase ? await supabase.rpc("affiliation_receipt", { request_id: id, token }).abortSignal(AbortSignal.timeout(8_000)) : null;
  if (!result || result.error) return <p role="alert">Janji temu belum dapat dimuat. Coba muat ulang halaman ini.</p>;
  const booking = (result.data as Booking[])[0];
  if (!booking) notFound();
  return <section className="page-view"><div className="page-heading"><h1>Janji temu afiliasi</h1><p>Pendaftaran gratis. Simpan tautan halaman ini untuk melihat status janji temu Anda.</p></div><dl className="data-list">
    <dt>Status</dt><dd className="status-label">{booking.status}</dd><dt>Pengelola</dt><dd>{booking.manager_name}</dd><dt>WhatsApp</dt><dd>{booking.whatsapp}</dd><dt>Alamat toko</dt><dd>{booking.address}</dd><dt>Janji temu</dt><dd>{dateLabel(booking.appointment_date)}, {booking.appointment_time.slice(0, 5)} WIB</dd>{booking.notes && <><dt>Catatan</dt><dd>{booking.notes}</dd></>}
  </dl>{booking.status === "menunggu" && <CancelBooking id={id} />}</section>;
}
