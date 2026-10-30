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

    if (!categoryChanged && !queryChanged) return;
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

  function handleClear() {
    setValue("");
    if (timeout.current) clearTimeout(timeout.current);
    input.current?.focus();
    search("", true);
  }

  return (
    <form
      action="/pencarian"
      role="search"
      aria-label="Cari toko, makanan, atau produk"
      className="relative w-full max-w-2xl mx-auto my-4"
      aria-busy={pending}
      onSubmit={(event) => {
        event.preventDefault();
        search(String(new FormData(event.currentTarget).get("q") ?? ""), false);
      }}
    >
      <label className="sr-only" htmlFor="pencarian-toko">
        Cari toko, makanan, atau produk lokal
      </label>
      <div className="relative flex items-center bg-white rounded-2xl border border-slate-200/90 shadow-sm focus-within:ring-2 focus-within:ring-teal-600 focus-within:border-teal-600 transition-all">
        <span className="pl-4 pr-2 text-slate-400 shrink-0">
          <Icon name="search" size={20} />
        </span>
        <input
          id="pencarian-toko"
          ref={input}
          name="q"
          type="search"
          placeholder="Cari toko, makanan, minuman, jasa di sekitarmu..."
          maxLength={MAX_QUERY_LENGTH}
          autoComplete="off"
          enterKeyHint="search"
          value={value}
          onInput={(event) => {
            const query = event.currentTarget.value;
            setValue(query);
            if (timeout.current) clearTimeout(timeout.current);
            if (live) timeout.current = setTimeout(() => search(query, true), 300);
          }}
          className="w-full py-3.5 pr-2 text-slate-900 placeholder:text-slate-400 text-sm bg-transparent focus:outline-none"
        />

        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1.5 mr-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Hapus pencarian"
          >
            <Icon name="close" size={16} />
          </button>
        )}

        {pending && (
          <span className="pr-3 text-teal-600 shrink-0">
            <span className="block w-4 h-4 border-2 border-teal-600/30 border-t-teal-600 rounded-full animate-spin" />
          </span>
        )}

        {filters.category && <input type="hidden" name="kategori" value={filters.category} />}

        <button
          type="submit"
          className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 mr-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
        >
          <span>Cari</span>
        </button>
      </div>
    </form>
  );
}
