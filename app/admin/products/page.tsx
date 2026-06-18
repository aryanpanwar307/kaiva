import { adminListProducts } from "@/actions/products";
import Link from "next/link";
import Image from "next/image";
import { formatPrice, categoryLabel, getCloudinaryUrl } from "@/lib/utils";
import { Plus, Package } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Products — Admin" };

export default async function AdminProductsPage() {
  const products = await adminListProducts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Products</h1>
          <p className="text-muted-foreground mt-1">{products.length} total products</p>
        </div>
        <Link
          href="/admin/products/new"
          id="add-product-btn"
          className="flex items-center gap-2 px-5 py-2.5 bg-gold text-[#0a0a0a] rounded-full font-semibold text-sm hover:bg-gold-light transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 border border-border rounded-xl">
          <Package className="h-12 w-12 text-border mb-4" />
          <p className="text-muted-foreground">No products yet</p>
          <Link href="/admin/products/new" className="text-gold text-sm mt-2 hover:underline">
            Create your first product
          </Link>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Product
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Category
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Price
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  SKUs
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map((product) => {
                const firstSku = product.product_skus?.[0];
                const imageUrl = firstSku?.sku_image_url
                  ? getCloudinaryUrl(firstSku.sku_image_url, 80, 80)
                  : null;

                return (
                  <tr key={product.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          {imageUrl ? (
                            <Image src={imageUrl} alt={product.title} fill className="object-cover" sizes="40px" />
                          ) : (
                            <div className="flex items-center justify-center h-full text-base">💎</div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{product.title}</p>
                          <p className="text-xs text-muted-foreground font-mono">{product.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {categoryLabel(product.category)}
                    </td>
                    <td className="px-5 py-3 font-semibold text-gold">
                      {formatPrice(product.base_price)}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {product.product_skus?.length ?? 0} variants
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          product.is_active
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {product.is_active ? "Active" : "Draft"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
