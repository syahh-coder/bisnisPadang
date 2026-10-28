import { expect, test } from "@playwright/test";

test("QR tidak valid memberi halaman 404 yang terbaca di HP dan desktop", async ({ page }) => {
  const response = await page.goto("/q/kode-tidak-valid");
  expect(response?.status()).toBe(404);
  expect(response?.headers()["cache-control"]).toContain("no-store");
  await expect(page.getByRole("heading", { name: "QR tidak ditemukan", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Kembali ke Beranda", exact: true })).toHaveAttribute("href", "/");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("gangguan resolver dan backend kosong ditampilkan sebagai 503", async ({ page }) => {
  for (const base of ["http://127.0.0.1:3000", "http://127.0.0.1:3002"]) {
    const response = await page.goto(`${base}/q/${"0".repeat(32)}`);
    expect(response?.status()).toBe(503);
    await expect(page.getByRole("heading", { name: "QR belum dapat dibuka", exact: true })).toBeVisible();
    expect(response?.headers()["cache-control"]).toContain("no-store");
  }
});

test("unduhan PNG tidak terbuka untuk pengunjung tanpa sesi", async ({ request }) => {
  const response = await request.get("/portal/admin/qr/10000000-0000-4000-8000-000000000001/gambar?unduh=1", { maxRedirects: 0 });
  expect(response.status()).toBe(401);
  expect(response.headers()["content-type"]).toContain("application/json");
  expect(response.headers()["cache-control"]).toContain("no-store");
  expect((await response.json()).error).toContain("admin");
});
