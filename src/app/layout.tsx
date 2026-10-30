import type { Metadata, Viewport } from "next";
import { SiteHeader } from "@/components/site-header";
import { Navigation } from "@/components/navigation";
import { MainContainer } from "@/components/main-container";
import { LocationProvider } from "@/components/location-context";
import { ToastProvider } from "@/components/toast";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Toko Lokal — Direktori Bisnis & UMKM Indonesia", template: "%s | Toko Lokal" },
  description:
    "Temukan toko, kuliner, dan usaha lokal terpercaya di sekitarmu. Cek menu, lokasi Google Maps, dan pesan langsung via WhatsApp gratis.",
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
          <LocationProvider>
            <a className="skip-link" href="#konten">
              Langsung ke konten
            </a>
            <SiteHeader />
            <MainContainer>{children}</MainContainer>
            <Navigation variant="bottom" />
          </LocationProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
