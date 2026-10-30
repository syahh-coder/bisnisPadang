import type { Metadata } from "next";
import { createPublicSupabase } from "@/lib/supabase/public";
import { AffiliationForm } from "@/components/affiliation-form";
import { generateAvailableSlots, type Slot } from "@/lib/affiliation";
import { Icon } from "@/components/icon";

export const metadata: Metadata = {
  title: "Join Afiliasi UMKM — Gratis",
  description: "Daftarkan toko dan usaha lokal Anda di Toko Lokal secara gratis tanpa biaya.",
};

export const dynamic = "force-dynamic";

export default async function JoinPage() {
  const supabase = createPublicSupabase();
  let slots: Slot[] = [];

  if (supabase) {
    try {
      const result = await supabase.rpc("available_affiliation_slots").abortSignal(AbortSignal.timeout(6_000));
      if (!result.error && result.data && result.data.length > 0) {
        slots = result.data as Slot[];
      }
    } catch {
      // Fallback to generated slots
    }
  }

  // Fallback to dynamic real slots if Supabase has none or is in demo mode
  if (slots.length === 0) {
    slots = generateAvailableSlots();
  }

  return (
    <div className="max-w-2xl mx-auto py-4 sm:py-8 px-4 sm:px-0">
      <div className="text-center mb-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 mb-3">
          <Icon name="sparkles" size={14} /> 100% Gratis Tanpa Biaya
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
          Bergabung Sebagai Afiliasi
        </h1>
        <p className="text-slate-600 text-sm sm:text-base max-w-lg mx-auto">
          Dapatkan profil toko online, QR code eksklusif, dan jangkau lebih banyak pelanggan di daerah Anda.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
        <AffiliationForm slots={slots} />
      </div>
    </div>
  );
}
