"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Upload, Loader2, X, ImageIcon } from "lucide-react";
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
import Image from "next/image";

const CATEGORIES: ProductCategory[] = ["necklace", "handband", "earring", "ring", "anklet"];
const THEMES: LifestyleTheme[] = ["daily_wear", "travel", "beach_trip", "date_night"];

const defaultSku = (): SkuInput => ({
  color: "",
  stock_quantity: 1,
  sku_image_url: "",
  sku_image_urls: [],
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
  // Track which (skuIndex, imageSlot) is currently uploading
  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  const toggleTheme = (theme: LifestyleTheme) => {
    setThemes((prev) =>
      prev.includes(theme) ? prev.filter((t) => t !== theme) : [...prev, theme]
    );
  };

  const addSku = () => setSkus((prev) => [...prev, defaultSku()]);
  const removeSku = (i: number) => setSkus((prev) => prev.filter((_, idx) => idx !== i));
  const updateSku = (i: number, field: keyof SkuInput, value: string | number | string[]) => {
    setSkus((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)));
  };

  // Upload a single image to Cloudinary and return its secure URL
  const uploadToCloudinary = async (file: File): Promise<string> => {
    const signRes = await fetch("/api/cloudinary/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folder: "kaiva/products" }),
    });
    if (!signRes.ok) throw new Error("Failed to get upload signature");
    const signData = await signRes.json();

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
    return uploadData.secure_url as string;
  };

  const handleAddImages = async (skuIndex: number, files: FileList) => {
    const fileArr = Array.from(files);
    for (let j = 0; j < fileArr.length; j++) {
      const key = `${skuIndex}-${j}`;
      setUploading(key);
      try {
        const url = await uploadToCloudinary(fileArr[j]);
        setSkus((prev) =>
          prev.map((s, idx) => {
            if (idx !== skuIndex) return s;
            const newUrls = [...s.sku_image_urls, url];
            return {
              ...s,
              sku_image_urls: newUrls,
              // keep sku_image_url in sync with first image
              sku_image_url: newUrls[0] ?? s.sku_image_url,
            };
          })
        );
        toast.success(`Image ${j + 1} of ${fileArr.length} uploaded`);
      } catch (err) {
        console.error("Upload error:", err);
        toast.error(`Failed to upload image ${j + 1}`);
      } finally {
        setUploading(null);
      }
    }
  };

  const removeImage = (skuIndex: number, imgIndex: number) => {
    setSkus((prev) =>
      prev.map((s, idx) => {
        if (idx !== skuIndex) return s;
        const newUrls = s.sku_image_urls.filter((_, i) => i !== imgIndex);
        return {
          ...s,
          sku_image_urls: newUrls,
          sku_image_url: newUrls[0] ?? "",
        };
      })
    );
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
    } catch {
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

        <div className="space-y-5">
          {skus.map((sku, i) => (
            <div
              key={i}
              className="border border-border rounded-xl p-5 space-y-5 relative"
            >
              {/* Variant header */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">
                  Variant #{i + 1}
                  {sku.color && (
                    <span className="ml-2 text-gold font-normal">— {sku.color}</span>
                  )}
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

              {/* Color + Stock */}
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
                  onChange={(e) =>
                    updateSku(i, "stock_quantity", parseInt(e.target.value) || 0)
                  }
                />
              </div>

              <Input
                id={`sku-price-mod-${i}`}
                label="Price Modifier (₹)"
                type="number"
                step="0.01"
                placeholder="0 (adds to base price)"
                value={sku.price_modifier}
                onChange={(e) =>
                  updateSku(i, "price_modifier", parseFloat(e.target.value) || 0)
                }
              />

              {/* ── Multi-image upload ── */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                    Product Images
                    <span className="ml-1.5 normal-case text-muted-foreground/60">
                      ({sku.sku_image_urls.length} uploaded · first image is the cover)
                    </span>
                  </label>
                  {/* Hidden multi-file input */}
                  <input
                    ref={(el) => {
                      if (el) fileInputRefs.current.set(`${i}`, el);
                    }}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.length) {
                        handleAddImages(i, e.target.files);
                        e.target.value = ""; // reset so same file can be re-added
                      }
                    }}
                  />
                  <button
                    type="button"
                    id={`upload-image-${i}`}
                    onClick={() => fileInputRefs.current.get(`${i}`)?.click()}
                    disabled={!!uploading}
                    className="flex items-center gap-2 px-3 py-1.5 border border-dashed border-gold/40 rounded-lg text-xs text-gold hover:border-gold hover:bg-gold/5 transition-all disabled:opacity-50"
                  >
                    {uploading?.startsWith(`${i}-`) ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Upload className="h-3.5 w-3.5" />
                    )}
                    {uploading?.startsWith(`${i}-`) ? "Uploading..." : "Add Images"}
                  </button>
                </div>

                {/* Image grid */}
                {sku.sku_image_urls.length > 0 ? (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {sku.sku_image_urls.map((url, imgIdx) => (
                      <div key={imgIdx} className="relative group aspect-square">
                        <div
                          className={`relative h-full w-full rounded-lg overflow-hidden border-2 transition-all ${
                            imgIdx === 0
                              ? "border-gold shadow-sm"
                              : "border-border"
                          }`}
                        >
                          <Image
                            src={url}
                            alt={`Variant ${i + 1} image ${imgIdx + 1}`}
                            fill
                            className="object-cover"
                            sizes="100px"
                          />
                          {/* Cover badge */}
                          {imgIdx === 0 && (
                            <span className="absolute bottom-0 left-0 right-0 bg-gold/80 text-[#0a0a0a] text-[9px] font-bold text-center py-0.5 uppercase tracking-wider">
                              Cover
                            </span>
                          )}
                        </div>
                        {/* Remove button */}
                        <button
                          type="button"
                          onClick={() => removeImage(i, imgIdx)}
                          className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                          aria-label="Remove image"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}

                    {/* Placeholder add-more slot */}
                    <button
                      type="button"
                      onClick={() => fileInputRefs.current.get(`${i}`)?.click()}
                      disabled={!!uploading}
                      className="aspect-square rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:border-gold/40 hover:text-gold transition-all disabled:opacity-50"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  /* Empty state — large drop zone */
                  <button
                    type="button"
                    onClick={() => fileInputRefs.current.get(`${i}`)?.click()}
                    disabled={!!uploading}
                    className="w-full flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed border-border rounded-xl text-muted-foreground hover:border-gold/40 hover:text-foreground transition-all disabled:opacity-50"
                  >
                    <ImageIcon className="h-8 w-8 opacity-40" />
                    <span className="text-sm">Click to upload images</span>
                    <span className="text-xs opacity-60">You can select multiple at once</span>
                  </button>
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
