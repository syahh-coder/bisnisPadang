import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { randomBytes, createHash } from "node:crypto";
import { createCatalogDatabase, OWNER_ID, ADMIN_ID } from "../support/catalog-database.mjs";

let db;
before(async () => { db = await createCatalogDatabase(); });
after(async () => { await db?.close(); });
async function as(role, id, callback) {
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id || ""]);
  await db.exec(`set role ${role}`);
  try { return await callback(); } finally { await db.exec("reset role"); }
}
const hash = (s) => createHash("sha256").update(s).digest("hex");
async function submit(slot, token, overrides = {}) {
  const fields = { manager: "Pengelola uji", phone: "6281234567890", address: "Alamat toko pengujian", note: "", ...overrides };
  const result = await db.query("select public.submit_affiliation($1,$2,$3,$4::date,$5::time,$6,$7) as id", [fields.manager, fields.phone, fields.address, slot.appointment_date, slot.appointment_time, fields.note, hash(token)]);
  return result.rows[0].id;
}
let firstSlot;
let firstId;
const firstToken = randomBytes(32).toString("hex");

test("slot publik hanya besok–14 hari dalam WIB, selain Minggu, tanpa data pemohon", async () => {
  await as("anon", null, async () => {
    const slots = await db.query("select *, appointment_date > (now() at time zone 'Asia/Jakarta')::date and appointment_date <= (now() at time zone 'Asia/Jakarta')::date+14 as valid, extract(dow from appointment_date) as weekday from public.available_affiliation_slots()");
    assert.ok(slots.rows.length >= 44);
    assert.ok(slots.rows.every((r) => r.valid && Number(r.weekday) !== 0));
    assert.ok(slots.rows.every((r) => ["09:00:00", "11:00:00", "13:00:00", "15:00:00"].includes(r.appointment_time)));
    firstSlot = slots.rows[0];
    await assert.rejects(db.query("select manager_name from public.affiliation_requests"), /permission denied/);
    await assert.rejects(db.query("select manager_name from public.stores"), /permission denied/);
    firstId = await submit(firstSlot, firstToken);
    assert.equal((await db.query("select * from public.available_affiliation_slots() where appointment_date=$1 and appointment_time=$2", [firstSlot.appointment_date, firstSlot.appointment_time])).rows.length, 0);
  });
});

test("database menolak jadwal lampau/lebih 14 hari/Minggu, slot invalid, WA dan catatan invalid", async () => {
  await as("anon", null, async () => {
    const dates = await db.query("select (now() at time zone 'Asia/Jakarta')::date as today, (now() at time zone 'Asia/Jakarta')::date+15 as late, next_sunday::date as sunday from (select d as next_sunday from generate_series((now() at time zone 'Asia/Jakarta')::date+1,(now() at time zone 'Asia/Jakarta')::date+14,interval '1 day') d where extract(dow from d)=0 limit 1) s");
    for (const date of Object.values(dates.rows[0])) await assert.rejects(submit({ ...firstSlot, appointment_date: date }, firstToken));
    await assert.rejects(submit({ ...firstSlot, appointment_time: "10:00" }, firstToken));
    await assert.rejects(submit(firstSlot, firstToken, { phone: "javascript:123", note: "x".repeat(201) }));
    await assert.rejects(db.query("update public.affiliation_requests set status='selesai' where id=$1", [firstId]), /permission denied/);
  });
});

test("slot duplikat ditolak, token salah tidak membuka data/membatalkan, pembatalan melepas slot", async () => {
  await as("anon", null, async () => {
    await assert.rejects(submit(firstSlot, randomBytes(32).toString("hex")), /duplicate key/);
    assert.equal((await db.query("select * from public.affiliation_receipt($1,$2)", [firstId, "f".repeat(64)])).rows.length, 0);
    assert.equal((await db.query("select public.cancel_affiliation($1,$2) as ok", [firstId, "f".repeat(64)])).rows[0].ok, false);
    const receipt = await db.query("select * from public.affiliation_receipt($1,$2)", [firstId, firstToken]);
    assert.equal(receipt.rows[0].manager_name, "Pengelola uji");
    assert.equal("cancellation_hash" in receipt.rows[0], false);
    assert.equal((await db.query("select public.cancel_affiliation($1,$2) as ok", [firstId, firstToken])).rows[0].ok, true);
    assert.equal((await db.query("select * from public.available_affiliation_slots() where appointment_date=$1 and appointment_time=$2", [firstSlot.appointment_date, firstSlot.appointment_time])).rows.length, 1);
  });
});

test("toko tidak melihat permohonan; admin mengonfirmasi, pemohon tidak bisa membatalkan setelah itu", async () => {
  const token = randomBytes(32).toString("hex");
  const id = await as("anon", null, () => submit(firstSlot, token));
  await as("authenticated", OWNER_ID, async () => {
    assert.equal((await db.query("select id from public.affiliation_requests")).rows.length, 0);
    assert.equal((await db.query("update public.affiliation_requests set status='selesai' where id=$1 returning id", [id])).rows.length, 0);
    await assert.rejects(db.query("select public.save_admin_store(null,'{}'::jsonb,null)"), /Hanya admin/);
  });
  await as("authenticated", ADMIN_ID, async () => {
    assert.equal((await db.query("update public.affiliation_requests set status='dikonfirmasi' where id=$1 returning id", [id])).rows.length, 1);
    await assert.rejects(db.query("select cancellation_hash from public.affiliation_requests"), /permission denied/);
  });
  await as("anon", null, async () => {
    assert.equal((await db.query("select public.cancel_affiliation($1,$2) as ok", [id, token])).rows[0].ok, false);
  });
});

test("admin menyimpan toko dan menautkan permohonan dalam satu transaksi", async () => {
  const slot = (await db.query("select * from public.available_affiliation_slots() limit 1")).rows[0];
  const id = await as("anon", null, () => submit(slot, randomBytes(32).toString("hex")));
  const category = (await db.query("select id from public.categories limit 1")).rows[0].id;
  await as("authenticated", ADMIN_ID, async () => {
    const details = { name: "Toko join", slug: "toko-join-uji", manager_name: "Pengelola join", owner_id: OWNER_ID, category_id: category, phone: "6281234567890", address: "Alamat toko join", delivery_info: "Ambil sendiri", latitude: "", longitude: "" };
    const saved = (await db.query("select public.save_admin_store(null,$1::jsonb,$2) as id", [JSON.stringify(details), id])).rows[0].id;
    assert.equal((await db.query("select store_id from public.affiliation_requests where id=$1", [id])).rows[0].store_id, saved);
    await assert.rejects(db.query("select public.save_admin_store(null,$1::jsonb,$2)", [JSON.stringify({ ...details, slug: "toko-duplikat-uji" }), id]), /sudah ditautkan/);
    assert.equal((await db.query("select id from public.stores where slug='toko-duplikat-uji'")).rows.length, 0);
    await db.query("select public.save_admin_store($1,$2::jsonb,null)", [saved, JSON.stringify({ ...details, name: "Toko diperbarui" })]);
    assert.equal((await db.query("select name from public.stores where id=$1", [saved])).rows[0].name, "Toko diperbarui");
  });
});
