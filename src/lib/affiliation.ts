export type Slot = { appointment_date: string; appointment_time: string };
export type Booking = Slot & { id: string; manager_name: string; whatsapp: string; address: string; notes: string; status: string; store_id?: string | null };
export type FormState = { error?: string; success?: string };
export const statuses = ["menunggu", "dikonfirmasi", "selesai", "dibatalkan"] as const;
export const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
export function phoneNumber(value: string) {
  let digits = value.replace(/[\s()+.-]/g, "");
  if (digits.startsWith("0")) digits = `62${digits.slice(1)}`;
  if (digits.startsWith("8")) digits = `62${digits}`;
  return /^62\d{8,13}$/.test(digits) ? digits : null;
}
export function dateLabel(value: string) {
  return new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" }).format(new Date(`${value}T12:00:00+07:00`));
}
export function field(form: FormData, name: string) { return String(form.get(name) ?? "").trim(); }
