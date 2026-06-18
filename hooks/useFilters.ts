"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import type { ShopFilters, ProductCategory, LifestyleTheme } from "@/types";

export function useFilters(): {
  filters: ShopFilters;
  setFilter: <K extends keyof ShopFilters>(key: K, value: ShopFilters[K] | undefined) => void;
  clearFilters: () => void;
} {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters: ShopFilters = {
    category: (searchParams.get("category") as ProductCategory) || undefined,
    theme: (searchParams.get("theme") as LifestyleTheme) || undefined,
    color: searchParams.get("color") || undefined,
    sort: (searchParams.get("sort") as ShopFilters["sort"]) || undefined,
    search: searchParams.get("search") || undefined,
  };

  const setFilter = useCallback(
    <K extends keyof ShopFilters>(key: K, value: ShopFilters[K] | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === undefined || value === "") {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  const clearFilters = useCallback(() => {
    router.push(pathname, { scroll: false });
  }, [router, pathname]);

  return { filters, setFilter, clearFilters };
}
