import type { Metadata } from "next";
import { Catalog } from "@/components/catalog/catalog";
import { getCatalog } from "@/lib/catalog/server";
import { readFilters, type CatalogSearchParams } from "@/lib/catalog/types";

export const metadata: Metadata = { title: "Pencarian" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<CatalogSearchParams> }) {
  const filters = readFilters(await searchParams);
  const catalog = await getCatalog(filters);
  return (
    <>
      <div className="page-heading"><h1>Pencarian</h1><p>Cari toko atau menu dari usaha lokal.</p></div>
      <Catalog catalog={catalog} filters={filters} view="search" />
    </>
  );
}
