import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { createClient } from "@supabase/supabase-js";
import { chromium, expect } from "@playwright/test";
import { getLocalStatus, projectId, projectRoot, runProcess } from "./lib/local-supabase.mjs";

const ids = [randomUUID(), randomUUID()];
const userIds = [randomUUID(), randomUUID()];
const marker = `uji-${randomUUID().slice(0, 8)}`;
let browser;
let app;
let seeded = false;
let storageAdmin;
let uploaded = false;
const photoPath = `${marker}/cover.png`;

function sql(text) {
  return runProcess("docker", ["exec", "-i", `supabase_db_${projectId}`, "psql", "-U", "postgres", "-d", "postgres", "-X", "-q", "-v", "ON_ERROR_STOP=1"], { input: text });
}

async function waitForApp() {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (app.exitCode !== null) throw new Error("Server Next.js untuk verifikasi berhenti sebelum siap.");
    try {
      const response = await fetch("http://127.0.0.1:3004/akun", { signal: AbortSignal.timeout(500) });
      if (response.ok) return;
    } catch { /* Tunggu kesiapan server yang baru dimulai. */ }
    await delay(250);
  }
  throw new Error("Server verifikasi port 3004 tidak siap. Pastikan port tersebut kosong dan jalankan npm run build.");
}

