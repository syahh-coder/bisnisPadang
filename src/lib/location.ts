export type UserLocation = {
  name: string;
  latitude: number | null;
  longitude: number | null;
  isAuto: boolean;
};

export const defaultCities: { name: string; latitude: number; longitude: number }[] = [
  { name: "Jakarta", latitude: -6.2088, longitude: 106.8456 },
  { name: "Bandung", latitude: -6.9175, longitude: 107.6191 },
  { name: "Surabaya", latitude: -7.2575, longitude: 112.7521 },
  { name: "Yogyakarta", latitude: -7.7956, longitude: 110.3695 },
  { name: "Semarang", latitude: -6.9667, longitude: 110.4167 },
  { name: "Malang", latitude: -7.9666, longitude: 112.6326 },
  { name: "Medan", latitude: 3.5952, longitude: 98.6722 },
  { name: "Pekanbaru", latitude: 0.5333, longitude: 101.45 },
  { name: "Denpasar / Bali", latitude: -8.6705, longitude: 115.2126 },
  { name: "Makassar", latitude: -5.1477, longitude: 119.4327 },
];

/**
 * Menghitung jarak antara dua koordinat (Haversine Formula) dalam satuan Kilometer (km).
 */
export function calculateDistance(
  lat1: number | null | undefined,
  lon1: number | null | undefined,
  lat2: number | null | undefined,
  lon2: number | null | undefined
): number | null {
  if (
    lat1 === null ||
    lat1 === undefined ||
    lon1 === null ||
    lon1 === undefined ||
    lat2 === null ||
    lat2 === undefined ||
    lon2 === null ||
    lon2 === undefined
  ) {
    return null;
  }

  const R = 6371; // Radius bumi dalam km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;

  return Math.round(d * 10) / 10; // 1 desimal (contoh: 2.4 km)
}

export function formatDistance(distanceKm: number | null): string {
  if (distanceKm === null) return "";
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters} m`;
  }
  return `${distanceKm.toLocaleString("id-ID", { maximumFractionDigits: 1 })} km`;
}
