"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  productId: string;
  variantId: string;
  productName: string;
  slug: string;
  size: string;
  color: string;
  unitPrice: number;
  quantity: number;
  image?: string;
  maxStock: number;
}

interface CartState {
  items: CartItem[];
  savedForLater: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  saveForLater: (variantId: string) => void;
  moveToCart: (variantId: string) => void;
  removeSaved: (variantId: string) => void;
  clearCart: () => void;
  subtotal: () => number;
  itemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      savedForLater: [],

      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.variantId === item.variantId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.variantId === item.variantId
                  ? { ...i, quantity: Math.min(i.quantity + item.quantity, i.maxStock) }
                  : i
              ),
            };
          }
          return { items: [...state.items, item] };
        }),

      removeItem: (variantId) =>
        set((state) => ({ items: state.items.filter((i) => i.variantId !== variantId) })),

      updateQuantity: (variantId, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.variantId === variantId
              ? { ...i, quantity: Math.max(1, Math.min(quantity, i.maxStock)) }
              : i
          ),
        })),

      saveForLater: (variantId) =>
        set((state) => {
          const item = state.items.find((i) => i.variantId === variantId);
          if (!item) return state;
          return {
            items: state.items.filter((i) => i.variantId !== variantId),
            savedForLater: [...state.savedForLater, item],
          };
        }),

      moveToCart: (variantId) =>
        set((state) => {
          const item = state.savedForLater.find((i) => i.variantId === variantId);
          if (!item) return state;
          return {
            savedForLater: state.savedForLater.filter((i) => i.variantId !== variantId),
            items: [...state.items, item],
          };
        }),

      removeSaved: (variantId) =>
        set((state) => ({
          savedForLater: state.savedForLater.filter((i) => i.variantId !== variantId),
        })),

      clearCart: () => set({ items: [] }),

      subtotal: () => get().items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      name: "savanna-sole-cart",
    }
  )
);
