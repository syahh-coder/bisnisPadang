"use client";

import React, { createContext, useContext, useEffect, useState, useTransition } from "react";
import { calculateDistance, defaultCities, formatDistance, type UserLocation } from "@/lib/location";
import { Icon } from "@/components/icon";

interface LocationContextType {
  location: UserLocation | null;
  detecting: boolean;
  modalOpen: boolean;
  setModalOpen: (open: boolean) => void;
  detectGpsLocation: () => void;
  setCityLocation: (city: { name: string; latitude: number; longitude: number }) => void;
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
        alert("Tidak dapat mengakses GPS. Pastikan izin lokasi aktif atau pilih kota secara manual.");
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

  const setCustomLocation = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    // Cek apakah cocok dengan preset kota
    const matched = defaultCities.find((c) => c.name.toLowerCase().includes(trimmed.toLowerCase()));
    const newLoc: UserLocation = {
      name: trimmed,
      latitude: matched ? matched.latitude : -6.2088,
      longitude: matched ? matched.longitude : 106.8456,
      isAuto: false,
    };
    saveLocation(newLoc);
    setModalOpen(false);
  };

  const clearLocation = () => {
    saveLocation(null);
    setModalOpen(false);
  };

  const getDistanceTo = (lat: number | null | undefined, lon: number | null | undefined): string | null => {
    if (!location || location.latitude === null || location.longitude === null) return null;
    const dist = calculateDistance(location.latitude, location.longitude, lat, lon);
    return dist !== null ? formatDistance(dist) : null;
  };

  return (
    <LocationContext.Provider
      value={{
        location,
        detecting,
        modalOpen,
        setModalOpen,
        detectGpsLocation,
        setCityLocation,
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

/**
 * Top location indicator bar inside site header
 */
export function LocationBar() {
  const { location, setModalOpen, detecting } = useLocation();

  return (
    <button
      type="button"
      onClick={() => setModalOpen(true)}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/80 text-slate-700 hover:text-slate-900 text-xs font-medium transition-all max-w-[200px] sm:max-w-xs truncate cursor-pointer"
      title="Ubah lokasi / cari toko terdekat"
    >
      <Icon name="mapPin" size={14} className={location ? "text-emerald-600 shrink-0" : "text-slate-400 shrink-0"} />
      <span className="truncate">
        {detecting
          ? "Mendeteksi GPS…"
          : location
          ? location.name
          : "Pilih Lokasi Terdekat"}
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
 * Interactive Modal for setting location
 */
function LocationModal() {
  const {
    location,
    detecting,
    setModalOpen,
    detectGpsLocation,
    setCityLocation,
    setCustomLocation,
    clearLocation,
  } = useLocation();

  const [inputVal, setInputVal] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-7 space-y-5 animate-sheet-in">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <Icon name="mapPin" size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Atur Lokasi Anda</h3>
              <p className="text-[11px] text-slate-500">Tampilkan toko & kuliner terdekat dari posisi Anda</p>
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
              <span>Mencari Sinyal GPS…</span>
            </>
          ) : (
            <>
              <Icon name="sparkles" size={16} className="text-teal-700" />
              <span>Gunakan Lokasi Saya Saat Ini (GPS Otomatis)</span>
            </>
          )}
        </button>

        {/* Custom Input */}
        <div>
          <label htmlFor="custom-loc" className="block text-xs font-semibold text-slate-600 mb-1.5">
            Atau Ketik Kota / Alamat Manual
          </label>
          <div className="flex items-center gap-2">
            <input
              id="custom-loc"
              type="text"
              placeholder="Contoh: Jakarta Selatan, Dago Bandung..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  setCustomLocation(inputVal);
                }
              }}
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
            />
            <button
              type="button"
              onClick={() => setCustomLocation(inputVal)}
              className="px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs transition-colors cursor-pointer"
            >
              Terapkan
            </button>
          </div>
        </div>

        {/* Quick City Presets */}
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
            Pilihan Kota Populer:
          </span>
          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto no-scrollbar">
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

        {/* Clear Option */}
        {location && (
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Aktif: <strong className="text-slate-800">{location.name}</strong>
            </span>
            <button
              type="button"
              onClick={clearLocation}
              className="text-rose-600 hover:underline font-semibold cursor-pointer"
            >
              Hapus Filter Lokasi
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
