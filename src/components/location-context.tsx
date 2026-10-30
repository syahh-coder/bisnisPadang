"use client";

import React, { createContext, useContext, useEffect, useState, useTransition, useCallback } from "react";
import { calculateDistance, defaultCities, formatDistance, type UserLocation } from "@/lib/location";
import { Icon } from "@/components/icon";
import type { LocationSearchResult } from "@/app/api/location/search/route";

interface LocationContextType {
  location: UserLocation | null;
  detecting: boolean;
  modalOpen: boolean;
  setModalOpen: (open: boolean) => void;
  detectGpsLocation: () => void;
  setCityLocation: (city: { name: string; latitude: number; longitude: number }) => void;
  setPreciseLocation: (loc: { name: string; latitude: number; longitude: number }) => void;
  setCustomLocation: (name: string) => void;
  clearLocation: () => void;
  getDistanceTo: (lat: number | null | undefined, lon: number | null | undefined) => string | null;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [, startTransition] = useTransition();

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("user_location_v1");
      if (saved) {
        setLocation(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  const saveLocation = (loc: UserLocation | null) => {
    setLocation(loc);
    try {
      if (loc) {
        localStorage.setItem("user_location_v1", JSON.stringify(loc));
      } else {
        localStorage.removeItem("user_location_v1");
      }
    } catch {
      // ignore
    }
  };

  const detectGpsLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      alert("Browser Anda belum mendukung pendeteksian lokasi GPS.");
      return;
    }

    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const newLoc: UserLocation = {
          name: "Lokasi GPS Anda",
          latitude: lat,
          longitude: lon,
          isAuto: true,
        };
        startTransition(() => {
          saveLocation(newLoc);
          setDetecting(false);
          setModalOpen(false);
        });
      },
      () => {
        setDetecting(false);
        alert("Tidak dapat mengakses GPS. Pastikan izin lokasi aktif di browser atau pilih wilayah secara manual.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const setCityLocation = (city: { name: string; latitude: number; longitude: number }) => {
    const newLoc: UserLocation = {
      name: city.name,
      latitude: city.latitude,
      longitude: city.longitude,
      isAuto: false,
    };
    saveLocation(newLoc);
    setModalOpen(false);
  };

  const setPreciseLocation = (loc: { name: string; latitude: number; longitude: number }) => {
    const newLoc: UserLocation = {
      name: loc.name,
      latitude: loc.latitude,
      longitude: loc.longitude,
      isAuto: false,
    };
    saveLocation(newLoc);
    setModalOpen(false);
  };

  const setCustomLocation = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const matched = defaultCities.find((c) => c.name.toLowerCase().includes(trimmed.toLowerCase()));
    const newLoc: UserLocation = {
      name: trimmed,
      latitude: matched ? matched.latitude : -6.2,
      longitude: matched ? matched.longitude : 106.816666,
      isAuto: false,
    };
    saveLocation(newLoc);
    setModalOpen(false);
  };

  const clearLocation = () => {
    saveLocation(null);
    setModalOpen(false);
  };

  const getDistanceTo = useCallback(
    (lat: number | null | undefined, lon: number | null | undefined): string | null => {
      if (!location || lat == null || lon == null) return null;
      const km = calculateDistance(location.latitude, location.longitude, lat, lon);
      return formatDistance(km);
    },
    [location]
  );

