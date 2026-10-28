"use client";
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { visitSource } from "@/lib/visits";

function eventId() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  // getRandomValues juga tersedia saat pengembangan melalui HTTP di jaringan lokal.
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2,"0")).join("");
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}

export function VisitTracker({ storeId }: { storeId: string }) {
  const pathname = usePathname();
  const query = useSearchParams().toString();
  useEffect(() => {
    const sources = new URLSearchParams(query).getAll("src");
    const source = visitSource(sources.length === 1 ? sources[0] : null);
    let view = { id: eventId(), sent: false };
    let disposed = false;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let restored: ReturnType<typeof setTimeout> | undefined;
    function send() {
      if (disposed || document.visibilityState !== "visible" || view.sent) return;
      view.sent = true;
      const body = JSON.stringify({ store_id: storeId, event_id: view.id, source });
      async function post(attempt: number) {
        let again = false;
        try {
          const response = await fetch("/api/visits", { method: "POST", headers: { "Content-Type": "application/json" }, body, credentials: "omit", cache: "no-store", keepalive: true });
          again = response.status >= 500;
        } catch { again = true; }
        if (again && attempt === 0 && !disposed) retry = setTimeout(() => { void post(1); },1000);
      }
      void post(0);
    }
    // Ditunda satu task agar setup/cleanup Strict Mode tidak mengirim hit ganda.
    const initial = setTimeout(send,0);
    const show = (event: PageTransitionEvent) => {
      if (event.persisted) { clearTimeout(retry); view = { id: eventId(), sent: false }; restored = setTimeout(send,0); }
    };
    document.addEventListener("visibilitychange",send);
    window.addEventListener("pageshow",show);
    return () => { disposed = true; clearTimeout(initial); clearTimeout(retry); clearTimeout(restored); document.removeEventListener("visibilitychange",send); window.removeEventListener("pageshow",show); };
  },[storeId,pathname,query]);
  return null;
}
