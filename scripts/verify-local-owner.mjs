import assert from "node:assert/strict";
import { randomUUID, randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { createClient } from "@supabase/supabase-js";
import { chromium, expect } from "@playwright/test";
import { getLocalStatus, projectRoot, projectId, runProcess } from "./lib/local-supabase.mjs";

const marker = `owner-${randomUUID().slice(0, 8)}`;
const users = [], secrets = [], storeIds = [randomUUID(), randomUUID(), randomUUID()];
const baseURL = "http://127.0.0.1:3008";
let app, browser, service, lastPage;
let phase = "setup";
const sdk = (url, key) => createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a6WQAAAAASUVORK5CYII=", "base64");
async function submit(page, button) {
  const [response] = await Promise.all([page.waitForResponse((r) => r.request().method() === "POST" && r.url().startsWith(baseURL)), button.click()]);
  assert.ok(response.ok() || response.status() === 303, "Server Action harus selesai tanpa error");
}
async function fits(page) { assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Halaman melebar pada ${phase}`); }
async function capture(page, path) {
  await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); });
  await page.screenshot({ path, fullPage: true, animations: "disabled" });
}
async function sale(id, date) { return (await service.from("daily_sales").select("id,revenue,sales_count").eq("store_id", id).eq("date", date).maybeSingle()).data; }
async function login(page, user) {
  await page.goto(`${baseURL}/akun`);
  await page.getByLabel("Email", { exact: true }).fill(user.email);
  await page.getByLabel("Kata sandi", { exact: true }).fill(user.password);
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await expect(page).toHaveURL(/\/portal\/toko(?:\?toko=[a-f0-9-]{36})?$/);
}
try {
  const status = await getLocalStatus();
  const key = status.PUBLISHABLE_KEY || status.ANON_KEY;
  service = sdk(status.API_URL, status.SERVICE_ROLE_KEY);
  for (const role of ["toko", "toko", "toko", "admin"]) {
    const email = `${marker}-${users.length}@tokolokal.test`, password = randomBytes(24).toString("base64url");
    secrets.push(password);
    const result = await service.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name: `Penguji toko ${users.length}` } });
    assert.equal(result.error, null);
    users.push({ id: result.data.user.id, email, password, role });
  }
  await runProcess("docker", ["exec", "-i", `supabase_db_${projectId}`, "psql", "-U", "postgres", "-d", "postgres", "-X", "-q", "-v", "ON_ERROR_STOP=1"], { input: `update public.profiles set role='admin' where id='${users[3].id}';` });
  const category = (await service.from("categories").select("id").eq("slug", "makanan").single()).data.id;
  const names = [`${marker} A Utama`, `${marker} B Cabang`, `${marker} Milik orang lain`];
  assert.equal((await service.from("stores").insert(storeIds.map((id, i) => ({ id, owner_id: users[i === 2 ? 1 : 0].id, category_id: category, name: names[i], slug: `${marker}-store-${i}`, manager_name: "Pengelola uji", phone: "6281234567890", address: "Alamat toko uji, Padang" })))).error, null);
  const dates = await runProcess("docker", ["exec", "-i", `supabase_db_${projectId}`, "psql", "-U", "postgres", "-d", "postgres", "-X", "-A", "-t", "-v", "ON_ERROR_STOP=1"], { input: "select to_char((now() at time zone 'Asia/Jakarta')::date,'YYYY-MM-DD') || ',' || to_char((now() at time zone 'Asia/Jakarta')::date-1,'YYYY-MM-DD') || ',' || to_char((now() at time zone 'Asia/Jakarta')::date+1,'YYYY-MM-DD');" });
  const [today, yesterday, tomorrow] = dates.trim().split(",");
  assert.equal((await service.from("daily_sales").insert({ store_id: storeIds[2], date: today, revenue: 999999, sales_count: 99 })).error, null);
  const owner = sdk(status.API_URL, key);
  assert.equal((await owner.auth.signInWithPassword(users[0])).error, null);
  const attempts = await Promise.all([1, 2].map((n) => owner.rpc("save_daily_sales", { shop_id: storeIds[0], sales_date: today, total_revenue: n * 1000, total_sales: n })));
  assert.ok(attempts.every((r) => !r.error));
  assert.equal(attempts[0].data, attempts[1].data);
  assert.ok((await owner.rpc("save_daily_sales", { shop_id: storeIds[2], sales_date: today, total_revenue: 1, total_sales: 1 })).error);
  assert.ok((await owner.rpc("save_daily_sales", { shop_id: storeIds[0], sales_date: tomorrow, total_revenue: 1, total_sales: 1 })).error);
  assert.ok((await sdk(status.API_URL, key).from("daily_sales").select("id")).error);
  const rows = await owner.from("daily_sales").select("store_id");
  assert.equal(rows.error, null); assert.ok(rows.data.every((r) => r.store_id !== storeIds[2]));
  const admin = sdk(status.API_URL, key);
  assert.equal((await admin.auth.signInWithPassword(users[3])).error, null);
  assert.equal((await admin.from("daily_sales").select("id").in("store_id", storeIds)).data.length, 2);
  console.log("Lulus: UPSERT bersamaan satu catatan, data omset privat, RLS pemilik/admin, dan tanggal mendatang ditolak.");

  app = spawn(process.execPath, [join(projectRoot, "node_modules/next/dist/bin/next"), "start", "--hostname", "127.0.0.1", "--port", "3008"], { cwd: projectRoot, windowsHide: true, stdio: "ignore", env: { ...process.env, CATALOG_MODE: "supabase", NEXT_PUBLIC_SUPABASE_URL: status.API_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key } });
  app.on("error", () => {});
  let ready = false;
  for (let i = 0; i < 100; i++) { if (app.exitCode !== null) break; try { if ((await fetch(`${baseURL}/akun`, { signal: AbortSignal.timeout(500) })).ok) { ready = true; break; } } catch {} await delay(250); }
  assert.ok(ready, "Build belum siap atau port 3008 terpakai.");
  browser = await chromium.launch();
  const output = join(projectRoot, "test-results/owner"); await mkdir(output, { recursive: true });
  for (const width of [360, 1440]) {
    phase = `dashboard ${width}px`;
    const context = await browser.newContext({ viewport: { width, height: 900 }, locale: "id-ID", reducedMotion: "reduce" });
    await context.route(/https:\/\/(maps\.google\.com|www\.google\.com)\//, (route) => route.fulfill({ body: "Peta diganti dalam tes" }));
    const page = await context.newPage(); lastPage = page;
    const errors = []; page.on("pageerror", (e) => errors.push(e.message));
    await login(page, users[0]);
    await expect(page).toHaveURL(/\?toko=[a-f0-9-]{36}$/);
    await page.goto(`${baseURL}/portal/toko?toko=${storeIds[0]}`);
    await expect(page.getByRole("heading", { name: "Portal Toko", exact: true })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Menu toko" }).getByRole("link")).toHaveCount(3);
    await expect(page.getByRole("navigation")).toHaveCount(1);
    await expect(page.getByText(names[2], { exact: true })).toHaveCount(0);
    await expect(page.getByRole("region", { name: "Statistik pengunjung hari ini", exact: true })).toBeVisible();
    let form = page.getByRole("form", { name: "Catatan omset dan penjualan", exact: true });
    await form.locator('[name="revenue"]').fill("125000.50"); await form.locator('[name="sales_count"]').fill("5");
    await submit(page, form.getByRole("button", { name: "Simpan catatan", exact: true }));
    await expect.poll(async () => Number((await sale(storeIds[0], today))?.revenue)).toBe(125000.5);
    await page.reload();
    await expect(form.locator('[name="revenue"]')).toHaveValue("125000.5");
    await form.locator('[name="revenue"]').fill("175000.75"); await form.locator('[name="sales_count"]').fill("7");
    await submit(page, form.getByRole("button", { name: "Simpan catatan", exact: true }));
    await expect.poll(async () => (await sale(storeIds[0], today))?.sales_count).toBe(7);
    assert.equal((await service.from("daily_sales").select("id", { count: "exact" }).eq("store_id", storeIds[0]).eq("date", today)).count, 1);
    await expect(form.getByRole("status")).toHaveText("Omset dan penjualan tersimpan.");
    await expect(page.getByRole("region", { name: "Ringkasan omset dan penjualan", exact: true }).getByRole("cell", { name: /175\.000,75/ }).first()).toBeVisible();
    await fits(page); await capture(page, join(output, `dashboard-${width}.png`));
    await page.goto(`${baseURL}/portal/toko?toko=${storeIds[0]}&tanggal=${yesterday}`);
    form = page.getByRole("form", { name: "Catatan omset dan penjualan", exact: true });
    await form.locator('[name="revenue"]').fill("0"); await form.locator('[name="sales_count"]').fill("0");
    await submit(page, form.getByRole("button", { name: "Simpan catatan", exact: true }));
    await expect.poll(async () => Number((await sale(storeIds[0], yesterday))?.revenue)).toBe(0);
    page.once("dialog", (dialog) => dialog.accept());
    await submit(page, page.getByRole("button", { name: "Hapus catatan", exact: true }));
    assert.equal(await sale(storeIds[0], yesterday), null);
    for (const path of ["/portal/toko", "/portal/toko/info", "/portal/toko/menu"]) {
      await page.goto(`${baseURL}${path}?toko=${storeIds[2]}`);
      await expect(page.locator("main").getByRole("alert")).toContainText("Toko tidak tersedia");
      await expect(page.locator('input[name="revenue"], input[name="name"]')).toHaveCount(0);
    }
    await page.goto(`${baseURL}/portal/toko?toko=${storeIds[0]}&tanggal=${tomorrow}`);
    await expect(page.locator("main").getByRole("alert")).toContainText("maksimal hari ini");
    await page.goto(`${baseURL}/portal/toko?toko=${storeIds[0]}`);
    const nav = page.getByRole("navigation", { name: "Menu toko", exact: true });
    await nav.getByRole("link", { name: "Info toko", exact: true }).click();
    phase = `info dan foto ${width}px`;
    form = page.getByRole("form", { name: "Edit info toko", exact: true });
    const newName = `${marker} Toko ${width}`, newSlug = `${marker}-toko-${width}`;
    await form.locator('[name="name"]').fill(newName);
    await form.locator('[name="slug"]').fill(`${marker}-store-2`);
    await submit(page, form.getByRole("button", { name: "Simpan info toko", exact: true }));
    await expect(form.getByRole("alert")).toContainText("Slug sudah digunakan");
    await expect(form.locator('[name="name"]')).toHaveValue(newName);
    await form.locator('[name="slug"]').fill(newSlug);
    await form.locator('[name="address"]').fill(`Alamat toko ${width}, Padang`);
    await form.locator('[name="delivery_info"]').fill("Delivery radius 3 km");
    await form.locator('[name="latitude"]').fill("0"); await form.locator('[name="longitude"]').fill("100.386");
    await form.evaluate((element, foreign) => { for (const [name, value] of [["owner_id", foreign], ["role", "admin"]]) { const input = document.createElement("input"); input.type = "hidden"; input.name = name; input.value = value; element.append(input); } }, users[1].id);
    await submit(page, form.getByRole("button", { name: "Simpan info toko", exact: true }));
    await expect(form.getByRole("status")).toHaveText("Data toko tersimpan.");
    const savedStore = (await service.from("stores").select("owner_id,latitude,name,slug").eq("id", storeIds[0]).single()).data;
    assert.equal(savedStore.owner_id, users[0].id); assert.equal(Number(savedStore.latitude), 0); assert.equal(savedStore.slug, newSlug);
    assert.equal((await service.from("profiles").select("role").eq("id", users[0].id).single()).data.role, "toko");
    const photo = page.getByRole("form", { name: "Foto toko", exact: true });
    await photo.locator('[name="photo"]').setInputFiles({ name: "terlalu-besar.png", mimeType: "image/png", buffer: Buffer.alloc(4 * 1024 * 1024 + 1) });
    assert.equal(await photo.locator('[name="photo"]').evaluate((input) => input.checkValidity()), false, "Foto besar harus ditolak sebelum dikirim");
    await photo.locator('[name="photo"]').setInputFiles({ name: "bukan-foto.svg", mimeType: "image/svg+xml", buffer: Buffer.from("<svg></svg>") });
    await submit(page, photo.getByRole("button", { name: "Simpan foto", exact: true }));
    await expect(photo.getByRole("alert")).toContainText("Pilih foto");
    await photo.locator('[name="photo"]').setInputFiles({ name: "toko.png", mimeType: "image/png", buffer: png });
    await submit(page, photo.getByRole("button", { name: "Simpan foto", exact: true }));
    await expect(photo.getByRole("status")).toHaveText("Foto tersimpan.");
    await fits(page); await capture(page, join(output, `info-${width}.png`));

    phase = `menu dan foto produk ${width}px`;
    await nav.getByRole("link", { name: "Menu / Produk", exact: true }).click();
    const productName = `${marker} Nasi ${width}`, editedName = `${marker} Nasi lengkap ${width}`;
    const add = page.getByRole("form", { name: "Tambah menu", exact: true });
    await add.locator('[name="name"]').fill(productName); await add.locator('[name="price"]').fill("15000.50"); await add.locator('[name="sort_order"]').fill("1");
    await submit(page, add.getByRole("button", { name: "Tambah menu", exact: true }));
    const details = page.locator("details").filter({ has: page.getByText(productName, { exact: true }) });
    await details.locator("summary").click();
    const editProduct = details.getByRole("form", { name: `Edit menu ${productName}`, exact: true });
    await editProduct.locator('[name="name"]').fill(editedName); await editProduct.locator('[name="price"]').fill("17500.75");
    await submit(page, editProduct.getByRole("button", { name: "Simpan menu", exact: true }));
    const edited = page.locator("details").filter({ has: page.getByText(editedName, { exact: true }) });
    const productPhoto = edited.getByRole("form", { name: "Foto menu", exact: true });
    await productPhoto.locator('[name="photo"]').setInputFiles({ name: "menu.png", mimeType: "image/png", buffer: png });
    await submit(page, productPhoto.getByRole("button", { name: "Simpan foto", exact: true }));
    await expect(productPhoto.getByRole("status")).toHaveText("Foto tersimpan.");
    await fits(page); await capture(page, join(output, `menu-${width}.png`));
    const publicPage = await context.newPage();
    await publicPage.goto(`${baseURL}/toko/${newSlug}`);
    await expect(publicPage.getByRole("heading", { name: newName, exact: true })).toBeVisible();
    await expect(publicPage.getByText("Delivery radius 3 km", { exact: true })).toBeVisible();
    await expect(publicPage.getByText(editedName, { exact: true })).toBeVisible();
    const thumbnail = publicPage.getByRole("img", { name: `Foto menu ${editedName}`, exact: true });
    await thumbnail.scrollIntoViewIfNeeded();
    await expect.poll(() => thumbnail.evaluate((img) => img.complete && img.naturalWidth > 0)).toBe(true);
    await fits(publicPage); await publicPage.close();
    await submit(page, edited.getByRole("button", { name: "Hapus foto", exact: true }));
    await expect(edited.getByRole("button", { name: "Hapus foto", exact: true })).toHaveCount(0);
    page.once("dialog", (dialog) => dialog.accept());
    await submit(page, edited.getByRole("button", { name: "Hapus menu", exact: true }));
    await expect(page.getByText(editedName, { exact: true })).toHaveCount(0);
    await expect.poll(async () => (await service.from("products").select("id").eq("store_id", storeIds[0]).eq("name", editedName)).data.length).toBe(0);

    phase = `pilih cabang dan akun kosong ${width}px`;
    await page.goto(`${baseURL}/portal/toko`);
    const picker = page.locator("form.store-picker");
    await picker.getByRole("combobox").selectOption(storeIds[1]);
    await picker.getByRole("button", { name: "Tampilkan", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`toko=${storeIds[1]}`));
    await expect(page.getByRole("form", { name: "Catatan omset dan penjualan", exact: true }).locator('[name="revenue"]')).toHaveValue("");
    await expect(nav.getByRole("link", { name: "Info toko", exact: true })).toHaveAttribute("href", `/portal/toko/info?toko=${storeIds[1]}`);
    await Promise.all([page.waitForURL(/\/akun$/), page.getByRole("button", { name: "Keluar", exact: true }).click()]);
    await login(page, users[2]);
    await expect(page.getByRole("status")).toContainText("belum terhubung ke toko");
    await fits(page); await capture(page, join(output, `empty-${width}.png`));
    assert.deepEqual(errors, []);
    await context.close(); lastPage = null;
    console.log(`Lulus ${width}px: tiga menu, input/edit/hapus omset, nilai nol, privasi URL, edit info, validasi, foto toko/menu, hasil publik, hapus menu, pilih cabang, dan akun tanpa toko.`);
  }
} catch (error) {
  if (lastPage) await lastPage.screenshot({ path: join(projectRoot, "test-results/owner/failure.png"), fullPage: true, animations: "disabled" }).catch(() => {});
  let message = `${phase}: ${error.message}`;
  for (const secret of secrets) message = message.split(secret).join("[rahasia]");
  console.error(message.replace(/\beyJ[A-Za-z0-9._-]+/g, "[token]")); process.exitCode = 1;
} finally {
  await browser?.close();
  if (app?.pid && app.exitCode === null) { const closed = once(app, "close"); app.kill(); await Promise.race([closed, delay(5000)]); }
  if (service) {
    let failed = false;
    for (const id of storeIds) {
      const files = await service.storage.from("store-media").list(`stores/${id}`, { limit: 1000 });
      if (files.error) failed = true;
      else if (files.data?.length && (await service.storage.from("store-media").remove(files.data.map((file) => `stores/${id}/${file.name}`))).error) failed = true;
    }
    if ((await service.from("stores").delete().in("id", storeIds)).error) failed = true;
    for (const user of users) if ((await service.auth.admin.deleteUser(user.id)).error) failed = true;
    if (failed) { console.error("Sebagian data uji toko belum dibersihkan."); process.exitCode = 1; }
    else console.log("Data toko, omset, menu, foto, dan akun uji dibersihkan.");
  }
}
