import type { Metadata } from "next";
import { Catalog } from "@/components/catalog/catalog";
import { getCatalog } from "@/lib/catalog/server";
import { readFilters, type CatalogSearchParams } from "@/lib/catalog/types";

export const metadata: Metadata = {
  title: "Cari Toko & Kuliner Favorit di Sekitarmu",
  description: "Cari makanan enak, jajanan favorit, dan toko terdekat di sekitarmu dengan cepat.",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<CatalogSearchParams>;
}) {
  const filters = readFilters(await searchParams);
  const catalog = await getCatalog(filters);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-0">
      <div className="pt-4 pb-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Cari Toko & Jajanan
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Ketik nama toko, menu makanan, kopi, atau kebutuhan harian yang lagi kamu cari.
        </p>
      </div>
      <Catalog catalog={catalog} filters={filters} view="search" />
    </div>
  );
}
