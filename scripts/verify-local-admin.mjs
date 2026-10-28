import assert from "node:assert/strict";
import { randomUUID, randomBytes, createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { createClient } from "@supabase/supabase-js";
import { chromium, expect } from "@playwright/test";
import { getLocalStatus, projectRoot, projectId, runProcess } from "./lib/local-supabase.mjs";

const marker = `admin-${randomUUID().slice(0, 8)}`;
const users = [], storeIds = [], requestIds = [], secrets = [], photos = [];
const baseURL = "http://127.0.0.1:3007";
let app, browser, service, lastPage;
const sdk = (url, key) => createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
async function fits(page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth ? [...document.querySelectorAll("body *")].filter((e) => e.getBoundingClientRect().right > innerWidth).slice(0, 12).map((e) => ({ tag: e.tagName, class: e.className, right: Math.round(e.getBoundingClientRect().right) })) : []);
  assert.deepEqual(overflow, [], "Halaman melebar keluar viewport");
}
async function submitAction(page, button) {
  const [response] = await Promise.all([page.waitForResponse((r) => r.request().method() === "POST" && r.url().startsWith(baseURL)), button.click()]);
  assert.ok(response.ok() || response.status() === 303, "Server Action harus selesai tanpa error");
}
try {
  const status = await getLocalStatus();
  const publicKey = status.PUBLISHABLE_KEY || status.ANON_KEY;
  service = sdk(status.API_URL, status.SERVICE_ROLE_KEY);
  const anon = sdk(status.API_URL, publicKey);
  for (const role of ["admin", "toko"]) {
    const email = `${marker}-${role}@tokolokal.test`, password = randomBytes(24).toString("base64url");
    secrets.push(password);
    const created = await service.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name: `Penguji ${role}` } });
    assert.equal(created.error, null);
    users.push({ id: created.data.user.id, email, password, role });
  }
  await runProcess("docker", ["exec", "-i", `supabase_db_${projectId}`, "psql", "-U", "postgres", "-d", "postgres", "-X", "-q", "-v", "ON_ERROR_STOP=1"], { input: `update public.profiles set role='admin' where id='${users[0].id}';` });

  const slots = await anon.rpc("available_affiliation_slots");
  assert.equal(slots.error, null);
  const slot = slots.data.at(-1);
  const token = randomBytes(32).toString("hex");
  secrets.push(token);
  const payload = { manager: `${marker} serentak`, phone: "6281234567890", shop_address: "Alamat uji reservasi bersamaan", booking_date: slot.appointment_date, booking_time: slot.appointment_time, note: "", token_hash: createHash("sha256").update(token).digest("hex") };
  const simultaneous = await Promise.all([anon.rpc("submit_affiliation", payload), anon.rpc("submit_affiliation", payload)]);
  assert.equal(simultaneous.filter((r) => !r.error).length, 1, "Hanya satu pemesanan serentak yang boleh berhasil");
  assert.equal(simultaneous.find((r) => r.error)?.error.code, "23505");
  const concurrentId = simultaneous.find((r) => !r.error).data;
  requestIds.push(concurrentId);
  assert.equal((await anon.rpc("cancel_affiliation", { request_id: concurrentId, token })).data, true);
  console.log("Lulus: perebutan slot secara bersamaan hanya menyimpan satu permohonan.");

  app = spawn(process.execPath, [join(projectRoot, "node_modules/next/dist/bin/next"), "start", "--hostname", "127.0.0.1", "--port", "3007"], { cwd: projectRoot, windowsHide: true, stdio: "ignore", env: { ...process.env, CATALOG_MODE: "supabase", NEXT_PUBLIC_SUPABASE_URL: status.API_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publicKey } });
  app.on("error", () => {});
  let ready = false;
  for (let i = 0; i < 100; i++) { if (app.exitCode !== null) break; try { if ((await fetch(`${baseURL}/join-afiliasi`, { signal: AbortSignal.timeout(500) })).ok) { ready = true; break; } } catch {} await delay(250); }
  assert.ok(ready, "Build belum siap atau port 3007 sedang terpakai.");
  browser = await chromium.launch();
  const output = join(projectRoot, "test-results/admin");
  await mkdir(output, { recursive: true });
  for (const width of [360, 1440]) {
    const visitor = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await visitor.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const manager = `${marker} Pengelola ${width}`;
    await page.goto(`${baseURL}/join-afiliasi`);
    const form = page.getByRole("form", { name: "Join Afiliasi", exact: true });
    await form.getByLabel("Nama pengelola").fill(manager);
    await form.getByLabel("Nomor WhatsApp").fill("081234567890");
    await form.getByLabel("Alamat toko").fill(`Alamat toko pengujian ${width}, Padang`);
    const date = await form.locator('select[name="date"] option').nth(1).getAttribute("value");
    await form.getByLabel("Tanggal janji temu").selectOption(date);
    await form.locator('select[name="time"]').selectOption({ index: 1 });
    await form.getByLabel("Catatan", { exact: false }).fill("Mohon hubungi melalui WhatsApp.");
    await fits(page);
    await page.screenshot({ path: join(output, `join-${width}.png`), fullPage: true, animations: "disabled" });
    await form.getByRole("button", { name: "Daftar gratis", exact: true }).click();
    await expect(page).toHaveURL(/\/join-afiliasi\/[a-f0-9-]{36}$/);
    const requestId = new URL(page.url()).pathname.split("/").at(-1);
    requestIds.push(requestId);
    const receiptURL = page.url();
    await expect(page.locator(".status-label")).toHaveText("menunggu");
    await expect(page.getByText(manager, { exact: true })).toBeVisible();
    const receiptCookie = (await visitor.cookies()).find((c) => c.name === `afiliasi-${requestId}`);
    assert.ok(receiptCookie?.httpOnly && receiptCookie.sameSite === "Lax");
    assert.equal(await page.evaluate(() => document.cookie.includes("afiliasi-")), false);
    const stranger = await browser.newContext();
    const otherPage = await stranger.newPage();
    await otherPage.goto(receiptURL);
    await expect(otherPage.getByText(manager, { exact: true })).toHaveCount(0);
    await expect(otherPage.getByRole("button", { name: "Batalkan janji temu" })).toHaveCount(0);
    await stranger.close();
    await page.screenshot({ path: join(output, `receipt-${width}.png`), fullPage: true, animations: "disabled" });

    const adminContext = await browser.newContext({ viewport: { width, height: 900 } });
    const adminPage = await adminContext.newPage();
    adminPage.on("pageerror", (error) => errors.push(error.message));
    await adminPage.goto(`${baseURL}/akun`);
    await adminPage.getByLabel("Email", { exact: true }).fill(users[0].email);
    await adminPage.getByLabel("Kata sandi", { exact: true }).fill(users[0].password);
    await adminPage.getByRole("button", { name: "Masuk", exact: true }).click();
    await expect(adminPage).toHaveURL(/\/portal\/admin$/);
    lastPage = adminPage;
    const nav = adminPage.getByRole("navigation", { name: "Menu admin", exact: true });
    await expect(nav.getByRole("link")).toHaveCount(3);
    await expect(adminPage.getByRole("navigation")).toHaveCount(1);
    await nav.getByRole("link", { name: "Pembuat QR", exact: true }).click();
    await expect(adminPage.getByRole("heading", { name: "Pembuat QR", exact: true })).toBeVisible();
    await fits(adminPage);
    await nav.getByRole("link", { name: "Kelola toko", exact: true }).click();
    const booking = adminPage.locator(".booking-list > li").filter({ has: adminPage.getByRole("heading", { name: manager, exact: true }) });
    await expect(booking).toBeVisible();
    await booking.getByRole("combobox").selectOption("dikonfirmasi");
    await submitAction(adminPage, booking.getByRole("button", { name: "Simpan status", exact: true }));
    await expect(booking.getByRole("alert")).toHaveCount(0);
    await expect(booking.getByRole("combobox")).toHaveValue("dikonfirmasi");
    await page.reload();
    await expect(page.locator(".status-label")).toHaveText("dikonfirmasi");
    await expect(page.getByRole("button", { name: "Batalkan janji temu" })).toHaveCount(0);
    await booking.getByRole("link", { name: "Tambahkan toko dari permohonan", exact: true }).click();
    const editor = adminPage.getByRole("form", { name: "Tambah toko", exact: true });
    await expect(editor.getByLabel("Nama pengelola", { exact: true })).toHaveValue(manager);
    await editor.getByLabel("Nama toko", { exact: true }).fill(`${marker} Toko ${width}`);
    await editor.getByLabel("Slug halaman toko", { exact: false }).fill(`${marker}-toko-${width}`);
    await editor.getByLabel("Akun pemilik", { exact: false }).selectOption(users[1].id);
    await editor.getByLabel("Kategori", { exact: false }).selectOption({ index: 1 });
    await editor.getByLabel("Info delivery", { exact: true }).fill("Ambil di toko");
    await editor.getByLabel("Nomor WhatsApp", { exact: true }).fill("nomor-salah");
    await submitAction(adminPage, editor.getByRole("button", { name: "Simpan toko", exact: true }));
    await expect(editor.getByRole("alert")).toBeVisible();
    await expect(editor.getByLabel("Nama toko", { exact: true })).toHaveValue(`${marker} Toko ${width}`);
    await expect(editor.getByRole("textbox", { name: /^Info delivery/ })).toHaveValue("Ambil di toko");
    await editor.getByLabel("Nomor WhatsApp", { exact: true }).fill("081234567890");
    await editor.getByRole("button", { name: "Simpan toko", exact: true }).click();
    await expect(adminPage).toHaveURL(/\/portal\/admin\/kelola\?toko=[a-f0-9-]{36}&tersimpan=1$/);
    const storeId = new URL(adminPage.url()).searchParams.get("toko");
    storeIds.push(storeId);
    const saved = await service.from("stores").select("manager_name,owner_id").eq("id", storeId).single();
    assert.equal(saved.data.owner_id, users[1].id);
    assert.equal(saved.data.manager_name, manager);
    assert.equal((await service.from("affiliation_requests").select("store_id").eq("id", requestId).single()).data.store_id, storeId);
    const edit = adminPage.getByRole("form", { name: "Edit toko", exact: true });
    await edit.getByRole("textbox", { name: /^Info delivery/ }).fill("Delivery radius 2 km");
    await edit.getByRole("button", { name: "Simpan toko", exact: true }).click();
    await expect(edit.getByRole("button", { name: "Simpan toko", exact: true })).toBeEnabled();
    await expect(edit.getByRole("textbox", { name: /^Info delivery/ })).toHaveValue("Delivery radius 2 km");
    const menu = adminPage.getByRole("form", { name: "Tambah menu", exact: true });
    await menu.getByLabel("Nama menu").fill("Nasi uji admin");
    await menu.getByLabel("Harga (Rp)").fill("15000");
    await menu.getByRole("button", { name: "Tambah menu", exact: true }).click();
    await expect(adminPage.getByRole("form", { name: "Edit menu Nasi uji admin", exact: true })).toBeVisible();
    const photo = adminPage.getByRole("form", { name: "Foto toko", exact: true });
    const photoInput = photo.locator('[name="photo"]');
    await photoInput.setInputFiles({ name: "terlalu-besar.png", mimeType: "image/png", buffer: Buffer.alloc(4 * 1024 * 1024 + 1) });
    assert.equal(await photoInput.evaluate((input) => input.checkValidity()), false, "Foto besar harus ditolak sebelum dikirim");
    await photoInput.evaluate((input) => input.setCustomValidity(""));
    await photo.getByRole("button", { name: "Simpan foto", exact: true }).click();
    await expect(photo.getByRole("alert")).toContainText("maksimal 4 MB");
    await photo.getByLabel("Foto toko", { exact: false }).setInputFiles({ name: "uji.png", mimeType: "image/png", buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a6WQAAAAASUVORK5CYII=", "base64") });
    await photo.getByRole("button", { name: "Simpan foto", exact: true }).click();
    await expect(photo.getByRole("status")).toHaveText("Foto toko tersimpan.");
    const photoPath = (await service.from("stores").select("photo_path").eq("id", storeId).single()).data.photo_path;
    photos.push(photoPath);
    assert.ok(photoPath.startsWith(`stores/${storeId}/`));
    await fits(adminPage);
    await adminPage.screenshot({ path: join(output, `manage-${width}.png`), fullPage: true, animations: "disabled" });
    await nav.getByRole("link", { name: "Daftar toko", exact: true }).click();
    await expect(adminPage.getByRole("link", { name: `${marker} Toko ${width}`, exact: true })).toBeVisible();
    await fits(adminPage);
    await adminPage.screenshot({ path: join(output, `list-${width}.png`), fullPage: true, animations: "disabled" });
    await page.route("https://maps.google.com/**", (route) => route.fulfill({ body: "Peta diganti saat tes" }));
    await page.goto(`${baseURL}/toko/${marker}-toko-${width}`);
    await expect(page.getByRole("heading", { name: `${marker} Toko ${width}`, exact: true })).toBeVisible();
    await expect(page.getByText("Nasi uji admin", { exact: true })).toBeVisible();
    await expect(page.getByText("Delivery radius 2 km", { exact: true })).toBeVisible();
    await page.goto(receiptURL);
    await adminPage.goto(`${baseURL}/portal/admin/kelola`);
    const currentBooking = adminPage.locator(".booking-list > li").filter({ has: adminPage.getByRole("heading", { name: manager, exact: true }) });
    await currentBooking.getByRole("combobox").selectOption("menunggu");
    await submitAction(adminPage, currentBooking.getByRole("button", { name: "Simpan status", exact: true }));
    await expect(currentBooking.getByRole("alert")).toHaveCount(0);
    await expect(currentBooking.getByRole("combobox")).toHaveValue("menunggu");
    await page.reload();
    await page.getByRole("button", { name: "Batalkan janji temu", exact: true }).click();
    await expect(page.locator(".status-label")).toHaveText("dibatalkan");
    assert.deepEqual(errors, [], "Browser tidak boleh mengalami exception");
    await adminContext.close();
    await visitor.close();
    console.log(`Lulus ${width}px: join, privasi konfirmasi, status, pembatalan, tiga menu admin, tambah/edit toko, menu, foto, dan katalog publik.`);
  }
} catch (error) {
  if (lastPage) {
    await lastPage.screenshot({ path: join(projectRoot, "test-results/admin/failure.png"), fullPage: true, animations: "disabled" }).catch(() => {});
  }
  let message = error.message;
  for (const secret of secrets) message = message.split(secret).join("[rahasia]");
  console.error(message.replace(/\beyJ[A-Za-z0-9._-]+/g, "[token]"));
  process.exitCode = 1;
} finally {
  await browser?.close();
  if (app?.pid && app.exitCode === null) { const closed = once(app, "close"); app.kill(); await Promise.race([closed, delay(5000)]); }
  if (service) {
    let failed = false;
    if (photos.length && (await service.storage.from("store-media").remove(photos)).error) failed = true;
    if (requestIds.length && (await service.from("affiliation_requests").delete().in("id", requestIds)).error) failed = true;
    if (storeIds.length && (await service.from("stores").delete().in("id", storeIds)).error) failed = true;
    for (const user of users) if ((await service.auth.admin.deleteUser(user.id)).error) failed = true;
    if (failed) { console.error("Pembersihan sebagian data uji admin belum berhasil."); process.exitCode = 1; }
    else console.log("Data reservasi, toko, foto, dan akun uji dibersihkan.");
  }
}