  return (
    <LocationContext.Provider
      value={{
        location,
        detecting,
        modalOpen,
        setModalOpen,
        detectGpsLocation,
        setCityLocation,
        setPreciseLocation,
        setCustomLocation,
        clearLocation,
        getDistanceTo,
      }}
    >
      {children}
      {modalOpen && <LocationModal />}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useLocation must be used within LocationProvider");
  return ctx;
}

function formatLocationDisplay(fullName: string | null | undefined): string {
  if (!fullName) return "Pilih Lokasi";
  const parts = fullName.split(",").map((s) => s.trim());
  if (parts.length >= 2) {
    const p1 = parts[0];
    const p2 = parts[1]
      .replace(/Kabupaten/i, "Kab.")
      .replace(/Kecamatan/i, "Kec.")
      .replace(/Provinsi/i, "")
      .trim();
    return `${p1}, ${p2}`;
  }
  return fullName;
}

/**
 * Top location indicator bar (desktop or responsive sub-bar)
 */
export function LocationBar({ fullWidth = false }: { fullWidth?: boolean }) {
  const { location, setModalOpen, detecting } = useLocation();

  if (fullWidth) {
    return (
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200/90 text-slate-800 text-xs font-semibold shadow-2xs hover:bg-slate-50 transition-all cursor-pointer"
        title={location ? `Lokasi Aktif: ${location.name} (Klik untuk ubah)` : "Ubah lokasi / cari toko terdekat"}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <Icon name="mapPin" size={14} className={location ? "text-emerald-600 shrink-0" : "text-slate-400 shrink-0"} />
          <span className="text-[11px] text-slate-500 font-normal shrink-0">Lokasi Anda:</span>
          <span className="truncate font-bold text-slate-900">
            {detecting ? "Mendeteksi GPS…" : location ? location.name : "Pilih Lokasi Terdekat"}
          </span>
        </div>
        <span className="text-[11px] text-teal-700 font-bold shrink-0 flex items-center gap-0.5">
          Ubah <Icon name="chevronDown" size={12} />
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setModalOpen(true)}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100/90 hover:bg-slate-200/80 text-slate-700 hover:text-slate-900 text-xs font-semibold transition-all max-w-[130px] sm:max-w-[150px] md:max-w-[180px] lg:max-w-[210px] cursor-pointer shrink border border-slate-200/70"
      title={location ? `Lokasi Aktif: ${location.name} (Klik untuk ubah)` : "Ubah lokasi / cari toko terdekat"}
    >
      <Icon name="mapPin" size={14} className={location ? "text-emerald-600 shrink-0" : "text-slate-400 shrink-0"} />
      <span className="truncate">
        {detecting
          ? "Mendeteksi…"
          : location
          ? formatLocationDisplay(location.name)
          : "Pilih Lokasi"}
      </span>
      <Icon name="chevronDown" size={12} className="text-slate-400 shrink-0" />
    </button>
  );
}

/**
 * Distance badge that automatically updates based on user location
 */
export function StoreDistanceBadge({
  lat,
  lon,
  className = "",
}: {
  lat?: number | null;
  lon?: number | null;
  className?: string;
}) {
  const { getDistanceTo } = useLocation();
  const distance = getDistanceTo(lat, lon);
  if (!distance) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs ${className}`}
      title={`Perkiraan jarak dari posisi Anda: ${distance}`}
    >
      <Icon name="mapPin" size={11} className="text-emerald-700" />
      <span>{distance}</span>
    </span>
  );
}

/**
 * Interactive Modal for setting location with real-time autocomplete suggestions
 */
function LocationModal() {
  const {
    location,
    detecting,
    setModalOpen,
    detectGpsLocation,
    setCityLocation,
    setPreciseLocation,
    setCustomLocation,
    clearLocation,
  } = useLocation();

  const [inputVal, setInputVal] = useState("");
  const [suggestions, setSuggestions] = useState<LocationSearchResult[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Debounced search to /api/location/search
  useEffect(() => {
    const query = inputVal.trim();
    if (query.length < 2) {
      setSuggestions([]);
      setLoadingSuggestions(false);
      return;
    }

    setLoadingSuggestions(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/location/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.results || []);
        }
      } catch {
        // ignore
      } finally {
        setLoadingSuggestions(false);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [inputVal]);

  const handleSelectSuggestion = (item: LocationSearchResult) => {
    setPreciseLocation({
      name: item.full_name || item.title,
      latitude: item.latitude,
      longitude: item.longitude,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-7 space-y-4 animate-sheet-in max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
              <Icon name="mapPin" size={19} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">Atur Lokasi Pengiriman & Toko</h3>
              <p className="text-[11px] text-slate-500">Ketik kecamatan, kelurahan, jalan, atau pilih kota</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        {/* GPS Button */}
        <button
          type="button"
          onClick={detectGpsLocation}
          disabled={detecting}
          className="w-full py-3 px-4 rounded-2xl bg-teal-50 hover:bg-teal-100/80 border border-teal-200/80 text-teal-900 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
        >
          {detecting ? (
            <>
              <span className="w-4 h-4 border-2 border-teal-700 border-t-transparent rounded-full animate-spin" />
              <span>Mencari Koordinat GPS…</span>
            </>
          ) : (
            <>
              <Icon name="sparkles" size={16} className="text-teal-700" />
              <span>Gunakan Lokasi Saya Saat Ini (GPS Otomatis)</span>
            </>
          )}
        </button>

        {/* Search Input with Autocomplete */}
        <div className="space-y-2">
          <label htmlFor="custom-loc" className="block text-xs font-semibold text-slate-700">
            Ketik Alamat, Kecamatan, atau Daerah
          </label>
          <div className="relative">
            <input
              id="custom-loc"
              type="text"
              placeholder="Contoh: Bojongsoang, Dago, Kebayoran, Malioboro..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && suggestions.length > 0) {
                  e.preventDefault();
                  handleSelectSuggestion(suggestions[0]);
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  setCustomLocation(inputVal);
                }
              }}
              className="w-full px-3.5 py-3 pr-10 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
              autoFocus
            />
            {loadingSuggestions && (
              <div className="absolute right-3 top-3.5">
                <span className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin block" />
              </div>
            )}
          </div>

          {/* Autocomplete Suggestions List */}
          {suggestions.length > 0 && (
            <div className="border border-teal-200/80 rounded-2xl overflow-hidden bg-white shadow-md divide-y divide-slate-100 max-h-56 overflow-y-auto">
              <div className="bg-teal-50/70 px-3 py-1.5 text-[11px] font-bold text-teal-800 flex items-center justify-between">
                <span>Pilih Wilayah Akurat Terdekat:</span>
                <span className="text-[10px] text-teal-600 font-normal">Database Google Maps / OSM</span>
              </div>
              {suggestions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectSuggestion(item)}
                  className="w-full text-left p-3 hover:bg-teal-50/50 transition-colors flex items-start gap-2.5 cursor-pointer group"
                >
                  <Icon name="mapPin" size={16} className="text-teal-700 mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-teal-800 transition-colors truncate">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      {item.subtitle}
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold text-teal-700 bg-teal-100/60 px-2 py-0.5 rounded-md shrink-0">
                    Pilih
                  </span>
                </button>
              ))}
            </div>
          )}

          {inputVal.trim().length >= 2 && !loadingSuggestions && suggestions.length === 0 && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <p className="text-xs text-slate-600">
                Tidak ditemukan hasil spesifik untuk &ldquo;{inputVal}&rdquo;.
              </p>
              <button
                type="button"
                onClick={() => setCustomLocation(inputVal)}
                className="mt-2 text-xs font-bold text-teal-700 hover:underline cursor-pointer"
              >
                Gunakan &ldquo;{inputVal}&rdquo; sebagai nama lokasi manual
              </button>
            </div>
          )}
        </div>

        {/* Quick City Presets */}
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
            Pilihan Kota Populer:
          </span>
          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto no-scrollbar">
            {defaultCities.map((city) => {
              const isActive = location?.name === city.name;
              return (
                <button
                  key={city.name}
                  type="button"
                  onClick={() => setCityLocation(city)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? "bg-teal-700 text-white shadow-2xs font-bold"
                      : "bg-slate-100 hover:bg-slate-200/80 text-slate-700"
                  }`}
                >
                  {city.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Location Info & Clear Option */}
        {location && (
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 truncate mr-2">
              Aktif: <strong className="text-slate-800">{location.name}</strong>
            </span>
            <button
              type="button"
              onClick={clearLocation}
              className="text-rose-600 hover:underline font-semibold cursor-pointer shrink-0"
            >
              Hapus Filter Lokasi
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
