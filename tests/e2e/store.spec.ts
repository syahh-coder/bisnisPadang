import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  // Uji URL/iframe peta tanpa bergantung pada jaringan Google atau consent browser.
  await page.route("https://maps.google.com/**", (route) => route.fulfill({ contentType: "text/html", body: "<html lang='id'><body>Peta uji</body></html>" }));
});

test("detail dari hasil pencarian menampilkan kontak, foto, peta, menu, dan dapat kembali", async ({ page }, testInfo) => {
  await page.goto("/pencarian?q=ayam&kategori=makanan");
  await page.getByRole("link", { name: "Lihat toko Warung Bu Ani", exact: true }).click();
  await expect(page).toHaveURL(/\/toko\/warung-bu-ani\?.*src=search/);
  await expect(page.getByRole("heading", { name: "Warung Bu Ani", exact: true })).toBeVisible();
  await expect(page).toHaveTitle("Warung Bu Ani | Toko Lokal");
  await expect(page.getByRole("link", { name: "WhatsApp", exact: true })).toHaveAttribute("href", "https://wa.me/6281234567801");
  await expect(page.getByRole("link", { name: "Telepon", exact: true })).toHaveAttribute("href", "tel:+6281234567801");
  const photo = page.getByRole("img", { name: "Foto Warung Bu Ani", exact: true });
  await expect(photo).toBeVisible();
  await expect.poll(() => photo.evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  const iframe = page.locator('iframe[title="Peta lokasi Warung Bu Ani"]');
  await expect(iframe).toBeVisible();
  expect(new URL((await iframe.getAttribute("src"))!).searchParams.get("q")).toBe("-0.944,100.386");
  const map = page.getByRole("link", { name: "Buka Google Maps", exact: true });
  expect(new URL((await map.getAttribute("href"))!).searchParams.get("query")).toBe("-0.944,100.386");
  const menu = page.getByRole("list", { name: "Menu dan produk toko" });
  await expect(menu.getByText("Ayam goreng", { exact: true })).toBeVisible();
  await expect(menu.getByRole("listitem")).toHaveCount(3);
  await expect(menu.getByRole("listitem").first()).toContainText(/Rp\s*15\.000/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("detail-toko.png"), fullPage: true, animations: "disabled" });
  await page.getByRole("link", { name: "Kembali ke hasil pencarian", exact: true }).click();
  await expect(page).toHaveURL(/\/pencarian\?q=ayam&kategori=makanan$/);
  await expect(page.getByRole("searchbox", { name: "Cari toko atau menu" })).toHaveValue("ayam");
});

test("foto gagal, nomor kosong, dan koordinat kosong mempunyai fallback", async ({ page }) => {
  await page.goto("/toko/kopi-sudut");
  await expect(page.getByText("Foto belum tersedia", { exact: true })).toBeVisible();
  await page.goto("/toko/laundry-cepat");
  await expect(page.getByText("Nomor kontak belum tersedia.", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "WhatsApp", exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Telepon", exact: true })).toHaveCount(0);
  const href = await page.getByRole("link", { name: "Buka Google Maps", exact: true }).getAttribute("href");
  expect(new URL(href!).searchParams.get("query")).toBe("Jl. Veteran No. 20, Padang");
});

test("toko tidak ada dan kembali eksternal tidak membuka situs lain", async ({ page }) => {
  await page.goto("/toko/toko-tidak-ada");
  await expect(page.getByRole("heading", { name: "Toko tidak ditemukan", exact: true })).toBeVisible();
  await expect(page.locator('head meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  for (const target of ["https://evil.example/", "//evil.example/", "/akun", "/%2f%2fevil.example/"]) {
    await page.goto(`/toko/warung-bu-ani?kembali=${encodeURIComponent(target)}`);
    await expect(page.getByRole("link", { name: "Kembali ke daftar toko", exact: true })).toHaveAttribute("href", "/");
  }
});

test("gangguan koneksi detail dibedakan dari toko tidak ditemukan", async ({ page }) => {
  await page.goto("/toko/toko-gagal-uji");
  await expect(page.getByRole("heading", { name: "Informasi toko belum tersedia", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Toko tidak ditemukan", exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Coba lagi", exact: true })).toBeVisible();
});

test("detail mode demo tetap dilabeli dan menu tidak berasal dari backend", async ({ page }) => {
  await page.goto("http://127.0.0.1:3002/toko/warung-bu-ani");
  await expect(page.getByRole("complementary", { name: "Data contoh" })).toContainText("fiktif");
  await expect(page.getByRole("list", { name: "Menu dan produk toko" }).getByRole("listitem")).toHaveCount(3);
  await expect(page.getByRole("list", { name: "Menu dan produk toko" }).getByRole("listitem").first()).toContainText(/Rp\s*18\.000/);
});
