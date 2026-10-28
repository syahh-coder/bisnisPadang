import QRCode from "qrcode";
import { getAccount } from "@/lib/auth/server";
import { createSessionSupabase } from "@/lib/supabase/session";
import { uuid } from "@/lib/affiliation";
import { qrColumns, qrTarget, type QRRecord } from "@/lib/qr/format";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "X-Robots-Tag": "noindex, nofollow", "Referrer-Policy": "no-referrer" };

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const account = await getAccount();
  if (account.status !== "ready") return Response.json({ error: "Silakan masuk sebagai admin." }, { status: account.status === "unavailable" ? 503 : 401, headers });
  if (account.account.role !== "admin") return Response.json({ error: "Akses hanya untuk admin." }, { status: 403, headers });
  const { id } = await params;
  if (!uuid.test(id)) return Response.json({ error: "QR tidak ditemukan." }, { status: 404, headers });
  const client = await createSessionSupabase();
  if (!client) return Response.json({ error: "QR belum dapat dimuat." }, { status: 503, headers });
  const result = await client.from("qr_codes").select(qrColumns).eq("id", id).maybeSingle();
  if (result.error) return Response.json({ error: "QR belum dapat dimuat." }, { status: 503, headers });
  if (!result.data) return Response.json({ error: "QR tidak ditemukan." }, { status: 404, headers });
  const qr = result.data as QRRecord;
  const target = qrTarget(qr);
  if (!target) return Response.json({ error: "Alamat QR tidak valid." }, { status: 503, headers });
  try {
    const png = await QRCode.toBuffer(target, { type: "png", width: 320, margin: 4, errorCorrectionLevel: "M", color: { dark: "#000000ff", light: "#ffffffff" } });
    return new Response(new Uint8Array(png), { headers: { ...headers, "Content-Type": "image/png", "Content-Disposition": `${new URL(request.url).searchParams.get("unduh") === "1" ? "attachment" : "inline"}; filename="qr-${qr.kind}-${qr.id}.png"` } });
  } catch { return Response.json({ error: "Gambar QR belum dapat dibuat. Coba kembali." }, { status: 503, headers }); }
}
