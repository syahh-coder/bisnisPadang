"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { submitBooking, cancelBooking } from "@/app/join-afiliasi/actions";
import { dateLabel, type Slot, type FormState } from "@/lib/affiliation";
import { Icon } from "@/components/icon";

export function AffiliationForm({ slots }: { slots: Slot[] }) {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [fields, setFields] = useState({ manager: "", phone: "", address: "", notes: "" });
  const change = (name: keyof typeof fields, value: string) => setFields((old) => ({ ...old, [name]: value }));
  const [state, action, pending] = useActionState<FormState, FormData>(submitBooking, {});

  const dates = [...new Set(slots.map((slot) => slot.appointment_date))];
  const times = slots.filter((slot) => slot.appointment_date === date);

  return (
    <form action={action} className="space-y-5" aria-label="Formulir Join Afiliasi">
      {state.error && (
        <div role="alert" className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-2.5">
          <Icon name="alertCircle" size={18} className="shrink-0 mt-0.5 text-rose-600" />
          <div className="flex-1">
            <p className="font-semibold">{state.error}</p>
            <button
              type="button"
              className="text-xs text-rose-700 underline font-medium mt-1 hover:text-rose-900"
              onClick={() => {
                router.refresh();
                setDate("");
              }}
            >
              Perbarui jadwal tersedia
            </button>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-slate-800 mb-1.5" htmlFor="manager">
          Nama Pengelola / Pemilik <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <input
            id="manager"
            name="manager"
            required
            minLength={2}
            maxLength={160}
            autoComplete="name"
            placeholder="Contoh: Ibu Ani / Rahmat Syah"
            value={fields.manager}
            onChange={(e) => change("manager", e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-800 mb-1.5" htmlFor="phone">
          Nomor WhatsApp Aktif <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            maxLength={24}
            autoComplete="tel"
            placeholder="081234567890"
            value={fields.phone}
            onChange={(e) => change("phone", e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 text-sm"
          />
        </div>
        <p className="text-xs text-slate-500 mt-1">Digunakan tim untuk konfirmasi jadwal via WhatsApp.</p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-800 mb-1.5" htmlFor="address">
          Alamat Lengkap Toko / Usaha <span className="text-rose-500">*</span>
        </label>
        <textarea
          id="address"
          name="address"
          required
          minLength={5}
          maxLength={500}
          autoComplete="street-address"
          rows={3}
          placeholder="Jl. Nama Jalan No. XX, Kelurahan, Kecamatan, Kota..."
          value={fields.address}
          onChange={(e) => change("address", e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 text-sm resize-y"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-800 mb-1.5" htmlFor="date">
            Pilih Tanggal Janji Temu <span className="text-rose-500">*</span>
          </label>
          <select
            id="date"
            name="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 text-sm"
          >
            <option value="">Pilih hari & tanggal</option>
            {dates.map((value) => (
              <option key={value} value={value}>
                {dateLabel(value)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-800 mb-1.5" htmlFor="time">
            Pilih Jam Pertemuan (WIB) <span className="text-rose-500">*</span>
          </label>
          <select
            id="time"
            name="time"
            key={date}
            required
            disabled={!date}
            defaultValue=""
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 disabled:bg-slate-100 disabled:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 text-sm"
          >
            <option value="">{date ? "Pilih slot jam" : "Pilih tanggal dahulu"}</option>
            {times.map((slot) => (
              <option key={slot.appointment_time} value={slot.appointment_time.slice(0, 5)}>
                {slot.appointment_time.slice(0, 5)} WIB
              </option>
            ))}
          </select>
        </div>
      </div>
      <p className="text-xs text-slate-500">
        Jadwal tersedia mulai besok hingga 14 hari ke depan (Minggu libur). Slot terisi otomatis terhapus dari pilihan.
      </p>

      <div>
        <label className="block text-sm font-semibold text-slate-800 mb-1.5" htmlFor="notes">
          Catatan Tambahan <span className="text-slate-400 font-normal">(opsional, maks. 200 karakter)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          maxLength={200}
          rows={2}
          placeholder="Contoh: Toko buka mulai jam 10 pagi, patokan dekat masjid..."
          value={fields.notes}
          onChange={(e) => change("notes", e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 text-sm resize-y"
        />
      </div>

      <div className="pt-2">
        <button
          type="submit"
          className="w-full py-3 px-6 rounded-xl bg-teal-700 hover:bg-teal-800 active:scale-[0.99] text-white font-semibold shadow-md transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          disabled={pending || dates.length === 0}
        >
          {pending ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Menyimpan Pendaftaran…
            </>
          ) : (
            <>
              <Icon name="check" size={18} />
              Daftar Gratis Sekarang
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export function CancelBooking({ id }: { id: string }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [state, action, pending] = useActionState(cancelBooking.bind(null, id), {});

  return (
    <div>
      {!showConfirm ? (
        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          className="text-xs font-semibold text-rose-600 hover:text-rose-700 underline transition-colors"
        >
          Ingin membatalkan janji temu ini?
        </button>
      ) : (
        <form action={action} className="p-4 rounded-xl border border-rose-200 bg-rose-50/70 space-y-3">
          <p className="text-sm font-medium text-rose-900">
            Yakin ingin membatalkan janji temu? Slot akan dilepaskan untuk pendaftar lain.
          </p>
          {state.error && <p role="alert" className="text-xs text-rose-700 font-semibold">{state.error}</p>}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={pending}
              className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {pending ? "Membatalkan…" : "Ya, Batalkan"}
            </button>
            <button
              type="button"
              onClick={() => setShowConfirm(false)}
              className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-medium hover:bg-white transition-colors"
            >
              Jangan Batalkan
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
