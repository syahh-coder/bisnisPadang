import { expect, test } from "@playwright/test";

test("portal anonim mengarah ke login dan role tidak dapat dipilih dari URL", async ({ page }) => {
  await page.goto("/portal/admin");
  await expect(page).toHaveURL(/\/akun\?tujuan=admin/);
  await expect(page.getByRole("heading", { name: "Akun", exact: true })).toBeVisible();
  await expect(page.getByLabel("Email", { exact: true })).toBeEnabled();
  await expect(page.getByLabel("Kata sandi", { exact: true })).toHaveAttribute("type", "password");
  await page.goto("/portal/toko");
  await expect(page).toHaveURL(/\/akun\?tujuan=toko/);
  await expect(page.getByRole("heading", { name: "Portal Toko", exact: true })).toHaveCount(0);
});

test("login tanpa konfigurasi backend menampilkan keadaan tidak tersedia tanpa error", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const response = await page.goto("http://127.0.0.1:3002/akun");
  expect(response?.status()).toBe(200);
  await expect(page.getByText("Layanan masuk belum tersedia. Silakan coba lagi nanti.", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Masuk", exact: true })).toBeDisabled();
  expect(errors).toEqual([]);
});
