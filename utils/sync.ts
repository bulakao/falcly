import { supabase } from '@/utils/supabase';
import type { Card } from '@/types/card';

export interface SyncResult {
  action: 'uploaded' | 'restored' | 'merge_needed' | 'noop';
  cloudCards?: Card[];
}

/** Upsert a single card to the cloud user_cards table. */
export async function uploadCard(userId: string, card: Card): Promise<void> {
  const { error } = await supabase
    .from('user_cards')
    .upsert(
      {
        id: card.id,
        user_id: userId,
        data: card,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    );
  if (error) throw error;
}

/** Fetch all non-deleted cards for a user from the cloud. */
export async function fetchCloudCards(userId: string): Promise<Card[]> {
  const { data, error } = await supabase
    .from('user_cards')
    .select('data')
    .eq('user_id', userId)
    .is('deleted_at', null);
  if (error) throw error;
  return (data ?? []).map((row) => row.data as Card);
}

/** Soft-delete a card in the cloud by setting deleted_at. */
export async function softDeleteCloudCard(userId: string, cardId: string): Promise<void> {
  const { error } = await supabase
    .from('user_cards')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', cardId)
    .eq('user_id', userId);
  if (error) throw error;
}

/**
 * Determine what sync action to take on sign-in.
 *
 * - cloud empty + local has cards → upload all → 'uploaded'
 * - local empty + cloud has cards → return cloud cards → 'restored'
 * - both have cards → 'merge_needed' with cloudCards
 * - both empty → 'noop'
 */
export async function syncOnSignIn(
  userId: string,
  localCards: Card[],
): Promise<SyncResult> {
  const cloudCards = await fetchCloudCards(userId);

  const hasLocal = localCards.length > 0;
  const hasCloud = cloudCards.length > 0;

  if (!hasLocal && !hasCloud) {
    return { action: 'noop' };
  }

  if (hasLocal && !hasCloud) {
    await Promise.all(localCards.map((card) => uploadCard(userId, card)));
    return { action: 'uploaded' };
  }

  if (!hasLocal && hasCloud) {
    return { action: 'restored', cloudCards };
  }

  return { action: 'merge_needed', cloudCards };
}

/**
 * Full sync: re-run syncOnSignIn logic, used for manual sync from Settings.
 * Returns the SyncResult so the caller can handle it.
 */
export async function fullSync(
  userId: string,
  localCards: Card[],
): Promise<SyncResult> {
  return syncOnSignIn(userId, localCards);
}
