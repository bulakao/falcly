import { Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { Badge } from './Badge';

interface TierBadgeProps {
  style?: object;
}

export function TierBadge({ style }: TierBadgeProps) {
  const router = useRouter();
  const tier = useSubscriptionStore((s) => s.tier);

  return (
    <Pressable
      onPress={() => router.push('/paywall-manual' as any)}
      accessibilityRole="button"
      accessibilityLabel={`${tier === 'pro' ? 'PRO' : 'FREE'} membership`}
      style={style}
    >
      <Badge label={tier === 'pro' ? 'PRO' : 'FREE'} variant={tier === 'pro' ? 'pro' : 'outline'} />
    </Pressable>
  );
}
