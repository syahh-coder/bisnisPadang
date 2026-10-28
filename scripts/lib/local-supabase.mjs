import { spawn } from "node:child_process";
import { readFile, writeFile, rename } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const projectRoot = fileURLToPath(new URL("../../", import.meta.url));
export const projectId = "web-bisnis-padang";

function redact(text) {
  return text
    .replace(/\u001b\[[0-9;]*[a-zA-Z]/g, "")
    .replace(/\beyJ[A-Za-z0-9._-]+/g, "[key disembunyikan]")
    .replace(/\bsb_(?:secret|publishable)_[A-Za-z0-9_-]+/g, "[key disembunyikan]")
    .replace(/postgres(?:ql)?:\/\/\S+/g, "[koneksi disembunyikan]")
    .split(/\r?\n/).filter((line) => !/secret|password|anon_key|service_role_key|jwt_secret/i.test(line)).join("\n");
}

export function runProcess(command, args, { input, progress = false } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: projectRoot, windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    const heartbeat = progress ? setInterval(() => console.log("Supabase sedang menyiapkan container Docker…"), 20_000) : null;
    child.stdout.on("data", (chunk) => { stdout = (stdout + chunk).slice(-64_000); });
    child.stderr.on("data", (chunk) => { stderr = (stderr + chunk).slice(-64_000); });
    child.on("error", (error) => { if (heartbeat) clearInterval(heartbeat); reject(new Error(`Perintah lokal tidak dapat dijalankan: ${error.code ?? "gagal"}.`)); });
    child.on("close", (code) => {
      if (heartbeat) clearInterval(heartbeat);
      if (code !== 0) reject(new Error(`Perintah lokal gagal (kode ${code}).\n${redact(stderr || stdout).slice(-12_000)}`));
      else resolve(stdout);
    });
    child.stdin.on("error", () => {});
    child.stdin.end(input);
  });
}

export function runCli(args, options) {
  return runProcess(process.execPath, [join(projectRoot, "node_modules/supabase/dist/supabase.js"), ...args, "--workdir", projectRoot, "--agent", "no"], options);
}

export async function getLocalStatus() {
  const output = await runCli(["status", "--output", "json"]);
  let status;
  try { status = JSON.parse(output); } catch { throw new Error("Status Supabase lokal tidak dapat dibaca sebagai JSON."); }
  const apiUrl = status.API_URL;
  if (!apiUrl || !["127.0.0.1", "localhost", "[::1]"].includes(new URL(apiUrl).hostname)) {
    throw new Error("Perintah ini hanya boleh memakai Supabase lokal di loopback.");
  }
  return status;
}

export async function connectAppToLocal(status) {
  const path = join(projectRoot, ".env.local");
  let current = await readFile(path, "utf8").catch((error) => { if (error.code === "ENOENT") return ""; throw error; });
  const existingUrl = current.match(/^NEXT_PUBLIC_SUPABASE_URL\s*=\s*["']?([^\r\n"']+)/m)?.[1]?.trim();
  if (existingUrl && !["127.0.0.1", "localhost", "[::1]"].includes(new URL(existingUrl).hostname)) {
    throw new Error(".env.local berisi koneksi Supabase remote. Tinjau secara manual sebelum menggantinya dengan database lokal.");
  }
  const key = status.PUBLISHABLE_KEY || status.ANON_KEY;
  if (!key) throw new Error("Publishable/anon key lokal tidak ditemukan; .env.local tidak diubah.");
  const values = {
    CATALOG_MODE: "supabase",
    NEXT_PUBLIC_SUPABASE_URL: status.API_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key,
  };
  for (const [name, value] of Object.entries(values)) {
    const line = `${name}=${value}`;
    const pattern = new RegExp(`^${name}\\s*=.*$`, "m");
    current = pattern.test(current) ? current.replace(pattern, () => line) : `${current.replace(/\s*$/, "")}\n${line}\n`;
  }
  const temporary = `${path}.tmp`;
  await writeFile(temporary, current.trimStart().replace(/\s*$/, "\n"), { mode: 0o600 });
  await rename(temporary, path);
}

export function printLocalUrls(status) {
  console.log(`API Supabase: ${status.API_URL}`);
  console.log(`Studio: ${status.STUDIO_URL ?? "http://127.0.0.1:55323"}`);
  console.log("PostgreSQL: 127.0.0.1:55322 (kredensial tidak ditampilkan)");
}
