import { NextResponse } from "next/server";

function extractCoordinates(str: string): { lat: number; lon: number } | null {
  // 1. Direct coordinate string: "-6.2435, 106.8021" or "-6.2435 106.8021"
  const rawCoord = str.trim().match(/^(-?\d{1,2}(?:\.\d+)?)[,\s]+(-?\d{1,3}(?:\.\d+)?)$/);
  if (rawCoord) {
    const lat = parseFloat(rawCoord[1]);
    const lon = parseFloat(rawCoord[2]);
    if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      return { lat, lon };
    }
  }

  // 2. Google Maps URL @lat,lon,zoom
  const atMatch = str.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    return { lat: parseFloat(atMatch[1]), lon: parseFloat(atMatch[2]) };
  }

  // 3. Google Maps query parameter ?q=lat,lon or &q=lat,lon
  const qMatch = str.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (qMatch) {
    return { lat: parseFloat(qMatch[1]), lon: parseFloat(qMatch[2]) };
  }

  // 4. Google Maps ll parameter ?ll=lat,lon
  const llMatch = str.match(/[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (llMatch) {
    return { lat: parseFloat(llMatch[1]), lon: parseFloat(llMatch[2]) };
  }

  // 5. Protobuf / embed data: !3d<lat>!4d<lon>
  const d3d4 = str.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (d3d4) {
    return { lat: parseFloat(d3d4[1]), lon: parseFloat(d3d4[2]) };
  }

  // 6. Embed coordinate order: !2d<lon>!3d<lat>
  const d2d3 = str.match(/!2d(-?\d+\.\d+)!3d(-?\d+\.\d+)/);
  if (d2d3) {
    return { lat: parseFloat(d2d3[2]), lon: parseFloat(d2d3[1]) };
  }

  // 7. Destination parameter in directions: destination=lat,lon
  const destMatch = str.match(/[?&]destination=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (destMatch) {
    return { lat: parseFloat(destMatch[1]), lon: parseFloat(destMatch[2]) };
  }

  return null;
}

function extractPlaceNameFromUrl(url: string): string | null {
  try {
    const placeMatch = url.match(/\/place\/([^/@?]+)/);
    if (placeMatch && placeMatch[1]) {
      const decoded = decodeURIComponent(placeMatch[1].replace(/\+/g, " "));
      if (decoded && !/^[0-9.-]+$/.test(decoded)) {
        return decoded;
      }
    }
    const searchMatch = url.match(/[?&]q=([^&]+)/);
    if (searchMatch && searchMatch[1]) {
      const decoded = decodeURIComponent(searchMatch[1].replace(/\+/g, " "));
      if (!/^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(decoded)) {
        return decoded;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const revUrl = `https://nominatim.openstreetmap.org/reverse?lat=${encodeURIComponent(
      lat
    )}&lon=${encodeURIComponent(lon)}&format=json&addressdetails=1`;

    const res = await fetch(revUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "TokoLokal-App/1.0 (halo@tokolokal.id)",
        "Accept-Language": "id,en;q=0.9",
      },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const addr = data?.address || {};
      const road = addr.road || addr.pedestrian || addr.residential || addr.neighbourhood || "";
      const suburb = addr.suburb || addr.village || addr.town || addr.city_district || addr.district || "";
      const city = addr.city || addr.regency || addr.county || "";
      const state = addr.state || "";

      const parts = [road, suburb, city, state].filter(Boolean);
      if (parts.length > 0) {
        return parts.join(", ");
      }
      if (data?.display_name) {
        return String(data.display_name).split(",").slice(0, 4).join(", ").trim();
      }
    }
  } catch {
    // ignore
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const inputUrl = typeof body?.url === "string" ? body.url.trim() : "";

    if (!inputUrl) {
      return NextResponse.json(
        { success: false, error: "Harap masukkan link Google Maps atau koordinat lokasi toko Anda." },
        { status: 400 }
      );
    }

    let targetUrl = inputUrl;
    let placeNameHint = extractPlaceNameFromUrl(targetUrl);

    // 1. Cek apakah langsung koordinat di URL awal
    let coords = extractCoordinates(targetUrl);

    // 2. Jika link pendek (maps.app.goo.gl atau goo.gl/maps), ikuti redirect
    if (!coords && (targetUrl.includes("goo.gl") || targetUrl.includes("maps.app.goo.gl"))) {
      try {
        let currentUrl = targetUrl;
        if (!currentUrl.startsWith("http://") && !currentUrl.startsWith("https://")) {
          currentUrl = `https://${currentUrl}`;
        }

        // Ikuti hingga 5 redirection
        for (let i = 0; i < 5; i++) {
          const headRes = await fetch(currentUrl, {
            method: "HEAD",
            redirect: "manual",
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            },
          });

          const locationHeader = headRes.headers.get("location");
          if (locationHeader) {
            currentUrl = locationHeader.startsWith("/")
              ? new URL(locationHeader, currentUrl).toString()
              : locationHeader;
            coords = extractCoordinates(currentUrl);
            if (!placeNameHint) {
              placeNameHint = extractPlaceNameFromUrl(currentUrl);
            }
            if (coords) {
              targetUrl = currentUrl;
              break;
            }
          } else {
            // Jika tidak ada location header di HEAD, coba GET
            const getRes = await fetch(currentUrl, {
              method: "GET",
              redirect: "follow",
              headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              },
            });
            targetUrl = getRes.url || currentUrl;
            coords = extractCoordinates(targetUrl);
            if (!placeNameHint) {
              placeNameHint = extractPlaceNameFromUrl(targetUrl);
            }
            if (!coords) {
              // Periksa apakah URL ada di konten HTML (misal canonical link atau og:url)
              const html = await getRes.text();
              coords = extractCoordinates(html);
            }
            break;
          }
        }
      } catch {
        // continue
      }
    }

    // 3. Jika belum dapat koordinat tapi ada nama tempat dari URL (misal google.com/maps/search/Nama+Toko)
    if (!coords && placeNameHint) {
      try {
        const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          placeNameHint
        )}&format=json&countrycodes=id&limit=1&addressdetails=1`;
        const res = await fetch(nominatimUrl, {
          headers: {
            "User-Agent": "TokoLokal-App/1.0 (halo@tokolokal.id)",
            "Accept-Language": "id,en;q=0.9",
          },
        });
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list) && list.length > 0) {
            coords = {
              lat: parseFloat(list[0].lat),
              lon: parseFloat(list[0].lon),
            };
          }
        }
      } catch {
        // continue
      }
    }

    if (!coords) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Titik koordinat tidak dapat dibaca dari link ini. Pastikan menyalin link lengkap atau tombol 'Bagikan' dari Google Maps, atau gunakan opsi Cari Tempat.",
        },
        { status: 422 }
      );
    }

    // 4. Reverse geocode untuk mendapatkan alamat riil yang rapi
    const resolvedAddress = await reverseGeocode(coords.lat, coords.lon);

    return NextResponse.json({
      success: true,
      latitude: coords.lat,
      longitude: coords.lon,
      place_name: placeNameHint || null,
      address: resolvedAddress || `Titik Koordinat (${coords.lat.toFixed(5)}, ${coords.lon.toFixed(5)})`,
      maps_url: `https://www.google.com/maps?q=${coords.lat},${coords.lon}`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Terjadi kendala saat memproses link lokasi." },
      { status: 500 }
    );
  }
}

