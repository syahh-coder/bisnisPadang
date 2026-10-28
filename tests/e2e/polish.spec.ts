import { expect, test } from "@playwright/test";
import { collectRuntimeErrors } from "../support/browser-errors";

test("halaman publik tetap terbaca pada layar sempit, batas breakpoint, dan landscape", async ({ page, browserName }, testInfo) => {
  test.skip(testInfo.project.name !== "hp-360" && !testInfo.project.name.endsWith("-hp"), "Satu pemeriksaan rentang ukuran per browser.");
  test.setTimeout(90_000);
  const errors = await collectRuntimeErrors(page);
  await page.route("https://maps.google.com/**", (route) => route.fulfill({ contentType: "text/html", body: "<html lang='id'><body>Peta uji</body></html>" }));
  for (const [width, height] of [[320, 740], [360, 800], [639, 900], [640, 900], [768, 900], [1024, 900], [740, 360]]) {
    await page.setViewportSize({ width, height });
    for (const path of ["/", "/pencarian?q=ayam", "/akun", "/join-afiliasi", "/toko/warung-bu-ani"]) {
      await page.goto(path);
      await expect(page.locator("main h1")).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${browserName} ${width}x${height} ${path}`).toBe(true);
      const nav = page.getByRole("navigation", { name: width < 640 ? "Navigasi utama seluler" : "Navigasi utama", exact: true });
      await expect(nav).toBeVisible();
      await expect(nav.getByRole("link")).toHaveCount(3);
    }
    await page.screenshot({ path: testInfo.outputPath(`detail-${width}x${height}.png`), fullPage: true, animations: "disabled" });
  }
  expect(errors).toEqual([]);
});

test("halaman hilang dan ikon situs tersedia dengan tampilan Indonesia", async ({ page, request }) => {
  const response = await page.goto("/halaman-yang-tidak-ada");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Halaman tidak ditemukan", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Kembali ke Beranda", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Toko di sekitar Anda", exact: true })).toBeVisible();
  const icon = page.locator('link[rel="icon"]');
  await expect(icon).toHaveAttribute("href", /\/icon\.svg/);
  const image = await request.get((await icon.getAttribute("href"))!);
  expect(image.ok()).toBe(true);
  expect(image.headers()["content-type"]).toContain("image/svg+xml");
});
