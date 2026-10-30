import type { Metadata, Viewport } from "next";
import { SiteHeader } from "@/components/site-header";
import { Navigation } from "@/components/navigation";
import { ToastProvider } from "@/components/toast";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Toko Lokal Padang — Direktori UMKM & Kuliner", template: "%s | Toko Lokal Padang" },
  description:
    "Temukan toko, kuliner, dan usaha lokal terbaik di Kota Padang. Cek menu, lokasi Google Maps, dan pesan langsung via WhatsApp gratis.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0f766e",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className="bg-slate-50 text-slate-900 antialiased min-h-screen flex flex-col selection:bg-teal-700 selection:text-white">
        <ToastProvider>
          <a className="skip-link" href="#konten">
            Langsung ke konten
          </a>
          <SiteHeader />
          <main id="konten" tabIndex={-1} className="page-container flex-1">
            {children}
          </main>
          <Navigation variant="bottom" />
        </ToastProvider>
      </body>
    </html>
  );
}
