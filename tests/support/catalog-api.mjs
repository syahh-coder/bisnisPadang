import { createServer } from "node:http";
import { createCatalogDatabase } from "./catalog-database.mjs";

// Pengganti HTTP PostgREST khusus tes. SQL dan RLS dijalankan oleh PostgreSQL
// PGlite, bukan hasil pencarian hardcoded. Server ini tidak dipakai aplikasi.
const db = await createCatalogDatabase();
const server = createServer(async (request, response) => {
  const url = new URL(request.url, "http://127.0.0.1:3101");
  const reply = (status, data, headers = {}) => {
    response.writeHead(status, { "Content-Type": "application/json", ...headers });
    response.end(JSON.stringify(data));
  };
  if (url.pathname === "/health") return reply(200, { ready: true });
  if (url.pathname === "/storage/v1/object/public/store-media/test/cover.png") {
    response.writeHead(200, { "Content-Type": "image/png" });
    return response.end(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a80sAAAAASUVORK5CYII=", "base64"));
  }
  if (url.pathname.startsWith("/storage/")) return reply(404, {});
  if (request.headers.apikey !== "catalog-test-publishable-key") return reply(401, { message: "Invalid API key" });

  try {
    if (url.pathname === "/rest/v1/categories") {
      const rows = await db.transaction(async (tx) => {
        await tx.exec("set local role anon");
        return (await tx.query("select id, name, slug from public.categories order by sort_order, name")).rows;
      });
      return reply(200, rows);
    }
    if (url.pathname === "/rest/v1/stores") {
      const slug = (url.searchParams.get("slug") ?? "").replace(/^eq\./, "");
      if (slug === "toko-gagal-uji") return reply(503, { message: "Test unavailable" });
      const rows = await db.transaction(async (tx) => {
        await tx.exec("set local role anon");
        return (await tx.query(`select s.id,s.slug,s.name,s.phone,s.address,s.delivery_info,s.photo_path,s.latitude,s.longitude,
          json_build_object('name', c.name, 'slug', c.slug) as categories
          from public.stores s join public.categories c on c.id=s.category_id where s.slug=$1`, [slug])).rows;
      });
      return reply(200, rows);
    }
    if (url.pathname === "/rest/v1/products") {
      const storeId = (url.searchParams.get("store_id") ?? "").replace(/^eq\./, "");
      const offset = Number(url.searchParams.get("offset") ?? 0);
      const limit = Number(url.searchParams.get("limit") ?? 500);
      const rows = await db.transaction(async (tx) => {
        await tx.exec("set local role anon");
        return (await tx.query("select id,name,price,photo_path,sort_order from public.products where store_id=$1 order by sort_order,name,id limit $2 offset $3", [storeId, limit, offset])).rows;
      });
      return reply(200, rows);
    }
    if (url.pathname === "/rest/v1/rpc/record_store_visit" && request.method === "POST") {
      let body = "";
      for await (const chunk of request) { body += chunk; if (body.length > 1024) return reply(413,{}); }
      const { shop_id,event_id,visit_source } = JSON.parse(body);
      const rows = await db.transaction(async (tx) => { await tx.exec("set local role anon"); return (await tx.query("select public.record_store_visit($1,$2,$3) as recorded",[shop_id,event_id,visit_source])).rows; });
      return reply(200,rows[0].recorded);
    }
    if (url.pathname === "/rest/v1/rpc/search_stores" && request.method === "POST") {
      let body = "";
      for await (const chunk of request) { body += chunk; if (body.length > 4096) return reply(413, {}); }
      const { search_text = "", category_slug = "" } = JSON.parse(body || "{}");
      if (search_text === "katalog-gagal-uji") return reply(503, { message: "Test unavailable" });
      const offset = Number(url.searchParams.get("offset") ?? 0);
      const limit = Number(url.searchParams.get("limit") ?? 20);
      const rows = await db.transaction(async (tx) => {
        await tx.exec("set local role anon");
        return (await tx.query("select * from public.search_stores($1, $2)", [search_text, category_slug])).rows;
      });
      if (offset > 0 && offset >= rows.length) return reply(416, { code: "PGRST103", message: "Requested range not satisfiable" });
      const slice = rows.slice(offset, offset + limit);
      const range = slice.length ? `${offset}-${offset + slice.length - 1}/${rows.length}` : `*/${rows.length}`;
      return reply(200, slice, { "Content-Range": range });
    }
    reply(404, { message: "Not found" });
  } catch {
    reply(500, { message: "Test backend error" });
  }
});

server.listen(3101, "127.0.0.1", () => console.log("Backend katalog uji siap pada 127.0.0.1:3101"));
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(async () => { await db.close(); process.exit(0); }));
}
