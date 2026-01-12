import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { trackPageView } from '@/lib/analytics';
import { useAuth } from '@/hooks/use-auth';

/**
 * Hook to track page views in the application
 * Uses both custom analytics and Google Analytics
 */
export const useAnalytics = () => {
  const pathname = usePathname();
  const prevLocationRef = useRef<string | null>(pathname);
  const { currentUser: user } = useAuth();

  useEffect(() => {
    // Only track when the location changes
    if (pathname && pathname !== prevLocationRef.current) {
      // Track with user ID if available
      trackPageView(pathname, user?.id);
      prevLocationRef.current = pathname;
    }
  }, [pathname, user]);
};