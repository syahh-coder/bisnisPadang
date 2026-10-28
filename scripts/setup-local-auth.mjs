import { randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parseEnv } from "node:util";
import { createClient } from "@supabase/supabase-js";
import { getLocalStatus, projectRoot, projectId, runProcess } from "./lib/local-supabase.mjs";

try {
  const status = await getLocalStatus();
  const path = join(projectRoot, ".env.accounts.local");
  const current = await readFile(path, "utf8").catch((error) => { if (error.code === "ENOENT") return ""; throw error; });
  const config = parseEnv(current);
  const admin = createClient(status.API_URL, status.SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const records = [];
  for (const [prefix, role, email, name] of [
    ["LOCAL_ADMIN", "admin", "admin@tokolokal.test", "Admin Lokal"],
    ["LOCAL_STORE", "toko", "toko@tokolokal.test", "Pemilik Toko Lokal"],
  ]) {
    const savedId = config[`${prefix}_ID`];
    if (savedId) {
      const existing = await admin.auth.admin.getUserById(savedId);
      if (existing.error || existing.data.user?.email !== config[`${prefix}_EMAIL`]) throw new Error("Akun lokal tersimpan tidak cocok dengan database. Periksa .env.accounts.local; akun tidak direset otomatis.");
      if (role === "admin") {
        await runProcess("docker", ["exec", "-i", `supabase_db_${projectId}`, "psql", "-U", "postgres", "-d", "postgres", "-X", "-q", "-v", "ON_ERROR_STOP=1"], { input: `update public.profiles set role='admin' where id='${existing.data.user.id}';` });
      }
      console.log(`Akun ${role} lokal sudah tersedia; kata sandi dipertahankan.`);
      continue;
    }
    const password = randomBytes(24).toString("base64url");
    const created = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name } });
    if (created.error || !created.data.user) throw new Error(`Akun ${role} lokal tidak dapat dibuat. Akun yang sudah ada tidak ditimpa; tinjau Studio dan .env.accounts.local.`);
    const id = created.data.user.id;
    records.push(`${prefix}_ID=${id}`, `${prefix}_EMAIL=${email}`, `${prefix}_PASSWORD=${password}`);
    // Simpan kredensial segera agar proses yang terputus tetap dapat dilanjutkan.
    await writeFile(path, [current.trim(), ...records].filter(Boolean).join("\n") + "\n", { mode: 0o600 });
    if (role === "admin") {
      await runProcess("docker", ["exec", "-i", `supabase_db_${projectId}`, "psql", "-U", "postgres", "-d", "postgres", "-X", "-q", "-v", "ON_ERROR_STOP=1"], {
        input: `update public.profiles set role='admin' where id='${id}';`,
      });
    }
    console.log(`Akun ${role} lokal dibuat.`);
  }
  console.log("Email dan kata sandi ada di .env.accounts.local (diabaikan Git). Tidak ada kata sandi yang ditampilkan.");
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
