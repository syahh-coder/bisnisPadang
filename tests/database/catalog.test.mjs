import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createCatalogDatabase, OWNER_ID, OTHER_OWNER_ID, ADMIN_ID } from "../support/catalog-database.mjs";

let db;
before(async () => { db = await createCatalogDatabase(); });
after(async () => { await db?.close(); });

async function asRole(role, callback) {
  await db.exec(`set role ${role}`);
  try { return await callback(); } finally { await db.exec("reset role"); }
}

test("anon dapat mencari nama toko/menu tanpa duplikasi, dengan filter kategori", async () => {
  await asRole("anon", async () => {
    const all = await db.query("select * from public.search_stores('', '')");
    assert.equal(all.rows.length, 5);
    assert.equal(all.rows[0].name, "Warung Bu Ani");
    const menu = await db.query("select * from public.search_stores('aYaM', '')");
    assert.deepEqual(menu.rows.map((row) => row.name), ["Warung Bu Ani", "Bakso Mang Ujang"]);
    const category = await db.query("select * from public.search_stores('kopi', 'makanan')");
    assert.equal(category.rows.length, 0);
    const literal = await db.query("select * from public.search_stores('%', '')");
    assert.equal(literal.rows.length, 0);
    const injection = await db.query("select * from public.search_stores($1, '')", ["'; drop table stores; --"]);
    assert.equal(injection.rows.length, 0);
    assert.equal((await db.query("select count(*)::int as total from public.stores")).rows[0].total, 5);
  });
});

test("anon dapat membaca katalog publik, tetapi tidak membaca profil atau ID pemilik", async () => {
  await asRole("anon", async () => {
    assert.equal((await db.query("select name from public.categories")).rows.length, 4);
    assert.equal((await db.query("select name from public.products")).rows.length, 11);
    await assert.rejects(db.query("select * from public.profiles"), /permission denied/);
    await assert.rejects(db.query("select owner_id from public.stores"), /permission denied/);
    await assert.rejects(db.query("update public.stores set name = 'Tidak boleh'"), /permission denied/);
    await assert.rejects(db.query("delete from public.products"), /permission denied/);
  });
});

test("pengguna login hanya membaca profil sendiri dan tidak dapat menaikkan role", async () => {
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [OWNER_ID]);
  await asRole("authenticated", async () => {
    const profiles = await db.query("select id, role from public.profiles");
    assert.deepEqual(profiles.rows, [{ id: OWNER_ID, role: "toko" }]);
    await assert.rejects(db.query("update public.profiles set role = 'admin'"), /admin|permission denied/);
    await assert.rejects(db.query("insert into public.categories(name, slug) values ('Baru', 'baru')"), /row-level security/);
  });
});

test("RLS aktif pada seluruh tabel dan RPC menggunakan security invoker", async () => {
  const tables = await db.query("select relname, relrowsecurity from pg_class where oid in ('public.profiles'::regclass, 'public.categories'::regclass, 'public.stores'::regclass, 'public.products'::regclass)");
  assert.equal(tables.rows.length, 4);
  assert.ok(tables.rows.every((table) => table.relrowsecurity));
  const fn = await db.query("select prosecdef from pg_proc where oid = 'public.search_stores(text,text)'::regprocedure");
  assert.equal(fn.rows[0].prosecdef, false);
});

test("pemilik hanya membaca/mengubah toko dan menu miliknya, tanpa memindahkan kepemilikan", async () => {
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [OWNER_ID]);
  const own = (await db.query("select id from public.stores where owner_id=$1 limit 1", [OWNER_ID])).rows[0].id;
  const other = (await db.query("select id from public.stores where owner_id=$1 limit 1", [OTHER_OWNER_ID])).rows[0].id;
  await asRole("authenticated", async () => {
    const visible = await db.query("select owner_id from public.stores");
    assert.equal(visible.rows.length, 3);
    assert.ok(visible.rows.every((row) => row.owner_id === OWNER_ID));
    assert.equal((await db.query("update public.stores set delivery_info=delivery_info where id=$1 returning id", [own])).rows.length, 1);
    assert.equal((await db.query("update public.stores set name='Diserang' where id=$1 returning id", [other])).rows.length, 0);
    await assert.rejects(db.query("update public.stores set owner_id=$1 where id=$2", [OTHER_OWNER_ID, own]), /pemilik|row-level security/);
    await assert.rejects(db.query("update public.products set store_id=$1 where store_id=$2", [other, own]), /row-level security/);
    await assert.rejects(db.query("insert into public.products(store_id,name,price) values ($1,'Dilarang',1)", [other]), /row-level security/);
    await assert.rejects(db.query("update public.stores set id=gen_random_uuid() where id=$1", [own]), /permission denied/);
  });
});

test("admin dapat membaca seluruh profil/toko dan mengubah data toko lain", async () => {
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [ADMIN_ID]);
  await asRole("authenticated", async () => {
    assert.equal((await db.query("select id from public.profiles")).rows.length, 3);
    assert.equal((await db.query("select id from public.stores")).rows.length, 5);
    assert.equal((await db.query("update public.stores set delivery_info=delivery_info returning id")).rows.length, 5);
  });
});

test("metadata role admin tidak meningkatkan role pengguna", async () => {
  const id = "10000000-0000-4000-8000-000000000004";
  await db.query("insert into auth.users(id,raw_user_meta_data) values ($1,$2)", [id, { name: "Percobaan", role: "admin" }]);
  try { assert.equal((await db.query("select role from public.profiles where id=$1", [id])).rows[0].role, "toko"); }
  finally { await db.query("delete from auth.users where id=$1", [id]); }
});

test("foto pemilik dibatasi path toko sendiri, termasuk saat nama objek diubah", async () => {
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [OWNER_ID]);
  const own = (await db.query("select id from public.stores where owner_id=$1 limit 1", [OWNER_ID])).rows[0].id;
  const other = (await db.query("select id from public.stores where owner_id=$1 limit 1", [OTHER_OWNER_ID])).rows[0].id;
  let objectId;
  try {
    await asRole("authenticated", async () => {
      const result = await db.query("insert into storage.objects(bucket_id,name) values ('store-media',$1) returning id", [`stores/${own}/foto.png`]);
      objectId = result.rows[0].id;
      await assert.rejects(db.query("insert into storage.objects(bucket_id,name) values ('store-media',$1)", [`stores/${other}/foto.png`]), /row-level security/);
      await assert.rejects(db.query("update storage.objects set name=$1 where id=$2", [`stores/${other}/foto.png`, objectId]), /row-level security/);
      await assert.rejects(db.query("insert into storage.objects(bucket_id,name) values ('store-media','stores/bukan-uuid/foto.png')"), /row-level security/);
    });
  } finally { if (objectId) await db.query("delete from storage.objects where id=$1", [objectId]); }
});
