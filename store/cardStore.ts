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

type EditableCardFields = Omit<Card, 'id' | 'balanceUpdatedAt' | 'createdAt'>;

interface CardStore {
  cards: Card[];
  _nextId: number;
  addCard: (card: Omit<Card, 'id' | 'balanceUpdatedAt' | 'createdAt' | 'pendingTransactions' | 'installmentsMonthlyAmount' | 'subscriptionsThisCycle' | 'annualFee' | 'annualFeeMonth'> & Partial<Pick<Card, 'pendingTransactions' | 'installmentsMonthlyAmount' | 'subscriptionsThisCycle' | 'annualFee' | 'annualFeeMonth'>>) => void;
  updateCard: (cardId: string, updates: Partial<EditableCardFields>) => void;
  updateBalance: (cardId: string, newBalance: number) => void;
  deleteCard: (cardId: string) => void;
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
          pendingTransactions: 0,
          installmentsMonthlyAmount: 0,
          subscriptionsThisCycle: 0,
          annualFee: 0,
          annualFeeMonth: 0,
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
      updateCard: (cardId, updates) => {
        set((state) => ({
          cards: state.cards.map((c) =>
            c.id === cardId ? { ...c, ...updates } : c,
          ),
        }));
      },
      updateBalance: (cardId, newBalance) => {
        set((state) => ({
          cards: state.cards.map((c) =>
            c.id === cardId
              ? { ...c, outstandingBalance: newBalance, balanceUpdatedAt: Date.now() }
              : c,
          ),
        }));
      },
      deleteCard: (cardId) => {
        set((state) => ({
          cards: state.cards.filter((c) => c.id !== cardId),
        }));
      },
    }),
    {
      name: 'falcly-cards',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as CardStore;
        if (version === 0) {
          // Backfill new projected balance fields for existing cards
          state.cards = state.cards.map((c) => ({
            ...c,
            pendingTransactions: c.pendingTransactions ?? 0,
            installmentsMonthlyAmount: c.installmentsMonthlyAmount ?? 0,
            subscriptionsThisCycle: c.subscriptionsThisCycle ?? 0,
            annualFee: c.annualFee ?? 0,
            annualFeeMonth: c.annualFeeMonth ?? 0,
          }));
        }
        return state;
      },
    },
  ),
);

export const cardDefaults = {
  dueDayOffset: DEFAULT_DUE_DAY_OFFSET,
  interestRate: DEFAULT_INTEREST_RATE,
  minPaymentPct: DEFAULT_MIN_PAYMENT_PCT,
  minPaymentFloor: DEFAULT_MIN_PAYMENT_FLOOR,
} as const;
