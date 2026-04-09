import { sqliteTable, text, real, integer, index } from 'drizzle-orm/sqlite-core';

export const cards = sqliteTable('cards', {
  id: text('id').primaryKey(),
  bankName: text('bank_name').notNull(),
  creditLimit: real('credit_limit').notNull(),
  outstandingBalance: real('outstanding_balance').notNull().default(0),
  statementDay: integer('statement_day').notNull(),
  dueDayOffset: integer('due_day_offset').notNull().default(21),
  interestRate: real('interest_rate').notNull().default(0.02),
  minPaymentPct: real('min_payment_pct').notNull().default(0.05),
  minPaymentFloor: real('min_payment_floor').notNull().default(500),
  customFinancials: integer('custom_financials', { mode: 'boolean' }).notNull().default(false),
  pendingTransactions: real('pending_transactions').notNull().default(0),
  installmentsMonthlyAmount: real('installments_monthly_amount').notNull().default(0),
  subscriptionsThisCycle: real('subscriptions_this_cycle').notNull().default(0),
  annualFee: real('annual_fee').notNull().default(0),
  annualFeeMonth: integer('annual_fee_month').notNull().default(0),
  currency: text('currency'),
  balanceUpdatedAt: integer('balance_updated_at', { mode: 'timestamp_ms' }).notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});

export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey(),
  cardId: text('card_id').notNull(),
  amount: real('amount').notNull(),
  type: text('type').notNull().default('purchase'), // purchase | payment | refund | fee | installment_amortization
  merchant: text('merchant').notNull().default(''),
  date: integer('date', { mode: 'timestamp_ms' }).notNull(),
  cycleLabel: text('cycle_label').notNull().default('current'), // previous | current | next | excluded
  statementMonth: text('statement_month').notNull(), // YYYY-MM
  isManual: integer('is_manual', { mode: 'boolean' }).notNull().default(true),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
}, (table) => [
  index('idx_transactions_card_id').on(table.cardId),
  index('idx_transactions_card_statement').on(table.cardId, table.statementMonth),
]);

export const installments = sqliteTable('installments', {
  id: text('id').primaryKey(),
  cardId: text('card_id').notNull(),
  name: text('name').notNull(),
  merchant: text('merchant').notNull().default(''),
  totalAmount: real('total_amount').notNull(),
  monthlyAmount: real('monthly_amount').notNull(),
  totalMonths: integer('total_months').notNull(),
  startDate: integer('start_date', { mode: 'timestamp_ms' }).notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
}, (table) => [
  index('idx_installments_card_id').on(table.cardId),
]);

export const subscriptionItems = sqliteTable('subscription_items', {
  id: text('id').primaryKey(),
  cardId: text('card_id').notNull(),
  name: text('name').notNull(),
  amount: real('amount').notNull(),
  billingDay: integer('billing_day').notNull(),
  frequency: text('frequency').notNull().default('monthly'), // monthly | quarterly | annual
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
}, (table) => [
  index('idx_subscription_items_card_id').on(table.cardId),
]);

export const profile = sqliteTable('profile', {
  id: text('id').primaryKey().default('local'),
  cashOnHand: real('cash_on_hand'),
  cashUpdatedAt: integer('cash_updated_at', { mode: 'timestamp_ms' }),
  monthlyIncome: real('monthly_income'),
  payday: integer('payday'),
  payday2: integer('payday2'),
  committedExpenses: real('committed_expenses'),
  analyticsOptOut: integer('analytics_opt_out', { mode: 'boolean' }).notNull().default(false),
  themePreference: text('theme_preference').notNull().default('system'), // system | light | dark
  // Notifications
  notifyStatementReminder: integer('notify_statement_reminder', { mode: 'boolean' }).notNull().default(true),
  notifyDueReminder: integer('notify_due_reminder', { mode: 'boolean' }).notNull().default(true),
  notifyHighUtilization: integer('notify_high_utilization', { mode: 'boolean' }).notNull().default(false),
  // Currency
  currencySymbol: text('currency_symbol').notNull().default('PHP'),
  // Defaults
  defaultInterestRate: real('default_interest_rate').notNull().default(0.02),
  defaultMinPaymentPct: real('default_min_payment_pct').notNull().default(0.05),
  defaultMinPaymentFloor: real('default_min_payment_floor').notNull().default(500),
  // Payoff strategy
  payoffStrategy: text('payoff_strategy').notNull().default('full'), // full | minimum | fixed | aggressive
  fixedPayoffAmount: real('fixed_payoff_amount'),
  // Avatar
  avatarEmoji: text('avatar_emoji'),
});
