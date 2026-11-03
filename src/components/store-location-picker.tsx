"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { Icon } from "@/components/icon";
import { useToast } from "@/components/toast";
import type { LocationSearchResult } from "@/app/api/location/search/route";

interface StoreLocationPickerProps {
  initialLatitude?: string | number | null;
  initialLongitude?: string | number | null;
  initialAddress?: string;
  onLocationChange?: (lat: string, lon: string, placeName?: string) => void;
  onApplyAddress?: (newAddress: string) => void;
}

export function StoreLocationPicker({
  initialLatitude,
  initialLongitude,
  initialAddress = "",
  onLocationChange,
  onApplyAddress,
}: StoreLocationPickerProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"link" | "search">("link");
  const [latitude, setLatitude] = useState<string>(
    initialLatitude !== null && initialLatitude !== undefined ? String(initialLatitude) : ""
  );
  const [longitude, setLongitude] = useState<string>(
    initialLongitude !== null && initialLongitude !== undefined ? String(initialLongitude) : ""
  );

  // Status & Resolved Info
  const [resolvedPlace, setResolvedPlace] = useState<{
    place_name?: string | null;
    address?: string;
    maps_url?: string;
  } | null>(null);

  // Tab 1: Link input
  const [gmapsUrl, setGmapsUrl] = useState("");
  const [isParsingLink, setIsParsingLink] = useState(false);

  // Tab 2: Search input
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // GPS Detecting
  const [isGpsLoading, setIsGpsLoading] = useState(false);

  // Manual Accordion
  const [showManual, setShowManual] = useState(false);

  // Update parent when coordinates change
  const applyCoordinates = (lat: number | string, lon: number | string, placeInfo?: { name?: string | null; address?: string }) => {
    const latStr = String(lat).trim();
    const lonStr = String(lon).trim();
    setLatitude(latStr);
    setLongitude(lonStr);

    if (placeInfo) {
      setResolvedPlace({
        place_name: placeInfo.name,
        address: placeInfo.address,
        maps_url: `https://www.google.com/maps?q=${latStr},${lonStr}`,
      });
    } else {
      setResolvedPlace({
        maps_url: `https://www.google.com/maps?q=${latStr},${lonStr}`,
      });
    }

    if (onLocationChange) {
      onLocationChange(latStr, lonStr, placeInfo?.name || undefined);
    }
  };

  // 1. Handle Link Parsing (Opsi 1)
  const handleParseGmapsLink = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const url = gmapsUrl.trim();
    if (!url) {
      toast("Masukkan link Google Maps toko Anda terlebih dahulu", "info");
      return;
    }

    setIsParsingLink(true);
    try {
      const res = await fetch("/api/location/parse-gmaps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        toast(data.error || "Gagal membaca titik dari link Google Maps", "error");
        return;
      }

      applyCoordinates(data.latitude, data.longitude, {
        name: data.place_name,
        address: data.address,
      });

      toast("Titik lokasi Google Maps berhasil dipasang!", "info");
      setGmapsUrl("");
    } catch {
      toast("Terjadi kesalahan saat menghubungkan ke server", "error");
    } finally {
      setIsParsingLink(false);
    }
  };

  // 2. Handle Search Query with Debounce (Opsi 2)
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/location/search?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results || []);
        }
      } catch {
        // ignore
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery]);

  const handleSelectSearchResult = (item: LocationSearchResult) => {
    applyCoordinates(item.latitude, item.longitude, {
      name: item.title,
      address: item.full_name || item.subtitle,
    });
    setSearchResults([]);
    setSearchQuery("");
    toast(`Titik lokasi "${item.title}" dipilih!`, "info");
  };

  // 3. Handle GPS Device Location
  const handleDetectGps = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      toast("Browser perangkat belum mendukung akses GPS.", "info");
      return;
    }

    setIsGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        let detectedAddress = `Titik GPS (${lat.toFixed(5)}, ${lon.toFixed(5)})`;

        try {
          const res = await fetch(`/api/location/search?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`);
          if (res.ok) {
            const data = await res.json();
            if (data?.address) {
              detectedAddress = data.address;
            }
          }
        } catch {
          // ignore
        }

        applyCoordinates(lat, lon, {
          name: "Lokasi GPS Saat Ini",
          address: detectedAddress,
        });

        setIsGpsLoading(false);
        toast("Titik GPS saat ini berhasil dipasang!", "info");
      },
      () => {
        setIsGpsLoading(false);
        toast("Izin akses lokasi GPS ditolak oleh browser.", "error");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleClearLocation = () => {
    setLatitude("");
    setLongitude("");
    setResolvedPlace(null);
    if (onLocationChange) onLocationChange("", "");
    toast("Titik koordinat lokasi dihapus.", "info");
  };

  const hasCoordinates = Boolean(latitude && longitude && !isNaN(Number(latitude)) && !isNaN(Number(longitude)));

  return (
    <div className="bg-slate-50/70 rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-4">
      {/* Hidden inputs so form always submits exact latitude and longitude */}
      <input type="hidden" name="latitude" value={latitude} />
      <input type="hidden" name="longitude" value={longitude} />

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <Icon name="mapPin" size={16} />
            </span>
            <h3 className="text-sm font-bold text-slate-900">Titik Lokasi Peta Toko</h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              Akurasi GPS Real
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Digunakan sistem untuk menghitung jarak akurat pesanan pelanggan ke toko Anda.
          </p>
        </div>

        {/* Quick GPS Button */}
        <button
          type="button"
          onClick={handleDetectGps}
          disabled={isGpsLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all disabled:opacity-60 self-start sm:self-auto"
        >
          <Icon name="sparkles" size={13} className={isGpsLoading ? "animate-spin" : ""} />
          <span>{isGpsLoading ? "Mendeteksi GPS…" : "Gunakan GPS Saya Saat Ini"}</span>
        </button>
      </div>

      {/* 2 Opsi Utama: Tab Switcher */}
      <div className="space-y-3">
        <div className="flex items-center p-1 bg-white rounded-xl border border-slate-200 max-w-md">
          <button
            type="button"
            onClick={() => setActiveTab("link")}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "link"
                ? "bg-emerald-700 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Icon name="link" size={14} />
            <span>Opsi 1: Tempel Link Toko</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("search")}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "search"
                ? "bg-emerald-700 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Icon name="search" size={14} />
            <span>Opsi 2: Cari di Google Maps</span>
          </button>
        </div>

        {/* Opsi 1: Input Link Google Maps */}
        {activeTab === "link" && (
          <div className="space-y-2 bg-white p-3.5 rounded-xl border border-slate-200">
            <label htmlFor="gmaps-link-input" className="block text-xs font-bold text-slate-800">
              Tempelkan Link Google Maps Toko Anda
            </label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Icon name="link" size={15} />
                </span>
                <input
                  id="gmaps-link-input"
                  type="text"
                  value={gmapsUrl}
                  onChange={(e) => setGmapsUrl(e.target.value)}
                  placeholder="Contoh: https://maps.app.goo.gl/... atau google.com/maps/place/..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
              <button
                type="button"
                onClick={() => handleParseGmapsLink()}
                disabled={isParsingLink || !gmapsUrl.trim()}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0"
              >
                {isParsingLink ? (
                  <>
                    <Icon name="refresh" size={14} className="animate-spin" />
                    <span>Membaca Link…</span>
                  </>
                ) : (
                  <>
                    <Icon name="check" size={14} />
                    <span>Ambil Lokasi Toko</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              <strong>Cara mudah:</strong> Buka aplikasi Google Maps di HP &gt; Cari toko Anda &gt; Tekan tombol{" "}
              <strong>Bagikan (Share)</strong> &gt; Pilih <strong>Salin Link</strong> &gt; Tempel di kolom ini.
            </p>
          </div>
        )}

        {/* Opsi 2: Search Langsung di Maps Real 100% */}
        {activeTab === "search" && (
          <div className="space-y-2 bg-white p-3.5 rounded-xl border border-slate-200 relative">
            <label htmlFor="gmaps-search-input" className="block text-xs font-bold text-slate-800">
              Cari Nama Toko, Jalan, atau Wilayah Anda
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Icon name="search" size={15} />
              </span>
              <input
                id="gmaps-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ketik nama toko, nama jalan, kelurahan, atau kecamatan Anda..."
                className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
              {isSearching && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600">
                  <Icon name="refresh" size={14} className="animate-spin" />
                </span>
              )}
            </div>

            {/* Results Dropdown */}
            {searchResults.length > 0 && (
              <div className="border border-slate-200 rounded-xl bg-white shadow-lg divide-y divide-slate-100 max-h-60 overflow-y-auto z-20">
                {searchResults.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectSearchResult(item)}
                    className="w-full p-2.5 text-left hover:bg-emerald-50/70 transition-colors flex items-start gap-2.5"
                  >
                    <Icon name="mapPin" size={15} className="text-emerald-700 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{item.title}</p>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{item.subtitle}</p>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded shrink-0">
                      Pilih
                    </span>
                  </button>
                ))}
              </div>
            )}

            <p className="text-[11px] text-slate-500">
              Data pencarian terhubung langsung ke basis peta geocoding 100% nyata se-Indonesia.
            </p>
          </div>
        )}
      </div>

      {/* Confirmation & Active Location Card */}
      {hasCoordinates ? (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                <Icon name="check" size={12} />
              </span>
              <div>
                <p className="text-xs font-extrabold text-emerald-900">
                  {resolvedPlace?.place_name ? `Lokasi Terpasang: ${resolvedPlace.place_name}` : "Titik Lokasi Terpasang"}
                </p>
                <p className="text-[11px] text-emerald-800 font-mono mt-0.5">
                  Lintang: {latitude}, Bujur: {longitude}
                </p>
                {resolvedPlace?.address && (
                  <p className="text-xs text-slate-700 mt-1 bg-white/80 p-2 rounded-lg border border-emerald-100">
                    <span className="font-semibold text-slate-800">Alamat Peta:</span> {resolvedPlace.address}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleClearLocation}
              className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
              title="Hapus titik lokasi"
            >
              <Icon name="close" size={16} />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-emerald-200/60 text-xs">
            <a
              href={`https://www.google.com/maps?q=${latitude},${longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-bold text-emerald-800 hover:underline"
            >
              <span>Buka Titik di Google Maps</span>
              <Icon name="externalLink" size={12} />
            </a>

            {resolvedPlace?.address && onApplyAddress && (
              <button
                type="button"
                onClick={() => {
                  onApplyAddress(resolvedPlace.address!);
                  toast("Alamat peta disalin ke kolom alamat toko!", "info");
                }}
                className="inline-flex items-center gap-1 font-bold text-emerald-800 hover:underline ml-auto"
              >
                <Icon name="copy" size={12} />
                <span>Gunakan Sebagai Alamat Toko</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
          <Icon name="alertCircle" size={16} className="text-amber-700 shrink-0" />
          <span>
            Belum ada titik peta yang dipasang. Gunakan salah satu opsi di atas agar toko Anda memiliki titik peta akurat.
          </span>
        </div>
      )}

      {/* Collapsible Manual Decimal Coordinates */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setShowManual(!showManual)}
          className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
        >
          <Icon name={showManual ? "chevronDown" : "chevronRight"} size={13} />
          <span>{showManual ? "Sembunyikan Pengaturan Koordinat Manual" : "Lihat / Ubah Angka Koordinat Manual"}</span>
        </button>

        {showManual && (
          <div className="grid grid-cols-2 gap-3 mt-2.5 p-3 rounded-xl bg-white border border-slate-200">
            <div>
              <label htmlFor="manual-lat-input" className="block text-[11px] font-bold text-slate-700 mb-1">
                Lintang (Latitude)
              </label>
              <input
                id="manual-lat-input"
                type="number"
                step="any"
                min={-90}
                max={90}
                value={latitude}
                onChange={(e) => {
                  setLatitude(e.target.value);
                  if (onLocationChange) onLocationChange(e.target.value, longitude);
                }}
                placeholder="-6.2435"
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 font-mono"
              />
            </div>
            <div>
              <label htmlFor="manual-lon-input" className="block text-[11px] font-bold text-slate-700 mb-1">
                Bujur (Longitude)
              </label>
              <input
                id="manual-lon-input"
                type="number"
                step="any"
                min={-180}
                max={180}
                value={longitude}
                onChange={(e) => {
                  setLongitude(e.target.value);
                  if (onLocationChange) onLocationChange(latitude, e.target.value);
                }}
                placeholder="106.8021"
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 font-mono"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
