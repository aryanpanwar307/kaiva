import type { Metadata } from "next";
import { Playfair_Display, Montserrat } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "KAIVA — Handmade Artisanal Jewelry",
    template: "%s | KAIVA",
  },
  description:
    "Discover KAIVA's curated collection of handmade artisanal jewelry crafted for every lifestyle — Daily Wear, Travel, Beach Trips, and Date Nights.",
  keywords: [
    "artificial jewelry",
    "fashion jewelry",
    "handmade jewelry",
    "necklace",
    "earrings",
    "rings",
    "anklets",
    "handband",
    "daily wear jewelry",
    "beach jewelry",
    "date night jewelry",
  ],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: "KAIVA",
    title: "KAIVA — Handmade Artisanal Jewelry",
    description: "Curated artisanal jewelry for every lifestyle moment.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${montserrat.variable}`}>
      <body className="bg-background text-foreground antialiased font-sans">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#ffffff",
              border: "1px solid #E5E5E5",
              color: "#2A2A2A",
              fontFamily: "var(--font-montserrat), sans-serif",
              fontSize: "13px",
            },
          }}
        />
      </body>
    </html>
  );
}
