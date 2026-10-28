import "server-only";
import { headers } from "next/headers";
import { localHost, validOrigin } from "./format";

export async function siteOrigin() {
  const configured = process.env["SITE_URL"];
  if (configured) return validOrigin(configured);
  // Hanya alamat lokal yang boleh diturunkan dari Host. Produksi memakai SITE_URL.
  try {
    const host = (await headers()).get("host");
    if (!host || /[\s/@?#\\]/.test(host)) return null;
    const url = new URL(`http://${host}`);
    return localHost(url.hostname) ? validOrigin(url.origin) : null;
  } catch { return null; }
}
