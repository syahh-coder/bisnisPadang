export type Slot = { appointment_date: string; appointment_time: string };
export type Booking = Slot & {
  id: string;
  manager_name: string;
  whatsapp: string;
  address: string;
  notes: string;
  status: string;
  store_id?: string | null;
  created_at?: string;
};
export type FormState = { error?: string; success?: string; bookingId?: string };
export const statuses = ["menunggu", "dikonfirmasi", "selesai", "dibatalkan"] as const;
export const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

export function phoneNumber(value: string) {
  let digits = value.replace(/[\s()+.-]/g, "");
  if (digits.startsWith("0")) digits = `62${digits.slice(1)}`;
  if (digits.startsWith("8")) digits = `62${digits}`;
  return /^62\d{8,13}$/.test(digits) ? digits : null;
}

export function dateLabel(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(`${value}T12:00:00+07:00`));
}

export function field(form: FormData, name: string) {
  return String(form.get(name) ?? "").trim();
}

/**
 * Menghasilkan slot janji temu dinamis (besok s/d 14 hari ke depan, Minggu libur, jam 09:00, 11:00, 13:00, 15:00 WIB)
 */
export function generateAvailableSlots(): Slot[] {
  const slots: Slot[] = [];
  const times = ["09:00", "11:00", "13:00", "15:00"];

  const now = new Date();
  // Mulai besok
  for (let i = 1; i <= 14; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);

    // Hari Minggu libur (0 = Minggu)
    if (d.getDay() === 0) continue;

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const appointment_date = `${yyyy}-${mm}-${dd}`;

    for (const time of times) {
      slots.push({ appointment_date, appointment_time: time });
    }
  }

  return slots;
}
