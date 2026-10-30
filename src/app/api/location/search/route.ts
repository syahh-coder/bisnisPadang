import { NextResponse } from "next/server";

export interface LocationSearchResult {
  id: string;
  title: string;
  subtitle: string;
  full_name: string;
  latitude: number;
  longitude: number;
}

// Basis data lokal kecamatan & kota di Indonesia (fallback cepat & offline)
const fallbackDatabase: LocationSearchResult[] = [
  // Bandung Raya & Sekitarnya
  {
    id: "loc-bdg-bojongsoang",
    title: "Bojongsoang",
    subtitle: "Kecamatan, Kabupaten Bandung, Jawa Barat",
    full_name: "Bojongsoang, Kab. Bandung, Jawa Barat",
    latitude: -6.9944,
    longitude: 107.6366,
  },
  {
    id: "loc-bdg-lengkong-bojongsoang",
    title: "Lengkong (Bojongsoang)",
    subtitle: "Kelurahan/Desa, Kec. Bojongsoang, Kab. Bandung",
    full_name: "Lengkong, Bojongsoang, Kab. Bandung",
    latitude: -6.9745,
    longitude: 107.6312,
  },
  {
    id: "loc-bdg-dago",
    title: "Dago (Coblong)",
    subtitle: "Kelurahan/Area, Kota Bandung, Jawa Barat",
    full_name: "Dago, Coblong, Kota Bandung",
    latitude: -6.8794,
    longitude: 107.6186,
  },
  {
    id: "loc-bdg-buahbatu",
    title: "Buahbatu",
    subtitle: "Kecamatan, Kota Bandung, Jawa Barat",
    full_name: "Buahbatu, Kota Bandung, Jawa Barat",
    latitude: -6.9535,
    longitude: 107.6534,
  },
  {
    id: "loc-bdg-dayeuhkolot",
    title: "Dayeuhkolot",
    subtitle: "Kecamatan, Kabupaten Bandung, Jawa Barat",
    full_name: "Dayeuhkolot, Kab. Bandung, Jawa Barat",
    latitude: -6.9856,
    longitude: 107.6214,
  },
  {
    id: "loc-bgr-bojonggede",
    title: "Bojonggede",
    subtitle: "Kecamatan, Kabupaten Bogor, Jawa Barat",
    full_name: "Bojonggede, Kab. Bogor, Jawa Barat",
    latitude: -6.4952,
    longitude: 106.7972,
  },
  {
    id: "loc-bks-bojong-rawalumbu",
    title: "Bojong Rawalumbu",
    subtitle: "Kelurahan, Kec. Rawalumbu, Kota Bekasi",
    full_name: "Bojong Rawalumbu, Kota Bekasi, Jawa Barat",
    latitude: -6.2758,
    longitude: 106.9982,
  },

  // DKI Jakarta
  {
    id: "loc-jkt-kebayoran-baru",
    title: "Kebayoran Baru",
    subtitle: "Kecamatan, Kota Jakarta Selatan, DKI Jakarta",
    full_name: "Kebayoran Baru, Jakarta Selatan, DKI Jakarta",
    latitude: -6.2435,
    longitude: 106.8021,
  },
  {
    id: "loc-jkt-tebet",
    title: "Tebet",
    subtitle: "Kecamatan, Kota Jakarta Selatan, DKI Jakarta",
    full_name: "Tebet, Jakarta Selatan, DKI Jakarta",
    latitude: -6.2307,
    longitude: 106.8524,
  },
  {
    id: "loc-jkt-kelapa-gading",
    title: "Kelapa Gading",
    subtitle: "Kecamatan, Kota Jakarta Utara, DKI Jakarta",
    full_name: "Kelapa Gading, Jakarta Utara, DKI Jakarta",
    latitude: -6.1601,
    longitude: 106.9084,
  },
  {
    id: "loc-jkt-menteng",
    title: "Menteng",
    subtitle: "Kecamatan, Kota Jakarta Pusat, DKI Jakarta",
    full_name: "Menteng, Jakarta Pusat, DKI Jakarta",
    latitude: -6.1965,
    longitude: 106.8327,
  },

  // Yogyakarta & Jawa Tengah
  {
    id: "loc-diy-malioboro",
    title: "Malioboro (Danurejan)",
    subtitle: "Kawasan Wisata & Bisnis, Kota Yogyakarta",
    full_name: "Malioboro, Kota Yogyakarta, DI Yogyakarta",
    latitude: -7.7928,
    longitude: 110.3658,
  },
  {
    id: "loc-diy-depok-sleman",
    title: "Depok (Sleman)",
    subtitle: "Kecamatan, Kabupaten Sleman, DI Yogyakarta",
    full_name: "Depok, Kab. Sleman, DI Yogyakarta",
    latitude: -7.7684,
    longitude: 110.3982,
  },
  {
    id: "loc-smg-semarang-tengah",
    title: "Semarang Tengah",
    subtitle: "Kecamatan, Kota Semarang, Jawa Tengah",
    full_name: "Semarang Tengah, Kota Semarang, Jawa Tengah",
    latitude: -6.9826,
    longitude: 110.4208,
  },

  // Jawa Timur
  {
    id: "loc-sby-gubeng",
    title: "Gubeng",
    subtitle: "Kecamatan, Kota Surabaya, Jawa Timur",
    full_name: "Gubeng, Kota Surabaya, Jawa Timur",
    latitude: -7.2754,
    longitude: 112.7538,
  },
  {
    id: "loc-mlg-klojen",
    title: "Klojen",
    subtitle: "Kecamatan, Kota Malang, Jawa Timur",
    full_name: "Klojen, Kota Malang, Jawa Timur",
    latitude: -7.9785,
    longitude: 112.6318,
  },

  // Bali
  {
    id: "loc-bali-kuta",
    title: "Kuta",
    subtitle: "Kecamatan, Kabupaten Badung, Bali",
    full_name: "Kuta, Kab. Badung, Bali",
    latitude: -8.7231,
    longitude: 115.1725,
  },
  {
    id: "loc-bali-denpasar",
    title: "Denpasar",
    subtitle: "Kota Denpasar, Provinsi Bali",
    full_name: "Kota Denpasar, Bali",
    latitude: -8.6705,
    longitude: 115.2126,
  },

  // Sumatera
  {
    id: "loc-pbr-sukajadi",
    title: "Sukajadi (Pekanbaru)",
    subtitle: "Kecamatan, Kota Pekanbaru, Riau",
    full_name: "Sukajadi, Kota Pekanbaru, Riau",
    latitude: 0.5255,
    longitude: 101.4428,
  },
  {
    id: "loc-mdn-medan-petisah",
    title: "Medan Petisah",
    subtitle: "Kecamatan, Kota Medan, Sumatera Utara",
    full_name: "Medan Petisah, Kota Medan, Sumatera Utara",
    latitude: 3.5901,
    longitude: 98.6651,
  },

  // Sulawesi & Kalimantan
  {
    id: "loc-mks-makassar",
    title: "Makassar",
    subtitle: "Kota Makassar, Sulawesi Selatan",
    full_name: "Kota Makassar, Sulawesi Selatan",
    latitude: -5.1477,
    longitude: 119.4327,
  },
  {
    id: "loc-bpn-balikpapan",
    title: "Balikpapan",
    subtitle: "Kota Balikpapan, Kalimantan Timur",
    full_name: "Kota Balikpapan, Kalimantan Timur",
    latitude: -1.2379,
    longitude: 116.8289,
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() || "";

  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const queryLower = q.toLowerCase();

  // 1. Cari dulu dari fallback database lokal untuk respon secepat kilat
  const localMatches = fallbackDatabase.filter(
    (item) =>
      item.title.toLowerCase().includes(queryLower) ||
      item.subtitle.toLowerCase().includes(queryLower) ||
      item.full_name.toLowerCase().includes(queryLower)
  );

  // 2. Query ke OpenStreetMap Nominatim untuk data 100% akurat se-Indonesia
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      q
    )}&format=json&countrycodes=id&limit=8&addressdetails=1`;

    const res = await fetch(nominatimUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "TokoLokal-Direktori/1.0 (admin@tokolokal.id)",
        "Accept-Language": "id,en;q=0.9",
      },
      next: { revalidate: 3600 },
    });

    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const osmResults: LocationSearchResult[] = data.map((item: any, idx: number) => {
          const addr = item.address || {};
          const district =
            addr.suburb ||
            addr.district ||
            addr.town ||
            addr.village ||
            addr.city_district ||
            addr.county ||
            item.name;

          const regencyOrCity = addr.city || addr.regency || addr.county || "";
          const state = addr.state || "";

          const subtitleParts = [district, regencyOrCity, state].filter(Boolean);
          const subtitle = subtitleParts.join(", ") || item.display_name;

          return {
            id: `osm-${item.place_id || idx}`,
            title: item.name || district || "Lokasi",
            subtitle: subtitle,
            full_name: `${item.name || district}, ${regencyOrCity ? `${regencyOrCity}, ` : ""}${state}`.replace(/,\s*,/g, ","),
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
          };
        });

        // Gabungkan hasil online Nominatim dengan hasil lokal (hindari duplikat)
        const combined = [...osmResults];
        for (const loc of localMatches) {
          if (!combined.some((c) => Math.abs(c.latitude - loc.latitude) < 0.01 && Math.abs(c.longitude - loc.longitude) < 0.01)) {
            combined.push(loc);
          }
        }

        return NextResponse.json({ results: combined.slice(0, 8) });
      }
    }
  } catch {
    // Jika koneksi Nominatim timeout / gagal, fallback ke database lokal
  }

  // Jika online gagal atau tidak ada hasil online, kembalikan hasil lokal
  return NextResponse.json({ results: localMatches });
}
