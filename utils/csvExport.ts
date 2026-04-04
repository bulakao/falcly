import { File, Paths } from 'expo-file-system/next';
import { shareAsync } from 'expo-sharing';
import { Card } from '@/types/card';
import { formatAmount } from '@/utils/currency';
import { useUserStore } from '@/store/userStore';

interface UserProfile {
  cashOnHand: number | null;
  monthlyIncome: number | null;
  payday: number | null;
  committedExpenses: number | null;
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function getGlobalCurrency(): string {
  return useUserStore.getState().globalCurrency;
}

function formatCurrency(amount: number | null, currency?: string): string {
  if (amount === null) return '';
  return formatAmount(amount, currency ?? getGlobalCurrency());
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

function buildCardsCSV(cards: Card[]): string {
  const headers = [
    'Card Name',
    'Credit Limit',
    'Outstanding Balance',
    'Statement Day',
    'Due Day Offset',
    'Interest Rate',
    'Min Payment %',
    'Min Payment Floor',
    'Pending Transactions',
    'Installments Monthly',
    'Subscriptions This Cycle',
    'Annual Fee',
    'Annual Fee Month',
    'Balance Updated',
    'Created',
  ];

  const rows = cards.map((card) => {
    const cc = card.currency ?? getGlobalCurrency();
    return [
    escapeCSV(card.bankName),
    formatCurrency(card.creditLimit, cc),
    formatCurrency(card.outstandingBalance, cc),
    String(card.statementDay),
    String(card.dueDayOffset),
    formatPercent(card.interestRate),
    formatPercent(card.minPaymentPct),
    formatCurrency(card.minPaymentFloor, cc),
    formatCurrency(card.pendingTransactions, cc),
    formatCurrency(card.installmentsMonthlyAmount, cc),
    formatCurrency(card.subscriptionsThisCycle, cc),
    formatCurrency(card.annualFee, cc),
    card.annualFeeMonth > 0 ? String(card.annualFeeMonth) : '',
    formatDate(card.balanceUpdatedAt),
    formatDate(card.createdAt),
  ];
  });

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

function buildUserProfileCSV(profile: UserProfile): string {
  const headers = ['Field', 'Value'];
  const rows = [
    ['Funds Available', formatCurrency(profile.cashOnHand)],
    ['Monthly Income', formatCurrency(profile.monthlyIncome)],
    ['Payday', profile.payday !== null ? `Day ${profile.payday}` : ''],
    ['Fixed Expenses', formatCurrency(profile.committedExpenses)],
  ];

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export async function exportDataAsCSV(
  cards: Card[],
  profile: UserProfile,
): Promise<void> {
  const cardsSection = buildCardsCSV(cards);
  const profileSection = buildUserProfileCSV(profile);

  const csv = [
    '# Falcly Data Export',
    `# Exported: ${new Date().toLocaleDateString('en-PH')}`,
    '',
    '## Cards',
    cardsSection,
    '',
    '## User Profile',
    profileSection,
  ].join('\n');

  const fileName = `falcly-export-${new Date().toISOString().slice(0, 10)}.csv`;
  const file = new File(Paths.cache, fileName);
  file.create();
  file.write(csv);

  await shareAsync(file.uri, {
    mimeType: 'text/csv',
    dialogTitle: 'Export Falcly Data',
    UTI: 'public.comma-separated-values-text',
  });
}
