import { expect, test } from "@playwright/test";

for (const path of ["/", "/pencarian"]) test(`ketikan sebelum JavaScript siap tetap tersimpan dan dapat dicari di ${path}`, async ({ page }) => {
  let release!: () => void;
  const ready = new Promise<void>((resolve) => { release = resolve; });
  await page.route(/\/_next\/static\/.*\.js(?:\?|$)/, async (route) => {
    await ready;
    await route.continue();
  });
  try {
    await page.goto(path, { waitUntil: "commit" });
    const input = page.getByRole("searchbox", { name: "Cari toko atau menu" });
    await input.fill("kOpI");
    release();
    await page.waitForLoadState("networkidle");
    await expect(input).toHaveValue("kOpI");
    if (path === "/") await input.press("Enter");
    await expect(page).toHaveURL(/\/pencarian\?q=kOpI/);
    await expect(page.getByRole("heading", { name: "Kopi Sudut", exact: true })).toBeVisible();
  } finally { release(); }
});

test("daftar toko dan filter kategori sesuai data katalog", async ({ page }) => {
  await page.goto("/");
  const list = page.getByRole("list", { name: "Daftar toko" });
  await expect(list.getByRole("listitem")).toHaveCount(5);
  await expect(page.getByRole("heading", { name: "Warung Bu Ani" })).toBeVisible();
  const categories = page.getByRole("navigation", { name: "Kategori toko" });
  await categories.getByRole("link", { name: "Makanan", exact: true }).click();
  await expect(page).toHaveURL(/kategori=makanan/);
  await expect(categories.getByRole("link", { name: "Makanan", exact: true })).toHaveAttribute("aria-current", "true");
  await expect(list.getByRole("listitem")).toHaveCount(2);
  await expect(page.getByRole("heading", { name: "Kopi Sudut" })).toHaveCount(0);

  await categories.getByRole("link", { name: "Semua", exact: true }).click();
  await expect(list.getByRole("listitem")).toHaveCount(5);
});

test("pencarian nama dan menu mengabaikan kapital serta mempertahankan kategori", async ({ page }) => {
  await page.goto("/");
  const input = page.getByRole("searchbox", { name: "Cari toko atau menu" });
  await input.fill("  kOpI  ");
  await input.press("Enter");
  await expect(page).toHaveURL(/\/pencarian\?q=kOpI/);
  await expect(page.getByRole("list", { name: "Daftar toko" }).getByRole("listitem")).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "Kopi Sudut" })).toBeVisible();

  await input.fill("aYaM");
  await expect(page.getByRole("list", { name: "Daftar toko" }).getByRole("listitem")).toHaveCount(2);
  await expect(page.getByRole("heading", { name: "Warung Bu Ani" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Bakso Mang Ujang" })).toBeVisible();
  await page.getByRole("navigation", { name: "Kategori toko" }).getByRole("link", { name: "Minuman", exact: true }).click();
  await expect(page).toHaveURL(/q=aYaM&kategori=minuman/);
  await expect(page.getByText("Toko tidak ditemukan", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Lihat semua toko", exact: true }).click();
  await expect(page.getByRole("list", { name: "Daftar toko" }).getByRole("listitem")).toHaveCount(5);
  await expect(input).toHaveValue("");
});

test("URL, muat ulang, dan riwayat browser mempertahankan pencarian", async ({ page }) => {
  await page.goto("/pencarian?q=kopi&kategori=minuman");
  const input = page.getByRole("searchbox", { name: "Cari toko atau menu" });
  await expect(input).toHaveValue("kopi");
  await expect(page.getByRole("heading", { name: "Kopi Sudut" })).toBeVisible();
  await page.reload();
  await expect(input).toHaveValue("kopi");
  await page.getByRole("navigation", { name: "Kategori toko" }).getByRole("link", { name: "Makanan", exact: true }).click();
  await expect(page.getByText("Toko tidak ditemukan", { exact: true })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("heading", { name: "Kopi Sudut" })).toBeVisible();
  await expect(input).toHaveValue("kopi");

  await page.goto("/pencarian?q=%25");
  await expect(page.getByText("Toko tidak ditemukan", { exact: true })).toBeVisible();
  await page.goto(`/pencarian?q=${encodeURIComponent("<script>alert('x')</script>")}`);
  await expect(page.getByText("Toko tidak ditemukan", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("respons pencarian lama tidak menimpa ketikan berikutnya", async ({ page }) => {
  await page.goto("/pencarian");
  await page.route("**/pencarian?**", async (route) => {
    if (new URL(route.request().url()).searchParams.get("q") === "kop") {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    await route.continue();
  });
  const input = page.getByRole("searchbox", { name: "Cari toko atau menu" });
  const firstRequest = page.waitForRequest((request) => new URL(request.url()).pathname === "/pencarian" && new URL(request.url()).searchParams.get("q") === "kop");
  await input.fill("kop");
  await firstRequest;
  await input.fill("kopi susu");
  await expect(page).toHaveURL(/q=kopi\+susu/);
  await expect(input).toHaveValue("kopi susu");
  await expect(page.getByRole("heading", { name: "Kopi Sudut" })).toBeVisible();
});

test("gangguan backend ditampilkan sebagai gangguan, bukan hasil kosong", async ({ page }) => {
  await page.goto("/pencarian?q=katalog-gagal-uji");
  await expect(page.getByText("Daftar toko belum tersedia", { exact: true })).toBeVisible();
  await expect(page.getByText("Toko tidak ditemukan", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Coba lagi", exact: true })).toBeVisible();
  await expect(page.getByText("catalog-test-publishable-key", { exact: false })).toHaveCount(0);
});

test("mode demo memberi label dan mendukung pencarian menu", async ({ page }) => {
  await page.goto("http://127.0.0.1:3002/");
  await expect(page.getByRole("complementary", { name: "Data contoh" })).toContainText("fiktif");
  await expect(page.getByRole("list", { name: "Daftar toko" }).getByRole("listitem")).toHaveCount(5);
  await page.goto("http://127.0.0.1:3002/pencarian?q=setrika&kategori=jasa");
  await expect(page.getByRole("heading", { name: "Laundry Cepat" })).toBeVisible();
  await expect(page.getByRole("list", { name: "Daftar toko" }).getByRole("listitem")).toHaveCount(1);
});

test("nomor halaman di luar hasil tidak dianggap sebagai gangguan koneksi", async ({ page }) => {
  await page.goto("/pencarian?q=kopi&halaman=999");
  await expect(page.getByText("Tidak ada toko di halaman ini", { exact: true })).toBeVisible();
  await expect(page.getByText("Daftar toko belum tersedia", { exact: true })).toHaveCount(0);
  await expect(page.getByText("1 toko", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Lihat semua toko", exact: true }).click();
  await expect(page.getByRole("list", { name: "Daftar toko" }).getByRole("listitem")).toHaveCount(5);
});
