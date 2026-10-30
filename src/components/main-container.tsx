"use client";

import { usePathname } from "next/navigation";

export function MainContainer({ children }: { children: React.ReactNode }) {
  const portal = usePathname().startsWith("/portal/");
  return (
    <main id="konten" tabIndex={-1} className={portal ? "flex-1" : "page-container flex-1"}>
      {children}
    </main>
  );
}
