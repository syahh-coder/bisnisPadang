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

const marker = `auth-${randomUUID().slice(0, 8)}`;
const storeIds = [randomUUID(), randomUUID()];
const users = [];
const secrets = [];
const mediaPaths = storeIds.map((id) => `stores/${id}/${marker}.png`);
let admin;
let app;
let browser;
const baseURL = "http://127.0.0.1:3005";

function sdk(url, key) { return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }); }

try {
  const status = await getLocalStatus();
  const publicKey = status.PUBLISHABLE_KEY || status.ANON_KEY;
  admin = sdk(status.API_URL, status.SERVICE_ROLE_KEY);
  for (const role of ["admin", "toko", "toko"]) {
    const email = `${marker}-${users.length}@tokolokal.test`;
    const password = randomBytes(24).toString("base64url");
    secrets.push(password);
    const created = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name: `Akun uji ${users.length}`, role: "admin" } });
    assert.equal(created.error, null, "Pembuatan akun uji gagal.");
    const id = created.data.user.id;
    users.push({ id, role, email, password });
    const profile = await admin.from("profiles").select("role").eq("id", id).single();
    assert.equal(profile.error, null, "Profil akun uji harus dapat dibaca alat pengelola.");
    assert.equal(profile.data?.role, "toko", "Metadata tidak boleh menaikkan role.");
  }
  await runProcess("docker", ["exec", "-i", `supabase_db_${projectId}`, "psql", "-U", "postgres", "-d", "postgres", "-X", "-q", "-v", "ON_ERROR_STOP=1"], {
    input: `update public.profiles set role='admin' where id='${users[0].id}';`,
  });
  const category = await admin.from("categories").select("id").eq("slug", "makanan").single();
  assert.equal(category.error, null);
  const stores = storeIds.map((id, index) => ({ id, owner_id: users[index + 1].id, category_id: category.data.id, name: `${marker} Toko ${index + 1}`, slug: `${marker}-toko-${index + 1}`, address: "Alamat uji otorisasi" }));
  assert.equal((await admin.from("stores").insert(stores)).error, null);
  const inserted = await admin.from("products").insert(storeIds.map((id) => ({ store_id: id, name: "Menu uji", price: 15000 }))).select("id,store_id");
  assert.equal(inserted.error, null);

  const owner = sdk(status.API_URL, publicKey);
  assert.equal((await owner.auth.signInWithPassword({ email: users[1].email, password: users[1].password })).error, null);
  const ownRows = await owner.from("stores").select("id,owner_id").in("id", storeIds);
  assert.deepEqual(ownRows.data?.map((row) => row.id), [storeIds[0]]);
  const foreignUpdate = await owner.from("stores").update({ name: "Diserang" }).eq("id", storeIds[1]).select("id");
  assert.equal(foreignUpdate.error, null);
  assert.equal(foreignUpdate.data.length, 0);
  assert.ok((await owner.from("profiles").update({ role: "admin" }).eq("id", users[1].id)).error);
  assert.ok((await owner.from("stores").update({ owner_id: users[2].id }).eq("id", storeIds[0])).error);
  assert.equal((await owner.from("stores").update({ delivery_info: "Delivery pemilik" }).eq("id", storeIds[0])).error, null);
  assert.ok((await owner.from("products").insert({ store_id: storeIds[1], name: "Diserang", price: 1 })).error);
  const ownProduct = inserted.data.find((product) => product.store_id === storeIds[0]);
  assert.ok((await owner.from("products").update({ store_id: storeIds[1] }).eq("id", ownProduct.id)).error);
  assert.equal((await owner.from("products").update({ price: 17000 }).eq("id", ownProduct.id)).error, null);
  const image = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a80sAAAAASUVORK5CYII=", "base64");
  assert.equal((await owner.storage.from("store-media").upload(mediaPaths[0], image, { contentType: "image/png" })).error, null);
  assert.ok((await owner.storage.from("store-media").upload(mediaPaths[1], image, { contentType: "image/png" })).error);
  assert.ok((await owner.storage.from("store-media").move(mediaPaths[0], mediaPaths[1])).error);
  const adminSession = sdk(status.API_URL, publicKey);
  assert.equal((await adminSession.auth.signInWithPassword({ email: users[0].email, password: users[0].password })).error, null);
  assert.equal((await adminSession.from("stores").select("id").in("id", storeIds)).data.length, 2);
  assert.equal((await adminSession.from("stores").update({ delivery_info: "Delivery admin" }).eq("id", storeIds[1])).error, null);
  const signup = await sdk(status.API_URL, publicKey).auth.signUp({ email: `${marker}-signup@tokolokal.test`, password: secrets[0] });
  if (signup.data.user) users.push({ id: signup.data.user.id });
  assert.ok(signup.error, "Signup publik harus nonaktif.");
  console.log("Lulus: role dari database, metadata diabaikan, RLS toko/menu/foto, akses admin, dan signup publik ditolak.");

  app = spawn(process.execPath, [join(projectRoot, "node_modules/next/dist/bin/next"), "start", "--hostname", "127.0.0.1", "--port", "3005"], {
    cwd: projectRoot, windowsHide: true, stdio: "ignore",
    env: { ...process.env, CATALOG_MODE: "supabase", NEXT_PUBLIC_SUPABASE_URL: status.API_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publicKey },
  });
  app.on("error", () => {});
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (app.exitCode !== null) break;
    try { if ((await fetch(`${baseURL}/join-afiliasi`, { signal: AbortSignal.timeout(500) })).ok) { ready = true; break; } } catch {}
    await delay(250);
  }
  assert.ok(ready, "Server verifikasi tidak siap; jalankan build dan pastikan port 3005 kosong.");
  browser = await chromium.launch();
  const output = join(projectRoot, "test-results/auth");
  await mkdir(output, { recursive: true });
  for (const width of [360, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    await page.goto(`${baseURL}/portal/admin`);
    await expect(page).toHaveURL(/\/akun\?tujuan=admin/);
    await page.getByLabel("Email", { exact: true }).fill(users[1].email);
    await page.getByLabel("Kata sandi", { exact: true }).fill("kata-sandi-salah");
    await page.getByRole("button", { name: "Masuk", exact: true }).click();
    await expect(page.getByRole("form", { name: "Masuk ke akun" }).getByRole("alert")).toContainText("Email atau kata sandi tidak sesuai.");
    await page.getByLabel("Email", { exact: true }).fill(users[1].email);
    await page.getByLabel("Kata sandi", { exact: true }).fill(users[1].password);
    await page.locator('form[aria-label="Masuk ke akun"]').evaluate((form) => {
      const field = document.createElement("input"); field.name = "role"; field.value = "admin"; field.type = "hidden"; form.append(field);
    });
    await page.getByRole("button", { name: "Masuk", exact: true }).click();
    await expect(page).toHaveURL(/\/portal\/toko$/);
    await expect(page.getByRole("heading", { name: "Portal Toko", exact: true })).toBeVisible();
    await expect(page.getByText(stores[0].name, { exact: true })).toBeVisible();
    await expect(page.getByText(stores[1].name, { exact: true })).toHaveCount(0);
    const authCookies = (await context.cookies()).filter((cookie) => cookie.name.startsWith("toko-lokal-auth"));
    assert.ok(authCookies.length && authCookies.every((cookie) => cookie.httpOnly && cookie.sameSite === "Lax"));
    const reloaded = await page.reload();
    assert.ok(reloaded.headers()["cache-control"].includes("no-store"));
    await expect(page.getByRole("heading", { name: "Portal Toko", exact: true })).toBeVisible();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: join(output, `toko-${width}.png`), fullPage: true, animations: "disabled" });
    await page.goto(`${baseURL}/portal/admin`);
    await expect(page).toHaveURL(/\/akun\?akses=ditolak/);
    await expect(page.locator('.auth-error[role="alert"]')).toContainText("Anda tidak memiliki akses");
    await page.getByRole("button", { name: "Keluar", exact: true }).click();
    await expect(page.getByLabel("Kata sandi", { exact: true })).toBeVisible();
    await page.goto(`${baseURL}/portal/toko`);
    await expect(page).toHaveURL(/\/akun\?tujuan=toko/);
    await page.getByLabel("Email", { exact: true }).fill(users[0].email);
    await page.getByLabel("Kata sandi", { exact: true }).fill(users[0].password);
    await page.getByRole("button", { name: "Masuk", exact: true }).click();
    await expect(page).toHaveURL(/\/portal\/admin$/);
    await expect(page.getByRole("heading", { name: "Portal Admin", exact: true })).toBeVisible();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: join(output, `admin-${width}.png`), fullPage: true, animations: "disabled" });
    await context.close();
    console.log(`Lulus: login/logout, sesi HttpOnly, role portal, dan layout ${width}px.`);
  }

  const refreshClient = sdk(status.API_URL, publicKey);
  const refreshLogin = await refreshClient.auth.signInWithPassword({ email: users[1].email, password: users[1].password });
  assert.equal(refreshLogin.error, null);
  const value = `base64-${Buffer.from(JSON.stringify({ ...refreshLogin.data.session, expires_at: 1 })).toString("base64url")}`;
  const refreshContext = await browser.newContext();
  await refreshContext.addCookies([{ name: "toko-lokal-auth", value, url: baseURL, httpOnly: true, sameSite: "Lax" }]);
  const refreshPage = await refreshContext.newPage();
  await refreshPage.goto(`${baseURL}/portal/toko`);
  await expect(refreshPage.getByRole("heading", { name: "Portal Toko", exact: true })).toBeVisible();
  assert.ok((await refreshContext.cookies()).some((cookie) => cookie.name.startsWith("toko-lokal-auth") && cookie.value !== value), "Sesi kedaluwarsa harus diperbarui lewat proxy.");
  await refreshContext.close();
  const forgedContext = await browser.newContext();
  await forgedContext.addCookies([{ name: "toko-lokal-auth", value: "base64-" + Buffer.from(JSON.stringify({ access_token: "forged", refresh_token: "forged", expires_at: Math.floor(Date.now() / 1000) + 3600, user: { id: users[0].id, role: "admin" } })).toString("base64url"), url: baseURL, httpOnly: true }]);
  const forgedPage = await forgedContext.newPage();
  await forgedPage.goto(`${baseURL}/portal/admin`);
  await expect(forgedPage).toHaveURL(/\/akun/);
  await expect(forgedPage.getByRole("heading", { name: "Portal Admin", exact: true })).toHaveCount(0);
  await forgedContext.close();
  console.log("Lulus: pembaruan sesi di proxy dan penolakan cookie palsu.");
} catch (error) {
  let message = error.message;
  for (const secret of secrets) message = message.split(secret).join("[rahasia]");
  console.error(message.replace(/\beyJ[A-Za-z0-9._-]+/g, "[token]"));
  process.exitCode = 1;
} finally {
  await browser?.close();
  if (app?.pid && app.exitCode === null) { const closed = once(app, "close"); app.kill(); await Promise.race([closed, delay(5000)]); }
  if (admin) {
    const files = await admin.storage.from("store-media").remove(mediaPaths);
    const stores = await admin.from("stores").delete().in("id", storeIds);
    let failed = Boolean(files.error || stores.error);
    for (const user of users) { if ((await admin.auth.admin.deleteUser(user.id)).error) failed = true; }
    if (failed) { console.error("Pembersihan data uji auth belum seluruhnya berhasil."); process.exitCode = 1; }
    else console.log("Akun, toko, menu, dan foto uji auth dibersihkan.");
  }
}
