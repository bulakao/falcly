import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Card,
  DEFAULT_DUE_DAY_OFFSET,
  DEFAULT_INTEREST_RATE,
  DEFAULT_MIN_PAYMENT_PCT,
  DEFAULT_MIN_PAYMENT_FLOOR,
} from '@/types/card';

interface CardStore {
  cards: Card[];
  _nextId: number;
  addCard: (card: Omit<Card, 'id' | 'balanceUpdatedAt' | 'createdAt'>) => void;
}

export const useCardStore = create<CardStore>()(
  persist(
    (set, get) => ({
      cards: [],
      _nextId: 1,
      addCard: (cardData) => {
        const now = Date.now();
        const id = get()._nextId;
        const card: Card = {
          ...cardData,
          id: String(id),
          balanceUpdatedAt: now,
          createdAt: now,
        };
        set((state) => ({
          cards: [...state.cards, card],
          _nextId: state._nextId + 1,
        }));
      },
    }),
    {
      name: 'falcly-cards',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export const cardDefaults = {
  dueDayOffset: DEFAULT_DUE_DAY_OFFSET,
  interestRate: DEFAULT_INTEREST_RATE,
  minPaymentPct: DEFAULT_MIN_PAYMENT_PCT,
  minPaymentFloor: DEFAULT_MIN_PAYMENT_FLOOR,
} as const;
