"use client";

import { create } from "zustand";

interface WishlistState {
  skuIds: Set<string>;
  isLoaded: boolean;

  // Actions
  setWishlist: (skuIds: string[]) => void;
  addToWishlist: (skuId: string) => void;
  removeFromWishlist: (skuId: string) => void;
  toggleWishlist: (skuId: string) => void;
  isWishlisted: (skuId: string) => boolean;
  setLoaded: () => void;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  skuIds: new Set(),
  isLoaded: false,

  setWishlist: (skuIds) => set({ skuIds: new Set(skuIds), isLoaded: true }),

  addToWishlist: (skuId) =>
    set((state) => {
      const next = new Set(state.skuIds);
      next.add(skuId);
      return { skuIds: next };
    }),

  removeFromWishlist: (skuId) =>
    set((state) => {
      const next = new Set(state.skuIds);
      next.delete(skuId);
      return { skuIds: next };
    }),

  toggleWishlist: (skuId) => {
    const { skuIds, addToWishlist, removeFromWishlist } = get();
    if (skuIds.has(skuId)) {
      removeFromWishlist(skuId);
    } else {
      addToWishlist(skuId);
    }
  },

  isWishlisted: (skuId) => get().skuIds.has(skuId),

  setLoaded: () => set({ isLoaded: true }),
}));
