"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icon";
import { catalogHref, MAX_QUERY_LENGTH, type CatalogFilters } from "@/lib/catalog/types";

export function SearchForm({ filters, live }: { filters: CatalogFilters; live: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState(filters.query);
  const [pending, startTransition] = useTransition();
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestedQueries = useRef(new Set<string>());
  const previousCategory = useRef(filters.category);
  const previousQuery = useRef(filters.query);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const categoryChanged = previousCategory.current !== filters.category;
    const queryChanged = previousQuery.current !== filters.query;
    previousCategory.current = filters.category;
    previousQuery.current = filters.query;
    // Hydration tidak boleh mengganti ketikan yang sudah masuk ke input server.
    if (!categoryChanged && !queryChanged) return;
    // Respons pencarian sebelumnya tidak boleh menimpa ketikan yang lebih baru.
    if (!categoryChanged && requestedQueries.current.delete(filters.query)) return;
    setValue(filters.query);
    requestedQueries.current.clear();
    if (timeout.current) clearTimeout(timeout.current);
  }, [filters.query, filters.category]);

  useEffect(() => {
    const typed = input.current?.value;
    if (typed !== undefined && typed !== filters.query) {
      setValue(typed);
      if (live) search(typed, true);
    }
    if (live) input.current?.focus({ preventScroll: true });
    function restoreHistory() {
      requestedQueries.current.clear();
      if (timeout.current) clearTimeout(timeout.current);
      setValue(new URLSearchParams(window.location.search).get("q") ?? "");
    }
    window.addEventListener("popstate", restoreHistory);
    return () => {
      if (timeout.current) clearTimeout(timeout.current);
      window.removeEventListener("popstate", restoreHistory);
    };
  }, [live]);

  function search(query: string, replace: boolean) {
    if (timeout.current) clearTimeout(timeout.current);
    const normalizedQuery = query.replace(/\s+/g, " ").trim().slice(0, MAX_QUERY_LENGTH);
    requestedQueries.current.add(normalizedQuery);
    const href = catalogHref("/pencarian", { ...filters, query: normalizedQuery, page: 1 });
    startTransition(() => {
      if (replace) router.replace(href, { scroll: false });
      else router.push(href);
    });
  }

  return (
    <form
      action="/pencarian"
      role="search"
      aria-label="Cari toko atau menu"
      className="catalog-search"
      aria-busy={pending}
      onSubmit={(event) => {
        event.preventDefault();
        // Nilai DOM juga mencakup ketikan sebelum hydration/event React selesai.
        search(String(new FormData(event.currentTarget).get("q") ?? ""), false);
      }}
    >
      <label className="sr-only" htmlFor="pencarian-toko">Cari toko atau menu</label>
      <span className="search-decoration"><Icon name="search" /></span>
      <input
        id="pencarian-toko"
        ref={input}
        name="q"
        type="search"
        placeholder="Cari toko atau menu"
        maxLength={MAX_QUERY_LENGTH}
        autoComplete="off"
        enterKeyHint="search"
        value={value}
        onInput={(event) => {
          const query = event.currentTarget.value;
          setValue(query);
          if (timeout.current) clearTimeout(timeout.current);
          if (live) timeout.current = setTimeout(() => search(query, true), 350);
        }}
      />
      {filters.category && <input type="hidden" name="kategori" value={filters.category} />}
      <button type="submit" className="search-submit">Cari</button>
    </form>
  );
}
