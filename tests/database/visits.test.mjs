import assert from "node:assert/strict";
import { after,before,test } from "node:test";
import { randomUUID } from "node:crypto";
import { createCatalogDatabase,OWNER_ID,OTHER_OWNER_ID,ADMIN_ID } from "../support/catalog-database.mjs";
let db,own,other;
before(async()=>{db=await createCatalogDatabase();own=(await db.query("select id from public.stores where owner_id=$1 limit 1",[OWNER_ID])).rows[0].id;other=(await db.query("select id from public.stores where owner_id=$1 limit 1",[OTHER_OWNER_ID])).rows[0].id;});
after(async()=>{await db?.close();});
async function as(role,id,callback){await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id??""]);await db.exec(`set role ${role}`);try{return await callback();}finally{await db.exec("reset role");}}
const record=(store,id,source)=>db.query("select public.record_store_visit($1,$2,$3) as inserted",[store,id,source]);

test("publik mencatat sumber valid melalui RPC, waktu server, dan ID yang sama tidak menggandakan hit",async()=>{
  const id=randomUUID();
  await as("anon",null,async()=>{
    assert.equal((await record(own,id,"qr")).rows[0].inserted,true);
    assert.equal((await record(own,id,"search")).rows[0].inserted,false);
    await record(own,randomUUID(),"google_maps");await record(own,randomUUID(),"search");
    await record(own,randomUUID(),"sumber-tidak-dikenal");
    await assert.rejects(db.query("select * from public.store_visits"),/permission denied/);
    await assert.rejects(db.query("select * from public.store_visit_summary($1)",[own]),/permission denied/);
    await assert.rejects(db.query("insert into public.store_visits(store_id,source) values($1,'qr')",[own]),/permission denied/);
  });
  const rows=(await db.query("select source,visited_at <= now() as server_time from public.store_visits order by source")).rows;
  assert.deepEqual(rows.map((r)=>r.source),["direct","google_maps","qr","search"]);assert.ok(rows.every((r)=>r.server_time));
});

test("statistik privat: pemilik hanya melihat toko sendiri, admin membaca semua; data kunjungan tidak dapat diedit",async()=>{
  await as("anon",null,()=>record(other,randomUUID(),"qr"));
  await as("authenticated",OWNER_ID,async()=>{
    assert.equal((await db.query("select id from public.store_visits")).rows.length,4);
    await assert.rejects(db.query("select * from public.store_visit_summary($1)",[other]),/Akses statistik/);
    await assert.rejects(db.query("update public.store_visits set source='direct'"),/permission denied/);
    await assert.rejects(db.query("delete from public.store_visits"),/permission denied/);
    await assert.rejects(db.query("insert into public.store_visits(store_id,source) values($1,'qr')",[own]),/permission denied/);
  });
  await as("authenticated",ADMIN_ID,async()=>{
    assert.equal((await db.query("select id from public.store_visits")).rows.length,5);
    const summary=(await db.query("select * from public.store_visit_summary($1)",[other])).rows;
    assert.equal(Number(summary.find((r)=>r.source==="qr").visits),1);
  });
});

test("batas hari WIB inklusif awal dan eksklusif akhir, tidak bergantung zona waktu sesi",async()=>{
  await db.query("delete from public.store_visits where store_id=$1",[own]);
  await db.query(`with boundary as (select ((now() at time zone 'Asia/Jakarta')::date)::timestamp at time zone 'Asia/Jakarta' as start)
    insert into public.store_visits(store_id,source,visited_at)
    select $1,source,start+offset_time from boundary cross join (values('qr',interval '-1 millisecond'),('google_maps',interval '0'),('search',interval '1 day -1 millisecond'),('direct',interval '1 day')) t(source,offset_time)`,[own]);
  await db.exec("set timezone='Pacific/Honolulu'");
  try{await as("authenticated",OWNER_ID,async()=>{
    const rows=(await db.query("select source,visits,visit_date::text as visit_date from public.store_visit_summary($1)",[own])).rows;
    assert.deepEqual(rows.map((r)=>[r.source,Number(r.visits)]),[["google_maps",1],["qr",0],["search",1],["direct",0]]);
    const today=(await db.query("select ((now() at time zone 'Asia/Jakarta')::date)::text as today")).rows[0].today;
    assert.ok(rows.every((r)=>r.visit_date===today));
  });}finally{await db.exec("set timezone='UTC'");}
});

test("toko hilang dan event kosong ditolak; RLS aktif dan penghapusan toko membersihkan kunjungan",async()=>{
  await as("anon",null,async()=>{
    await assert.rejects(record(randomUUID(),randomUUID(),"qr"),/Toko tidak ditemukan/);
    await assert.rejects(record(own,null,"qr"),/ID kunjungan/);
  });
  assert.equal((await db.query("select relrowsecurity from pg_class where oid='public.store_visits'::regclass")).rows[0].relrowsecurity,true);
  assert.equal((await db.query("select prosecdef from pg_proc where oid='public.store_visit_summary(uuid)'::regprocedure")).rows[0].prosecdef,false);
  await db.query("delete from public.stores where id=$1",[own]);
  assert.equal((await db.query("select id from public.store_visits where store_id=$1",[own])).rows.length,0);
});
