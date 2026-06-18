"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getCloudinaryUrl } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface ImageGalleryProps {
  images: string[];
  productTitle: string;
}

export function ImageGallery({ images, productTitle }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const filteredImages = images.filter(Boolean);
  const hasImages = filteredImages.length > 0;

  return (
    <div className="space-y-4">
      {/* Main image */}
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-card border border-border">
        {hasImages ? (
          <Image
            src={getCloudinaryUrl(filteredImages[activeIndex], 900, 900)}
            alt={`${productTitle} — view ${activeIndex + 1}`}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-8xl">💎</span>
          </div>
        )}

        {/* Navigation arrows */}
        {filteredImages.length > 1 && (
          <>
            <button
              onClick={() =>
                setActiveIndex((prev) =>
                  prev === 0 ? filteredImages.length - 1 : prev - 1
                )
              }
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 glass rounded-full hover:scale-105 transition-all"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() =>
                setActiveIndex((prev) =>
                  prev === filteredImages.length - 1 ? 0 : prev + 1
                )
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 glass rounded-full hover:scale-105 transition-all"
              aria-label="Next image"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}

        {/* Dot indicator */}
        {filteredImages.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {filteredImages.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-200",
                  i === activeIndex
                    ? "w-5 bg-gold"
                    : "w-1.5 bg-white/30"
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {filteredImages.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {filteredImages.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={cn(
                "relative aspect-square rounded-lg overflow-hidden border transition-all duration-150",
                i === activeIndex
                  ? "border-gold shadow-gold"
                  : "border-border hover:border-gold/40"
              )}
            >
              <Image
                src={getCloudinaryUrl(img, 200, 200)}
                alt={`View ${i + 1}`}
                fill
                className="object-cover"
                sizes="100px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
