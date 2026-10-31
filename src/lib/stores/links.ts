import { catalogHref, readFilters } from "@/lib/catalog/types";

export interface DeliveryPlatformLinks {
  gofood_url?: string | null;
  shopeefood_url?: string | null;
  grabfood_url?: string | null;
}

export interface ParsedDeliveryChannels {
  cleanDeliveryInfo: string;
  gofoodUrl: string;
  shopeefoodUrl: string;
  grabfoodUrl: string;
  hasCustomGofood: boolean;
  hasCustomShopeefood: boolean;
  hasCustomGrabfood: boolean;
}

const CHANNELS_DELIMITER = " ||CHANNELS:";

export function serializeDeliveryInfo(
  deliveryInfo: string,
  links?: DeliveryPlatformLinks
): string {
  const cleanText = stripDeliveryChannels(deliveryInfo).trim();
  const payload: Record<string, string> = {};

  if (links?.gofood_url?.trim()) payload.gofood = links.gofood_url.trim();
  if (links?.shopeefood_url?.trim()) payload.shopeefood = links.shopeefood_url.trim();
  if (links?.grabfood_url?.trim()) payload.grabfood = links.grabfood_url.trim();

  if (Object.keys(payload).length === 0) {
    return cleanText;
  }

  const serialized = `${cleanText}${CHANNELS_DELIMITER}${JSON.stringify(payload)}`;
  return serialized.length <= 1000 ? serialized : cleanText;
}

export function stripDeliveryChannels(rawDeliveryInfo: string | null | undefined): string {
  if (!rawDeliveryInfo) return "";
  const idx = rawDeliveryInfo.indexOf(CHANNELS_DELIMITER);
  if (idx === -1) return rawDeliveryInfo;
  return rawDeliveryInfo.slice(0, idx).trim();
}

export function parseDeliveryChannels(
  rawDeliveryInfo: string | null | undefined,
  storeName: string,
  explicit?: DeliveryPlatformLinks
): ParsedDeliveryChannels {
  let cleanDeliveryInfo = rawDeliveryInfo || "";
  let embedded: Record<string, string> = {};

  if (rawDeliveryInfo) {
    const idx = rawDeliveryInfo.indexOf(CHANNELS_DELIMITER);
    if (idx !== -1) {
      cleanDeliveryInfo = rawDeliveryInfo.slice(0, idx).trim();
      try {
        embedded = JSON.parse(rawDeliveryInfo.slice(idx + CHANNELS_DELIMITER.length));
      } catch {
        embedded = {};
      }
    }
  }

  const customGofood = explicit?.gofood_url?.trim() || embedded.gofood || "";
  const customShopeefood = explicit?.shopeefood_url?.trim() || embedded.shopeefood || "";
  const customGrabfood = explicit?.grabfood_url?.trim() || embedded.grabfood || "";

  const encodedQuery = encodeURIComponent(storeName.trim());

  return {
    cleanDeliveryInfo,
    gofoodUrl: customGofood || `https://gofood.co.id/search?q=${encodedQuery}`,
    shopeefoodUrl: customShopeefood || `https://shopee.co.id/search?keyword=${encodedQuery}`,
    grabfoodUrl: customGrabfood || `https://food.grab.com/id/id/restaurants?search=${encodedQuery}`,
    hasCustomGofood: Boolean(customGofood),
    hasCustomShopeefood: Boolean(customShopeefood),
    hasCustomGrabfood: Boolean(customGrabfood),
  };
}

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
