"use client";

import { useFilters } from "@/hooks/useFilters";
import { categoryLabel, themeLabel } from "@/lib/utils";
import type { ProductCategory, LifestyleTheme, ShopFilters } from "@/types";

const CATEGORIES: ProductCategory[] = ["necklace", "handband", "earring", "ring", "anklet"];
const THEMES: LifestyleTheme[] = ["daily_wear", "travel", "beach_trip", "date_night"];
const COLORS = ["Gold", "Silver", "Rose Gold", "Black", "White"];
const SORT_OPTIONS = [
  { value: "newest",     label: "Newest First" },
  { value: "price_asc",  label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

export function FilterSidebar() {
  const { filters, setFilter, clearFilters } = useFilters();
  const hasActiveFilters = Object.values(filters).some(Boolean);

  const sectionTitle = "text-[9px] font-sans font-semibold uppercase tracking-[0.22em] text-[#2A2A2A] mb-4 block";
  const filterBtn = (active: boolean) =>
    `w-full text-left py-2 text-[12px] font-sans transition-colors border-b border-[#F0EEEA] ${
      active
        ? "text-[#C5A059] font-medium"
        : "text-[#6B6B6B] hover:text-[#2A2A2A]"
    }`;

  return (
    <aside className="w-full space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
        <span className="text-[11px] font-sans font-semibold uppercase tracking-[0.2em] text-[#2A2A2A]">
          Filter
        </span>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-[10px] font-sans uppercase tracking-wider text-[#C5A059] hover:opacity-70 transition-opacity"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Category */}
      <div>
        <span className={sectionTitle}>Category</span>
        <div className="space-y-0">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              id={`filter-category-${cat}`}
              onClick={() => setFilter("category", filters.category === cat ? undefined : cat)}
              className={filterBtn(filters.category === cat)}
            >
              {categoryLabel(cat)}
            </button>
          ))}
        </div>
      </div>

      {/* Lifestyle */}
      <div>
        <span className={sectionTitle}>Lifestyle</span>
        <div className="space-y-0">
          {THEMES.map((theme) => (
            <button
              key={theme}
              id={`filter-theme-${theme}`}
              onClick={() => setFilter("theme", filters.theme === theme ? undefined : theme)}
              className={filterBtn(filters.theme === theme)}
            >
              {themeLabel(theme)}
            </button>
          ))}
        </div>
      </div>

      {/* Color */}
      <div>
        <span className={sectionTitle}>Color</span>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((color) => (
            <button
              key={color}
              id={`filter-color-${color.toLowerCase().replace(" ", "-")}`}
              onClick={() => setFilter("color", filters.color === color ? undefined : color)}
              className={`px-3 py-1.5 text-[10px] font-sans uppercase tracking-wider border transition-all ${
                filters.color === color
                  ? "border-[#C5A059] text-[#C5A059] bg-[#C5A059]/5"
                  : "border-[#E5E5E5] text-[#6B6B6B] hover:border-[#C5A059] hover:text-[#C5A059]"
              }`}
            >
              {color}
            </button>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div>
        <span className={sectionTitle}>Sort By</span>
        <div className="space-y-0">
          {SORT_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              id={`sort-${value}`}
              onClick={() =>
                setFilter("sort", filters.sort === value ? undefined : (value as ShopFilters["sort"]))
              }
              className={filterBtn(filters.sort === value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
