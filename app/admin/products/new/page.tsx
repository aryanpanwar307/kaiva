import { ProductForm } from "@/components/admin/ProductForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Create Product — Admin" };

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Create New Product</h1>
        <p className="text-muted-foreground mt-1">
          Add a new jewelry product with color variants and Cloudinary images
        </p>
      </div>
      <ProductForm />
    </div>
  );
}
