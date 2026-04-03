import notifee, {
  TriggerType,
  RepeatFrequency,
  AndroidImportance,
  AuthorizationStatus,
} from '@notifee/react-native';
import { Platform } from 'react-native';
import type { Card } from '@/types/card';

const CHANNEL_STATEMENT = 'statement-reminders';
const CHANNEL_DUE = 'due-reminders';
const CHANNEL_UTILIZATION = 'utilization-alerts';

// Prefix notification IDs so we can cancel per-card
function statementNotifId(cardId: string) {
  return `statement-${cardId}`;
}
function dueNotifId(cardId: string) {
  return `due-${cardId}`;
}

/**
 * Request notification permission via notifee.
 * Returns true if authorized.
 */
export async function requestPermission(): Promise<boolean> {
  const settings = await notifee.requestPermission();
  return (
    settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
    settings.authorizationStatus === AuthorizationStatus.PROVISIONAL
  );
}

/**
 * Create Android notification channels (no-op on iOS).
 */
export async function createChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;

  await notifee.createChannel({
    id: CHANNEL_STATEMENT,
    name: 'Statement Reminders',
    importance: AndroidImportance.HIGH,
  });

  await notifee.createChannel({
    id: CHANNEL_DUE,
    name: 'Due Date Reminders',
    importance: AndroidImportance.HIGH,
  });

  await notifee.createChannel({
    id: CHANNEL_UTILIZATION,
    name: 'High Utilization Alerts',
    importance: AndroidImportance.HIGH,
  });
}

/**
 * Compute the next occurrence of a given day-of-month that is `daysBefore` days
 * before that day and still in the future.
 */
function nextReminderDate(dayOfMonth: number, daysBefore: number): Date {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  // Try this month first, then next month
  for (let offset = 0; offset <= 1; offset++) {
    const targetMonth = month + offset;
    // Clamp day to actual days in month
    const daysInMonth = new Date(year, targetMonth + 1, 0).getDate();
    const clampedDay = Math.min(dayOfMonth, daysInMonth);
    const target = new Date(year, targetMonth, clampedDay, 9, 0, 0); // 9 AM
    const reminder = new Date(target.getTime() - daysBefore * 24 * 60 * 60 * 1000);

    if (reminder.getTime() > now.getTime()) {
      return reminder;
    }
  }

  // Fallback: two months out
  const targetMonth = month + 2;
  const daysInMonth = new Date(year, targetMonth + 1, 0).getDate();
  const clampedDay = Math.min(dayOfMonth, daysInMonth);
  const target = new Date(year, targetMonth, clampedDay, 9, 0, 0);
  return new Date(target.getTime() - daysBefore * 24 * 60 * 60 * 1000);
}

/**
 * Schedule a statement reminder for a card — fires 3 days before statementDay each month.
 */
export async function scheduleStatementReminder(card: Card): Promise<void> {
  const triggerDate = nextReminderDate(card.statementDay, 3);

  await notifee.createTriggerNotification(
    {
      id: statementNotifId(card.id),
      title: 'Statement closing soon',
      body: `Your ${card.bankName} statement closes in 3 days`,
      android: {
        channelId: CHANNEL_STATEMENT,
        importance: AndroidImportance.HIGH,
        smallIcon: 'ic_launcher',
      },
    },
    {
      type: TriggerType.TIMESTAMP,
      timestamp: triggerDate.getTime(),
      repeatFrequency: RepeatFrequency.NONE,
    },
  );
}

/**
 * Schedule a due date reminder for a card — fires 3 days before due date each month.
 * Due date = statementDay + dueDayOffset.
 */
export async function scheduleDueReminder(card: Card): Promise<void> {
  const dueDay = ((card.statementDay + card.dueDayOffset - 1) % 31) + 1;
  const minPayment = Math.max(
    card.outstandingBalance * card.minPaymentPct,
    card.minPaymentFloor,
  );
  const triggerDate = nextReminderDate(dueDay, 3);

  await notifee.createTriggerNotification(
    {
      id: dueNotifId(card.id),
      title: 'Payment due soon',
      body: `Your ${card.bankName} payment is due in 3 days. Minimum: ₱${Math.round(minPayment).toLocaleString()}`,
      android: {
        channelId: CHANNEL_DUE,
        importance: AndroidImportance.HIGH,
        smallIcon: 'ic_launcher',
      },
    },
    {
      type: TriggerType.TIMESTAMP,
      timestamp: triggerDate.getTime(),
      repeatFrequency: RepeatFrequency.NONE,
    },
  );
}

/**
 * Cancel all pending notifications for a specific card.
 */
export async function cancelCardNotifications(cardId: string): Promise<void> {
  await notifee.cancelNotification(statementNotifId(cardId)).catch(() => {});
  await notifee.cancelNotification(dueNotifId(cardId)).catch(() => {});
}

/**
 * Schedule all reminders for all cards, respecting user settings toggles.
 */
export async function scheduleAllReminders(
  cards: Card[],
  settings: {
    notifyStatementReminder: boolean;
    notifyDueReminder: boolean;
  },
): Promise<void> {
  // Cancel all existing trigger notifications first
  await notifee.cancelAllNotifications();

  await createChannels();

  const activeCards = cards.filter((c) => c.isActive);

  for (const card of activeCards) {
    if (settings.notifyStatementReminder) {
      await scheduleStatementReminder(card);
    }
    if (settings.notifyDueReminder) {
      await scheduleDueReminder(card);
    }
  }
}

/**
 * Check if any card exceeds 80% utilization and fire an immediate notification.
 * Only fires if notifyHighUtilization setting is enabled.
 */
export async function checkHighUtilization(
  cards: Card[],
  notifyHighUtilization: boolean,
): Promise<void> {
  if (!notifyHighUtilization) return;

  const highUtil = cards.filter(
    (c) => c.isActive && c.creditLimit > 0 && c.outstandingBalance / c.creditLimit > 0.8,
  );

  if (highUtil.length === 0) return;

  await createChannels();

  for (const card of highUtil) {
    const pct = Math.round((card.outstandingBalance / card.creditLimit) * 100);
    await notifee.displayNotification({
      id: `high-util-${card.id}`,
      title: 'High credit utilization',
      body: `${card.bankName} is at ${pct}% of your credit limit`,
      android: {
        channelId: CHANNEL_UTILIZATION,
        importance: AndroidImportance.HIGH,
        smallIcon: 'ic_launcher',
      },
    });
  }
}
