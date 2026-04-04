import { create } from 'zustand';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { cards as cardsTable } from '@/db/schema/local';
import { Card } from '@/types/card';
import {
  scheduleAllReminders,
  cancelCardNotifications,
  checkHighUtilization,
} from '@/utils/notifications';

type EditableCardFields = Omit<Card, 'id' | 'balanceUpdatedAt' | 'createdAt' | 'isActive'>;

/** Re-schedule all card notifications using current user preferences. */
function rescheduleNotifications(cards: Card[]) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useUserStore } = require('@/store/userStore');
  const { notifyStatementReminder, notifyDueReminder } = useUserStore.getState();
  scheduleAllReminders(cards, { notifyStatementReminder, notifyDueReminder }).catch(() => {});
}

/** Check high-utilization alert using current user preference. */
function checkUtilAlert(cards: Card[]) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useUserStore } = require('@/store/userStore');
  const { notifyHighUtilization } = useUserStore.getState();
  checkHighUtilization(cards, notifyHighUtilization).catch(() => {});
}

// Map DB row to Card type
function rowToCard(row: typeof cardsTable.$inferSelect): Card {
  return {
    id: row.id,
    bankName: row.bankName,
    creditLimit: row.creditLimit,
    outstandingBalance: row.outstandingBalance,
    statementDay: row.statementDay,
    dueDayOffset: row.dueDayOffset,
    interestRate: row.interestRate,
    minPaymentPct: row.minPaymentPct,
    minPaymentFloor: row.minPaymentFloor,
    customFinancials: row.customFinancials,
    pendingTransactions: row.pendingTransactions,
    installmentsMonthlyAmount: row.installmentsMonthlyAmount,
    subscriptionsThisCycle: row.subscriptionsThisCycle,
    annualFee: row.annualFee,
    annualFeeMonth: row.annualFeeMonth,
    balanceUpdatedAt: row.balanceUpdatedAt.getTime(),
    currency: row.currency ?? undefined,
    isActive: row.isActive,
    createdAt: row.createdAt.getTime(),
  };
}

interface CardStore {
  cards: Card[];
  _nextId: number;
  _initialized: boolean;
  loadCards: () => void;
  addCard: (card: Omit<Card, 'id' | 'balanceUpdatedAt' | 'createdAt' | 'isActive' | 'customFinancials' | 'pendingTransactions' | 'installmentsMonthlyAmount' | 'subscriptionsThisCycle' | 'annualFee' | 'annualFeeMonth'> & Partial<Pick<Card, 'pendingTransactions' | 'installmentsMonthlyAmount' | 'subscriptionsThisCycle' | 'annualFee' | 'annualFeeMonth'>>) => void;
  applyDefaultsToCards: (updates: Partial<Pick<Card, 'interestRate' | 'minPaymentPct' | 'minPaymentFloor'>>) => void;
  updateCard: (cardId: string, updates: Partial<EditableCardFields>) => void;
  updateBalance: (cardId: string, newBalance: number) => void;
  deleteCard: (cardId: string) => void;
  toggleCardActive: (cardId: string) => void;
  reorderCards: (orderedIds: string[]) => void;
  enforceActiveLimit: (limit: number) => void;
  reset: () => void;
}