try {
  const status = await getLocalStatus();
  const key = status.PUBLISHABLE_KEY || status.ANON_KEY;
  const client = createClient(status.API_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const categories = await client.from("categories").select("name,slug");
  assert.equal(categories.error, null, "Kategori harus dapat dibaca melalui API Supabase.");
  for (const slug of ["makanan", "minuman", "jasa", "belanja"]) {
    assert.ok(categories.data.some((category) => category.slug === slug));
  }
  const image = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a80sAAAAASUVORK5CYII=", "base64");
  const deniedUpload = await client.storage.from("store-media").upload(`${marker}/denied.png`, image, { contentType: "image/png" });
  assert.ok(deniedUpload.error, "Unggahan foto anonim harus ditolak.");
  storageAdmin = createClient(status.API_URL, status.SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const upload = await storageAdmin.storage.from("store-media").upload(photoPath, image, { contentType: "image/png" });
  assert.equal(upload.error, null, "Foto uji harus tersimpan di bucket lokal.");
  uploaded = true;

  // Dua toko ini milik pengujian saja; UUID acak dan cleanup tidak menyentuh toko lain.
  await sql(`
    begin;
    insert into public.stores(id, name, slug, category_id, address, delivery_info, phone, latitude, longitude, photo_path) values
      ('${ids[0]}', '${marker} Warung', '${marker}-warung', (select id from public.categories where slug = 'makanan'), 'Alamat uji otomatis, bukan toko sungguhan', 'Delivery uji', '+62 (812) 3456-7801', -0.944, 100.386, '${photoPath}'),
      ('${ids[1]}', '${marker} Kopi', '${marker}-kopi', (select id from public.categories where slug = 'minuman'), 'Alamat uji otomatis, bukan toko sungguhan', 'Ambil di toko', '', null, null, null);
    insert into public.products(store_id, name, price) values
      ('${ids[0]}', '${marker} ayam goreng', 15000);
    commit;
  `);
  seeded = true;

  const all = await client.rpc("search_stores", { search_text: marker, category_slug: "" }, { count: "exact" });
  assert.equal(all.error, null);
  assert.equal(all.count, 2);
  const menu = await client.rpc("search_stores", { search_text: `${marker} AYAM`, category_slug: "makanan" });
  assert.equal(menu.error, null);
  assert.deepEqual(menu.data.map((row) => row.id), [ids[0]]);
  const filtered = await client.rpc("search_stores", { search_text: marker, category_slug: "minuman" });
  assert.equal(filtered.error, null);
  assert.deepEqual(filtered.data.map((row) => row.id), [ids[1]]);
  const beyond = await client.rpc("search_stores", { search_text: marker, category_slug: "" }, { count: "exact" }).range(100, 119);
  assert.equal(beyond.error?.code, "PGRST103");

  for (const denied of [
    await client.from("profiles").select("id"),
    await client.from("stores").select("owner_id").eq("id", ids[0]),
    await client.from("stores").update({ name: "Tidak boleh" }).eq("id", ids[0]),
  ]) assert.ok(denied.error, "Akses privat dan penulisan anonim harus ditolak.");

  // Profil uji dan auth.users hanya ada dalam transaksi ini lalu di-ROLLBACK.
  await sql(`
    begin;
    insert into auth.users(id) values ('${userIds[0]}'), ('${userIds[1]}');
    update public.profiles set name='Profil uji' where id in ('${userIds[0]}', '${userIds[1]}');
    set local role authenticated;
    select set_config('request.jwt.claim.sub', '${userIds[0]}', true);
    do $check$
    begin
      if (select count(*) from public.profiles where id in ('${userIds[0]}', '${userIds[1]}')) <> 1 then
        raise exception 'RLS profil tidak membatasi pengguna ke profil sendiri';
      end if;
      begin
        update public.profiles set role = 'admin' where id = '${userIds[0]}';
        raise exception 'Pengguna dapat menaikkan role sendiri';
      exception when insufficient_privilege then null;
      end;
    end;
    $check$;
    rollback;
  `);
  console.log("Lulus: API PostgreSQL/PostgREST, pencarian toko/menu, kategori, dan RLS Supabase Docker.");

  app = spawn(process.execPath, [join(projectRoot, "node_modules/next/dist/bin/next"), "start", "--hostname", "127.0.0.1", "--port", "3004"], {
    cwd: projectRoot,
    windowsHide: true,
    stdio: ["ignore", "ignore", "ignore"],
    env: { ...process.env, CATALOG_MODE: "supabase", NEXT_PUBLIC_SUPABASE_URL: status.API_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key },
  });
  app.on("error", () => {});
  await waitForApp();
  browser = await chromium.launch();
  const outputDir = join(projectRoot, "test-results/local-db");
  await mkdir(outputDir, { recursive: true });

  for (const width of [360, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.route("https://maps.google.com/**", (route) => route.fulfill({ contentType: "text/html", body: "<html lang='id'><body>Peta uji</body></html>" }));
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`http://127.0.0.1:3004/pencarian?q=${marker}`);
    const list = page.getByRole("list", { name: "Daftar toko" });
    await expect(list.getByRole("listitem")).toHaveCount(2);
    await expect(page.getByRole("complementary", { name: "Data contoh" })).toHaveCount(0);
    await page.getByRole("navigation", { name: "Kategori toko" }).getByRole("link", { name: "Minuman", exact: true }).click();
    await expect(list.getByRole("listitem")).toHaveCount(1);
    await expect(page.getByRole("heading", { name: `${marker} Kopi`, exact: true })).toBeVisible();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: join(outputDir, `katalog-${width}.png`), fullPage: true, animations: "disabled" });
    await page.getByRole("link", { name: `Lihat toko ${marker} Kopi`, exact: true }).click();
    await expect(page.getByRole("heading", { name: `${marker} Kopi`, exact: true })).toBeVisible();
    await expect(page.getByText("Belum ada menu atau produk yang ditampilkan.", { exact: true })).toBeVisible();
    await expect(page.getByText("Nomor kontak belum tersedia.", { exact: true })).toBeVisible();
    await page.getByRole("link", { name: "Kembali ke hasil pencarian", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`q=${marker}&kategori=minuman$`));
    await page.goto(`http://127.0.0.1:3004/toko/${marker}-warung`);
    await expect(page.getByRole("heading", { name: `${marker} Warung`, exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "WhatsApp", exact: true })).toHaveAttribute("href", "https://wa.me/6281234567801");
    const photo = page.getByRole("img", { name: `Foto ${marker} Warung`, exact: true });
    await expect(photo).toBeVisible();
    await expect.poll(() => photo.evaluate((image) => image.naturalWidth)).toBeGreaterThan(0);
    await expect(page.getByRole("list", { name: "Menu dan produk toko" })).toContainText(`${marker} ayam goreng`);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: join(outputDir, `detail-${width}.png`), fullPage: true, animations: "disabled" });
    await page.goto(`http://127.0.0.1:3004/pencarian?q=${marker}&halaman=999`);
    await expect(page.getByText("Tidak ada toko di halaman ini", { exact: true })).toBeVisible();
    assert.deepEqual(errors, []);
    await page.close();
    console.log(`Lulus: landing page membaca Supabase Docker pada lebar ${width}px.`);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await browser?.close();
  if (app && app.exitCode === null && app.pid) {
    const closed = once(app, "close");
    app.kill();
    await Promise.race([closed, delay(5_000)]);
  }
  if (seeded) {
    try {
      await sql(`delete from public.stores where id in ('${ids[0]}', '${ids[1]}');`);
      console.log("Data uji sementara dibersihkan; data pengguna lain dipertahankan.");
    } catch (error) {
      console.error(`Pembersihan toko uji gagal: ${error.message}`);
      process.exitCode = 1;
    }
  }
  if (uploaded) {
    const cleanup = await storageAdmin.storage.from("store-media").remove([photoPath]);
    if (cleanup.error) { console.error("Pembersihan foto uji gagal."); process.exitCode = 1; }
    else console.log("Foto uji sementara dibersihkan dari Storage.");
  }
}
