import { catalogHref, readFilters } from "@/lib/catalog/types";

export function contactLinks(phone: string) {
  const compact = phone.trim().replace(/[\s().-]/g, "");
  const match = compact.match(/^(?:\+62|0062|62|0)(8\d{8,12})$/);
  if (!match) return null;
  const number = `62${match[1]}`;
  return { whatsapp: `https://wa.me/${number}`, telephone: `tel:+${number}` };
}

export function mapLinks(address: string, latitude: number | null, longitude: number | null) {
  const validCoordinates = typeof latitude === "number" && Number.isFinite(latitude) && latitude >= -90 && latitude <= 90
    && typeof longitude === "number" && Number.isFinite(longitude) && longitude >= -180 && longitude <= 180;
  const query = validCoordinates ? `${latitude},${longitude}` : address;
  const params = new URLSearchParams({ q: query, z: "15", output: "embed" });
  return {
    // Format iframe mengikuti prototipe proyek. Tautan peta tetap tersedia.
    embed: `https://maps.google.com/maps?${params}`,
    open: `https://www.google.com/maps/search/?${new URLSearchParams({ api: "1", query })}`,
  };
}

export function safeCatalogReturn(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || raw.length > 512) return "/";
  try {
    const url = new URL(raw, "https://toko-lokal.invalid");
    if (url.origin !== "https://toko-lokal.invalid" || !["/", "/pencarian"].includes(url.pathname)) return "/";
    return catalogHref(url.pathname, readFilters(Object.fromEntries(url.searchParams)));
  } catch { return "/"; }
}
