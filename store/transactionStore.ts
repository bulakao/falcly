import { create } from 'zustand';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { transactions as txTable } from '@/db/schema/local';
import type { CycleLabel } from '@/utils/cycleUtils';

export type TransactionType = 'purchase' | 'payment' | 'refund' | 'fee' | 'installment_amortization';

export interface Transaction {
  id: string;
  cardId: string;
  amount: number;
  type: TransactionType;
  merchant: string;
  date: number; // timestamp
  cycleLabel: CycleLabel;
  statementMonth: string; // "YYYY-MM"
  isManual: boolean;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

function rowToTransaction(row: typeof txTable.$inferSelect): Transaction {
  return {
    id: row.id,
    cardId: row.cardId,
    amount: row.amount,
    type: row.type as TransactionType,
    merchant: row.merchant,
    date: row.date.getTime(),
    cycleLabel: row.cycleLabel as CycleLabel,
    statementMonth: row.statementMonth,
    isManual: row.isManual,
    notes: row.notes ?? undefined,
    createdAt: row.createdAt.getTime(),
    updatedAt: row.updatedAt.getTime(),
  };
}

interface TransactionStore {
  transactions: Transaction[];
  _nextId: number;
  _initialized: boolean;
  loadTransactions: () => void;
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  excludeTransaction: (id: string) => void;
  includeTransaction: (id: string, cycleLabel: CycleLabel) => void;
  getByCard: (cardId: string) => Transaction[];
  getCurrentCycle: (cardId: string, statementDay: number) => Transaction[];
  reset: () => void;
}

export const useTransactionStore = create<TransactionStore>()((set, get) => ({
  transactions: [],
  _nextId: 1,
  _initialized: false,

  loadTransactions: () => {
    try {
      const rows = db.select().from(txTable).all();
      const transactions = rows.map(rowToTransaction).sort((a, b) => b.date - a.date);
      const maxId = transactions.reduce((max, t) => {
        const num = parseInt(t.id.replace('tx_', ''), 10) || 0;
        return Math.max(max, num);
      }, 0);
      set({ transactions, _nextId: maxId + 1, _initialized: true });
    } catch {
      set({ _initialized: true });
    }
  },

  addTransaction: (txData) => {
    const now = Date.now();
    const id = `tx_${get()._nextId}`;
    const tx: Transaction = {
      ...txData,
      id,
      createdAt: now,
      updatedAt: now,
    };

    db.insert(txTable).values({
      id: tx.id,
      cardId: tx.cardId,
      amount: tx.amount,
      type: tx.type,
      merchant: tx.merchant,
      date: new Date(tx.date),
      cycleLabel: tx.cycleLabel,
      statementMonth: tx.statementMonth,
      isManual: tx.isManual,
      notes: tx.notes ?? null,
      createdAt: new Date(now),
      updatedAt: new Date(now),
    }).run();

    set((state) => ({
      transactions: [tx, ...state.transactions],
      _nextId: state._nextId + 1,
    }));
  },

  updateTransaction: (id, updates) => {
    const now = Date.now();
    const dbUpdates: Record<string, unknown> = { ...updates, updatedAt: new Date(now) };
    if ('date' in updates && typeof updates.date === 'number') {
      dbUpdates.date = new Date(updates.date);
    }
    if ('createdAt' in updates) delete dbUpdates.createdAt;
    db.update(txTable).set(dbUpdates).where(eq(txTable.id, id)).run();

    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === id ? { ...t, ...updates, updatedAt: now } : t,
      ),
    }));
  },

  deleteTransaction: (id) => {
    db.delete(txTable).where(eq(txTable.id, id)).run();
    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id),
    }));
  },

  excludeTransaction: (id) => {
    const now = Date.now();
    db.update(txTable)
      .set({ cycleLabel: 'excluded', updatedAt: new Date(now) })
      .where(eq(txTable.id, id))
      .run();

    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === id ? { ...t, cycleLabel: 'excluded' as CycleLabel, updatedAt: now } : t,
      ),
    }));
  },

  includeTransaction: (id, cycleLabel) => {
    const now = Date.now();
    db.update(txTable)
      .set({ cycleLabel, updatedAt: new Date(now) })
      .where(eq(txTable.id, id))
      .run();

    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === id ? { ...t, cycleLabel, updatedAt: now } : t,
      ),
    }));
  },

  getByCard: (cardId) => {
    return get().transactions.filter((t) => t.cardId === cardId);
  },

  getCurrentCycle: (cardId, _statementDay) => {
    return get().transactions.filter(
      (t) => t.cardId === cardId && t.cycleLabel === 'current',
    );
  },

  reset: () => {
    db.delete(txTable).run();
    set({ transactions: [], _nextId: 1 });
  },
}));
