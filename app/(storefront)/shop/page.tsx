import { Suspense } from "react";
import { getProducts } from "@/actions/products";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { FilterSidebar } from "@/components/shop/FilterSidebar";
import type { ShopFilters, ProductCategory, LifestyleTheme } from "@/types";
import type { Metadata } from "next";
import { categoryLabel, themeLabel } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Shop — All Jewelry",
  description:
    "Browse KAIVA's full collection of luxury artificial jewelry. Filter by category, theme, and color.",
};

interface ShopPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function ProductsSection({ filters }: { filters: ShopFilters }) {
  const products = await getProducts(filters);
  return <ProductGrid products={products} />;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams;

  const filters: ShopFilters = {
    category: (params.category as ProductCategory) || undefined,
    theme: (params.theme as LifestyleTheme) || undefined,
    color: (params.color as string) || undefined,
    sort: (params.sort as ShopFilters["sort"]) || undefined,
    search: (params.search as string) || undefined,
  };

  // Build a descriptive page title based on active filters
  let headingText = "All Jewelry";
  if (filters.theme) headingText = `${themeLabel(filters.theme)} Collection`;
  else if (filters.category) headingText = `${categoryLabel(filters.category)}s`;

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="border-b border-[#E5E5E5] bg-[#FAFAFA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.4em] text-[#C5A059] mb-2">
            KAIVA Collection
          </p>
          <h1 className="font-serif text-4xl font-bold text-[#2A2A2A]">{headingText}</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex gap-12">
          {/* Filters — desktop sidebar */}
          <div className="hidden lg:block w-48 flex-shrink-0">
            <FilterSidebar />
          </div>

          {/* Product grid */}
          <div className="flex-1">
            <Suspense
              fallback={
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-8">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i}>
                      <div className="skeleton w-full bg-[#F3EFEC]" style={{ aspectRatio: "4/5" }} />
                      <div className="pt-4 space-y-2">
                        <div className="skeleton h-2 w-12 mx-auto rounded" />
                        <div className="skeleton h-3 w-28 mx-auto rounded" />
                        <div className="skeleton h-3 w-16 mx-auto rounded" />
                        <div className="skeleton h-8 w-full rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              }
            >
              <ProductsSection filters={filters} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
