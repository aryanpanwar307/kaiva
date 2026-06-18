"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Upload, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createProduct } from "@/actions/products";
import { categoryLabel, themeLabel } from "@/lib/utils";
import type {
  ProductCategory,
  LifestyleTheme,
  SkuInput,
  ProductFormData,
} from "@/types";
import { toast } from "sonner";

const CATEGORIES: ProductCategory[] = ["necklace", "handband", "earring", "ring", "anklet"];
const THEMES: LifestyleTheme[] = ["daily_wear", "travel", "beach_trip", "date_night"];

const defaultSku = (): SkuInput => ({
  color: "",
  stock_quantity: 1,
  sku_image_url: "",
  price_modifier: 0,
});

export function ProductForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [category, setCategory] = useState<ProductCategory>("necklace");
  const [themes, setThemes] = useState<LifestyleTheme[]>([]);
  const [skus, setSkus] = useState<SkuInput[]>([defaultSku()]);
  const [uploadingSkuIndex, setUploadingSkuIndex] = useState<number | null>(null);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const toggleTheme = (theme: LifestyleTheme) => {
    setThemes((prev) =>
      prev.includes(theme) ? prev.filter((t) => t !== theme) : [...prev, theme]
    );
  };

  const addSku = () => setSkus((prev) => [...prev, defaultSku()]);
  const removeSku = (i: number) => setSkus((prev) => prev.filter((_, idx) => idx !== i));
  const updateSku = (i: number, field: keyof SkuInput, value: string | number) => {
    setSkus((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)));
  };

  const handleImageUpload = async (skuIndex: number, file: File) => {
    setUploadingSkuIndex(skuIndex);
    try {
      // 1. Get signed params from our secure endpoint
      const signRes = await fetch("/api/cloudinary/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: "kaiva/products" }),
      });

      if (!signRes.ok) throw new Error("Failed to get upload signature");
      const signData = await signRes.json();

      // 2. Upload directly to Cloudinary with signed params
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", signData.api_key);
      formData.append("timestamp", signData.timestamp);
      formData.append("signature", signData.signature);
      formData.append("folder", signData.folder);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${signData.cloud_name}/image/upload`,
        { method: "POST", body: formData }
      );

      if (!uploadRes.ok) throw new Error("Upload failed");
      const uploadData = await uploadRes.json();

      updateSku(skuIndex, "sku_image_url", uploadData.secure_url);
      toast.success("Image uploaded successfully");
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Image upload failed");
    } finally {
      setUploadingSkuIndex(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !basePrice || !category) {
      toast.error("Please fill all required fields");
      return;
    }
    if (skus.some((s) => !s.color)) {
      toast.error("All SKUs must have a color");
      return;
    }

    setLoading(true);
    try {
      const formData: ProductFormData = {
        title,
        description,
        base_price: parseFloat(basePrice),
        category,
        themes,
        skus,
      };

      const result = await createProduct(formData);
      if (result.success) {
        toast.success("Product created successfully!");
        router.push("/admin/products");
      } else {
        toast.error(result.error ?? "Failed to create product");
      }
    } catch (err) {
      toast.error("Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
      {/* Basic Info */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-5">
        <h2 className="font-semibold text-foreground">Product Details</h2>

        <Input
          id="product-title"
          label="Title *"
          placeholder="Gold Leaf Pendant Necklace"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <Textarea
          id="product-description"
          label="Description"
          placeholder="Describe the material, style, and occasions..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Input
          id="product-price"
          label="Base Price (₹) *"
          type="number"
          placeholder="499"
          min="0"
          step="0.01"
          value={basePrice}
          onChange={(e) => setBasePrice(e.target.value)}
          required
        />
      </div>

      {/* Category */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-foreground">Category *</h2>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              id={`admin-category-${cat}`}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                category === cat
                  ? "bg-gold/10 border-gold text-gold"
                  : "border-border text-muted-foreground hover:border-gold/40"
              }`}
            >
              {categoryLabel(cat)}
            </button>
          ))}
        </div>
      </div>

      {/* Themes */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-foreground">Lifestyle Themes</h2>
        <div className="flex flex-wrap gap-2">
          {THEMES.map((theme) => (
            <button
              key={theme}
              type="button"
              id={`admin-theme-${theme}`}
              onClick={() => toggleTheme(theme)}
              className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                themes.includes(theme)
                  ? "bg-gold/10 border-gold text-gold"
                  : "border-border text-muted-foreground hover:border-gold/40"
              }`}
            >
              {themeLabel(theme)}
            </button>
          ))}
        </div>
      </div>

      {/* SKUs */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Color Variants (SKUs)</h2>
          <button
            type="button"
            id="add-sku-btn"
            onClick={addSku}
            className="flex items-center gap-1.5 text-sm text-gold hover:text-gold-light transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Variant
          </button>
        </div>

        <div className="space-y-4">
          {skus.map((sku, i) => (
            <div
              key={i}
              className="border border-border rounded-xl p-4 space-y-4 relative"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Variant #{i + 1}
                </span>
                {skus.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSku(i)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                    aria-label="Remove variant"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  id={`sku-color-${i}`}
                  label="Color *"
                  placeholder="Gold"
                  value={sku.color}
                  onChange={(e) => updateSku(i, "color", e.target.value)}
                />
                <Input
                  id={`sku-stock-${i}`}
                  label="Stock Quantity *"
                  type="number"
                  min="0"
                  value={sku.stock_quantity}
                  onChange={(e) => updateSku(i, "stock_quantity", parseInt(e.target.value) || 0)}
                />
              </div>

              <Input
                id={`sku-price-mod-${i}`}
                label="Price Modifier (₹)"
                type="number"
                step="0.01"
                placeholder="0 (adds to base price)"
                value={sku.price_modifier}
                onChange={(e) => updateSku(i, "price_modifier", parseFloat(e.target.value) || 0)}
              />

              {/* Image upload */}
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-widest block mb-2">
                  Product Image
                </label>
                {sku.sku_image_url ? (
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={sku.sku_image_url}
                      alt="Uploaded"
                      className="h-16 w-16 rounded-lg object-cover border border-border"
                    />
                    <div>
                      <p className="text-xs text-emerald-400 font-medium">✓ Uploaded</p>
                      <button
                        type="button"
                        onClick={() => updateSku(i, "sku_image_url", "")}
                        className="text-xs text-muted-foreground hover:text-destructive mt-1 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <input
                      ref={(el) => { fileInputRefs.current[i] = el; }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(i, file);
                      }}
                    />
                    <button
                      type="button"
                      id={`upload-image-${i}`}
                      onClick={() => fileInputRefs.current[i]?.click()}
                      disabled={uploadingSkuIndex === i}
                      className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-border rounded-lg text-sm text-muted-foreground hover:border-gold/40 hover:text-foreground transition-all"
                    >
                      {uploadingSkuIndex === i ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      {uploadingSkuIndex === i ? "Uploading..." : "Upload Image"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        <button
          type="submit"
          id="submit-product-btn"
          disabled={loading}
          className="flex items-center gap-2 px-8 py-3 bg-gold text-[#0a0a0a] rounded-full font-bold text-sm hover:bg-gold-light transition-all active:scale-95 disabled:opacity-50"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Creating..." : "Create Product"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 border border-border rounded-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
