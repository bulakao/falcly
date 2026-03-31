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

type EditableCardFields = Omit<Card, 'id' | 'balanceUpdatedAt' | 'createdAt' | 'isActive'>;

interface CardStore {
  cards: Card[];
  _nextId: number;
  addCard: (card: Omit<Card, 'id' | 'balanceUpdatedAt' | 'createdAt' | 'isActive' | 'pendingTransactions' | 'installmentsMonthlyAmount' | 'subscriptionsThisCycle' | 'annualFee' | 'annualFeeMonth'> & Partial<Pick<Card, 'pendingTransactions' | 'installmentsMonthlyAmount' | 'subscriptionsThisCycle' | 'annualFee' | 'annualFeeMonth'>>) => void;
  updateCard: (cardId: string, updates: Partial<EditableCardFields>) => void;
  updateBalance: (cardId: string, newBalance: number) => void;
  deleteCard: (cardId: string) => void;
  toggleCardActive: (cardId: string) => void;
  reorderCards: (orderedIds: string[]) => void;
  enforceActiveLimit: (limit: number) => void;
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
          isActive: true,
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
      toggleCardActive: (cardId) => {
        set((state) => ({
          cards: state.cards.map((c) =>
            c.id === cardId ? { ...c, isActive: !c.isActive } : c,
          ),
        }));
      },
      reorderCards: (orderedIds) => {
        set((state) => {
          const cardMap = new Map(state.cards.map((c) => [c.id, c]));
          const reordered = orderedIds
            .map((id) => cardMap.get(id))
            .filter((c): c is Card => c !== undefined);
          // Append any cards not in the ordered list (safety net)
          const remaining = state.cards.filter((c) => !orderedIds.includes(c.id));
          return { cards: [...reordered, ...remaining] };
        });
      },
      enforceActiveLimit: (limit) => {
        set((state) => {
          let activeCount = 0;
          const cards = state.cards.map((c) => {
            if (c.isActive) {
              activeCount++;
              if (activeCount > limit) return { ...c, isActive: false };
            }
            return c;
          });
          return { cards };
        });
      },
    }),
    {
      name: 'falcly-cards',
      storage: createJSONStorage(() => AsyncStorage),
      version: 2,
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as CardStore;
        if (version < 1) {
          state.cards = state.cards.map((c) => ({
            ...c,
            pendingTransactions: c.pendingTransactions ?? 0,
            installmentsMonthlyAmount: c.installmentsMonthlyAmount ?? 0,
            subscriptionsThisCycle: c.subscriptionsThisCycle ?? 0,
            annualFee: c.annualFee ?? 0,
            annualFeeMonth: c.annualFeeMonth ?? 0,
          }));
        }
        if (version < 2) {
          state.cards = state.cards.map((c) => ({
            ...c,
            isActive: (c as Card).isActive ?? true,
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
