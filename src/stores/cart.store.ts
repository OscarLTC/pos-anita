import { create } from "zustand";
import type { Product } from "@/types";

export type CartItem = { product: Product; quantity: number };

interface CartState {
  items: CartItem[];
  /** Suma a productos por unidad (+1). */
  addUnit: (product: Product) => void;
  /** Resta 1 a un producto por unidad; lo elimina si llega a 0. */
  decreaseUnit: (productId: string) => void;
  /** Fija la cantidad absoluta (productos por peso/volumen). 0 = eliminar. */
  setWeight: (product: Product, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  getQty: (productId: string) => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addUnit: (product) =>
    set((s) => {
      const existing = s.items.find((i) => i.product.id === product.id);
      if (existing) {
        return {
          items: s.items.map((i) =>
            i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
          ),
        };
      }
      return { items: [...s.items, { product, quantity: 1 }] };
    }),

  decreaseUnit: (productId) =>
    set((s) => {
      const item = s.items.find((i) => i.product.id === productId);
      if (!item) return s;
      if (item.quantity <= 1) {
        return { items: s.items.filter((i) => i.product.id !== productId) };
      }
      return {
        items: s.items.map((i) =>
          i.product.id === productId ? { ...i, quantity: i.quantity - 1 } : i,
        ),
      };
    }),

  setWeight: (product, quantity) =>
    set((s) => {
      if (quantity <= 0) {
        return { items: s.items.filter((i) => i.product.id !== product.id) };
      }
      const existing = s.items.find((i) => i.product.id === product.id);
      if (existing) {
        return {
          items: s.items.map((i) => (i.product.id === product.id ? { ...i, quantity } : i)),
        };
      }
      return { items: [...s.items, { product, quantity }] };
    }),

  remove: (productId) => set((s) => ({ items: s.items.filter((i) => i.product.id !== productId) })),

  clear: () => set({ items: [] }),

  getQty: (productId) => get().items.find((i) => i.product.id === productId)?.quantity ?? 0,
}));

/** ¿El producto se vende por peso/volumen (no por unidad)? */
export const isWeighed = (item: CartItem) => item.product.unit !== "unit";

/** Redondeo a la decena de céntimo más cercana (S/ 0.10): 9.45 → 9.50, 9.51 → 9.50. */
export const roundToCash = (amount: number) => Math.round(amount * 10) / 10;

/**
 * Subtotal de un ítem. Si la tienda redondea y el producto es por peso, ajusta a
 * la decena de céntimo más cercana; el resto queda exacto.
 */
export const itemSubtotal = (item: CartItem, roundWeighted: boolean) => {
  const raw = item.product.sale_price * item.quantity;
  return roundWeighted && isWeighed(item) ? roundToCash(raw) : raw;
};

/** Total bruto (sin redondeo). */
export const cartRawTotal = (items: CartItem[]) =>
  items.reduce((sum, i) => sum + i.product.sale_price * i.quantity, 0);

/** Total aplicando el redondeo de ítems de peso si está activo en la tienda. */
export const cartTotal = (items: CartItem[], roundWeighted: boolean) =>
  items.reduce((sum, i) => sum + itemSubtotal(i, roundWeighted), 0);
