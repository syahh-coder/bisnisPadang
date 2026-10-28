import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

export const OWNER_ID = "10000000-0000-4000-8000-000000000001";
export const OTHER_OWNER_ID = "10000000-0000-4000-8000-000000000002";
export const ADMIN_ID = "10000000-0000-4000-8000-000000000003";

export async function createCatalogDatabase() {
  const db = new PGlite();
  // Hanya lingkungan tes yang membuat pengganti schema Supabase Auth ini.
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin bypassrls;
    create schema auth;
    create table auth.users (id uuid primary key, raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth to authenticated;
  `);
  await db.exec("create schema storage; grant usage on schema storage to authenticated; create table storage.buckets(id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]); create table storage.objects(id uuid primary key default gen_random_uuid(), bucket_id text, name text); alter table storage.objects enable row level security;");
  const migration = await readFile(new URL("../../supabase/migrations/202610280001_public_catalog.sql", import.meta.url), "utf8");
  await db.exec(migration);
  await db.exec(await readFile(new URL("../../supabase/migrations/202610280002_store_photos.sql", import.meta.url), "utf8"));
  await db.exec(await readFile(new URL("../../supabase/migrations/202610280003_auth_roles.sql", import.meta.url), "utf8"));
  await db.exec(await readFile(new URL("../../supabase/migrations/202610280004_service_access.sql", import.meta.url), "utf8"));
  await db.exec(await readFile(new URL("../../supabase/migrations/202610280005_admin_affiliation.sql", import.meta.url), "utf8"));
  await db.exec(await readFile(new URL("../../supabase/migrations/202610280006_store_dashboard.sql", import.meta.url), "utf8"));
  await db.exec(await readFile(new URL("../../supabase/migrations/202610280007_qr_codes.sql", import.meta.url), "utf8"));
  await db.exec(await readFile(new URL("../../supabase/migrations/202610280008_store_visits.sql", import.meta.url), "utf8"));
  await db.query("insert into auth.users(id) values ($1), ($2), ($3)", [OWNER_ID, OTHER_OWNER_ID, ADMIN_ID]);
  await db.query("update public.profiles set role='admin' where id=$1", [ADMIN_ID]);
  await db.query("update public.profiles set name = case when id = $1 then 'Pemilik satu' else 'Pemilik dua' end where id in ($1, $2)", [OWNER_ID, OTHER_OWNER_ID]);

  const fixtures = [
    ["warung-bu-ani", "Warung Bu Ani", "makanan", "Jl. Andalas No. 12, Padang", "Delivery radius 5 km", ["Nasi liwet", "Ayam goreng", "Es teh"]],
    ["kopi-sudut", "Kopi Sudut", "minuman", "Jl. Ahmad Yani No. 5, Padang", "Delivery via ojek online", ["Kopi susu", "Americano"]],
    ["laundry-cepat", "Laundry Cepat", "jasa", "Jl. Veteran No. 20, Padang", "Antar jemput gratis", ["Cuci kiloan", "Setrika"]],
    ["toko-sembako-jaya", "Toko Sembako Jaya", "belanja", "Jl. Pasar Raya No. 3, Padang", "Belum melayani delivery", ["Beras 5 kg", "Minyak 1 L"]],
    ["bakso-mang-ujang", "Bakso Mang Ujang", "makanan", "Jl. Gajah Mada No. 8, Padang", "Delivery radius 3 km", ["Bakso urat", "Mie ayam"]],
  ];

  for (const [index, [slug, name, category, address, delivery, products]] of fixtures.entries()) {
    const result = await db.query(`
      insert into public.stores(slug, name, category_id, address, delivery_info, owner_id, created_at, phone, latitude, longitude, photo_path)
      values ($1, $2, (select id from public.categories where slug = $3), $4, $5, $6, now() - $7::integer * interval '1 day', $8, $9, $10, $11)
      returning id
    `, [slug, name, category, address, delivery, index % 2 === 0 ? OWNER_ID : OTHER_OWNER_ID, index, index === 2 ? "" : "081234567801", index === 0 ? -0.944 : null, index === 0 ? 100.386 : null, index === 0 ? "test/cover.png" : index === 1 ? "test/missing.png" : null]);
    for (const product of products) {
      await db.query("insert into public.products(store_id, name, price) values ($1, $2, 15000)", [result.rows[0].id, product]);
    }
  }
  return db;
}
