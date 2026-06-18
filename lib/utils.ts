import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format rupee amounts */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Slugify a product title */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Human-readable category label */
export function categoryLabel(category: string): string {
  const map: Record<string, string> = {
    necklace: "Necklace",
    handband: "Hand Band",
    earring: "Earring",
    ring: "Ring",
    anklet: "Anklet",
  };
  return map[category] ?? category;
}

/** Human-readable theme label */
export function themeLabel(theme: string): string {
  const map: Record<string, string> = {
    daily_wear: "Daily Wear",
    travel: "Travel",
    beach_trip: "Beach Trip",
    date_night: "Date Night",
  };
  return map[theme] ?? theme;
}

/** Format date to readable string */
export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(dateString));
}

/** Get Cloudinary optimized URL */
export function getCloudinaryUrl(
  url: string,
  width: number = 800,
  height: number = 800
): string {
  if (!url || !url.includes("cloudinary.com")) return url;
  return url.replace(
    "/upload/",
    `/upload/w_${width},h_${height},c_fill,f_auto,q_auto/`
  );
}

/** Payment status color */
export function paymentStatusColor(status: string): string {
  const map: Record<string, string> = {
    pending: "text-amber-400 bg-amber-400/10",
    paid: "text-emerald-400 bg-emerald-400/10",
    failed: "text-red-400 bg-red-400/10",
    refunded: "text-blue-400 bg-blue-400/10",
  };
  return map[status] ?? "text-gray-400 bg-gray-400/10";
}
