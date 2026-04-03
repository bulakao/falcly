import { create } from 'zustand';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { installments as installmentsTable } from '@/db/schema/local';
import type { Installment } from '@/types/installment';
import { syncCardAggregates } from '@/utils/aggregateSync';

function rowToInstallment(row: typeof installmentsTable.$inferSelect): Installment {
  return {
    id: row.id,
    cardId: row.cardId,
    name: row.name,
    merchant: row.merchant,
    totalAmount: row.totalAmount,
    monthlyAmount: row.monthlyAmount,
    totalMonths: row.totalMonths,
    startDate: row.startDate.getTime(),
    isActive: row.isActive,
    createdAt: row.createdAt.getTime(),
    updatedAt: row.updatedAt.getTime(),
  };
}

interface InstallmentStore {
  installments: Installment[];
  _nextId: number;
  _initialized: boolean;
  loadInstallments: () => void;
  addInstallment: (data: Omit<Installment, 'id' | 'isActive' | 'createdAt' | 'updatedAt'>) => void;
  updateInstallment: (id: string, updates: Partial<Omit<Installment, 'id' | 'createdAt'>>) => void;
  deleteInstallment: (id: string) => void;
  getActiveByCard: (cardId: string) => Installment[];
  getMonthlyTotalForCard: (cardId: string) => number;
  getMonthsRemaining: (installment: Installment) => number;
  reset: () => void;
}

export const useInstallmentStore = create<InstallmentStore>()((set, get) => ({
  installments: [],
  _nextId: 1,
  _initialized: false,

  loadInstallments: () => {
    try {
      const rows = db.select().from(installmentsTable).all();
      const installments = rows.map(rowToInstallment);
      const maxId = installments.reduce((max, i) => Math.max(max, parseInt(i.id, 10) || 0), 0);
      set({ installments, _nextId: maxId + 1, _initialized: true });
    } catch {
      set({ _initialized: true });
    }
  },

  addInstallment: (data) => {
    const now = Date.now();
    const id = String(get()._nextId);
    const installment: Installment = {
      ...data,
      id,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    db.insert(installmentsTable).values({
      id: installment.id,
      cardId: installment.cardId,
      name: installment.name,
      merchant: installment.merchant,
      totalAmount: installment.totalAmount,
      monthlyAmount: installment.monthlyAmount,
      totalMonths: installment.totalMonths,
      startDate: new Date(installment.startDate),
      isActive: true,
      createdAt: new Date(now),
      updatedAt: new Date(now),
    }).run();

    set((state) => ({
      installments: [...state.installments, installment],
      _nextId: state._nextId + 1,
    }));

    syncCardAggregates(data.cardId);
  },

  updateInstallment: (id, updates) => {
    const dbUpdates: Record<string, unknown> = { ...updates, updatedAt: new Date() };
    if ('startDate' in updates && typeof updates.startDate === 'number') {
      dbUpdates.startDate = new Date(updates.startDate);
    }
    db.update(installmentsTable).set(dbUpdates).where(eq(installmentsTable.id, id)).run();

    const existing = get().installments.find((i) => i.id === id);
    set((state) => ({
      installments: state.installments.map((i) =>
        i.id === id ? { ...i, ...updates, updatedAt: Date.now() } : i,
      ),
    }));

    if (existing) syncCardAggregates(existing.cardId);
  },

  deleteInstallment: (id) => {
    const existing = get().installments.find((i) => i.id === id);
    db.delete(installmentsTable).where(eq(installmentsTable.id, id)).run();
    set((state) => ({
      installments: state.installments.filter((i) => i.id !== id),
    }));

    if (existing) syncCardAggregates(existing.cardId);
  },

  getActiveByCard: (cardId) => {
    return get().installments.filter((i) => i.cardId === cardId && i.isActive);
  },

  getMonthlyTotalForCard: (cardId) => {
    return get().getActiveByCard(cardId).reduce((sum, i) => sum + i.monthlyAmount, 0);
  },

  getMonthsRemaining: (installment) => {
    const elapsed = Math.floor((Date.now() - installment.startDate) / (30 * 24 * 60 * 60 * 1000));
    return Math.max(0, installment.totalMonths - elapsed);
  },

  reset: () => {
    db.delete(installmentsTable).run();
    set({ installments: [], _nextId: 1 });
  },
}));
