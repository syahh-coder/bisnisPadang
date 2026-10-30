import QRCode from "qrcode";
import { getAccount } from "@/lib/auth/server";
import { createSessionSupabase } from "@/lib/supabase/session";
import { uuid } from "@/lib/affiliation";
import { qrColumns, qrTarget, type QRRecord } from "@/lib/qr/format";
import { getAllDemoStores } from "@/lib/catalog/demo";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const headers = {
  "Cache-Control": "private, no-cache, no-store, must-revalidate",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow",
  "Referrer-Policy": "no-referrer",
};

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const account = await getAccount();
  if (account.status !== "ready" || account.account.role !== "admin") {
    // Return empty 1x1 transparent PNG or 401
    return new Response(null, { status: 401 });
  }

  const { id } = await params;
  const url = new URL(request.url);
  const explicitTarget = url.searchParams.get("target");

  let targetUrl = explicitTarget;

  if (!targetUrl && uuid.test(id)) {
    try {
      const client = await createSessionSupabase();
      if (client) {
        const result = await client.from("qr_codes").select(qrColumns).eq("id", id).maybeSingle();
        if (!result.error && result.data) {
          targetUrl = qrTarget(result.data as QRRecord);
        }
      }
    } catch {
      // ignore
    }

    if (!targetUrl) {
      // Fallback: check demo stores
      const demoStores = getAllDemoStores();
      const matchedStore = demoStores.find((s) => s.id === id);
      const origin = url.origin;
      if (matchedStore) {
        targetUrl = `${origin}/toko/${matchedStore.slug}?src=qr`;
      } else if (demoStores.length > 0) {
        targetUrl = `${origin}/toko/${demoStores[0].slug}?src=qr`;
      } else {
        targetUrl = `${origin}?src=qr`;
      }
    }
  }

  if (!targetUrl) {
    targetUrl = url.origin;
  }

  try {
    const png = await QRCode.toBuffer(targetUrl, {
      type: "png",
      width: 400,
      margin: 2,
      errorCorrectionLevel: "M",
      color: {
        dark: "#0f172aff",
        light: "#ffffffff",
      },
    });

    const isDownload = url.searchParams.get("unduh") === "1";
    return new Response(new Uint8Array(png), {
      headers: {
        ...headers,
        "Content-Type": "image/png",
        "Content-Disposition": `${isDownload ? "attachment" : "inline"}; filename="qr-${id}.png"`,
      },
    });
  } catch {
    return new Response(null, { status: 500 });
  }
}
