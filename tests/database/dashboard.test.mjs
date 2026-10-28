import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createCatalogDatabase, OWNER_ID, OTHER_OWNER_ID, ADMIN_ID } from "../support/catalog-database.mjs";

let db, own, other, today, tomorrow;
before(async () => {
  db = await createCatalogDatabase();
  own = (await db.query("select id from public.stores where owner_id=$1 limit 1", [OWNER_ID])).rows[0].id;
  other = (await db.query("select id from public.stores where owner_id=$1 limit 1", [OTHER_OWNER_ID])).rows[0].id;
  const dates = (await db.query("select (now() at time zone 'Asia/Jakarta')::date as today,(now() at time zone 'Asia/Jakarta')::date+1 as tomorrow")).rows[0];
  today = dates.today; tomorrow = dates.tomorrow;
  await db.query("insert into public.daily_sales(store_id,date,revenue,sales_count) values($1,$2,90000,9)", [other, today]);
});
after(async () => { await db?.close(); });
async function as(role, id, callback) {
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id ?? ""]);
  await db.exec(`set role ${role}`);
  try { return await callback(); } finally { await db.exec("reset role"); }
}
const save = (store, date, revenue, count) => db.query("select public.save_daily_sales($1,$2,$3,$4) as id", [store, date, revenue, count]);

test("omset dan penjualan bersifat privat, anon tidak membaca atau menulis", async () => {
  await as("anon", null, async () => {
    await assert.rejects(db.query("select * from public.daily_sales"), /permission denied/);
    await assert.rejects(save(own, today, 10000, 1), /permission denied/);
  });
  assert.equal((await db.query("select relrowsecurity as enabled from pg_class where oid='public.daily_sales'::regclass")).rows[0].enabled, true);
  assert.equal((await db.query("select prosecdef from pg_proc where oid='public.save_daily_sales(uuid,date,numeric,integer)'::regprocedure")).rows[0].prosecdef, false);
});

test("pemilik menyimpan satu catatan per tanggal; simpan ulang memperbarui tanpa duplikasi", async () => {
  await as("authenticated", OWNER_ID, async () => {
    const first = (await save(own, today, 125000.50, 5)).rows[0].id;
    const second = (await save(own, today, 175000.75, 7)).rows[0].id;
    assert.equal(first, second);
    const rows = (await db.query("select store_id,revenue,sales_count from public.daily_sales")).rows;
    assert.equal(rows.length, 1);
    assert.equal(rows[0].store_id, own);
    assert.equal(Number(rows[0].revenue), 175000.75);
    assert.equal(rows[0].sales_count, 7);
  });
});

test("pemilik tidak mengakses atau mengubah catatan toko lain, termasuk melalui RPC", async () => {
  await as("authenticated", OWNER_ID, async () => {
    await assert.rejects(save(other, today, 1, 1), /row-level security/);
    assert.equal((await db.query("select * from public.daily_sales where store_id=$1", [other])).rows.length, 0);
    assert.equal((await db.query("update public.daily_sales set revenue=1 where store_id=$1 returning id", [other])).rows.length, 0);
    assert.equal((await db.query("delete from public.daily_sales where store_id=$1 returning id", [other])).rows.length, 0);
    await assert.rejects(db.query("update public.daily_sales set store_id=$1 where store_id=$2", [other, own]), /permission denied/);
    await assert.rejects(db.query("update public.daily_sales set date=$1 where store_id=$2", [tomorrow, own]), /permission denied/);
  });
});

test("database menolak tanggal mendatang, omset negatif, dan jumlah penjualan negatif; nol tetap valid", async () => {
  await as("authenticated", OWNER_ID, async () => {
    await assert.rejects(save(own, tomorrow, 1000, 1), /Tanggal catatan/);
    await assert.rejects(save(own, today, -1, 1), /check constraint/);
    await assert.rejects(save(own, today, 1000, -1), /check constraint/);
    await save(own, today, 0, 0);
    const row = (await db.query("select revenue,sales_count from public.daily_sales")).rows[0];
    assert.equal(Number(row.revenue), 0);
    assert.equal(row.sales_count, 0);
  });
});

test("admin dapat mengelola seluruh catatan; pemilik hanya menghapus catatan sendiri", async () => {
  await as("authenticated", ADMIN_ID, async () => {
    assert.equal((await db.query("select store_id from public.daily_sales")).rows.length, 2);
    await save(other, today, 80000, 8);
  });
  await as("authenticated", OWNER_ID, async () => {
    assert.equal((await db.query("delete from public.daily_sales where store_id=$1 returning id", [own])).rows.length, 1);
    assert.equal((await db.query("select * from public.daily_sales")).rows.length, 0);
  });
  assert.equal((await db.query("select sales_count from public.daily_sales where store_id=$1", [other])).rows[0].sales_count, 8);
});
