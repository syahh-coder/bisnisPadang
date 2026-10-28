import { expect,test } from "@playwright/test";
const isVisit = (url: string) => new URL(url).pathname === "/api/visits";

test("halaman toko mencatat sumber, parameter ambigu menjadi langsung, dan reload mendapat ID baru",async({page})=>{
  const ids = new Set<string>();
  for (const [query,source] of [["src=qr","qr"],["src=google_maps","google_maps"],["src=search","search"],["src=tidak-dikenal","direct"],["src=qr&src=search","direct"],["","direct"]]) {
    const [response]=await Promise.all([page.waitForResponse((r)=>isVisit(r.url()) && r.request().method()==="POST"),page.goto(`/toko/warung-bu-ani?${query}`)]);
    expect(response.status()).toBe(204);
    const body=response.request().postDataJSON();
    expect(body.source).toBe(source);expect(body.event_id).toMatch(/^[a-f0-9-]{36}$/);expect(body).not.toHaveProperty("visited_at");
    expect(ids.has(body.event_id)).toBe(false);ids.add(body.event_id);
  }
  const [response]=await Promise.all([page.waitForResponse((r)=>isVisit(r.url())),page.reload()]);
  expect(response.status()).toBe(204);expect(ids.has(response.request().postDataJSON().event_id)).toBe(false);
});

test("kegagalan pencatatan tidak merusak halaman dan dicoba ulang satu kali dengan ID sama",async({page})=>{
  const errors:string[]=[], ids:string[]=[];
  page.on("pageerror",(e)=>errors.push(e.message));
  await page.route("**/api/visits",async(route)=>{ids.push(route.request().postDataJSON().event_id);await route.fulfill({status:503,contentType:"application/json",body:'{"error":"Uji tidak tersedia"}'});});
  await page.goto("/toko/warung-bu-ani?src=qr");
  await expect.poll(()=>ids.length).toBe(2);
  expect(ids[0]).toBe(ids[1]);
  await expect(page.getByRole("heading",{name:"Warung Bu Ani",exact:true})).toBeVisible();
  expect(errors).toEqual([]);
});

test("demo dan toko hilang tidak mencatat kunjungan; ID bekerja tanpa randomUUID konteks aman",async({page})=>{
  const events:string[]=[];
  page.on("request",(r)=>{if(isVisit(r.url()))events.push(r.url());});
  await page.goto("http://127.0.0.1:3002/toko/warung-bu-ani?src=qr");
  await expect(page.getByRole("heading",{name:"Warung Bu Ani",exact:true})).toBeVisible();
  await page.goto("/toko/toko-tidak-ada?src=qr");
  await expect(page.getByRole("heading",{name:"Toko tidak ditemukan",exact:true})).toBeVisible();
  expect(events).toHaveLength(0);
  await page.addInitScript(()=>Object.defineProperty(crypto,"randomUUID",{configurable:true,value:undefined}));
  const [response]=await Promise.all([page.waitForResponse((r)=>isVisit(r.url())),page.goto("/toko/warung-bu-ani")]);
  expect(response.status()).toBe(204);expect(response.request().postDataJSON().event_id).toMatch(/^[a-f0-9-]{14}4[a-f0-9-]{21}$/);
});
