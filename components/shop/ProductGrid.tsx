import type { ProductWithSkus } from "@/types";
import { ProductCard } from "./ProductCard";

interface ProductGridProps {
  products: ProductWithSkus[];
}

export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="font-serif text-2xl text-[#2A2A2A] mb-2">No pieces found</p>
        <p className="font-sans text-sm text-[#6B6B6B]">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-8">
      {products.map((product, i) => (
        <div
          key={product.id}
          className="animate-fade-up"
          style={{ animationDelay: `${i * 50}ms`, animationFillMode: "both" }}
        >
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  );
}
