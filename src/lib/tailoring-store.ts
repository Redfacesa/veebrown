import { create } from 'zustand';
import type { TailoringService } from './types';

export type TailoringCartLine = {
  service: TailoringService;
  quantity: number;
};

export type TailoringUrgency = 'standard' | 'express' | 'rush';

const URGENCY_MULT: Record<TailoringUrgency, number> = {
  standard: 1,
  express: 1.5,
  rush: 2,
};

type TailoringCartStore = {
  lines: TailoringCartLine[];
  urgency: TailoringUrgency;
  pickup: 'pickup' | 'delivery';
  addService: (service: TailoringService) => void;
  removeService: (serviceId: string) => void;
  setQuantity: (serviceId: string, quantity: number) => void;
  setUrgency: (urgency: TailoringUrgency) => void;
  setPickup: (pickup: 'pickup' | 'delivery') => void;
  clear: () => void;
  subtotal: () => number;
  total: () => number;
  lineCount: () => number;
};

export function urgencyMultiplier(urgency: TailoringUrgency): number {
  return URGENCY_MULT[urgency];
}

export const useTailoringCart = create<TailoringCartStore>((set, get) => ({
  lines: [],
  urgency: 'standard',
  pickup: 'pickup',
  addService: (service) => {
    set((state) => {
      const existing = state.lines.find((l) => l.service.id === service.id);
      if (existing) {
        return {
          lines: state.lines.map((l) =>
            l.service.id === service.id ? { ...l, quantity: l.quantity + 1 } : l,
          ),
        };
      }
      return { lines: [...state.lines, { service, quantity: 1 }] };
    });
  },
  removeService: (serviceId) => {
    set((state) => ({ lines: state.lines.filter((l) => l.service.id !== serviceId) }));
  },
  setQuantity: (serviceId, quantity) => {
    if (quantity <= 0) {
      get().removeService(serviceId);
      return;
    }
    set((state) => ({
      lines: state.lines.map((l) => (l.service.id === serviceId ? { ...l, quantity } : l)),
    }));
  },
  setUrgency: (urgency) => set({ urgency }),
  setPickup: (pickup) => set({ pickup }),
  clear: () => set({ lines: [], urgency: 'standard', pickup: 'pickup' }),
  subtotal: () => get().lines.reduce((s, l) => s + l.service.price * l.quantity, 0),
  total: () => get().subtotal() * urgencyMultiplier(get().urgency),
  lineCount: () => get().lines.reduce((s, l) => s + l.quantity, 0),
}));
