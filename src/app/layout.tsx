import type { Metadata, Viewport } from "next";
import { SiteHeader } from "@/components/site-header";
import { Navigation } from "@/components/navigation";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Toko Lokal", template: "%s | Toko Lokal" },
  description: "Temukan toko dan usaha lokal, lihat menu, alamat, dan kontaknya. Bergabung sebagai afiliasi secara gratis.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#FAFAF9",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>
        <a className="skip-link" href="#konten">Langsung ke konten</a>
        <SiteHeader />
        <main id="konten" tabIndex={-1} className="page-container">{children}</main>
        <Navigation variant="bottom" />
      </body>
    </html>
  );
}
