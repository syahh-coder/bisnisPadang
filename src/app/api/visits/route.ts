import { createPublicSupabase } from "@/lib/supabase/public";
import { uuid } from "@/lib/affiliation";
import { visitSource } from "@/lib/visits";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
const problem = (status: number, error: string) => Response.json({ error },{status,headers});

export async function POST(request: Request) {
  // Next dapat memakai hostname bind internal (0.0.0.0) pada request.url.
  // Bandingkan Origin browser dengan Host yang benar-benar diminta browser.
  try {
    const rawOrigin = request.headers.get("origin"), host = request.headers.get("host");
    if (!rawOrigin || !host || /[\s/@?#\\]/.test(host)) return problem(403,"Asal permintaan tidak valid.");
    const origin = new URL(rawOrigin);
    if (!["http:","https:"].includes(origin.protocol) || origin.origin !== rawOrigin || origin.host !== new URL(`${origin.protocol}//${host}`).host) return problem(403,"Asal permintaan tidak valid.");
  } catch { return problem(403,"Asal permintaan tidak valid."); }
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") return problem(415,"Gunakan format JSON.");
  if (Number(request.headers.get("content-length")) > 1024) return problem(413,"Permintaan terlalu besar.");
  let body: Record<string,unknown>;
  try {
    const reader = request.body?.getReader();
    if (!reader) return problem(400,"Data kunjungan tidak valid.");
    let bytes = 0, text = "";
    const decoder = new TextDecoder();
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > 1024) { await reader.cancel(); return problem(413,"Permintaan terlalu besar."); }
      text += decoder.decode(chunk.value,{stream:true});
    }
    const parsed: unknown = JSON.parse(text + decoder.decode());
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return problem(400,"Data kunjungan tidak valid.");
    body = parsed as Record<string,unknown>;
  } catch { return problem(400,"Data kunjungan tidak valid."); }
  if (typeof body.store_id !== "string" || !uuid.test(body.store_id) || typeof body.event_id !== "string" || !uuid.test(body.event_id)) return problem(400,"ID toko atau kunjungan tidak valid.");
  const client = createPublicSupabase();
  if (!client) return problem(503,"Pencatatan belum tersedia.");
  try {
    const result = await client.rpc("record_store_visit",{shop_id:body.store_id,event_id:body.event_id,visit_source:visitSource(body.source)}).abortSignal(AbortSignal.timeout(4000));
    if (result.error) return problem(result.error.code === "23503" ? 404 : 503,result.error.code === "23503" ? "Toko tidak ditemukan." : "Pencatatan belum tersedia.");
    return new Response(null,{status:204,headers});
  } catch { return problem(503,"Pencatatan belum tersedia."); }
}
