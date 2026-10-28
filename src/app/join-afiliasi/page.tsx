import type { Metadata } from "next";
import { createPublicSupabase } from "@/lib/supabase/public";
import { AffiliationForm } from "@/components/affiliation-form";
import type { Slot } from "@/lib/affiliation";

export const metadata: Metadata = { title: "Join Afiliasi" };
export const dynamic = "force-dynamic";

export default async function JoinPage() {
  const supabase = createPublicSupabase();
  const result = supabase ? await supabase.rpc("available_affiliation_slots").abortSignal(AbortSignal.timeout(8_000)) : null;
  return <section className="page-view"><div className="page-heading"><h1>Join Afiliasi</h1><p>Gratis. Isi data toko dan pilih jadwal bertemu dengan pengelola Toko Lokal.</p></div>
    {!result || result.error ? <p role="alert" className="notice">Jadwal belum dapat dimuat. Coba kembali beberapa saat lagi.</p> : <><AffiliationForm slots={result.data as Slot[]} />{!result.data?.length && <p role="status">Semua jadwal terisi. Silakan cek kembali nanti.</p>}</>}
  </section>;
}
