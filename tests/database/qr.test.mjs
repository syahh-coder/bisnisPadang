import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createCatalogDatabase, OWNER_ID, ADMIN_ID } from "../support/catalog-database.mjs";

let db, store, fixed, dynamic;
before(async () => { db = await createCatalogDatabase(); store = (await db.query("select id from public.stores where owner_id=$1 order by slug limit 1", [OWNER_ID])).rows[0].id; });
after(async () => { await db?.close(); });
async function as(role, id, callback) {
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id ?? ""]);
  await db.exec(`set role ${role}`);
  try { return await callback(); } finally { await db.exec("reset role"); }
}
const resolve = async (code) => (await db.query("select * from public.resolve_dynamic_qr($1)", [code])).rows;

test("hanya admin membuat QR, slug statis disalin dan QR statis tidak kedaluwarsa", async () => {
  await as("authenticated", OWNER_ID, async () => {
    assert.equal((await db.query("select id from public.qr_codes")).rows.length, 0);
    await assert.rejects(db.query("insert into public.qr_codes(store_id,kind,site_origin) values($1,'static','https://tokolokal.test')", [store]), /row-level security/);
  });
  await as("authenticated", ADMIN_ID, async () => {
    fixed = (await db.query("insert into public.qr_codes(store_id,kind,site_origin) values($1,'static','https://tokolokal.test') returning *", [store])).rows[0];
    assert.equal(fixed.expires_at, null);
    assert.match(fixed.code, /^[a-f0-9]{32}$/);
    assert.equal(fixed.target_slug, (await db.query("select slug from public.stores where id=$1", [store])).rows[0].slug);
    await assert.rejects(db.query("update public.qr_codes set expires_at=now()+interval '1 day' where id=$1", [fixed.id]), /check constraint/);
  });
});

test("masa berlaku dinamis bisa berbeda; database menerima tepat 15 hari dan menolak lebih dari batas", async () => {
  await as("authenticated", ADMIN_ID, async () => {
    dynamic = (await db.query("insert into public.qr_codes(store_id,kind,site_origin,expires_at) values($1,'dynamic','https://tokolokal.test',now()+interval '1 hour') returning *", [store])).rows[0];
    const maximum = (await db.query("insert into public.qr_codes(store_id,kind,site_origin,expires_at) values($1,'dynamic','https://tokolokal.test',now()+interval '15 days') returning created_at,expires_at", [store])).rows[0];
    assert.equal(new Date(maximum.expires_at) - new Date(maximum.created_at), 15 * 86400000);
    for (const interval of ["15 days 1 second", "-1 second"]) await assert.rejects(db.query("insert into public.qr_codes(store_id,kind,site_origin,expires_at) values($1,'dynamic','https://tokolokal.test',now()+$2::interval)", [store, interval]), /check constraint/);
    await assert.rejects(db.query("insert into public.qr_codes(store_id,kind,site_origin) values($1,'dynamic','https://tokolokal.test')", [store]), /check constraint/);
  });
});

test("pengubahan expiry tetap terikat tanggal pembuatan; metadata QR tidak dapat diubah lewat sesi admin", async () => {
  await as("authenticated", ADMIN_ID, async () => {
    await db.query("update public.qr_codes set expires_at=created_at+interval '15 days' where id=$1", [dynamic.id]);
    await assert.rejects(db.query("update public.qr_codes set expires_at=created_at+interval '15 days 1 second' where id=$1", [dynamic.id]), /check constraint/);
    await assert.rejects(db.query("update public.qr_codes set created_at=now() where id=$1", [dynamic.id]), /permission denied/);
    await assert.rejects(db.query("update public.qr_codes set kind='static',expires_at=null where id=$1", [dynamic.id]), /permission denied/);
    await assert.rejects(db.query("update public.qr_codes set target_slug='alamat-palsu' where id=$1", [fixed.id]), /permission denied/);
    await assert.rejects(db.query("insert into public.qr_codes(store_id,kind,site_origin,created_at) values($1,'static','https://tokolokal.test',now())", [store]), /permission denied/);
  });
});

test("publik hanya menukar kode dinamis; QR aktif mengikuti slug terbaru dan statis menyimpan slug lama", async () => {
  await db.query("update public.stores set slug='slug-setelah-qr' where id=$1", [store]);
  assert.notEqual((await db.query("select target_slug from public.qr_codes where id=$1", [fixed.id])).rows[0].target_slug, "slug-setelah-qr");
  await as("anon", null, async () => {
    await assert.rejects(db.query("select * from public.qr_codes"), /permission denied/);
    assert.deepEqual(await resolve(dynamic.code), [{ status: "active", slug: "slug-setelah-qr" }]);
    assert.deepEqual(await resolve(fixed.code), [{ status: "missing", slug: null }]);
    assert.deepEqual(await resolve("';drop table qr_codes;--"), [{ status: "missing", slug: null }]);
    assert.deepEqual(await resolve("0".repeat(32)), [{ status: "missing", slug: null }]);
  });
  await as("authenticated", OWNER_ID, async () => {
    assert.equal((await db.query("select id from public.qr_codes")).rows.length, 0);
    assert.equal((await db.query("update public.qr_codes set expires_at=now()+interval '1 day' where id=$1 returning id", [dynamic.id])).rows.length, 0);
    assert.equal((await db.query("delete from public.qr_codes returning id")).rows.length, 0);
  });
});

test("QR kedaluwarsa tidak membuka slug, dan penghapusan toko membuat resolver tidak ditemukan", async () => {
  const expired = (await db.query("insert into public.qr_codes(store_id,kind,site_origin,created_at,expires_at) values($1,'dynamic','https://tokolokal.test',now()-interval '2 days',now()-interval '1 day') returning code", [store])).rows[0];
  await as("anon", null, async () => { assert.deepEqual(await resolve(expired.code), [{ status: "expired", slug: null }]); });
  await db.query("delete from public.stores where id=$1", [store]);
  await as("anon", null, async () => { assert.deepEqual(await resolve(dynamic.code), [{ status: "missing", slug: null }]); });
  assert.equal((await db.query("select id from public.qr_codes where store_id=$1", [store])).rows.length, 0);
});
