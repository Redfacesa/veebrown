import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, FashionProduct } from './types';

type CartStore = {
  items: CartItem[];
  addItem: (product: FashionProduct, opts?: { size?: string; color?: string; quantity?: number }) => void;
  replaceCart: (product: FashionProduct, opts?: { size?: string; color?: string; quantity?: number }) => void;
  removeItem: (productId: string, size?: string, color?: string) => void;
  updateQuantity: (productId: string, quantity: number, size?: string, color?: string) => void;
  clearCart: () => void;
  total: () => number;
  itemCount: () => number;
};

function cartKey(productId: string, size?: string, color?: string) {
  return `${productId}:${size ?? ''}:${color ?? ''}`;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, opts) => {
        const { size, color, quantity = 1 } = opts ?? {};
        set((state) => {
          const key = cartKey(product.id, size, color);
          const existing = state.items.find(
            (i) => cartKey(i.product.id, i.size, i.color) === key,
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                cartKey(i.product.id, i.size, i.color) === key
                  ? { ...i, quantity: i.quantity + quantity }
                  : i,
              ),
            };
          }
          return { items: [...state.items, { product, quantity, size, color }] };
        });
      },
      replaceCart: (product, opts) => {
        const { size, color, quantity = 1 } = opts ?? {};
        set({ items: [{ product, quantity, size, color }] });
      },
      removeItem: (productId, size, color) => {
        const key = cartKey(productId, size, color);
        set((state) => ({
          items: state.items.filter((i) => cartKey(i.product.id, i.size, i.color) !== key),
        }));
      },
      updateQuantity: (productId, quantity, size, color) => {
        const key = cartKey(productId, size, color);
        if (quantity <= 0) {
          get().removeItem(productId, size, color);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            cartKey(i.product.id, i.size, i.color) === key ? { ...i, quantity } : i,
          ),
        }));
      },
      clearCart: () => set({ items: [] }),
      total: () => get().items.reduce((s, i) => s + i.product.price * i.quantity, 0),
      itemCount: () => get().items.reduce((s, i) => s + i.quantity, 0),
    }),
    { name: 'veebrown-cart' },
  ),
);

type WishlistStore = {
  ids: string[];
  toggle: (id: string) => void;
  has: (id: string) => boolean;
};

export const useWishlist = create<WishlistStore>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (id) =>
        set((state) => ({
          ids: state.ids.includes(id) ? state.ids.filter((x) => x !== id) : [...state.ids, id],
        })),
      has: (id) => get().ids.includes(id),
    }),
    { name: 'veebrown-wishlist' },
  ),
);
