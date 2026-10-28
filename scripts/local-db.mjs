import { connectAppToLocal, getLocalStatus, printLocalUrls, runCli } from "./lib/local-supabase.mjs";

const command = process.argv[2];
try {
  switch (command) {
    case "start": {
      console.log("Menjalankan Supabase lokal lewat Docker. Unduhan image pertama dapat memerlukan beberapa menit.");
      await runCli(["start", "--exclude", "realtime,imgproxy,edge-runtime,logflare,vector,supavisor"], { progress: true });
      await runCli(["migration", "up", "--local"], { progress: true });
      const status = await getLocalStatus();
      await connectAppToLocal(status);
      printLocalUrls(status);
      console.log("Migrasi diterapkan dan .env.local terhubung ke database lokal. Jalankan ulang npm run dev jika sedang aktif.");
      break;
    }
    case "status": printLocalUrls(await getLocalStatus()); break;
    case "env": {
      await connectAppToLocal(await getLocalStatus());
      console.log(".env.local diperbarui tanpa menampilkan key.");
      break;
    }
    case "migrate":
      await getLocalStatus();
      await runCli(["migration", "up", "--local"], { progress: true });
      console.log("Migrasi lokal selesai. Data yang ada tidak direset.");
      break;
    case "stop":
      await runCli(["stop"], { progress: true });
      console.log("Supabase proyek dihentikan. Volume dan data lokal dipertahankan.");
      break;
    default: throw new Error("Gunakan start, stop, status, migrate, atau env.");
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
