import { useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { trackPageView } from '../lib/analytics';
import { useAuth } from './use-auth';

/**
 * Hook to track page views in the application
 * Uses both custom analytics and Google Analytics
 */
export const useAnalytics = () => {
  const [location] = useLocation();
  const prevLocationRef = useRef<string>(location);
  const { user } = useAuth();
  
  useEffect(() => {
    // Only track when the location changes
    if (location !== prevLocationRef.current) {
      // Track with user ID if available
      trackPageView(location, user?.id);
      prevLocationRef.current = location;
    }
  }, [location, user]);
};