import type { Metadata } from "next";
import { createPublicSupabase } from "@/lib/supabase/public";
import { AffiliationForm } from "@/components/affiliation-form";
import { generateAvailableSlots, type Slot } from "@/lib/affiliation";
import { Icon } from "@/components/icon";

export const metadata: Metadata = {
  title: "Daftarkan Usahamu — Gratis & Tanpa Potongan",
  description: "Buka profil toko online dan dapatkan QR code eksklusif untuk usahamu secara gratis di Toko Lokal.",
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
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 mb-3 shadow-2xs">
          <Icon name="sparkles" size={14} className="text-emerald-700" />
          <span>100% Gratis Tanpa Biaya Apapun</span>
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
          Buka Toko Online & Jangkau Pelanggan Dekatmu
        </h1>
        <p className="text-slate-600 text-sm sm:text-base max-w-lg mx-auto">
          Dapatkan katalog menu digital, QR code siap cetak untuk kasir/meja, dan terima pesanan langsung via WhatsApp tanpa potongan komisi!
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
        <AffiliationForm slots={slots} />
      </div>
    </div>
  );
}
