import { create } from 'zustand';
import {
  Card,
  DEFAULT_DUE_DAY_OFFSET,
  DEFAULT_INTEREST_RATE,
  DEFAULT_MIN_PAYMENT_PCT,
  DEFAULT_MIN_PAYMENT_FLOOR,
} from '@/types/card';

interface CardStore {
  cards: Card[];
  addCard: (card: Omit<Card, 'id' | 'balanceUpdatedAt' | 'createdAt'>) => void;
}

let nextId = 1;

export const useCardStore = create<CardStore>((set) => ({
  cards: [],
  addCard: (cardData) => {
    const now = Date.now();
    const card: Card = {
      ...cardData,
      id: String(nextId++),
      balanceUpdatedAt: now,
      createdAt: now,
    };
    set((state) => ({ cards: [...state.cards, card] }));
  },
}));

export const cardDefaults = {
  dueDayOffset: DEFAULT_DUE_DAY_OFFSET,
  interestRate: DEFAULT_INTEREST_RATE,
  minPaymentPct: DEFAULT_MIN_PAYMENT_PCT,
  minPaymentFloor: DEFAULT_MIN_PAYMENT_FLOOR,
} as const;
