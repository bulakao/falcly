import { create } from 'zustand';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { subscriptionItems as subsTable } from '@/db/schema/local';
import type { SubscriptionItem } from '@/types/subscription-item';
import { syncCardAggregates } from '@/utils/aggregateSync';

function rowToSubscriptionItem(row: typeof subsTable.$inferSelect): SubscriptionItem {
  return {
    id: row.id,
    cardId: row.cardId,
    name: row.name,
    amount: row.amount,
    billingDay: row.billingDay,
    frequency: row.frequency as SubscriptionItem['frequency'],
    isActive: row.isActive,
    createdAt: row.createdAt.getTime(),
    updatedAt: row.updatedAt.getTime(),
  };
}

interface SubscriptionItemStore {
  subscriptions: SubscriptionItem[];
  _nextId: number;
  _initialized: boolean;
  loadSubscriptions: () => void;
  addSubscription: (data: Omit<SubscriptionItem, 'id' | 'isActive' | 'createdAt' | 'updatedAt'>) => void;
  updateSubscription: (id: string, updates: Partial<Omit<SubscriptionItem, 'id' | 'createdAt'>>) => void;
  deleteSubscription: (id: string) => void;
  getActiveByCard: (cardId: string) => SubscriptionItem[];
  getCycleAmountForCard: (cardId: string, statementDay: number) => number;
  reset: () => void;
}

export const useSubscriptionItemStore = create<SubscriptionItemStore>()((set, get) => ({
  subscriptions: [],
  _nextId: 1,
  _initialized: false,

  loadSubscriptions: () => {
    try {
      const rows = db.select().from(subsTable).all();
      const subscriptions = rows.map(rowToSubscriptionItem);
      const maxId = subscriptions.reduce((max, s) => Math.max(max, parseInt(s.id, 10) || 0), 0);
      set({ subscriptions, _nextId: maxId + 1, _initialized: true });
    } catch {
      set({ _initialized: true });
    }
  },

  addSubscription: (data) => {
    const now = Date.now();
    const id = String(get()._nextId);
    const sub: SubscriptionItem = {
      ...data,
      id,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    db.insert(subsTable).values({
      id: sub.id,
      cardId: sub.cardId,
      name: sub.name,
      amount: sub.amount,
      billingDay: sub.billingDay,
      frequency: sub.frequency,
      isActive: true,
      createdAt: new Date(now),
      updatedAt: new Date(now),
    }).run();

    set((state) => ({
      subscriptions: [...state.subscriptions, sub],
      _nextId: state._nextId + 1,
    }));

    syncCardAggregates(data.cardId);
  },

  updateSubscription: (id, updates) => {
    const dbUpdates: Record<string, unknown> = { ...updates, updatedAt: new Date() };
    db.update(subsTable).set(dbUpdates).where(eq(subsTable.id, id)).run();

    const existing = get().subscriptions.find((s) => s.id === id);
    set((state) => ({
      subscriptions: state.subscriptions.map((s) =>
        s.id === id ? { ...s, ...updates, updatedAt: Date.now() } : s,
      ),
    }));

    if (existing) syncCardAggregates(existing.cardId);
  },

  deleteSubscription: (id) => {
    const existing = get().subscriptions.find((s) => s.id === id);
    db.delete(subsTable).where(eq(subsTable.id, id)).run();
    set((state) => ({
      subscriptions: state.subscriptions.filter((s) => s.id !== id),
    }));

    if (existing) syncCardAggregates(existing.cardId);
  },

  getActiveByCard: (cardId) => {
    return get().subscriptions.filter((s) => s.cardId === cardId && s.isActive);
  },

  getCycleAmountForCard: (cardId, statementDay) => {
    // Sum monthly subscriptions that bill within the current cycle
    // For quarterly/annual, include only if billing month matches
    const today = new Date();
    const currentMonth = today.getMonth() + 1;

    return get().getActiveByCard(cardId).reduce((sum, s) => {
      if (s.frequency === 'monthly') return sum + s.amount;
      if (s.frequency === 'quarterly' && currentMonth % 3 === s.billingDay % 3) return sum + s.amount;
      if (s.frequency === 'annual') return sum; // annual fees handled separately
      return sum;
    }, 0);
  },

  reset: () => {
    db.delete(subsTable).run();
    set({ subscriptions: [], _nextId: 1 });
  },
}));
