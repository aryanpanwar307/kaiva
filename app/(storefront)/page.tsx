import { getTrendingProducts } from "@/actions/products";
import { ProductCard } from "@/components/shop/ProductCard";
import { themeLabel } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import type { LifestyleTheme } from "@/types";

export const revalidate = 300;

// SVG trust icons — thin stroke, artisanal style
function IconCertified() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="6" />
      <path d="M8.21 13.89 7 23l5-3 5 3-1.21-9.12" />
    </svg>
  );
}
function IconWarranty() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}
function IconDelivery() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}
function IconHandmade() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
      <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
      <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
      <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
    </svg>
  );
}

const trustItems = [
  {
    icon: <IconCertified />,
    title: "22KT Certified Gold Plating",
    desc: "Hallmark quality on every piece",
  },
  {
    icon: <IconWarranty />,
    title: "Lifetime Warranty",
    desc: "We stand behind our craftsmanship",
  },
  {
    icon: <IconDelivery />,
    title: "48 Hours Delivery",
    desc: "Express shipping across India",
  },
  {
    icon: <IconHandmade />,
    title: "Handmade Artisanal Jewelry",
    desc: "Crafted by skilled artisans",
  },
];

export default async function HomePage() {
  const trendingProducts = await getTrendingProducts(8);

  const themes: { theme: LifestyleTheme; label: string; desc: string }[] = [
    { theme: "daily_wear",  label: "Daily Wear",   desc: "Everyday elegance" },
    { theme: "travel",      label: "Travel",        desc: "Pack light, shine bright" },
    { theme: "beach_trip",  label: "Beach",         desc: "Sun, sand & sparkle" },
    { theme: "date_night",  label: "Date Night",    desc: "Made for moments" },
  ];

  return (
    <>
      {/* ─── HERO ─── */}
      <section className="relative w-full min-h-[90vh] flex items-center justify-center overflow-hidden bg-[#F3EFEC]">
        {/* Background image */}
        <Image
          src="/gemini-hero.png"
          alt="KAIVA artisanal jewelry editorial"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        {/* Dark overlay for legibility */}
        <div className="hero-overlay absolute inset-0" />

        {/* Text content */}
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
          <p
            className="animate-fade-up text-[11px] font-sans font-medium uppercase tracking-[0.5em] text-white/70 mb-6"
            style={{ animationDelay: "0ms", animationFillMode: "both" }}
          >
            Handmade Artisanal Jewelry
          </p>

          <h1
            className="animate-fade-up font-serif text-5xl md:text-7xl font-bold text-white leading-tight mb-6"
            style={{ animationDelay: "100ms", animationFillMode: "both" }}
          >
            Wear Your Story
          </h1>

          <p
            className="animate-fade-up font-sans text-base md:text-lg text-white/75 max-w-md mx-auto mb-10 leading-relaxed font-light"
            style={{ animationDelay: "200ms", animationFillMode: "both" }}
          >
            Curated artificial jewelry for every lifestyle moment — from morning
            coffee to moonlit dates.
          </p>

          <div
            className="animate-fade-up flex flex-col sm:flex-row gap-4 justify-center items-center"
            style={{ animationDelay: "300ms", animationFillMode: "both" }}
          >
            <Link
              href="/shop"
              id="hero-shop-btn"
              className="btn-primary min-w-[200px]"
            >
              Explore Collection
            </Link>
            <Link
              href="/shop?theme=date_night"
              className="btn-ghost min-w-[200px] text-white border-white/60 hover:bg-white hover:text-[#2A2A2A]"
            >
              Date Night Picks
            </Link>
          </div>
        </div>
      </section>

      {/* ─── THE PROMISE (Trust Badges) ─── */}
      <section className="trust-strip">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {trustItems.map(({ icon, title, desc }) => (
              <div key={title} className="flex flex-col items-center text-center gap-3">
                <div className="text-[#C5A059]">{icon}</div>
                <div>
                  <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-[#2A2A2A] mb-1">
                    {title}
                  </p>
                  <p className="font-sans text-[12px] text-[#6B6B6B]">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── LIFESTYLE THEMES ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-12">
          <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.4em] text-[#C5A059] mb-3">
            Shop By Lifestyle
          </p>
          <h2 className="font-serif text-4xl font-bold text-[#2A2A2A]">
            Find Your Style
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {themes.map(({ theme, label, desc }) => (
            <Link
              key={theme}
              href={`/shop?theme=${theme}`}
              id={`theme-card-${theme}`}
              className="group relative overflow-hidden border border-[#E5E5E5] bg-[#FAFAFA] p-8 flex flex-col items-center text-center gap-3 hover:border-[#C5A059] transition-all duration-300 card-hover"
            >
              <div>
                <h3 className="font-serif text-base font-semibold text-[#2A2A2A] group-hover:text-[#C5A059] transition-colors mb-1">
                  {label}
                </h3>
                <p className="font-sans text-[12px] text-[#6B6B6B]">{desc}</p>
              </div>
              <span className="font-sans text-[11px] uppercase tracking-wider text-[#C5A059] opacity-0 group-hover:opacity-100 transition-opacity mt-auto font-medium">
                Shop now →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── TRENDING PRODUCTS ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
        <div className="flex items-end justify-between mb-10 border-b border-[#E5E5E5] pb-5">
          <div>
            <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.4em] text-[#C5A059] mb-2">
              New Arrivals
            </p>
            <h2 className="font-serif text-3xl font-bold text-[#2A2A2A]">
              Trending Now
            </h2>
          </div>
          <Link
            href="/shop"
            className="font-sans text-[11px] uppercase tracking-[0.1em] text-[#6B6B6B] hover:text-[#C5A059] transition-colors font-medium"
          >
            View All →
          </Link>
        </div>

        {trendingProducts.length === 0 ? (
          <div className="text-center py-24">
            <p className="font-serif text-xl text-[#6B6B6B]">
              Our collection is coming soon...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-8">
            {trendingProducts.map((product, i) => (
              <div
                key={product.id}
                className="animate-fade-up"
                style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