export const useCardStore = create<CardStore>()((set, get) => ({
  cards: [],
  _nextId: 1,
  _initialized: false,

  loadCards: () => {
    try {
      const rows = db.select().from(cardsTable).all();
      const cards = rows.map(rowToCard).sort((a, b) => {
        const aRow = rows.find((r) => r.id === a.id);
        const bRow = rows.find((r) => r.id === b.id);
        return (aRow?.sortOrder ?? 0) - (bRow?.sortOrder ?? 0);
      });
      const maxId = cards.reduce((max, c) => Math.max(max, parseInt(c.id, 10) || 0), 0);
      set({ cards, _nextId: maxId + 1, _initialized: true });
    } catch {
      // DB not ready yet (migrations haven't run)
      set({ _initialized: true });
    }
  },

  addCard: (cardData) => {
    const now = Date.now();
    const id = String(get()._nextId);
    const card: Card = {
      pendingTransactions: 0,
      installmentsMonthlyAmount: 0,
      subscriptionsThisCycle: 0,
      annualFee: 0,
      annualFeeMonth: 0,
      ...cardData,
      id,
      balanceUpdatedAt: now,
      createdAt: now,
      isActive: true,
      customFinancials: false,
    };

    db.insert(cardsTable).values({
      id: card.id,
      bankName: card.bankName,
      creditLimit: card.creditLimit,
      outstandingBalance: card.outstandingBalance,
      statementDay: card.statementDay,
      dueDayOffset: card.dueDayOffset,
      interestRate: card.interestRate,
      minPaymentPct: card.minPaymentPct,
      minPaymentFloor: card.minPaymentFloor,
      customFinancials: false,
      pendingTransactions: card.pendingTransactions,
      installmentsMonthlyAmount: card.installmentsMonthlyAmount,
      subscriptionsThisCycle: card.subscriptionsThisCycle,
      annualFee: card.annualFee,
      annualFeeMonth: card.annualFeeMonth,
      currency: card.currency ?? null,
      balanceUpdatedAt: new Date(now),
      isActive: true,
      sortOrder: get().cards.length,
      createdAt: new Date(now),
      updatedAt: new Date(now),
    }).run();

    set((state) => ({
      cards: [...state.cards, card],
      _nextId: state._nextId + 1,
    }));

    rescheduleNotifications(get().cards);
  },

  updateCard: (cardId, updates) => {
    const dbUpdates: Record<string, unknown> = { ...updates, updatedAt: new Date() };
    if ('balanceUpdatedAt' in updates && typeof updates.balanceUpdatedAt === 'number') {
      dbUpdates.balanceUpdatedAt = new Date(updates.balanceUpdatedAt);
    }
    db.update(cardsTable).set(dbUpdates).where(eq(cardsTable.id, cardId)).run();

    set((state) => ({
      cards: state.cards.map((c) =>
        c.id === cardId ? { ...c, ...updates } : c,
      ),
    }));

    rescheduleNotifications(get().cards);
  },

  updateBalance: (cardId, newBalance) => {
    const now = Date.now();
    db.update(cardsTable)
      .set({ outstandingBalance: newBalance, balanceUpdatedAt: new Date(now), updatedAt: new Date(now) })
      .where(eq(cardsTable.id, cardId))
      .run();

    set((state) => ({
      cards: state.cards.map((c) =>
        c.id === cardId
          ? { ...c, outstandingBalance: newBalance, balanceUpdatedAt: now }
          : c,
      ),
    }));

    checkUtilAlert(get().cards);
  },

  deleteCard: (cardId) => {
    db.delete(cardsTable).where(eq(cardsTable.id, cardId)).run();
    cancelCardNotifications(cardId).catch(() => {});
    set((state) => ({
      cards: state.cards.filter((c) => c.id !== cardId),
    }));

    rescheduleNotifications(get().cards);
  },

  toggleCardActive: (cardId) => {
    const card = get().cards.find((c) => c.id === cardId);
    if (!card) return;
    db.update(cardsTable)
      .set({ isActive: !card.isActive, updatedAt: new Date() })
      .where(eq(cardsTable.id, cardId))
      .run();

    set((state) => ({
      cards: state.cards.map((c) =>
        c.id === cardId ? { ...c, isActive: !c.isActive } : c,
      ),
    }));
  },

  reorderCards: (orderedIds) => {
    orderedIds.forEach((id, index) => {
      db.update(cardsTable).set({ sortOrder: index, updatedAt: new Date() }).where(eq(cardsTable.id, id)).run();
    });

    set((state) => {
      const cardMap = new Map(state.cards.map((c) => [c.id, c]));
      const reordered = orderedIds
        .map((id) => cardMap.get(id))
        .filter((c): c is Card => c !== undefined);
      const remaining = state.cards.filter((c) => !orderedIds.includes(c.id));
      return { cards: [...reordered, ...remaining] };
    });
  },

  reset: () => {
    db.delete(cardsTable).run();
    set({ cards: [], _nextId: 1 });
  },

  applyDefaultsToCards: (updates) => {
    // Update all cards that haven't been customized
    db.update(cardsTable)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(cardsTable.customFinancials, false))
      .run();

    set((state) => ({
      cards: state.cards.map((c) =>
        c.customFinancials ? c : { ...c, ...updates },
      ),
    }));
  },

  enforceActiveLimit: (limit) => {
    const { cards } = get();
    let activeCount = 0;
    cards.forEach((c) => {
      if (c.isActive) {
        activeCount++;
        if (activeCount > limit) {
          db.update(cardsTable)
            .set({ isActive: false, updatedAt: new Date() })
            .where(eq(cardsTable.id, c.id))
            .run();
        }
      }
    });

    set((state) => {
      let count = 0;
      return {
        cards: state.cards.map((c) => {
          if (c.isActive) {
            count++;
            if (count > limit) return { ...c, isActive: false };
          }
          return c;
        }),
      };
    });
  },
}));

