import { Catalog } from "@/components/catalog/catalog";
import { getCatalog } from "@/lib/catalog/server";
import { readFilters, type CatalogSearchParams } from "@/lib/catalog/types";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<CatalogSearchParams>;
}) {
  const filters = readFilters(await searchParams);
  const catalog = await getCatalog(filters);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-0">
      <Catalog catalog={catalog} filters={filters} view="home" />
    </div>
  );
}
