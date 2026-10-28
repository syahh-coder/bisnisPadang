import { Catalog } from "@/components/catalog/catalog";
import { getCatalog } from "@/lib/catalog/server";
import { readFilters, type CatalogSearchParams } from "@/lib/catalog/types";

export default async function HomePage({ searchParams }: { searchParams: Promise<CatalogSearchParams> }) {
  const filters = readFilters(await searchParams);
  const catalog = await getCatalog(filters);
  return (
    <>
      <div className="page-heading">
        <h1>Toko di sekitar Anda</h1>
        <p>Kenali usaha lokal, lihat menu, dan hubungi tokonya.</p>
      </div>
      <Catalog catalog={catalog} filters={filters} view="home" />
    </>
  );
}
