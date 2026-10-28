import assert from "node:assert/strict";
import {randomUUID,randomBytes} from "node:crypto";
import {spawn} from "node:child_process";
import {once} from "node:events";
import {mkdir} from "node:fs/promises";
import {join} from "node:path";
import {setTimeout as delay} from "node:timers/promises";
import {createClient} from "@supabase/supabase-js";
import {chromium,expect} from "@playwright/test";
import {getLocalStatus,projectRoot,projectId,runProcess} from "./lib/local-supabase.mjs";

const marker=`visits-${randomUUID().slice(0,8)}`,storeIds=[randomUUID(),randomUUID()],users=[],secrets=[];
const baseURL="http://127.0.0.1:3010",slug=`${marker}-toko`,name=`${marker} Toko`;
let service,app,browser,lastPage,phase="setup";
const sdk=(url,key)=>createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const isVisit=(r)=>new URL(r.url()).pathname==="/api/visits" && r.request().method()==="POST";
async function count(){const r=await service.from("store_visits").select("id",{count:"exact",head:true}).eq("store_id",storeIds[0]);assert.equal(r.error,null);return r.count;}
async function summary(client,id){const r=await client.rpc("store_visit_summary",{shop_id:id});assert.equal(r.error,null);return r.data;}
async function post(body,extra={}){return fetch(`${baseURL}/api/visits`,{method:"POST",headers:{Origin:baseURL,"Content-Type":"application/json",...extra},body:typeof body==="string"?body:JSON.stringify(body)});}
async function view(page,operation,source){const [r]=await Promise.all([page.waitForResponse(isVisit),operation()]);assert.equal(r.status(),204);const body=r.request().postDataJSON();assert.equal(body.source,source);const saved=await service.from("store_visits").select("store_id,source").eq("id",body.event_id).single();assert.equal(saved.error,null);assert.equal(saved.data.store_id,storeIds[0]);assert.equal(saved.data.source,source);return body.event_id;}
async function login(page,user){await page.goto(`${baseURL}/akun`);await page.getByLabel("Email",{exact:true}).fill(user.email);await page.getByLabel("Kata sandi",{exact:true}).fill(user.password);await page.getByRole("button",{name:"Masuk",exact:true}).click();await expect(page).toHaveURL(/\/portal\/toko$/);}
async function checkTable(page,rows){const region=page.getByRole("region",{name:"Statistik pengunjung hari ini",exact:true});await expect(region).toBeVisible();const labels={google_maps:"Google Maps",qr:"QR",search:"Pencarian",direct:"Langsung"};for(const row of rows){const tr=region.getByRole("row").filter({has:page.getByRole("rowheader",{name:labels[row.source],exact:true})});await expect(tr.getByRole("cell")).toHaveText(Number(row.visits).toLocaleString("id-ID"));}await expect(region.locator("tfoot td")).toHaveText(rows.reduce((n,r)=>n+Number(r.visits),0).toLocaleString("id-ID"));}
async function capture(page,path){assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Overflow ${phase}`);await page.getByRole("heading",{level:1}).click();await page.screenshot({path,fullPage:true,animations:"disabled"});}
try{
  const status=await getLocalStatus(),key=status.PUBLISHABLE_KEY||status.ANON_KEY;service=sdk(status.API_URL,status.SERVICE_ROLE_KEY);
  for(const role of ["toko","toko","admin"]){const email=`${marker}-${users.length}@tokolokal.test`,password=randomBytes(24).toString("base64url");secrets.push(password);const r=await service.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{name:`Penguji kunjungan ${users.length}`}});assert.equal(r.error,null);users.push({id:r.data.user.id,email,password});}
  await runProcess("docker",["exec","-i",`supabase_db_${projectId}`,"psql","-U","postgres","-d","postgres","-X","-q","-v","ON_ERROR_STOP=1"],{input:`update public.profiles set role='admin' where id='${users[2].id}';`});
  const category=(await service.from("categories").select("id").eq("slug","makanan").single()).data.id;
  assert.equal((await service.from("stores").insert(storeIds.map((id,i)=>({id,owner_id:users[i].id,category_id:category,name:i?`${marker} Toko lain`:name,slug:i?`${slug}-lain`:slug,address:"Alamat toko uji kunjungan, Padang"})))).error,null);
  const qr=(await service.from("qr_codes").insert({store_id:storeIds[0],kind:"dynamic",site_origin:baseURL,expires_at:new Date(Date.now()+86400000).toISOString()}).select("code").single());assert.equal(qr.error,null);
  const oldQr=(await service.from("qr_codes").insert({store_id:storeIds[0],kind:"dynamic",site_origin:baseURL,created_at:new Date(Date.now()-2*86400000).toISOString(),expires_at:new Date(Date.now()-86400000).toISOString()}).select("code").single());assert.equal(oldQr.error,null);
  const owner=sdk(status.API_URL,key),admin=sdk(status.API_URL,key),anon=sdk(status.API_URL,key);
  assert.equal((await owner.auth.signInWithPassword(users[0])).error,null);assert.equal((await admin.auth.signInWithPassword(users[2])).error,null);
  app=spawn(process.execPath,[join(projectRoot,"node_modules/next/dist/bin/next"),"start","--hostname","0.0.0.0","--port","3010"],{cwd:projectRoot,windowsHide:true,stdio:"ignore",env:{...process.env,CATALOG_MODE:"supabase",NEXT_PUBLIC_SUPABASE_URL:status.API_URL,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:key,SITE_URL:baseURL}});app.on("error",()=>{});
  let ready=false;for(let i=0;i<100;i++){if(app.exitCode!==null)break;try{if((await fetch(`${baseURL}/akun`,{signal:AbortSignal.timeout(500)})).ok){ready=true;break;}}catch{}await delay(250);}assert.ok(ready,"Build belum siap atau port 3010 terpakai.");
  phase="validasi endpoint dan prefetch";
  const pageURL=`${baseURL}/toko/${slug}?src=qr`;
  for(const options of [{},{method:"HEAD"},{headers:{RSC:"1","Next-Router-Prefetch":"1"}}]){const r=await fetch(pageURL,options);assert.equal(r.status,200);await r.text();}
  assert.equal((await fetch(`${baseURL}/q/${qr.data.code}`,{redirect:"manual"})).status,307);assert.equal(await count(),0,"GET/HEAD/prefetch/resolver tidak boleh menambah hit");
  const body={store_id:storeIds[0],event_id:randomUUID(),source:"qr"};
  for(const [payload,headers,statusCode] of [[{...body,event_id:"salah"},{},400],["{",{},400],[body,{Origin:"https://situs-lain.test"},403],[body,{"Content-Type":"text/plain"},415],["x".repeat(2048),{},413],[{...body,store_id:randomUUID()},{},404]])assert.equal((await post(payload,headers)).status,statusCode);
  assert.equal((await fetch(`${baseURL}/api/visits`)).status,405);assert.equal(await count(),0);
  const responses=await Promise.all([post({...body,visited_at:"1900-01-01"}),post(body)]);assert.ok(responses.every((r)=>r.status===204));assert.equal(await count(),1);
  const recorded=(await service.from("store_visits").select("visited_at").eq("id",body.event_id).single()).data;assert.ok(Date.parse(recorded.visited_at)>Date.now()-60000);
  assert.ok((await anon.from("store_visits").select("id")).error);assert.ok((await owner.rpc("store_visit_summary",{shop_id:storeIds[1]})).error);assert.ok((await owner.from("store_visits").update({source:"direct"}).eq("id",body.event_id)).error);
  const today=(await summary(owner,storeIds[0]))[0].visit_date,start=Date.parse(`${today}T00:00:00+07:00`);
  assert.equal((await service.from("store_visits").insert([{store_id:storeIds[0],source:"qr",visited_at:new Date(start-1).toISOString()},{store_id:storeIds[0],source:"google_maps",visited_at:new Date(start).toISOString()},{store_id:storeIds[0],source:"search",visited_at:new Date(start+86400000-1).toISOString()},{store_id:storeIds[0],source:"direct",visited_at:new Date(start+86400000).toISOString()},{store_id:storeIds[1],source:"google_maps",visited_at:new Date().toISOString()}])).error,null);
  assert.deepEqual((await summary(owner,storeIds[0])).map((r)=>[r.source,Number(r.visits)]),[["google_maps",1],["qr",1],["search",1],["direct",0]]);
  assert.equal((await owner.from("store_visits").select("id").eq("store_id",storeIds[1])).data.length,0);assert.equal((await summary(admin,storeIds[1])).find((r)=>r.source==="google_maps").visits,1);
  console.log("Lulus: validasi endpoint, idempotensi bersamaan, waktu server, GET/prefetch/resolver tanpa hit, RLS, dan batas WIB.");
  browser=await chromium.launch();const output=join(projectRoot,"test-results/visits");await mkdir(output,{recursive:true});
  for(const width of [360,1440]){
    phase=`pencatatan browser ${width}px`;
    const visitor=await browser.newContext({viewport:{width,height:900},locale:"id-ID",timezoneId:"America/Los_Angeles",reducedMotion:"reduce"});await visitor.route(/https:\/\/(maps\.google\.com|www\.google\.com)\//,(route)=>route.fulfill({body:"Peta uji"}));
    const page=await visitor.newPage();lastPage=page;const errors=[];page.on("pageerror",(e)=>errors.push(e.message));
    for(const [query,source] of [["src=qr","qr"],["src=google_maps","google_maps"],["src=search","search"],["src=tidak-dikenal","direct"],["src=qr&src=search","direct"],["","direct"]])await view(page,()=>page.goto(`${baseURL}/toko/${slug}?${query}`),source);
    const before=await count();const qrId=await view(page,()=>page.goto(`${baseURL}/q/${qr.data.code}`),"qr");await expect(page).toHaveURL(new RegExp(`/toko/${slug}\\?src=qr$`));await page.waitForLoadState("networkidle");assert.equal(await count(),before+1,"QR dinamis hanya satu kunjungan");
    const reloadId=await view(page,()=>page.reload(),"qr");assert.notEqual(reloadId,qrId);
    await page.goto(`${baseURL}/`);const backId=await view(page,()=>page.goBack(),"qr");assert.notEqual(backId,reloadId);
    await page.goto(`${baseURL}/pencarian?q=${marker}`);const searchId=await view(page,()=>page.getByRole("heading",{name,exact:true}).click(),"search");assert.ok(searchId);
    await page.goBack();const forwardId=await view(page,()=>page.goForward(),"search");assert.notEqual(forwardId,searchId);
    const beforeMissing=await count();assert.equal((await page.goto(`${baseURL}/q/${oldQr.data.code}`)).status(),410);await page.goto(`${baseURL}/toko/tidak-ada-${marker}`);await expect(page.getByRole("heading",{name:"Toko tidak ditemukan",exact:true})).toBeVisible();assert.equal(await count(),beforeMissing);
    const retryIds=[];await page.route("**/api/visits",async(route)=>{retryIds.push(route.request().postDataJSON().event_id);if(retryIds.length===1)await route.fulfill({status:503,contentType:"application/json",body:'{"error":"Uji ulang"}'});else await route.continue();});
    const beforeRetry=await count();const [retryResponse]=await Promise.all([page.waitForResponse((r)=>isVisit(r)&&r.status()===204),page.goto(`${baseURL}/toko/${slug}?src=google_maps`)]);assert.equal(retryResponse.status(),204);assert.equal(retryIds.length,2);assert.equal(retryIds[0],retryIds[1]);assert.equal(await count(),beforeRetry+1);await page.unroute("**/api/visits");
    await capture(page,join(output,`store-${width}.png`));assert.deepEqual(errors,[]);await visitor.close();lastPage=null;
    phase=`dashboard ${width}px`;
    const context=await browser.newContext({viewport:{width,height:900},locale:"id-ID",timezoneId:"America/Los_Angeles",reducedMotion:"reduce"});const dashboard=await context.newPage();lastPage=dashboard;await login(dashboard,users[0]);await checkTable(dashboard,await summary(owner,storeIds[0]));await expect(dashboard.getByRole("navigation",{name:"Menu toko",exact:true}).getByRole("link")).toHaveCount(3);
    await capture(dashboard,join(output,`dashboard-${width}.png`));await dashboard.goto(`${baseURL}/portal/toko?toko=${storeIds[1]}`);await expect(dashboard.locator("main").getByRole("alert")).toContainText("Toko tidak tersedia");await expect(dashboard.getByRole("region",{name:"Statistik pengunjung hari ini",exact:true})).toHaveCount(0);
    await Promise.all([dashboard.waitForURL(/\/akun$/),dashboard.getByRole("button",{name:"Keluar",exact:true}).click()]);await login(dashboard,users[1]);await checkTable(dashboard,await summary(admin,storeIds[1]));await expect(dashboard.getByRole("link",{name,exact:true})).toHaveCount(0);await context.close();lastPage=null;
    console.log(`Lulus ${width}px: semua sumber, QR satu hit, reload/kembali/maju, pencarian SPA, retry ID sama, toko hilang/QR mati tanpa hit, dashboard privat dan hari WIB.`);
  }
}catch(error){if(lastPage)await lastPage.screenshot({path:join(projectRoot,"test-results/visits/failure.png"),fullPage:true,animations:"disabled"}).catch(()=>{});let message=`${phase}: ${error.message}`;for(const secret of secrets)message=message.split(secret).join("[rahasia]");console.error(message.replace(/\beyJ[A-Za-z0-9._-]+/g,"[token]"));process.exitCode=1;}
finally{await browser?.close();if(app?.pid&&app.exitCode===null){const closed=once(app,"close");app.kill();await Promise.race([closed,delay(5000)]);}if(service){let failed=Boolean((await service.from("stores").delete().in("id",storeIds)).error);for(const user of users)if((await service.auth.admin.deleteUser(user.id)).error)failed=true;if(failed){console.error("Sebagian data kunjungan uji belum dibersihkan.");process.exitCode=1;}else console.log("Data kunjungan, QR, toko, dan akun uji dibersihkan.");}}
