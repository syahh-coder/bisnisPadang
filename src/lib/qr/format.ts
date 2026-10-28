export type QRRecord = { id: string; store_id: string; kind: "static" | "dynamic"; code: string; site_origin: string; target_slug: string; created_at: string; expires_at: string | null };
export const qrColumns = "id,store_id,kind,code,site_origin,target_slug,created_at,expires_at";
export function localHost(host: string) {
  if (["localhost", "127.0.0.1", "[::1]"].includes(host)) return true;
  const parts = host.split(".").map(Number);
  return parts.length === 4 && parts.every((n) => Number.isInteger(n) && n >= 0 && n <= 255) && (parts[0] === 10 || (parts[0] === 192 && parts[1] === 168) || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31));
}
export function validOrigin(value: string) {
  try {
    const url = new URL(value);
    if (value.length > 300 || url.username || url.password || url.pathname !== "/" || url.search || url.hash || !url.hostname || (url.protocol !== "https:" && !(url.protocol === "http:" && localHost(url.hostname)))) return null;
    return url.origin;
  } catch { return null; }
}
export function qrTarget(qr: QRRecord) {
  const origin = validOrigin(qr.site_origin);
  if (!origin) return null;
  return `${origin}${qr.kind === "static" ? `/toko/${encodeURIComponent(qr.target_slug)}?src=qr` : `/q/${qr.code}`}`;
}
export function wibMinute(value: string | number) { return new Date(new Date(value).getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0,16); }
export function parseWib(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const date = new Date(`${value}:00+07:00`);
  if (!Number.isFinite(date.getTime()) || wibMinute(date.toISOString()) !== value) return null;
  return date.toISOString();
}
export function qrDate(value: string) { return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "Asia/Jakarta" }).format(new Date(value)) + " WIB"; }
export function qrMax(createdAt: string) { return new Date(createdAt).getTime() + 15 * 24 * 60 * 60 * 1000; }
