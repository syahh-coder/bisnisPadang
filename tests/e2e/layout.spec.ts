import { expect, test } from "@playwright/test";
import { collectRuntimeErrors } from "../support/browser-errors";

test("halaman dasar terbuka tanpa error atau gulir horizontal", async ({ page }, testInfo) => {
  const errors = await collectRuntimeErrors(page);

  for (const [path, heading] of [
    ["/", "Toko di sekitar Anda"],
    ["/pencarian", "Pencarian"],
    ["/akun", "Akun"],
    ["/join-afiliasi", "Join Afiliasi"],
  ]) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
    expect(await page.locator("html").getAttribute("lang")).toBe("id");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await expect(page.getByRole("link", { name: "Join Afiliasi", exact: true })).toBeVisible();
  }

  await page.goto("/");
  await expect(page.getByRole("list", { name: "Daftar toko" })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("beranda.png"), fullPage: true, animations: "disabled" });
  expect(errors).toEqual([]);
});

test("navigasi mengikuti ukuran layar dan penanda halaman aktif", async ({ page, viewport }) => {
  await page.goto("/");
  const mobile = (viewport?.width ?? 0) < 640;
  const bottom = page.getByRole("navigation", { name: "Navigasi utama seluler", exact: true });
  const header = page.getByRole("navigation", { name: "Navigasi utama", exact: true });
  const activeNav = mobile ? bottom : header;

  await expect(mobile ? bottom : header).toBeVisible();
  await expect(mobile ? header : bottom).toBeHidden();

  if (mobile) {
    const searchCircle = bottom.getByRole("link", { name: "Pencarian" }).locator(".nav-icon");
    await expect(searchCircle).toHaveCSS("width", "56px");
    await expect(searchCircle).toHaveCSS("height", "56px");
    const bounds = await bottom.boundingBox();
    expect(bounds && bounds.y + bounds.height <= (viewport?.height ?? 0)).toBeTruthy();
  }

  for (const label of ["Pencarian", "Akun", "Beranda"]) {
    await activeNav.getByRole("link", { name: label, exact: true }).click();
    await expect(activeNav.getByRole("link", { name: label, exact: true })).toHaveAttribute("aria-current", "page");
    await expect(activeNav.locator('[aria-current="page"]')).toHaveCount(1);
    if (mobile) {
      const link = activeNav.getByRole("link", { name: label, exact: true });
      await expect.poll(async () => {
        const indicator = await activeNav.locator(".nav-indicator").boundingBox();
        const current = await link.boundingBox();
        return indicator && current ? Math.abs(indicator.x - current.x) : 100;
      }).toBeLessThan(2);
    }
  }

  await page.getByRole("link", { name: "Masuk", exact: true }).click();
  await expect(page).toHaveURL(/\/akun$/);
  await page.getByRole("link", { name: "Join Afiliasi", exact: true }).click();
  await expect(page).toHaveURL(/\/join-afiliasi$/);
});

test("preferensi gerak dikurangi dan akses keyboard dihormati", async ({ page, browserName }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".page-view")).toHaveCSS("animation-name", "none");
  await expect(page.locator(".nav-indicator")).toHaveCSS("transition-duration", "0s");
  // Default WebKit Windows men-tab kolom form saja (preferensi tabsToLinks).
  // Periksa aktivasi keyboard tautan secara eksplisit pada engine tersebut.
  if (browserName === "webkit") await page.getByRole("link", { name: "Langsung ke konten" }).focus();
  else await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Langsung ke konten" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("main")).toBeFocused();
});
