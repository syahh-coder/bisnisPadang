import { createPublicSupabase } from "@/lib/supabase/public";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store, max-age=0", "X-Robots-Tag": "noindex, nofollow", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer" };
function message(status: 404 | 410 | 503) {
  const title = status === 410 ? "QR sudah kedaluwarsa" : status === 404 ? "QR tidak ditemukan" : "QR belum dapat dibuka";
  const description = status === 410 ? "Masa berlaku QR ini sudah berakhir. Anda tetap dapat mencari toko melalui Beranda." : status === 404 ? "Tautan QR ini tidak tersedia. Periksa kembali QR yang dipindai." : "Layanan belum dapat dihubungi. Coba buka kembali beberapa saat lagi.";
  return new Response(`<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${title} | Toko Lokal</title><style>body{margin:0;background:#fafaf9;color:#1c1917;font:16px/1.6 system-ui,sans-serif}main{max-width:480px;margin:64px auto;padding:0 16px}h1{font-size:24px;line-height:1.3}p{color:#78716c}a{display:inline-block;padding:12px 0;color:#0f766e;text-underline-offset:4px}a:focus-visible{outline:2px solid #0f766e;outline-offset:4px}</style></head><body><main><h1>${title}</h1><p>${description}</p><a href="/">Kembali ke Beranda</a></main></body></html>`, { status, headers: { ...headers, "Content-Type": "text/html; charset=utf-8", "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'" } });
}
export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!/^[a-f0-9]{32}$/.test(code)) return message(404);
  const client = createPublicSupabase();
  if (!client) return message(503);
  try {
    const result = await client.rpc("resolve_dynamic_qr", { qr_code: code }).abortSignal(AbortSignal.timeout(8_000));
    if (result.error) return message(503);
    const qr = result.data?.[0] as { status: string; slug: string | null } | undefined;
    if (!qr || qr.status === "missing") return message(404);
    if (qr.status === "expired") return message(410);
    if (qr.status !== "active" || !qr.slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(qr.slug)) return message(503);
    return new Response(null, { status: 307, headers: { ...headers, Location: `/toko/${qr.slug}?src=qr` } });
  } catch { return message(503); }
}
