import { useEffect, useRef } from 'react';
import { usePathname } from 'expo-router';
import { logger } from '../index';

export function useNavigationLogger(): void {
  const pathname = usePathname();
  const prevPath = useRef<string | null>(null);

  useEffect(() => {
    if (prevPath.current !== null && prevPath.current !== pathname) {
      logger.info('Navigation', `${prevPath.current} → ${pathname}`, {
        from: prevPath.current,
        to: pathname,
      });
    }
    prevPath.current = pathname;
    logger.setContext({ screen: pathname });
  }, [pathname]);
}
