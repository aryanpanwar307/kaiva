"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CartItem } from "@/types";

interface CartState {
  items: CartItem[];
  isOpen: boolean;

  // Actions
  addItem: (sku_id: string, quantity?: number) => void;
  removeItem: (sku_id: string) => void;
  updateQuantity: (sku_id: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  getTotalItems: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (sku_id, quantity = 1) => {
        set((state) => {
          const existing = state.items.find((i) => i.sku_id === sku_id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.sku_id === sku_id
                  ? { ...i, quantity: i.quantity + quantity }
                  : i
              ),
            };
          }
          return {
            items: [...state.items, { sku_id, quantity }],
          };
        });
      },

      removeItem: (sku_id) => {
        set((state) => ({
          items: state.items.filter((i) => i.sku_id !== sku_id),
        }));
      },

      updateQuantity: (sku_id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(sku_id);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.sku_id === sku_id ? { ...i, quantity } : i
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      getTotalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    {
      name: "kaiva-cart",
      storage: createJSONStorage(() => localStorage),
      // SECURITY: Only persist sku_id and quantity — never prices
      partialize: (state) => ({ items: state.items }),
    }
  )
);
