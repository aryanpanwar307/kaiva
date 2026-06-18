"use client";

import { useCartStore } from "@/store/cartStore";

export function useCart() {
  const {
    items,
    isOpen,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    openCart,
    closeCart,
    toggleCart,
    getTotalItems,
  } = useCartStore();

  return {
    items,
    isOpen,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    openCart,
    closeCart,
    toggleCart,
    totalItems: getTotalItems(),
  };
}
