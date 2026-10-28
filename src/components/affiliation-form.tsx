"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { submitBooking, cancelBooking } from "@/app/join-afiliasi/actions";
import { dateLabel, type Slot, type FormState } from "@/lib/affiliation";

export function AffiliationForm({ slots }: { slots: Slot[] }) {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [fields, setFields] = useState({ manager: "", phone: "", address: "", notes: "" });
  const change = (name: keyof typeof fields, value: string) => setFields((old) => ({ ...old, [name]: value }));
  const [state, action, pending] = useActionState<FormState, FormData>(submitBooking, {});
  const dates = [...new Set(slots.map((slot) => slot.appointment_date))];
  const times = slots.filter((slot) => slot.appointment_date === date);
  return <form action={action} className="editor-form" aria-label="Join Afiliasi">
    <label>Nama pengelola<input name="manager" required minLength={2} maxLength={160} autoComplete="name" value={fields.manager} onChange={(e) => change("manager", e.target.value)} /></label>
    <label>Nomor WhatsApp<input name="phone" type="tel" required maxLength={24} autoComplete="tel" placeholder="08xxxxxxxxxx" value={fields.phone} onChange={(e) => change("phone", e.target.value)} /></label>
    <label>Alamat toko<textarea name="address" required minLength={5} maxLength={500} autoComplete="street-address" rows={3} value={fields.address} onChange={(e) => change("address", e.target.value)} /></label>
    <label>Tanggal janji temu<select name="date" required value={date} onChange={(e) => setDate(e.target.value)}><option value="">Pilih tanggal</option>{dates.map((value) => <option key={value} value={value}>{dateLabel(value)}</option>)}</select></label>
    <label>Jam janji temu (WIB)<select name="time" key={date} required disabled={!date} defaultValue=""><option value="">Pilih jam</option>{times.map((slot) => <option key={slot.appointment_time} value={slot.appointment_time.slice(0, 5)}>{slot.appointment_time.slice(0, 5)}</option>)}</select></label>
    <p className="form-hint">Mulai besok hingga 14 hari ke depan. Minggu libur. Hanya slot kosong yang ditampilkan.</p>
    <label>Catatan <span className="muted">(opsional, maksimal 200 karakter)</span><textarea name="notes" maxLength={200} rows={3} value={fields.notes} onChange={(e) => change("notes", e.target.value)} /></label>
    {state.error && <div role="alert"><p>{state.error}</p><button type="button" className="text-link" onClick={() => { router.refresh(); setDate(""); }}>Perbarui slot kosong</button></div>}
    <p className="form-hint">Pembatalan sebelum dikonfirmasi tersedia lewat halaman konfirmasi di browser ini. Simpan tautan halaman setelah mendaftar.</p>
    <button className="button button--primary" disabled={pending || dates.length === 0}>{pending ? "Menyimpan…" : "Daftar gratis"}</button>
  </form>;
}

export function CancelBooking({ id }: { id: string }) {
  const [state, action, pending] = useActionState(cancelBooking.bind(null, id), {});
  return <form action={action} className="editor-form"><p>Pembatalan tersedia selama status masih menunggu.</p>{state.error && <p role="alert">{state.error}</p>}<button className="button" disabled={pending}>{pending ? "Membatalkan…" : "Batalkan janji temu"}</button></form>;
}
