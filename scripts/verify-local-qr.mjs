import assert from "node:assert/strict";
import { randomUUID, randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { createClient } from "@supabase/supabase-js";
import { chromium, expect } from "@playwright/test";
import jsQR from "jsqr";
import { PNG } from "pngjs";
import { getLocalStatus, projectRoot, projectId, runProcess } from "./lib/local-supabase.mjs";

const marker = `qr-${randomUUID().slice(0,8)}`;
const storeId = randomUUID(), users = [], secrets = [];
const baseURL = "http://127.0.0.1:3009";
let app, browser, service, lastPage;
let phase = "setup";
const sdk = (url,key) => createClient(url,key,{ auth: { persistSession:false,autoRefreshToken:false } });
const minuteWib = (ms) => new Date(ms + 7*3600000).toISOString().slice(0,16);
const decode = (buffer) => {
  const png = PNG.sync.read(buffer);
  const result = jsQR(new Uint8ClampedArray(png.data),png.width,png.height,{ inversionAttempts:"dontInvert" });
  assert.ok(result,"PNG hasil generator harus terbaca sebagai QR");
  return result.data;
};
async function submit(page,button) { const [r] = await Promise.all([page.waitForResponse((r) => r.request().method()==="POST" && r.url().startsWith(baseURL)),button.click()]); assert.ok(r.ok() || r.status()===303,"Server Action tidak boleh error"); }
async function capture(page,path) { assert.ok(await page.evaluate(() => document.documentElement.scrollWidth<=innerWidth),`Overflow saat ${phase}`); await page.getByRole("heading",{level:1}).click(); await page.screenshot({path,fullPage:true,animations:"disabled"}); }
async function row(id) { const r=await service.from("qr_codes").select("*").eq("id",id).single(); assert.equal(r.error,null); return r.data; }
async function redirectCheck(code,slug) {
  const r=await fetch(`${baseURL}/q/${code}?url=https://situs-lain.test&src=search`,{redirect:"manual"});
  assert.equal(r.status,307); assert.equal(r.headers.get("location"),`/toko/${slug}?src=qr`); assert.ok(r.headers.get("cache-control").includes("no-store"));
}
try {
  const status=await getLocalStatus(), key=status.PUBLISHABLE_KEY||status.ANON_KEY;
  service=sdk(status.API_URL,status.SERVICE_ROLE_KEY);
  for(const role of ["admin","toko"]) {
    const email=`${marker}-${role}@tokolokal.test`,password=randomBytes(24).toString("base64url"); secrets.push(password);
    const result=await service.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{name:`Penguji ${role}`}}); assert.equal(result.error,null);
    users.push({id:result.data.user.id,email,password,role});
  }
  await runProcess("docker",["exec","-i",`supabase_db_${projectId}`,"psql","-U","postgres","-d","postgres","-X","-q","-v","ON_ERROR_STOP=1"],{input:`update public.profiles set role='admin' where id='${users[0].id}';`});
  const category=(await service.from("categories").select("id").eq("slug","makanan").single()).data.id;
  let slug=`${marker}-toko`;
  assert.equal((await service.from("stores").insert({id:storeId,owner_id:users[1].id,category_id:category,name:`${marker} Toko`,slug,address:"Alamat toko uji QR, Padang"})).error,null);
  const anon=sdk(status.API_URL,key), owner=sdk(status.API_URL,key), admin=sdk(status.API_URL,key);
  assert.equal((await owner.auth.signInWithPassword(users[1])).error,null);
  assert.equal((await admin.auth.signInWithPassword(users[0])).error,null);
  assert.ok((await anon.from("qr_codes").select("id")).error);
  assert.ok((await owner.from("qr_codes").insert({store_id:storeId,kind:"static",site_origin:baseURL})).error);
  assert.ok((await admin.from("qr_codes").insert({store_id:storeId,kind:"dynamic",site_origin:baseURL,expires_at:new Date(Date.now()+16*86400000).toISOString()})).error);
  console.log("Lulus: QR privat untuk admin dan masa berlaku lebih dari 15 hari ditolak di Supabase Docker.");
  app=spawn(process.execPath,[join(projectRoot,"node_modules/next/dist/bin/next"),"start","--hostname","127.0.0.1","--port","3009"],{cwd:projectRoot,windowsHide:true,stdio:"ignore",env:{...process.env,CATALOG_MODE:"supabase",NEXT_PUBLIC_SUPABASE_URL:status.API_URL,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:key,SITE_URL:baseURL}});
  app.on("error",()=>{});
  let ready=false; for(let i=0;i<100;i++) { if(app.exitCode!==null) break; try { if((await fetch(`${baseURL}/akun`,{signal:AbortSignal.timeout(500)})).ok) {ready=true;break;} } catch{} await delay(250); }
  assert.ok(ready,"Build belum siap atau port 3009 terpakai.");
  browser=await chromium.launch(); const output=join(projectRoot,"test-results/qr"); await mkdir(output,{recursive:true});
  for(const width of [360,1440]) {
    phase=`QR statis ${width}px`;
    const context=await browser.newContext({viewport:{width,height:900},locale:"id-ID",timezoneId:"America/New_York",reducedMotion:"reduce",acceptDownloads:true});
    await context.route(/https:\/\/(maps\.google\.com|www\.google\.com)\//,(route)=>route.fulfill({body:"Peta tes"}));
    const page=await context.newPage(); lastPage=page; const errors=[]; page.on("pageerror",(e)=>errors.push(e.message));
    await page.goto(`${baseURL}/akun`); await page.getByLabel("Email",{exact:true}).fill(users[0].email); await page.getByLabel("Kata sandi",{exact:true}).fill(users[0].password); await page.getByRole("button",{name:"Masuk",exact:true}).click(); await expect(page).toHaveURL(/\/portal\/admin$/);
    await page.getByRole("navigation",{name:"Menu admin",exact:true}).getByRole("link",{name:"Pembuat QR",exact:true}).click();
    await expect(page.getByRole("navigation",{name:"Menu admin",exact:true}).getByRole("link")).toHaveCount(3);
    const form=page.getByRole("form",{name:"Buat QR",exact:true});
    await form.locator('[name="store_id"]').selectOption(storeId); await form.locator('[name="kind"]').selectOption("static");
    await submit(page,form.getByRole("button",{name:"Buat QR",exact:true})); await expect(page).toHaveURL(/\?qr=[a-f0-9-]{36}$/);
    const staticId=new URL(page.url()).searchParams.get("qr"), fixed=await row(staticId);
    assert.equal(fixed.kind,"static"); assert.equal(fixed.expires_at,null); assert.equal(fixed.target_slug,slug);
    const imagePath=`/portal/admin/qr/${staticId}/gambar`, png=await context.request.get(`${baseURL}${imagePath}`);
    assert.equal(png.status(),200); assert.ok(png.headers()["content-type"].includes("image/png")); assert.ok(png.headers()["cache-control"].includes("no-store"));
    const target=`${baseURL}/toko/${slug}?src=qr`;
    assert.equal(decode(await png.body()),target);
    const [download]=await Promise.all([page.waitForEvent("download"),page.getByRole("link",{name:"Unduh PNG",exact:true}).click()]);
    assert.equal(download.suggestedFilename(),`qr-static-${staticId}.png`);
    assert.equal(decode(await readFile(await download.path())),target);
    await expect(page.getByRole("img",{name:"QR statis untuk toko",exact:true})).toBeVisible();
    await expect.poll(() => page.getByRole("img",{name:"QR statis untuk toko",exact:true}).evaluate((img)=>img.complete && img.naturalWidth>0)).toBe(true);
    await capture(page,join(output,`static-${width}.png`));
    assert.equal(decode(await page.getByRole("img",{name:"QR statis untuk toko",exact:true}).screenshot()),target,"QR di layar juga harus dapat dipindai");
    const anonymous=await fetch(`${baseURL}${imagePath}`); assert.equal(anonymous.status,401);
    const ownerContext=await browser.newContext();
    const session=(await owner.auth.getSession()).data.session;
    await ownerContext.addCookies([{name:"toko-lokal-auth",value:`base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`,url:baseURL,httpOnly:true,sameSite:"Lax"}]);
    assert.equal((await ownerContext.request.get(`${baseURL}${imagePath}`)).status(),403);
    const ownerPage=await ownerContext.newPage(); await ownerPage.goto(`${baseURL}/portal/admin/qr`); await expect(ownerPage).toHaveURL(/\/akun\?akses=ditolak/); await ownerContext.close();

    phase=`QR dinamis ${width}px`;
    await form.locator('[name="store_id"]').selectOption(storeId); await form.locator('[name="kind"]').selectOption("dynamic");
    const chosen=minuteWib(Date.now()+(width===360?86400000:3*86400000));
    await form.locator('[name="expires_at"]').fill(chosen);
    await submit(page,form.getByRole("button",{name:"Buat QR",exact:true}));
    await expect(page).not.toHaveURL(new RegExp(staticId));
    const dynamicId=new URL(page.url()).searchParams.get("qr"), dynamic=await row(dynamicId);
    assert.equal(dynamic.kind,"dynamic"); assert.equal(Date.parse(dynamic.expires_at),Date.parse(`${chosen}:00+07:00`));
    const dynamicPng=await context.request.get(`${baseURL}/portal/admin/qr/${dynamicId}/gambar`);
    assert.equal(decode(await dynamicPng.body()),`${baseURL}/q/${dynamic.code}`);
    await redirectCheck(dynamic.code,slug);
    const expiryForm=page.getByRole("form",{name:"Ubah masa berlaku QR",exact:true});
    const changed=minuteWib(Date.now()+2*86400000);
    await expiryForm.locator('[name="expires_at"]').fill(changed);
    await submit(page,expiryForm.getByRole("button",{name:"Simpan masa berlaku",exact:true}));
    await expect(expiryForm.getByRole("status")).toHaveText("Masa berlaku tersimpan.");
    assert.equal(Date.parse((await row(dynamicId)).expires_at),Date.parse(`${changed}:00+07:00`));
    assert.ok((await admin.from("qr_codes").update({created_at:new Date().toISOString()}).eq("id",dynamicId)).error);
    assert.ok((await admin.from("qr_codes").update({expires_at:new Date(Date.parse(dynamic.created_at)+15*86400000+1000).toISOString()}).eq("id",dynamicId)).error);
    assert.equal((await owner.from("qr_codes").select("id")).data.length,0);
    await capture(page,join(output,`dynamic-${width}.png`));
    slug=`${marker}-slug-${width}`; assert.equal((await service.from("stores").update({slug}).eq("id",storeId)).error,null);
    await redirectCheck(dynamic.code,slug);
    assert.equal(decode(await (await context.request.get(`${baseURL}${imagePath}`)).body()),target,"QR statis tidak boleh berubah saat slug toko diedit");
    const publicPage=await context.newPage(); await publicPage.goto(`${baseURL}/q/${dynamic.code}`); await expect(publicPage).toHaveURL(new RegExp(`/toko/${slug}\\?src=qr$`)); await expect(publicPage.getByRole("heading",{name:`${marker} Toko`,exact:true})).toBeVisible();
    assert.equal((await fetch(`${baseURL}/q/${"f".repeat(32)}`,{redirect:"manual"})).status,404);
    assert.equal((await service.from("qr_codes").update({created_at:new Date(Date.now()-2*86400000).toISOString(),expires_at:new Date(Date.now()-86400000).toISOString()}).eq("id",dynamicId)).error,null);
    const expired=await fetch(`${baseURL}/q/${dynamic.code}`,{redirect:"manual"}); assert.equal(expired.status,410); assert.equal(expired.headers.get("location"),null); assert.ok(expired.headers.get("cache-control").includes("no-store"));
    const response=await publicPage.goto(`${baseURL}/q/${dynamic.code}`); assert.equal(response.status(),410); await expect(publicPage.getByRole("heading",{name:"QR sudah kedaluwarsa",exact:true})).toBeVisible();
    await capture(publicPage,join(output,`expired-${width}.png`)); await publicPage.close();
    assert.deepEqual(errors,[]); await context.close(); lastPage=null;
    console.log(`Lulus ${width}px: QR PNG didekode, unduhan, statis tetap, masa berlaku berbeda/WIB, edit expiry, slug dinamis, src=qr, 401/403/404/410, dan tanpa cache kedaluwarsa.`);
  }
} catch(error) {
  if(lastPage) await lastPage.screenshot({path:join(projectRoot,"test-results/qr/failure.png"),fullPage:true,animations:"disabled"}).catch(()=>{});
  let message=`${phase}: ${error.message}`; for(const secret of secrets) message=message.split(secret).join("[rahasia]"); console.error(message.replace(/\beyJ[A-Za-z0-9._-]+/g,"[token]")); process.exitCode=1;
} finally {
  await browser?.close(); if(app?.pid && app.exitCode===null) {const closed=once(app,"close");app.kill();await Promise.race([closed,delay(5000)]);}
  if(service) {let failed=Boolean((await service.from("stores").delete().eq("id",storeId)).error); for(const user of users) if((await service.auth.admin.deleteUser(user.id)).error) failed=true; if(failed) {console.error("Sebagian data QR uji belum dibersihkan.");process.exitCode=1;} else console.log("QR, toko, dan akun uji dibersihkan.");}
}
